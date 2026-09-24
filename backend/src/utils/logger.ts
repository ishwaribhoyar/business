import { config } from '../config/index.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Keys to redact from logs to protect sensitive PII and credentials
const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'token',
  'jwt',
  'secret',
  'authorization',
  'cookie',
  'api_key',
  'apikey',
]);

function sanitize(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitize);

  const sanitizedObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitizedObj[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      sanitizedObj[key] = sanitize(value);
    } else {
      sanitizedObj[key] = value;
    }
  }
  return sanitizedObj;
}

export class Logger {
  private static formatLog(level: LogLevel, message: string, context?: unknown) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...(context ? { context: sanitize(context) } : {}),
      env: config.env,
    });
  }

  private static shouldLog(level: LogLevel): boolean {
    const currentConfigLevel = config.logging.level as LogLevel;
    return (LOG_PRIORITY[level] ?? 1) >= (LOG_PRIORITY[currentConfigLevel] ?? 1);
  }

  static debug(message: string, context?: unknown): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatLog('debug', message, context));
    }
  }

  static info(message: string, context?: unknown): void {
    if (this.shouldLog('info')) {
      console.info(this.formatLog('info', message, context));
    }
  }

  static warn(message: string, context?: unknown): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatLog('warn', message, context));
    }
  }

  static error(message: string, error?: unknown, context?: unknown): void {
    if (this.shouldLog('error')) {
      const errorDetails = error instanceof Error
        ? { name: error.name, message: error.message, stack: config.isDevelopment ? error.stack : undefined }
        : error;
      console.error(this.formatLog('error', message, { error: errorDetails, ...((context as object) || {}) }));
    }
  }
}
