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
  ResponsiveContainer
} from 'recharts';
import { useRevenueChartData } from '../hooks/use-chart-data';
import { Skeleton } from './ui/skeleton';

/**
 * Revenue Chart Component
 * 
 * Displays revenue over time by channel
 */
export function RevenueChart() {
  const { data, isLoading, error } = useRevenueChartData();
  
  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }
  
  // Show error if there was a problem
  if (error) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
        <p className="text-destructive">Failed to load chart data</p>
      </div>
    );
  }
  
  // Show chart if data is available
  return (
    <ResponsiveContainer width="100%" height={300} className="revenue-chart">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="campaigns" stroke="#3b82f6" activeDot={{ r: 8 }} />
        <Line type="monotone" dataKey="flows" stroke="#8b5cf6" />
        <Line type="monotone" dataKey="forms" stroke="#f59e0b" />
        <Line type="monotone" dataKey="other" stroke="#10b981" />
      </LineChart>
    </ResponsiveContainer>
  );
}
