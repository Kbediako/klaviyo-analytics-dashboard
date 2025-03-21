import React from 'react';
import { useForms } from '../hooks';
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
import { Progress } from './ui/progress';

/**
 * Forms table component
 * 
 * @returns React component
 */
export function FormsTable() {
  const { data, isLoading, isError, error, refetch } = useForms();
  
  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="rounded-md border forms-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Form</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Submissions</TableHead>
              <TableHead>Submission Rate</TableHead>
              <TableHead className="text-right">Conversions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-5 w-[60px] ml-auto" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-5 w-[60px] ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-5 w-[60px] ml-auto" /></TableCell>
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
        title="Failed to load forms"
        message={error?.message || 'An unknown error occurred'}
        onRetry={() => refetch()}
      />
    );
  }
  
  // Show data if available
  if (data && data.length > 0) {
    return (
      <div className="rounded-md border forms-table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Form</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Submissions</TableHead>
              <TableHead>Submission Rate</TableHead>
              <TableHead className="text-right">Conversions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((form) => (
              <TableRow key={form.id}>
                <TableCell className="font-medium">{form.name}</TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat().format(form.views)}
                </TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat().format(form.submissions)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={form.submissionRate} 
                      className={`h-2 w-full ${
                        form.submissionRate >= 30
                          ? "bg-emerald-600/20"
                          : form.submissionRate >= 15
                          ? "bg-blue-600/20"
                          : "bg-amber-600/20"
                      }`}
                    />
                    <span className="text-xs text-muted-foreground w-10">
                      {form.submissionRate.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat().format(form.conversions)}
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
      <p className="text-muted-foreground">No forms available</p>
    </div>
  );
}
