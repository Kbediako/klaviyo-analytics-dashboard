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
      // Refetch every 30 minutes to avoid rate limits
      refetchInterval: 30 * 60 * 1000,
      // Provide initial data to prevent UI flashing
      initialData: {
        revenue: { current: 0, previous: 0, change: 0 },
        subscribers: { current: 0, previous: 0, change: 0 },
        openRate: { current: 0, previous: 0, change: 0 },
        clickRate: { current: 0, previous: 0, change: 0 },
        conversionRate: { current: 0, previous: 0, change: 0 },
        formSubmissions: { current: 0, previous: 0, change: 0 },
        channels: []
      }
    }
  );
}
