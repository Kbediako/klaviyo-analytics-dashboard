import { getFlows, Flow } from '../lib/api-client';
import { useApiQuery } from './use-api-query';
import { useDateRange } from './use-date-range';

/**
 * Custom hook to fetch flows data
 * 
 * @param enabled Whether to enable the query
 * @returns Flows query result
 */
export function useFlows(enabled: boolean = true) {
  const { dateRangeParam } = useDateRange();
  
  return useApiQuery<Flow[]>(
    () => getFlows({ dateRange: dateRangeParam }),
    {
      enabled,
      // Refetch every 5 minutes
      refetchInterval: 5 * 60 * 1000,
    }
  );
}
