/**
 * Core API client functionality
 */

import { FetchOptions, FetchParams } from './types';
import { ApiError, createApiError, createNetworkError, createUnknownError } from './errors';
import { 
  getCachedEntry, 
  setCacheEntry, 
  getPendingRequest, 
  setPendingRequest, 
  removePendingRequest,
  generateCacheKey 
} from './cache';
import { isObject } from './typeGuards';

// Track last updated timestamps for each endpoint
export const lastUpdatedTimestamps: Record<string, Date> = {};
import { defaultOptions, getFullUrl, throttleRequest } from './config';
import { withRetry, handleRateLimit } from './retry';
import { getFallbackData } from './fallback';

/**
 * Generic function to fetch data from the API with caching
 */
export async function fetchFromAPI<T>(
  endpoint: string, 
  options: FetchOptions = {}, 
  skipCache: boolean = false,
  forceFresh: boolean = false
): Promise<T> {
  const { params, ...fetchOptions } = options;
  const url = getFullUrl(endpoint, params, forceFresh);
  const cacheKey = generateCacheKey(url, fetchOptions);
  
  // Check cache for all requests, including date range requests
  if (!skipCache) {
    const cachedData = getCachedEntry<T>(cacheKey);
    if (cachedData) {
      console.log(`Using cached data for ${endpoint}`);
      return cachedData;
    }
  }
  
  // Check if there's already an in-flight request for this URL
  const pendingRequest = getPendingRequest<T>(cacheKey);
  if (pendingRequest) {
    console.log(`Using pending request for ${endpoint}`);
    return pendingRequest;
  }
  
  // Implement request throttling
  await throttleRequest();
  
  // Create the fetch promise with retry logic
  const makeRequest = async () => {
    try {
      console.log(`Fetching from API: ${endpoint}`);
      
      const response = await fetch(url, {
        ...defaultOptions,
        ...fetchOptions,
      });

      if (!response.ok) {
        // Try to parse error data, but handle case where it's not valid JSON
        let errorData: unknown = {};
        try {
          errorData = await response.json();
        } catch (e) {
          // If JSON parsing fails, use empty object
          console.warn(`Failed to parse error response as JSON: ${e}`);
        }
        
        // Extract error message with type safety
        let errorMessage = response.statusText;
        if (isObject(errorData) && typeof errorData.message === 'string') {
          errorMessage = errorData.message;
        }
        
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfterHeader = response.headers.get('Retry-After');
          const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60;
          await handleRateLimit(retryAfter);
          
          // Use cached data if available
          const cachedData = getCachedEntry<T>(cacheKey);
          if (cachedData) {
            return cachedData;
          }
        }
        
        throw createApiError(response.status, errorMessage);
      }

      // Parse response with error handling
      let data: unknown;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error(`Failed to parse JSON response: ${jsonError}`);
        throw createApiError(500, `Invalid JSON response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
      }
      
      // Store in cache and update timestamp
      setCacheEntry(cacheKey, data as T);
      lastUpdatedTimestamps[endpoint] = new Date();
      
      return data as T;
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw createNetworkError();
      }

      // Log error for monitoring
      console.error(`API request failed for ${endpoint}:`, {
        error,
        endpoint,
        params,
        timestamp: new Date().toISOString()
      });

      // Handle ApiError (from our error handling above)
      if (error instanceof ApiError) {
        // For certain error types, try to recover with cached data
        const cachedData = getCachedEntry<T>(cacheKey);
        if (cachedData) {
          console.log(`Recovering with cached data for ${endpoint}`);
          return cachedData;
        }
        
        // If no cached data, try fallback data
        return getFallbackData(endpoint) as T;
      }

      // For unknown errors, throw as ApiError
      throw createUnknownError(error);
    } finally {
      // Remove from pending requests map
      removePendingRequest(cacheKey);
    }
  };

  // Create and store the promise
  const promise = withRetry(makeRequest);
  setPendingRequest(cacheKey, promise);
  
  return promise;
}
