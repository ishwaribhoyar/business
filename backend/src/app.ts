import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/index.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import healthRoutes from './routes/healthRoutes.js';
import apiV1Routes from './routes/index.js';
import { NotFoundError } from './utils/errors.js';

export function createApp(): Express {
  const app = express();

  // 1. Security Headers (Helmet)
  app.use(helmet());

  // 2. Cross-Origin Resource Sharing (CORS)
  app.use(
    cors({
      origin: [config.clientUrl, 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
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

  // 5. Root & Health Check Routes
  app.use('/health', healthRoutes);

  // 6. Versioned API Routes (/api/v1)
  app.use('/api/v1', apiV1Routes);

  // 7. Unmatched Route Handler (404)
  app.use((req, _res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.path}`));
  });

  // 8. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
