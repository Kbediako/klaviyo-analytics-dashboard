import fetch, { Response } from 'node-fetch';
import { JsonApiParams, buildQueryString } from '../../utils/jsonApiUtils';
import rateLimitManager from '../rateLimitManager';
import { 
  ApiError, 
  AuthenticationError, 
  ValidationError, 
  NetworkError,
  createErrorFromStatus
} from '../../utils/apiErrors';
import * as utils from './klaviyoApiUtils';

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
   * @param apiVersion API version to use (default: from env or '2025-01-15')
   * @param maxRetries Maximum number of retries for failed requests (default: 5)
   * @param retryDelay Base delay between retries in milliseconds (default: 2000)
   * @throws {AuthenticationError} If the API key is not provided
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
    const maskedKey = utils.maskApiKey(apiKey);
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
   */
  public async verifyApiKey(): Promise<void> {
    if (this.keyVerified) {
      return;
    }
    
    try {
      // Make a simple request to verify the API key
      // Using metrics endpoint as it's typically available to all accounts
      const url = `${this.baseUrl}/api/metrics`;
      const headers = utils.getHeaders(this.apiKey, this.apiVersion);
      
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
    const requestId = utils.generateRequestId();
    const maskedKey = utils.maskApiKey(this.apiKey);
    utils.logRequest(requestId, normalizedEndpoint, url, maskedKey);
    
    // Calculate delay based on rate limits
    const delay = await rateLimitManager.calculateDelay(normalizedEndpoint);
    
    // Ensure minimum time between requests
    const now = Date.now();
    const timeToWait = Math.max(0, this.lastRequestTime + delay - now);
    if (timeToWait > 0) {
      console.log(`API Request [${requestId}]: Waiting ${timeToWait}ms before request`);
      await utils.delay(timeToWait);
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
        
        const headers = utils.getHeaders(this.apiKey, this.apiVersion);
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
            await utils.delay(retryDelay);
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
        utils.logResponseHeaders(requestId, response.headers);
        
        // Check if response is JSON or JSON:API
        const contentType = response.headers.get('content-type');
        await utils.validateContentType(requestId, contentType, response);
        
        // Parse JSON response
        const data = await utils.parseJsonResponse<T>(requestId, response);
        
        // Log success
        utils.logSuccess(requestId, endpoint, data);
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
          utils.logFailure(requestId, retries, lastError);
          throw lastError;
        }
        
        // Otherwise, retry after delay with more aggressive backoff
        const delay = this.retryDelay * Math.pow(3, retries); // More aggressive exponential backoff
        utils.logRetry(requestId, retries + 1, this.maxRetries + 1, lastError.message, delay);
        await utils.delay(delay);
        retries++;
      }
    }

    // This should never happen, but TypeScript needs it
    throw lastError || new ApiError('Unknown error occurred');
  }
  
  /**
   * Rotate the API key (useful for key rotation in production)
   * 
   * @param newApiKey New API key to use
   * @returns Promise that resolves when key rotation is complete
   * @throws {AuthenticationError} If the new API key is invalid
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
      const oldKey = utils.maskApiKey(this.apiKey);
      this.apiKey = newApiKey;
      this.keyVerified = true; // Mark as verified since we just checked it
      
      console.log(`API key rotated successfully from ${oldKey} to ${utils.maskApiKey(newApiKey)}`);
    } catch (error) {
      // If verification fails, throw an error and keep the old key
      console.error('API key rotation failed:', error);
      throw new AuthenticationError(`Failed to rotate API key: ${error instanceof Error ? error.message : String(error)}`);
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
