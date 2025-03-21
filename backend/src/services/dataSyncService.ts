import { logger } from '../utils/logger';
import { klaviyoApiEndpoints } from './klaviyo';
import { db } from '../database';
import campaignRepository from '../repositories/campaignRepository';
import { flowRepository } from '../repositories/flowRepository';
import { formRepository } from '../repositories/formRepository';
import { segmentRepository } from '../repositories/segmentRepository';
import { DateRange } from '../utils/dateUtils';

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
      
      // Create date range for campaigns
      const dateRange: DateRange = {
        start: options.since ? options.since.toISOString() : new Date(0).toISOString(),
        end: new Date().toISOString()
      };
      
      // Get campaigns from Klaviyo API
      const campaignsResponse = await klaviyoApiEndpoints.getCampaigns(dateRange);
      
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
        
        return {
          id: campaign.id,
          name: attributes.name || 'Unnamed Campaign',
          status: attributes.status || 'unknown',
          send_time: attributes.send_time ? new Date(attributes.send_time) : undefined,
          sent_count: 0, // These would come from metrics in a real implementation
          open_count: 0,
          click_count: 0,
          conversion_count: 0,
          revenue: 0,
          metadata: {
            original_data: attributes
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
      logger.info(`Starting flows sync${options.force ? ' (forced)' : ''}`);
      
      // Get flows from Klaviyo API
      const flowsResponse = await klaviyoApiEndpoints.getFlows();
      
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
        
        return {
          id: flow.id,
          name: attributes.name || 'Unnamed Flow',
          status: attributes.status || 'unknown',
          trigger_type: attributes.trigger_type || 'unknown',
          created_date: attributes.created ? new Date(attributes.created) : new Date(),
          recipient_count: 0,
          open_count: 0,
          click_count: 0,
          conversion_count: 0,
          revenue: 0,
          metadata: {
            original_data: attributes
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
   * Sync forms data
   * @param options Sync options
   * @returns Sync result for forms
   */
  async syncForms(options: SyncOptions = {}): Promise<{
    success: boolean;
    count: number;
    message: string;
  }> {
    try {
      logger.info(`Starting forms sync${options.force ? ' (forced)' : ''}`);
      
      // For simplicity, we'll just return a success message
      return {
        success: true,
        count: 0,
        message: 'Forms sync not implemented yet'
      };
    } catch (error) {
      logger.error('Error in forms sync:', error);
      throw error;
    }
  }
  
  /**
   * Sync segments data
   * @param options Sync options
   * @returns Sync result for segments
   */
  async syncSegments(options: SyncOptions = {}): Promise<{
    success: boolean;
    count: number;
    message: string;
  }> {
    try {
      logger.info(`Starting segments sync${options.force ? ' (forced)' : ''}`);
      
      // Get segments from Klaviyo API
      const segmentsResponse = await klaviyoApiEndpoints.getSegments();
      
      if (!segmentsResponse || !segmentsResponse.data || !Array.isArray(segmentsResponse.data)) {
        return {
          success: false,
          count: 0,
          message: 'Invalid response from Klaviyo API'
        };
      }
      
      const segments = segmentsResponse.data;
      logger.info(`Retrieved ${segments.length} segments from Klaviyo API`);
      
      // Prepare segments for database storage
      const dbSegments = segments.map(segment => {
        const attributes = segment.attributes || {};
        
        return {
          id: segment.id,
          name: attributes.name || 'Unnamed Segment',
          status: attributes.status || 'active', // Add status property
          profile_count: parseInt(String(attributes.profile_count || '0'), 10),
          created_date: attributes.created ? new Date(attributes.created) : new Date(),
          updated_date: attributes.updated ? new Date(attributes.updated) : new Date(),
          metadata: {
            original_data: attributes
          }
        };
      });
      
      // Store segments in database
      let createdSegments: any[] = [];
      if (dbSegments.length > 0) {
        createdSegments = await segmentRepository.createBatch(dbSegments);
        logger.info(`Stored ${createdSegments.length} segments in database`);
      } else {
        logger.info('No segments to update in database');
      }
      
      return {
        success: true,
        count: createdSegments.length,
        message: `Successfully synced ${createdSegments.length} segments`
      };
    } catch (error) {
      logger.error('Error in segments sync:', error);
      throw error;
    }
  }
  
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
            result.entityResults.forms = await this.syncForms(options);
            break;
          case 'segments':
            result.entityResults.segments = await this.syncSegments(options);
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
}

// Create a singleton instance
export const dataSyncService = new DataSyncService();

export default dataSyncService;
