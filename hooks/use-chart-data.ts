import { useState, useEffect } from 'react';
import { DateRangeParam, fetchFromAPI } from '../lib/api-client';

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
        const chartData = await fetchFromAPI<RevenueDataPoint[]>('/charts/revenue', {
          params: { dateRange: params.dateRange }
        });
        setData(chartData);
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
        const chartData = await fetchFromAPI<ChannelDataPoint[]>('/charts/distribution', {
          params: { dateRange: params.dateRange }
        });
        setData(chartData);
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
        const chartData = await fetchFromAPI<TopSegmentData[]>('/charts/top-segments', {
          params: { dateRange: params.dateRange }
        });
        setData(chartData);
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
        const chartData = await fetchFromAPI<TopFlowData[]>('/charts/top-flows', {
          params: { dateRange: params.dateRange }
        });
        setData(chartData);
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
        const chartData = await fetchFromAPI<TopFormData[]>('/charts/top-forms', {
          params: { dateRange: params.dateRange }
        });
        setData(chartData);
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
