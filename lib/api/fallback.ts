/**
 * Fallback data for the API client
 */

import { Campaign, Flow, Form, OverviewMetrics, Segment } from './types';

/**
 * Get fallback data for an endpoint when the API fails
 */
export function getFallbackData(endpoint: string): any {
  if (endpoint.includes('/campaigns')) {
    return [] as Campaign[];
  }
  
  if (endpoint.includes('/flows')) {
    return [] as Flow[];
  }
  
  if (endpoint.includes('/forms')) {
    return [] as Form[];
  }
  
  if (endpoint.includes('/segments')) {
    return [] as Segment[];
  }
  
  if (endpoint.includes('/overview')) {
    return {
      revenue: {
        current: 125000,
        previous: 120000,
        change: 4.2
      },
      subscribers: {
        current: 45000,
        previous: 42500,
        change: 5.9
      },
      openRate: {
        current: 35.2,
        previous: 33.8,
        change: 4.1
      },
      clickRate: {
        current: 15.8,
        previous: 14.5,
        change: 9.0
      },
      conversionRate: {
        current: 5.2,
        previous: 4.8,
        change: 8.3
      },
      formSubmissions: {
        current: 4250,
        previous: 3980,
        change: 6.8
      },
      channels: [
        {
          name: 'Campaigns',
          value: 42,
          color: 'rgb(59, 130, 246)'
        },
        {
          name: 'Flows',
          value: 35,
          color: 'rgb(139, 92, 246)'
        },
        {
          name: 'Forms',
          value: 15,
          color: 'rgb(245, 158, 11)'
        },
        {
          name: 'Other',
          value: 8,
          color: 'rgb(16, 185, 129)'
        }
      ]
    } as OverviewMetrics;
  }
  
  // Default fallback is an empty object
  return {};
}
