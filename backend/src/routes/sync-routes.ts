import { Router } from 'express';
import { syncController } from '../controllers/sync-controller';
import { cacheMiddleware, invalidateCacheMiddleware } from '../middleware/cache-middleware';

const router = Router();

// Start sync for all entities
router.post('/all', 
  invalidateCacheMiddleware(['api:/campaigns*', 'api:/flows*', 'api:/forms*', 'api:/segments*']),
  syncController.syncAll
);

// Start sync for specific entity
router.post('/:entity', 
  invalidateCacheMiddleware(['api:/:entity*']),
  syncController.syncEntity
);

// Get sync status
router.get('/status',
  cacheMiddleware({ ttl: 30 }), // Cache for 30 seconds
  syncController.getSyncStatus
);

// Get sync status by ID
router.get('/status/:id',
  cacheMiddleware({ ttl: 30 }), // Cache for 30 seconds
  syncController.getSyncStatus
);

// Get latest sync status for entity
router.get('/:entity/status/latest',
  cacheMiddleware({ ttl: 30 }), // Cache for 30 seconds
  syncController.getLatestSyncStatus
);

export default router;
