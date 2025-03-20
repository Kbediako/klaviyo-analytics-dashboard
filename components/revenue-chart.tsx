'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { useRevenueChartData } from '../hooks/use-chart-data';
import { useDateRange } from '../hooks';
import { Skeleton } from './ui/skeleton';

type RevenueDataPoint = {
  date: string;
  campaigns: number;
  flows: number;
  forms: number;
  other: number;
};

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

/**
 * Revenue Chart Component
 * 
 * Displays revenue over time by channel
 */
export function RevenueChart() {
  // Get the current date range parameter
  const { dateRangeParam } = useDateRange();
  
  // Pass the date range parameter to the hook
  const { data, isLoading, error } = useRevenueChartData({ dateRange: dateRangeParam });
  
  // Container with fixed height to prevent layout shifts
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">Revenue by Channel</h3>
      <div className="h-[300px] w-full">
        {isLoading ? (
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
              {['Campaigns', 'Flows', 'Forms', 'Other'].map((label) => (
                <div key={label} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center bg-muted/20 rounded-md">
            <p className="text-destructive">Failed to load chart data</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" className="revenue-chart bg-muted/5 rounded-md p-2">
            <LineChart
              data={data}
              margin={{
                top: 10,
                right: 30,
                left: 70, // Further increased to accommodate dollar signs on all screen sizes
                bottom: 25, // Further increased to ensure date labels are fully visible
              }}
              style={{
                fontSize: '12px' // Smaller font size for better responsiveness
              }}
              role="img"
              aria-label="Revenue trends by channel over time"
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
                formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                role="presentation"
                aria-label="Chart legend showing revenue channels"
              />
              <Line 
                type="monotone" 
                dataKey="campaigns" 
                name="Campaigns"
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
                animationDuration={750}
                animationBegin={0}
                role="presentation"
                aria-label="Campaign revenue over time"
              />
              <Line 
                type="monotone" 
                dataKey="flows"
                name="Flows" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
                animationDuration={750}
                animationBegin={250}
                role="presentation"
                aria-label="Flow revenue over time"
              />
              <Line 
                type="monotone" 
                dataKey="forms"
                name="Forms" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
                animationDuration={750}
                animationBegin={500}
                role="presentation"
                aria-label="Form revenue over time"
              />
              <Line 
                type="monotone" 
                dataKey="other"
                name="Other" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
                animationDuration={750}
                animationBegin={750}
                role="presentation"
                aria-label="Other revenue over time"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
