/**
 * Type definitions for the API client
 */

export interface DateRangeParam {
  dateRange?: string;
}

export interface FetchParams extends DateRangeParam {
  forceFresh?: boolean;
}

export interface FetchOptions extends RequestInit {
  params?: DateRangeParam | Record<string, string | undefined>;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface RevenueDataPoint {
  date: string;
  campaigns: number;
  flows: number;
  forms: number;
  other: number;
}

export interface ChannelDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface TopSegmentData {
  id: number;
  name: string;
  conversionRate: number;
  count: number;
  revenue: number;
}

export interface TopFlowData {
  id: number;
  name: string;
  recipients: number;
  conversionRate: number;
}

export interface TopFormData {
  id: number;
  name: string;
  views: number;
  submissionRate: number;
}

export interface OverviewMetrics {
  revenue: {
    current: number;
    previous: number;
    change: number;
  };
  subscribers: {
    current: number;
    previous: number;
    change: number;
  };
  openRate: {
    current: number;
    previous: number;
    change: number;
  };
  clickRate: {
    current: number;
    previous: number;
    change: number;
  };
  conversionRate: {
    current: number;
    previous: number;
    change: number;
  };
  formSubmissions: {
    current: number;
    previous: number;
    change: number;
  };
  channels: {
    name: string;
    value: number;
    color: string;
  }[];
}

export interface Campaign {
  id: number;
  name: string;
  sent: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue: number;
}

export interface Flow {
  id: number;
  name: string;
  recipients: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenue: number;
}

export interface Form {
  id: number;
  name: string;
  views: number;
  submissions: number;
  submissionRate: number;
  conversions: number;
}

export interface Segment {
  id: number;
  name: string;
  count: number;
  conversionRate: number;
  revenue: number;
}

export interface ApiHealthStatus {
  status: string;
  timestamp: string;
}
