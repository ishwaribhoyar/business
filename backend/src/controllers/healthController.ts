import { Request, Response } from 'express';
import { ResponseFormatter } from '../utils/response.js';
import { getDatabase, isPostgresConfigured } from '../db/connection.js';
import { getPgPool } from '../db/pgPool.js';

export class HealthController {
  static getHealth(_req: Request, res: Response): void {
    ResponseFormatter.success(res, {
      status: 'UP',
      service: 'nagpur-materials-marketplace-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  static async getReadiness(_req: Request, res: Response): Promise<void> {
    try {
      if (isPostgresConfigured()) {
        const pool = getPgPool();
        const result = await pool.query('SELECT 1 as ready');
        if (result && result.rows.length > 0 && (Number(result.rows[0].ready) === 1)) {
          ResponseFormatter.success(res, {
            status: 'READY',
            database: 'CONNECTED',
            engine: 'POSTGRESQL',
            timestamp: new Date().toISOString(),
          });
          return;
        }
      } else {
        const db = getDatabase();
        const stmt = db.prepare('SELECT 1 as ready');
        const result = stmt.get() as { ready: number };

        if (result && result.ready === 1) {
          ResponseFormatter.success(res, {
            status: 'READY',
            database: 'CONNECTED',
            engine: 'SQLITE',
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }
      ResponseFormatter.error(res, 'Database query failed', 503, 'SERVICE_UNAVAILABLE');
    } catch (error) {
      ResponseFormatter.error(res, 'Database connectivity error', 503, 'SERVICE_UNAVAILABLE', {
        error: error instanceof Error ? error.message : 'Unknown DB error',
      });
    }
  }
}
