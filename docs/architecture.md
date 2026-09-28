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

## 4. Phase 2 Domain Services & Operations Engine

Phase 2 introduces the internal business engine coordinating quotations and physical fulfillment:

```
[Customer Quote Request]
          │
          ▼
   OrderStatusService  ── (NEW / CONTACTED)
          │
          ▼
   QuotationService    ── (Deterministic Pricing: Material + Transport + Loading + Fee - Discount)
          │             Creates immutable snapshot version (v1, v2) -> (QUOTATION_SENT)
          ▼
   FulfillmentService  ── (Assigns Supplier, Truck, Decoupled Driver) -> (CONFIRMED -> SUPPLIER_ASSIGNED -> TRUCK_ASSIGNED)
          │
          ▼
   OrderStatusService  ── (LOADING -> OUT_FOR_DELIVERY -> DELIVERED -> COMPLETED)
          │
          ▼
   PaymentService      ── (Records Cash/UPI/Bank/Cheque, computes balance due, updates PaymentStatus)
```

### Core Domain Services:
1. **`OrderStatusService`:**
   - Implements the authoritative 11-stage state machine:
     `NEW` → `CONTACTED` → `QUOTATION_SENT` → `CONFIRMED` → `SUPPLIER_ASSIGNED` → `TRUCK_ASSIGNED` → `LOADING` → `OUT_FOR_DELIVERY` → `DELIVERED` → `COMPLETED` + `CANCELLED`.
   - Invariant enforcement: rejects invalid jumps; requires active quotation before `QUOTATION_SENT` or `CONFIRMED`; requires supplier and vehicle assignments before dispatch (`LOADING`/`OUT_FOR_DELIVERY`); requires non-empty reason for `CANCELLED`.
   - Records every transition in `order_status_history` and `audit_logs` atomically.

2. **`QuotationService`:**
   - Enforces deterministic pricing math:
     - `base_cost = material_cost + transport_cost + loading_cost`
     - `final_delivered_price = base_cost + platform_fee - discount`
     - `estimated_gross_margin = final_delivered_price - base_cost`
   - Generates immutable snapshot records. Revisions increment `version` and mark prior quotations `SUPERSEDED`.

3. **`FulfillmentService`:**
   - Coordinates third-party partners without custom mobile apps.
   - Manages assignments for `supplier_id`, `truck_id`, and `driver_id` (decoupled).
   - Validates partner verification and returns non-blocking warnings if assigned resources are currently marked `Busy` or `Offline`.
   - Supports auto-assigning a truck's `default_driver_id` during truck dispatch.

4. **`PaymentService`:**
   - Manages offline and digital payment entries (`Cash`, `UPI`, `Bank Transfer`, `Cheque`).
   - Automatically derives order payment status (`Pending`, `Partially Paid`, `Paid`, `Refunded`).
   - Guards against overpayment beyond the frozen quoted price unless explicitly overridden.

5. **`CatalogService` (Phase 3 Hierarchical Catalog):**
   - Manages root material categories and civil-engineering standard subtypes.
   - Validates dynamic technical specification schemas per subtype.
   - Enforces real-time minimum order volume thresholds and commercial billing units.
   - Preserves frozen historical snapshots (`category_name_snapshot`, `variant_name_snapshot`, `specifications_snapshot`) on orders to guarantee historical immutability.
   - Guarantees strict separation between non-binding catalog indicative rates and authoritative manual delivered quotations.

---

## 5. Frontend Architecture

The frontend application provides two distinct operational domains within a single, cohesive codebase:

1. **Customer Public Area (`/customer`):**
   - Publicly accessible without authentication.
   - **Hierarchical Catalog Routes:**
     - `/products` (and `/materials`): Category overview (Sand, Bricks, Black Stone / Aggregate, Murum).
     - `/products/:categorySlug`: Category variant grid showcasing available regional subtypes.
     - `/products/:categorySlug/:variantSlug`: Technical subtype detail with civil specifications and indicative rate notices.
     - `/get-quote` (and `/order`): Hierarchical quotation request with dynamic specification schemas, auto-locked units, and min-order validation.
   - Static & Trust Routes: Home (`/`), How It Works (`/how-it-works`), About (`/about`), Contact (`/contact`), Privacy (`/privacy-policy`), Terms (`/terms`).
   - Persistent WhatsApp CTAs and click-to-call links.
   - Clean, industrial light-theme visual design with accessible contrast and touch-friendly controls.

2. **Operations & Admin Area (`/admin`):**
   - Protected by `ProtectedRoute` route guards.
   - Routes:
     - Dashboard (`/admin`): Live operational metrics (zero hardcoded numbers), direct pipeline links.
     - Orders (`/admin/orders`): Search, status/payment filters, pagination.
     - Order Detail (`/admin/orders/:id`): Central operational cockpit for manual quoting, supplier/truck/driver dispatch, payment recording, and internal notes.
     - Suppliers (`/admin/suppliers`): Partner quarry and manufacturer registry with indicative purchase prices.
     - Trucks & Drivers (`/admin/trucks`): Tabbed management of partner fleet vehicles and decoupled driver registry.
     - Quotations (`/admin/quotations`): Quotation rules, pricing breakdown overview, and active pipeline table.
     - Payments (`/admin/payments`): Global payment ledger and financial collection totals.
     - Reports (`/admin/reports`) & Settings (`/admin/settings`).

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
