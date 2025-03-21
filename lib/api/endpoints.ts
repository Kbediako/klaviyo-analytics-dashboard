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

/**
 * Get overview metrics
 */
export async function getOverviewMetrics(params: FetchParams = {}): Promise<OverviewMetrics> {
  const { forceFresh, ...restParams } = params;
  return fetchFromAPI<OverviewMetrics>('/overview', { params: restParams }, false, forceFresh);
}

/**
 * Get campaigns data
 */
export async function getCampaigns(params: FetchParams = {}): Promise<Campaign[]> {
  const { forceFresh, ...restParams } = params;
  return fetchFromAPI<Campaign[]>('/campaigns', { params: restParams }, false, forceFresh);
}

/**
 * Get flows data
 */
export async function getFlows(params: FetchParams = {}): Promise<Flow[]> {
  const { forceFresh, ...restParams } = params;
  return fetchFromAPI<Flow[]>('/flows', { params: restParams }, false, forceFresh);
}

/**
 * Get forms data
 */
export async function getForms(params: FetchParams = {}): Promise<Form[]> {
  const { forceFresh, ...restParams } = params;
  return fetchFromAPI<Form[]>('/forms', { params: restParams }, false, forceFresh);
}

/**
 * Get segments data
 */
export async function getSegments(params: FetchParams = {}): Promise<Segment[]> {
  const { forceFresh, ...restParams } = params;
  return fetchFromAPI<Segment[]>('/segments', { params: restParams }, false, forceFresh);
}

/**
 * Check API health
 */
export async function checkApiHealth(): Promise<ApiHealthStatus> {
  return fetchFromAPI('/health');
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
