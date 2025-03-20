# Chart Data & Endpoints

The backend provides dedicated endpoints for chart data with specific data structures and filtering capabilities.

## Chart Endpoints

```
GET /api/charts/revenue         // Time series data for revenue charts
GET /api/charts/distribution    // Channel distribution data for pie charts
GET /api/charts/top-segments    // Top performing segments data
GET /api/charts/top-flows       // Top performing flows data
GET /api/charts/top-forms       // Top performing forms data
```

## Data Structures

### Revenue Time Series Data

```typescript
interface RevenueDataPoint {
  date: string;
  campaigns: number;
  flows: number;
  forms: number;
  other: number;
}
```

### Channel Distribution Data

```typescript
interface ChannelDataPoint {
  name: string;    // e.g., 'Campaigns', 'Flows'
  value: number;   // Percentage or absolute value
}
```

## Date Range Filtering

All chart endpoints support the `dateRange` query parameter:

- **Predefined Ranges**:
  - 'last-7-days'
  - 'last-30-days'
  - 'last-90-days'

- **Custom Date Ranges**:
  - Format: 'YYYY-MM-DD,YYYY-MM-DD'
  - Example: '2023-01-01,2023-01-31'

Server-side filtering ensures consistent data across components.

## Implementation Notes

### Caching
- Chart data is cached separately from other API responses
- Date range changes trigger cache invalidation
- Cache keys include date range parameters
- Configurable TTL based on data type

### Data Processing
- Server aggregates data points for time series
- Calculates percentages for distribution charts
- Sorts and limits top performer lists
- Handles timezone conversions

### Error Handling
- Returns appropriate error codes
- Provides detailed error messages
- Handles missing data gracefully
- Validates date ranges

### Performance
- Optimizes data aggregation
- Uses efficient date filtering
- Implements response compression
- Supports partial responses

### Testing
- Mock server provides realistic test data
- MSW handlers mirror server behavior
- Includes edge case scenarios
- Tests all date range formats
