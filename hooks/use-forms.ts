import { getForms, Form, DateRangeParam } from '../lib/api-client';
import { useApiQuery } from './use-api-query';
import { useDateRange } from './use-date-range';

/**
 * Custom hook to fetch forms data
 * 
 * @param enabled Whether to enable the query
 * @returns Forms query result
 */
export function useForms(params: DateRangeParam = {}) {
  const { dateRangeParam } = useDateRange();
  
  return useApiQuery<Form[]>(
    () => getForms({ dateRange: params.dateRange || dateRangeParam }),
    {
      enabled: true,
      // Refetch every 5 minutes
      refetchInterval: 5 * 60 * 1000,
    }
  );
}
