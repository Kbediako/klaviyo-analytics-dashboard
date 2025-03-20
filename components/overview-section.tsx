import React from 'react';
import { useOverviewMetrics } from '../hooks';
import { MetricCard } from './metric-card';
import { MetricCardSkeleton } from './metric-card-skeleton';
import { ErrorAlert } from './error-alert';
import { 
  DollarSignIcon, 
  UsersIcon, 
  MailIcon, 
  FormInputIcon, 
  ShoppingCartIcon 
} from 'lucide-react';

/**
 * Overview section component
 * 
 * @returns React component
 */
export function OverviewSection() {
  const { data, isLoading, isError, error, refetch } = useOverviewMetrics();
  
  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>
    );
  }
  
  // Show error if there was a problem
  if (isError) {
    return (
      <ErrorAlert
        title="Failed to load overview metrics"
        message={error?.message || 'An unknown error occurred'}
        onRetry={() => refetch()}
      />
    );
  }
  
  // Show data if available
  if (data) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={data.revenue.current}
          change={data.revenue.change}
          icon={<DollarSignIcon className="h-4 w-4" />}
          color="green"
        />
        
        <MetricCard
          title="Active Subscribers"
          value={data.subscribers.current}
          change={data.subscribers.change}
          icon={<UsersIcon className="h-4 w-4" />}
          color="blue"
        />
        
        <MetricCard
          title="Conversion Rate"
          value={`${data.conversionRate.current.toFixed(1)}%`}
          change={data.conversionRate.change}
          icon={<ShoppingCartIcon className="h-4 w-4" />}
          color="violet"
        />
        
        <MetricCard
          title="Form Submissions"
          value="3,842"
          change={8.3}
          icon={<FormInputIcon className="h-4 w-4" />}
          color="amber"
        />
      </div>
    );
  }
  
  // Fallback if no data
  return (
    <div className="text-center p-6">
      <p className="text-muted-foreground">No data available</p>
    </div>
  );
}
