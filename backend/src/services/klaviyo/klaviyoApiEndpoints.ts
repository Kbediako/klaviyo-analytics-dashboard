import { KlaviyoApiClient } from './klaviyoApiClient';
import { DateRange, KlaviyoApiResponse, Campaign, Flow, FlowMessage, Metric, MetricAggregate, Profile, Segment, Event } from './types';
import { FilterParam } from '../../utils/jsonApiUtils';

/**
 * Klaviyo API endpoint methods
 * 
 * This file contains methods for interacting with specific Klaviyo API endpoints.
 * Each method is designed to handle a specific API resource and includes error handling
 * and fallback behavior.
 */
export class KlaviyoApiEndpoints {
  private client: KlaviyoApiClient;

  /**
   * Create a new KlaviyoApiEndpoints instance
   * 
   * @param client KlaviyoApiClient instance
   */
  constructor(client: KlaviyoApiClient) {
    this.client = client;
  }

  /**
   * Get campaigns from Klaviyo
   * 
   * @param dateRange Date range to filter by
   * @returns Campaigns data with included tags
   * @throws {ApiError} If the request fails and error is not handled internally
   */
  async getCampaigns(dateRange: DateRange): Promise<KlaviyoApiResponse<Campaign>> {
    try {
      // Get campaigns from Klaviyo API using JSON:API parameters
      const response = await this.client.get<KlaviyoApiResponse<Campaign>>('api/campaigns', {
        filter: [
          {
            field: 'messages.channel',
            operator: 'equals',
            value: 'email'
          }
        ],
        include: ['tags'],
        fields: {
          campaign: ['name', 'status', 'created', 'updated', 'archived', 'send_time', 'id']
        },
        page: {
          size: 50
        }
      });
      
      console.log('Live API - Campaigns response:', JSON.stringify(response).substring(0, 200) + '...');
      return response;
    } catch (error) {
      console.error('Error fetching campaigns from Klaviyo API:', error);
      // Fallback to empty data on error
      return { data: [] };
    }
  }

  /**
   * Get flows from Klaviyo
   * 
   * @returns Flows data with included tags
   * @throws {ApiError} If the request fails and error is not handled internally
   */
  async getFlows(): Promise<KlaviyoApiResponse<Flow>> {
    try {
      // Get flows from Klaviyo API using JSON:API parameters
      const response = await this.client.get<KlaviyoApiResponse<Flow>>('api/flows', {
        include: ['tags'],
        fields: {
          flow: ['name', 'status', 'created', 'updated', 'id', 'trigger_type', 'archived']
        },
        page: {
          size: 50
        }
      });
      
      console.log('Live API - Flows response:', JSON.stringify(response).substring(0, 200) + '...');
      return response;
    } catch (error) {
      console.error('Error fetching flows from Klaviyo API:', error);
      // Fallback to empty data on error
      return { data: [] };
    }
  }

  /**
   * Get flow messages from Klaviyo
   * 
   * @param dateRange Date range to filter by
   * @returns Flow messages data filtered by date range
   * @throws {ApiError} If the request fails and error is not handled internally
   */
  async getFlowMessages(dateRange: DateRange): Promise<KlaviyoApiResponse<FlowMessage>> {
    try {
      // Get flow messages from Klaviyo API using JSON:API parameters
      const response = await this.client.get<KlaviyoApiResponse<FlowMessage>>('api/flow-messages', {
        filter: [
          {
            field: 'created',
            operator: 'greater-than',
            value: new Date(new Date(dateRange.start).getTime() - 1) // Subtract 1ms to make it inclusive
          },
          {
            field: 'created',
            operator: 'less-than',
            value: new Date(new Date(dateRange.end).getTime() + 1) // Add 1ms to make it inclusive
          }
        ],
        fields: {
          'flow-message': ['name', 'content', 'created', 'updated', 'status', 'position', 'id']
        },
        page: {
          size: 50
        }
      });
      
      console.log('Live API - Flow Messages response:', JSON.stringify(response).substring(0, 200) + '...');
      return response;
    } catch (error) {
      console.error('Error fetching flow messages from Klaviyo API:', error);
      // Fallback to empty data on error
      return { data: [] };
    }
  }

  /**
   * Get metrics from Klaviyo
   * 
   * @returns Metrics data with type and integration information
   * @throws {ApiError} If the request fails and error is not handled internally
   */
  async getMetrics(): Promise<KlaviyoApiResponse<Metric>> {
    try {
      // Get metrics from Klaviyo API using JSON:API parameters
      const response = await this.client.get<KlaviyoApiResponse<Metric>>('api/metrics', {
        fields: {
          metric: ['name', 'created', 'updated', 'integration', 'id']
        }
      });
      
      console.log('Live API - Metrics response:', JSON.stringify(response).substring(0, 200) + '...');
      return response;
    } catch (error) {
      console.error('Error fetching metrics from Klaviyo API:', error);
      // Fallback to empty data on error
      return { data: [] };
    }
  }

  /**
   * Get metric aggregates from Klaviyo
   * 
   * @param metricId Metric ID to get aggregates for
   * @param dateRange Date range to filter by
   * @returns Metric aggregates data for the specified metric and date range
   * @throws {ApiError} If the request fails and error is not handled internally
   */
  async getMetricAggregates(metricId: string, dateRange: DateRange): Promise<KlaviyoApiResponse<MetricAggregate>> {
    try {
      // Get metric aggregates from Klaviyo API using JSON:API parameters
      const response = await this.client.get<KlaviyoApiResponse<MetricAggregate>>(`api/metric-aggregates/${metricId}`, {
        filter: [
          {
            field: 'datetime',
            operator: 'greater-than',
            value: new Date(new Date(dateRange.start).getTime() - 1) // Subtract 1ms to make it inclusive
          },
          {
            field: 'datetime',
            operator: 'less-than',
            value: new Date(new Date(dateRange.end).getTime() + 1) // Add 1ms to make it inclusive
          }
        ],
        sort: ['datetime'],
        page: {
          size: 100
        }
      });
      
      console.log('Live API - Metric Aggregates response:', JSON.stringify(response).substring(0, 200) + '...');
      return response;
    } catch (error) {
      console.error(`Error fetching metric aggregates for ${metricId} from Klaviyo API:`, error);
      // Fallback to empty data on error
      return { data: [] };
    }
  }

  /**
   * Get profiles from Klaviyo
   * 
   * @param dateRange Date range to filter by
   * @returns Profiles data filtered by creation date
   * @throws {ApiError} If the request fails and error is not handled internally
   */
  async getProfiles(dateRange: DateRange): Promise<KlaviyoApiResponse<Profile>> {
    try {
      // Get profiles from Klaviyo API using JSON:API parameters
      const response = await this.client.get<KlaviyoApiResponse<Profile>>('api/profiles', {
        filter: [
          {
            field: 'created',
            operator: 'greater-than',
            value: new Date(new Date(dateRange.start).getTime() - 1) // Subtract 1ms to make it inclusive
          },
          {
            field: 'created',
            operator: 'less-than',
            value: new Date(new Date(dateRange.end).getTime() + 1) // Add 1ms to make it inclusive
          }
        ],
        fields: {
          profile: ['email', 'phone_number', 'first_name', 'last_name', 'created', 'updated', 'id']
        },
        'additional-fields': {
          profile: ['subscriptions']
        },
        page: {
          size: 50
        }
      });
      
      console.log('Live API - Profiles response:', JSON.stringify(response).substring(0, 200) + '...');
      return response;
    } catch (error) {
      console.error('Error fetching profiles from Klaviyo API:', error);
      // Fallback to empty data on error
      return { data: [] };
    }
  }

  /**
   * Get segments from Klaviyo
   * 
   * @returns Segments data
   * @throws {ApiError} If the request fails and error is not handled internally
   */
  async getSegments(): Promise<KlaviyoApiResponse<Segment>> {
    try {
      // Get segments from Klaviyo API using JSON:API parameters
      const response = await this.client.get<KlaviyoApiResponse<Segment>>('api/segments', {
        fields: {
          segment: ['name', 'created', 'updated', 'profile_count', 'id']
        },
        page: {
          size: 50
        }
      });
      
      console.log('Live API - Segments response:', JSON.stringify(response).substring(0, 200) + '...');
      return response;
    } catch (error) {
      console.error('Error fetching segments from Klaviyo API:', error);
      // Fallback to empty data on error
      return { data: [] };
    }
  }

  /**
   * Get events from Klaviyo
   * 
   * @param dateRange Date range to filter by
   * @param additionalFilters Additional filter parameters
   * @returns Events data
   * @throws {ApiError} If the request fails and error is not handled internally
   */
  async getEvents(dateRange: DateRange, additionalFilters: FilterParam[] = []): Promise<KlaviyoApiResponse<Event>> {
    try {
      // Create base filters for date range
      const filters: FilterParam[] = [
        {
          field: 'datetime',
          operator: 'greater-than',
          value: new Date(new Date(dateRange.start).getTime() - 1) // Subtract 1ms to make it inclusive
        },
        {
          field: 'datetime',
          operator: 'less-than',
          value: new Date(new Date(dateRange.end).getTime() + 1) // Add 1ms to make it inclusive
        },
        ...additionalFilters
      ];
      
      // Get events from Klaviyo API using JSON:API parameters
      const response = await this.client.get<KlaviyoApiResponse<Event>>('api/events', {
        filter: filters,
        sort: ['-datetime'],
        page: {
          size: 50
        }
      });
      
      console.log('Live API - Events response:', JSON.stringify(response).substring(0, 200) + '...');
      return response;
    } catch (error) {
      console.error('Error fetching events from Klaviyo API:', error);
      // Fallback to empty data on error
      return { data: [] };
    }
  }
}

/**
 * Create a singleton instance of the Klaviyo API endpoints
 */
import klaviyoApiClient from './klaviyoApiClient';
export const klaviyoApiEndpoints = new KlaviyoApiEndpoints(klaviyoApiClient);

export default klaviyoApiEndpoints;
