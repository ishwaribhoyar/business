# Architecture Documentation

**Product:** Digital Building-Material Marketplace & Delivery Platform — Nagpur | MVP  
**Version:** Phase 0 Baseline (with qualified Phase 1 groundwork implemented early)  
**Authoritative Documents:** `Building_Material_Marketplace_PRD.docx`, `Building_Material_Marketplace_BRD.docx`

---

## 1. Architectural Philosophy

The architecture of this platform directly mirrors the core product principles outlined in the PRD:

1. **Mobile-first & Simple:** Optimized for mobile browser responsiveness (Android and iOS) and low-latency rendering on standard Indian cellular networks.
2. **Quotation-First:** Eliminates the commercial risk of automated algorithmic pricing for volatile commodities like sand and gravel. All prices are calculated, frozen, and confirmed via snapshot quotations.
3. **Human-Assisted Operations:** Operates with an internal Admin Operations dashboard coordinating third-party suppliers and independent truckers without requiring dedicated mobile apps in Version 1.
4. **End-to-End Traceability:** Every status transition, quote snapshot, and operational action is recorded in immutable audit logs.
5. **Asset-Light Managed Marketplace:** The business does not own physical inventory or delivery fleets; it orchestrates the marketplace flow.
6. **Extensible Monolith:** Built as a clean, modular monolith with distinct separation between customer-facing public routes and protected operations routes.

---

## 2. High-Level System Architecture

```
                    CUSTOMER
                       │
                       ▼
              RESPONSIVE WEBSITE (React + Vite + Tailwind)
                       │
                       ▼
                    API LAYER (Express.js REST /api/v1)
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
      ORDERS       QUOTATIONS     CUSTOMERS
         │             │
         ├─────────────┼──────────────┬──────────────┐
         │             │              │              │
         ▼             ▼              ▼              ▼
     SUPPLIERS      TRUCKS         DRIVERS        PAYMENTS
         │             │              │              │
         └─────────────┼──────────────┴──────────────┘
                       ▼
                    DATABASE (SQLite for MVP)
                       │
                       ▼
                 ADMIN DASHBOARD (Protected Operations Area)
```

---

## 3. Layered Backend Design

To guarantee maintainability and avoid business logic leaking into presentation code, the backend enforces strict layered boundaries:

```
HTTP Request
     │
     ▼
[routes/]          --> Maps endpoints to controllers, binds validation and auth middlewares
     │
     ▼
[middlewares/]     --> Validates input (Zod), verifies JWT, checks RBAC, sanitizes logs
     │
     ▼
[controllers/]     --> Parses request params, calls services, sends structured JSON envelopes
     │
     ▼
[services/]        --> Houses business rules, notifications, quotation math, audit trail
     │
     ▼
[repositories/]    --> Isolates SQL statements and parameter bindings from business rules
     │
     ▼
[db/connection]    --> Manages SQLite connection with foreign keys and WAL mode enabled
```

---

## 4. Frontend Architecture

The frontend application provides two distinct operational domains within a single, cohesive codebase:

1. **Customer Public Area (`/customer`):**
   - Publicly accessible without authentication.
   - Routes: Home (`/`), Materials Catalog (`/products`), Detail (`/products/:slug`), Quote Request Form (`/get-quote`), How It Works (`/how-it-works`), About (`/about`), Contact (`/contact`), Privacy (`/privacy-policy`), Terms (`/terms`).
   - Persistent WhatsApp CTAs and click-to-call links.
   - Clean, industrial visual design with accessible contrast and touch-friendly controls.

2. **Operations & Admin Area (`/admin`):**
   - Protected by `ProtectedRoute` route guards.
   - Routes: Dashboard (`/admin`), Orders (`/admin/orders`), Customers (`/admin/customers`), Suppliers (`/admin/suppliers`), Trucks / Drivers (`/admin/trucks`), Quotations (`/admin/quotations`), Payments (`/admin/payments`), Reports (`/admin/reports`), Settings (`/admin/settings`).
   - Role-based permissions differentiating standard `ADMIN` from `SUPER_ADMIN`.

> **Note on Early Groundwork:**  
> During Phase 0 setup, initial page shells and the quote submission endpoint (`POST /api/v1/orders/quote-request`) were scaffolded early to establish layout contracts and validation conventions. These represent **early Phase 1 groundwork** rather than finished customer features. Full interactive operational workflows belong to Phase 1.

---

## 5. Database Strategy & Future Scaling

- **Authoritative MVP Database:** Relational SQLite via Node.js built-in `node:sqlite`. SQLite provides zero-dependency deployment, high read/write throughput in WAL mode, and complete transactional integrity for the MVP volume.
- **PostgreSQL Portability Qualification:** While the SQL schema follows standard ANSI relational conventions, migration to PostgreSQL in a later scaling phase is a planned architectural evolution requiring explicit dialect, sequence, constraint, concurrency, and connection-pooling adaptation rather than an automatic drop-in assumption.

---

## 6. Performance & Mobile Foundations

- **Vite Bundling:** Code splitting and tree shaking resulting in compact CSS and JavaScript bundles.
- **Client-Side Routing:** Instant page transitions via `react-router-dom` with zero full-page reloads.
- **Database Indexing:** Indexed lookups for orders by status, customer, truck, driver, mobile numbers, product slugs, and creation timestamps.
- **Zero Native Dependencies:** Pure JavaScript / built-in Node modules ensure cross-platform portability.
