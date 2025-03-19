import React from 'react';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';

/**
 * Skeleton loader for metric cards
 * 
 * @returns React component
 */
export function MetricCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        
        <div className="mt-2">
          <Skeleton className="h-10 w-[120px] mt-2" />
          
          <div className="mt-2 flex items-center">
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-3 w-[100px] ml-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
