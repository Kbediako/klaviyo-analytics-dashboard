import { KlaviyoApiClient } from './klaviyoApiClient';
import { MetricRepository, Metric } from '../repositories/metricRepository';
import { ProfileRepository, Profile } from '../repositories/profileRepository';
import { EventRepository, Event } from '../repositories/eventRepository';
import { logger } from '../utils/logger';
import { DateRange } from '../utils/dateUtils';
import { storeCampaignsInDb } from './campaignsService';

// Define interfaces for API responses
interface KlaviyoApiResponse<T> {
  data: T[];
  links?: {
    self?: string;
    next?: string;
    previous?: string;
  };
  included?: any[];
}

interface KlaviyoMetric {
  id: string;
  type: string;
  attributes: {
    name: string;
    created: string;
    updated: string;
    integration?: {
      id: string;
      name: string;
      category: string;
    };
    [key: string]: any;
  };
}

interface KlaviyoEvent {
  id: string;
  type: string;
  attributes: {
    datetime: string;
    timestamp: number;
    value: number;
    properties: Record<string, any>;
    [key: string]: any;
  };
  relationships: {
    metric: {
      data: {
        id: string;
        type: string;
      };
    };
    profile: {
      data: {
        id: string;
        type: string;
      };
    };
    [key: string]: any;
  };
}

interface KlaviyoProfile {
  id: string;
  type: string;
  attributes: {
    email?: string;
    phone_number?: string;
    first_name?: string;
    last_name?: string;
    created: string;
    updated: string;
    properties?: Record<string, any>;
    [key: string]: any;
  };
}

/**
 * Service for synchronizing data between Klaviyo API and local database
 */
export class DataSyncService {
  private klaviyoClient: KlaviyoApiClient;
  private metricRepo: MetricRepository;
  private profileRepo: ProfileRepository;
  private eventRepo: EventRepository;
  
  /**
   * Create a new data sync service
   */
  constructor() {
    this.klaviyoClient = new KlaviyoApiClient(process.env.KLAVIYO_API_KEY || '');
    this.metricRepo = new MetricRepository();
    this.profileRepo = new ProfileRepository();
    this.eventRepo = new EventRepository();
  }
  
  /**
   * Sync metrics from Klaviyo API to local database
   * @returns Number of metrics synced
   */
  async syncMetrics(): Promise<number> {
    const startTime = Date.now();
    logger.info('Starting metrics sync');
    
    try {
      // Fetch all metrics from Klaviyo
      const response = await this.klaviyoClient.getMetrics() as KlaviyoApiResponse<KlaviyoMetric>;
      
      if (!response.data || !Array.isArray(response.data)) {
        logger.warn('No metrics data returned from API');
        return 0;
      }
      
      // Process and store each metric
      const metrics = response.data as KlaviyoMetric[];
      let syncedCount = 0;
      
      for (const metric of metrics) {
        try {
          await this.metricRepo.createOrUpdate({
            id: metric.id,
            name: metric.attributes.name,
            created_at: new Date(metric.attributes.created),
            integration_id: metric.attributes.integration?.id,
            integration_name: metric.attributes.integration?.name,
            integration_category: metric.attributes.integration?.category,
            metadata: metric.attributes
          });
          syncedCount++;
        } catch (error) {
          logger.error(`Error syncing metric ${metric.id}:`, error);
        }
      }
      
      const duration = Date.now() - startTime;
      logger.info(`Synced ${syncedCount} metrics in ${duration}ms`);
      return syncedCount;
    } catch (error) {
      logger.error('Error syncing metrics:', error);
      throw error;
    }
  }
  
  /**
   * Sync recent events from Klaviyo API to local database
   * @param hours Number of hours of events to sync (default: 24)
   * @returns Number of events synced
   */
  async syncRecentEvents(hours: number = 24): Promise<number> {
    const startTime = Date.now();
    logger.info(`Starting events sync for the last ${hours} hours`);
    
    try {
      const now = new Date();
      const startDate = new Date(now.getTime() - hours * 60 * 60 * 1000);
      
      // Create date range for API request
      const dateRange: DateRange = {
        start: startDate.toISOString(),
        end: now.toISOString()
      };
      
      // Fetch events from Klaviyo
      const response = await this.klaviyoClient.getEvents(dateRange) as KlaviyoApiResponse<KlaviyoEvent>;
      
      if (!response.data || !Array.isArray(response.data)) {
        logger.warn('No events data returned from API');
        return 0;
      }
      
      // Process and store events
      const events = response.data as KlaviyoEvent[];
      let syncedCount = 0;
      
      for (const event of events) {
        try {
          // Store profile if it exists in the event
          if (event.relationships && event.relationships.profile && event.relationships.profile.data) {
            const profileData = event.relationships.profile.data;
            const profileAttributes = response.included?.find(
              (item: any) => item.type === 'profile' && item.id === profileData.id
            )?.attributes;
            
            if (profileAttributes) {
              await this.profileRepo.createOrUpdate({
                id: profileData.id,
                email: profileAttributes.email,
                phone_number: profileAttributes.phone_number,
                first_name: profileAttributes.first_name,
                last_name: profileAttributes.last_name,
                created_at: new Date(profileAttributes.created),
                properties: profileAttributes.properties,
                last_event_date: new Date(event.attributes.datetime)
              });
            }
          }
          
          // Store event
          await this.eventRepo.create({
            id: event.id,
            metric_id: event.relationships.metric.data.id,
            profile_id: event.relationships.profile.data.id,
            timestamp: new Date(event.attributes.datetime),
            value: event.attributes.value,
            properties: event.attributes.properties || {},
            raw_data: event
          });
          
          syncedCount++;
        } catch (error) {
          logger.error(`Error syncing event ${event.id}:`, error);
        }
      }
      
      const duration = Date.now() - startTime;
      logger.info(`Synced ${syncedCount} events in ${duration}ms`);
      return syncedCount;
    } catch (error) {
      logger.error('Error syncing recent events:', error);
      throw error;
    }
  }
  
  /**
   * Sync campaigns from Klaviyo API to local database
   * @returns Number of campaigns synced
   */
  async syncCampaigns(): Promise<number> {
    const startTime = Date.now();
    logger.info('Starting campaigns sync');
    
    try {
      // Create a date range for the last 90 days
      const now = new Date();
      const startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      
      const dateRange: DateRange = {
        start: startDate.toISOString(),
        end: now.toISOString()
      };
      
      // Fetch campaigns from Klaviyo
      const response = await this.klaviyoClient.getCampaigns(dateRange) as KlaviyoApiResponse<any>;
      
      if (!response.data || !Array.isArray(response.data)) {
        logger.warn('No campaigns data returned from API');
        return 0;
      }
      
      // Store campaigns in database
      const campaigns = response.data as any[];
      const storedCount = await storeCampaignsInDb(campaigns);
      
      const duration = Date.now() - startTime;
      logger.info(`Synced ${storedCount} campaigns in ${duration}ms`);
      return storedCount;
    } catch (error) {
      logger.error('Error syncing campaigns:', error);
      throw error;
    }
  }
  
  /**
   * Sync flows from Klaviyo API to local database
   * @returns Number of flows synced
   */
  async syncFlows(): Promise<number> {
    const startTime = Date.now();
    logger.info('Starting flows sync');
    
    try {
      // Fetch flows from Klaviyo
      const response = await this.klaviyoClient.getFlows() as KlaviyoApiResponse<any>;
      
      if (!response.data || !Array.isArray(response.data)) {
        logger.warn('No flows data returned from API');
        return 0;
      }
      
      // Process flows (store in database if needed)
      // This would require a FlowRepository which isn't implemented yet
      // For now, just log the count
      const flows = response.data as any[];
      
      const duration = Date.now() - startTime;
      logger.info(`Retrieved ${flows.length} flows in ${duration}ms`);
      return flows.length;
    } catch (error) {
      logger.error('Error syncing flows:', error);
      throw error;
    }
  }
  
  /**
   * Sync profiles from Klaviyo API to local database
   * @returns Number of profiles synced
   */
  async syncProfiles(): Promise<number> {
    const startTime = Date.now();
    logger.info('Starting profiles sync');
    
    try {
      // Create a date range for the last 30 days
      const now = new Date();
      const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const dateRange: DateRange = {
        start: startDate.toISOString(),
        end: now.toISOString()
      };
      
      // Fetch profiles from Klaviyo
      const response = await this.klaviyoClient.getProfiles(dateRange) as KlaviyoApiResponse<KlaviyoProfile>;
      
      if (!response.data || !Array.isArray(response.data)) {
        logger.warn('No profiles data returned from API');
        return 0;
      }
      
      // Process and store profiles
      const profiles = response.data as KlaviyoProfile[];
      let syncedCount = 0;
      
      for (const profile of profiles) {
        try {
          await this.profileRepo.createOrUpdate({
            id: profile.id,
            email: profile.attributes.email,
            phone_number: profile.attributes.phone_number,
            first_name: profile.attributes.first_name,
            last_name: profile.attributes.last_name,
            created_at: new Date(profile.attributes.created),
            properties: profile.attributes.properties
          });
          syncedCount++;
        } catch (error) {
          logger.error(`Error syncing profile ${profile.id}:`, error);
        }
      }
      
      const duration = Date.now() - startTime;
      logger.info(`Synced ${syncedCount} profiles in ${duration}ms`);
      return syncedCount;
    } catch (error) {
      logger.error('Error syncing profiles:', error);
      throw error;
    }
  }
  
  /**
   * Sync metric aggregates for a specific metric
   * @param metricId Metric ID
   * @param days Number of days of data to sync (default: 90)
   * @returns Number of data points synced
   */
  async syncMetricAggregates(metricId: string, days: number = 90): Promise<number> {
    const startTime = Date.now();
    logger.info(`Starting metric aggregates sync for metric ${metricId}`);
    
    try {
      // Create a date range
      const now = new Date();
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      
      const dateRange: DateRange = {
        start: startDate.toISOString(),
        end: now.toISOString()
      };
      
      // Fetch metric aggregates from Klaviyo
      const response = await this.klaviyoClient.getMetricAggregates(metricId, dateRange) as KlaviyoApiResponse<any>;
      
      if (!response.data || !Array.isArray(response.data)) {
        logger.warn(`No metric aggregates data returned for metric ${metricId}`);
        return 0;
      }
      
      // Process metric aggregates (store in database if needed)
      // This would require additional database tables
      // For now, just log the count
      const aggregates = response.data as any[];
      
      const duration = Date.now() - startTime;
      logger.info(`Retrieved ${aggregates.length} metric aggregates for ${metricId} in ${duration}ms`);
      return aggregates.length;
    } catch (error) {
      logger.error(`Error syncing metric aggregates for ${metricId}:`, error);
      throw error;
    }
  }
  
  /**
   * Run a full sync of all data types
   * @returns Object with counts of synced items by type
   */
  async syncAll(): Promise<Record<string, number>> {
    logger.info('Starting full data sync');
    
    try {
      // Sync metrics first
      const metricsCount = await this.syncMetrics();
      
      // Sync profiles
      const profilesCount = await this.syncProfiles();
      
      // Sync events
      const eventsCount = await this.syncRecentEvents(48); // Last 48 hours
      
      // Sync campaigns
      const campaignsCount = await this.syncCampaigns();
      
      // Sync flows
      const flowsCount = await this.syncFlows();
      
      logger.info('Full data sync completed successfully');
      
      return {
        metrics: metricsCount,
        profiles: profilesCount,
        events: eventsCount,
        campaigns: campaignsCount,
        flows: flowsCount
      };
    } catch (error) {
      logger.error('Error during full data sync:', error);
      throw error;
    }
  }
}

// Create a singleton instance
export const dataSyncService = new DataSyncService();

export default dataSyncService;
