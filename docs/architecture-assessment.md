# Architecture Assessment & Baseline Inspection

**Product:** Digital Building-Material Marketplace & Delivery Platform — Nagpur | MVP  
**Date:** September 2026  
**Inspection Target:** Project Workspace (`c:\Users\Levovo\Desktop\business`)  

---

## 1. Existing Stack & Environment Inspection

- **Operating System:** Windows (PowerShell shell environment)
- **Node.js Runtime:** v24.12.0
- **Package Manager:** npm v11.6.2
- **Python Runtime:** Python 3.12.3 (used for document inspection/verification)
- **Version Control:** Git initialized (`git version 2.55.0.windows.3`)
- **Existing Files in Repository:**
  - `Building_Material_Marketplace_PRD.docx` (Authoritative Product Requirements Document)
  - `Building_Material_Marketplace_BRD.docx` (Authoritative Business Requirements Document)
  - No pre-existing application code, frontend components, database tables, or backend routes existed prior to this inspection.

---

## 2. Existing Structure

The repository was completely empty of code, containing solely the two authoritative Word specification documents. No legacy baggage or outdated technical decisions exist.

---

## 3. What Can Be Reused

- **Authoritative Specifications:** The PRD and BRD provide comprehensive domain details:
  - 4 MVP Materials: Sand, Bricks, Black Stone / Aggregate, Murum
  - Customer Workflow: Quote request -> Operations contact -> Quotation -> Confirmation -> Supplier/Truck assignment -> Delivery -> Payment/Closing
  - Role definitions: Customer (public, unauthenticated), Admin/Operations, Super Admin
  - Clear MVP boundaries: No customer login, no supplier portal, no driver app, no automated dynamic pricing, no live GPS
  - Lifecycle: `NEW`, `CONTACTED`, `QUOTATION_SENT`, `CONFIRMED`, `SUPPLIER_ASSIGNED`, `TRUCK_ASSIGNED`, `LOADING`, `OUT_FOR_DELIVERY`, `DELIVERED`, `COMPLETED`, `CANCELLED`

---

## 4. What Was Missing (To Be Built in Phase 0)

1. **Clean Monolithic Monorepo Structure:** Separation of Backend (API, Services, Repositories) and Frontend (Public Customer & Admin Operations).
2. **Backend API Layer:** Express + TypeScript REST API with versioned routes (`/api/v1/`), dependency injection/separation of concerns (Route -> Controller -> Service -> Repository -> Database).
3. **Database Layer:** Production-ready relational schema, migration management, seeding strategy (seed initial admin & 4 MVP materials), and audit logging.
4. **Authentication & Authorization:** Secure bcrypt password hashing, JWT/session handling, role-based access control (`ADMIN`, `SUPER_ADMIN`), protected admin route middleware.
5. **Configuration & Secrets:** Environment-based `.env` with validation and safe `.env.example`.
6. **Cross-Cutting Concerns:** Centralized error handling, standardized JSON responses, request validation (Zod), structured logging (Winston/Pino), audit trail recording.
7. **Health & Readiness Checks:** `/health` and `/health/readiness` endpoints.
8. **Frontend Application:** React + TypeScript + Vite + Tailwind CSS with distinct Customer layout/routes and Admin operations layout/routes, mobile-first responsive design, accessible forms, and SEO metadata.
9. **Testing Infrastructure:** Automated testing framework (Jest/Vitest/Supertest) testing health, auth, validation, role authorization, and error handling.
10. **Comprehensive Documentation:** Architecture, Database, API, Security, Backup/Recovery, and Traceability matrix.

---

## 5. Recommended Phase 0 Architecture

We select a **Modular Monolith** built with TypeScript across backend and frontend:

- **Backend:** Node.js (TypeScript) + Express.js
  - Clear architectural layering:
    - `routes/` (HTTP route binding)
    - `controllers/` (Request/response coordination)
    - `services/` (Business rules & operational logic)
    - `repositories/` (Data access & query isolation)
    - `models/` / `schemas/` (Domain types & Zod validation)
    - `middlewares/` (Auth, error handling, rate limiting, logging)
  - Database: Relational database with SQLite for zero-friction local development and automated CI/testing, with clean abstraction allowing seamless switch to PostgreSQL in production.
  - Migrations: SQL/versioned schema migrations + programmatic seed script.
- **Frontend:** React 18+ (TypeScript) + Vite + Tailwind CSS + Lucide Icons
  - Customer Area: Mobile-first responsive views for Home, Products, Product Detail, Get Quote / Order, How It Works, About, Contact, Privacy, Terms.
  - Admin Area: Protected operations portal for Dashboard, Orders, Customers, Suppliers, Trucks/Drivers, Quotations, Payments, Reports, Settings.
- **Design System:** Construction-material palette (slate, amber, stone, emerald), accessible touch targets, high readability on mobile devices.

---

## 6. Important Risks & Mitigations

1. **Risk of Over-Engineering:** Building microservices, driver apps, or live GPS prematurely.  
   *Mitigation:* Strict adherence to `PRODUCT_SCOPE.md` guardrail.
2. **Risk of Automating Pricing Too Early:** Attempting algorithmic pricing when supplier costs fluctuate.  
   *Mitigation:* Enforce manual quotation-first workflow in data model and API.
3. **Risk of Leaking Customer Data:** Contact info exposed to public endpoints or logged in plaintext.  
   *Mitigation:* Public endpoints only receive requests; customer lists and order details require authenticated Admin role; logs sanitize PII.
4. **Risk of Production Credential Leaks:** Storing secrets in Git.  
   *Mitigation:* Comprehensive `.gitignore`, strict `.env.example` with placeholders, zero hardcoded secrets.
