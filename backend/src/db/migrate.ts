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

  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Check if baseline schema is already applied
  const checkStmt = activeDb.prepare("SELECT version FROM schema_migrations WHERE version = '001_baseline_schema'");
  const applied = checkStmt.get() as { version: string } | undefined;

  if (!applied) {
    Logger.info('Applying migration: 001_baseline_schema...');
    activeDb.exec(schemaSql);
    const insertStmt = activeDb.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)');
    insertStmt.run('001_baseline_schema', new Date().toISOString());
    Logger.info('Successfully applied migration: 001_baseline_schema');
  } else {
    Logger.info('Migration 001_baseline_schema is already applied.');
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
