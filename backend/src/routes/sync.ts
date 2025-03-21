import express from 'express';
import { dataSyncService } from '../services/dataSyncService';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * @route   POST /api/sync/all
 * @desc    Sync all entity types (campaigns, flows, forms, segments)
 * @query   force - Force sync even if data exists (true/false)
 * @query   since - Only sync data since this timestamp (ISO string)
 * @query   entities - Comma-separated list of entity types to sync
 * @access  Public
 */
router.post('/all', async (req, res) => {
  try {
    const force = req.query.force === 'true';
    const since = req.query.since ? new Date(req.query.since as string) : null;
    const entities = req.query.entities ? (req.query.entities as string).split(',') : undefined;
    
    // Validate entity types
    const validEntityTypes = ['campaigns', 'flows', 'forms', 'segments'];
    const entityTypes = entities?.filter(e => validEntityTypes.includes(e)) as any[];
    
    logger.info(`Starting sync for entities: ${entityTypes?.join(', ') || 'all'}${force ? ' (forced)' : ''}${since ? ` since ${since.toISOString()}` : ''}`);
    
    // Perform sync
    const result = await dataSyncService.syncAll({
      force,
      since,
      entityTypes
    });
    
    // Return result
    res.status(result.success ? 200 : 500).json(result);
  } catch (error) {
    logger.error('Error in sync controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route   GET /api/sync/status
 * @desc    Get sync status information
 * @access  Public
 */
router.get('/status', async (req, res) => {
  try {
    // In a complete implementation, this would get information about last sync times and statuses from a database
    const entityTypes = ['campaigns', 'flows', 'forms', 'segments'];
    const statusPromises = entityTypes.map(async (type) => {
      const lastSync = await dataSyncService.getLastSyncTimestamp(type);
      return {
        entityType: type,
        lastSyncTime: lastSync ? lastSync.toISOString() : null,
        status: lastSync ? 'synced' : 'not_synced'
      };
    });
    
    const statuses = await Promise.all(statusPromises);
    
    res.status(200).json({
      success: true,
      syncStatus: statuses
    });
  } catch (error) {
    logger.error('Error in sync status controller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sync status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;