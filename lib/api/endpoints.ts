/**
 * API endpoint functions
 */

import { 
  Campaign, 
  Flow, 
  Form, 
  Segment, 
  OverviewMetrics, 
  ApiHealthStatus,
  FetchParams 
} from './types';
import { fetchFromAPI } from './client';
import { clearCache, dispatchForceRefreshEvent } from './cache';
import { API_BASE_URL } from './config';
import {
  isOverviewMetrics,
  isCampaignArray,
  isFlowArray,
  isFormArray,
  isSegmentArray,
  applyTypeGuard
} from './typeGuards';

// Default fallback values for type safety
const DEFAULT_OVERVIEW_METRICS: OverviewMetrics = {
  revenue: { current: 0, previous: 0, change: 0 },
  subscribers: { current: 0, previous: 0, change: 0 },
  openRate: { current: 0, previous: 0, change: 0 },
  clickRate: { current: 0, previous: 0, change: 0 },
  conversionRate: { current: 0, previous: 0, change: 0 },
  formSubmissions: { current: 0, previous: 0, change: 0 },
  channels: []
};

const DEFAULT_CAMPAIGNS: Campaign[] = [];
const DEFAULT_FLOWS: Flow[] = [];
const DEFAULT_FORMS: Form[] = [];
const DEFAULT_SEGMENTS: Segment[] = [];
const DEFAULT_HEALTH_STATUS: ApiHealthStatus = { status: 'unknown', timestamp: new Date().toISOString() };

/**
 * Get overview metrics
 */
export async function getOverviewMetrics(params: FetchParams = {}): Promise<OverviewMetrics> {
  const { forceFresh, ...restParams } = params;
  const data = await fetchFromAPI<unknown>('/overview', { params: restParams }, false, forceFresh);
  return applyTypeGuard(data, isOverviewMetrics, DEFAULT_OVERVIEW_METRICS);
}

/**
 * Get campaigns data
 */
export async function getCampaigns(params: FetchParams = {}): Promise<Campaign[]> {
  const { forceFresh, ...restParams } = params;
  const data = await fetchFromAPI<unknown>('/campaigns', { params: restParams }, false, forceFresh);
  return applyTypeGuard(data, isCampaignArray, DEFAULT_CAMPAIGNS);
}

/**
 * Get flows data
 */
export async function getFlows(params: FetchParams = {}): Promise<Flow[]> {
  const { forceFresh, ...restParams } = params;
  const data = await fetchFromAPI<unknown>('/flows', { params: restParams }, false, forceFresh);
  return applyTypeGuard(data, isFlowArray, DEFAULT_FLOWS);
}

/**
 * Get forms data
 */
export async function getForms(params: FetchParams = {}): Promise<Form[]> {
  const { forceFresh, ...restParams } = params;
  const data = await fetchFromAPI<unknown>('/forms', { params: restParams }, false, forceFresh);
  return applyTypeGuard(data, isFormArray, DEFAULT_FORMS);
}

/**
 * Get segments data
 */
export async function getSegments(params: FetchParams = {}): Promise<Segment[]> {
  const { forceFresh, ...restParams } = params;
  const data = await fetchFromAPI<unknown>('/segments', { params: restParams }, false, forceFresh);
  return applyTypeGuard(data, isSegmentArray, DEFAULT_SEGMENTS);
}

/**
 * Check API health
 */
export async function checkApiHealth(): Promise<ApiHealthStatus> {
  try {
    const data = await fetchFromAPI<ApiHealthStatus>('/health');
    if (typeof data === 'object' && data !== null && 
        typeof data.status === 'string' && 
        typeof data.timestamp === 'string') {
      return data;
    }
    return DEFAULT_HEALTH_STATUS;
  } catch (error) {
    console.error('Health check failed:', error);
    return DEFAULT_HEALTH_STATUS;
  }
}

/**
 * Force refresh all data
 */
export function forceRefreshData(): void {
  // Clear all cache
  clearCache(API_BASE_URL);
  
  // Dispatch refresh event
  dispatchForceRefreshEvent();
}
