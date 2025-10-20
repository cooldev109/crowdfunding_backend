import app from './app';
import { ENV } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './config/logger';

const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Start Express server
    const server = app.listen(ENV.PORT, () => {
      logger.info(`Server running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`);
      logger.info(`API available at http://localhost:${ENV.PORT}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await disconnectDatabase();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error({ err: error }, 'Error during graceful shutdown');
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: Error) => {
      logger.error({ err: reason }, 'Unhandled Rejection');
      throw reason;
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error({ err: error }, 'Uncaught Exception');
      process.exit(1);
    });

  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
};

startServer();
