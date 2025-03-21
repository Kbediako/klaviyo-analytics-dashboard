/**
 * Configuration for the API client
 */

// Default options for fetch requests
export const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// Delay between API requests to avoid overwhelming the backend
export const API_REQUEST_DELAY = 1000; // 1 second

// Retry configuration
export const MAX_RETRIES = 3;
export const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Get API base URL from URL parameter, environment variable, or default
 */
export function getApiBaseUrl(): string {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // Check for apiUrl in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const apiUrlParam = urlParams.get('apiUrl');
    if (apiUrlParam) {
      return apiUrlParam;
    }
  }
  
  // Fall back to environment variable or default
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
}

// Base URL for API requests
export const API_BASE_URL = getApiBaseUrl();

/**
 * Get query string from parameters
 */
export function getQueryString(params?: Record<string, any>, forceFresh?: boolean): string {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
  }
  
  // Add timestamp for cache busting if forceFresh is true
  if (forceFresh) {
    queryParams.append('_t', Date.now().toString());
  }
  
  return queryParams.toString() ? `?${queryParams.toString()}` : '';
}

/**
 * Get full URL for endpoint
 */
export function getFullUrl(endpoint: string, params?: Record<string, any>, forceFresh?: boolean): string {
  const queryString = getQueryString(params, forceFresh);
  return `${API_BASE_URL}${endpoint}${queryString}`;
}

/**
 * Throttle requests to avoid overwhelming the backend
 */
let lastRequestTime = 0;

export async function throttleRequest(): Promise<void> {
  const now = Date.now();
  const timeToWait = Math.max(0, API_REQUEST_DELAY - (now - lastRequestTime));
  
  if (timeToWait > 0) {
    await new Promise(resolve => setTimeout(resolve, timeToWait));
  }
  
  lastRequestTime = Date.now();
}
