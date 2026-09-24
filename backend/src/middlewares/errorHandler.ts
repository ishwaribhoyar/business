import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { ResponseFormatter } from '../utils/response.js';
import { Logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // If the error is an operational AppError, use its defined code and status
  if (err instanceof AppError) {
    Logger.warn(`Operational Error: ${err.errorCode} - ${err.message}`, {
      path: req.path,
      method: req.method,
      statusCode: err.statusCode,
      details: err.details,
    });

    ResponseFormatter.error(
      res,
      err.message,
      err.statusCode,
      err.errorCode,
      err.details
    );
    return;
  }

  // Handle unexpected or database errors safely
  Logger.error(`Unhandled Exception: ${err.message}`, err, {
    path: req.path,
    method: req.method,
  });

  const safeMessage = config.isProduction
    ? 'An unexpected internal error occurred. Please contact system support.'
    : err.message;

  ResponseFormatter.error(
    res,
    safeMessage,
    500,
    'INTERNAL_SERVER_ERROR',
    config.isDevelopment ? { stack: err.stack } : undefined
  );
}
