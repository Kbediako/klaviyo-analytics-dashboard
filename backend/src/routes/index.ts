import { Router, Request, Response, NextFunction } from 'express';
import { cacheMiddleware } from '../middleware/cache-middleware';
import syncRoutes from './sync-routes';

const router = Router();

// Health check endpoint
router.get('/health', (_, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mount sync routes
router.use('/sync', syncRoutes);

// Apply cache middleware to all GET endpoints except health and sync
router.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'GET' && !req.path.startsWith('/health') && !req.path.startsWith('/sync')) {
    cacheMiddleware()(req, res, next);
    return;
  }
  next();
});

export default router;
