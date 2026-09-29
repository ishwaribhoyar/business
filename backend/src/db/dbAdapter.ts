import { DatabaseSync } from 'node:sqlite';
import { AsyncLocalStorage } from 'node:async_hooks';
import pg from 'pg';
import { getDatabase, isPostgresConfigured } from './connection.js';
import { getPgPool } from './pgPool.js';
import { Logger } from '../utils/logger.js';

const pgTxStorage = new AsyncLocalStorage<pg.PoolClient>();

export function convertPlaceholdersToPg(sql: string): string {
  let paramIndex = 1;
  let inString = false;
  let quoteChar = '';
  let result = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (inString) {
      result += char;
      if (char === quoteChar) {
        if (i + 1 < sql.length && sql[i + 1] === quoteChar) {
          result += sql[++i];
        } else {
          inString = false;
        }
      }
    } else {
      if (char === "'" || char === '"') {
        inString = true;
        quoteChar = char;
        result += char;
      } else if (char === '?') {
        result += '$' + paramIndex++;
      } else {
        result += char;
      }
    }
  }

  // Replace boolean column literal expressions for PostgreSQL compatibility
  return result
    .replace(/\bis_active\s*=\s*1\b/gi, 'is_active = TRUE')
    .replace(/\bis_active\s*=\s*0\b/gi, 'is_active = FALSE');
}

export class DbAdapter {
  get isPostgres(): boolean {
    return isPostgresConfigured();
  }

  // -------------------------------------------------------------
  // Single-Row Query
  // -------------------------------------------------------------
  get<T = any>(sql: string, params: any[] = [], client?: pg.PoolClient): Promise<T | null> | (T | null) {
    if (this.isPostgres) {
      return (async () => {
        const pgSql = convertPlaceholdersToPg(sql);
        const executor = client ?? pgTxStorage.getStore() ?? getPgPool();
        const res = await executor.query(pgSql, params);
        return (res.rows[0] as unknown as T) ?? null;
      })();
    }

    const db = getDatabase();
    const stmt = db.prepare(sql);
    const row = stmt.get(...params);
    return (row as unknown as T) ?? null;
  }

  // -------------------------------------------------------------
  // Multi-Row Query
  // -------------------------------------------------------------
  all<T = any>(sql: string, params: any[] = [], client?: pg.PoolClient): Promise<T[]> | T[] {
    if (this.isPostgres) {
      return (async () => {
        const pgSql = convertPlaceholdersToPg(sql);
        const executor = client ?? pgTxStorage.getStore() ?? getPgPool();
        const res = await executor.query(pgSql, params);
        return (res.rows as unknown as T[]) ?? [];
      })();
    }

    const db = getDatabase();
    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);
    return (rows as unknown as T[]) ?? [];
  }

  // -------------------------------------------------------------
  // Execution (INSERT, UPDATE, DELETE)
  // -------------------------------------------------------------
  run(
    sql: string,
    params: any[] = [],
    client?: pg.PoolClient
  ): Promise<{ changes: number }> | { changes: number } {
    if (this.isPostgres) {
      return (async () => {
        const pgSql = convertPlaceholdersToPg(sql);
        const executor = client ?? pgTxStorage.getStore() ?? getPgPool();
        const res = await executor.query(pgSql, params);
        return { changes: res.rowCount ?? 0 };
      })();
    }

    const db = getDatabase();
    const stmt = db.prepare(sql);
    const info = stmt.run(...params);
    return { changes: Number(info.changes) };
  }

  // -------------------------------------------------------------
  // Raw DDL / Script Execution
  // -------------------------------------------------------------
  exec(sql: string, client?: pg.PoolClient): Promise<void> | void {
    if (this.isPostgres) {
      return (async () => {
        const executor = client ?? pgTxStorage.getStore() ?? getPgPool();
        await executor.query(sql);
      })();
    }

    const db = getDatabase();
    db.exec(sql);
  }

  // -------------------------------------------------------------
  // Transaction Support (Dedicated PG client or SQLite IMMEDIATE)
  // -------------------------------------------------------------
  async transaction<T>(callback: (trx: DbAdapter, client?: pg.PoolClient) => Promise<T> | T): Promise<T> {
    if (this.isPostgres) {
      const pool = getPgPool();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await pgTxStorage.run(client, async () => callback(this, client));
        await client.query('COMMIT');
        return result;
      } catch (error) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackErr) {
          Logger.error('Failed to rollback PostgreSQL transaction in DbAdapter', rollbackErr);
        }
        throw error;
      } finally {
        client.release();
      }
    } else {
      const db = getDatabase();
      db.exec('BEGIN IMMEDIATE;');
      try {
        const result = await callback(this);
        db.exec('COMMIT;');
        return result;
      } catch (error) {
        try {
          db.exec('ROLLBACK;');
        } catch {}
        throw error;
      }
    }
  }
}

export const dbAdapter = new DbAdapter();
