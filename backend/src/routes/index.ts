import { Router, Request, Response, NextFunction } from 'express';
import { cacheMiddleware } from '../middleware/cache-middleware';
import { monitoringMiddleware, errorMonitoringMiddleware } from '../middleware/monitoring-middleware';
import syncRoutes from './sync-routes';
import monitoringRoutes from './monitoring-routes';

const router = Router();

// Health check endpoint
router.get('/health', (_, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Apply monitoring middleware to track API requests
router.use(monitoringMiddleware());

// Mount sync routes
router.use('/sync', syncRoutes);

// Mount monitoring routes
router.use('/monitoring', monitoringRoutes);

// Apply cache middleware to all GET endpoints except health, sync, and monitoring
router.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET' && 
      !req.path.startsWith('/health') && 
      !req.path.startsWith('/sync') &&
      !req.path.startsWith('/monitoring')) {
    cacheMiddleware()(req, res, next);
    return;
  }
  next();
});

// Apply error monitoring middleware
router.use(errorMonitoringMiddleware());

export default router;
