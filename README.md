# Digital Building-Material Marketplace & Delivery Platform — Nagpur | MVP

[![Automated Tests](https://img.shields.io/badge/Automated%20Tests-84%2F84%20Passing-emerald)](backend/tests/)
[![Architecture](https://img.shields.io/badge/Architecture-Modular%20Monolith-blue)](docs/architecture.md)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%2016%20%7C%20Render-indigo)](docs/postgresql.md)
[![Location](https://img.shields.io/badge/Market-Nagpur%2C%20India-amber)](PRODUCT_SCOPE.md)

---

## 1. Product Identity & Authoritative Specifications

This repository contains the codebase and production architecture for the **Digital Building-Material Marketplace & Delivery Platform — Nagpur | MVP**.

The implementation is strictly governed by two authoritative source documents:
1. `Building_Material_Marketplace_PRD.docx` (Product Requirements Document)
2. `Building_Material_Marketplace_BRD.docx` (Business Requirements Document)

All developers and AI coding agents must read [PRODUCT_SCOPE.md](PRODUCT_SCOPE.md) before making architectural or feature modifications.

---

## 2. Core Business & Operating Model

- **Asset-Light Managed Marketplace:** The platform coordinates customers, verified material suppliers, and third-party trucks without owning material inventory or delivery fleets.
- **Service Area:** Nagpur and currently serviceable nearby areas.
- **Hierarchical Material Catalog (Phase 3):**
  `CATEGORY → SUBTYPE / VARIANT → SPECIFICATION → QUANTITY → QUOTE REQUEST`
  - **4 Core MVP Categories:** Sand, Bricks, Black Stone / Aggregate, Murum.
  - **11 Regional Civil Subtypes:** River Sand (Washed), M-Sand, Plaster Sand; Red Clay Bricks, Fly Ash Bricks; 10mm, 20mm, 40mm Aggregate, GSB Mix; Yellow Murum, Red Bharda Murum.
  - **Data-Driven Specification Schemas:** Technical civil properties (silt content, crushing value, brick class, strength grade, compaction type) dynamically configured per subtype.
  - **Historical Order Snapshots:** Frozen category name, variant name, and specifications preserved on orders so catalog modifications never alter past order records.
- **Quotation-First Pricing:** No automated or algorithmic market pricing in MVP. Indicative rates displayed in the catalog are purely non-binding baseline ex-quarry rates. Final delivered prices are calculated, confirmed, and communicated by the operations desk as frozen quotation snapshots.
- **Human-Assisted Operations:** The MVP uses an internal Admin Operations portal. There are no separate supplier apps or driver apps in Version 1.
- **Multi-User Operations & RBAC (Phase 4):** Multiple internal administrative users (`ADMIN` and `SUPER_ADMIN`) operate concurrently with isolated browser sessions, role authorization, and audit log actor attribution.

---

## 3. Technology Stack

- **Backend:** Node.js (v22 / v24), TypeScript, Express.js REST API (`/api/v1/`), Zod validation, Bcrypt, JWT, Helmet, CORS, Express-Rate-Limit.
- **Database (Production):** PostgreSQL 16 (Render Managed Database) with connection pooling (`pg.Pool`), exact `NUMERIC(12,2)` monetary types, `TIMESTAMPTZ`, `JSONB`, `BOOLEAN`, strict foreign keys with `ON DELETE RESTRICT`, performance indexes, and transactional versioned migrations (`schema_migrations`).
- **Database (Local Development / Isolated Tests):** SQLite with WAL mode via `node:sqlite`. Production strictly rejects SQLite and enforces PostgreSQL.
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router DOM (v6).
- **Deployment:** Render Cloud Platform via `render.yaml` Infrastructure-as-Code (Backend Web Service, Frontend Static Site, Managed PostgreSQL).
- **Testing:** Vitest + Supertest automated testing framework (84/84 passing tests).

---

## 4. Repository Structure

```
├── Building_Material_Marketplace_BRD.docx   # Authoritative Business Requirements
├── Building_Material_Marketplace_PRD.docx   # Authoritative Product Requirements
├── PRODUCT_SCOPE.md                        # Architectural constraints and scope guardrails
├── README.md                               # Project documentation and runbook
├── render.yaml                             # Render Infrastructure-as-Code blueprint
├── .env.example                            # Safe environment template
├── .gitignore                              # Git exclusion rules
├── package.json                            # Root workspace scripts
├── docs/                                   # Architectural & operational documentation
│   ├── architecture.md                     # High-level architecture & layer boundaries
│   ├── deployment.md                       # Render production deployment runbook
│   ├── postgresql.md                       # PostgreSQL technical specification & schema
│   ├── migration.md                        # SQLite -> PostgreSQL data migration guide
│   ├── backup-recovery.md                  # PostgreSQL backup strategy and disaster recovery
│   ├── phase-4-traceability.md             # Complete Phase 4 verification matrix
│   ├── database.md                         # ER diagram and table specifications
│   ├── api.md                              # REST API endpoints & response envelopes
│   ├── authentication.md                   # Bcrypt, JWT, and role authorization
│   └── security.md                         # Security measures & PII sanitization
├── backend/                                # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/                         # Environment loading, CORS & validation
│   │   ├── controllers/                    # Route controllers (Admin, Order, Catalog, Health)
│   │   ├── services/                       # Business logic, quotation, fulfillment, audit
│   │   ├── repositories/                   # Data access layer (parameterized SQL)
│   │   ├── models/                         # Domain models & entities
│   │   ├── schemas/                        # Zod validation schemas
│   │   ├── routes/                         # Express route definitions (/api/v1)
│   │   ├── middlewares/                    # Auth, RBAC, validation, rate-limiting, logging, errors
│   │   ├── utils/                          # Logger, errors, response formatter
│   │   ├── db/                             # PG pool, PG schema, PG migrations, SQLite fallback
│   │   │   ├── migrations/pg/              # Versioned PostgreSQL migrations (001, 002)
│   │   │   ├── pgPool.ts                   # PostgreSQL connection pool with transaction helper
│   │   │   ├── pgSchema.sql                # Production PostgreSQL DDL schema
│   │   │   ├── pgMigrate.ts                # PostgreSQL migration runner
│   │   │   └── migrateSqliteToPg.ts        # SQLite -> PostgreSQL data migration script
│   │   ├── scripts/                        # Admin bootstrapping CLI
│   │   ├── app.ts                          # Express application setup
│   │   └── server.ts                       # Server bootstrap, PG check & graceful shutdown
│   ├── tests/                              # Automated tests (84 passing tests)
│   └── data/                               # Local SQLite database files
└── frontend/                               # React + TypeScript + Vite + Tailwind Frontend
    └── src/
        ├── customer/                       # Public customer pages (Home, Products, Quote)
        ├── admin/                          # Operations portal (Dashboard, Orders, Catalog, etc.)
        ├── components/                     # Reusable design system UI components
        ├── layouts/                        # CustomerLayout & AdminLayout
        ├── services/                       # API clients & auth services
        ├── hooks/                          # Custom React hooks
        ├── utils/                          # Formatting & helpers
        ├── types/                          # Shared TypeScript interfaces
        ├── config/                         # App configuration constants
        ├── App.tsx                         # Client-side router
        └── main.tsx                        # Entry point
```

---

## 5. Quickstart Guide

### 1. Prerequisites
- Node.js v22 or v24
- npm v10+

### 2. Environment Setup
```bash
cp .env.example .env
```

### 3. Install Dependencies
```bash
npm --prefix backend install
npm --prefix frontend install
```

### 4. Database Setup & Migrations
```bash
# For local SQLite development:
npm run migrate
npm run seed

# For PostgreSQL (Production / Staging):
npm run migrate:pg
npm run bootstrap:admin
```

### 5. Data Migration (SQLite to PostgreSQL)
To migrate existing SQLite data into PostgreSQL with four-way integrity verification:
```bash
npm run migrate:data
```

### 6. Run Automated Tests
```bash
npm test
```
*Executes all 84 automated tests across Foundation (13 tests), Customer Marketplace (13 tests), Admin Operations (23 tests), Hierarchical Catalog (16 tests), and Phase 4 Production/PostgreSQL/RBAC (19 tests).*

### 7. Start Development Servers
```bash
# Terminal 1: Backend API (Port 5000)
npm run dev:backend

# Terminal 2: Frontend Web App (Port 3000)
npm run dev:frontend
```
- Customer Web App: `http://localhost:3000`
- Category & Variant Catalog: `http://localhost:3000/products`
- Subtype Technical Detail: `http://localhost:3000/products/:categorySlug/:variantSlug`
- Order / Get Quote: `http://localhost:3000/get-quote`
- Admin Operations Portal: `http://localhost:3000/admin/login`
- Admin Catalog Management: `http://localhost:3000/admin/catalog`
- Backend Liveness Probe: `http://localhost:5000/health`
- Backend Readiness Probe: `http://localhost:5000/ready`

---

## 6. Implementation Status & Acceptance

### Status Overview
- **Phase 0 Foundation:** ✅ **COMPLETE (with Phase 0.1 Domain Corrections)**
- **Phase 1 Customer Marketplace & Quote Request:** ✅ **COMPLETE (with Phase 1.1 Factual Cleanup)**
- **Phase 2 Admin Operations, Quotation Engine & Fulfillment:** ✅ **COMPLETE (with Phase 2.1 Operational Integrity Audit)**
- **Phase 3 Hierarchical Material Catalog & Variants:** ✅ **COMPLETE**
- **Phase 4 PostgreSQL Migration, Multi-User RBAC & Render Deployment:** ✅ **COMPLETE**
  - PostgreSQL 16 primary production database with connection pooling (`pg.Pool`)
  - Strict production enforcement: server crashes fast on startup if SQLite is configured in production
  - Exact `NUMERIC(12,2)` representation for all financial fields (no floating-point money)
  - Versioned PostgreSQL migrations tracked in `schema_migrations`
  - Automated SQLite $\to$ PostgreSQL data migration tool with 4-way verification
  - Multi-user administrative operations with independent JWT sessions and RBAC (`ADMIN` vs `SUPER_ADMIN`)
  - Server-side role authorization and administrative user management (`/api/v1/admin/users`)
  - Production security hardening: CORS origin restrictions, rate limiting, Helmet, sanitized errors
  - Render Infrastructure-as-Code blueprint (`render.yaml`) with health (`/health`) and readiness (`/ready`) probes
  - 84/84 automated tests passing across 5 suites; clean backend and frontend production builds
- **Full Production MVP:** 🟢 **READY FOR RENDER DEPLOYMENT**
