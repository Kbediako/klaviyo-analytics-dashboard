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
    maxRetries: number = 3,
    retryDelay: number = 1000
  ) {
    if (!apiKey) {
      throw new Error('Klaviyo API key is required');
    }
    
    this.apiKey = apiKey;
    this.baseUrl = 'https://a.klaviyo.com/api';
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
    let retries = 0;
    let lastError: Error | null = null;

    while (retries <= this.maxRetries) {
      try {
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
          // If rate limited (429), retry after delay
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const retryDelay = retryAfter ? parseInt(retryAfter, 10) * 1000 : this.retryDelay;
            
            console.warn(`Rate limited by Klaviyo API. Retrying after ${retryDelay}ms...`);
            await this.delay(retryDelay);
            retries++;
            continue;
          }
          
          // For other errors, throw
          const errorText = await response.text();
          throw new Error(`Klaviyo API error (${response.status}): ${errorText}`);
        }
        
        return response.json() as Promise<T>;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // If we've reached max retries, throw the last error
        if (retries >= this.maxRetries) {
          console.error(`Failed after ${retries} retries:`, lastError);
          throw lastError;
        }
        
        // Otherwise, retry after delay
        console.warn(`Request failed (attempt ${retries + 1}/${this.maxRetries + 1}):`, lastError.message);
        await this.delay(this.retryDelay * Math.pow(2, retries)); // Exponential backoff
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
    // For now, return mock data instead of making API calls
    return Promise.resolve({
      data: []
    });
  }

  /**
   * Get flows from Klaviyo
   * 
   * @returns Flows data
   */
  async getFlows() {
    // For now, return mock data instead of making API calls
    return Promise.resolve({
      data: []
    });
  }

  /**
   * Get flow messages from Klaviyo
   * 
   * @param dateRange Date range to filter by
   * @returns Flow messages data
   */
  async getFlowMessages(dateRange: DateRange) {
    // For now, return mock data instead of making API calls
    return Promise.resolve({
      data: []
    });
  }

  /**
   * Get metrics from Klaviyo
   * 
   * @returns Metrics data
   */
  async getMetrics() {
    // For now, return mock data instead of making API calls
    return Promise.resolve({
      data: []
    });
  }

  /**
   * Get metric aggregates from Klaviyo
   * 
   * @param metricId Metric ID
   * @param dateRange Date range to filter by
   * @returns Metric aggregates data
   */
  async getMetricAggregates(metricId: string, dateRange: DateRange) {
    // For now, return mock data instead of making API calls
    return Promise.resolve({
      data: []
    });
  }

  /**
   * Get profiles from Klaviyo
   * 
   * @param dateRange Date range to filter by
   * @returns Profiles data
   */
  async getProfiles(dateRange: DateRange) {
    // For now, return mock data instead of making API calls
    return Promise.resolve({
      data: []
    });
  }

  /**
   * Get segments from Klaviyo
   * 
   * @returns Segments data
   */
  async getSegments() {
    // For now, return mock data instead of making API calls
    return Promise.resolve({
      data: []
    });
  }

  /**
   * Get events from Klaviyo
   * 
   * @param dateRange Date range to filter by
   * @param filter Additional filter criteria
   * @returns Events data
   */
  async getEvents(dateRange: DateRange, filter: string = '') {
    // For now, return mock data instead of making API calls
    // This will allow the frontend to work without valid API responses
    return Promise.resolve({
      data: []
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
