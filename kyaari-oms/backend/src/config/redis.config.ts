import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';
import { env } from './env';

class RedisConfig {
  private client: RedisClientType | null = null;
  private isConnected = false;

  /**
   * Get Redis connection URL from environment
   */
  private getRedisUrl(): string {
    // Default to localhost if not specified
    const host = process.env.REDIS_HOST || 'localhost';
    const port = process.env.REDIS_PORT || '6379';
    const password = process.env.REDIS_PASSWORD;
    const db = process.env.REDIS_DB || '0';

    if (password) {
      return `redis://:${password}@${host}:${port}/${db}`;
    }
    return `redis://${host}:${port}/${db}`;
  }

  /**
   * Initialize Redis client
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      logger.info('Redis already connected');
      return;
    }

    try {
      this.client = createClient({
        url: this.getRedisUrl(),
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              logger.error('Redis reconnection failed after 10 retries');
              return new Error('Redis reconnection limit exceeded');
            }
            // Exponential backoff: 100ms, 200ms, 400ms, etc.
            return Math.min(retries * 100, 3000);
          },
        },
      });

      // Error handlers
      this.client.on('error', (err: Error) => {
        logger.error('Redis Client Error', { error: err });
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis client connecting...');
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        logger.warn('Redis client reconnecting...');
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.warn('Redis client disconnected');
        this.isConnected = false;
      });

      // Connect to Redis
      await this.client.connect();
      logger.info('Redis connection established successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis', { error });
      this.isConnected = false;
      // Don't throw - allow app to continue without Redis
      logger.warn('Application will continue without Redis caching');
    }
  }

  /**
   * Get Redis client
   */
  getClient(): RedisClientType | null {
    return this.client;
  }

  /**
   * Check if Redis is connected
   */
  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Disconnect Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        this.isConnected = false;
        logger.info('Redis disconnected successfully');
      } catch (error) {
        logger.error('Error disconnecting Redis', { error });
      }
    }
  }
}

export const redisConfig = new RedisConfig();
export type { RedisClientType };

