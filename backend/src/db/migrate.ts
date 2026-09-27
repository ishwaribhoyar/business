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
    Logger.info('Successfully applied migration: 001_baseline_schema and 002_decouple_drivers');
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
