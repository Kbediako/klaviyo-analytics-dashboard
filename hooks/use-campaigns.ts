import { getCampaigns, Campaign, DateRangeParam } from '../lib/api-client';
import { useApiQuery } from './use-api-query';
import { useDateRange } from './use-date-range';

/**
 * Custom hook to fetch campaigns data
 * 
 * @param enabled Whether to enable the query
 * @returns Campaigns query result
 */
export function useCampaigns(params: DateRangeParam = {}) {
  const { dateRangeParam } = useDateRange();
  
  return useApiQuery<Campaign[]>(
    () => getCampaigns({ dateRange: params.dateRange || dateRangeParam }),
    {
      enabled: true,
      // Reduced refetch interval to 15 minutes to avoid rate limiting
      refetchInterval: 15 * 60 * 1000,
      // Prefill with empty array to avoid null checks
      initialData: []
    }
  );
}
