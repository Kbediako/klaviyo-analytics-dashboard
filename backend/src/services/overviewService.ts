import klaviyoApiClient from './klaviyoApiClient';
import { DateRange, getPreviousPeriodDateRange } from '../utils/dateUtils';

export interface OverviewMetrics {
  revenue: {
    current: number;
    previous: number;
    change: number;
  };
  subscribers: {
    current: number;
    previous: number;
    change: number;
  };
  openRate: {
    current: number;
    previous: number;
    change: number;
  };
  conversionRate: {
    current: number;
    previous: number;
    change: number;
  };
  channels: {
    name: string;
    value: number;
    color: string;
  }[];
}

/**
 * Get overview metrics for the dashboard
 * 
 * @param dateRange Date range to get metrics for
 * @returns Overview metrics
 */
export async function getOverviewMetrics(dateRange: DateRange): Promise<OverviewMetrics> {
  // Get previous period for comparison
  const previousPeriod = getPreviousPeriodDateRange(dateRange);
  
  try {
    // For now, return mock data instead of making API calls
    // This will allow the frontend to work without valid API responses
    
    // Current period values
    const currentRevenue = 42582;
    const currentSubscribers = 24853;
    const currentOpenRate = 32.5;
    const currentConversionRate = 18.5;
    
    // Previous period values (slightly lower to show positive change)
    const previousRevenue = 38750;
    const previousSubscribers = 22480;
    const previousOpenRate = 29.8;
    const previousConversionRate = 16.2;
    
    // Calculate percentage changes
    const revenueChange = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
    const subscribersChange = ((currentSubscribers - previousSubscribers) / previousSubscribers) * 100;
    const openRateChange = ((currentOpenRate - previousOpenRate) / previousOpenRate) * 100;
    const conversionRateChange = ((currentConversionRate - previousConversionRate) / previousConversionRate) * 100;
    
    // Mock channel distribution data
    const channels = [
      { name: 'Email', value: 68, color: 'blue' },
      { name: 'SMS', value: 18, color: 'violet' },
      { name: 'Push', value: 14, color: 'amber' }
    ];
    
    return {
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        change: revenueChange
      },
      subscribers: {
        current: currentSubscribers,
        previous: previousSubscribers,
        change: subscribersChange
      },
      openRate: {
        current: currentOpenRate,
        previous: previousOpenRate,
        change: openRateChange
      },
      conversionRate: {
        current: currentConversionRate,
        previous: previousConversionRate,
        change: conversionRateChange
      },
      channels
    };
  } catch (error) {
    console.error('Error fetching overview metrics:', error);
    
    // Return default values in case of error
    return {
      revenue: {
        current: 0,
        previous: 0,
        change: 0
      },
      subscribers: {
        current: 0,
        previous: 0,
        change: 0
      },
      openRate: {
        current: 0,
        previous: 0,
        change: 0
      },
      conversionRate: {
        current: 0,
        previous: 0,
        change: 0
      },
      channels: []
    };
  }
}
