'use client';

import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  TooltipProps
} from 'recharts';
import { useDateRange } from '../hooks/use-date-range';
import { useTimeSeries } from '../hooks/use-time-series';
import { useForecast } from '../hooks/use-forecast';
import { Skeleton } from './ui/skeleton';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface EnhancedRevenueChartProps {
  metricId: string;
  title?: string;
  description?: string;
  initialShowForecast?: boolean;
  initialShowConfidenceInterval?: boolean;
  initialForecastMethod?: 'naive' | 'moving_average' | 'linear_regression';
}

interface ChartDataPoint {
  date: string;
  historical?: number;
  forecast?: number;
  upperBound?: number;
  lowerBound?: number;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>): React.ReactNode => {
  if (!active || !payload?.length) return null;

  return (
    <div 
      role="tooltip"
      aria-label="Revenue details for selected date"
      style={{
        backgroundColor: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '8px 12px',
        color: 'var(--foreground)'
      }}
    >
      <p style={{ margin: '0 0 8px' }}>{new Date(label || '').toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric'
      })}</p>
      {payload.map((entry) => {
        if (!entry || typeof entry.value === 'undefined') return null;
        return (
          <p key={entry.dataKey} style={{ margin: '4px 0', color: 'var(--foreground)' }}>
            <span style={{ color: entry.color }}>
              {entry.name}
            </span>
            {': '}
            <span>${entry.value.toLocaleString()}</span>
          </p>
        );
      })}
    </div>
  );
};

export function EnhancedRevenueChart({
  metricId,
  title = 'Revenue Forecast',
  description = 'Historical revenue data with forecast projections',
  initialShowForecast = false,
  initialShowConfidenceInterval = false,
  initialForecastMethod = 'naive'
}: EnhancedRevenueChartProps) {
  const [showForecast, setShowForecast] = useState<boolean>(initialShowForecast);
  const [showConfidenceInterval, setShowConfidenceInterval] = useState<boolean>(initialShowConfidenceInterval);
  const [forecastMethod, setForecastMethod] = useState<'naive' | 'moving_average' | 'linear_regression'>(initialForecastMethod);
  const [forecastHorizon, setForecastHorizon] = useState<string>("30");
  
  const { dateRange } = useDateRange();
  
  // Fetch historical data
  const { 
    data: timeSeriesData, 
    isLoading: timeSeriesLoading, 
    isError: timeSeriesError,
    error: timeSeriesErrorObj
  } = useTimeSeries({
    metricId,
    interval: '1 day'
  });
  
  // Fetch forecast data if enabled
  const { 
    data: forecastData, 
    isLoading: forecastLoading,
    isError: forecastError,
    error: forecastErrorObj
  } = useForecast({
    metricId,
    horizon: forecastHorizon,
    method: forecastMethod,
    enabled: showForecast
  });
  
  // Combine historical and forecast data
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!timeSeriesData || timeSeriesData.length === 0) return [];
    
    const historicalData = timeSeriesData.map(point => ({
      date: new Date(point.timestamp).toISOString().split('T')[0],
      historical: point.value,
      forecast: undefined,
      upperBound: undefined,
      lowerBound: undefined
    }));
    
    if (!forecastData || !showForecast || forecastData.forecast.length === 0) {
      return historicalData;
    }
    
    const forecastPoints = forecastData.forecast.map(point => ({
      date: new Date(point.timestamp).toISOString().split('T')[0],
      historical: undefined,
      forecast: point.value,
      upperBound: showConfidenceInterval && forecastData.confidence 
        ? forecastData.confidence.upper.find(p => p.timestamp === point.timestamp)?.value 
        : undefined,
      lowerBound: showConfidenceInterval && forecastData.confidence
        ? forecastData.confidence.lower.find(p => p.timestamp === point.timestamp)?.value
        : undefined
    }));
    
    return [...historicalData, ...forecastPoints];
  }, [timeSeriesData, forecastData, showForecast, showConfidenceInterval]);
  
  const loading = timeSeriesLoading || (showForecast && forecastLoading);
  const error = timeSeriesError || (showForecast && forecastError);
  const errorMessage = timeSeriesErrorObj?.message || forecastErrorObj?.message;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
        
        <div className="flex flex-wrap justify-between items-center gap-4 mt-2">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch 
                checked={showForecast} 
                onCheckedChange={setShowForecast} 
                id="show-forecast"
              />
              <Label htmlFor="show-forecast">Show Forecast</Label>
            </div>
            
            {showForecast && (
              <>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={showConfidenceInterval} 
                    onCheckedChange={setShowConfidenceInterval}
                    id="show-confidence" 
                  />
                  <Label htmlFor="show-confidence">Show Confidence</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="forecast-method">Method:</Label>
                  <Select 
                    value={forecastMethod} 
                    onValueChange={(value) => setForecastMethod(value as any)}
                  >
                    <SelectTrigger className="w-[180px]" id="forecast-method">
                      <SelectValue placeholder="Forecast Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="naive">Naive</SelectItem>
                      <SelectItem value="moving_average">Moving Average</SelectItem>
                      <SelectItem value="linear_regression">Linear Regression</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="forecast-horizon">Horizon (days):</Label>
                  <Select 
                    value={forecastHorizon} 
                    onValueChange={setForecastHorizon}
                  >
                    <SelectTrigger className="w-[100px]" id="forecast-horizon">
                      <SelectValue placeholder="Days" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7</SelectItem>
                      <SelectItem value="14">14</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="60">60</SelectItem>
                      <SelectItem value="90">90</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-[400px] w-full">
          {loading ? (
            <div className="h-full flex flex-col justify-between p-4 bg-muted/20 rounded-md">
              {/* Skeleton for axes and grid */}
              <div className="flex justify-between items-end h-full relative">
                {/* Y-axis skeleton */}
                <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-10" />
                  ))}
                </div>
                {/* Grid lines skeleton */}
                <div className="absolute left-16 right-8 top-0 bottom-8">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="border-t border-muted h-[20%]" />
                  ))}
                </div>
                {/* X-axis skeleton */}
                <div className="absolute left-16 right-8 bottom-0 flex justify-between">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-16" />
                  ))}
                </div>
              </div>
              {/* Legend skeleton */}
              <div className="flex justify-center gap-4 mt-4">
                {['Historical', 'Forecast', 'Confidence'].map((label) => (
                  <div key={label} className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center bg-muted/20 rounded-md">
              <p className="text-destructive">Failed to load chart data: {errorMessage || 'Unknown error'}</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center bg-muted/20 rounded-md">
              <p className="text-muted-foreground">No data available for the selected metric</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" className="revenue-chart bg-muted/5 rounded-md p-2">
              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 70,
                  bottom: 25,
                }}
                style={{
                  fontSize: '12px'
                }}
                role="img"
                aria-label="Revenue trends with forecast"
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="var(--muted-foreground)"
                  strokeOpacity={0.2}
                  vertical={false}
                  role="presentation"
                  aria-label="Chart grid lines"
                />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    const d = new Date(date);
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                  stroke="var(--muted-foreground)"
                  tick={{ fill: 'var(--foreground)' }}
                  tickLine={{ stroke: 'var(--muted-foreground)' }}
                  axisLine={{ stroke: 'var(--muted-foreground)' }}
                  role="presentation"
                  aria-label="Date axis showing revenue over time"
                />
                <YAxis 
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  stroke="var(--muted-foreground)"
                  tick={{ fill: 'var(--foreground)' }}
                  tickLine={{ stroke: 'var(--muted-foreground)' }}
                  axisLine={{ stroke: 'var(--muted-foreground)' }}
                  role="presentation"
                  aria-label="Revenue axis showing dollar amounts"
                />
                <Tooltip content={CustomTooltip} />
                <Legend 
                  wrapperStyle={{
                    paddingTop: '10px',
                    color: 'var(--foreground)'
                  }}
                  role="presentation"
                  aria-label="Chart legend"
                />
                
                {/* Historical data line */}
                <Line 
                  type="monotone" 
                  dataKey="historical" 
                  name="Historical"
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  animationDuration={750}
                  animationBegin={0}
                  connectNulls
                  role="presentation"
                  aria-label="Historical revenue data"
                />
                
                {/* Forecast data line */}
                {showForecast && (
                  <Line 
                    type="monotone" 
                    dataKey="forecast" 
                    name="Forecast"
                    stroke="#10b981" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    animationDuration={750}
                    animationBegin={250}
                    connectNulls
                    role="presentation"
                    aria-label="Forecast revenue data"
                  />
                )}
                
                {/* Confidence interval */}
                {showForecast && showConfidenceInterval && (
                  <>
                    <Area
                      type="monotone"
                      dataKey="upperBound"
                      stroke="none"
                      fill="#10b981"
                      fillOpacity={0.2}
                      name="Upper Bound"
                      connectNulls
                      role="presentation"
                      aria-label="Upper confidence bound"
                    />
                    <Area
                      type="monotone"
                      dataKey="lowerBound"
                      stroke="none"
                      fill="#10b981"
                      fillOpacity={0.2}
                      name="Lower Bound"
                      connectNulls
                      role="presentation"
                      aria-label="Lower confidence bound"
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
