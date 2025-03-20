import { useState, useEffect } from 'react';
import { DateRangeParam } from '../lib/api-client';

/**
 * Interface for revenue over time data point
 */
export interface RevenueDataPoint {
  date: string;
  campaigns: number;
  flows: number;
  forms: number;
  other: number;
}

/**
 * Interface for channel distribution data point
 */
export interface ChannelDataPoint {
  name: string;
  value: number;
}

/**
 * Interface for top segment data
 */
export interface TopSegmentData {
  name: string;
  conversionRate: number;
  count: number;
  revenue: number;
}

/**
 * Interface for top flow data
 */
export interface TopFlowData {
  name: string;
  recipients: number;
  conversionRate: number;
}

/**
 * Interface for top form data
 */
export interface TopFormData {
  name: string;
  views: number;
  submissionRate: number;
}

/**
 * Hook to fetch revenue over time chart data
 */
export function useRevenueChartData(params: DateRangeParam = {}) {
  const [data, setData] = useState<RevenueDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, we would fetch from the API
        // For now, we'll use mock data
        const mockData: RevenueDataPoint[] = [
          { date: '2023-01', campaigns: 4200, flows: 3100, forms: 1800, other: 950 },
          { date: '2023-02', campaigns: 4500, flows: 3300, forms: 1900, other: 1000 },
          { date: '2023-03', campaigns: 4800, flows: 3500, forms: 2000, other: 1050 },
          { date: '2023-04', campaigns: 5100, flows: 3700, forms: 2100, other: 1100 },
          { date: '2023-05', campaigns: 5400, flows: 3900, forms: 2200, other: 1150 },
          { date: '2023-06', campaigns: 5700, flows: 4100, forms: 2300, other: 1200 }
        ];
        
        setData(mockData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.dateRange]);

  return { data, isLoading, error };
}

/**
 * Hook to fetch channel distribution chart data
 */
export function useChannelDistributionData(params: DateRangeParam = {}) {
  const [data, setData] = useState<ChannelDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, we would fetch from the API
        // For now, we'll use mock data
        const mockData: ChannelDataPoint[] = [
          { name: 'Campaigns', value: 42 },
          { name: 'Flows', value: 35 },
          { name: 'Forms', value: 15 },
          { name: 'Other', value: 8 }
        ];
        
        setData(mockData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.dateRange]);

  return { data, isLoading, error };
}

/**
 * Hook to fetch top segments data
 */
export function useTopSegmentsData(params: DateRangeParam = {}) {
  const [data, setData] = useState<TopSegmentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, we would fetch from the API
        // For now, we'll use mock data
        const mockData: TopSegmentData[] = [
          { name: 'VIP Customers', conversionRate: 42, count: 5842, revenue: 28450 },
          { name: 'Recent Purchasers', conversionRate: 35, count: 12480, revenue: 42680 },
          { name: 'Cart Abandoners', conversionRate: 28, count: 8640, revenue: 15280 },
          { name: 'Email Engaged', conversionRate: 22, count: 18540, revenue: 24850 }
        ];
        
        setData(mockData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.dateRange]);

  return { data, isLoading, error };
}

/**
 * Hook to fetch top flows data
 */
export function useTopFlowsData(params: DateRangeParam = {}) {
  const [data, setData] = useState<TopFlowData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, we would fetch from the API
        // For now, we'll use mock data
        const mockData: TopFlowData[] = [
          { name: 'Welcome Series', recipients: 8450, conversionRate: 32 },
          { name: 'Abandoned Cart', recipients: 6280, conversionRate: 28 },
          { name: 'Post-Purchase', recipients: 12480, conversionRate: 24 },
          { name: 'Win-Back', recipients: 5840, conversionRate: 18 }
        ];
        
        setData(mockData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.dateRange]);

  return { data, isLoading, error };
}

/**
 * Hook to fetch top forms data
 */
export function useTopFormsData(params: DateRangeParam = {}) {
  const [data, setData] = useState<TopFormData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, we would fetch from the API
        // For now, we'll use mock data
        const mockData: TopFormData[] = [
          { name: 'Newsletter Signup', views: 12480, submissionRate: 38 },
          { name: 'Exit Intent Popup', views: 28450, submissionRate: 24 },
          { name: 'Product Registration', views: 8640, submissionRate: 42 },
          { name: 'Contact Form', views: 5840, submissionRate: 32 }
        ];
        
        setData(mockData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.dateRange]);

  return { data, isLoading, error };
}
