import { getCampaigns, Campaign } from '../lib/api-client';
import { useApiQuery } from './use-api-query';
import { useDateRange } from './use-date-range';

/**
 * Custom hook to fetch campaigns data
 * 
 * @param enabled Whether to enable the query
 * @returns Campaigns query result
 */
export function useCampaigns(enabled: boolean = true) {
  const { dateRangeParam } = useDateRange();
  
  return useApiQuery<Campaign[]>(
    () => getCampaigns({ dateRange: dateRangeParam }),
    {
      enabled,
      // Refetch every 5 minutes
      refetchInterval: 5 * 60 * 1000,
    }
  );
}
