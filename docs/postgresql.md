# PostgreSQL Technical Specification & Data Architecture

**Product:** Digital Building-Material Marketplace & Delivery Platform — Nagpur | MVP  
**Phase:** Phase 4 — PostgreSQL Migration, Multi-User Production Architecture & Render Deployment Readiness  
**Target Engine:** PostgreSQL 16 (Render Managed Database)

---

## 1. Engine & Driver Architecture

- **PostgreSQL Version:** 16 (Standard LTS on Render)
- **Node.js Driver:** `pg` (`node-postgres` v8.23+)
- **Connection Pooling:** Singleton `pg.Pool` (`backend/src/db/pgPool.ts`)
- **Connection Sizing:**
  - `max`: 20 connections (optimized for Render Starter/Standard tiers)
  - `idleTimeoutMillis`: 30,000 ms (cleans up idle pool clients)
  - `connectionTimeoutMillis`: 5,000 ms (fast fail if database is unreachable)
  - `ssl`: Automatically enabled in production (`{ rejectUnauthorized: false }`)
- **Graceful Lifecycle Management:**
  - Pool clients are acquired per query or transactional scope.
  - Idle client errors are caught and logged without process termination.
  - Graceful process termination (`SIGTERM`/`SIGINT`) drains and ends the connection pool cleanly.

---

## 2. PostgreSQL Schema & Data Types

The production database schema is codified in `backend/src/db/pgSchema.sql` and versioned migrations in `backend/src/db/migrations/pg/`.

### Core Data Type Rules

1. **Financial & Monetary Integrity:**
   - **Type:** `NUMERIC(12, 2)`
   - **Enforced on:**
     - `quotations.material_cost`
     - `quotations.transport_cost`
     - `quotations.loading_cost`
     - `quotations.platform_fee`
     - `quotations.discount`
     - `quotations.final_delivered_price`
     - `quotations.estimated_gross_margin`
     - `payments.amount`
     - `financial_records.actual_revenue`
     - `financial_records.actual_material_cost`
     - `financial_records.actual_transport_cost`
     - `financial_records.other_direct_costs`
     - `financial_records.actual_gross_margin`
     - `product_variants.indicative_price`
     - `suppliers.indicative_purchase_price`
     - `trucks.indicative_transport_rate`
   - **Invariant:** Floating point numbers are strictly forbidden for stored currency. The backend calculates currency to the exact paisa (0.01 INR).

2. **Quantities & Physical Dimensions:**
   - **Type:** `NUMERIC(10, 2)`
   - **Enforced on:**
     - `orders.quantity`
     - `products.min_quantity`
     - `product_variants.min_quantity`
     - `trucks.capacity_tons`

3. **Timestamps & Timezones:**
   - **Type:** `TIMESTAMPTZ` with default `CURRENT_TIMESTAMP`
   - **Enforced on:**
     - All `created_at` and `updated_at` columns across all tables.
     - `admin_users.last_login_at`
     - `suppliers.price_updated_at`
     - `schema_migrations.applied_at`

4. **Booleans & Flags:**
   - **Type:** `BOOLEAN NOT NULL DEFAULT TRUE`
   - **Enforced on:**
     - `admin_users.is_active`
     - `products.is_active`
     - `product_categories.is_active`
     - `product_variants.is_active`
     - `suppliers.is_active`
     - `drivers.is_active`
     - `trucks.is_active`
     - `qr_campaigns.is_active`

5. **Hierarchical Specifications & Structured Metadata:**
   - **Type:** `JSONB`
   - **Enforced on:**
     - `product_variants.specifications_schema`
     - `orders.specifications`
     - `orders.specifications_snapshot`
     - `suppliers.supported_materials`
     - `trucks.supported_materials`
     - `audit_logs.changes_json`

---

## 3. Foreign Key Constraints & Historical Immutability

### Referential Integrity Constraints

| Constraint / Foreign Key | Source Column | Target Column | Delete Action | Rationale |
|---|---|---|---|---|
| `orders_customer_id_fkey` | `orders.customer_id` | `customers.id` | `ON DELETE RESTRICT` | Prevents deleting customers with historical orders |
| `orders_product_id_fkey` | `orders.product_id` | `products.id` | `ON DELETE RESTRICT` | Prevents catalog deletion from breaking orders |
| `orders_category_id_fkey` | `orders.category_id` | `product_categories.id` | `ON DELETE RESTRICT` | Preserves hierarchical category link |
| `orders_variant_id_fkey` | `orders.variant_id` | `product_variants.id` | `ON DELETE RESTRICT` | Preserves subtype / variant link |
| `orders_supplier_id_fkey` | `orders.supplier_id` | `suppliers.id` | `ON DELETE RESTRICT` | Supplier master deletion cannot destroy order history |
| `orders_truck_id_fkey` | `orders.truck_id` | `trucks.id` | `ON DELETE RESTRICT` | Truck fleet deletion cannot destroy logistics records |
| `orders_driver_id_fkey` | `orders.driver_id` | `drivers.id` | `ON DELETE RESTRICT` | Driver deletion cannot destroy trip history |
| `trucks_driver_id_fkey` | `trucks.default_driver_id` | `drivers.id` | `ON DELETE SET NULL` | Reassigning driver does not break truck |
| `quotations_order_id_fkey` | `quotations.order_id` | `orders.id` | `ON DELETE CASCADE` | Quotes belong to order lifecycle |
| `payments_order_id_fkey` | `payments.order_id` | `orders.id` | `ON DELETE CASCADE` | Payment records belong to order |
| `history_order_id_fkey` | `order_status_history.order_id`| `orders.id` | `ON DELETE CASCADE` | Status trail belongs to order |

### Snapshot Immutability Invariant
When an order is created, the following snapshot fields are frozen on the `orders` row:
- `category_name_snapshot` (e.g. `'Sand'`)
- `variant_name_snapshot` (e.g. `'River Sand (Semi-Washed)'`)
- `specifications_snapshot` (JSON string or object containing selected attributes)

Mutating master catalog data via `/admin/catalog` updates future selections, but has zero effect on existing orders.

---

## 4. Performance Indexes

The PostgreSQL database maintains targeted B-Tree indexes:
- **Order Operational Queries:**
  - `idx_orders_ref` (`order_reference`) UNIQUE
  - `idx_orders_status` (`status`)
  - `idx_orders_created_at` (`created_at`)
  - `idx_orders_customer` (`customer_id`)
  - `idx_orders_variant` (`variant_id`)
  - `idx_orders_supplier` (`supplier_id`)
  - `idx_orders_truck` (`truck_id`)
  - `idx_orders_payment_status` (`payment_status`)
- **Quotation & Payment Lookups:**
  - `idx_quotations_ref` (`quotation_reference`) UNIQUE
  - `idx_quotations_order` (`order_id`)
  - `idx_payments_order` (`order_id`)
- **Catalog Navigation:**
  - `idx_product_categories_slug` (`slug`) UNIQUE
  - `idx_product_variants_slug` (`slug`) UNIQUE
  - `idx_product_variants_category` (`category_id`)
- **Administration & Audit:**
  - `idx_admin_users_email` (`email`) UNIQUE
  - `idx_audit_logs_entity` (`entity_type`, `entity_id`)
  - `idx_audit_logs_user` (`user_id`)
