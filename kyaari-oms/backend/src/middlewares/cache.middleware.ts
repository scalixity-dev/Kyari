import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache.service';
import { logger } from '../utils/logger';

/**
 * Cache middleware for GET requests
 * Caches responses based on request URL and query parameters
 */
export const cacheMiddleware = (ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key from URL and query params
      const cacheKey = generateCacheKey(req);

      // Try to get from cache
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        logger.debug('Cache hit', { key: cacheKey });
        return res.json(cachedData);
      }

      // Cache miss - store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (body: unknown) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, body, ttl).catch((err) =>
            logger.error('Failed to cache response', { error: err, key: cacheKey })
          );
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', { error });
      // Continue without caching on error
      next();
    }
  };
};

/**
 * Generate cache key from request
 */
function generateCacheKey(req: Request): string {
  const userId = (req as any).user?.userId || 'anonymous';
  const url = req.originalUrl || req.url;
  const queryString = JSON.stringify(req.query);
  
  return `api:${userId}:${url}:${queryString}`;
}

/**
 * Cache invalidation middleware
 * Invalidates cache based on patterns when data is modified
 */
export const invalidateCache = (patterns: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original send/json methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // Override to invalidate cache after successful response
    const invalidateCacheAfterResponse = async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        for (const pattern of patterns) {
          await cacheService.invalidate(pattern);
        }
      }
    };

    res.json = function (body: unknown) {
      invalidateCacheAfterResponse().catch((err) =>
        logger.error('Cache invalidation error', { error: err, patterns })
      );
      return originalJson(body);
    };

    res.send = function (body: unknown) {
      invalidateCacheAfterResponse().catch((err) =>
        logger.error('Cache invalidation error', { error: err, patterns })
      );
      return originalSend(body);
    };

    next();
  };
};

/**
 * User-specific cache middleware
 */
export const userCache = (ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return next();
      }

      const cacheKey = `user:${userId}:${req.originalUrl || req.url}:${JSON.stringify(req.query)}`;
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        logger.debug('User cache hit', { key: cacheKey, userId });
        return res.json(cachedData);
      }

      const originalJson = res.json.bind(res);
      res.json = function (body: unknown) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, body, ttl).catch((err) =>
            logger.error('Failed to cache user data', { error: err, key: cacheKey })
          );
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('User cache middleware error', { error });
      next();
    }
  };
};

