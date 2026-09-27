# Digital Building-Material Marketplace & Delivery Platform — Nagpur | MVP

[![Automated Tests](https://img.shields.io/badge/Automated%20Tests-26%2F26%20Passing-emerald)](backend/tests/)
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
*Executes all 26 automated tests across Phase 0 Foundation (13 tests) and Phase 1 Customer Marketplace (13 tests), verifying health, database readiness, auth, role authorization, validation, decoupled driver modeling, product catalog APIs, slug alias resolution, quote request lifecycle, idempotency protection, and PII masking.*

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
- **Phase 1 Customer Marketplace & Quote Request:** ✅ **COMPLETE & VERIFIED**
  - Customer public website (Home, Products, Product Detail with slug aliases, Get Quote / Order, How It Works, About, Contact, Privacy, Terms)
  - Production-grade mobile-first quotation request form (touch targets ≥ 44px, numeric keyboards, instant validation)
  - Dynamic product catalog integration with unit enforcement and min quantity rules
  - Order reference generation (`NGP-YYMMDD-XXXX`) and quotation confirmation screen
  - WhatsApp-assisted ordering with prefilled reference details (zero customer PII leakage)
  - Duplicate submission protection (frontend multi-click debounce + backend 60s idempotency)
  - Clean production build (`npm run build`) and 26/26 passing automated tests
- **Phase 2 Operations & Admin Quotation Engine:** ⏳ **PENDING NEXT PHASE PROMPT**
- **Full MVP:** ⏳ **IN PROGRESS**

### Phase 1 Verification Checklist
- [x] Initial 4 MVP materials strictly represented (Sand, Bricks, Black Stone Aggregate, Murum)
- [x] Quotation-first business model accurately communicated (Request → Review → Delivered Quote → Confirm → Delivery)
- [x] Customer routes live and responsive on mobile and desktop
- [x] Route aliases supported (`/order` → `/get-quote`, `/privacy` → `/privacy-policy`)
- [x] Backend product API with slug alias resolution (`black-stone`, `aggregate`)
- [x] Quote request endpoint (`POST /api/v1/orders/quote-request`) validated, idempotent, and audited
- [x] Customer created without requiring login credentials or password
- [x] WhatsApp direct links generated with reference ID and safe non-sensitive details
- [x] SEO dynamic document titles and meta descriptions active on all customer views
- [x] Public API security verified (customer and order lists protected by admin JWT auth)
- [x] 26/26 automated tests passing across backend test suites
- [x] Zero Phase 2+ features prematurely implemented (no online payment gateways, no customer accounts, no driver apps, no live GPS, no automated pricing engine)
