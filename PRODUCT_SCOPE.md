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

## 5. MVP Materials (Strictly Limited to 4)

1. **Sand**
2. **Bricks**
3. **Black Stone / Aggregate**
4. **Murum**

*Do NOT introduce additional materials, hardware items, tiles, paints, or sanitaryware in the MVP phase.*

---

## 6. Scope Boundaries

### In Scope for MVP:
- **Customer Side:**
  - Fast, responsive mobile-first website (Android, iOS, Desktop)
  - Product catalog browsing (4 MVP materials)
  - Detailed product information & use cases
  - Quotation / Order request form (no customer account required)
  - Persistent WhatsApp and phone contact actions
  - Order reference ID generation and tracking status inquiry
- **Operations / Admin Side:**
  - Secure role-based Admin authentication (`ADMIN`, `SUPER_ADMIN`)
  - Operational dashboard with order pipeline metrics and margin tracking
  - Customer records management
  - Order management through full 11-stage lifecycle
  - Manual Quotation builder (material cost, transport cost, margin, delivered price)
  - Supplier registry (indicative prices, contact, verification, fulfillment notes)
  - Truck & Driver registry (decoupled drivers, vehicle capacities, availability, rates, documents)
  - Payment status tracking (Pending, Partially Paid, Paid, Refunded)
  - Financial records (revenue, direct costs, gross margin)
  - Basic reporting and data export
  - Truck QR campaign lead attribution tracking

### STRICTLY EXCLUDED FROM MVP (Do NOT Implement):
- ❌ **Native mobile apps** (Android/iOS apps) — Web only
- ❌ **Customer accounts / login / registration** — Customers submit requests without an account
- ❌ **Cart & standard e-commerce checkout** — Order flow is quotation-first
- ❌ **Automated dynamic pricing or algorithmic pricing engines**
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
Phase 0 Foundation:          COMPLETE (Verified with Phase 0.1 fixes)
Phase 1 Groundwork:          PARTIALLY IMPLEMENTED EARLY (Retained as early groundwork)
Full MVP Operational System: NOT COMPLETE (Awaiting Phase 1 & Phase 2 implementations)
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
