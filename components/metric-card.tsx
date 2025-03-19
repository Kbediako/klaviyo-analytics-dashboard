import React from 'react';
import { Card, CardContent } from './ui/card';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * Interface for metric card props
 */
interface MetricCardProps {
  /**
   * Title of the metric
   */
  title: string;
  
  /**
   * Current value of the metric
   */
  value: string | number;
  
  /**
   * Change percentage compared to previous period
   */
  change: number;
  
  /**
   * Icon to display
   */
  icon: React.ReactNode;
  
  /**
   * Description text
   */
  description?: string;
  
  /**
   * Color theme for the card
   */
  color?: 'blue' | 'green' | 'amber' | 'violet' | 'default';
}

/**
 * Metric card component for displaying KPIs
 * 
 * @param props Component props
 * @returns React component
 */
export function MetricCard({
  title,
  value,
  change,
  icon,
  description = 'vs. previous period',
  color = 'default',
}: MetricCardProps) {
  // Format the value if it's a number
  const formattedValue = typeof value === 'number' 
    ? new Intl.NumberFormat('en-US', {
        notation: value > 999999 ? 'compact' : 'standard',
        maximumFractionDigits: 1,
      }).format(value)
    : value;
  
  // Format the change percentage
  const formattedChange = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  
  // Determine if the trend is positive or negative
  const trend = change >= 0 ? 'up' : 'down';
  
  // Determine the color class based on the trend and color prop
  const colorClass = {
    blue: 'text-blue-600',
    green: 'text-emerald-600',
    amber: 'text-amber-600',
    violet: 'text-violet-600',
    default: 'text-gray-600',
  }[color];
  
  // Determine the change color based on the trend
  const changeColorClass = trend === 'up' 
    ? 'text-emerald-600' 
    : 'text-red-600';
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn("rounded-full p-1", colorClass)}>
            {icon}
          </div>
        </div>
        
        <div className="mt-2">
          <h2 className="text-3xl font-bold">{formattedValue}</h2>
          
          <div className="mt-2 flex items-center">
            <div className={cn("flex items-center", changeColorClass)}>
              {trend === 'up' ? (
                <ArrowUpIcon className="mr-1 h-4 w-4" />
              ) : (
                <ArrowDownIcon className="mr-1 h-4 w-4" />
              )}
              <span className="font-medium">{formattedChange}</span>
            </div>
            
            {description && (
              <span className="ml-2 text-xs text-muted-foreground">
                {description}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
