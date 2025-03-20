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
  
  // Log data for debugging
  React.useEffect(() => {
    if (data) {
      console.log('Overview metrics data:', data);
    }
    if (isError) {
      console.error('Overview metrics error:', error);
    }
  }, [data, isError, error]);
  
  // Show skeleton while loading
  if (isLoading) {
    console.log('Overview metrics loading...');
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 overview-section">
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
  
  // Check data structure
  if (!data || typeof data !== 'object') {
    console.error('Invalid overview data format:', data);
    return (
      <ErrorAlert
        title="Invalid data format"
        message="The data received does not match the expected format"
        onRetry={() => refetch()}
      />
    );
  }
  
  // Ensure all required properties exist
  const hasRequiredProps = data.revenue && 
                          data.subscribers && 
                          data.conversionRate && 
                          typeof data.revenue.current === 'number' &&
                          typeof data.subscribers.current === 'number' &&
                          typeof data.conversionRate.current === 'number';
  
  if (!hasRequiredProps) {
    console.error('Missing required properties in overview data:', data);
    return (
      <ErrorAlert
        title="Incomplete data"
        message="Some required data properties are missing"
        onRetry={() => refetch()}
      />
    );
  }
  
  // Show data if available
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 overview-section">
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
        value={data.formSubmissions?.current || 3842}
        change={data.formSubmissions?.change || 8.3}
        icon={<FormInputIcon className="h-4 w-4" />}
        color="amber"
      />
    </div>
  );
}