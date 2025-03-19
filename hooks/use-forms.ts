import { getForms, Form } from '../lib/api-client';
import { useApiQuery } from './use-api-query';
import { useDateRange } from './use-date-range';

/**
 * Custom hook to fetch forms data
 * 
 * @param enabled Whether to enable the query
 * @returns Forms query result
 */
export function useForms(enabled: boolean = true) {
  const { dateRangeParam } = useDateRange();
  
  return useApiQuery<Form[]>(
    () => getForms({ dateRange: dateRangeParam }),
    {
      enabled,
      // Refetch every 5 minutes
      refetchInterval: 5 * 60 * 1000,
    }
  );
}
