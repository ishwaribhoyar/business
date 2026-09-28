# Digital Building-Material Marketplace & Delivery Platform — Nagpur | MVP

[![Automated Tests](https://img.shields.io/badge/Automated%20Tests-65%2F65%20Passing-emerald)](backend/tests/)
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
- **Hierarchical Material Catalog (Phase 3):**
  `CATEGORY → SUBTYPE / VARIANT → SPECIFICATION → QUANTITY → QUOTE REQUEST`
  - **4 Core MVP Categories:** Sand, Bricks, Black Stone / Aggregate, Murum.
  - **11 Regional Civil Subtypes:** River Sand (Washed), M-Sand, Plaster Sand; Red Clay Bricks, Fly Ash Bricks; 10mm, 20mm, 40mm Aggregate, GSB Mix; Yellow Murum, Red Bharda Murum.
  - **Data-Driven Specification Schemas:** Technical civil properties (silt content, crushing value, brick class, strength grade, compaction type) dynamically configured per subtype.
  - **Historical Order Snapshots:** Frozen category name, variant name, and specifications preserved on orders so catalog modifications never alter past order records.
- **Quotation-First Pricing:** No automated or algorithmic market pricing in MVP. Indicative rates displayed in the catalog are purely non-binding baseline ex-quarry rates. Final delivered prices are calculated, confirmed, and communicated by the operations desk as frozen quotation snapshots.
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
*Executes all 65 automated tests across Phase 0 Foundation (13 tests), Phase 1 Customer Marketplace (13 tests), Phase 2 Admin Operations (23 tests), and Phase 3 Hierarchical Catalog (16 tests). Tests cover the hierarchical Category → Subtype → Specification → Quote flow, dynamic specification schema validation, minimum quantity enforcement, order historical snapshot immutability, indicative price isolation from quotation engine, 10-stage delivery lifecycle + CANCELLED terminal state, strict dispatch invariants, negative transition paths, quotation snapshot versioning, partner registries, fulfillment dispatch, offline payments, and live dashboard metrics.*

### 6. Start Development Servers
```bash
# Terminal 1: Backend API (Port 5000)
npm run dev:backend

# Terminal 2: Frontend Web App (Port 3000)
npm run dev:frontend
```
- Customer Web App: `http://localhost:3000`
- Category & Variant Catalog: `http://localhost:3000/products`
- Subtypes by Category: `http://localhost:3000/products/:categorySlug`
- Subtype Technical Detail: `http://localhost:3000/products/:categorySlug/:variantSlug`
- Order / Get Quote: `http://localhost:3000/get-quote` (alias: `/order`)
- Admin Operations Portal: `http://localhost:3000/admin/login`
- Admin Catalog Management: `http://localhost:3000/admin/catalog`
- Backend API Health: `http://localhost:5000/health`
- Backend API Root: `http://localhost:5000/api/v1`

---

## 6. Implementation Status & Acceptance

### Status Overview
- **Phase 0 Foundation:** ✅ **COMPLETE (with Phase 0.1 Domain Corrections)**
- **Phase 1 Customer Marketplace & Quote Request:** ✅ **COMPLETE (with Phase 1.1 Factual Cleanup)**
- **Phase 2 Admin Operations, Quotation Engine & Fulfillment:** ✅ **COMPLETE (with Phase 2.1 Operational Integrity Audit)**
- **Phase 3 Hierarchical Material Catalog & Variants:** ✅ **COMPLETE**
  - Hierarchical catalog architecture: `CATEGORY → SUBTYPE / VARIANT → SPECIFICATION → QUANTITY → QUOTE REQUEST`
  - 4 Core MVP Categories: Sand, Bricks, Black Stone / Aggregate, Murum
  - 11 Regional Civil Subtypes seeded with engineering-standard specification schemas
  - Dynamic specification rendering on customer quote request forms
  - Historical snapshots preserved on `orders` (`category_name_snapshot`, `variant_name_snapshot`, `specifications_snapshot`)
  - Indicative price isolation: catalog prices are strictly indicative benchmarks; delivered prices remain calculated via Phase 2 manual quotation engine
  - Backwards-compatible quote request handling for legacy flat material IDs
  - Admin catalog management portal (`/admin/catalog`) for managing categories, variants, indicative rates, min quantities, and dynamic specification schemas
  - Order management queues (`/admin/orders`, `/admin/orders/:id`) display variant snapshots, category tags, and specification breakdowns with category filtering
  - Clean production builds (`npm run build:backend` and `npm run build:frontend`) and 65/65 passing automated tests
- **Full MVP:** 🟢 **CORE DELIVERABLE COMPLETE & VERIFIED**

### Phase 3 Verification Checklist
- [x] 4 initial categories (`Sand`, `Bricks`, `Black Stone / Aggregate`, `Murum`) seeded and active
- [x] 11 regional civil subtypes seeded with dynamic specification schemas and standard billing units
- [x] Specification validation schema enforces required fields and allowed options
- [x] Real-time minimum order quantity and billing unit validation enforced
- [x] Orders store immutable historical snapshots (`category_name_snapshot`, `variant_name_snapshot`, `specifications_snapshot`)
- [x] Catalog price updates or subtype changes never alter existing historical order records
- [x] Indicative rates clearly disclaimed; Phase 2 manual quotation calculation ($Delivered = Material + Transport + Platform Fee - Discount$) preserved
- [x] Rich WhatsApp prefill URLs include reference, variant name, category, and key-value technical specifications
- [x] Customer browsing hierarchy implemented: `/products` → `/products/:categorySlug` → `/products/:categorySlug/:variantSlug` → `/get-quote`
- [x] Admin catalog management page (`/admin/catalog`) allows viewing, toggling active states, editing indicative rates, and updating schemas
- [x] Collision-resistant order reference generation prevents database unique constraint conflicts
- [x] 65/65 automated tests passing across all test suites
- [x] Zero regressions on Phase 0, Phase 1, or Phase 2 functionality
- [x] Out-of-scope boundaries strictly respected (no online payment gateways, no customer accounts, no driver apps, no live GPS tracking, no automated dynamic pricing)

