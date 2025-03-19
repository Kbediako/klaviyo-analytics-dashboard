/**
 * API client for the Klaviyo Analytics Dashboard
 * 
 * This module provides functions to interact with the backend API endpoints.
 */

// We'll use console.error for now and integrate toast notifications later
// import { toast } from 'components/ui/use-toast';

// Base URL for API requests
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Default options for fetch requests
const defaultOptions: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Generic function to fetch data from the API
 * 
 * @param endpoint API endpoint path
 * @param options Fetch options
 * @returns Promise with the response data
 */
async function fetchFromAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status} ${response.statusText}`);
    }

    return await response.json() as T;
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
 * Interface for date range parameter
 */
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
  const queryParams = new URLSearchParams();
  if (params.dateRange) {
    queryParams.append('dateRange', params.dateRange);
  }

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchFromAPI(`/overview${queryString}`);
}

/**
 * Get campaigns data
 * 
 * @param params Query parameters
 * @returns Campaigns data
 */
export async function getCampaigns(params: DateRangeParam = {}): Promise<Campaign[]> {
  const queryParams = new URLSearchParams();
  if (params.dateRange) {
    queryParams.append('dateRange', params.dateRange);
  }

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchFromAPI(`/campaigns${queryString}`);
}

/**
 * Get flows data
 * 
 * @param params Query parameters
 * @returns Flows data
 */
export async function getFlows(params: DateRangeParam = {}): Promise<Flow[]> {
  const queryParams = new URLSearchParams();
  if (params.dateRange) {
    queryParams.append('dateRange', params.dateRange);
  }

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchFromAPI(`/flows${queryString}`);
}

/**
 * Get forms data
 * 
 * @param params Query parameters
 * @returns Forms data
 */
export async function getForms(params: DateRangeParam = {}): Promise<Form[]> {
  const queryParams = new URLSearchParams();
  if (params.dateRange) {
    queryParams.append('dateRange', params.dateRange);
  }

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchFromAPI(`/forms${queryString}`);
}

/**
 * Get segments data
 * 
 * @param params Query parameters
 * @returns Segments data
 */
export async function getSegments(params: DateRangeParam = {}): Promise<Segment[]> {
  const queryParams = new URLSearchParams();
  if (params.dateRange) {
    queryParams.append('dateRange', params.dateRange);
  }

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchFromAPI(`/segments${queryString}`);
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
