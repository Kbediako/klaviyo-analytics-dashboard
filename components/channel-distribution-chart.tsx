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
import { Skeleton } from './ui/skeleton';

// Colors for the pie chart segments
const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'];

/**
 * Channel Distribution Chart Component
 * 
 * Displays revenue distribution by marketing channel
 */
export function ChannelDistributionChart() {
  const { data, isLoading, error } = useChannelDistributionData();
  
  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="h-[180px] w-[180px] flex items-center justify-center bg-muted/20 rounded-full">
        <Skeleton className="h-full w-full rounded-full" />
      </div>
    );
  }
  
  // Show error if there was a problem
  if (error) {
    return (
      <div className="h-[180px] w-[180px] flex items-center justify-center bg-muted/20 rounded-full">
        <p className="text-destructive">Failed to load chart data</p>
      </div>
    );
  }
  
  // Show chart if data is available
  return (
    <ResponsiveContainer width="100%" height={180}>
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
  );
}
