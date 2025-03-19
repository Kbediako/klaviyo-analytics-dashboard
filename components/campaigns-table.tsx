import React from 'react';
import { useCampaigns } from '../hooks';
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
 * Campaigns table component
 * 
 * @returns React component
 */
export function CampaignsTable() {
  const { data, isLoading, isError, error, refetch } = useCampaigns();
  
  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead className="text-right">Sent</TableHead>
              <TableHead className="text-right">Open Rate</TableHead>
              <TableHead className="text-right">Click Rate</TableHead>
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
        title="Failed to load campaigns"
        message={error?.message || 'An unknown error occurred'}
        onRetry={() => refetch()}
      />
    );
  }
  
  // Show data if available
  if (data && data.length > 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead className="text-right">Sent</TableHead>
              <TableHead className="text-right">Open Rate</TableHead>
              <TableHead className="text-right">Click Rate</TableHead>
              <TableHead className="text-right">Conversion Rate</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">{campaign.name}</TableCell>
                <TableCell className="text-right">
                  {new Intl.NumberFormat().format(campaign.sent)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={getBadgeVariant(campaign.openRate)}>
                    {campaign.openRate.toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={getBadgeVariant(campaign.clickRate)}>
                    {campaign.clickRate.toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={getBadgeVariant(campaign.conversionRate)}>
                    {campaign.conversionRate.toFixed(1)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  ${new Intl.NumberFormat().format(campaign.revenue)}
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
      <p className="text-muted-foreground">No campaigns available</p>
    </div>
  );
}
