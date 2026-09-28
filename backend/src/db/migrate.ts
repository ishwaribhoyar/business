import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';
import { getDatabase } from './connection.js';
import { Logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function runMigrations(db?: DatabaseSync): void {
  const activeDb = db ?? getDatabase();

  activeDb.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  // Migration 001: Baseline schema
  const checkStmt001 = activeDb.prepare("SELECT version FROM schema_migrations WHERE version = '001_baseline_schema'");
  const applied001 = checkStmt001.get() as { version: string } | undefined;

  if (!applied001) {
    Logger.info('Applying migration: 001_baseline_schema...');
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    activeDb.exec(schemaSql);
    const insertStmt = activeDb.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)');
    insertStmt.run('001_baseline_schema', new Date().toISOString());
    insertStmt.run('002_decouple_drivers', new Date().toISOString());
    insertStmt.run('003_phase2_operations', new Date().toISOString());
    insertStmt.run('004_hierarchical_catalog', new Date().toISOString());
    Logger.info('Successfully applied baseline schema and registered migrations through 004');
    return;
  }

  // Migration 002: Decouple Drivers from Trucks
  const checkStmt002 = activeDb.prepare("SELECT version FROM schema_migrations WHERE version = '002_decouple_drivers'");
  const applied002 = checkStmt002.get() as { version: string } | undefined;

  if (!applied002) {
    Logger.info('Applying migration: 002_decouple_drivers...');
    activeDb.exec(`
      CREATE TABLE IF NOT EXISTS drivers (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        mobile_number TEXT NOT NULL,
        license_number TEXT,
        verification_status TEXT NOT NULL CHECK(verification_status IN ('VERIFIED', 'PENDING', 'REJECTED')),
        availability_status TEXT NOT NULL CHECK(availability_status IN ('Available', 'Busy', 'Offline')) DEFAULT 'Available',
        notes TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_drivers_mobile ON drivers(mobile_number);
    `);

    // Safely add driver_id to orders if not present
    try {
      activeDb.exec('ALTER TABLE orders ADD COLUMN driver_id TEXT REFERENCES drivers(id);');
    } catch {
      // Column may already exist
    }

    // Safely add default_driver_id to trucks if not present
    try {
      activeDb.exec('ALTER TABLE trucks ADD COLUMN default_driver_id TEXT REFERENCES drivers(id);');
    } catch {
      // Column may already exist
    }

    const insertStmt = activeDb.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)');
    insertStmt.run('002_decouple_drivers', new Date().toISOString());
    Logger.info('Successfully applied migration: 002_decouple_drivers');
  }

  // Migration 003: Phase 2 Operations & Snapshot Enhancements
  const checkStmt003 = activeDb.prepare("SELECT version FROM schema_migrations WHERE version = '003_phase2_operations'");
  const applied003 = checkStmt003.get() as { version: string } | undefined;

  if (!applied003) {
    Logger.info('Applying migration: 003_phase2_operations...');
    try {
      activeDb.exec('ALTER TABLE orders ADD COLUMN current_quotation_id TEXT REFERENCES quotations(id);');
    } catch {
      // Column may already exist
    }
    try {
      activeDb.exec("ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'Pending';");
    } catch {
      // Column may already exist
    }
    try {
      activeDb.exec('ALTER TABLE quotations ADD COLUMN version INTEGER NOT NULL DEFAULT 1;');
    } catch {
      // Column may already exist
    }
    try {
      activeDb.exec("ALTER TABLE quotations ADD COLUMN quotation_status TEXT NOT NULL DEFAULT 'ISSUED';");
    } catch {
      // Column may already exist
    }

    activeDb.exec(`
      CREATE TABLE IF NOT EXISTS order_notes (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        author_id TEXT,
        author_name TEXT NOT NULL,
        note TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (author_id) REFERENCES admin_users(id)
      );
      CREATE INDEX IF NOT EXISTS idx_order_notes_order ON order_notes(order_id);
      CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
    `);

    // Migration 003: Phase 2 Operations & Snapshot Enhancements
    const insertStmt = activeDb.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)');
    insertStmt.run('003_phase2_operations', new Date().toISOString());
    Logger.info('Successfully applied migration: 003_phase2_operations');
  }

  // Migration 004: Phase 3 Hierarchical Material Catalog (Categories & Variants)
  const checkStmt004 = activeDb.prepare("SELECT version FROM schema_migrations WHERE version = '004_hierarchical_catalog'");
  const applied004 = checkStmt004.get() as { version: string } | undefined;

  if (!applied004) {
    Logger.info('Applying migration: 004_hierarchical_catalog...');

    activeDb.exec(`
      CREATE TABLE IF NOT EXISTS product_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_product_categories_slug ON product_categories(slug);
      CREATE INDEX IF NOT EXISTS idx_product_categories_active ON product_categories(is_active);

      CREATE TABLE IF NOT EXISTS product_variants (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        short_description TEXT NOT NULL,
        detailed_description TEXT,
        image_url TEXT,
        unit TEXT NOT NULL,
        min_quantity REAL NOT NULL DEFAULT 1,
        indicative_price REAL,
        specifications_schema TEXT NOT NULL DEFAULT '[]',
        is_active INTEGER NOT NULL DEFAULT 1,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE RESTRICT
      );
      CREATE INDEX IF NOT EXISTS idx_product_variants_category ON product_variants(category_id);
      CREATE INDEX IF NOT EXISTS idx_product_variants_slug ON product_variants(slug);
      CREATE INDEX IF NOT EXISTS idx_product_variants_active ON product_variants(is_active);
    `);

    // Safely add category, variant, and snapshot columns to orders
    const orderCols = [
      'category_id TEXT REFERENCES product_categories(id)',
      'variant_id TEXT REFERENCES product_variants(id)',
      'specifications TEXT',
      'category_name_snapshot TEXT',
      'variant_name_snapshot TEXT',
      'specifications_snapshot TEXT',
    ];

    for (const colDef of orderCols) {
      try {
        activeDb.exec(`ALTER TABLE orders ADD COLUMN ${colDef};`);
      } catch {
        // Column may already exist
      }
    }

    try {
      activeDb.exec('CREATE INDEX IF NOT EXISTS idx_orders_category ON orders(category_id);');
      activeDb.exec('CREATE INDEX IF NOT EXISTS idx_orders_variant ON orders(variant_id);');
    } catch {
      // Index creation fallback
    }

    const insertStmt = activeDb.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)');
    insertStmt.run('004_hierarchical_catalog', new Date().toISOString());
    Logger.info('Successfully applied migration: 004_hierarchical_catalog');
  } else {
    Logger.info('All migrations are up to date.');
  }
}

// Direct execution from CLI
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  try {
    runMigrations();
    console.log('Database migrations completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}
