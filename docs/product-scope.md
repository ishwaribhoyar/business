# Product Scope Specification & Guardrails

---

## 1. Authoritative Sources of Truth

The entire product architecture, scope boundaries, and business rules are strictly governed by:

1. **`Building_Material_Marketplace_PRD.docx`** (Product Requirements Document)
2. **`Building_Material_Marketplace_BRD.docx`** (Business Requirements Document)

All developers and AI coding agents MUST treat these two documents as the sole authoritative specification. Do not replace requirements with generic e-commerce assumptions.

---

## 2. MVP Geography & Scope

- **Primary Market:** Nagpur and currently serviceable nearby areas in Maharashtra, India.
- **Operating Model:** Asset-light managed marketplace. The company coordinates suppliers, third-party trucks, and site deliveries without owning inventory or fleets.
- **Assisted Operations:** The MVP is human-assisted. Operations personnel review quote requests, calculate transport, confirm orders, and dispatch trucks using an internal Admin dashboard.

---

## 3. Authoritative MVP Materials (Strictly 4)

1. **Sand** (Brass) — Masonry, plastering, and RCC concrete works.
2. **Bricks** (Pieces) — Clay and fly-ash bricks for masonry and partition walls.
3. **Black Stone / Aggregate** (Brass) — Basalt metal aggregates for concrete and road work.
4. **Murum** (Brass) — Natural filling soil for plinths, site leveling, and compaction.

*No additional materials (cement bags, steel bars, tiles, paints, sanitaryware) may be introduced in MVP.*

---

## 4. Major Excluded Features (Phase 2 Backlog)

The following features are **explicitly out of scope for the MVP** and must NOT be implemented in Phase 0 or Phase 1:

- ❌ **Native mobile apps (iOS / Android)** — Public web application only.
- ❌ **Customer accounts / customer login** — Customers submit requests without registration.
- ❌ **Cart and automated instant checkout** — Workflows are quotation-first.
- ❌ **Automated dynamic or algorithmic pricing engine** — Prices are manually confirmed.
- ❌ **Supplier login portal** — Suppliers are managed manually by Admin.
- ❌ **Truck / Driver mobile app or portal** — Logistics partners are managed manually by Admin.
- ❌ **Live GPS tracking / real-time map telematics** — Dispatch updates are communicated via phone/WhatsApp.
- ❌ **Supplier bidding / reverse auctions** — Centralized relationship coordination.
- ❌ **Contractor credit / Buy-Now-Pay-Later (BNPL)** — Transactions are advance or confirmed terms.
- ❌ **AI chatbots or conversational recommendation engines** — Human-assisted WhatsApp coordination.
- ❌ **Complex loyalty or reward points programs**.
- ❌ **Multi-city geographic expansion beyond Nagpur region**.
