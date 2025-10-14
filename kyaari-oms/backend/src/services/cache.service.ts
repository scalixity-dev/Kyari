import { redisConfig, RedisClientType } from '../config/redis.config';
import { logger } from '../utils/logger';

export class CacheService {
  private redis: RedisClientType | null = null;

  constructor() {
    this.redis = redisConfig.getClient();
  }

  /**
   * Check if cache is available
   */
  private isAvailable(): boolean {
    return redisConfig.isReady() && this.redis !== null;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const value = await this.redis!.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Redis GET error', { error, key });
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL (in seconds)
   */
  async set(key: string, value: unknown, ttl?: number): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redis!.setEx(key, ttl, serialized);
      } else {
        await this.redis!.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error('Redis SET error', { error, key });
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await this.redis!.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error', { error, key });
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async delPattern(pattern: string): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      const keys = await this.redis!.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      await this.redis!.del(keys);
      return keys.length;
    } catch (error) {
      logger.error('Redis DEL pattern error', { error, pattern });
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.redis!.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error', { error, key });
      return false;
    }
  }

  /**
   * Get or set pattern - retrieve from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 300 // Default 5 minutes
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      logger.debug('Cache HIT', { key });
      return cached;
    }

    // Cache miss - fetch data
    logger.debug('Cache MISS', { key });
    const data = await fetchFn();

    // Store in cache (fire and forget - don't wait)
    this.set(key, data, ttl).catch((err) =>
      logger.error('Failed to cache data', { error: err, key })
    );

    return data;
  }

  /**
   * Invalidate cache by pattern (e.g., "orders:*")
   */
  async invalidate(pattern: string): Promise<void> {
    const deleted = await this.delPattern(pattern);
    if (deleted > 0) {
      logger.info('Cache invalidated', { pattern, deletedKeys: deleted });
    }
  }

  /**
   * Clear all cache
   */
  async flush(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await this.redis!.flushDb();
      logger.info('Redis cache flushed');
      return true;
    } catch (error) {
      logger.error('Redis FLUSH error', { error });
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    dbSize: number;
  } | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const dbSize = await this.redis!.dbSize();
      return {
        connected: true,
        dbSize,
      };
    } catch (error) {
      logger.error('Redis STATS error', { error });
      return null;
    }
  }
}

export const cacheService = new CacheService();

