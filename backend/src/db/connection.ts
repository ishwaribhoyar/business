import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';
import { Logger } from '../utils/logger.js';
import { closePgPool } from './pgPool.js';

let dbInstance: DatabaseSync | null = null;

/**
 * Validates that production mode strictly requires PostgreSQL
 */
export function validateDatabaseEnvironment(): void {
  const isPostgres = isPostgresConfigured();
  if (config.isProduction && !isPostgres) {
    const errorMsg =
      'FATAL: Production database must be PostgreSQL. SQLite is strictly prohibited in production. ' +
      'Missing or invalid DATABASE_URL (must start with postgres:// or postgresql://).';
    Logger.error(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Returns true if the configured DATABASE_URL is a PostgreSQL connection string
 */
export function isPostgresConfigured(): boolean {
  const url = config.databaseUrl || '';
  return url.startsWith('postgres://') || url.startsWith('postgresql://');
}

export function getDatabasePath(): string {
  if (config.isTest) {
    return ':memory:';
  }

  // Extract path from DATABASE_URL like 'file:./data/marketplace.sqlite'
  const rawUrl = config.databaseUrl;
  const cleanPath = rawUrl.startsWith('file:') ? rawUrl.replace('file:', '') : rawUrl;
  const resolvedPath = path.resolve(process.cwd(), cleanPath);

  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return resolvedPath;
}

export function getDatabase(dbPath?: string): DatabaseSync {
  validateDatabaseEnvironment();

  if (dbInstance) {
    return dbInstance;
  }

  const targetPath = dbPath ?? getDatabasePath();
  Logger.info(`Connecting to SQLite database: ${targetPath}`);

  const db = new DatabaseSync(targetPath);

  // Performance and integrity pragmas
  db.exec('PRAGMA foreign_keys = ON;');
  if (targetPath !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL;');
  }
  db.exec('PRAGMA synchronous = NORMAL;');

  dbInstance = db;
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch (e) {
      Logger.warn('Error closing SQLite database', { error: e });
    }
    dbInstance = null;
    Logger.info('SQLite database connection closed.');
  }
  // Also close PostgreSQL pool if open
  closePgPool().catch(() => {});
}
