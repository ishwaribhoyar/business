# Phase 2 & 2.1 Requirement Traceability Matrix: Admin Operations, Quotation Engine & Fulfillment Coordination

**Authoritative Documents:**
- `Building_Material_Marketplace_PRD.docx`
- `Building_Material_Marketplace_BRD.docx`
- `PRODUCT_SCOPE.md`

**Status Definitions:**
- `IMPLEMENTED`: Feature fully implemented, integrated, and verified in Phase 2 / Phase 2.1.
- `DEFERRED`: Explicitly scheduled for later production iterations or post-MVP scale.
- `NOT APPLICABLE`: Out of scope for MVP by authoritative definition.

---

## 1. Traceability Matrix

| Requirement | Source Document | Relevant Section | Implementation Details & Phase 2.1 Audit Status | Status | Verification / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Primary Delivery Lifecycle & Terminal States** | PRD / BRD | PRD §10, §11; BRD §9, §10 | **10-stage primary delivery lifecycle + CANCELLED terminal state**: `NEW` → `CONTACTED` → `QUOTATION_SENT` → `CONFIRMED` → `SUPPLIER_ASSIGNED` → `TRUCK_ASSIGNED` → `LOADING` → `OUT_FOR_DELIVERY` → `DELIVERED` → `COMPLETED` (with `CANCELLED` available from non-terminal states). | `IMPLEMENTED` | Phase 2.1 audit: Precise lifecycle documentation and verified in tests #1, #2, #21, #22 in `phase2-operations.test.ts`. |
| **State Machine Transition Invariants** | PRD | PRD §11 | Disallows arbitrary jumps; requires active quotation before `QUOTATION_SENT` or `CONFIRMED`; **strictly requires supplier + truck + driver** before dispatch (`LOADING`/`OUT_FOR_DELIVERY`). | `IMPLEMENTED` | Phase 2.1 audit: Enforced strict 3-way check (`supplier_id`, `truck_id`, and `driver_id`); verified in negative tests in test #22. |
| **Mandatory Cancellation Reason** | PRD | PRD §11 | Any transition to `CANCELLED` requires a non-empty cancellation reason (min 3 chars). Terminal states prevent subsequent transitions. | `IMPLEMENTED` | Verified in tests #4, #10, #11 in `phase2-operations.test.ts`. |
| **Audit Log on Status Transitions** | PRD | PRD §18; BRD §12 | Every state change records `ORDER_STATUS_CHANGED` in `audit_logs` and appends an entry to `order_status_history`. | `IMPLEMENTED` | Verified in test #2 in `phase2-operations.test.ts`. |
| **Manual Quotation Cost Breakdown** | PRD / BRD | PRD §8, §9; BRD §8 | Admin enters real direct costs: `material_cost`, `transport_cost`, `loading_cost`, `platform_fee`, `discount`. Deterministic backend math. | `IMPLEMENTED` | Built in `backend/src/services/quotationService.ts`; verified in test #4 in `phase2-operations.test.ts`. |
| **Deterministic Unit Economics** | PRD / BRD | PRD §9; BRD §8, §13 | `base_cost = material + transport + loading`; `final_delivered_price = base + platform_fee - discount`; `estimated_gross_margin = final - base`. | `IMPLEMENTED` | Backend recomputes and validates deterministic math; verified in test #4 in `phase2-operations.test.ts`. |
| **Quotation Snapshot Immutability & Revisions** | PRD / BRD | PRD §8, §9; BRD §8 | Quotations are immutable snapshots. Price revisions create new quotation versions (`v1`, `v2`, `v3`) and mark prior versions `SUPERSEDED`. | `IMPLEMENTED` | Verified in test #7 in `phase2-operations.test.ts`. |
| **Quotation Validity Reference** | PRD | PRD §8; Audit §10 | Internal reference date (`validity_date`) is optional and defaulted if omitted. Not displayed as an authoritative commercial customer expiration deadline. | `IMPLEMENTED` | Phase 2.1 audit: Schema updated with optional fallback default. |
| **Partner Supplier Registry** | PRD / BRD | PRD §12; BRD §11 | Admin manages suppliers: `business_name`, `contact_person`, `mobile_number`, `location_address`, `service_zones`, `supported_materials`, `indicative_purchase_price`, `verification_status`. | `IMPLEMENTED` | Built in `supplierService.ts`, `supplierRepository.ts`, `SuppliersPage.tsx`; verified in test #12 in `phase2-operations.test.ts`. |
| **Partner Fleet (Truck) Registry** | PRD / BRD | PRD §12; BRD §11 | Asset-light third-party truck registry: `registration_number`, `capacity_tons`, `supported_materials`, `owner_name`, `owner_mobile`, `default_driver_id`, `availability_status`, `indicative_transport_rate`. | `IMPLEMENTED` | Built in `truckService.ts`, `truckRepository.ts`, `TrucksPage.tsx`; verified in test #14 in `phase2-operations.test.ts`. |
| **Decoupled Driver Partner Registry** | PRD / Architecture | PRD §12; Phase 0.1 Architecture | Drivers managed independently from trucks: `full_name`, `mobile_number`, `license_number`, `verification_status`, `availability_status`, `notes`. | `IMPLEMENTED` | Built in `driverService.ts`, `driverRepository.ts`, `TrucksPage.tsx`; verified in test #13 in `phase2-operations.test.ts`. |
| **Default Driver Auto-Assignment** | Architecture | Implementation Note | Convenient operational default: assigning a truck with a configured default driver auto-populates `order.driver_id`. Stored separately and can be overridden. | `IMPLEMENTED` | Phase 2.1 audit: Documented as implementation convenience; verified immune to subsequent truck driver changes in test #23. |
| **Fulfillment Assignment Operations** | PRD | PRD §12; BRD §9 | Admin assigns `supplier_id`, `truck_id`, `driver_id` to orders. Validates active partner status and returns availability warnings if busy. | `IMPLEMENTED` | Built in `fulfillmentService.ts`; verified in test #15 in `phase2-operations.test.ts`. |
| **Offline Payment Recording** | PRD / BRD | PRD §14; BRD §10 | Records payment transactions: `amount`, `payment_method` (`Cash`, `UPI`, `Bank Transfer`, `Cheque`), `transaction_reference`, `payment_date`. | `IMPLEMENTED` | Built in `paymentService.ts`, `paymentRepository.ts`, `PaymentsPage.tsx`; verified in test #16 in `phase2-operations.test.ts`. |
| **Order Payment Status Derivation** | PRD | PRD §14 | Derives payment status: `Pending` (no payments), `Partially Paid` (paid < quoted), `Paid` (paid >= quoted), `Refunded`. | `IMPLEMENTED` | Verified in tests #16, #18 in `phase2-operations.test.ts`. |
| **Overpayment Protection** | Safety Invariant | Phase 2 Specification | Rejects payment entry by default if amount exceeds remaining balance due. Zero undefined administrative override backdoors. | `IMPLEMENTED` | Phase 2.1 audit: Hard default rejection verified in test #17 in `phase2-operations.test.ts`. |
| **Operational Internal Notes** | PRD / Operations | PRD §11; BRD §12 | Dedicated `order_notes` table for operational logging (e.g. "Customer requested delivery before 11 AM"). Displays author and timestamp. | `IMPLEMENTED` | Built in `orderController.ts`, `orderRepository.ts`, `OrderDetailPage.tsx`; verified in test #19 in `phase2-operations.test.ts`. |
| **Real Operations Dashboard Metrics** | PRD | PRD §15; BRD §13 | Zero fake or hardcoded numbers. Computes total orders, pipeline counts, gross margin, active products, registered suppliers, trucks, and drivers. | `IMPLEMENTED` | Built in `orderRepository.getDashboardMetrics()`, `AdminDashboardPage.tsx`; verified in test #20 in `phase2-operations.test.ts`. |
| **Revenue Metric Terminology** | PRD / Audit §9 | PRD §14, §15 | Labeled as **Quoted Revenue** (Total Customer Value of confirmed/dispatched orders). Explicitly avoids "Invoiced" since invoices do not exist in MVP. | `IMPLEMENTED` | Phase 2.1 audit: Updated in `AdminDashboardPage.tsx` and documentation. |
| **Order Search, Multi-Filter & Pagination** | Operational UX | Prompt §45 | Search by reference, customer name, mobile, address. Filter by delivery status and payment status. Paginated response. | `IMPLEMENTED` | Built in `orderRepository.findAll()`, `OrdersPage.tsx`; verified in test suites. |
| **Negative Transition Path Tests** | Audit §18 | Phase 2.1 Verification | Explicit negative tests for illegal transitions (`NEW` → `DELIVERED`, `NEW` → `COMPLETED`, `COMPLETED` → `NEW`, `DELIVERED` → `CONFIRMED`, `TRUCK_ASSIGNED` → `LOADING` without driver). | `IMPLEMENTED` | Phase 2.1 audit: Verified in test #22 in `phase2-operations.test.ts`. |
| **Master Data Mutation Regression Test** | Audit §19 | Phase 2.1 Verification | Verifies changing truck default driver or supplier indicative price never alters existing order driver assignment or historical quotation snapshot. | `IMPLEMENTED` | Phase 2.1 audit: Verified in test #23 in `phase2-operations.test.ts`. |
| **Automated Dynamic Pricing Engine** | PRD / BRD | PRD §2; BRD §7 | Algorithmic dynamic pricing strictly forbidden in MVP. | `NOT APPLICABLE` | Guardrail enforced: Quotations are manual inputs validated deterministically. |
| **Online Payment Gateways (Razorpay/Stripe)**| PRD / BRD | PRD §14; BRD §7 | Online payment processing excluded from MVP. | `NOT APPLICABLE` | Guardrail enforced: Human-assisted offline payment recording only. |
| **Customer Portal / Login Accounts** | PRD / BRD | PRD §7; BRD §15 | Customer accounts and login dashboards excluded from MVP. | `NOT APPLICABLE` | Guardrail enforced: Quote requests remain account-free. |
| **Driver & Supplier Mobile Apps** | PRD / BRD | PRD §3; BRD §7 | Dedicated mobile apps for drivers or suppliers excluded from MVP. | `NOT APPLICABLE` | Guardrail enforced: Centralized admin operations manage partners. |
| **Real-time GPS Tracking** | PRD / BRD | PRD §3, §10 | IoT / GPS tracking excluded from MVP. | `NOT APPLICABLE` | Guardrail enforced: Tracked via human-updated delivery statuses. |

---

## 2. Phase 2 & 2.1 Verification Summary

```text
Phase 0 Foundation Tests:              13/13 PASSING
Phase 1 Customer Marketplace Tests:    13/13 PASSING
Phase 2 & 2.1 Operations Tests:        23/23 PASSING
------------------------------------------------------
Total Automated Tests:                 49/49 PASSING (100% pass rate)
Backend Build (tsc):                   CLEAN (0 errors)
Frontend Production Build (Vite):      CLEAN (0 errors, 398.47 kB JS, 34.69 kB CSS)
```
