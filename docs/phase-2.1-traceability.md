# Phase 2.1 Traceability Matrix: Operational Integrity & Business-Rule Audit

**Authoritative Documents:**
- `Building_Material_Marketplace_PRD.docx`
- `Building_Material_Marketplace_BRD.docx`
- `PRODUCT_SCOPE.md`

**Status Definitions:**
- `AUDITED & VERIFIED`: Existing implementation verified against PRD/BRD and passing tests.
- `HARDENED & CORRECTED`: Issue identified and corrected in Phase 2.1.

---

## 1. Requirement Traceability Matrix

| # | Requirement | Existing Phase 2 Behavior | Issue Identified | Phase 2.1 Change | Verification Test | Status |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Delivery Lifecycle Terminology** | Described as "11-stage lifecycle". | `CANCELLED` was mislabeled as a standard sequential stage rather than an exceptional terminal state. | Standardized terminology across documentation, UI, and tests to: **"10-stage primary delivery lifecycle + CANCELLED terminal state"**. | `tests/phase2-operations.test.ts` #1, #2, #21, #22 | `HARDENED & CORRECTED` |
| 2 | **Strict 3-Way Logistics Dispatch Requirements** | `LOADING` and `OUT_FOR_DELIVERY` checked `supplier_id` and `truck_id`. | Ambiguous driver requirement; orders could transition into dispatch states without an explicitly verified driver assigned. | In `orderStatusService.ts`, strictly enforced that entering `LOADING` or `OUT_FOR_DELIVERY` requires all three: `supplier_id`, `truck_id`, AND `driver_id`. | `tests/phase2-operations.test.ts` #22 | `HARDENED & CORRECTED` |
| 3 | **State Machine Transition Invariants & Negative Paths** | State machine blocked arbitrary forward jumps in normal flows. | Negative transition paths were not exhaustively verified at API level (e.g. `NEW` → `DELIVERED`, `NEW` → `COMPLETED`, `COMPLETED` → `NEW`, `DELIVERED` → `CONFIRMED`). | Added explicit negative transition path test suite in test #22 verifying strict 400 rejection for all illegal transitions. | `tests/phase2-operations.test.ts` #22 | `HARDENED & CORRECTED` |
| 4 | **Quotation Prerequisites** | Transition to `QUOTATION_SENT` or `CONFIRMED` requires active quotation. | Verified at service level, but needed explicit negative test coverage for direct API calls attempting to bypass quote creation. | Verified that `orderStatusService.ts` rejects transitions to `QUOTATION_SENT` and `CONFIRMED` without an approved quotation snapshot. | `tests/phase2-operations.test.ts` #9, #22 | `AUDITED & VERIFIED` |
| 5 | **Mandatory Cancellation Reason** | Transition to `CANCELLED` requires a non-empty reason. | Verified that empty strings, whitespace, or null are rejected. | Enforced at Zod schema and service level: cancellation reason must be non-empty (minimum 3 characters). | `tests/phase2-operations.test.ts` #10, #11, #22 | `AUDITED & VERIFIED` |
| 6 | **Terminal State Invariance** | `COMPLETED` and `CANCELLED` are terminal states. | Needed verification that neither admin nor customer can reopen terminal orders. | Verified in `orderStatusService.ts`: attempting to transition out of `COMPLETED` or `CANCELLED` throws `ValidationError`. | `tests/phase2-operations.test.ts` #11, #22 | `AUDITED & VERIFIED` |
| 7 | **Decoupled Driver Assignment vs Truck Default Driver** | When a truck is assigned, its `default_driver_id` is auto-assigned to `order.driver_id` as an operational convenience. | Needed guarantee that `order.driver_id` is stored independently on the order record and never dynamically derived from the truck's current default driver. | Verified in `fulfillmentService.ts` and added regression test #23: updating a truck's `default_driver_id` or reassigning its driver NEVER alters past orders. | `tests/phase2-operations.test.ts` #23 | `HARDENED & CORRECTED` |
| 8 | **Driver Assignment Override** | Admin can explicitly assign a driver different from the truck's default. | Needed guarantee that overriding the order's driver does not mutate the truck's master registry default driver. | Verified that `fulfillmentService.assignDriverToOrder()` updates only `order.driver_id` and leaves `truck.default_driver_id` intact. | `tests/phase2-operations.test.ts` #15, #23 | `AUDITED & VERIFIED` |
| 9 | **Quotation Snapshot Immutability** | Quotations store frozen financial direct costs and customer prices. | Master data rate changes (supplier purchase price, truck transport rate, catalog price) must never rewrite historical quotations. | Added regression test #23: mutated supplier indicative price and truck transport rate; verified historical quotation and order financial totals remain identical. | `tests/phase2-operations.test.ts` #23 | `HARDENED & CORRECTED` |
| 10 | **Quotation Versioning (v1, v2, v3)** | Revising a quotation creates a new version with incremented version number. | Verified that previous quotation version is marked `SUPERSEDED` and remains immutable in the database. | Verified in `quotationService.ts`: v1 preserved, v2 created, historical versions readable. | `tests/phase2-operations.test.ts` #7 | `AUDITED & VERIFIED` |
| 11 | **Quotation Validity Date Clarification** | `validity_date` was required on input. | PRD mentions quote validity as price volatility mitigation, but no automated expiration or customer promises are in scope. | In `quotationService.ts` and `schemas/index.ts`, made `validity_date` optional (defaulting to 7 days from creation if omitted). Documented as internal operational metadata. | `tests/phase2-operations.test.ts` #4, #7 | `HARDENED & CORRECTED` |
| 12 | **Deterministic Quotation Math** | Direct cost = material + transport + loading; final price = direct cost + platform fee - discount; gross margin = final price - direct cost. | Backend must be authoritative; frontend calculations must never be trusted. | Verified deterministic re-computation and validation in `quotationService.ts`. Rejects negative costs or excessive discounts that result in negative customer prices. | `tests/phase2-operations.test.ts` #4, #5, #6 | `AUDITED & VERIFIED` |
| 13 | **Offline Payment Recording & Status Derivation** | Payments recorded via `Cash`, `UPI`, `Bank Transfer`, `Cheque`. | Derives `Pending` (₹0), `Partially Paid` (< total), `Paid` (>= total), and `Refunded`. | Verified in `paymentService.ts`: payments recorded in append-only `payments` table and order payment status derived atomically. | `tests/phase2-operations.test.ts` #16, #18 | `AUDITED & VERIFIED` |
| 14 | **Overpayment Protection** | Payment recording checks remaining balance due. | Unchecked payments could exceed order total without clear financial justification. | In `paymentService.ts`, payment exceeding remaining balance due is rejected by default with `ValidationError`. | `tests/phase2-operations.test.ts` #17 | `HARDENED & CORRECTED` |
| 15 | **Append-Only Audit Trail & Status History** | Status changes, quotation creation, assignments, and payments record audit events. | Verified that historical records are never deleted or updated in place. | In `orderStatusService.ts`, `quotationService.ts`, `fulfillmentService.ts`, and `paymentService.ts`: operations record append-only entries in `audit_logs` and `order_status_history`. | `tests/phase2-operations.test.ts` #2, #21 | `AUDITED & VERIFIED` |
| 16 | **Dashboard Financial Metric Terminology** | Dashboard revenue metric was labeled "Total Invoiced". | Misleading terminology: MVP has no formal invoice generation system. Revenue represents total customer value of confirmed/dispatched orders. | Changed dashboard metric label to **"Quoted Revenue"** in `AdminDashboardPage.tsx` and documented financial definitions in `docs/architecture.md`. | `tests/phase2-operations.test.ts` #20 | `HARDENED & CORRECTED` |
| 17 | **Dashboard Metric Edge Cases** | Live calculation of pipeline counts, revenue, and gross margin. | Empty database or edge cases could produce `NaN` or unhandled division by zero. | Verified in `orderRepository.getDashboardMetrics()`: returns clean zeroes for empty state; excludes cancelled orders from revenue. | `tests/phase2-operations.test.ts` #20 | `AUDITED & VERIFIED` |
| 18 | **Order Reference Collision Resistance** | `generateOrderReference()` generated `NGP-YYMMDD-XXXX`. | In fast automated test execution or high-throughput bursts, random 4-digit numbers could collide and fail database unique constraint. | Hardened `generateOrderReference()` to query database and retry up to 100 times, guaranteeing unique reference without format breach. | `tests/phase2-operations.test.ts` #21, #23 | `HARDENED & CORRECTED` |

---

## 2. Test Execution Summary

```text
================================================================================
TEST SUITES RUN: vitest run
================================================================================
Phase 0 Foundation Tests:              13/13 PASSING
Phase 1 Customer Marketplace Tests:    13/13 PASSING
Phase 2 & 2.1 Admin Operations Tests:  23/23 PASSING
--------------------------------------------------------------------------------
TOTAL AUTOMATED TESTS:                 49/49 PASSING (100% Pass Rate)

================================================================================
BUILD VERIFICATION
================================================================================
Backend TypeScript Build (tsc):        CLEAN (0 errors, 0 warnings)
Frontend Production Build (Vite):      CLEAN (0 errors, 0 warnings)
```
