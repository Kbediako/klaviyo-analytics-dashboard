import { getOverviewMetrics, OverviewMetrics } from '../lib/api-client';
import { useApiQuery } from './use-api-query';
import { useDateRange } from './use-date-range';

/**
 * Custom hook to fetch overview metrics
 * 
 * @param enabled Whether to enable the query
 * @returns Overview metrics query result
 */
export function useOverviewMetrics(enabled: boolean = true) {
  const { dateRangeParam } = useDateRange();
  
  return useApiQuery<OverviewMetrics>(
    () => getOverviewMetrics({ dateRange: dateRangeParam }),
    {
      enabled,
      // Refetch every 5 minutes
      refetchInterval: 5 * 60 * 1000,
    }
  );
}
