import { useApiQuery } from './use-api-query';
import { useDateRange } from './use-date-range';
import { fetchFromAPI } from '../lib/api-client';
import { TimeSeriesPoint } from './use-time-series';

/**
 * Interface for forecast data point
 */
export interface ForecastPoint extends TimeSeriesPoint {
  // Extends TimeSeriesPoint with timestamp and value
}

/**
 * Interface for confidence interval
 */
export interface ConfidenceInterval {
  upper: ForecastPoint[];
  lower: ForecastPoint[];
}

/**
 * Interface for forecast result
 */
export interface ForecastResult {
  forecast: ForecastPoint[];
  confidence: ConfidenceInterval;
  accuracy?: number;
}

/**
 * Interface for forecast response from API
 */
export interface ForecastResponse {
  metricId: string;
  dateRange: {
    start: string;
    end: string;
  };
  forecastHorizon: number;
  interval: string;
  method: string;
  forecast: ForecastResult;
}

/**
 * Interface for forecast options
 */
export interface UseForecastOptions {
  metricId: string;
  dateRange?: string;
  horizon?: string | number;
  interval?: string;
  method?: 'naive' | 'moving_average' | 'linear_regression';
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Hook to fetch forecast data for a specific metric
 * 
 * @param options Forecast options
 * @returns Forecast data and query state
 */
export function useForecast({
  metricId,
  dateRange,
  horizon = "30",
  interval = '1 day',
  method = 'naive',
  enabled = true,
  refetchInterval
}: UseForecastOptions) {
  const { dateRangeParam } = useDateRange();
  
  return useApiQuery<ForecastResult>(
    () => fetchFromAPI<ForecastResponse>(`/analytics/forecast/${metricId}`, {
      params: {
        dateRange: dateRange || dateRangeParam,
        horizon: horizon.toString(),
        interval,
        method
      }
    }).then(response => response.forecast),
    {
      enabled,
      refetchInterval,
      initialData: {
        forecast: [],
        confidence: {
          upper: [],
          lower: []
        }
      }
    }
  );
}

/**
 * Interface for correlation result
 */
export interface CorrelationResult {
  metric1Id: string;
  metric2Id: string;
  dateRange: {
    start: string;
    end: string;
  };
  interval: string;
  correlation: number;
  interpretation: string;
}

/**
 * Interface for correlation options
 */
export interface UseCorrelationOptions {
  metric1Id: string;
  metric2Id: string;
  dateRange?: string;
  interval?: string;
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Hook to calculate correlation between two metrics
 * 
 * @param options Correlation options
 * @returns Correlation data and query state
 */
export function useCorrelation({
  metric1Id,
  metric2Id,
  dateRange,
  interval = '1 day',
  enabled = true,
  refetchInterval
}: UseCorrelationOptions) {
  const { dateRangeParam } = useDateRange();
  
  return useApiQuery<CorrelationResult>(
    () => fetchFromAPI<CorrelationResult>('/analytics/correlation', {
      params: {
        metric1: metric1Id,
        metric2: metric2Id,
        dateRange: dateRange || dateRangeParam,
        interval
      }
    }),
    {
      enabled,
      refetchInterval,
      initialData: {
        metric1Id,
        metric2Id,
        dateRange: { start: '', end: '' },
        interval,
        correlation: 0,
        interpretation: 'No data available'
      }
    }
  );
}
