import { logger } from '../utils/logger';
import { klaviyoApiClient } from './klaviyoApiClient';
import { db } from '../database';
import campaignRepository from '../repositories/campaignRepository';
import { flowRepository } from '../repositories/flowRepository';
// We'll add the other repositories as they're implemented
// import { formRepository } from '../repositories/formRepository';
// import { segmentRepository } from '../repositories/segmentRepository';

/**
 * Interface for sync options
 */
export interface SyncOptions {
  force?: boolean;
  since?: Date | null;
  entityTypes?: ('campaigns' | 'flows' | 'forms' | 'segments')[];
}

/**
 * Interface for sync result
 */
export interface SyncResult {
  success: boolean;
  message: string;
  entityResults: {
    [key: string]: {
      success: boolean;
      count: number;
      message: string;
    }
  };
  errors: Error[];
  syncedAt: Date;
}

/**
 * Service for handling data synchronization from Klaviyo API to database
 */
export class DataSyncService {
  /**
   * Sync all entity types
   * @param options Sync options
   * @returns Sync result
   */
  async syncAll(options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = new Date();
    const result: SyncResult = {
      success: true,
      message: 'Data sync completed',
      entityResults: {},
      errors: [],
      syncedAt: startTime
    };
    
    const entityTypes = options.entityTypes || ['campaigns', 'flows', 'forms', 'segments'];
    
    logger.info(`Starting sync for entities: ${entityTypes.join(', ')}${options.force ? ' (forced)' : ''}${options.since ? ` since ${options.since.toISOString()}` : ''}`);
    
    // Run sync for each entity type
    const syncPromises = entityTypes.map(async (entityType) => {
      try {
        switch (entityType) {
          case 'campaigns':
            result.entityResults.campaigns = await this.syncCampaigns(options);
            break;
          case 'flows':
            result.entityResults.flows = await this.syncFlows(options);
            break;
          case 'forms':
            // result.entityResults.forms = await this.syncForms(options);
            result.entityResults.forms = {
              success: false,
              count: 0,
              message: 'Forms sync not yet implemented'
            };
            break;
          case 'segments':
            // result.entityResults.segments = await this.syncSegments(options);
            result.entityResults.segments = {
              success: false,
              count: 0,
              message: 'Segments sync not yet implemented'
            };
            break;
        }
      } catch (error) {
        logger.error(`Error syncing ${entityType}:`, error);
        result.errors.push(error instanceof Error ? error : new Error(`Unknown error syncing ${entityType}`));
        result.entityResults[entityType] = {
          success: false,
          count: 0,
          message: `Error syncing ${entityType}: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    });
    
    // Wait for all sync operations to complete
    await Promise.all(syncPromises);
    
    // Check if any sync operations failed
    if (result.errors.length > 0) {
      result.success = false;
      result.message = `Data sync completed with ${result.errors.length} errors`;
    }
    
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    logger.info(`Data sync completed in ${durationMs}ms with status: ${result.success ? 'success' : 'failure'}`);
    
    return result;
  }
  
  /**
   * Sync campaigns data
   * @param options Sync options
   * @returns Sync result for campaigns
   */
  async syncCampaigns(options: SyncOptions = {}): Promise<{
    success: boolean;
    count: number;
    message: string;
  }> {
    try {
      logger.info(`Starting campaigns sync${options.force ? ' (forced)' : ''}${options.since ? ` since ${options.since.toISOString()}` : ''}`);
      
      // Get campaigns from Klaviyo API
      const campaignsResponse = await klaviyoApiClient.getCampaigns();
      
      if (!campaignsResponse || !campaignsResponse.data || !Array.isArray(campaignsResponse.data)) {
        return {
          success: false,
          count: 0,
          message: 'Invalid response from Klaviyo API'
        };
      }
      
      const campaigns = campaignsResponse.data;
      logger.info(`Retrieved ${campaigns.length} campaigns from Klaviyo API`);
      
      // Prepare campaigns for database storage
      const dbCampaigns = campaigns.map(campaign => {
        const attributes = campaign.attributes || {};
        const metrics = attributes.metrics || {};
        const revenue = parseFloat(metrics.revenue || '0');
        
        return {
          id: campaign.id,
          name: attributes.name || 'Unnamed Campaign',
          status: attributes.status || 'unknown',
          send_time: attributes.send_time ? new Date(attributes.send_time) : null,
          sent_count: parseInt(metrics.sent_count || '0', 10),
          open_count: parseInt(metrics.open_count || '0', 10),
          click_count: parseInt(metrics.click_count || '0', 10),
          conversion_count: parseInt(metrics.conversion_count || '0', 10),
          revenue: revenue,
          metadata: {
            original_data: attributes,
            klaviyo_updated_at: attributes.updated_at
          }
        };
      });
      
      // Store campaigns in database
      const createdCampaigns = await campaignRepository.createBatch(dbCampaigns);
      
      return {
        success: true,
        count: createdCampaigns.length,
        message: `Successfully synced ${createdCampaigns.length} campaigns`
      };
    } catch (error) {
      logger.error('Error in campaigns sync:', error);
      throw error;
    }
  }
  
  /**
   * Sync flows data
   * @param options Sync options
   * @returns Sync result for flows
   */
  async syncFlows(options: SyncOptions = {}): Promise<{
    success: boolean;
    count: number;
    message: string;
  }> {
    try {
      const startTime = new Date();
      
      // Determine if we're doing an incremental sync or full sync
      let incrementalSync = !options.force;
      let lastSyncTime: Date | null = null;
      
      if (incrementalSync) {
        // If a specific timestamp is provided, use that
        if (options.since) {
          lastSyncTime = options.since;
          logger.info(`Using provided timestamp for incremental sync: ${lastSyncTime.toISOString()}`);
        } else {
          // Otherwise, get the last sync timestamp from the database
          lastSyncTime = await this.getLastSyncTimestamp('flows');
          
          if (lastSyncTime) {
            logger.info(`Using last sync timestamp for incremental sync: ${lastSyncTime.toISOString()}`);
          } else {
            incrementalSync = false;
            logger.info('No previous sync timestamp found, performing full sync');
          }
        }
      }
      
      logger.info(`Starting flows sync${options.force ? ' (forced)' : ''}${incrementalSync ? ' (incremental)' : ' (full)'}`);
      
      // Get flows from Klaviyo API
      const flowsResponse = await klaviyoApiClient.getFlows();
      
      if (!flowsResponse || !flowsResponse.data || !Array.isArray(flowsResponse.data)) {
        // Track failed sync
        await this.trackSyncTimestamp('flows', startTime, 'failed', 0, false, 'Invalid response from Klaviyo API');
        
        return {
          success: false,
          count: 0,
          message: 'Invalid response from Klaviyo API'
        };
      }
      
      const flows = flowsResponse.data;
      logger.info(`Retrieved ${flows.length} flows from Klaviyo API`);
      
      // Filter flows for incremental sync if we have a timestamp
      let flowsToProcess = flows;
      if (incrementalSync && lastSyncTime) {
        flowsToProcess = flows.filter(flow => {
          const attributes = flow.attributes || {};
          const updatedAt = attributes.updated_at ? new Date(attributes.updated_at) : null;
          
          // Include if:
          // 1. No updated_at (we can't tell if it's changed)
          // 2. Updated since last sync
          return !updatedAt || updatedAt > lastSyncTime!;
        });
        
        logger.info(`Filtered to ${flowsToProcess.length} flows updated since last sync`);
      }
      
      // Prepare flows for database storage
      const dbFlows = flowsToProcess.map(flow => {
        const attributes = flow.attributes || {};
        const metrics = attributes.metrics || {};
        const revenue = parseFloat(metrics.revenue || '0');
        
        return {
          id: flow.id,
          name: attributes.name || 'Unnamed Flow',
          status: attributes.status || 'unknown',
          trigger_type: attributes.trigger_type || 'unknown',
          created_date: attributes.created_at ? new Date(attributes.created_at) : new Date(),
          recipient_count: parseInt(metrics.recipient_count || '0', 10),
          open_count: parseInt(metrics.open_count || '0', 10),
          click_count: parseInt(metrics.click_count || '0', 10),
          conversion_count: parseInt(metrics.conversion_count || '0', 10),
          revenue: revenue,
          metadata: {
            original_data: attributes,
            klaviyo_updated_at: attributes.updated_at
          }
        };
      });
      
      // Store flows in database
      let createdFlows: any[] = [];
      if (dbFlows.length > 0) {
        createdFlows = await flowRepository.createBatch(dbFlows);
        logger.info(`Stored ${createdFlows.length} flows in database`);
      } else {
        logger.info('No flows to update in database');
      }
      
      // Track successful sync
      await this.trackSyncTimestamp('flows', startTime, 'synced', createdFlows.length, true);
      
      return {
        success: true,
        count: createdFlows.length,
        message: `Successfully synced ${createdFlows.length} flows`
      };
    } catch (error) {
      logger.error('Error in flows sync:', error);
      
      // Track failed sync
      try {
        await this.trackSyncTimestamp(
          'flows', 
          new Date(), 
          'failed', 
          0, 
          false, 
          error instanceof Error ? error.message : 'Unknown error'
        );
      } catch (trackError) {
        logger.error('Error tracking sync failure:', trackError);
      }
      
      throw error;
    }
  }
  
  /**
   * Track last sync timestamp for incremental syncs
   * @param entityType Entity type
   * @param timestamp Timestamp
   * @param status Status of the sync operation
   * @param recordCount Number of records synced
   * @param success Whether the sync was successful
   * @param errorMessage Error message if the sync failed
   */
  async trackSyncTimestamp(
    entityType: string, 
    timestamp: Date = new Date(),
    status: string = 'synced',
    recordCount: number = 0,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    try {
      logger.info(`Tracking sync timestamp for ${entityType}: ${timestamp.toISOString()}`);
      
      // Update the sync status table
      await db.query(
        `UPDATE klaviyo_sync_status 
         SET last_sync_time = $1, status = $2, record_count = $3, success = $4, error_message = $5
         WHERE entity_type = $6`,
        [timestamp, status, recordCount, success, errorMessage || null, entityType]
      );
      
      logger.debug(`Updated sync status for ${entityType}`);
    } catch (error) {
      logger.error(`Error tracking sync timestamp for ${entityType}:`, error);
      throw error;
    }
  }
  
  /**
   * Get last sync timestamp for incremental syncs
   * @param entityType Entity type
   * @returns Last sync timestamp or null
   */
  async getLastSyncTimestamp(entityType: string): Promise<Date | null> {
    try {
      logger.info(`Getting last sync timestamp for ${entityType}`);
      
      // Query the sync status table
      const result = await db.query(
        `SELECT last_sync_time, status, success
         FROM klaviyo_sync_status
         WHERE entity_type = $1`,
        [entityType]
      );
      
      if (result.rows.length === 0) {
        logger.warn(`No sync status found for ${entityType}`);
        return null;
      }
      
      const syncStatus = result.rows[0];
      
      // If the last sync was not successful, return null to force a full sync
      if (!syncStatus.success || syncStatus.status === 'not_synced') {
        logger.info(`Last sync for ${entityType} was not successful or not completed, returning null`);
        return null;
      }
      
      logger.debug(`Last sync timestamp for ${entityType}: ${syncStatus.last_sync_time.toISOString()}`);
      return syncStatus.last_sync_time;
    } catch (error) {
      logger.error(`Error getting sync timestamp for ${entityType}:`, error);
      return null;
    }
  }
  
  /**
   * Get sync status information
   * @returns Object with sync status for each entity type
   */
  async getSyncStatus(): Promise<{
    [key: string]: {
      lastSyncTime: Date | null;
      status: string;
      recordCount: number;
      success: boolean;
      errorMessage: string | null;
    }
  }> {
    try {
      logger.info('Getting sync status for all entity types');
      
      // Query the sync status table for all entity types
      const result = await db.query(
        `SELECT entity_type, last_sync_time, status, record_count, success, error_message
         FROM klaviyo_sync_status`
      );
      
      // Transform the results into the desired format
      const syncStatus: {
        [key: string]: {
          lastSyncTime: Date | null;
          status: string;
          recordCount: number;
          success: boolean;
          errorMessage: string | null;
        }
      } = {};
      
      for (const row of result.rows) {
        syncStatus[row.entity_type] = {
          lastSyncTime: row.last_sync_time,
          status: row.status,
          recordCount: row.record_count,
          success: row.success,
          errorMessage: row.error_message
        };
      }
      
      return syncStatus;
    } catch (error) {
      logger.error('Error getting sync status:', error);
      throw error;
    }
  }
}

// Create a singleton instance
export const dataSyncService = new DataSyncService();

export default dataSyncService;