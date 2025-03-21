import fetch, { Response } from 'node-fetch';
import { DateRange } from '../utils/dateUtils';
import { JsonApiParams, FilterParam, buildQueryString, parseJsonApiResponse } from '../utils/jsonApiUtils';
import rateLimitManager from './rateLimitManager';
import { 
  ApiError, 
  AuthenticationError, 
  RateLimitError, 
  NotFoundError, 
  ValidationError, 
  ServerError, 
  NetworkError, 
  TimeoutError,
  createErrorFromStatus
} from '../utils/apiErrors';

// Define response types for better type safety
export interface KlaviyoApiResponse<T> {
  data: T[];
  links?: {
    self?: string;
    first?: string;
    prev?: string;
    next?: string;
    last?: string;
  };
  meta?: {
    total?: number;
    page_count?: number;
    next_cursor?: string;
  };
  included?: any[];
}

/**
 * Klaviyo API Client for making requests to the Klaviyo API
 * 
 * This client handles authentication, rate limiting, retries, and error handling
 * for all requests to the Klaviyo API. It provides methods for common API operations
 * and utilities for working with the JSON:API format.
 * 
 * The client implements the latest Klaviyo API standards including:
 * - Bearer token authentication
 * - JSON:API parameter formatting
 * - Rate limiting with dynamic backoff
 * - Comprehensive error handling
 * - Request deduplication
 * 
 * @see https://developers.klaviyo.com/en/reference/api-overview
 * 
 * @example
 * ```typescript
 * // Create a client with default settings
 * const client = new KlaviyoApiClient(process.env.KLAVIYO_API_KEY);
 * 
 * // Get campaigns with date range
 * const campaigns = await client.getCampaigns({
 *   start: '2023-01-01T00:00:00Z',
 *   end: '2023-01-31T23:59:59Z'
 * });
 * 
 * // Get metrics with custom parameters
 * const metrics = await client.get('api/metrics', {
 *   fields: {
 *     metric: ['name', 'created', 'updated']
 *   },
 *   page: {
 *     size: 50
 *   }
 * });
 * ```
 */
export class KlaviyoApiClient {
  private apiKey: string;
  private baseUrl: string;
  private apiVersion: string;
  private maxRetries: number;
  private retryDelay: number;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private lastRequestTime: number = 0;
  private isInitialized: boolean = false;
  private keyVerified: boolean = false;

  /**
   * Create a new Klaviyo API client
   * 
   * @param apiKey Klaviyo API key (Private API key recommended for backend usage)
   * @param apiVersion API version to use (default: from env or '2023-12-15')
   * @param maxRetries Maximum number of retries for failed requests (default: 5)
   * @param retryDelay Base delay between retries in milliseconds (default: 2000)
   * @throws {AuthenticationError} If the API key is not provided
   * 
   * @remarks
   * The Klaviyo API uses semantic versioning with date-based versions (YYYY-MM-DD).
   * The client will use the version specified in the KLAVIYO_API_VERSION environment
   * variable if available, otherwise it will use the provided version or the default.
   * 
   * API keys should be kept secure and never exposed to the client side.
   * 
   * @example
   * ```typescript
   * // Create with environment variables
   * const client = new KlaviyoApiClient(process.env.KLAVIYO_API_KEY);
   * 
   * // Create with custom settings
   * const client = new KlaviyoApiClient(
   *   'pk_1234567890',
   *   '2023-12-15',
   *   3,
   *   1000
   * );
   * ```
   */
  constructor(
    apiKey: string, 
    apiVersion?: string,
    maxRetries: number = 5,
    retryDelay: number = 2000
  ) {
    if (!apiKey) {
      throw new AuthenticationError('Klaviyo API key is required');
    }
    
    this.apiKey = apiKey;
    this.baseUrl = 'https://a.klaviyo.com';
    
    // Use environment variable if available, otherwise use provided version or default
    // Updated to latest API version as of March 2025
    this.apiVersion = apiVersion || process.env.KLAVIYO_API_VERSION || '2025-01-15';
    
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
    
    // Log initialization with masked API key for security
    const maskedKey = this.maskApiKey(apiKey);
    console.log(`Initializing Klaviyo API client with API key: ${maskedKey}, version: ${this.apiVersion}`);
  }
  
  /**
   * Initialize the client by verifying the API key and API version
   * This is called automatically on the first API request, but can be called manually
   * to verify the API key and version before making any requests.
   * 
   * @returns Promise that resolves when initialization is complete
   * @throws {AuthenticationError} If the API key is invalid
   * @throws {ApiError} If the API version is not supported
   * 
   * @remarks
   * This method makes a test request to the Klaviyo API to verify that the API key
   * is valid and has the necessary permissions. It also confirms that the specified
   * API version is supported by Klaviyo. It's recommended to call this method
   * during application startup to catch authentication and configuration issues early.
   * 
   * @example
   * ```typescript
   * const client = new KlaviyoApiClient(process.env.KLAVIYO_API_KEY);
   * try {
   *   await client.initialize();
   *   console.log('Klaviyo API client initialized successfully');
   * } catch (error) {
   *   console.error('Failed to initialize Klaviyo API client:', error);
   *   process.exit(1);
   * }
   * ```
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      // Verify API key and version in a single request
      await this.verifyApiKey();
      this.isInitialized = true;
      console.log('Klaviyo API client initialized successfully');
      console.log(`Using API version: ${this.apiVersion}`);
    } catch (error) {
      this.isInitialized = false;
      console.error('Failed to initialize Klaviyo API client:', error);
      throw error;
    }
  }
  
  /**
   * Verify that the API key is valid by making a test request
   * 
   * @returns Promise that resolves when verification is complete
   * @throws {AuthenticationError} If the API key is invalid
   * @throws {ApiError} If the verification request fails for other reasons
   * 
   * @remarks
   * This method makes a lightweight request to the metrics endpoint to verify
   * that the API key is valid. It checks for 401/403 responses which indicate
   * authentication issues, and handles other error responses appropriately.
   * 
   * The method also validates that the API version is supported by checking
   * the response headers for version-related errors.
   * 
   * @example
   * ```typescript
   * try {
   *   await client.verifyApiKey();
   *   console.log('API key is valid');
   * } catch (error) {
   *   if (error instanceof AuthenticationError) {
   *     console.error('Authentication failed:', error.message);
   *   } else {
   *     console.error('API key verification failed:', error.message);
   *   }
   * }
   * ```
   */
  public async verifyApiKey(): Promise<void> {
    if (this.keyVerified) {
      return;
    }
    
    try {
      // Make a simple request to verify the API key
      // Using metrics endpoint as it's typically available to all accounts
      const url = `${this.baseUrl}/api/metrics?page[size]=1`;
      const headers = this.getHeaders();
      
      console.log('Verifying API key with request to:', url);
      console.log('Using API version:', this.apiVersion);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });
      
      // Check for API version issues in headers
      const versionError = response.headers.get('x-version-error');
      if (versionError) {
        throw new ApiError(`API version error: ${versionError}`);
      }
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          const errorText = await response.text();
          throw new AuthenticationError(`Invalid API key: ${errorText}`);
        } else {
          const errorText = await response.text();
          throw createErrorFromStatus(response.status, `API key verification failed: ${errorText}`);
        }
      }
      
      // Check response body to ensure it's valid JSON:API format
      try {
        const data = await response.json();
        if (!data || !data.data) {
          throw new ApiError('Invalid API response format');
        }
      } catch (jsonError) {
        throw new ApiError(`Invalid API response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
      }
      
      this.keyVerified = true;
      console.log('API key verified successfully');
      console.log('API version confirmed:', this.apiVersion);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      } else {
        throw new AuthenticationError(`API key verification failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Make a GET request to the Klaviyo API with retry mechanism and rate limiting
   * 
   * @param endpoint API endpoint (e.g., 'api/campaigns')
   * @param params JSON:API parameters or query parameters
   * @returns Response data
   * @throws {ApiError} If the request fails after retries
   * @throws {AuthenticationError} If the API key is invalid
   * @throws {RateLimitError} If rate limits are exceeded and retries fail
   * @throws {NotFoundError} If the requested resource is not found
   * @throws {ValidationError} If the request parameters are invalid
   * @throws {ServerError} If the server returns an error
   * @throws {NetworkError} If a network error occurs
   * @throws {TimeoutError} If the request times out
   * 
   * @typeParam T - The type of data expected in the response
   * 
   * @remarks
   * This method handles all aspects of making requests to the Klaviyo API:
   * - Automatic initialization and API key verification
   * - Request deduplication (prevents duplicate in-flight requests)
   * - Rate limiting with dynamic backoff
   * - Retries with exponential backoff
   * - Comprehensive error handling
   * - Detailed logging for debugging
   * 
   * The method supports both JSON:API parameters (filter, sort, include, fields, page)
   * and simple query parameters as a Record<string, string>.
   * 
   * @example
   * ```typescript
   * // Simple request
   * const campaigns = await client.get<KlaviyoApiResponse<Campaign>>('api/campaigns');
   * 
   * // With JSON:API parameters
   * const filteredCampaigns = await client.get<KlaviyoApiResponse<Campaign>>('api/campaigns', {
   *   filter: [
   *     {
   *       field: 'messages.channel',
   *       operator: 'equals',
   *       value: 'email'
   *     }
   *   ],
   *   include: ['tags'],
   *   fields: {
   *     campaign: ['name', 'status', 'created']
   *   },
   *   page: {
   *     size: 50
   *   }
   * });
   * 
   * // With query parameters
   * const metrics = await client.get<KlaviyoApiResponse<Metric>>('api/metrics', {
   *   'page[size]': '50',
   *   'sort': '-created'
   * });
   * ```
   */
  async get<T>(endpoint: string, params: Record<string, string> | JsonApiParams = {}): Promise<T> {
    // Ensure client is initialized
    if (!this.isInitialized && !this.keyVerified) {
      await this.initialize();
    }
    // Ensure endpoint starts with 'api/' if not already
    const normalizedEndpoint = endpoint.startsWith('api/') ? endpoint : `api/${endpoint}`;
    
    // Generate URL with query parameters
    let url: string;
    
    if ('filter' in params || 'sort' in params || 'include' in params || 'fields' in params || 'page' in params) {
      // If params is a JsonApiParams object, use buildQueryString
      url = `${this.baseUrl}/${normalizedEndpoint}${buildQueryString(params as JsonApiParams)}`;
    } else {
      // Otherwise, treat as Record<string, string>
      const queryParams = new URLSearchParams();
      Object.entries(params as Record<string, string>).forEach(([key, value]) => {
        queryParams.append(key, value);
      });
      url = `${this.baseUrl}/${normalizedEndpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    }
    
    // Create a cache key for request deduplication
    const cacheKey = url;
    
    // Check for in-flight request with the same URL
    if (this.requestQueue.has(cacheKey)) {
      console.log(`Using in-flight request for ${normalizedEndpoint}`);
      return this.requestQueue.get(cacheKey) as Promise<T>;
    }
    
    // Add request ID for logging
    const requestId = Math.random().toString(36).substring(2, 9);
    const maskedKey = this.maskApiKey(this.apiKey);
    console.log(`API Request [${requestId}]: ${normalizedEndpoint} starting with API key: ${maskedKey}`);
    console.log(`API Request [${requestId}]: URL: ${url}`);
    
    // Calculate delay based on rate limits
    const delay = await rateLimitManager.calculateDelay(normalizedEndpoint);
    
    // Ensure minimum time between requests
    const now = Date.now();
    const timeToWait = Math.max(0, this.lastRequestTime + delay - now);
    if (timeToWait > 0) {
      console.log(`API Request [${requestId}]: Waiting ${timeToWait}ms before request`);
      await this.delay(timeToWait);
    }
    
    // Create the request promise
    const requestPromise = this.executeWithRetries<T>(url, normalizedEndpoint, requestId);
    
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
   * Mask API key for logging (show only first 5 and last 3 characters)
   * 
   * @param apiKey API key to mask
   * @returns Masked API key
   */
  private maskApiKey(apiKey: string): string {
    if (apiKey.length <= 8) {
      return '*'.repeat(apiKey.length);
    }
    return `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 3)}`;
  }
  
  /**
   * Execute a request with retries
   * 
   * @param url Full URL to request
   * @param endpoint Original endpoint for logging
   * @param requestId Request ID for logging
   * @returns Response data
   * @throws {ApiError} If the request fails after retries
   */
  private async executeWithRetries<T>(url: string, endpoint: string, requestId: string): Promise<T> {
    let retries = 0;
    let lastError: Error | null = null;
    
    while (retries <= this.maxRetries) {
      try {
        console.log(`API Request [${requestId}]: ${endpoint} attempt ${retries + 1}/${this.maxRetries + 1}`);
        
        const headers = this.getHeaders();
        console.log(`API Request [${requestId}]: Headers:`, headers);
        
        let response: Response;
        try {
          response = await fetch(url, {
            method: 'GET',
            headers: headers,
          });
        } catch (networkError) {
          // Handle network errors (e.g., connection issues)
          throw new NetworkError(`Network error: ${networkError instanceof Error ? networkError.message : String(networkError)}`);
        }
        
        console.log(`API Request [${requestId}]: Response status:`, response.status);
        
        // Update rate limit information from response headers
        rateLimitManager.updateFromHeaders(endpoint, response.headers);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API Request [${requestId}]: Error response (${response.status}):`, errorText);
          
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
          
          // For other errors, throw appropriate error type
          throw createErrorFromStatus(
            response.status, 
            `Klaviyo API error (${response.status}): ${errorText}`,
            response.headers.get('Retry-After') ? parseInt(response.headers.get('Retry-After') || '60', 10) * 1000 : undefined
          );
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
          throw new ApiError(`Klaviyo API returned non-JSON response: ${contentType}`);
        }
        
        let data: T;
        try {
          data = await response.json() as T;
        } catch (jsonError) {
          console.error(`API Request [${requestId}]: JSON parsing error:`, jsonError);
          throw new ApiError(`Failed to parse JSON response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
        }
        
        console.log(`API Request [${requestId}]: ${endpoint} completed successfully`);
        console.log(`API Request [${requestId}]: Response data:`, JSON.stringify(data).substring(0, 500) + '...');
        return data;
      } catch (error) {
        // If it's already an ApiError, just rethrow it on max retries
        if (error instanceof ApiError) {
          lastError = error;
          
          // Don't retry authentication errors
          if (error instanceof AuthenticationError) {
            console.error(`API Request [${requestId}]: Authentication error:`, error.message);
            throw error;
          }
          
          // Don't retry validation errors
          if (error instanceof ValidationError) {
            console.error(`API Request [${requestId}]: Validation error:`, error.message);
            throw error;
          }
        } else {
          // Convert other errors to ApiError
          lastError = new ApiError(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
        }
        
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
    throw lastError || new ApiError('Unknown error occurred');
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
   * Uses Bearer token format according to latest Klaviyo API standards
   *
   * @returns Headers object with authorization and content type
   * 
   * @remarks
   * The Klaviyo API requires the following headers:
   * - Authorization: Bearer token for authentication
   * - Accept: application/json for JSON responses
   * - revision: API version in YYYY-MM-DD format
   * - Content-Type: application/json for request bodies
   * 
   * Note that the 'revision' header is case-sensitive and must be lowercase
   * according to the latest Klaviyo API documentation.
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
   * Rotate the API key (useful for key rotation in production)
   * 
   * @param newApiKey New API key to use
   * @returns Promise that resolves when key rotation is complete
   * @throws {AuthenticationError} If the new API key is invalid
   * 
   * @example
   * ```typescript
   * try {
   *   await client.rotateApiKey(process.env.NEW_KLAVIYO_API_KEY);
   *   console.log('API key rotated successfully');
   * } catch (error) {
   *   console.error('API key rotation failed:', error.message);
   * }
   * ```
   */
  public async rotateApiKey(newApiKey: string): Promise<void> {
    if (!newApiKey) {
      throw new AuthenticationError('New API key is required');
    }
    
    // Create a temporary client to verify the new key
    const tempClient = new KlaviyoApiClient(newApiKey, this.apiVersion);
    
    try {
      // Verify the new key works
      await tempClient.verifyApiKey();
      
      // If verification succeeds, update this client's key
      const oldKey = this.maskApiKey(this.apiKey);
      this.apiKey = newApiKey;
      this.keyVerified = true; // Mark as verified since we just checked it
      
      console.log(`API key rotated successfully from ${oldKey} to ${this.maskApiKey(newApiKey)}`);
    } catch (error) {
      // If verification fails, throw an error and keep the old key
      console.error('API key rotation failed:', error);
      throw new AuthenticationError(`Failed to rotate API key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get campaigns from Klaviyo
   * 
   * @param dateRange Date range to filter by
   * @returns Campaigns data with included tags
   * @throws {ApiError} If the request fails
   * 
   * @remarks
   * This method retrieves email campaigns from Klaviyo with their associated tags.
   * It filters for email campaigns only and includes fields such as name, status,
   * creation date, update date, archived status, send time, and tags.
   * 
   * The method handles errors gracefully and returns an empty data array if the
   * request fails, allowing the application to continue functioning with fallback data.
   * 
   * @example
   * ```typescript
   * // Get campaigns for the last 30 days
   * const campaigns = await client.getCampaigns({
   *   start: '2023-01-01T00:00:00Z',
   *   end: '2023-01-31T23:59:59Z'
   * });
   * 
   * // Process campaign data
   * const campaignNames = campaigns.data.map(campaign => campaign.attributes.name);
   * ```
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
   * @returns Flows data with included tags
   * @throws {ApiError} If the request fails and error is not handled internally
   * 
   * @remarks
   * This method retrieves flows from Klaviyo with their associated tags.
   * It includes fields such as name, status, creation date, update date,
   * trigger type, and tags.
   * 
   * The method handles errors gracefully and returns an empty data array if the
   * request fails, allowing the application to continue functioning with fallback data.
   * 
   * @example
   * ```typescript
   * // Get all flows
   * const flows = await client.getFlows();
   * 
   * // Get active flows only
   * const activeFlows = flows.data.filter(flow => 
   *   flow.attributes.status === 'active'
   * );
   * ```
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
   * @returns Flow messages data filtered by date range
   * @throws {ApiError} If the request fails and error is not handled internally
   * 
   * @remarks
   * This method retrieves flow messages from Klaviyo within the specified date range.
   * It includes fields such as name, content, creation date, update date, status,
   * and position within the flow.
   * 
   * The method handles errors gracefully and returns an empty data array if the
   * request fails, allowing the application to continue functioning with fallback data.
   * 
   * @example
   * ```typescript
   * // Get flow messages for the last 30 days
   * const flowMessages = await client.getFlowMessages({
   *   start: '2023-01-01T00:00:00Z',
   *   end: '2023-01-31T23:59:59Z'
   * });
   * 
   * // Get message content
   * const messageContents = flowMessages.data.map(message => message.attributes.content);
   * ```
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
   * @returns Metrics data with type and integration information
   * @throws {ApiError} If the request fails and error is not handled internally
   * 
   * @remarks
   * This method retrieves metrics from Klaviyo, including fields such as name,
   * creation date, update date, integration, and type.
   * 
   * Metrics represent different types of events tracked in Klaviyo, such as
   * "Placed Order", "Opened Email", "Clicked Email", etc.
   * 
   * The method handles errors gracefully and returns an empty data array if the
   * request fails, allowing the application to continue functioning with fallback data.
   * 
   * @example
   * ```typescript
   * // Get all metrics
   * const metrics = await client.getMetrics();
   * 
   * // Get email-related metrics only
   * const emailMetrics = metrics.data.filter(metric => 
   *   metric.attributes.integration && metric.attributes.integration.includes('email')
   * );
   * ```
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
   * @param metricId Metric ID to get aggregates for
   * @param dateRange Date range to filter by
   * @returns Metric aggregates data for the specified metric and date range
   * @throws {ApiError} If the request fails and error is not handled internally
   * 
   * @remarks
   * This method retrieves aggregated data for a specific metric within the specified
   * date range. The data is sorted by datetime in ascending order.
   * 
   * Metric aggregates provide time-series data for metrics, allowing for trend analysis
   * and visualization over time.
   * 
   * The method handles errors gracefully and returns an empty data array if the
   * request fails, allowing the application to continue functioning with fallback data.
   * 
   * @example
   * ```typescript
   * // Get aggregates for the "Placed Order" metric for the last 30 days
   * const aggregates = await client.getMetricAggregates('placed-order', {
   *   start: '2023-01-01T00:00:00Z',
   *   end: '2023-01-31T23:59:59Z'
   * });
   * 
   * // Extract values for charting
   * const dataPoints = aggregates.data.map(point => ({
   *   date: new Date(point.attributes.datetime),
   *   value: point.attributes.value
   * }));
   * ```
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
   * @returns Profiles data filtered by creation date
   * @throws {ApiError} If the request fails and error is not handled internally
   * 
   * @remarks
   * This method retrieves customer profiles from Klaviyo created within the specified
   * date range. It includes fields such as email, phone number, first name, last name,
   * creation date, update date, and subscription information.
   * 
   * Profiles represent customer data in Klaviyo and can be used for segmentation,
   * personalization, and analysis.
   * 
   * The method handles errors gracefully and returns an empty data array if the
   * request fails, allowing the application to continue functioning with fallback data.
   * 
   * @example
   * ```typescript
   * // Get profiles created in the last 30 days
   * const profiles = await client.getProfiles({
   *   start: '2023-01-01T00:00:00Z',
   *   end: '2023-01-31T23:59:59Z'
   * });
   * 
   * // Get email addresses
   * const emails = profiles.data.map(profile => profile.attributes.email).filter(Boolean);
   * ```
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
   * @returns Segments data with profile counts
   * @throws {ApiError} If the request fails and error is not handled internally
   * 
   * @remarks
   * This method retrieves segments from Klaviyo, including fields such as name,
   * creation date, update date, and profile count.
   * 
   * Segments represent groups of profiles that match specific criteria, such as
   * "Active Subscribers", "High-Value Customers", etc.
   * 
   * The method handles errors gracefully and returns an empty data array if the
   * request fails, allowing the application to continue functioning with fallback data.
   * 
   * @example
   * ```typescript
   * // Get all segments
   * const segments = await client.getSegments();
   * 
   * // Get segments with more than 100 profiles
   * const largeSegments = segments.data.
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
