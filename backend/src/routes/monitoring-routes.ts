import { Router } from 'express';
import { monitoringController } from '../controllers/monitoring-controller';
import { cacheMiddleware } from '../middleware/cache-middleware';

const router = Router();

/**
 * @route GET /monitoring/health
 * @desc Get detailed health check information
 * @access Private
 */
router.get('/health', monitoringController.getHealth);

/**
 * @route GET /monitoring/metrics
 * @desc Get system metrics
 * @access Private
 */
router.get('/metrics', cacheMiddleware({ ttl: 60 }), monitoringController.getMetrics);

/**
 * @route GET /monitoring/api-metrics
 * @desc Get API metrics
 * @access Private
 */
router.get('/api-metrics', cacheMiddleware({ ttl: 60 }), monitoringController.getApiMetrics);

/**
 * @route GET /monitoring/errors
 * @desc Get error metrics
 * @access Private
 */
router.get('/errors', cacheMiddleware({ ttl: 60 }), monitoringController.getErrors);

/**
 * @route GET /monitoring/status
 * @desc Get overall system status
 * @access Private
 */
router.get('/status', monitoringController.getStatus);

export default router;
