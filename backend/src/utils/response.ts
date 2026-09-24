import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: string;
  };
}

export class ResponseFormatter {
  static success<T>(res: Response, data: T, statusCode = 200, meta?: Omit<NonNullable<ApiResponse['meta']>, 'timestamp'>): void {
    const responsePayload: ApiResponse<T> = {
      success: true,
      data,
      meta: {
        ...meta,
        timestamp: new Date().toISOString(),
      },
    };
    res.status(statusCode).json(responsePayload);
  }

  static error(res: Response, message: string, statusCode = 500, errorCode = 'ERROR', details?: unknown): void {
    const responsePayload: ApiResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
    res.status(statusCode).json(responsePayload);
  }
}
