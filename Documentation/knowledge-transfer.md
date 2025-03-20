# Klaviyo Analytics Dashboard - Knowledge Transfer Document

[Previous content remains unchanged until the Common Issues section...]

### Common Issues

- **"Missing required environment variable"**: Check your `.env` file
- **Klaviyo API errors**: Verify API key and check rate limits
- **Slow responses**: Check cache configuration and Klaviyo API status
- **429 Rate Limit Errors**: The backend implements rate limiting to avoid overloading the Klaviyo API. If you're seeing 429 errors, check the rate limiting configuration in `backend/src/middleware/rateLimitMiddleware.ts`. You may need to adjust the limits based on your usage patterns.
- **Syntax Errors in API Code**: If you encounter unexpected syntax errors in the API code, check for missing commas in function parameters and object definitions, especially in the rate limiting middleware and API query hooks.
- **Chart Data Not Updating**: If chart data isn't updating with date range changes:
  - Verify the correct endpoint paths are being used (e.g., '/charts/revenue' instead of '/revenue')
  - Check if MSW is enabled and potentially intercepting requests
  - Ensure date range parameters are being passed correctly

### Mock Server vs MSW

The project includes two methods for mocking API requests:

1. **Mock Server** (`backend/src/tests/mockServer.ts`):
   - Full Express server implementation
   - Handles all chart endpoints under `/api/charts/` prefix
   - Implements proper date range filtering
   - Runs on a separate port (default: 3002)

2. **Mock Service Worker** (MSW):
   - Browser-based request interception
   - Useful for component testing
   - Can be disabled by removing `NEXT_PUBLIC_API_MOCKING=enabled`
   - Should be disabled when using the mock server

When running the application with the mock server:
```bash
# Use run-with-mock-server.sh (MSW disabled)
./run-with-mock-server.sh

# Or manually with environment variables
PORT=3000 NEXT_PUBLIC_API_URL=http://localhost:3002/api npm run dev
```

When running with MSW:
```bash
# Enable MSW
NEXT_PUBLIC_API_MOCKING=enabled npm run dev
```

### Chart Data and Endpoints

The backend provides dedicated endpoints for chart data:

1. **Chart Endpoints**:
   ```
   GET /api/charts/revenue         // Time series data for revenue charts
   GET /api/charts/distribution    // Channel distribution data for pie charts
   GET /api/charts/top-segments    // Top performing segments data
   GET /api/charts/top-flows       // Top performing flows data
   GET /api/charts/top-forms       // Top performing forms data
   ```

2. **Data Structures**:
   ```typescript
   // Revenue time series data
   interface RevenueDataPoint {
     date: string;
     campaigns: number;
     flows: number;
     forms: number;
     other: number;
   }

   // Channel distribution data
   interface ChannelDataPoint {
     name: string;    // e.g., 'Campaigns', 'Flows'
     value: number;   // Percentage or absolute value
   }
   ```

3. **Date Range Filtering**:
   - All chart endpoints support the `dateRange` query parameter
   - Supported formats: 'last-7-days', 'last-30-days', 'last-90-days', etc.
   - Custom date ranges: 'YYYY-MM-DD,YYYY-MM-DD'
   - Server-side filtering ensures consistent data across components

4. **Implementation Notes**:
   - Chart data is cached separately from other API responses
   - Date range changes trigger cache invalidation
   - Mock server provides realistic test data for all chart types
   - MSW handlers mirror the mock server's behavior for testing

[Rest of the content remains unchanged...]
