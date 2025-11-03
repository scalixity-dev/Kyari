import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './config/database';
import { redisConfig } from './config/redis.config';
import { SchedulerService } from './services/scheduler.service';
import { initializeFirebase } from './config/firebase.config';
import { createServer } from 'http';
import { TicketChatGateway } from './modules/tickets/ticket-chat.gateway';

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Initialize Redis if enabled
    if (env.REDIS_ENABLED) {
      await redisConfig.connect();
      logger.info('Redis caching enabled');
    } else {
      logger.info('Redis caching disabled');
    }

    // Initialize Firebase for notifications
    const firebaseInitialized = initializeFirebase();
    if (firebaseInitialized) {
      logger.info('🔥 Firebase initialized successfully for notifications');
    } else {
      logger.warn('Firebase initialization skipped - notifications will be simulated');
    }

    // Initialize and start token cleanup scheduler
    const scheduler = SchedulerService.getInstance();
    scheduler.startTokenCleanup();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize WebSocket gateway for ticket chat
    const ticketChatGateway = new TicketChatGateway(httpServer);
    logger.info('📡 WebSocket gateway initialized for ticket chat');

    // Start server
    const server = httpServer.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT}`);
      logger.info(`📍 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${env.PORT}/health`);
      logger.info(`💬 WebSocket available at ws://localhost:${env.PORT}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);
      
      // Stop scheduler
      scheduler.stopTokenCleanup();
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          // Disconnect Redis
          if (env.REDIS_ENABLED) {
            await redisConfig.disconnect();
          }
          
          // Disconnect database
          await prisma.$disconnect();
          logger.info('Database disconnected');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error });
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();