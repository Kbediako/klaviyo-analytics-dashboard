import fetch from 'node-fetch';
import { DateRange } from '../utils/dateUtils';
import { JsonApiParams, FilterParam, buildQueryString } from '../utils/jsonApiUtils';
import rateLimitManager from './rateLimitManager';

/**
 * Klaviyo API Client for making requests to the Klaviyo API
 */
export class KlaviyoApiClient {
  private apiKey: string;
  private baseUrl: string;
  private apiVersion: string;
  private maxRetries: number;
  private retryDelay: number;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private lastRequestTime: number = 0;

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
   * Make a GET request to the Klaviyo API with retry mechanism and rate limiting
   * 
   * @param endpoint API endpoint (e.g., 'campaigns')
   * @param params JSON:API parameters
   * @returns Response data
   */
  async get<T>(endpoint: string, params: Record<string, string> | JsonApiParams = {}): Promise<T> {
    // Generate URL with query parameters
    let url: string;
    
    if ('filter' in params || 'sort' in params || 'include' in params || 'fields' in params || 'page' in params) {
      // If params is a JsonApiParams object, use buildQueryString
      url = `${this.baseUrl}/${endpoint}${buildQueryString(params as JsonApiParams)}`;
    } else {
      // Otherwise, treat as Record<string, string>
      const queryParams = new URLSearchParams();
      Object.entries(params as Record<string, string>).forEach(([key, value]) => {
        queryParams.append(key, value);
      });
      url = `${this.baseUrl}/${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    }
    
    // Create a cache key for request deduplication
    const cacheKey = url;
    
    // Check for in-flight request with the same URL
    if (this.requestQueue.has(cacheKey)) {
      console.log(`Using in-flight request for ${endpoint}`);
      return this.requestQueue.get(cacheKey) as Promise<T>;
    }
    
    // Add request ID for logging
    const requestId = Math.random().toString(36).substring(2, 9);
    const apiKey = this.apiKey.substring(0, 5) + "..."; // Only show first 5 chars for security
    console.log(`API Request [${requestId}]: ${endpoint} starting with API key: ${apiKey}`);
    console.log(`API Request [${requestId}]: URL: ${url}`);
    
    // Calculate delay based on rate limits
    const delay = await rateLimitManager.calculateDelay(endpoint);
    
    // Ensure minimum time between requests
    const now = Date.now();
    const timeToWait = Math.max(0, this.lastRequestTime + delay - now);
    if (timeToWait > 0) {
      console.log(`API Request [${requestId}]: Waiting ${timeToWait}ms before request`);
      await this.delay(timeToWait);
    }
    
    // Create the request promise
    const requestPromise = this.executeWithRetries<T>(url, endpoint, requestId);
    
    // Store in request queue to prevent duplicate in-flight requests
    this.requestQueue.set(cacheKey, requestPromise);
    
    // Update last request time
    this.lastRequestTime = Date.now();
    
    try {
      return await requestPromise;
    } finally {
      // Remove from request queue when done
      this.requestQueue.delete(cacheKey);
    }
  }
  
  /**
   * Execute a request with retries
   * 
   * @param url Full URL to request
   * @param endpoint Original endpoint for logging
   * @param requestId Request ID for logging
   * @returns Response data
   */
  private async executeWithRetries<T>(url: string, endpoint: string, requestId: string): Promise<T> {
    let retries = 0;
    let lastError: Error | null = null;
    
    while (retries <= this.maxRetries) {
      try {
        console.log(`API Request [${requestId}]: ${endpoint} attempt ${retries + 1}/${this.maxRetries + 1}`);
        
        const headers = this.getHeaders();
        console.log(`API Request [${requestId}]: Headers:`, headers);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: headers,
        });
        
        console.log(`API Request [${requestId}]: Response status:`, response.status);
        
        // Update rate limit information from response headers
        rateLimitManager.updateFromHeaders(endpoint, response.headers);
        
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
   * Updated to use Bearer token format according to latest Klaviyo API standards
   *
   * @returns Headers object
   */
  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json',
      'revision': this.apiVersion,
      'Content-Type': 'application/json'
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
      // Get campaigns from Klaviyo API using JSON:API parameters
      const response = await this.get('api/campaigns', {
        filter: [
          {
            field: 'messages.channel',
            operator: 'equals',
            value: 'email'
          }
        ],
        include: ['tags'],
        fields: {
          campaign: ['name', 'status', 'created', 'updated', 'archived', 'send_time', 'tags']
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
   * @returns Flows data
   */
  async getFlows() {
    try {
      // Get flows from Klaviyo API using JSON:API parameters
      const response = await this.get('api/flows', {
        include: ['tags'],
        fields: {
          flow: ['name', 'status', 'created', 'updated', 'trigger_type', 'tags']
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
   * @returns Flow messages data
   */
  async getFlowMessages(dateRange: DateRange) {
    try {
      // Get flow messages from Klaviyo API using JSON:API parameters
      const response = await this.get('api/flow-messages', {
        filter: [
          {
            field: 'created',
            operator: 'greater-or-equal',
            value: new Date(dateRange.start)
          },
          {
            field: 'created',
            operator: 'less-or-equal',
            value: new Date(dateRange.end)
          }
        ],
        fields: {
          'flow-message': ['name', 'content', 'created', 'updated', 'status', 'position']
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
   * @returns Metrics data
   */
  async getMetrics() {
    try {
      // Get metrics from Klaviyo API using JSON:API parameters
      const response = await this.get('api/metrics', {
        fields: {
          metric: ['name', 'created', 'updated', 'integration', 'type']
        },
        page: {
          size: 50
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
   * @param metricId Metric ID
   * @param dateRange Date range to filter by
   * @returns Metric aggregates data
   */
  async getMetricAggregates(metricId: string, dateRange: DateRange) {
    try {
      // Get metric aggregates from Klaviyo API using JSON:API parameters
      const response = await this.get(`api/metric-aggregates/${metricId}`, {
        filter: [
          {
            field: 'datetime',
            operator: 'greater-or-equal',
            value: new Date(dateRange.start)
          },
          {
            field: 'datetime',
            operator: 'less-or-equal',
            value: new Date(dateRange.end)
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
   * @returns Profiles data
   */
  async getProfiles(dateRange: DateRange) {
    try {
      // Get profiles from Klaviyo API using JSON:API parameters
      const response = await this.get('api/profiles', {
        filter: [
          {
            field: 'created',
            operator: 'greater-or-equal',
            value: new Date(dateRange.start)
          },
          {
            field: 'created',
            operator: 'less-or-equal',
            value: new Date(dateRange.end)
          }
        ],
        fields: {
          profile: ['email', 'phone_number', 'first_name', 'last_name', 'created', 'updated', 'subscriptions']
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
   */
  async getSegments() {
    try {
      // Get segments from Klaviyo API using JSON:API parameters
      const response = await this.get('api/segments', {
        fields: {
          segment: ['name', 'created', 'updated', 'profile_count']
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
   */
  async getEvents(dateRange: DateRange, additionalFilters: FilterParam[] = []) {
    try {
      // Create base filters for date range
      const filters: FilterParam[] = [
        {
          field: 'datetime',
          operator: 'greater-or-equal',
          value: new Date(dateRange.start)
        },
        {
          field: 'datetime',
          operator: 'less-or-equal',
          value: new Date(dateRange.end)
        },
        ...additionalFilters
      ];
      
      // Get events from Klaviyo API using JSON:API parameters
      const response = await this.get('api/events', {
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
 * Create a singleton instance of the Klaviyo API client
 */
export const klaviyoApiClient = new KlaviyoApiClient(
  process.env.KLAVIYO_API_KEY || ''
);

export default klaviyoApiClient;
