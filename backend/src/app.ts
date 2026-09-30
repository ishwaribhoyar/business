import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import healthRoutes from './routes/healthRoutes.js';
import apiV1Routes from './routes/index.js';
import { HealthController } from './controllers/healthController.js';
import { NotFoundError } from './utils/errors.js';

export function createApp(): Express {
  const app = express();

  // 1. Security Headers (Helmet)
  app.use(
    helmet({
      contentSecurityPolicy: false, // Don't break API or embedded SPA client
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. Cross-Origin Resource Sharing (CORS with strict origin verification)
  const allowedOrigins = new Set(config.corsOrigins);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.has('*') ||
          allowedOrigins.has(origin) ||
          origin.endsWith('.onrender.com') ||
          !config.isProduction
        ) {
          return callback(null, true);
        }
        return callback(new Error(`Origin '${origin}' not allowed by CORS policy.`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 3. Body Parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 4. Request Logging
  app.use(requestLogger);

  // 5. Rate Limiting (Disabled in test environment to avoid test throttling)
  if (!config.isTest) {
    const apiLimiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP, please try again later.',
        },
      },
    });

    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: config.rateLimit.authMax, // 10 attempts
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: {
          code: 'AUTH_RATE_LIMIT_EXCEEDED',
          message: 'Too many failed login attempts, please try again in 15 minutes.',
        },
      },
    });

    const quoteLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 30, // 30 quote requests per 15 minutes
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        error: {
          code: 'QUOTE_RATE_LIMIT_EXCEEDED',
          message: 'Too many quote requests submitted. Please wait a few moments or contact support directly.',
        },
      },
    });

    app.use('/api/v1/auth/login', authLimiter);
    app.use('/api/v1/orders/quote-request', quoteLimiter);
    app.use('/api/v1/', apiLimiter);
  }

  // 6. Root & Health/Readiness Check Routes
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      service: 'nagpur-materials-marketplace-api',
      status: 'ONLINE',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        ready: '/ready',
        catalog: '/api/v1/catalog/categories',
      },
    });
  });
  app.use('/health', healthRoutes);
  app.get('/ready', HealthController.getReadiness);

  // 7. Versioned API Routes (/api/v1) and un-prefixed alias
  app.use('/api/v1', apiV1Routes);
  app.use('/', apiV1Routes);

  // 8. Unmatched Route Handler (404)
  app.use((req, _res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.path}`));
  });

  // 9. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
