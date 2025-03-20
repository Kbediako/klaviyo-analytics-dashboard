import React from 'react';
import { useSegments } from '../hooks';
import { ErrorAlert } from './error-alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';

/**
 * Helper function to get badge variant based on rate
 * 
 * @param rate Rate value
 * @returns Badge variant
 */
function getBadgeVariant(rate: number): 'default' | 'secondary' | 'outline' {
  if (rate >= 30) return 'default';
  if (rate >= 20) return 'secondary';
  return 'outline';
}

/**
 * Segments table component
 * 
 * @returns React component
 */
export function SegmentsTable() {
  const { data, isLoading, isError, error, refetch } = useSegments();
  
  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="rounded-md border segments-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Segment</TableHead>
              <TableHead className="text-right">Members</TableHead>
              <TableHead className="text-right">Conversion Rate</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-5 w-[60px] ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-5 w-[60px] ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-5 w-[80px] ml-auto" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
  
  // Show error if there was a problem
  if (isError) {
    return (
      <ErrorAlert
        title="Failed to load segments"
        message={error?.message || 'An unknown error occurred'}
        onRetry={() => refetch()}
      />
    );
  }
  
  // Show data if available
  if (data && data.length > 0) {
    // Sort segments by revenue (highest first)
    const sortedSegments = [...data].sort((a, b) => b.revenue - a.revenue);
    
    return (
      <div className="rounded-md border segments-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Segment</TableHead>
              <TableHead className="text-right">Members</TableHead>
              <TableHead className="text-right">Conversion Rate</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSegments.map((segment) => (
              <TableRow key={segment.id}>
                <TableCell className="font-medium">{segment.name}</TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat().format(segment.count)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={getBadgeVariant(segment.conversionRate)}>
                    {segment.conversionRate.toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  ${new Intl.NumberFormat().format(segment.revenue)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }
  
  // Fallback if no data
  return (
    <div className="text-center p-6 border rounded-md">
      <p className="text-muted-foreground">No segments available</p>
    </div>
  );
}
