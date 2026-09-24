import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';
import { Logger } from '../utils/logger.js';

let dbInstance: DatabaseSync | null = null;

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
    dbInstance.close();
    dbInstance = null;
    Logger.info('SQLite database connection closed.');
  }
}
