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

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

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
  
  // Skip cache for date range-dependent requests
  const hasDateRange = options.params && 'dateRange' in options.params;
  if (!skipCache && !hasDateRange) {
    const cachedEntry = cache.get(cacheKey);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp) < CACHE_TTL) {
      console.log(`Using cached data for ${endpoint}`);
      return cachedEntry.data as T;
    }
  }
  
  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...fetchOptions,
    });

    if (!response.ok) {
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
    console.error('API request failed:', error);
    // We'll integrate toast notifications later
    // toast({
    //   title: 'API Request Failed',
    //   description: error instanceof Error ? error.message : 'Unknown error occurred',
    //   variant: 'destructive',
    // });
    throw error;
  }
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
