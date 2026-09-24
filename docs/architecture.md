# Architecture Documentation

**Product:** Digital Building-Material Marketplace & Delivery Platform — Nagpur | MVP  
**Version:** Phase 0 Baseline  
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
         ├─────────────┼──────────────┐
         │             │              │
         ▼             ▼              ▼
     SUPPLIERS      TRUCKS         PAYMENTS
         │             │              │
         └─────────────┼──────────────┘
                       ▼
                    DATABASE (SQLite / PostgreSQL ready)
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
   - Routes: Dashboard (`/admin`), Orders (`/admin/orders`), Customers (`/admin/customers`), Suppliers (`/admin/suppliers`), Trucks (`/admin/trucks`), Quotations (`/admin/quotations`), Payments (`/admin/payments`), Reports (`/admin/reports`), Settings (`/admin/settings`).
   - Role-based permissions differentiating standard `ADMIN` from `SUPER_ADMIN`.

---

## 5. Performance & Mobile Foundations

- **Vite Bundling:** Code splitting and tree shaking resulting in compact CSS (~26kB gzip: ~5kB) and JavaScript bundles.
- **Client-Side Routing:** Instant page transitions via `react-router-dom` with zero full-page reloads.
- **Database Indexing:** Indexed lookups for orders by status, mobile numbers, product slugs, and creation timestamps.
- **Lightweight Dependencies:** Zero native C++ compilation dependencies, ensuring portability across cloud and on-premise environments.

---

## 6. SEO & Accessibility Foundations

- **Semantic HTML5:** Full use of semantic tags (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<aside>`).
- **Accessible Forms:** All inputs feature explicit `<label>`, `id`, `aria-invalid`, and descriptive error associations.
- **Search Engine Metadata:** Clean canonical URLs, meta descriptions, and OpenGraph-ready titles targeted at Nagpur construction queries.
