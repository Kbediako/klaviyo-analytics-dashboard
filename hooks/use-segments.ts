import { getSegments, Segment } from '../lib/api-client';
import { useApiQuery } from './use-api-query';
import { useDateRange } from './use-date-range';

/**
 * Custom hook to fetch segments data
 * 
 * @param enabled Whether to enable the query
 * @returns Segments query result
 */
export function useSegments(enabled: boolean = true) {
  const { dateRangeParam } = useDateRange();
  
  return useApiQuery<Segment[]>(
    () => getSegments({ dateRange: dateRangeParam }),
    {
      enabled,
      // Refetch every 30 minutes to respect rate limits
      refetchInterval: 30 * 60 * 1000,
      // Provide initial empty array to prevent null checking
      initialData: []
    }
  );
}
