import { Request, Response, NextFunction } from 'express';
import { monitoringService } from '../services/monitoring-service';
import { logger } from '../utils/logger';

/**
 * Middleware to track API requests and performance
 */
export const monitoringMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip monitoring for health check endpoints to avoid noise
    if (req.path.startsWith('/health') || req.path.startsWith('/api/health')) {
      return next();
    }
    
    // Record start time
    const startTime = Date.now();
    
    // Store original end method
    const originalEnd = res.end;
    
    // Override end method to capture response time
    res.end = function(chunk?: any, encoding?: any, callback?: any): any {
      // Restore original end method
      res.end = originalEnd;
      
      // Calculate response time
      const responseTime = Date.now() - startTime;
      
      // Track API request
      monitoringService.trackApiRequest({
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      });
      
      // Log request (only for non-health check endpoints)
      if (responseTime > 1000) {
        logger.warn(`Slow request: ${req.method} ${req.path} (${responseTime}ms)`, {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          responseTime,
        });
      } else {
        logger.debug(`Request: ${req.method} ${req.path} (${responseTime}ms)`, {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          responseTime,
        });
      }
      
      // Call original end method
      return originalEnd.call(this, chunk, encoding, callback);
    };
    
    next();
  };
};

/**
 * Middleware to handle errors and track them in monitoring service
 */
export const errorMonitoringMiddleware = () => {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    // Track error
    monitoringService.trackError(err, {
      endpoint: req.path,
      method: req.method,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
    
    // Log error
    logger.error(`Error in ${req.method} ${req.path}:`, {
      error: err.message,
      stack: err.stack,
    });
    
    // Continue to next error handler
    next(err);
  };
};
