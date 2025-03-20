# Phase 5: Frontend Integration (Weeks 9-10)

## Overview

This phase focuses on integrating the enhanced backend capabilities with the frontend, including new API client hooks, enhanced chart components, and analytics visualizations.

## Timeline

- Week 9: API Client Hooks and Base Components
- Week 10: Enhanced Chart Components and Analytics UI

## Implementation Details

### 5.1 Update API Client Hooks (Week 9)

```typescript
// hooks/use-api-query.ts
import { useState, useEffect } from 'react';
import { fetchFromAPI } from '../lib/api-client';

export interface UseApiQueryOptions<T> {
  endpoint: string;
  params?: Record<string, any>;
  initialData?: T;
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useApiQuery<T>({
  endpoint,
  params,
  initialData,
  enabled = true,
  refetchInterval,
  onSuccess,
  onError
}: UseApiQueryOptions<T>) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout | undefined;
    
    const fetchData = async () => {
      if (!enabled) return;
      
      setLoading(true);
      try {
        const result = await fetchFromAPI<T>(endpoint, { params });
        
        if (isMounted) {
          setData(result);
          setError(null);
          if (onSuccess) onSuccess(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          if (onError) onError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    if (refetchInterval) {
      intervalId = setInterval(fetchData, refetchInterval);
    }
    
    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [endpoint, JSON.stringify(params), enabled, refetchInterval]);
  
  return { data, loading, error, refetch: () => fetchData() };
}

// hooks/use-time-series.ts
import { useApiQuery } from './use-api-query';
import { DateRange } from '../lib/api-client';

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

export interface UseTimeSeriesOptions {
  metricId: string;
  dateRange: DateRange;
  interval?: string;
  enabled?: boolean;
}

export function useTimeSeries({
  metricId,
  dateRange,
  interval = '1 day',
  enabled = true
}: UseTimeSeriesOptions) {
  return useApiQuery<TimeSeriesPoint[]>({
    endpoint: `/analytics/timeseries/${metricId}`,
    params: {
      dateRange,
      interval
    },
    enabled
  });
}

// hooks/use-forecast.ts
export interface ForecastPoint {
  timestamp: string;
  value: number;
}

export interface ForecastResult {
  forecast: ForecastPoint[];
  confidence: {
    upper: ForecastPoint[];
    lower: ForecastPoint[];
  };
  accuracy: number;
}

export function useForecast({
  metricId,
  dateRange,
  horizon = 30,
  enabled = true
}: UseForecastOptions) {
  return useApiQuery<ForecastResult>({
    endpoint: `/analytics/forecast/${metricId}`,
    params: {
      dateRange,
      horizon
    },
    enabled
  });
}
```

### 5.2 Create Enhanced Chart Components (Week 10)

```tsx
// components/enhanced-revenue-chart.tsx
import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area
} from 'recharts';
import { useDateRange } from '../hooks/use-date-range';
import { useTimeSeries } from '../hooks/use-time-series';
import { useForecast } from '../hooks/use-forecast';
import { Skeleton } from './ui/skeleton';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

interface EnhancedRevenueChartProps {
  metricId: string;
  showForecast?: boolean;
  onToggleForecast?: (enabled: boolean) => void;
  showConfidenceInterval?: boolean;
  onToggleConfidenceInterval?: (enabled: boolean) => void;
}

export function EnhancedRevenueChart({
  metricId,
  showForecast = false,
  onToggleForecast = () => {},
  showConfidenceInterval = false,
  onToggleConfidenceInterval = () => {}
}: EnhancedRevenueChartProps) {
  const { dateRange } = useDateRange();
  
  // Fetch historical data
  const { 
    data: timeSeriesData, 
    loading: timeSeriesLoading, 
    error: timeSeriesError 
  } = useTimeSeries({
    metricId,
    dateRange
  });
  
  // Fetch forecast data if enabled
  const { 
    data: forecastData, 
    loading: forecastLoading 
  } = useForecast({
    metricId,
    dateRange,
    horizon: 30,
    enabled: showForecast
  });
  
  // Combine historical and forecast data
  const chartData = useMemo(() => {
    if (!timeSeriesData) return [];
    
    const historicalData = timeSeriesData.map(point => ({
      date: new Date(point.timestamp).toISOString().split('T')[0],
      historical: point.value,
      forecast: null,
      upperBound: null,
      lowerBound: null
    }));
    
    if (!forecastData || !showForecast) return historicalData;
    
    const forecastPoints = forecastData.forecast.map(point => ({
      date: new Date(point.timestamp).toISOString().split('T')[0],
      historical: null,
      forecast: point.value,
      upperBound: showConfidenceInterval ? forecastData.confidence.upper.find(
        p => p.timestamp === point.timestamp
      )?.value : null,
      lowerBound: showConfidenceInterval ? forecastData.confidence.lower.find(
        p => p.timestamp === point.timestamp
      )?.value : null
    }));
    
    return [...historicalData, ...forecastPoints];
  }, [timeSeriesData, forecastData, showForecast, showConfidenceInterval]);
  
  const loading = timeSeriesLoading || (showForecast && forecastLoading);
  
  if (loading) {
    return <Skeleton className="h-[300px] w-full" />;
  }
  
  if (timeSeriesError) {
    return <div>Error loading chart data</div>;
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Revenue Over Time</h3>
        
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <Switch 
              checked={showForecast} 
              onCheckedChange={onToggleForecast} 
              id="show-forecast"
            />
            <Label htmlFor="show-forecast">Show Forecast</Label>
          </div>
          
          {showForecast && (
            <div className="flex items-center space-x-2">
              <Switch 
                checked={showConfidenceInterval} 
                onCheckedChange={onToggleConfidenceInterval}
                id="show-confidence" 
              />
              <Label htmlFor="show-confidence">Show Confidence</Label>
            </div>
          )}
        </div>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            
            {/* Historical data line */}
            <Line 
              type="monotone" 
              dataKey="historical" 
              stroke="#8884d8" 
              name="Historical"
              connectNulls 
            />
            
            {/* Forecast data line */}
            {showForecast && (
              <Line 
                type="monotone" 
                dataKey="forecast" 
                stroke="#82ca9d" 
                strokeDasharray="5 5"
                name="Forecast" 
                connectNulls 
              />
            )}
            
            {/* Confidence interval */}
            {showForecast && showConfidenceInterval && (
              <>
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  stroke="none"
                  fill="#82ca9d"
                  fillOpacity={0.2}
                  name="Upper Bound"
                />
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  stroke="none"
                  fill="#82ca9d"
                  fillOpacity={0.2}
                  name="Lower Bound"
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

## Testing

### Component Tests

```typescript
// components/__tests__/enhanced-revenue-chart.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { EnhancedRevenueChart } from '../enhanced-revenue-chart';
import { useTimeSeries } from '../../hooks/use-time-series';
import { useForecast } from '../../hooks/use-forecast';

jest.mock('../../hooks/use-time-series');
jest.mock('../../hooks/use-forecast');

describe('EnhancedRevenueChart', () => {
  beforeEach(() => {
    (useTimeSeries as jest.Mock).mockReturnValue({
      data: [
        { timestamp: '2025-01-01', value: 100 },
        { timestamp: '2025-01-02', value: 150 }
      ],
      loading: false,
      error: null
    });
    
    (useForecast as jest.Mock).mockReturnValue({
      data: {
        forecast: [
          { timestamp: '2025-01-03', value: 160 }
        ],
        confidence: {
          upper: [{ timestamp: '2025-01-03', value: 180 }],
          lower: [{ timestamp: '2025-01-03', value: 140 }]
        }
      },
      loading: false
    });
  });
  
  it('renders historical data', () => {
    render(<EnhancedRevenueChart metricId="test-metric" />);
    expect(screen.getByText('Historical')).toBeInTheDocument();
  });
  
  it('toggles forecast display', () => {
    render(<EnhancedRevenueChart metricId="test-metric" />);
    
    const toggle = screen.getByRole('switch', { name: /show forecast/i });
    fireEvent.click(toggle);
    
    expect(screen.getByText('Forecast')).toBeInTheDocument();
  });
});
```

## Success Criteria

- [ ] API client hooks implemented and tested
- [ ] Enhanced chart components working with real data
- [ ] Forecast visualization working correctly
- [ ] Performance requirements met (smooth UI updates)
- [ ] All component tests passing
- [ ] Accessibility requirements met
- [ ] Responsive design working on all screen sizes

## Next Steps

After completing this phase:
1. Review UI/UX with stakeholders
2. Conduct performance testing
3. Begin deployment preparation in Phase 6
4. Document frontend features and usage
