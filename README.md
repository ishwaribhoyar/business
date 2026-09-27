# Digital Building-Material Marketplace & Delivery Platform — Nagpur | MVP

[![Automated Tests](https://img.shields.io/badge/Automated%20Tests-49%2F49%20Passing-emerald)](backend/tests/)
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
*Executes all 49 automated tests across Phase 0 Foundation (13 tests), Phase 1 Customer Marketplace (13 tests), and Phase 2 & 2.1 Admin Operations & Quotation Engine (23 tests). Tests cover the 10-stage primary delivery lifecycle + CANCELLED terminal state, transition invariants (strictly requiring supplier, truck, and driver for dispatch), negative transition paths, quotation snapshot versioning and deterministic math, partner registry management, fulfillment dispatch, master data mutation historical immutability, offline payment recording, overpayment guards, order search, multi-filter pagination, and live dashboard metrics.*

### 6. Start Development Servers
```bash
# Terminal 1: Backend API (Port 5000)
npm run dev:backend

# Terminal 2: Frontend Web App (Port 3000)
npm run dev:frontend
```
- Customer Web App: `http://localhost:3000`
- Order / Get Quote: `http://localhost:3000/get-quote` (alias: `/order`)
- Materials Catalog: `http://localhost:3000/products`
- Operations Admin Portal: `http://localhost:3000/admin/login`
- Backend API Health: `http://localhost:5000/health`
- Backend API Root: `http://localhost:5000/api/v1`

---

## 6. Implementation Status & Acceptance

### Status Overview
- **Phase 0 Foundation:** ✅ **COMPLETE (with Phase 0.1 Domain Corrections)**
- **Phase 1 Customer Marketplace & Quote Request:** ✅ **COMPLETE (with Phase 1.1 Factual Cleanup)**
- **Phase 2 Admin Operations, Quotation Engine & Fulfillment:** ✅ **COMPLETE (with Phase 2.1 Operational Integrity Audit)**
  - 10-stage primary delivery lifecycle + CANCELLED terminal state with mandatory cancellation reason
  - Strict dispatch invariants enforced (both `LOADING` and `OUT_FOR_DELIVERY` strictly require supplier, truck, and driver)
  - Deterministic manual quotation engine with immutable snapshots, revision versioning (`v1`, `v2`), and real gross margin calculation
  - Third-party partner registries (Suppliers, Partner Fleet Trucks, Decoupled Drivers)
  - Atomic fulfillment dispatch with independent driver persistence and default-driver auto-assignment as an operational convenience
  - Historical master data immutability (mutating trucks, default drivers, or supplier rates never alters existing orders or past quotes)
  - Offline payment recording (`Cash`, `UPI`, `Bank Transfer`, `Cheque`) with automatic status derivation and clean default overpayment rejection
  - Operational internal notes (`order_notes`) with staff author tracking
  - Live operational metrics dashboard featuring **Quoted Revenue** (Total Customer Value of confirmed orders; zero mock data; zero invoice confusion)
  - Order search, status/payment filtering, and pagination
  - Clean production build (`npm run build`) and 49/49 passing automated tests
- **Full MVP:** 🟢 **CORE DELIVERABLE COMPLETE & VERIFIED**

### Phase 2 & 2.1 Verification Checklist
- [x] Primary delivery lifecycle (10 stages) + CANCELLED terminal state implemented with strict transition guards
- [x] State transition invariants enforced (requires quotation for `QUOTATION_SENT`/`CONFIRMED`, strictly requires supplier + truck + driver for `LOADING`/`OUT_FOR_DELIVERY`, requires reason for `CANCELLED`)
- [x] Negative transition paths explicitly verified (`NEW` → `DELIVERED` ❌, `NEW` → `COMPLETED` ❌, `COMPLETED` → `NEW` ❌, `DELIVERED` → `CONFIRMED` ❌)
- [x] Quotation calculation is deterministic (`base_cost = material + transport + loading`; `final_price = base + fee - discount`; `margin = final - base`)
- [x] Quotation revisions increment version number (`v1`, `v2`) and preserve historical snapshots
- [x] Internal quotation validity date is optional and defaulted gracefully
- [x] Partner suppliers, trucks, and decoupled drivers independently managed
- [x] Atomic fulfillment dispatch with driver assignment; historical immutability verified against future truck driver changes
- [x] Offline payments recorded with automatic status derivation (`Pending`, `Partially Paid`, `Paid`, `Refunded`)
- [x] Overpayment rejected by default without undefined override backdoors
- [x] Operational internal notes recorded with author attribution and timestamps
- [x] Admin dashboard displays live calculated operational metrics; revenue labeled **Quoted Revenue**
- [x] Orders management screen supports text search, multi-status filters, and pagination
- [x] Order detail page functions as central operational cockpit
- [x] 49/49 automated tests passing across backend test suites
- [x] Out-of-scope boundaries strictly respected (no online payment gateways, no customer accounts, no driver apps, no live GPS tracking, no automated dynamic pricing)

