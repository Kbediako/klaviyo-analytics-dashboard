import fetch from 'node-fetch';
import { DateRange } from '../utils/dateUtils';

/**
 * Klaviyo API Client for making requests to the Klaviyo API
 */
export class KlaviyoApiClient {
  private apiKey: string;
  private baseUrl: string;
  private apiVersion: string;
  private maxRetries: number;
  private retryDelay: number;

  /**
   * Create a new Klaviyo API client
   * 
   * @param apiKey Klaviyo API key
   * @param apiVersion API version to use (default: '2023-07-15')
   * @param maxRetries Maximum number of retries for failed requests (default: 3)
   * @param retryDelay Delay between retries in milliseconds (default: 1000)
   */
  constructor(
    apiKey: string, 
    apiVersion: string = '2023-07-15',
    maxRetries: number = 5,
    retryDelay: number = 2000
  ) {
    if (!apiKey) {
      throw new Error('Klaviyo API key is required');
    }
    
    this.apiKey = apiKey;
    this.baseUrl = 'https://a.klaviyo.com';
    this.apiVersion = apiVersion;
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  /**
   * Make a GET request to the Klaviyo API with retry mechanism
   * 
   * @param endpoint API endpoint (e.g., 'campaigns')
   * @param params Query parameters
   * @returns Response data
   */
  async get<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    // Static delay between API calls to avoid rate limiting
    await this.delay(1000);
    
    let retries = 0;
    let lastError: Error | null = null;
    
    // Add request ID for logging
    const requestId = Math.random().toString(36).substring(2, 9);
    const apiKey = this.apiKey.substring(0, 5) + "..."; // Only show first 5 chars for security
    console.log(`API Request [${requestId}]: ${endpoint} starting with API key: ${apiKey}`);
    console.log(`API Request [${requestId}]: Parameters:`, params);

    while (retries <= this.maxRetries) {
      try {
        const url = new URL(`${this.baseUrl}/${endpoint}`);
        
        // Add query parameters
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
        
        console.log(`API Request [${requestId}]: ${endpoint} attempt ${retries + 1}/${this.maxRetries + 1}`);
        console.log(`API Request [${requestId}]: Full URL: ${url.toString()}`);
        
        const headers = this.getHeaders();
        console.log(`API Request [${requestId}]: Headers:`, headers);
        
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: headers,
        });
        
        console.log(`API Request [${requestId}]: Response status:`, response.status);
        
        if (!response.ok) {
          // If rate limited (429), retry after delay with longer backoff
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            // Use server's retry-after or a larger delay that increases with each retry
            const retryDelay = retryAfter 
              ? parseInt(retryAfter, 10) * 1000 
              : this.retryDelay * Math.pow(3, retries); // Larger exponential backoff
            
            console.warn(`API Request [${requestId}]: Rate limited (429). Retrying after ${retryDelay}ms...`);
            await this.delay(retryDelay);
            retries++;
            continue;
          }
          
          // For other errors, throw
          const errorText = await response.text();
          console.error(`API Request [${requestId}]: Error response:`, errorText);
          throw new Error(`Klaviyo API error (${response.status}): ${errorText}`);
        }
        
        // Log response headers for debugging
        console.log(`API Request [${requestId}]: Response headers:`, {
          'content-type': response.headers.get('content-type'),
          'x-rate-limit-remaining': response.headers.get('x-rate-limit-remaining'),
          'x-rate-limit-reset': response.headers.get('x-rate-limit-reset')
        });
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn(`API Request [${requestId}]: Non-JSON response (${contentType})`);
          const text = await response.text();
          console.log(`API Request [${requestId}]: Response text:`, text.substring(0, 1000));
          throw new Error(`Klaviyo API returned non-JSON response: ${contentType}`);
        }
        
        const data = await response.json() as T;
        console.log(`API Request [${requestId}]: ${endpoint} completed successfully`);
        console.log(`API Request [${requestId}]: Response data:`, JSON.stringify(data).substring(0, 500) + '...');
        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // If we've reached max retries, throw the last error
        if (retries >= this.maxRetries) {
          console.error(`API Request [${requestId}]: Failed after ${retries} retries:`, lastError);
          throw lastError;
        }
        
        // Otherwise, retry after delay with more aggressive backoff
        const delay = this.retryDelay * Math.pow(3, retries); // More aggressive exponential backoff
        console.warn(`API Request [${requestId}]: Request failed (attempt ${retries + 1}/${this.maxRetries + 1}): ${lastError.message}`);
        console.warn(`API Request [${requestId}]: Retrying after ${delay}ms...`);
        await this.delay(delay);
        retries++;
      }
    }

    // This should never happen, but TypeScript needs it
    throw lastError || new Error('Unknown error occurred');
  }

  /**
   * Delay execution for a specified time
   * 
   * @param ms Milliseconds to delay
   * @returns Promise that resolves after the delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
      'revision': this.apiVersion,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get campaigns from Klaviyo
   * 
   * @param dateRange Date range to filter by
   * @returns Campaigns data
   */
  async getCampaigns(dateRange: DateRange) {
    try {
      // Get campaigns from Klaviyo API - use v2023-07-15 endpoint structure
      const response = await this.get('api/campaigns', {
        'filter': `equals(messages.channel,"email")`,
        'include': 'tags'
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
   * @returns Flows data
   */
  async getFlows() {
    try {
      // Get flows from Klaviyo API - use v2023-07-15 endpoint structure
      const response = await this.get('api/flows', {
        'include': 'tags',
        'fields[flow]': 'name,status,created,updated,trigger_type,tags'
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
   * @returns Flow messages data
   */
  async getFlowMessages(dateRange: DateRange) {
    try {
      // Format dates for Klaviyo API
      const startDate = new Date(dateRange.start).toISOString();
      const endDate = new Date(dateRange.end).toISOString();
      
      // Get flow messages from Klaviyo API - use v2023-07-15 endpoint structure
      const response = await this.get('api/flow-messages', {
        'fields[flow-message]': 'name,content,created,updated,status,position',
        'filter': `greater-or-equal(created,${startDate}),less-or-equal(created,${endDate})`,
        'page[size]': '50'
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
   * @returns Metrics data
   */
  async getMetrics() {
    try {
      // Get metrics from Klaviyo API - use v2023-07-15 endpoint structure
      const response = await this.get('api/metrics', {
        'page[size]': '50'
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
   * @param metricId Metric ID
   * @param dateRange Date range to filter by
   * @returns Metric aggregates data
   */
  async getMetricAggregates(metricId: string, dateRange: DateRange) {
    try {
      // Format dates for Klaviyo API
      const startDate = new Date(dateRange.start).toISOString();
      const endDate = new Date(dateRange.end).toISOString();
      
      // Get metric aggregates from Klaviyo API - use v2023-07-15 endpoint structure
      const response = await this.get(`api/metric-aggregates/${metricId}`, {
        'filter': `greater-or-equal(datetime,${startDate}),less-or-equal(datetime,${endDate})`,
        'page[size]': '100',
        'sort': 'datetime'
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
   * @returns Profiles data
   */
  async getProfiles(dateRange: DateRange) {
    try {
      // Format dates for Klaviyo API
      const startDate = new Date(dateRange.start).toISOString();
      const endDate = new Date(dateRange.end).toISOString();
      
      // Get profiles from Klaviyo API - use v2023-07-15 endpoint structure
      const response = await this.get('api/profiles', {
        'fields[profile]': 'email,phone_number,first_name,last_name,created,updated,subscriptions',
        'filter': `greater-or-equal(created,${startDate}),less-or-equal(created,${endDate})`,
        'page[size]': '50'
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
   */
  async getSegments() {
    try {
      // Get segments from Klaviyo API - use v2023-07-15 endpoint structure
      const response = await this.get('api/segments', {
        'fields[segment]': 'name,created,updated,profile_count',
        'page[size]': '50'
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
   * @param filter Additional filter criteria
   * @returns Events data
   */
  async getEvents(dateRange: DateRange, filter: string = '') {
    try {
      // Format dates for Klaviyo API
      const startDate = new Date(dateRange.start).toISOString();
      const endDate = new Date(dateRange.end).toISOString();
      
      // Build filter string
      let filterStr = `greater-or-equal(datetime,${startDate}),less-or-equal(datetime,${endDate})`;
      if (filter) {
        filterStr += `,${filter}`;
      }
      
      // Get events from Klaviyo API - use v2023-07-15 endpoint structure
      const response = await this.get('api/events', {
        'filter': filterStr,
        'sort': '-datetime',
        'page[size]': '50'
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
 * Create a singleton instance of the Klaviyo API client
 */
export const klaviyoApiClient = new KlaviyoApiClient(
  process.env.KLAVIYO_API_KEY || ''
);

export default klaviyoApiClient;
