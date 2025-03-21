import { Request, Response } from 'express';
import { syncService } from '../services/sync-service';
import { logger } from '../utils/logger';

export class SyncController {
  syncAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const { force = false, since, entities } = req.query;
      
      // Start sync process
      await syncService.syncAll({
        force: force === 'true',
        since: typeof since === 'string' ? since : undefined,
        entities: typeof entities === 'string' ? entities.split(',') : undefined
      });
      
      res.json({ message: 'Sync started successfully' });
    } catch (error) {
      logger.error('Sync all error:', error);
      res.status(500).json({
        error: 'Failed to start sync',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  syncEntity = async (req: Request, res: Response): Promise<void> => {
    try {
      const { entity } = req.params;
      const { force = false, since } = req.query;
      
      // Start entity sync
      await syncService.syncEntity(entity, {
        force: force === 'true',
        since: typeof since === 'string' ? since : undefined
      });
      
      res.json({ message: `Sync started for ${entity}` });
    } catch (error) {
      logger.error(`Sync entity error for ${req.params.entity}:`, error);
      res.status(500).json({
        error: 'Failed to start entity sync',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  getSyncStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (id) {
        const status = syncService.getSyncStatus(id);
        res.json(status);
      } else {
        const statuses = syncService.getSyncStatus();
        res.json(statuses);
      }
    } catch (error) {
      logger.error('Get sync status error:', error);
      res.status(500).json({
        error: 'Failed to get sync status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  getLatestSyncStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { entity } = req.params;
      const status = syncService.getLatestSyncStatus(entity);
      
      if (!status) {
        res.status(404).json({
          error: 'Not found',
          message: `No sync status found for ${entity}`
        });
        return;
      }
      
      res.json(status);
    } catch (error) {
      logger.error('Get latest sync status error:', error);
      res.status(500).json({
        error: 'Failed to get latest sync status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const syncController = new SyncController();
