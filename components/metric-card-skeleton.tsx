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
    <Card className="min-h-[144px]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-[14px] w-[100px]" /> {/* Match text-sm */}
          <Skeleton className="h-6 w-6 rounded-full" /> {/* Match icon size */}
        </div>
        
        <div className="mt-2">
          <Skeleton className="h-[36px] w-[120px]" /> {/* Match text-3xl */}
          
          <div className="mt-2 flex items-center">
            <div className="flex items-center">
              <Skeleton className="h-4 w-4 mr-1" /> {/* Match arrow icon */}
              <Skeleton className="h-[16px] w-[60px]" /> {/* Match font-medium text */}
            </div>
            <Skeleton className="h-[12px] w-[100px] ml-2" /> {/* Match text-xs */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
