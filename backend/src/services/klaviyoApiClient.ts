import fetch from 'node-fetch';
import { DateRange } from '../utils/dateUtils';

/**
 * Klaviyo API Client for making requests to the Klaviyo API
 */
export class KlaviyoApiClient {
  private apiKey: string;
  private baseUrl: string;
  private apiVersion: string;

  /**
   * Create a new Klaviyo API client
   * 
   * @param apiKey Klaviyo API key
   * @param apiVersion API version to use (default: '2023-07-15')
   */
  constructor(apiKey: string, apiVersion: string = '2023-07-15') {
    if (!apiKey) {
      throw new Error('Klaviyo API key is required');
    }
    
    this.apiKey = apiKey;
    this.baseUrl = 'https://a.klaviyo.com/api';
    this.apiVersion = apiVersion;
  }

  /**
   * Make a GET request to the Klaviyo API
   * 
   * @param endpoint API endpoint (e.g., 'campaigns')
   * @param params Query parameters
   * @returns Response data
   */
  async get<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Klaviyo API error (${response.status}): ${errorText}`);
    }
    
    return response.json() as Promise<T>;
  }

  /**
   * Get common headers for Klaviyo API requests
   * 
   * @returns Headers object
   */
  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
      'Accept': 'application/json',
      'Revision': this.apiVersion,
    };
  }

  /**
   * Get campaigns from Klaviyo
   * 
   * @param dateRange Date range to filter by
   * @returns Campaigns data
   */
  async getCampaigns(dateRange: DateRange) {
    return this.get('campaigns', {
      'filter': `greater-or-equal(created,'${dateRange.start}'),less-or-equal(created,'${dateRange.end}')`,
      'include': 'campaign-messages',
    });
  }

  /**
   * Get flows from Klaviyo
   * 
   * @returns Flows data
   */
  async getFlows() {
    return this.get('flows', {
      'include': 'flow-actions,flow-messages',
    });
  }

  /**
   * Get flow messages from Klaviyo
   * 
   * @param dateRange Date range to filter by
   * @returns Flow messages data
   */
  async getFlowMessages(dateRange: DateRange) {
    return this.get('flow-messages', {
      'filter': `greater-or-equal(created,'${dateRange.start}'),less-or-equal(created,'${dateRange.end}')`,
    });
  }

  /**
   * Get metrics from Klaviyo
   * 
   * @returns Metrics data
   */
  async getMetrics() {
    return this.get('metrics');
  }

  /**
   * Get metric aggregates from Klaviyo
   * 
   * @param metricId Metric ID
   * @param dateRange Date range to filter by
   * @returns Metric aggregates data
   */
  async getMetricAggregates(metricId: string, dateRange: DateRange) {
    return this.get(`metric-aggregates/${metricId}`, {
      'filter': `greater-or-equal(timestamp,'${dateRange.start}'),less-or-equal(timestamp,'${dateRange.end}')`,
    });
  }

  /**
   * Get profiles from Klaviyo
   * 
   * @param dateRange Date range to filter by
   * @returns Profiles data
   */
  async getProfiles(dateRange: DateRange) {
    return this.get('profiles', {
      'filter': `greater-or-equal(created,'${dateRange.start}'),less-or-equal(created,'${dateRange.end}')`,
    });
  }

  /**
   * Get segments from Klaviyo
   * 
   * @returns Segments data
   */
  async getSegments() {
    return this.get('segments');
  }

  /**
   * Get events from Klaviyo
   * 
   * @param dateRange Date range to filter by
   * @param filter Additional filter criteria
   * @returns Events data
   */
  async getEvents(dateRange: DateRange, filter: string = '') {
    let dateFilter = `greater-or-equal(datetime,'${dateRange.start}'),less-or-equal(datetime,'${dateRange.end}')`;
    
    if (filter) {
      dateFilter += `,${filter}`;
    }
    
    return this.get('events', {
      'filter': dateFilter,
    });
  }
}

/**
 * Create a singleton instance of the Klaviyo API client
 */
export const klaviyoApiClient = new KlaviyoApiClient(
  process.env.KLAVIYO_API_KEY || ''
);

export default klaviyoApiClient;
