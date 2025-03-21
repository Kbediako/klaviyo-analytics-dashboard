import { logger } from '../utils/logger';
import { cacheService } from './cache-service';

interface SyncOptions {
  force?: boolean;
  since?: string;
  entities?: string[];
}

interface SyncStatus {
  id: string;
  entity: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  error?: string;
  progress?: number;
  total?: number;
}

class SyncService {
  private syncStatuses: Map<string, SyncStatus> = new Map();
  private retryDelays = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff

  constructor() {
    this.initializeSync();
  }

  private async initializeSync(): Promise<void> {
    try {
      // Initialize sync status tracking
      logger.info('Initializing sync service');
      
      // Set up periodic sync (every hour by default)
      setInterval(() => {
        this.syncAll({ force: false }).catch(error => {
          logger.error('Periodic sync failed:', error);
        });
      }, 60 * 60 * 1000); // 1 hour
    } catch (error) {
      logger.error('Failed to initialize sync service:', error);
    }
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retries = 3
  ): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === retries) throw error;
        
        const delay = this.retryDelays[attempt] || this.retryDelays[this.retryDelays.length - 1];
        logger.warn(`Retry attempt ${attempt + 1} after ${delay}ms:`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Retry failed');
  }

  private createSyncStatus(entity: string): SyncStatus {
    const status: SyncStatus = {
      id: `${entity}-${Date.now()}`,
      entity,
      status: 'pending',
      startTime: new Date(),
    };
    this.syncStatuses.set(status.id, status);
    return status;
  }

  private updateSyncStatus(
    id: string,
    updates: Partial<SyncStatus>
  ): void {
    const status = this.syncStatuses.get(id);
    if (status) {
      Object.assign(status, updates);
      this.syncStatuses.set(id, status);
    }
  }

  async syncEntity(
    entity: string,
    options: SyncOptions = {}
  ): Promise<void> {
    const status = this.createSyncStatus(entity);
    
    try {
      this.updateSyncStatus(status.id, { status: 'in_progress' });
      
      // Determine last sync time for incremental sync
      const lastSyncKey = `sync:${entity}:lastSync`;
      const lastSync = !options.force ? await cacheService.get(lastSyncKey) : null;
      
      // Perform sync based on entity type
      switch (entity) {
        case 'campaigns':
          await this.syncCampaigns(status, lastSync);
          break;
        case 'flows':
          await this.syncFlows(status, lastSync);
          break;
        case 'forms':
          await this.syncForms(status, lastSync);
          break;
        case 'segments':
          await this.syncSegments(status, lastSync);
          break;
        default:
          throw new Error(`Unknown entity type: ${entity}`);
      }
      
      // Update last sync time
      await cacheService.set(lastSyncKey, new Date().toISOString());
      
      this.updateSyncStatus(status.id, {
        status: 'completed',
        endTime: new Date()
      });
      
      // Invalidate relevant caches
      await cacheService.deletePattern(`api:/${entity}*`);
      
    } catch (error) {
      logger.error(`Sync failed for ${entity}:`, error);
      this.updateSyncStatus(status.id, {
        status: 'failed',
        endTime: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async syncAll(options: SyncOptions = {}): Promise<void> {
    const entities = options.entities || ['campaigns', 'flows', 'forms', 'segments'];
    const errors: Error[] = [];

    for (const entity of entities) {
      try {
        await this.syncEntity(entity, options);
      } catch (error) {
        errors.push(error as Error);
        logger.error(`Failed to sync ${entity}:`, error);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Sync failed for some entities: ${errors.map(e => e.message).join(', ')}`);
    }
  }

  private async syncCampaigns(status: SyncStatus, lastSync?: string | null): Promise<void> {
    // Implementation will be added when campaign repository is available
    logger.info('Syncing campaigns', { lastSync });
  }

  private async syncFlows(status: SyncStatus, lastSync?: string | null): Promise<void> {
    // Implementation will be added when flow repository is available
    logger.info('Syncing flows', { lastSync });
  }

  private async syncForms(status: SyncStatus, lastSync?: string | null): Promise<void> {
    // Implementation will be added when form repository is available
    logger.info('Syncing forms', { lastSync });
  }

  private async syncSegments(status: SyncStatus, lastSync?: string | null): Promise<void> {
    // Implementation will be added when segment repository is available
    logger.info('Syncing segments', { lastSync });
  }

  getSyncStatus(id?: string): SyncStatus | SyncStatus[] {
    if (id) {
      const status = this.syncStatuses.get(id);
      if (!status) throw new Error(`Sync status not found: ${id}`);
      return status;
    }
    return Array.from(this.syncStatuses.values());
  }

  getLatestSyncStatus(entity: string): SyncStatus | undefined {
    const statuses = Array.from(this.syncStatuses.values())
      .filter(s => s.entity === entity)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    return statuses[0];
  }
}

export const syncService = new SyncService();
