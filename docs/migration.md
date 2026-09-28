# SQLite to PostgreSQL Data Migration & Verification Runbook

**Product:** Digital Building-Material Marketplace & Delivery Platform — Nagpur | MVP  
**Phase:** Phase 4 — PostgreSQL Migration, Multi-User Production Architecture & Render Deployment Readiness  
**Migration Tool:** `backend/src/db/migrateSqliteToPg.ts`

---

## 1. Migration Strategy & Architecture

The migration tool transfers all transactional data, master records, snapshots, and audit trails from an SQLite database into PostgreSQL with zero data loss and strict schema transformation:

```
┌─────────────────────────────────┐
│ Existing SQLite Database        │
│ (data/marketplace.sqlite)       │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ migrateSqliteToPostgres() Runner                            │
│ 1. Applies PostgreSQL migrations (schema_migrations)        │
│ 2. Opens isolated PostgreSQL Transaction                    │
│ 3. Transforms Types:                                        │
│    - Integers 0/1 -> Native Booleans                        │
│    - JSON Strings -> Parsed JSONB objects                   │
│    - Numbers -> Exact NUMERIC(12,2) decimals                │
│ 4. Topological Insertion (Master -> Child Entities)         │
│ 5. Backfills orders.current_quotation_id                    │
│ 6. Executes 4-Way Comprehensive Verification Checks          │
│ 7. Commits or Rolls Back on Failure                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Target PostgreSQL Database      │
│ (Render Managed PostgreSQL)     │
└─────────────────────────────────┘
```

---

## 2. Execution Command

To run the migration against the configured database:
```bash
npm run migrate:data
```
Or directly from the backend directory:
```bash
cd backend
npx tsx src/db/migrateSqliteToPg.ts
```

---

## 3. Four-Way Verification Protocol

The migration script does not declare success merely because the import commands completed. It automatically executes four distinct integrity checks:

### Verification Check 1: Table-by-Table Row Count Audit

| Entity / Table | Source Engine | Target Engine | Difference | Verification Rule |
|---|---|---|---|---|
| `admin_users` | SQLite | PostgreSQL | 0 | Exact match |
| `products` | SQLite | PostgreSQL | 0 | Exact match |
| `product_categories` | SQLite | PostgreSQL | 0 | 4 categories match |
| `product_variants` | SQLite | PostgreSQL | 0 | 11 variants match |
| `customers` | SQLite | PostgreSQL | 0 | Exact match |
| `qr_campaigns` | SQLite | PostgreSQL | 0 | Exact match |
| `suppliers` | SQLite | PostgreSQL | 0 | Exact match |
| `drivers` | SQLite | PostgreSQL | 0 | Exact match |
| `trucks` | SQLite | PostgreSQL | 0 | Exact match |
| `orders` | SQLite | PostgreSQL | 0 | Exact match |
| `order_status_history`| SQLite | PostgreSQL | 0 | Exact match |
| `quotations` | SQLite | PostgreSQL | 0 | Exact match |
| `payments` | SQLite | PostgreSQL | 0 | Exact match |
| `financial_records` | SQLite | PostgreSQL | 0 | Exact match |
| `audit_logs` | SQLite | PostgreSQL | 0 | Exact match |
| `order_notes` | SQLite | PostgreSQL | 0 | Exact match |

### Verification Check 2: Financial Aggregates Reconciliation
The script compares aggregate financial sums between SQLite and PostgreSQL:
1. `SUM(final_delivered_price)` across all quotations: Must match to 0.00 INR.
2. `SUM(amount)` across all payments recorded: Must match to 0.00 INR.
3. `SUM(actual_revenue)` across financial records: Must match to 0.00 INR.

### Verification Check 3: Foreign Key Referential Integrity (Orphan Audit)
The script queries for orphaned child rows using `LEFT JOIN ... WHERE ... IS NULL`:
- Orders without existing customers or products = **0**
- Quotations without existing orders = **0**
- Payments without existing orders = **0**

### Verification Check 4: Historical Snapshot Preservation
Verifies that all orders with `variant_id` maintain intact `category_name_snapshot`, `variant_name_snapshot`, and `specifications_snapshot` fields.
- Missing snapshots = **0**

---

## 4. Rollback Plan

If a migration fails or data discrepancies are detected:
1. The migration transaction is automatically aborted via `ROLLBACK`.
2. Target PostgreSQL tables remain in their pre-migration state.
3. The source SQLite database (`data/marketplace.sqlite`) is accessed in read-only mode during migration and is never modified.
4. To clean the target database completely if required:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```
   Followed by re-running:
   ```bash
   npm run migrate:pg
   ```
