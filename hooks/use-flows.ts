import { getFlows, Flow, DateRangeParam } from '../lib/api-client';
import { useApiQuery } from './use-api-query';
import { useDateRange } from './use-date-range';

/**
 * Custom hook to fetch flows data
 * 
 * @param enabled Whether to enable the query
 * @returns Flows query result
 */
export function useFlows(params: DateRangeParam = {}) {
  const { dateRangeParam } = useDateRange();
  
  return useApiQuery<Flow[]>(
    () => getFlows({ dateRange: params.dateRange || dateRangeParam }),
    {
      enabled: true,
      // Refetch every 30 minutes to respect rate limits
      refetchInterval: 30 * 60 * 1000,
      // Provide initial empty array to prevent null checking
      initialData: []
    }
  );
}
