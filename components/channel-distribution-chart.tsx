'use client';

import React from 'react';
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

// Colors for the pie chart segments
const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'];

/**
 * Channel Distribution Chart Component
 * 
 * Displays revenue distribution by marketing channel
 */
export function ChannelDistributionChart() {
  // Get the current date range parameter
  const { dateRangeParam } = useDateRange();
  
  // Pass the date range parameter to the hook
  const { data, isLoading, error } = useChannelDistributionData({ dateRange: dateRangeParam });
  
  // Container with fixed height to prevent layout shifts
  return (
    <div className="h-[180px] w-full">
      {isLoading ? (
        <div className="h-full flex flex-col items-center justify-center">
          {/* Pie chart skeleton */}
          <div className="relative h-[160px] w-[160px]">
            <Skeleton className="absolute inset-0 rounded-full" />
            {/* Segments skeleton */}
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 border-8 border-muted rounded-full"
                style={{
                  clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos(i * Math.PI / 2)}% ${50 + 50 * Math.sin(i * Math.PI / 2)}%, ${50 + 50 * Math.cos((i + 1) * Math.PI / 2)}% ${50 + 50 * Math.sin((i + 1) * Math.PI / 2)}%)`
                }}
              />
            ))}
          </div>
          {/* Labels skeleton */}
          <div className="flex gap-4 mt-4">
            {['Campaigns', 'Flows', 'Forms', 'Other'].map((label) => (
              <div key={label} className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="h-full flex items-center justify-center bg-muted/20 rounded-full">
          <p className="text-destructive">Failed to load chart data</p>
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
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value}%`} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
