import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache-service';
import { logger } from '../utils/logger';

interface CacheOptions {
  ttl?: number;
  keyPrefix?: string;
  vary?: string[];
}

export function cacheMiddleware(options: CacheOptions = {}) {
  const { 
    ttl = 900, // 15 minutes default TTL
    keyPrefix = 'api:', 
    vary = ['accept', 'accept-encoding']
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests or if force refresh is requested
    if (req.method !== 'GET' || req.query._t) {
      return next();
    }

    // Generate cache key including vary headers
    const varyHeaders = vary.map(header => req.get(header) || '').join(':');
    const cacheKey = `${keyPrefix}${req.originalUrl}:${varyHeaders}`;

    try {
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        // Set cache control headers
        res.setHeader('Cache-Control', `public, max-age=${ttl}`);
        res.setHeader('Vary', vary.join(', '));
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('ETag', `"${Buffer.from(JSON.stringify(cachedData)).toString('base64')}"`)
        return res.json(cachedData);
      }

      // Store original res.json to intercept the response
      const originalJson = res.json.bind(res);
      res.json = function(body: any): Response {
        // Set cache headers
        res.setHeader('Cache-Control', `public, max-age=${ttl}`);
        res.setHeader('Vary', vary.join(', '));
        res.setHeader('X-Cache', 'MISS');
        res.setHeader('ETag', `"${Buffer.from(JSON.stringify(body)).toString('base64')}"`)

        // Store in cache
        cacheService.set(cacheKey, body, ttl).catch(error => {
          logger.error('Failed to store in cache:', error);
        });

        // Call original json method
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
}

export function clearCacheMiddleware(pattern: string) {
  return async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await cacheService.deletePattern(pattern);
      next();
    } catch (error) {
      logger.error('Clear cache middleware error:', error);
      next();
    }
  };
}

export function invalidateCacheMiddleware(patterns: string[]) {
  return async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await Promise.all(patterns.map(pattern => cacheService.deletePattern(pattern)));
      next();
    } catch (error) {
      logger.error('Invalidate cache middleware error:', error);
      next();
    }
  };
}
