import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { getPgPool } from './pgPool.js';
import { Logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface MigrationResult {
  applied: string[];
  alreadyApplied: string[];
}

/**
 * Executes pending PostgreSQL migrations in transactional order
 */
export async function runPgMigrations(poolInstance?: pg.Pool): Promise<MigrationResult> {
  const pool = poolInstance ?? getPgPool();
  const client = await pool.connect();

  const applied: string[] = [];
  const alreadyApplied: string[] = [];

  try {
    // 1. Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Query applied migrations
    const res = await client.query<{ version: string }>('SELECT version FROM schema_migrations ORDER BY id ASC');
    const appliedVersions = new Set(res.rows.map((r) => r.version));

    // 3. Scan migrations directory with fallbacks
    let migrationsDir = path.resolve(__dirname, 'migrations/pg');
    if (!fs.existsSync(migrationsDir)) {
      const candidates = [
        path.resolve(__dirname, '../../src/db/migrations/pg'),
        path.resolve(__dirname, '../migrations/pg'),
        path.resolve(process.cwd(), 'src/db/migrations/pg'),
        path.resolve(process.cwd(), 'backend/src/db/migrations/pg'),
        path.resolve(process.cwd(), 'dist/db/migrations/pg'),
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          migrationsDir = candidate;
          break;
        }
      }
    }

    if (!fs.existsSync(migrationsDir)) {
      const errorMsg = `FATAL: PostgreSQL migrations directory not found. Checked: ${migrationsDir}`;
      Logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    Logger.info(`Found ${files.length} PostgreSQL migration file(s).`);

    for (const file of files) {
      const version = file.split('_')[0];
      if (appliedVersions.has(version)) {
        alreadyApplied.push(file);
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');

      Logger.info(`Applying PostgreSQL migration: ${file}...`);

      try {
        await client.query('BEGIN');
        await client.query(sqlContent);
        await client.query(
          'INSERT INTO schema_migrations (version, name, applied_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
          [version, file]
        );
        await client.query('COMMIT');
        applied.push(file);
        Logger.info(`Successfully applied migration: ${file}`);
      } catch (migrationErr) {
        await client.query('ROLLBACK');
        Logger.error(`Failed to apply migration ${file}. Transaction rolled back.`, migrationErr);
        throw migrationErr;
      }
    }

    Logger.info(
      `PostgreSQL Migration Summary: ${applied.length} applied, ${alreadyApplied.length} previously applied.`
    );
    return { applied, alreadyApplied };
  } finally {
    client.release();
  }
}

// Allow direct CLI execution: tsx src/db/pgMigrate.ts
if (process.argv[1] === __filename) {
  runPgMigrations()
    .then((result) => {
      console.log('PostgreSQL migrations completed successfully:', result);
      process.exit(0);
    })
    .catch((err) => {
      console.error('PostgreSQL migration error:', err);
      process.exit(1);
    });
}
