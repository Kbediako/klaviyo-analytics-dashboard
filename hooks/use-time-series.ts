import { useApiQuery } from './use-api-query';
import { useDateRange } from './use-date-range';
import { fetchFromAPI } from '../lib/api-client';

/**
 * Interface for time series data point
 */
export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

/**
 * Interface for time series response
 */
export interface TimeSeriesResponse {
  metricId: string;
  dateRange: {
    start: string;
    end: string;
  };
  interval: string;
  points: TimeSeriesPoint[];
}

/**
 * Interface for time series options
 */
export interface UseTimeSeriesOptions {
  metricId: string;
  dateRange?: string;
  interval?: string;
  maxPoints?: number;
  downsampleMethod?: 'lttb' | 'minmax' | 'average' | 'none';
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Hook to fetch time series data for a specific metric
 * 
 * @param options Time series options
 * @returns Time series data and query state
 */
export function useTimeSeries({
  metricId,
  dateRange,
  interval = '1 day',
  maxPoints,
  downsampleMethod = 'lttb',
  enabled = true,
  refetchInterval
}: UseTimeSeriesOptions) {
  const { dateRangeParam } = useDateRange();
  
  return useApiQuery<TimeSeriesPoint[]>(
    () => fetchFromAPI<TimeSeriesResponse>(`/analytics/timeseries/${metricId}`, {
      params: {
        dateRange: dateRange || dateRangeParam,
        interval,
        maxPoints: maxPoints?.toString(),
        downsampleMethod: maxPoints ? downsampleMethod : undefined
      }
    }).then(response => response.points),
    {
      enabled,
      refetchInterval,
      initialData: []
    }
  );
}

/**
 * Interface for time series decomposition
 */
export interface TimeSeriesDecomposition {
  trend: TimeSeriesPoint[];
  seasonal: TimeSeriesPoint[];
  residual: TimeSeriesPoint[];
}

/**
 * Interface for decomposition response
 */
export interface DecompositionResponse {
  metricId: string;
  dateRange: {
    start: string;
    end: string;
  };
  interval: string;
  windowSize: string | number;
  decomposition: TimeSeriesDecomposition;
}

/**
 * Interface for decomposition options
 */
export interface UseDecompositionOptions {
  metricId: string;
  dateRange?: string;
  interval?: string;
  windowSize?: string | number;
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Hook to fetch time series decomposition for a specific metric
 * 
 * @param options Decomposition options
 * @returns Decomposition data and query state
 */
export function useDecomposition({
  metricId,
  dateRange,
  interval = '1 day',
  windowSize = "7",
  enabled = true,
  refetchInterval
}: UseDecompositionOptions) {
  const { dateRangeParam } = useDateRange();
  
  return useApiQuery<TimeSeriesDecomposition>(
    () => fetchFromAPI<DecompositionResponse>(`/analytics/decomposition/${metricId}`, {
      params: {
        dateRange: dateRange || dateRangeParam,
        interval,
        windowSize: windowSize.toString()
      }
    }).then(response => response.decomposition),
    {
      enabled,
      refetchInterval,
      initialData: {
        trend: [],
        seasonal: [],
        residual: []
      }
    }
  );
}

/**
 * Interface for anomaly data point
 */
export interface AnomalyPoint extends TimeSeriesPoint {
  zscore: number;
}

/**
 * Interface for anomaly detection response
 */
export interface AnomalyResponse {
  metricId: string;
  dateRange: {
    start: string;
    end: string;
  };
  interval: string;
  threshold: string | number;
  anomalies: AnomalyPoint[];
  totalPoints: number;
  anomalyCount: number;
}

/**
 * Interface for anomaly detection options
 */
export interface UseAnomalyDetectionOptions {
  metricId: string;
  dateRange?: string;
  interval?: string;
  threshold?: string | number;
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Hook to detect anomalies in time series data
 * 
 * @param options Anomaly detection options
 * @returns Anomaly data and query state
 */
export function useAnomalyDetection({
  metricId,
  dateRange,
  interval = '1 day',
  threshold = "3.0",
  enabled = true,
  refetchInterval
}: UseAnomalyDetectionOptions) {
  const { dateRangeParam } = useDateRange();
  
  return useApiQuery<AnomalyResponse>(
    () => fetchFromAPI<AnomalyResponse>(`/analytics/anomalies/${metricId}`, {
      params: {
        dateRange: dateRange || dateRangeParam,
        interval,
        threshold: threshold.toString()
      }
    }),
    {
      enabled,
      refetchInterval,
      initialData: {
        metricId,
        dateRange: { start: '', end: '' },
        interval,
        threshold,
        anomalies: [],
        totalPoints: 0,
        anomalyCount: 0
      }
    }
  );
}
