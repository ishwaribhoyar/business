import { Request, Response } from 'express';
import { ResponseFormatter } from '../utils/response.js';
import { getDatabase } from '../db/connection.js';

export class HealthController {
  static getHealth(_req: Request, res: Response): void {
    ResponseFormatter.success(res, {
      status: 'UP',
      service: 'nagpur-materials-marketplace-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  static getReadiness(_req: Request, res: Response): void {
    try {
      const db = getDatabase();
      // Test basic database readiness query
      const stmt = db.prepare('SELECT 1 as ready');
      const result = stmt.get() as { ready: number };

      if (result && result.ready === 1) {
        ResponseFormatter.success(res, {
          status: 'READY',
          database: 'CONNECTED',
          timestamp: new Date().toISOString(),
        });
      } else {
        ResponseFormatter.error(res, 'Database query failed', 503, 'SERVICE_UNAVAILABLE');
      }
    } catch (error) {
      ResponseFormatter.error(res, 'Database connectivity error', 503, 'SERVICE_UNAVAILABLE', {
        error: error instanceof Error ? error.message : 'Unknown DB error',
      });
    }
  }
}
