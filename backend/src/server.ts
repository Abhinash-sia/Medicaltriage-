import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { logger } from './lib/logger.js';
import { bootstrapInitialAdmin } from './modules/admin/admin.bootstrap.js';

const startServer = async () => {
  // Connect to MongoDB
  await connectDatabase();

  // Ensure initial Root Hospital Administrator is provisioned
  await bootstrapInitialAdmin();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`Sevansh Backend listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown sequence...`);

    server.close(async () => {
      logger.info('HTTP server stopped accepting new incoming requests');
      await disconnectDatabase();
      logger.info('Graceful shutdown completed. Exiting process.');
      process.exit(0);
    });

    // Force exit if shutdown hangs beyond 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

startServer().catch((err) => {
  logger.fatal({ err }, 'Failed to start backend server');
  process.exit(1);
});
