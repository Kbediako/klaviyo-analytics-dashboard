'use client';

import React, { useMemo, useState, useCallback } from 'react';
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
import { Button } from './ui/button';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

// Helper functions for data processing
function formatCurrency(value: number | undefined): string {
  if (value === undefined || value === null) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);
}

function isValidDate(date: string): boolean {
  return !isNaN(new Date(date).getTime());
}

function isValidNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value);
}

function sortChronologically(data: ChartDataPoint[]): ChartDataPoint[] {
  return [...data].sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
}

interface EnhancedRevenueChartProps {
  metricId: string;
  title?: string;
  description?: string;
  initialShowForecast?: boolean;
  initialShowConfidenceInterval?: boolean;
  initialForecastMethod?: 'naive' | 'moving_average' | 'linear_regression';
  maxPoints?: number; // For downsampling
  printFriendly?: boolean;
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
      className="bg-background border border-border/30 rounded-lg p-3 shadow-md text-sm"
    >
      <p className="font-medium mb-2">{isValidDate(label || '') ? new Date(label || '').toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric'
      }) : label}</p>
      {payload.map((entry) => {
        if (!entry || typeof entry.value === 'undefined') return null;
        return (
          <p key={entry.dataKey} className="flex justify-between items-center my-1 gap-4">
            <span className="flex items-center gap-1">
              <span 
                className="inline-block w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }} 
                aria-hidden="true"
              />
              <span>{entry.name}</span>
            </span>
            <span className="font-mono font-medium tabular-nums">{formatCurrency(entry.value)}</span>
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
  initialForecastMethod = 'naive',
  maxPoints = 500,
  printFriendly = false
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
    error: timeSeriesErrorObj,
    refetch: refetchTimeSeries
  } = useTimeSeries({
    metricId,
    interval: '1 day'
  });
  
  // Fetch forecast data if enabled
  const { 
    data: forecastData, 
    isLoading: forecastLoading,
    isError: forecastError,
    error: forecastErrorObj,
    refetch: refetchForecast
  } = useForecast({
    metricId,
    horizon: forecastHorizon,
    method: forecastMethod,
    enabled: showForecast
  });

  // Handle refetch of data
  const handleRefresh = useCallback(() => {
    refetchTimeSeries();
    if (showForecast) {
      refetchForecast();
    }
  }, [refetchTimeSeries, refetchForecast, showForecast]);
  
  // Process and validate data for chart
  const chartData = useMemo<ChartDataPoint[]>(() => {
    try {
      // Validate time series data
      if (!timeSeriesData || !Array.isArray(timeSeriesData) || timeSeriesData.length === 0) return [];
      
      // Process historical data
      const historicalData = timeSeriesData
        .filter(point => point && point.timestamp && isValidDate(point.timestamp))
        .map(point => ({
          date: new Date(point.timestamp).toISOString().split('T')[0],
          historical: isValidNumber(point.value) ? point.value : undefined,
          forecast: undefined,
          upperBound: undefined,
          lowerBound: undefined
        }));
      
      if (!forecastData || !showForecast || !Array.isArray(forecastData.forecast) || forecastData.forecast.length === 0) {
        return sortChronologically(historicalData);
      }
      
      // Process forecast data
      const forecastPoints = forecastData.forecast
        .filter(point => point && point.timestamp && isValidDate(point.timestamp))
        .map(point => {
          // Find confidence bounds if available
          let upperValue = undefined;
          let lowerValue = undefined;
          
          if (showConfidenceInterval && forecastData.confidence) {
            const upper = forecastData.confidence.upper.find(p => p.timestamp === point.timestamp);
            const lower = forecastData.confidence.lower.find(p => p.timestamp === point.timestamp);
            
            upperValue = upper && isValidNumber(upper.value) ? upper.value : undefined;
            lowerValue = lower && isValidNumber(lower.value) ? lower.value : undefined;
          }
          
          return {
            date: new Date(point.timestamp).toISOString().split('T')[0],
            historical: undefined,
            forecast: isValidNumber(point.value) ? point.value : undefined,
            upperBound: upperValue,
            lowerBound: lowerValue
          };
        });
      
      // Combine and sort data chronologically
      const combinedData = [...historicalData, ...forecastPoints];
      return sortChronologically(combinedData);
    } catch (error) {
      console.error('Error processing chart data:', error);
      return [];
    }
  }, [timeSeriesData, forecastData, showForecast, showConfidenceInterval]);
  
  // Downsample data if needed
  const downsampledData = useMemo(() => {
    if (chartData.length <= maxPoints) return chartData;
    
    // Use LTTB (Largest Triangle Three Buckets) algorithm for downsampling
    // For simplicity, this is a basic implementation - just picks evenly spaced points
    const skip = Math.ceil(chartData.length / maxPoints);
    const result: ChartDataPoint[] = [];
    
    for (let i = 0; i < chartData.length; i += skip) {
      if (chartData[i]) {
        result.push(chartData[i]);
      }
    }
    
    // Always include the first and last points
    if (result.length > 0 && chartData.length > 0) {
      if (result[0]?.date !== chartData[0]?.date) {
        result.unshift(chartData[0]);
      }
      if (result[result.length - 1]?.date !== chartData[chartData.length - 1]?.date) {
        result.push(chartData[chartData.length - 1]);
      }
    }
    
    return result;
  }, [chartData, maxPoints]);
  
  const loading = timeSeriesLoading || (showForecast && forecastLoading);
  const error = timeSeriesError || (showForecast && forecastError);
  const errorMessage = timeSeriesErrorObj?.message || forecastErrorObj?.message;
  const hasData = downsampledData.length > 0;
  
  // Determine chart theme based on print-friendly mode
  const chartTheme = printFriendly ? {
    historical: '#333333',
    forecast: '#666666',
    confidence: '#EEEEEE',
    grid: '#CCCCCC',
    background: '#FFFFFF',
    text: '#000000'
  } : {
    historical: '#3b82f6',
    forecast: '#10b981',
    confidence: '#10b981',
    grid: 'var(--muted-foreground)',
    background: 'var(--background)',
    text: 'var(--foreground)'
  };
  
  return (
    <Card className={`w-full ${printFriendly ? 'print:shadow-none print:border-black' : ''}`}>
      <CardHeader>
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          
          {!loading && !error && hasData && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="ml-auto"
              aria-label="Refresh chart data"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" aria-hidden="true" />
              <span className="sr-only md:not-sr-only">Refresh</span>
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap justify-between items-center gap-4 mt-2">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch 
                checked={showForecast} 
                onCheckedChange={setShowForecast} 
                id="show-forecast"
                aria-label="Toggle forecast display"
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
                    aria-label="Toggle confidence interval display"
                  />
                  <Label htmlFor="show-confidence">Show Confidence</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="forecast-method">Method:</Label>
                  <Select 
                    value={forecastMethod} 
                    onValueChange={(value) => setForecastMethod(value as any)}
                  >
                    <SelectTrigger className="w-[180px]" id="forecast-method" aria-label="Select forecast method">
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
                    <SelectTrigger className="w-[100px]" id="forecast-horizon" aria-label="Select forecast horizon">
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
        <div 
          className="h-[400px] w-full" 
          id={`revenue-chart-${metricId}`}
          role="region"
          aria-label="Revenue chart visualization"
          aria-describedby={`revenue-chart-desc-${metricId}`}
        >
          <div id={`revenue-chart-desc-${metricId}`} className="sr-only">
            {`This chart displays ${showForecast ? 'historical and forecast' : 'historical'} revenue data over time. 
            ${showForecast && showConfidenceInterval ? 'Confidence intervals are shown around the forecast.' : ''} 
            The chart is ${loading ? 'currently loading' : error ? 'showing an error' : !hasData ? 'empty because no data is available' : 'displaying data points'}.`}
          </div>
          
          {loading ? (
            <div 
              className="h-full flex flex-col justify-between p-4 bg-muted/20 rounded-md"
              role="status"
              aria-label="Loading chart data"
            >
              {/* Skeleton for axes and grid */}
              <div className="flex justify-between items-end h-full relative">
                {/* Y-axis skeleton */}
                <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-10" role="status" />
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
                    <Skeleton key={i} className="h-4 w-16" role="status" />
                  ))}
                </div>
              </div>
              {/* Legend skeleton */}
              <div className="flex justify-center gap-4 mt-4">
                {['Historical', 'Forecast', 'Confidence'].map((label) => (
                  <div key={label} className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" role="status" />
                    <Skeleton className="h-4 w-16" role="status" />
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div 
              className="h-full flex flex-col items-center justify-center p-6 bg-muted/20 rounded-md"
              role="alert"
              aria-live="assertive"
            >
              <p className="text-destructive font-medium">Failed to load chart data</p>
              <p className="text-sm text-muted-foreground mt-2">{errorMessage || 'Unknown error'}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                className="mt-4"
                aria-label="Retry loading chart data"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                Retry
              </Button>
            </div>
          ) : !hasData ? (
            <div 
              className="h-full flex items-center justify-center bg-muted/20 rounded-md"
              role="status"
              aria-label="No data available"
            >
              <div className="text-center">
                <p className="text-muted-foreground">No data available for the selected metric</p>
                <p className="text-sm text-muted-foreground mt-1">Try selecting a different date range or metric</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" className="revenue-chart bg-muted/5 rounded-md p-2">
              <LineChart
                data={downsampledData}
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
                  stroke={chartTheme.grid}
                  strokeOpacity={0.2}
                  vertical={false}
                  role="presentation"
                  aria-hidden="true"
                />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    if (!isValidDate(date)) return '';
                    const d = new Date(date);
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                  stroke={chartTheme.grid}
                  tick={{ fill: chartTheme.text }}
                  tickLine={{ stroke: chartTheme.grid }}
                  axisLine={{ stroke: chartTheme.grid }}
                  role="presentation"
                  aria-hidden="true"
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                  stroke={chartTheme.grid}
                  tick={{ fill: chartTheme.text }}
                  tickLine={{ stroke: chartTheme.grid }}
                  axisLine={{ stroke: chartTheme.grid }}
                  role="presentation"
                  aria-hidden="true"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{
                    paddingTop: '10px',
                    color: chartTheme.text
                  }}
                  role="list"
                  aria-label="Chart legend"
                />
                
                {/* Historical data line */}
                <Line 
                  type="monotone" 
                  dataKey="historical" 
                  name="Historical"
                  stroke={chartTheme.historical}
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
                    stroke={chartTheme.forecast}
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
                      fill={chartTheme.confidence}
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
                      fill={chartTheme.confidence}
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
        
        {/* Add accessible data table for screen readers and print mode */}
        <div className={`mt-4 sr-only ${printFriendly ? 'print:not-sr-only print:mt-6' : ''}`}>
          <table className="min-w-full border-collapse border border-gray-300">
            <caption className="font-medium text-left mb-2">
              {title} - Data Table
            </caption>
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2">Date</th>
                <th className="border border-gray-300 px-4 py-2">Historical</th>
                {showForecast && (
                  <>
                    <th className="border border-gray-300 px-4 py-2">Forecast</th>
                    {showConfidenceInterval && (
                      <>
                        <th className="border border-gray-300 px-4 py-2">Lower Bound</th>
                        <th className="border border-gray-300 px-4 py-2">Upper Bound</th>
                      </>
                    )}
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {downsampledData.map((point, index) => (
                <tr key={`data-point-${index}`}>
                  <td className="border border-gray-300 px-4 py-2">
                    {isValidDate(point.date) ? new Date(point.date).toLocaleDateString() : 'Invalid date'}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {isValidNumber(point.historical) ? formatCurrency(point.historical) : '-'}
                  </td>
                  {showForecast && (
                    <>
                      <td className="border border-gray-300 px-4 py-2">
                        {isValidNumber(point.forecast) ? formatCurrency(point.forecast) : '-'}
                      </td>
                      {showConfidenceInterval && (
                        <>
                          <td className="border border-gray-300 px-4 py-2">
                            {isValidNumber(point.lowerBound) ? formatCurrency(point.lowerBound) : '-'}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {isValidNumber(point.upperBound) ? formatCurrency(point.upperBound) : '-'}
                          </td>
                        </>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}