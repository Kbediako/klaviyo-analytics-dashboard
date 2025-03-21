'use client';

import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { useChannelDistributionData } from '../hooks/use-chart-data';
import { useDateRange } from '../hooks';
import { Skeleton } from './ui/skeleton';
import { ChannelDataPoint } from '../lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

// Colors for the pie chart segments
const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'];

/**
 * Custom accessible tooltip for the pie chart
 */
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0];
  return (
    <div 
      role="tooltip" 
      aria-label={`${data.name}: ${data.value}%`}
      className="bg-background border border-border/30 rounded-lg p-2 shadow-md text-xs"
    >
      <p className="font-medium">{data.name}</p>
      <p className="text-muted-foreground">{`${data.value}%`}</p>
    </div>
  );
};

/**
 * Custom accessible legend for the pie chart
 */
const CustomLegend = ({ payload }) => {
  if (!payload || !payload.length) return null;
  
  return (
    <ul 
      className="flex flex-wrap justify-center gap-3 mt-2 text-xs"
      role="list"
      aria-label="Chart legend"
    >
      {payload.map((entry, index) => (
        <li key={`legend-${index}`} className="flex items-center gap-1">
          <span 
            className="inline-block w-3 h-3 rounded-sm" 
            style={{ backgroundColor: entry.color }}
            role="presentation"
          />
          <span>{entry.value}: {entry.payload.value}%</span>
        </li>
      ))}
    </ul>
  );
};

/**
 * Channel Distribution Chart Component
 * 
 * Displays revenue distribution by marketing channel
 */
interface ChannelDistributionChartProps {
  title?: string;
  description?: string;
  data?: ChannelDataPoint[];
  isLoading?: boolean;
  error?: Error | null;
}

export function ChannelDistributionChart({ 
  title = "Channel Distribution",
  description = "Revenue distribution by marketing channel",
  data = [], 
  isLoading = false, 
  error = null 
}: ChannelDistributionChartProps) {
  
  // Check if data is valid for rendering
  const hasValidData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return false;
    
    // Check if there's at least one non-zero value
    return data.some(item => 
      item && 
      typeof item.value === 'number' && 
      item.value > 0
    );
  }, [data]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <div 
          className="h-[200px] w-full"
          role="region"
          aria-label="Channel distribution chart"
        >
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center">
              {/* Pie chart skeleton */}
              <div className="relative h-[160px] w-[160px]">
                <Skeleton className="absolute inset-0 rounded-full" data-testid="skeleton" />
                {/* Segments skeleton */}
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-0 border-8 border-muted rounded-full"
                    style={{
                      clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(i * Math.PI / 2)}% ${50 + 50 * Math.sin(i * Math.PI / 2)}%, ${50 + 50 * Math.cos((i + 1) * Math.PI / 2)}% ${50 + 50 * Math.sin((i + 1) * Math.PI / 2)}%)`
                    }}
                    data-testid="skeleton"
                  />
                ))}
              </div>
              {/* Labels skeleton */}
              <div className="flex gap-4 mt-4">
                {['Campaigns', 'Flows', 'Forms', 'Other'].map((label) => (
                  <div key={label} className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" data-testid="skeleton" />
                    <Skeleton className="h-4 w-16" data-testid="skeleton" />
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center p-6 bg-muted/10 rounded-lg border border-border/30">
              <p className="text-destructive font-medium">Failed to load chart data</p>
              <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
              <button 
                className="mt-3 text-xs text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1"
                onClick={() => window.location.reload()}
                aria-label="Reload page"
              >
                Retry
              </button>
            </div>
          ) : !hasValidData ? (
            <div className="h-full flex items-center justify-center bg-muted/10 rounded-lg border border-border/30">
              <div className="text-center">
                <p className="text-muted-foreground">No data available</p>
                <p className="text-xs text-muted-foreground mt-1">There are no channels with data for the selected period</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" className="channel-distribution-chart">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  isAnimationActive={true}
                  animationDuration={750}
                  animationBegin={0}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  cornerRadius={3}
                  paddingAngle={2}
                  role="img"
                  aria-label={`Pie chart showing channel distribution: ${data.map(d => `${d.name} ${d.value}%`).join(', ')}`}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      stroke="var(--background)"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}