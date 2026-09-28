import pg from 'pg';
import { config } from '../config/index.js';
import { Logger } from '../utils/logger.js';

const { Pool } = pg;

let pgPoolInstance: pg.Pool | null = null;

export interface PgPoolConfigOptions {
  connectionString?: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

/**
 * Determines whether SSL should be enabled based on environment and connection string
 */
export function shouldEnableSsl(url?: string): boolean {
  if (!url) return false;
  // Render PostgreSQL, AWS RDS, Heroku, Supabase, Neon all require SSL
  if (
    config.isProduction ||
    url.includes('render.com') ||
    url.includes('supabase.co') ||
    url.includes('neon.tech') ||
    url.includes('sslmode=require') ||
    url.includes('ssl=true')
  ) {
    return true;
  }
  return false;
}

/**
 * Returns a singleton PostgreSQL connection pool
 */
export function getPgPool(customConfig?: PgPoolConfigOptions): pg.Pool {
  if (pgPoolInstance) {
    return pgPoolInstance;
  }

  const rawUrl = customConfig?.connectionString || config.databaseUrl;
  const isPostgresUrl = rawUrl.startsWith('postgres://') || rawUrl.startsWith('postgresql://');

  if (!isPostgresUrl) {
    throw new Error(
      `Cannot initialize PostgreSQL pool with non-PostgreSQL DATABASE_URL: '${rawUrl}'. ` +
      `URL must start with postgres:// or postgresql://`
    );
  }

  const useSsl = customConfig?.ssl ?? (shouldEnableSsl(rawUrl) ? { rejectUnauthorized: false } : undefined);

  const poolConfig: pg.PoolConfig = {
    connectionString: rawUrl,
    max: customConfig?.max ?? parseInt(process.env.PG_POOL_MAX || '20', 10),
    idleTimeoutMillis: customConfig?.idleTimeoutMillis ?? parseInt(process.env.PG_IDLE_TIMEOUT_MS || '30000', 10),
    connectionTimeoutMillis: customConfig?.connectionTimeoutMillis ?? parseInt(process.env.PG_CONN_TIMEOUT_MS || '5000', 10),
    ssl: useSsl,
  };

  Logger.info(`Initializing PostgreSQL connection pool (max: ${poolConfig.max}, ssl: ${!!useSsl})`);

  const pool = new Pool(poolConfig);

  // Prevent idle client errors from crashing the Node.js process
  pool.on('error', (err) => {
    Logger.error('Unexpected error on idle PostgreSQL client', err);
  });

  pgPoolInstance = pool;
  return pgPoolInstance;
}

/**
 * Sets a custom pg.Pool instance (e.g. for testing with pg-mem)
 */
export function setPgPoolInstance(pool: pg.Pool | null): void {
  pgPoolInstance = pool;
}

/**
 * Executes a parameterized query using the pool
 */
export async function queryPg<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  const pool = getPgPool();
  return pool.query<T>(text, params);
}

/**
 * Executes an operation inside a dedicated PostgreSQL transaction client
 */
export async function withPgTransaction<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPgPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      Logger.error('Failed to rollback PostgreSQL transaction', rollbackErr);
    }
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Tests PostgreSQL connectivity with a fast SELECT 1 probe
 */
export async function testPgConnection(): Promise<boolean> {
  try {
    const pool = getPgPool();
    const result = await pool.query('SELECT 1 as ready');
    return result.rows.length > 0 && result.rows[0].ready === 1;
  } catch (error) {
    Logger.warn('PostgreSQL readiness check failed', { error });
    return false;
  }
}

/**
 * Closes the PostgreSQL connection pool gracefully
 */
export async function closePgPool(): Promise<void> {
  if (pgPoolInstance) {
    try {
      await pgPoolInstance.end();
      Logger.info('PostgreSQL connection pool closed cleanly.');
    } catch (err) {
      Logger.error('Error closing PostgreSQL connection pool', err);
    } finally {
      pgPoolInstance = null;
    }
  }
}
