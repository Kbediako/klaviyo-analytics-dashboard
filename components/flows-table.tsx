import React from 'react';
import { useFlows } from '../hooks';
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
import { Progress } from './ui/progress';

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
 * Flows table component
 * 
 * @returns React component
 */
export function FlowsTable() {
  const { data, isLoading, isError, error, refetch } = useFlows();
  
  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="rounded-md border flows-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Flow</TableHead>
              <TableHead className="text-right">Recipients</TableHead>
              <TableHead className="text-right">Open Rate</TableHead>
              <TableHead className="text-right">Click Rate</TableHead>
              <TableHead>Conversion Rate</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-5 w-[60px] ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-5 w-[60px] ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-5 w-[60px] ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-full" /></TableCell>
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
        title="Failed to load flows"
        message={error?.message || 'An unknown error occurred'}
        onRetry={() => refetch()}
      />
    );
  }
  
  // Show data if available
  if (data && data.length > 0) {
    return (
      <div className="rounded-md border flows-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Flow</TableHead>
              <TableHead className="text-right">Recipients</TableHead>
              <TableHead className="text-right">Open Rate</TableHead>
              <TableHead className="text-right">Click Rate</TableHead>
              <TableHead>Conversion Rate</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((flow) => (
              <TableRow key={flow.id}>
                <TableCell className="font-medium">{flow.name}</TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat().format(flow.recipients)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={getBadgeVariant(flow.openRate)}>
                    {flow.openRate.toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={getBadgeVariant(flow.clickRate)}>
                    {flow.clickRate.toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={flow.conversionRate} className="h-2" />
                    <span className="text-xs text-muted-foreground w-10">
                      {flow.conversionRate.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  ${new Intl.NumberFormat().format(flow.revenue)}
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
      <p className="text-muted-foreground">No flows available</p>
    </div>
  );
}
