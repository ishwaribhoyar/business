# Phase 3 Requirement Traceability Matrix: Hierarchical Material Catalog & Variant-Based Quote Flow

**Authoritative Documents:**
- `Building_Material_Marketplace_PRD.docx`
- `Building_Material_Marketplace_BRD.docx`
- `PRODUCT_SCOPE.md`

**Status Definitions:**
- `IMPLEMENTED`: Feature fully implemented, integrated, and verified in Phase 3.
- `DEFERRED`: Explicitly scheduled for later post-MVP production iterations.
- `NOT APPLICABLE`: Out of scope for MVP by authoritative definition.

---

## 1. Traceability Matrix

| Requirement | Source Document | Relevant Section | Implementation Details & Architectural Invariants | Status | Verification / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hierarchical Material Structure** | PRD / BRD | PRD §5, §6; BRD §4 | Transitioned flat 4-material catalog into hierarchical **CATEGORY → SUBTYPE / VARIANT → SPECIFICATION → QUANTITY → QUOTE REQUEST** workflow. | `IMPLEMENTED` | Verified in test suites #1-#16 in `phase3-catalog.test.ts`. |
| **4 Core MVP Material Categories** | PRD / BRD | PRD §5; BRD §4 | 4 initial core categories seeded and active: **Sand** (`cat_sand_01`), **Bricks** (`cat_bricks_02`), **Black Stone / Aggregate** (`cat_stone_03`), **Murum** (`cat_murum_04`). | `IMPLEMENTED` | Migration `004_hierarchical_catalog.sql`, `seed.ts`; verified in tests #1, #2 in `phase3-catalog.test.ts`. |
| **11 Civil Engineering Realistic Subtypes** | Regional Market Standard | PRD §5; Engineering Rules | Sourced 11 standard Nagpur subtypes: River Sand (Washed), M-Sand, Plaster Sand / Stone Dust; Red Clay Bricks, Fly Ash Bricks; 10mm, 20mm, 40mm Aggregate, GSB Mix; Yellow Murum, Red Bharda Murum. | `IMPLEMENTED` | Seeded in `variantRepository.ts` with standard commercial units (`Brass`, `Pieces`). |
| **Data-Driven Specification Schemas** | Architecture | PRD §6; Tech Architecture | Dynamic JSON specification schemas per variant defining required/optional inputs, field types (`select`, `text`, `number`), predefined options, and helper notes. | `IMPLEMENTED` | Built in `catalogService.validateSpecifications()`; verified in tests #3, #7, #8 in `phase3-catalog.test.ts`. |
| **Historical Snapshot Invariance** | Architecture & Safety | PRD §8; Safety Invariant | Orders record immutable snapshots: `category_name_snapshot`, `variant_name_snapshot`, `specifications_snapshot`. Subsequent variant/category edits never alter historical order records. | `IMPLEMENTED` | Database columns in `orders`; verified in test #12 in `phase3-catalog.test.ts`. |
| **Indicative Price Discipline** | PRD / BRD | PRD §2, §8; BRD §7 | Catalog prices are explicitly marked as **indicative ex-quarry rates**. They NEVER bypass or replace the Phase 2 manual quotation engine ($\text{Delivered Price} = \text{Material} + \text{Transport} + \text{Platform Fee} - \text{Discount}$). | `IMPLEMENTED` | Clear customer disclaimer on UI; quotation engine remains authoritative; verified in test #13. |
| **Minimum Order Quantity & Unit Guardrails** | Operations | PRD §6; BRD §6 | Enforces min quantities (e.g. 1 Brass for bulk aggregate/sand, 2000 Pieces for fly ash bricks) and locks commercial units to prevent invalid customer orders. | `IMPLEMENTED` | Built in `catalogService.validateQuantityAndUnit()`; verified in tests #9, #10 in `phase3-catalog.test.ts`. |
| **Backward Compatibility with Flat Materials** | Architecture | Phase 1/2 Preservation | Supports legacy order payloads containing `material_id` by auto-resolving category and default active variant without breaking existing automated tests. | `IMPLEMENTED` | Built in `orderController.createQuoteRequest()`; 49 legacy tests pass without regression. |
| **Customer Hierarchy UI Flow** | Customer Experience | PRD §6; Prompt §0 | High-contrast, clean light-themed UI: Category Selection (`/products`) → Variant Grid (`/products/:categorySlug`) → Variant Detail with Specs (`/products/:categorySlug/:variantSlug`) → Quote Request (`/get-quote`). | `IMPLEMENTED` | Built in `ProductsPage.tsx`, `CategoryVariantsPage.tsx`, `VariantDetailPage.tsx`, `QuoteOrderPage.tsx`. |
| **WhatsApp Multi-Specification Prefill** | Operations | PRD §7; BRD §6 | Formatted WhatsApp continuation link includes order reference, variant name, category name, and key-value technical specifications for instant operations handoff. | `IMPLEMENTED` | Built in `orderController.ts` and `QuoteOrderPage.tsx`; verified in test #11 in `phase3-catalog.test.ts`. |
| **Admin Catalog Management** | Admin Operations | PRD §12; Prompt §3 | Admin portal page (`/admin/catalog`) to manage categories, variants, indicative rates, min order quantities, display orders, active status toggles, and custom specification schemas. | `IMPLEMENTED` | Built in `AdminCatalogPage.tsx`, `AdminSidebar.tsx`, `catalogController.ts`; verified in tests #14, #15, #16. |
| **Order Queue Category & Variant Visibility** | Admin Operations | PRD §10, §11 | Orders queue (`/admin/orders`) and detail (`/admin/orders/:id`) display variant snapshots, category tags, and technical specification breakdowns with category filtering. | `IMPLEMENTED` | Built in `OrdersPage.tsx`, `OrderDetailPage.tsx`. |
| **Collision-Resistant Order References** | Safety Invariant | PRD §10 | Generation of order references (`NGP-YYMMDD-XXXX`) validates against the database to guarantee zero unique constraint collisions under high throughput. | `IMPLEMENTED` | Built in `orderController.generateOrderReference()`. |
| **Customer Login / Portals** | PRD / BRD | PRD §7; BRD §15 | Customer login accounts excluded from MVP. | `NOT APPLICABLE` | Guardrail enforced: Quote request is account-free. |
| **Supplier / Driver Native Mobile Apps** | PRD / BRD | PRD §3; BRD §7 | Dedicated mobile apps for drivers/suppliers excluded from MVP. | `NOT APPLICABLE` | Guardrail enforced: Admin portal manages partner logistics. |
| **Automated Dynamic Pricing Algorithms** | PRD / BRD | PRD §2; BRD §7 | Algorithmic dynamic pricing strictly forbidden in MVP. | `NOT APPLICABLE` | Guardrail enforced: Quotations remain manually calculated by operations team. |
| **Online Payment Gateways (Razorpay/Stripe)** | PRD / BRD | PRD §14; BRD §7 | Online credit card/gateway checkout excluded from MVP. | `NOT APPLICABLE` | Guardrail enforced: Offline bank transfer/UPI/cash ledger only. |
| **GPS Live Telematics / Live Driver Tracking** | PRD / BRD | PRD §3, §10 | IoT hardware live tracking excluded from MVP. | `NOT APPLICABLE` | Guardrail enforced: Status-driven delivery milestone tracking. |

---

## 2. Test Execution & Build Verification Summary

```text
================================================================================
TEST SUITE RUN: vitest run
================================================================================
Phase 0 Foundation Tests:              13/13 PASSING
Phase 1 Customer Marketplace Tests:    13/13 PASSING
Phase 2 Admin Operations Tests:        23/23 PASSING
Phase 3 Hierarchical Catalog Tests:    16/16 PASSING
--------------------------------------------------------------------------------
TOTAL AUTOMATED TESTS:                 65/65 PASSING (100% Pass Rate)

================================================================================
COMPILATION & PRODUCTION BUILDS
================================================================================
Backend TypeScript Build (tsc):        CLEAN (0 errors, 0 warnings)
Frontend Production Build (Vite):      CLEAN (0 errors, 439.38 kB JS, 37.15 kB CSS)
```
