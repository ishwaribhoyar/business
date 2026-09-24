import { createApp } from './app.js';
import { config } from './config/index.js';
import { Logger } from './utils/logger.js';
import { getDatabase, closeDatabase } from './db/connection.js';
import { runMigrations } from './db/migrate.js';
import { runSeeds } from './db/seed.js';

async function bootstrap() {
  try {
    Logger.info(`Starting Digital Building-Material Marketplace API [${config.env}]...`);

    // Ensure database connection and baseline migration/seeds
    const db = getDatabase();
    runMigrations(db);
    runSeeds(db);

    const app = createApp();

    const server = app.listen(config.port, config.host, () => {
      Logger.info(`Server successfully listening on http://${config.host}:${config.port}`);
      Logger.info(`Health check available at http://${config.host}:${config.port}/health`);
      Logger.info(`API v1 root available at http://${config.host}:${config.port}/api/v1`);
    });

    // Graceful shutdown handling
    const shutdown = (signal: string) => {
      Logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        closeDatabase();
        Logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    Logger.error('Failed to start server', error);
    process.exit(1);
  }
}

bootstrap();
