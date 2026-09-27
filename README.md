# Digital Building-Material Marketplace & Delivery Platform — Nagpur | MVP

[![Phase 0 Tests](https://img.shields.io/badge/Phase%200%20Tests-13%2F13%20Passing-emerald)](backend/tests/foundation.test.ts)
[![Architecture](https://img.shields.io/badge/Architecture-Modular%20Monolith-blue)](docs/architecture.md)
[![Location](https://img.shields.io/badge/Market-Nagpur%2C%20India-amber)](PRODUCT_SCOPE.md)

---

## 1. Product Identity & Authoritative Specifications

This repository contains the codebase and architectural foundation for the **Digital Building-Material Marketplace & Delivery Platform — Nagpur | MVP**.

The implementation is strictly governed by two authoritative source documents:
1. `Building_Material_Marketplace_PRD.docx` (Product Requirements Document)
2. `Building_Material_Marketplace_BRD.docx` (Business Requirements Document)

All developers and AI coding agents must read [PRODUCT_SCOPE.md](PRODUCT_SCOPE.md) before making architectural or feature modifications.

---

## 2. Core Business & Operating Model

- **Asset-Light Managed Marketplace:** The platform coordinates customers, verified material suppliers, and third-party trucks without owning material inventory or delivery fleets.
- **Service Area:** Nagpur and currently serviceable nearby areas.
- **Initial 4 MVP Materials:**
  1. **Sand** (Brass)
  2. **Bricks** (Pieces)
  3. **Black Stone / Aggregate** (Brass)
  4. **Murum** (Brass)
- **Quotation-First Pricing:** No automated or algorithmic market pricing in MVP. Prices are calculated, confirmed, and communicated by the operations desk as frozen quotation snapshots.
- **Human-Assisted Operations:** The MVP uses an internal Admin Operations portal. There are no separate supplier apps or driver apps in Version 1.

---

## 3. Technology Stack

- **Backend:** Node.js (v24 / v22), TypeScript, Express.js REST API (`/api/v1/`), Zod validation, Bcrypt, JWT, Helmet, CORS.
- **Database:** Relational SQLite via Node.js built-in `node:sqlite` (zero native C++ build requirements, fast, WAL mode enabled, full foreign key constraints). SQLite is the active, verified MVP engine; migration to PostgreSQL is an architectural option for future high-scale production deployment and will require explicit syntax and migration adaptations.
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router DOM (v6).
- **Testing:** Vitest + Supertest automated testing framework.

---

## 4. Repository Structure

```
├── Building_Material_Marketplace_BRD.docx   # Authoritative Business Requirements
├── Building_Material_Marketplace_PRD.docx   # Authoritative Product Requirements
├── PRODUCT_SCOPE.md                        # Architectural constraints and scope guardrails
├── README.md                               # Project documentation and runbook
├── .env.example                            # Safe environment template
├── .gitignore                              # Git exclusion rules
├── package.json                            # Root workspace scripts
├── docs/                                   # Architectural & operational documentation
│   ├── architecture.md                     # High-level architecture & layer boundaries
│   ├── architecture-assessment.md          # Baseline inspection assessment
│   ├── database.md                         # ER diagram and table specifications
│   ├── api.md                              # REST API endpoints & response envelopes
│   ├── authentication.md                   # Bcrypt, JWT, and role authorization
│   ├── development.md                      # Developer environment guide
│   ├── deployment.md                       # Production deployment runbook
│   ├── security.md                         # Security measures & PII sanitization
│   ├── backup-recovery.md                  # Hot backup strategy and DR runbook
│   ├── product-scope.md                    # MVP scope & Phase 2 backlog
│   └── phase-0-traceability.md             # Requirement traceability matrix
├── backend/                                # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/                         # Environment loading & validation
│   │   ├── controllers/                    # Route controllers
│   │   ├── services/                       # Business logic, notifications & audit
│   │   ├── repositories/                   # Data access layer (parameterized SQL)
│   │   ├── models/                         # Domain models & entities
│   │   ├── schemas/                        # Zod validation schemas
│   │   ├── routes/                         # Express route definitions (/api/v1)
│   │   ├── middlewares/                    # Auth, validation, logging, errors
│   │   ├── utils/                          # Logger, errors, response formatter
│   │   ├── db/                             # Schema, connection, migrations, seeds
│   │   ├── app.ts                          # Express application setup
│   │   └── server.ts                       # Server bootstrap & graceful shutdown
│   ├── tests/                              # Automated foundation tests (Vitest)
│   └── data/                               # Local SQLite database files
└── frontend/                               # React + TypeScript + Vite + Tailwind Frontend
    └── src/
        ├── customer/                       # Public customer pages (Home, Products, Quote)
        ├── admin/                          # Operations portal (Dashboard, Orders, etc.)
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
# Copy environment template
cp .env.example .env
# Windows PowerShell:
# Copy-Item .env.example .env
```

### 3. Install Dependencies
```bash
npm --prefix backend install
npm --prefix frontend install
```

### 4. Database Setup (Migrations & Seed)
```bash
npm run migrate
npm run seed
```
*Seeds initial Super Admin account (`admin@nagpurmaterials.local` / `AdminSecurePass123!`) and the 4 MVP materials.*

### 5. Run Automated Tests
```bash
npm test
```
*Executes all 13 Phase 0 foundation tests verifying health, database readiness, auth, role authorization, validation, decoupled driver modeling, and error formats.*

### 6. Start Development Servers
```bash
# Terminal 1: Backend API (Port 5000)
npm run dev:backend

# Terminal 2: Frontend Web App (Port 3000)
npm run dev:frontend
```
- Customer Web App: `http://localhost:3000`
- Operations Admin Portal: `http://localhost:3000/admin/login`
- Backend API Health: `http://localhost:5000/health`
- Backend API Root: `http://localhost:5000/api/v1`

---

## 6. Implementation Status & Acceptance

### Status Overview
- **Phase 0 Foundation:** ✅ **COMPLETE (with Phase 0.1 Architectural Corrections)**
- **Phase 1 Groundwork:** 🟡 **PARTIALLY IMPLEMENTED EARLY** (Customer public route skeletons and initial quote submission endpoint established as foundation groundwork; full business logic, quote calculation engine, payment processing, and WhatsApp delivery dispatch are strictly reserved for Phase 1)
- **Full MVP:** ⏳ **NOT COMPLETE** (Awaiting Phase 1 through Phase 4 prompts)

### Foundation Criteria Verification
- [x] Repository inspected before modification and baseline assessed
- [x] Frontend foundation and design system established
- [x] Customer routes (Home, Products, Detail, Get Quote, How It Works, About, Contact, Privacy, Terms) architected
- [x] Admin routes (Login, Dashboard, Orders, Customers, Suppliers, Trucks, Quotations, Payments, Reports, Settings) architected
- [x] Backend layered architecture (Routes -> Controllers -> Services -> Repositories -> Database) established
- [x] Relational database schema with 13 core tables created (including decoupled `drivers` table)
- [x] Migration and seed system implemented and verified
- [x] Bcrypt password hashing and JWT role-based authorization (`ADMIN`, `SUPER_ADMIN`) verified
- [x] Centralized error handling and Zod request validation active
- [x] Structured JSON logging with automatic PII and password redaction
- [x] Health (`/health`) and readiness (`/health/readiness`) endpoints working
- [x] Automated testing suite with 100% passing tests (13/13)
- [x] Decoupled driver and truck modeling implemented and verified
- [x] Comprehensive documentation (Architecture, Database, API, Auth, Deployment, Security, Backup, Traceability)
- [x] Architectural guardrails enforced (`PRODUCT_SCOPE.md`)
- [x] Zero Phase 2 features prematurely implemented
