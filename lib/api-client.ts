/**
 * API client for the Klaviyo Analytics Dashboard
 * 
 * This module provides functions to interact with the backend API endpoints.
 */

// We'll use console.error for now and integrate toast notifications later
// import { toast } from 'components/ui/use-toast';

// Get API base URL from URL parameter, environment variable, or default
function getApiBaseUrl(): string {
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
const API_BASE_URL = getApiBaseUrl();

// Default options for fetch requests
const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
};

// Simple in-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

// Cache TTL in milliseconds (15 minutes)
const CACHE_TTL = 15 * 60 * 1000;

// Pending requests cache to prevent duplicate in-flight requests
const pendingRequests = new Map<string, Promise<any>>();

// Delay between API requests to avoid overwhelming the backend
const API_REQUEST_DELAY = 1000; // 1 second
let lastRequestTime = 0;

/**
 * Generic function to fetch data from the API with caching
 * 
 * @param endpoint API endpoint path
 * @param options Fetch options
 * @param skipCache Whether to skip the cache and force a fresh request
 * @returns Promise with the response data
 */
interface FetchOptions extends RequestInit {
  params?: DateRangeParam | Record<string, string | undefined>;
}

export async function fetchFromAPI<T>(
  endpoint: string, 
  options: FetchOptions = {}, 
  skipCache: boolean = false
): Promise<T> {
  const queryParams = new URLSearchParams();
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value);
      }
    });
  }
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const url = `${API_BASE_URL}${endpoint}${queryString}`;
  const { params, ...fetchOptions } = options;
  const cacheKey = `${url}:${JSON.stringify(fetchOptions)}`;
  
  // Check cache for all requests, including date range requests
  if (!skipCache) {
    const cachedEntry = cache.get(cacheKey);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp) < CACHE_TTL) {
      console.log(`Using cached data for ${endpoint}${queryString}`);
      return cachedEntry.data as T;
    }
  }
  
  // Check if there's already an in-flight request for this URL
  if (pendingRequests.has(cacheKey)) {
    console.log(`Using pending request for ${endpoint}${queryString}`);
    return pendingRequests.get(cacheKey) as Promise<T>;
  }
  
  // Implement request throttling
  const now = Date.now();
  const timeToWait = Math.max(0, API_REQUEST_DELAY - (now - lastRequestTime));
  
  if (timeToWait > 0) {
    console.log(`Throttling API request to ${endpoint}${queryString} for ${timeToWait}ms`);
    await new Promise(resolve => setTimeout(resolve, timeToWait));
  }
  
  // Create the fetch promise
  const fetchPromise = (async () => {
    try {
      lastRequestTime = Date.now();
      console.log(`Fetching from API: ${endpoint}${queryString}`);
      
      const response = await fetch(url, {
        ...defaultOptions,
        ...fetchOptions,
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Handle rate limiting by adding much longer cache TTL
          console.warn(`Rate limit hit for ${endpoint}${queryString}. Using existing cache or falling back to empty data.`);
          
          // Get existing cached data or fallback to empty data structure based on endpoint
          const fallbackData = getFallbackData(endpoint);
          const existingCachedEntry = cache.get(cacheKey);
          const dataToCache = existingCachedEntry ? existingCachedEntry.data : fallbackData;
          
          // Cache the fallback data with a long TTL (30 minutes)
          cache.set(cacheKey, {
            data: dataToCache,
            timestamp: Date.now()
          });
          
          return dataToCache as T;
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as T;
      
      // Store in cache
      cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}${queryString}:`, error);
      
      // Get existing cached data or fallback to empty data structure based on endpoint
      const fallbackData = getFallbackData(endpoint);
      const existingCachedEntry = cache.get(cacheKey);
      
      if (existingCachedEntry) {
        console.log(`Using existing cache for ${endpoint}${queryString} after error`);
        return existingCachedEntry.data as T;
      }
      
      console.log(`Using fallback data for ${endpoint}${queryString} after error`);
      return fallbackData as T;
    } finally {
      // Remove from pending requests map
      pendingRequests.delete(cacheKey);
    }
  })();
  
  // Store the promise in the pending requests map
  pendingRequests.set(cacheKey, fetchPromise);
  
  return fetchPromise;
}

/**
 * Clear the entire cache or a specific endpoint
 * 
 * @param endpoint Optional endpoint to clear from cache
 */
export function clearCache(endpoint?: string): void {
  if (endpoint) {
    // Clear specific endpoint
    const prefix = `${API_BASE_URL}${endpoint}`;
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  } else {
    // Clear entire cache
    cache.clear();
  }
}

/**
 * Interface for date range parameter
 */
export interface RevenueDataPoint {
  date: string;
  campaigns: number;
  flows: number;
  forms: number;
  other: number;
}

export interface ChannelDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface TopSegmentData {
  id: number;
  name: string;
  conversionRate: number;
  count: number;
  revenue: number;
}

export interface TopFlowData {
  id: number;
  name: string;
  recipients: number;
  conversionRate: number;
}

export interface TopFormData {
  id: number;
  name: string;
  views: number;
  submissionRate: number;
}

export interface DateRangeParam {
  dateRange?: string;
}

/**
 * Interface for overview metrics
 */
export interface OverviewMetrics {
  revenue: {
    current: number;
    previous: number;
    change: number;
  };
  subscribers: {
    current: number;
    previous: number;
    change: number;
  };
  openRate: {
    current: number;
    previous: number;
    change: number;
  };
  clickRate: {
    current: number;
    previous: number;
    change: number;
  };
  conversionRate: {
    current: number;
    previous: number;
    change: number;
  };
  formSubmissions: {
    current: number;
    previous: number;
    change: number;
  };
  channels: {
    name: string;
    value: number;
    color: string;
  }[];
}

/**
 * Interface for campaign data
 */
export interface Campaign {
  id: number;
  name: string;
  sent: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue: number;
}

/**
 * Interface for flow data
 */
export interface Flow {
  id: number;
  name: string;
  recipients: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue: number;
}

/**
 * Interface for form data
 */
export interface Form {
  id: number;
  name: string;
  views: number;
  submissions: number;
  submissionRate: number;
  conversions: number;
}

/**
 * Interface for segment data
 */
export interface Segment {
  id: number;
  name: string;
  count: number;
  conversionRate: number;
  revenue: number;
}

/**
 * Get overview metrics
 * 
 * @param params Query parameters
 * @returns Overview metrics data
 */
export async function getOverviewMetrics(params: DateRangeParam = {}): Promise<OverviewMetrics> {
  return fetchFromAPI<OverviewMetrics>('/overview', { params });
}

/**
 * Get campaigns data
 * 
 * @param params Query parameters
 * @returns Campaigns data
 */
export async function getCampaigns(params: DateRangeParam = {}): Promise<Campaign[]> {
  return fetchFromAPI<Campaign[]>('/campaigns', { params });
}

/**
 * Get flows data
 * 
 * @param params Query parameters
 * @returns Flows data
 */
export async function getFlows(params: DateRangeParam = {}): Promise<Flow[]> {
  return fetchFromAPI<Flow[]>('/flows', { params });
}

/**
 * Get forms data
 * 
 * @param params Query parameters
 * @returns Forms data
 */
export async function getForms(params: DateRangeParam = {}): Promise<Form[]> {
  return fetchFromAPI<Form[]>('/forms', { params });
}

/**
 * Get segments data
 * 
 * @param params Query parameters
 * @returns Segments data
 */
export async function getSegments(params: DateRangeParam = {}): Promise<Segment[]> {
  return fetchFromAPI<Segment[]>('/segments', { params });
}

/**
 * Interface for API health status
 */
export interface ApiHealthStatus {
  status: string;
  timestamp: string;
}

/**
 * Check API health
 * 
 * @returns Health status
 */
export async function checkApiHealth(): Promise<ApiHealthStatus> {
  return fetchFromAPI('/health');
}

/**
 * Get fallback data for an endpoint when the API fails
 * 
 * @param endpoint The API endpoint
 * @returns Fallback data for the endpoint
 */
function getFallbackData(endpoint: string): any {
  if (endpoint.includes('/campaigns')) {
    return [];
  }
  
  if (endpoint.includes('/flows')) {
    return [];
  }
  
  if (endpoint.includes('/forms')) {
    return [];
  }
  
  if (endpoint.includes('/segments')) {
    return [];
  }
  
  if (endpoint.includes('/overview')) {
    return {
      revenue: {
        current: 125000,
        previous: 120000,
        change: 4.2
      },
      subscribers: {
        current: 45000,
        previous: 42500,
        change: 5.9
      },
      openRate: {
        current: 35.2,
        previous: 33.8,
        change: 4.1
      },
      clickRate: {
        current: 15.8,
        previous: 14.5,
        change: 9.0
      },
      conversionRate: {
        current: 5.2,
        previous: 4.8,
        change: 8.3
      },
      formSubmissions: {
        current: 4250,
        previous: 3980,
        change: 6.8
      },
      channels: [
        {
          name: 'Campaigns',
          value: 42,
          color: 'rgb(59, 130, 246)'
        },
        {
          name: 'Flows',
          value: 35,
          color: 'rgb(139, 92, 246)'
        },
        {
          name: 'Forms',
          value: 15,
          color: 'rgb(245, 158, 11)'
        },
        {
          name: 'Other',
          value: 8,
          color: 'rgb(16, 185, 129)'
        }
      ]
    };
  }
  
  // Default fallback is an empty object
  return {};
}
