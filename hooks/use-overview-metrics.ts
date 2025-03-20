import { getOverviewMetrics, OverviewMetrics, DateRangeParam } from '../lib/api-client';
import { useApiQuery } from './use-api-query';
import { useDateRange } from './use-date-range';

/**
 * Custom hook to fetch overview metrics
 * 
 * @param enabled Whether to enable the query
 * @returns Overview metrics query result
 */
export function useOverviewMetrics(params: DateRangeParam = {}) {
  const { dateRangeParam } = useDateRange();
  
  return useApiQuery<OverviewMetrics>(
    () => getOverviewMetrics({ dateRange: params.dateRange || dateRangeParam }),
    {
      enabled: true,
      // Refetch every 5 minutes
      refetchInterval: 5 * 60 * 1000,
    }
  );
}
