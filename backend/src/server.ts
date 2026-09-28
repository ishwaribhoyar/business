import { createApp } from './app.js';
import { config } from './config/index.js';
import { Logger } from './utils/logger.js';
import { getDatabase, closeDatabase, isPostgresConfigured, validateDatabaseEnvironment } from './db/connection.js';
import { runMigrations } from './db/migrate.js';
import { runSeeds } from './db/seed.js';
import { runPgMigrations } from './db/pgMigrate.js';
import { bootstrapAdminUser } from './scripts/bootstrapAdmin.js';
import { testPgConnection, closePgPool } from './db/pgPool.js';

async function bootstrap() {
  try {
    Logger.info(`Starting Digital Building-Material Marketplace API [${config.env}]...`);

    // 1. Strict production database validation
    validateDatabaseEnvironment();

    // 2. Initialize Database based on environment
    if (isPostgresConfigured()) {
      Logger.info('PostgreSQL environment detected. Running PostgreSQL migrations...');
      await runPgMigrations();
      const isReady = await testPgConnection();
      if (!isReady) {
        throw new Error('Failed to verify initial PostgreSQL connectivity.');
      }
      Logger.info('PostgreSQL connectivity verified.');

      // Bootstrap initial SUPER_ADMIN if needed
      await bootstrapAdminUser();
    } else {
      Logger.info('SQLite environment active (development/test). Initializing SQLite...');
      const db = getDatabase();
      runMigrations(db);
      runSeeds(db);
    }

    // 3. Initialize Express App
    const app = createApp();

    const server = app.listen(config.port, config.host, () => {
      Logger.info(`Server successfully listening on http://${config.host}:${config.port}`);
      Logger.info(`Liveness probe: http://${config.host}:${config.port}/health`);
      Logger.info(`Readiness probe: http://${config.host}:${config.port}/ready`);
      Logger.info(`API v1 root: http://${config.host}:${config.port}/api/v1`);
    });

    // 4. Graceful shutdown handling (SIGTERM for Render, SIGINT for local dev)
    const shutdown = async (signal: string) => {
      Logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        closeDatabase();
        await closePgPool();
        Logger.info('HTTP server and database connections closed cleanly.');
        process.exit(0);
      });

      // Force exit after 10s timeout if hung
      setTimeout(() => {
        Logger.error('Graceful shutdown timed out after 10 seconds. Forcing process exit.');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    Logger.error('Failed to start server', error);
    process.exit(1);
  }
}

bootstrap();
