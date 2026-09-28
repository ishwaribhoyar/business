# Render Production Deployment & Operations Runbook

**Product:** Digital Building-Material Marketplace & Delivery Platform — Nagpur | MVP  
**Phase:** Phase 4 — PostgreSQL Migration, Multi-User Production Architecture & Render Deployment Readiness  
**Target Platform:** Render Cloud Platform (Render Web Services & Render Managed PostgreSQL)

---

## 1. Production Architecture Overview

> [!NOTE]
> **Deployment Status:** This repository provides the complete, production-ready Render Infrastructure-as-Code blueprint (`render.yaml`), PostgreSQL migration engine, health probes (`/health`, `/ready`), and multi-user RBAC security. Live deployment requires provisioning via a Render account with a managed PostgreSQL 16 database. All configurations and build outputs have been verified via 89 automated tests and clean production builds (`tsc` and `vite build`).

The platform is designed for high-availability, modular monolith deployment on Render:

```
[ Customer / Admin Browser ]
         │ (HTTPS / TLS 1.3)
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Render Edge Network (Automated SSL Termination & DDoS Prot) │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼ (Port 443)                    ▼ (Port 443)
┌───────────────────────────────┐ ┌───────────────────────────┐
│ Render Static Web Service     │ │ Render Backend Web Service│
│ (React 19 SPA / Vite)         │ │ (Node.js 22+ / Express)   │
│ URL: https://...onrender.com  │ │ Host: 0.0.0.0 | Port: $PORT│
│ Health: Client-side routing   │ │ Health: /health & /ready  │
└───────────────────────────────┘ └─────────────┬─────────────┘
                                                │ (Pooled TCP / SSL)
                                                ▼
                                  ┌───────────────────────────┐
                                  │ Render Managed PostgreSQL │
                                  │ Version: 16 (Standard)    │
                                  │ Exact NUMERIC(12,2) Money │
                                  │ Schema: schema_migrations │
                                  └───────────────────────────┘
```

---

## 2. Infrastructure as Code: `render.yaml`

The deployment is managed reproducibly via `render.yaml` at the project root:

- **Backend Service:**
  - Type: Web Service (`node`)
  - Build Command: `npm install && npm run build`
  - Pre-Deploy Command: `npm run migrate:pg && npm run bootstrap:admin`
  - Start Command: `npm run start`
  - Health Check Path: `/health`
- **Frontend Service:**
  - Type: Static Site
  - Build Command: `npm install && npm run build`
  - Publish Directory: `./dist`
  - SPA Rewrite Rule: `/*` -> `/index.html`
- **PostgreSQL Database:**
  - Managed Instance: `marketplace_db`
  - Version: PostgreSQL 16
  - Connection Pool: 20 concurrent connections with SSL enabled

---

## 3. Environment Variables Reference

### Backend Web Service

| Variable Name | Production Value / Description | Sensitive? |
|---|---|---|
| `NODE_ENV` | `production` | No |
| `PORT` | Dynamic `$PORT` (assigned by Render, defaults to 10000) | No |
| `HOST` | `0.0.0.0` (required for Render ingress routing) | No |
| `DATABASE_URL` | Auto-populated by Render from `render-postgres` connection string | Yes |
| `JWT_SECRET` | Auto-generated cryptographically secure 64+ char secret | Yes |
| `JWT_EXPIRES_IN` | `7d` | No |
| `CORS_ORIGINS` | Comma-separated list of approved frontend domains | No |
| `CLIENT_URL` | Primary production domain for links / resets | No |
| `INITIAL_ADMIN_EMAIL`| Super Admin email address (e.g. `admin@nagpurmaterials.local`) | No |
| `INITIAL_ADMIN_PASSWORD` | Strong Super Admin password (min 12 chars) | Yes |
| `LOG_LEVEL` | `info` or `warn` | No |
| `PG_POOL_MAX` | `20` (max connection pool size) | No |
| `PG_CONN_TIMEOUT_MS` | `5000` (5-second connection timeout) | No |

### Frontend Web Service

| Variable Name | Production Value / Description | Sensitive? |
|---|---|---|
| `VITE_API_BASE_URL` | `https://<backend-service-name>.onrender.com/api/v1` | No (Public) |
| `VITE_OPERATIONS_PHONE` | Business operational contact phone (`+917120000000`) | No |
| `VITE_OPERATIONS_WHATSAPP` | Business WhatsApp ordering dispatch line (`+919876543210`) | No |
| `VITE_SUPPORT_EMAIL` | Business customer support email (`support@nagpurmaterials.local`) | No |

> [!CAUTION]
> Never place `DATABASE_URL`, `JWT_SECRET`, or administrative passwords in `VITE_*` variables. Frontend environment variables are compiled into static JS assets and are publicly readable.

---

## 4. Deployment Procedures

### Step 1: Pre-Deploy Database Migration
The Render build pipeline automatically executes `preDeployCommand`:
```bash
npm run migrate:pg && npm run bootstrap:admin
```
This runs `backend/src/db/pgMigrate.ts` inside a PostgreSQL transaction and verifies that all schema updates are applied before starting the HTTP server.

### Step 2: Starting the Backend Service
The application binds to `0.0.0.0:$PORT`:
```bash
npm run start
```
On startup:
1. Validates `DATABASE_URL` is a valid PostgreSQL connection string. Throws fatal error if SQLite is detected in production.
2. Checks database readiness via connection probe.
3. Bootstraps the initial `SUPER_ADMIN` user if not already present.

### Step 3: Health and Readiness Verification
- **Liveness Probe:** `GET /health` returns `200 OK` with JSON `{ status: 'UP', service: 'nagpur-materials-marketplace-api' }`.
- **Readiness Probe:** `GET /ready` (or `GET /health/readiness`) executes a live `SELECT 1` probe against the PostgreSQL pool and returns `200 OK` with `{ status: 'READY', database: 'CONNECTED', engine: 'POSTGRESQL' }`.

---

## 5. Multi-User Administration Runbook

- **Initial Login:** Authenticate using `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD`.
- **Adding Staff Accounts:** The Super Admin navigates to `/admin/users` or calls `POST /api/v1/admin/users` to provision new `ADMIN` accounts for operations staff.
- **Account Deactivation:** If staff leaves or changes role, Super Admin updates status via `PATCH /api/v1/admin/users/:id/status`.
- **Safety Invariants:**
  - Self-deactivation is blocked server-side.
  - The system prevents deactivating the sole active Super Admin.
  - Bootstrapping is concurrency-safe and idempotent (`ON CONFLICT (email) DO NOTHING`). Subsequent runs will never overwrite existing passwords or credentials.
- **Post-Bootstrap Security:** After provisioning the initial Super Admin, `INITIAL_ADMIN_PASSWORD` should be rotated or removed from Render environment variables.

---

## 6. Rollback & Disaster Recovery Procedures

1. **Immediate Code Rollback:**
   In Render Dashboard: Select **Deploys** $\to$ Locate last known healthy commit $\to$ Click **Rollback to this deploy**.
2. **Database Rollback:**
   If a migration needs to be rolled back, execute the corresponding down-migration script or restore from the latest automated Render point-in-time recovery snapshot.
3. **Data Ownership:**
   In strict accordance with PRD Section 18 and BRD Section 15, all Render team accounts, domain registrations, and WhatsApp channels must remain under direct ownership of the business entity.
