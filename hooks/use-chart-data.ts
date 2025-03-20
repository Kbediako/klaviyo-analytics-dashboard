import { useApiQuery } from './use-api-query';
import { useDateRange } from './use-date-range';
import { 
  DateRangeParam, 
  fetchFromAPI,
  RevenueDataPoint,
  ChannelDataPoint,
  TopSegmentData,
  TopFlowData,
  TopFormData
} from '../lib/api-client';

/**
 * Hook to fetch revenue over time chart data
 */
export function useRevenueChartData(params: DateRangeParam = {}) {
  const { dateRangeParam } = useDateRange();
  
  return useApiQuery<RevenueDataPoint[]>(
    () => fetchFromAPI('/charts/revenue', {
      params: { dateRange: params.dateRange || dateRangeParam }
    }),
    {
      enabled: true,
      // Refetch every 5 minutes
      refetchInterval: 5 * 60 * 1000,
    }
  );
}

/**
 * Hook to fetch channel distribution chart data
 */
export function useChannelDistributionData(params: DateRangeParam = {}) {
  const { dateRangeParam } = useDateRange();
  
  return useApiQuery<ChannelDataPoint[]>(
    () => fetchFromAPI('/charts/distribution', {
      params: { dateRange: params.dateRange || dateRangeParam }
    }),
    {
      enabled: true,
      // Refetch every 5 minutes
      refetchInterval: 5 * 60 * 1000,
    }
  );
}

/**
 * Hook to fetch top segments data
 */
export function useTopSegmentsData(params: DateRangeParam = {}) {
  const { dateRangeParam } = useDateRange();
  
  return useApiQuery<TopSegmentData[]>(
    () => fetchFromAPI('/charts/top-segments', {
      params: { dateRange: params.dateRange || dateRangeParam }
    }),
    {
      enabled: true,
      // Refetch every 5 minutes
      refetchInterval: 5 * 60 * 1000,
    }
  );
}

/**
 * Hook to fetch top flows data
 */
export function useTopFlowsData(params: DateRangeParam = {}) {
  const { dateRangeParam } = useDateRange();
  
  return useApiQuery<TopFlowData[]>(
    () => fetchFromAPI('/charts/top-flows', {
      params: { dateRange: params.dateRange || dateRangeParam }
    }),
    {
      enabled: true,
      // Refetch every 5 minutes
      refetchInterval: 5 * 60 * 1000,
    }
  );
}

/**
 * Hook to fetch top forms data
 */
export function useTopFormsData(params: DateRangeParam = {}) {
  const { dateRangeParam } = useDateRange();
  
  return useApiQuery<TopFormData[]>(
    () => fetchFromAPI('/charts/top-forms', {
      params: { dateRange: params.dateRange || dateRangeParam }
    }),
    {
      enabled: true,
      // Refetch every 5 minutes
      refetchInterval: 5 * 60 * 1000,
    }
  );
}
