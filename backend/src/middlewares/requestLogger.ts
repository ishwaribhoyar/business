import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger.js';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    // Do not log health endpoint spam unless error
    if (req.path.startsWith('/health') && res.statusCode < 400) {
      return;
    }

    Logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
      ip: req.ip,
    });
  });

  next();
}
