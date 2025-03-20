# Mock Data Structure Guide

## Overview

This document outlines the structure of mock data used for testing the Klaviyo Analytics Dashboard. The mock data is designed to closely mirror the structure and behavior of the Klaviyo API while allowing for controlled testing scenarios.

## Date Range Test Data

### Standard Date Ranges
Mock data is provided for the following standard date ranges:
- `last-7-days`: Recent data with higher granularity
- `last-30-days` (default): Standard monthly view
- `last-90-days`: Quarterly view with aggregated metrics

### Edge Cases
The mock data includes the following date range edge cases:
1. Year boundary crossing (Dec 2023 - Jan 2024)
2. Single day selection (2024-01-01)
3. Future dates (should be rejected)
4. Invalid date formats (should be handled gracefully)

### Data Structure

Each date range mock response includes:

```javascript
{
  overview: {
    revenue: {
      current: number,
      previous: number,
      change: number
    },
    subscribers: {
      current: number,
      previous: number,
      change: number
    },
    openRate: {
      current: number,
      previous: number,
      change: number
    },
    conversionRate: {
      current: number,
      previous: number,
      change: number
    }
  },
  campaigns: [
    {
      id: string,
      name: string,
      recipients: number,
      openRate: number,
      clickRate: number,
      conversionRate: number,
      revenue: number
    }
  ]
}
```

### Mock Data Files
- `dashboard.test.js`: Base mock data for default scenarios
- `mock-date-ranges.js`: Extended mock data for date range testing

## Usage in Tests

### Loading Mock Data
```javascript
// Load mock data in test setup
const mockDateRangesScript = document.createElement('script');
mockDateRangesScript.src = '/mock-date-ranges.js';
document.head.appendChild(mockDateRangesScript);
```

### Accessing Mock Data
```javascript
// Get mock data for a specific date range
const mockData = window.mockDateRangeResponses[dateRange];
```

### Date Range Formats

1. Standard Ranges:
   - `last-7-days`
   - `last-30-days`
   - `last-90-days`

2. Custom Range Format:
   - Format: `YYYY-MM-DD_to_YYYY-MM-DD`
   - Example: `2023-12-25_to_2024-01-05`

3. Single Day Format:
   - Format: `YYYY-MM-DD_to_YYYY-MM-DD` (same date)
   - Example: `2024-01-01_to_2024-01-01`

## Maintaining Mock Data

When updating mock data:
1. Ensure data is realistic and consistent across date ranges
2. Maintain proper relationships between metrics
3. Include both successful and error scenarios
4. Keep data aligned with Klaviyo API structure
5. Document any new mock data patterns

## Best Practices

1. Data Consistency:
   - Ensure metrics make logical sense
   - Maintain consistent decimal places
   - Use realistic value ranges

2. Error Scenarios:
   - Include invalid date formats
   - Test future date handling
   - Verify error message consistency

3. Performance Considerations:
   - Keep mock data files lightweight
   - Use appropriate data types
   - Consider pagination for large datasets

4. Documentation:
   - Document any assumptions
   - Explain mock data patterns
   - Keep examples up to date
