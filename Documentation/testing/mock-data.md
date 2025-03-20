# Mock Data Structure Guide

To effectively test without live API calls, you need comprehensive mock data that covers various scenarios.

## Data Structure Overview

It's critical that your mock data structure matches exactly what your components expect. Examine your components to understand the expected data structure before creating mock data.

## Mock Data Examples

```typescript
// mockData.ts
export default {
  // Overview data with the structure expected by OverviewSection component
  overview: {
    revenue: {
      current: 12500,
      change: 15
    },
    subscribers: {
      current: 1250,
      change: 8
    },
    conversionRate: {
      current: 3.2,
      change: -1.5
    },
    formSubmissions: {
      current: 450,
      change: 12
    }
  },
  
  // Campaigns with the structure expected by CampaignsTable component
  campaigns: [
    {
      id: 'campaign1',
      name: 'Black Friday Sale',
      sent: 5000,
      openRate: 24.0,
      clickRate: 7.0,
      conversionRate: 3.2,
      revenue: 5600
    },
    {
      id: 'campaign2',
      name: 'Welcome Series',
      sent: 1200,
      openRate: 32.5,
      clickRate: 12.8,
      conversionRate: 5.5,
      revenue: 2800
    }
  ],
  
  // Flows data with the structure expected by FlowsTable component
  flows: [
    {
      id: 'flow1',
      name: 'Welcome Flow',
      recipients: 2500,
      openRate: 35.2,
      clickRate: 18.5,
      conversionRate: 12.8,
      revenue: 4800
    },
    {
      id: 'flow2',
      name: 'Abandoned Cart',
      recipients: 1800,
      openRate: 42.0,
      clickRate: 24.5,
      conversionRate: 11.7,
      revenue: 3600
    }
  ],
  
  // Forms data with the structure expected by FormsTable component
  forms: [
    {
      id: 'form1',
      name: 'Newsletter Signup',
      views: 5600,
      submissions: 980,
      submissionRate: 17.5,
      conversions: 245
    },
    {
      id: 'form2',
      name: 'Exit Intent Popup',
      views: 3200,
      submissions: 420,
      submissionRate: 13.1,
      conversions: 105
    }
  ],
  
  // Segments data with the structure expected by SegmentsTable component
  segments: [
    {
      id: 'segment1',
      name: 'Active Customers',
      count: 3500,
      conversionRate: 8.5,
      revenue: 28000
    },
    {
      id: 'segment2',
      name: 'Lapsed Customers',
      count: 1200,
      conversionRate: 2.1,
      revenue: 4500
    }
  ]
}
```

## Chart Data Structure

### Time Series Data
```typescript
// Revenue over time chart data
export const timeSeriesData = [
  { date: '2023-01', campaigns: 4200, flows: 3100, forms: 1800, other: 950 },
  { date: '2023-02', campaigns: 4500, flows: 3300, forms: 1900, other: 1000 },
  { date: '2023-03', campaigns: 4800, flows: 3500, forms: 2000, other: 1050 }
];
```

### Distribution Data
```typescript
// Channel distribution chart data
export const distributionData = [
  { name: 'Campaigns', value: 42 },
  { name: 'Flows', value: 35 },
  { name: 'Forms', value: 15 },
  { name: 'Other', value: 8 }
];
```

### Top Performers Data
```typescript
export const topPerformersData = {
  segments: [
    { name: 'VIP Customers', conversionRate: 42, count: 5842, revenue: 28450 },
    { name: 'Recent Purchasers', conversionRate: 35, count: 12480, revenue: 42680 }
  ],
  flows: [
    { name: 'Welcome Series', recipients: 8450, conversionRate: 32 },
    { name: 'Abandoned Cart', recipients: 6280, conversionRate: 28 }
  ],
  forms: [
    { name: 'Newsletter Signup', views: 12480, submissionRate: 38 },
    { name: 'Exit Intent Popup', views: 28450, submissionRate: 24 }
  ]
};
```

## Error Scenarios

```typescript
export const errorResponses = {
  rateLimitExceeded: {
    status: 429,
    message: 'Rate limit exceeded. Try again later.'
  },
  unauthorized: {
    status: 401,
    message: 'Invalid API key'
  },
  serverError: {
    status: 500,
    message: 'Internal server error'
  }
};
```

## Edge Cases

```typescript
export const edgeCases = {
  emptyData: {
    campaigns: [],
    flows: [],
    forms: [],
    segments: [],
    charts: {
      revenueOverTime: [],
      channelDistribution: [],
      topSegments: [],
      topFlows: [],
      topForms: []
    }
  },
  singleDataPoint: {
    revenueOverTime: [
      { date: '2023-01', campaigns: 4200, flows: 3100, forms: 1800, other: 950 }
    ]
  },
  extremeValues: {
    revenue: 999999999,
    conversionRate: 100,
    count: 0
  }
};
```

## Best Practices

1. **Match Component Requirements**
   - Study component PropTypes/interfaces
   - Include all required fields
   - Use correct data types

2. **Cover Edge Cases**
   - Empty arrays/objects
   - Null/undefined values
   - Extreme values
   - Single data points

3. **Include Error States**
   - API errors
   - Validation errors
   - Network errors
   - Timeout scenarios

4. **Maintain Consistency**
   - Use consistent naming
   - Follow data structure patterns
   - Keep date formats consistent

5. **Document Assumptions**
   - Note data relationships
   - Document valid ranges
   - Explain special cases
