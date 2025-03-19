import { Request, Response, NextFunction } from 'express';
import cache from '../utils/cacheUtils';

/**
 * Middleware to cache API responses
 * 
 * @param ttlSeconds Time to live in seconds
 * @returns Express middleware function
 */
export function cacheMiddleware(ttlSeconds: number = 300) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }
    
    // Create a cache key from the request URL and query parameters
    const cacheKey = `${req.originalUrl || req.url}`;
    
    try {
      // Try to get the cached response
      const cachedResponse = cache.get<any>(cacheKey);
      
      if (cachedResponse) {
        // Return the cached response
        res.status(200).json(cachedResponse);
        return;
      }
      
      // Store the original json method
      const originalJson = res.json;
      
      // Override the json method to cache the response
      res.json = function(body: any): Response {
        // Cache the response
        cache.set(cacheKey, body, ttlSeconds);
        
        // Call the original json method
        return originalJson.call(this, body);
      };
      
      // Continue to the next middleware
      next();
    } catch (error) {
      // If there's an error, just continue without caching
      next();
    }
  };
}

/**
 * Middleware to clear the cache for a specific endpoint
 * 
 * @param endpoint Endpoint path (e.g., '/api/campaigns')
 * @returns Express middleware function
 */
export function clearCacheMiddleware(endpoint: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Create a cache key from the endpoint
    const cacheKey = endpoint;
    
    // Delete the cached response
    cache.delete(cacheKey);
    
    // Continue to the next middleware
    next();
  };
}
