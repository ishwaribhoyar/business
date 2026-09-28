import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPgPool } from './pgPool.js';
import { getDatabasePath } from './connection.js';
import { runPgMigrations } from './pgMigrate.js';
import { Logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);

export interface MigrationTableReport {
  table: string;
  sqliteCount: number;
  pgCount: number;
  diff: number;
  status: 'MATCH' | 'MISMATCH';
}

export interface MigrationFinancialReport {
  metric: string;
  sqliteTotal: number;
  pgTotal: number;
  diff: number;
  status: 'MATCH' | 'MISMATCH';
}

export interface MigrationVerificationResult {
  success: boolean;
  tableReports: MigrationTableReport[];
  financialReports: MigrationFinancialReport[];
  orphanForeignKeys: number;
  missingSnapshots: number;
}

/**
 * Migrates data from an existing SQLite database into PostgreSQL with comprehensive verification
 */
export async function migrateSqliteToPostgres(
  sqliteSource?: string | DatabaseSync,
  targetPool?: pg.Pool
): Promise<MigrationVerificationResult> {
  const isInstance = sqliteSource && typeof sqliteSource === 'object' && 'prepare' in sqliteSource;
  const sqlite = isInstance
    ? (sqliteSource as DatabaseSync)
    : new DatabaseSync(typeof sqliteSource === 'string' ? sqliteSource : getDatabasePath());
  const shouldCloseSqlite = !isInstance;

  const pool = targetPool ?? getPgPool();

  // Step 1: Ensure PostgreSQL migrations are applied first
  Logger.info('Ensuring PostgreSQL target schema is up to date...');
  await runPgMigrations(pool);

  const client = await pool.connect();

  try {
    Logger.info('Starting SQLite to PostgreSQL transactional data migration...');
    await client.query('BEGIN');

    // 1. Admin Users
    const adminUsers = sqlite.prepare('SELECT * FROM admin_users').all() as any[];
    for (const u of adminUsers) {
      await client.query(
        `INSERT INTO admin_users (id, email, password_hash, full_name, role, is_active, last_login_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           full_name = EXCLUDED.full_name,
           role = EXCLUDED.role,
           is_active = EXCLUDED.is_active,
           last_login_at = EXCLUDED.last_login_at,
           updated_at = EXCLUDED.updated_at`,
        [u.id, u.email, u.password_hash, u.full_name, u.role, u.is_active === 1 || u.is_active === true, u.last_login_at || null, u.created_at, u.updated_at]
      );
    }

    // 2. Products
    const products = sqlite.prepare('SELECT * FROM products').all() as any[];
    for (const p of products) {
      await client.query(
        `INSERT INTO products (id, name, slug, category, description, unit, min_quantity, is_active, typical_use_cases, quality_specifications, availability_disclaimer, display_order, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO NOTHING`,
        [p.id, p.name, p.slug, p.category, p.description, p.unit, p.min_quantity, p.is_active === 1 || p.is_active === true, p.typical_use_cases || null, p.quality_specifications || null, p.availability_disclaimer || null, p.display_order ?? 0, p.created_at, p.updated_at]
      );
    }

    // 3. Product Categories
    const categories = sqlite.prepare('SELECT * FROM product_categories').all() as any[];
    for (const c of categories) {
      await client.query(
        `INSERT INTO product_categories (id, name, slug, description, image_url, is_active, display_order, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [c.id, c.name, c.slug, c.description, c.image_url || null, c.is_active === 1 || c.is_active === true, c.display_order ?? 0, c.created_at, c.updated_at]
      );
    }

    // 4. Product Variants
    const variants = sqlite.prepare('SELECT * FROM product_variants').all() as any[];
    for (const v of variants) {
      const specSchema = typeof v.specifications_schema === 'string' ? JSON.parse(v.specifications_schema || '[]') : v.specifications_schema;
      await client.query(
        `INSERT INTO product_variants (id, category_id, name, slug, short_description, detailed_description, image_url, unit, min_quantity, indicative_price, specifications_schema, is_active, display_order, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (id) DO NOTHING`,
        [v.id, v.category_id, v.name, v.slug, v.short_description, v.detailed_description || null, v.image_url || null, v.unit, v.min_quantity, v.indicative_price || null, JSON.stringify(specSchema), v.is_active === 1 || v.is_active === true, v.display_order ?? 0, v.created_at, v.updated_at]
      );
    }

    // 5. Customers
    const customers = sqlite.prepare('SELECT * FROM customers').all() as any[];
    for (const cust of customers) {
      await client.query(
        `INSERT INTO customers (id, full_name, mobile_number, whatsapp_number, delivery_address, area_pincode, map_pin_url, internal_notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [cust.id, cust.full_name, cust.mobile_number, cust.whatsapp_number || null, cust.delivery_address, cust.area_pincode, cust.map_pin_url || null, cust.internal_notes || null, cust.created_at, cust.updated_at]
      );
    }

    // 6. QR Campaigns
    const campaigns = sqlite.prepare('SELECT * FROM qr_campaigns').all() as any[];
    for (const q of campaigns) {
      await client.query(
        `INSERT INTO qr_campaigns (id, campaign_code, truck_identifier, description, target_url, scan_count, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [q.id, q.campaign_code, q.truck_identifier, q.description || null, q.target_url, q.scan_count ?? 0, q.is_active === 1 || q.is_active === true, q.created_at, q.updated_at]
      );
    }

    // 7. Suppliers
    const suppliers = sqlite.prepare('SELECT * FROM suppliers').all() as any[];
    for (const s of suppliers) {
      const suppMats = typeof s.supported_materials === 'string' ? JSON.parse(s.supported_materials || '[]') : s.supported_materials;
      await client.query(
        `INSERT INTO suppliers (id, business_name, contact_person, mobile_number, location_address, service_zones, supported_materials, verification_status, indicative_purchase_price, price_updated_at, quality_notes, fulfillment_notes, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (id) DO NOTHING`,
        [s.id, s.business_name, s.contact_person, s.mobile_number, s.location_address, s.service_zones, JSON.stringify(suppMats), s.verification_status, s.indicative_purchase_price || null, s.price_updated_at || null, s.quality_notes || null, s.fulfillment_notes || null, s.is_active === 1 || s.is_active === true, s.created_at, s.updated_at]
      );
    }

    // 8. Drivers
    const drivers = sqlite.prepare('SELECT * FROM drivers').all() as any[];
    for (const d of drivers) {
      await client.query(
        `INSERT INTO drivers (id, full_name, mobile_number, license_number, verification_status, availability_status, notes, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [d.id, d.full_name, d.mobile_number, d.license_number || null, d.verification_status, d.availability_status ?? 'Available', d.notes || null, d.is_active === 1 || d.is_active === true, d.created_at, d.updated_at]
      );
    }

    // 9. Trucks
    const trucks = sqlite.prepare('SELECT * FROM trucks').all() as any[];
    for (const t of trucks) {
      const suppMats = typeof t.supported_materials === 'string' ? JSON.parse(t.supported_materials || '[]') : t.supported_materials;
      await client.query(
        `INSERT INTO trucks (id, registration_number, capacity_tons, supported_materials, owner_name, owner_mobile, default_driver_id, availability_status, indicative_transport_rate, verification_status, notes, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO NOTHING`,
        [t.id, t.registration_number, t.capacity_tons, JSON.stringify(suppMats), t.owner_name, t.owner_mobile, t.default_driver_id || null, t.availability_status ?? 'Available', t.indicative_transport_rate || null, t.verification_status, t.notes || null, t.is_active === 1 || t.is_active === true, t.created_at, t.updated_at]
      );
    }

    // 10. Orders (excluding circular current_quotation_id first)
    const orders = sqlite.prepare('SELECT * FROM orders').all() as any[];
    for (const o of orders) {
      const specs = o.specifications ? (typeof o.specifications === 'string' ? JSON.parse(o.specifications) : o.specifications) : null;
      const specsSnapshot = o.specifications_snapshot ? (typeof o.specifications_snapshot === 'string' ? JSON.parse(o.specifications_snapshot) : o.specifications_snapshot) : null;
      await client.query(
        `INSERT INTO orders (id, order_reference, customer_id, product_id, quantity, unit, delivery_address, area_pincode, preferred_delivery_date, additional_notes, status, cancellation_reason, supplier_id, truck_id, driver_id, payment_status, qr_campaign_id, category_id, variant_id, specifications, category_name_snapshot, variant_name_snapshot, specifications_snapshot, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
         ON CONFLICT (id) DO NOTHING`,
        [o.id, o.order_reference, o.customer_id, o.product_id, o.quantity, o.unit, o.delivery_address, o.area_pincode, o.preferred_delivery_date, o.additional_notes || null, o.status, o.cancellation_reason || null, o.supplier_id || null, o.truck_id || null, o.driver_id || null, o.payment_status ?? 'Pending', o.qr_campaign_id || null, o.category_id || null, o.variant_id || null, specs ? JSON.stringify(specs) : null, o.category_name_snapshot || null, o.variant_name_snapshot || null, specsSnapshot ? JSON.stringify(specsSnapshot) : null, o.created_at, o.updated_at]
      );
    }

    // 11. Quotations
    const quotations = sqlite.prepare('SELECT * FROM quotations').all() as any[];
    for (const q of quotations) {
      await client.query(
        `INSERT INTO quotations (id, quotation_reference, order_id, version, quotation_status, material_cost, transport_cost, loading_cost, platform_fee, discount, final_delivered_price, estimated_gross_margin, validity_date, notes, created_by_user_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         ON CONFLICT (id) DO NOTHING`,
        [q.id, q.quotation_reference, q.order_id, q.version ?? 1, q.quotation_status ?? 'ISSUED', q.material_cost, q.transport_cost, q.loading_cost ?? 0, q.platform_fee ?? 0, q.discount ?? 0, q.final_delivered_price, q.estimated_gross_margin, q.validity_date, q.notes || null, q.created_by_user_id, q.created_at]
      );
    }

    // Update orders.current_quotation_id now that quotations exist
    for (const o of orders) {
      if (o.current_quotation_id) {
        await client.query('UPDATE orders SET current_quotation_id = $1 WHERE id = $2', [o.current_quotation_id, o.id]);
      }
    }

    // 12. Order Status History
    const history = sqlite.prepare('SELECT * FROM order_status_history').all() as any[];
    for (const h of history) {
      await client.query(
        `INSERT INTO order_status_history (id, order_id, previous_status, new_status, changed_by_user_id, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [h.id, h.order_id, h.previous_status || null, h.new_status, h.changed_by_user_id || null, h.notes || null, h.created_at]
      );
    }

    // 13. Payments
    const payments = sqlite.prepare('SELECT * FROM payments').all() as any[];
    for (const pay of payments) {
      await client.query(
        `INSERT INTO payments (id, order_id, amount, payment_method, payment_status, transaction_reference, notes, recorded_by_user_id, payment_date, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [pay.id, pay.order_id, pay.amount, pay.payment_method, pay.payment_status, pay.transaction_reference || null, pay.notes || null, pay.recorded_by_user_id, pay.payment_date, pay.created_at]
      );
    }

    // 14. Financial Records
    const financials = sqlite.prepare('SELECT * FROM financial_records').all() as any[];
    for (const f of financials) {
      await client.query(
        `INSERT INTO financial_records (id, order_id, actual_revenue, actual_material_cost, actual_transport_cost, other_direct_costs, actual_gross_margin, recorded_by_user_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [f.id, f.order_id, f.actual_revenue ?? 0, f.actual_material_cost ?? 0, f.actual_transport_cost ?? 0, f.other_direct_costs ?? 0, f.actual_gross_margin ?? 0, f.recorded_by_user_id, f.created_at, f.updated_at]
      );
    }

    // 15. Audit Logs
    const auditLogs = sqlite.prepare('SELECT * FROM audit_logs').all() as any[];
    for (const a of auditLogs) {
      const changes = a.changes_json ? (typeof a.changes_json === 'string' ? JSON.parse(a.changes_json) : a.changes_json) : null;
      await client.query(
        `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, changes_json, ip_address, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [a.id, a.user_id || null, a.action, a.entity_type, a.entity_id, changes ? JSON.stringify(changes) : null, a.ip_address || null, a.created_at]
      );
    }

    // 16. Order Notes
    const notes = sqlite.prepare('SELECT * FROM order_notes').all() as any[];
    for (const n of notes) {
      await client.query(
        `INSERT INTO order_notes (id, order_id, author_id, author_name, note, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [n.id, n.order_id, n.author_id || null, n.author_name, n.note, n.created_at]
      );
    }

    await client.query('COMMIT');
    Logger.info('SQLite to PostgreSQL data insertion committed successfully.');

    // Step 2: Verification and Auditing
    const tableReports: MigrationTableReport[] = [];
    const tablesToVerify = [
      'admin_users',
      'products',
      'product_categories',
      'product_variants',
      'customers',
      'qr_campaigns',
      'suppliers',
      'drivers',
      'trucks',
      'orders',
      'order_status_history',
      'quotations',
      'payments',
      'financial_records',
      'audit_logs',
      'order_notes',
    ];

    let allCountsMatch = true;
    for (const t of tablesToVerify) {
      const sqliteCountRow = sqlite.prepare(`SELECT COUNT(*) as count FROM ${t}`).get() as { count: number };
      const sqliteCount = sqliteCountRow.count;

      const pgCountRes = await client.query<{ count: string }>(`SELECT COUNT(*) as count FROM ${t}`);
      const pgCount = parseInt(pgCountRes.rows[0].count, 10);

      const diff = pgCount - sqliteCount;
      const status: 'MATCH' | 'MISMATCH' = diff === 0 ? 'MATCH' : 'MISMATCH';
      if (status === 'MISMATCH') allCountsMatch = false;

      tableReports.push({ table: t, sqliteCount, pgCount, diff, status });
    }

    // Financial verification
    const financialReports: MigrationFinancialReport[] = [];

    // 1. Total Delivered Price on Quotations
    const sqliteQuo = sqlite.prepare('SELECT COALESCE(SUM(final_delivered_price), 0) as total FROM quotations').get() as { total: number };
    const pgQuo = await client.query<{ total: string }>('SELECT COALESCE(SUM(final_delivered_price), 0) as total FROM quotations');
    const quoSqlite = Number(sqliteQuo.total || 0);
    const quoPg = Number(pgQuo.rows[0].total || 0);
    const quoDiff = Math.abs(quoPg - quoSqlite);
    financialReports.push({
      metric: 'Quotations Total Delivered Price',
      sqliteTotal: quoSqlite,
      pgTotal: quoPg,
      diff: quoDiff,
      status: quoDiff < 0.01 ? 'MATCH' : 'MISMATCH',
    });

    // 2. Total Payments
    const sqlitePay = sqlite.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM payments').get() as { total: number };
    const pgPay = await client.query<{ total: string }>('SELECT COALESCE(SUM(amount), 0) as total FROM payments');
    const paySqlite = Number(sqlitePay.total || 0);
    const payPg = Number(pgPay.rows[0].total || 0);
    const payDiff = Math.abs(payPg - paySqlite);
    financialReports.push({
      metric: 'Payments Total Recorded',
      sqliteTotal: paySqlite,
      pgTotal: payPg,
      diff: payDiff,
      status: payDiff < 0.01 ? 'MATCH' : 'MISMATCH',
    });

    // 3. Total Financial Records Revenue
    const sqliteRev = sqlite.prepare('SELECT COALESCE(SUM(actual_revenue), 0) as total FROM financial_records').get() as { total: number };
    const pgRev = await client.query<{ total: string }>('SELECT COALESCE(SUM(actual_revenue), 0) as total FROM financial_records');
    const revSqlite = Number(sqliteRev.total || 0);
    const revPg = Number(pgRev.rows[0].total || 0);
    const revDiff = Math.abs(revPg - revSqlite);
    financialReports.push({
      metric: 'Financial Records Total Revenue',
      sqliteTotal: revSqlite,
      pgTotal: revPg,
      diff: revDiff,
      status: revDiff < 0.01 ? 'MATCH' : 'MISMATCH',
    });

    // Orphan Foreign Keys check (must be 0)
    const orphanOrdersRes = await client.query(`
      SELECT COUNT(*) as count FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN products p ON o.product_id = p.id
      WHERE c.id IS NULL OR p.id IS NULL
    `);
    const orphanOrders = parseInt(orphanOrdersRes.rows[0].count, 10);

    const orphanQuotesRes = await client.query(`
      SELECT COUNT(*) as count FROM quotations q
      LEFT JOIN orders o ON q.order_id = o.id
      WHERE o.id IS NULL
    `);
    const orphanQuotes = parseInt(orphanQuotesRes.rows[0].count, 10);

    const orphanPaymentsRes = await client.query(`
      SELECT COUNT(*) as count FROM payments p
      LEFT JOIN orders o ON p.order_id = o.id
      WHERE o.id IS NULL
    `);
    const orphanPayments = parseInt(orphanPaymentsRes.rows[0].count, 10);

    const totalOrphans = orphanOrders + orphanQuotes + orphanPayments;

    // Snapshot integrity check
    // Orders with variant_id must have variant_name_snapshot and category_name_snapshot preserved
    const missingSnapshotsRes = await client.query(`
      SELECT COUNT(*) as count FROM orders
      WHERE variant_id IS NOT NULL AND (variant_name_snapshot IS NULL OR category_name_snapshot IS NULL)
    `);
    const missingSnapshots = parseInt(missingSnapshotsRes.rows[0].count, 10);

    const allFinancesMatch = financialReports.every((f) => f.status === 'MATCH');
    const success = allCountsMatch && allFinancesMatch && totalOrphans === 0 && missingSnapshots === 0;

    return {
      success,
      tableReports,
      financialReports,
      orphanForeignKeys: totalOrphans,
      missingSnapshots,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    Logger.error('SQLite to PostgreSQL migration failed, rolled back.', err);
    throw err;
  } finally {
    client.release();
    if (shouldCloseSqlite) {
      sqlite.close();
    }
  }
}

// Direct CLI execution: tsx src/db/migrateSqliteToPg.ts
if (process.argv[1] === __filename) {
  migrateSqliteToPostgres()
    .then((result) => {
      console.log('====================================================');
      console.log('SQLITE -> POSTGRESQL DATA MIGRATION VERIFICATION');
      console.log('====================================================');
      console.table(result.tableReports);
      console.log('--- Financial Aggregates ---');
      console.table(result.financialReports);
      console.log(`Orphan Foreign Keys: ${result.orphanForeignKeys}`);
      console.log(`Missing Snapshots:   ${result.missingSnapshots}`);
      console.log(`Overall Success:     ${result.success ? 'PASS' : 'FAIL'}`);
      console.log('====================================================');
      process.exit(result.success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
