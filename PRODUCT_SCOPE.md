# PRODUCT SCOPE & ARCHITECTURAL GUARDRAILS

> **CRITICAL NOTICE FOR ALL DEVELOPERS AND AI CODING AGENTS**  
> This file acts as an authoritative guardrail. You MUST read and respect these constraints before making any architecture, database, API, or frontend modifications. Do NOT replace these requirements with generic e-commerce or logistics assumptions.

---

## 1. Specification Hierarchy

Every technical decision, schema change, or feature implementation must follow this strict hierarchy:

```
                    PRODUCT TRUTH
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
   PRD (PRD.docx)          BRD (BRD.docx)
             │                       │
             └───────────┬───────────┘
                         ▼
                  PRODUCT_SCOPE.md
                         │
                         ▼
                TECHNICAL ARCHITECTURE
                         │
                         ▼
                   PHASE PROMPT
                         │
                         ▼
                    AI AGENT
```

If an instruction conflicts with `PRD.docx` or `BRD.docx`, the authoritative documents govern.

---

## 2. Product Identity

- **Product Name:** Digital Building-Material Marketplace & Delivery Platform — Nagpur | MVP
- **Primary Market:** Nagpur and currently serviceable nearby areas in Maharashtra, India.
- **Authoritative Documents (Sources of Truth):**
  - `Building_Material_Marketplace_PRD.docx`
  - `Building_Material_Marketplace_BRD.docx`

---

## 3. Business & Operating Model

- **Business Model:** Asset-light managed marketplace / delivery coordination.
- **Physical Assets:** The platform does **NOT** own material inventory or trucks.
- **Core Value Chain:**
  $$\text{Customer} \longrightarrow \text{Platform Operations (Admin)} \longrightarrow \text{Verified Supplier} \longrightarrow \text{Partner Truck / Driver} \longrightarrow \text{Customer Site}$$
- **MVP Operating Model:** **Human-assisted operations.** Do not automate supplier, pricing, dispatch, or logistics operations in Version 1.
- **MVP Pricing Model:** **Manual quotation-first.** No automated algorithmic or dynamic pricing. The admin receives the request, confirms transport/material costs with partners, enters quotation snapshots, and communicates the delivered price.

---

## 4. Target Customers

1. Civil contractors
2. Small and medium builders
3. Site supervisors / engineers
4. Individual house builders
5. Other local construction businesses

---

## 5. MVP Material Categories & Subtypes (Hierarchical Catalog)

The platform organizes materials in a strict hierarchy:
`CATEGORY → SUBTYPE / VARIANT → SPECIFICATION → QUANTITY → QUOTE REQUEST`

1. **Sand** (`cat_sand_01`):
   - *River Sand (Washed)* (Brass) — Silt grade, screening level
   - *M-Sand (Manufactured Sand)* (Brass) — IS 383 Zone II/III grading
   - *Plaster Sand / Stone Dust* (Brass) — Fineness grade
2. **Bricks** (`cat_bricks_02`):
   - *Red Clay Bricks* (Pieces) — Kiln burnt, compressive class, water absorption
   - *Fly Ash Bricks* (Pieces) — Hydraulic pressed, IS 12894 class rating
3. **Black Stone / Aggregate** (`cat_stone_03`):
   - *10mm Metal Aggregate* (Brass) — Basalt blue metal
   - *20mm Metal Aggregate* (Brass) — VSI cubical / standard crusher
   - *40mm Metal Aggregate* (Brass) — Foundation / sub-base
   - *GSB Mix (Granular Sub-Base)* (Brass) — Road base / heavy fill
4. **Murum** (`cat_murum_04`):
   - *Yellow Murum* (Brass) — Heavy compaction foundation fill
   - *Red Bharda Murum* (Brass) — Site grading / sub-grade

*Do NOT introduce additional materials, hardware items, tiles, paints, or sanitaryware in the MVP phase.*

---

## 6. Scope Boundaries

### In Scope for MVP:
- **Customer Side:**
  - Fast, responsive mobile-first website (Android, iOS, Desktop)
  - Hierarchical product catalog browsing (Categories → Subtypes → Specifications)
  - Detailed product specifications, civil use cases, and non-binding indicative rate notices
  - Quotation / Order request form with dynamic specification schemas (no customer account required)
  - Persistent WhatsApp and phone contact actions with rich reference & specification prefill
  - Order reference ID generation (`NGP-YYMMDD-XXXX`) and tracking status inquiry
- **Operations / Admin Side:**
  - Secure role-based Admin authentication (`ADMIN`, `SUPER_ADMIN`)
  - Operational dashboard with order pipeline metrics, gross margin tracking, and quoted revenue
  - Customer records management
  - Order management through full 10-stage primary delivery lifecycle + CANCELLED terminal state
  - Manual Quotation builder (material cost, transport cost, margin, delivered price) with immutable snapshot versioning
  - Partner registries (Suppliers, Partner Fleet Trucks, Decoupled Drivers)
  - Admin catalog management portal (`/admin/catalog`) for managing categories, subtypes, indicative rates, min order quantities, and custom specification schemas
  - Order queue category and variant filters with preserved snapshot badges
  - Payment status tracking (Pending, Partially Paid, Paid, Refunded) with overpayment protection
  - Basic reporting and data export
  - Truck QR campaign lead attribution tracking

### STRICTLY EXCLUDED FROM MVP (Do NOT Implement):
- ❌ **Native mobile apps** (Android/iOS apps) — Web only
- ❌ **Customer accounts / login / registration** — Customers submit requests without an account
- ❌ **Cart & standard e-commerce checkout** — Order flow is quotation-first
- ❌ **Automated dynamic pricing or algorithmic pricing engines** — Quotations are manually entered by operations desk
- ❌ **Supplier portal / Supplier login** — Managed manually by Admin
- ❌ **Truck / Driver mobile app or portal** — Managed manually by Admin
- ❌ **Live GPS tracking or map telemetry**
- ❌ **Supplier bidding / reverse auctions**
- ❌ **Contractor credit / Buy-Now-Pay-Later (BNPL)**
- ❌ **AI recommendation systems or AI chatbots**
- ❌ **Complex loyalty or reward points programs**
- ❌ **Expansion beyond Nagpur region**
- ❌ **Multi-service microservices or distributed event streaming (Kafka/RabbitMQ)**

---

## 7. Phase Boundary & Implementation Status

```text
Phase 0 Foundation:                     COMPLETE (Verified with Phase 0.1 Domain Corrections)
Phase 1 Customer Marketplace:           COMPLETE (Verified with Phase 1.1 Factual Cleanup)
Phase 2 Admin Operations & Fulfillment: COMPLETE (Verified with Phase 2.1 Operational Audit)
Phase 3 Hierarchical Material Catalog:  COMPLETE (Verified with 65/65 Passing Automated Tests)
Full MVP Operational System:            🟢 COMPLETE & PRODUCTION VERIFIED
```

> **Notice on Scope Discipline:**  
> During Phase 0 setup, initial customer page shells and the quote submission endpoint (`POST /api/v1/orders/quote-request`) were scaffolded early to establish layout contracts and validation conventions. These represent **early Phase 1 groundwork**, not final customer features. Future agents must not implement further business logic without explicit phase prompt instructions.

---

## 8. Order Lifecycle State Machine

Every order must strictly transition through these states:

```
NEW 
 │
 ▼
CONTACTED 
 │
 ▼
QUOTATION_SENT 
 │
 ▼
CONFIRMED 
 │
 ▼
SUPPLIER_ASSIGNED 
 │
 ▼
TRUCK_ASSIGNED 
 │
 ▼
LOADING 
 │
 ▼
OUT_FOR_DELIVERY 
 │
 ▼
DELIVERED 
 │
 ▼
COMPLETED
```
*(An order can transition to `CANCELLED` from active states with a recorded reason).*
