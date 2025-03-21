import { logger } from '../utils/logger';
import { klaviyoApiClient } from './klaviyoApiClient';
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
      logger.info(`Starting flows sync${options.force ? ' (forced)' : ''}${options.since ? ` since ${options.since.toISOString()}` : ''}`);
      
      // Get flows from Klaviyo API
      const flowsResponse = await klaviyoApiClient.getFlows();
      
      if (!flowsResponse || !flowsResponse.data || !Array.isArray(flowsResponse.data)) {
        return {
          success: false,
          count: 0,
          message: 'Invalid response from Klaviyo API'
        };
      }
      
      const flows = flowsResponse.data;
      logger.info(`Retrieved ${flows.length} flows from Klaviyo API`);
      
      // Prepare flows for database storage
      const dbFlows = flows.map(flow => {
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
      const createdFlows = await flowRepository.createBatch(dbFlows);
      
      return {
        success: true,
        count: createdFlows.length,
        message: `Successfully synced ${createdFlows.length} flows`
      };
    } catch (error) {
      logger.error('Error in flows sync:', error);
      throw error;
    }
  }
  
  /**
   * Track last sync timestamp for incremental syncs
   * @param entityType Entity type
   * @param timestamp Timestamp
   */
  async trackSyncTimestamp(entityType: string, timestamp: Date = new Date()): Promise<void> {
    try {
      // This would normally be stored in a database table
      // For now, we'll log it
      logger.info(`Tracking sync timestamp for ${entityType}: ${timestamp.toISOString()}`);
      
      // TODO: Store sync timestamps in database
    } catch (error) {
      logger.error(`Error tracking sync timestamp for ${entityType}:`, error);
    }
  }
  
  /**
   * Get last sync timestamp for incremental syncs
   * @param entityType Entity type
   * @returns Last sync timestamp or null
   */
  async getLastSyncTimestamp(entityType: string): Promise<Date | null> {
    try {
      // This would normally be retrieved from a database table
      // For now, we'll return null
      logger.info(`Getting last sync timestamp for ${entityType}`);
      
      // TODO: Retrieve sync timestamps from database
      return null;
    } catch (error) {
      logger.error(`Error getting sync timestamp for ${entityType}:`, error);
      return null;
    }
  }
}

// Create a singleton instance
export const dataSyncService = new DataSyncService();

export default dataSyncService;