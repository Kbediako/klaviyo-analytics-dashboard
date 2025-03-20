# Klaviyo Analytics Dashboard - Knowledge Transfer Document

This document provides detailed information about the backend implementation of the Klaviyo Analytics Dashboard. It's intended for developers who will be maintaining or extending the codebase.

## Architecture Overview

The backend follows a layered architecture pattern:

```
┌─────────────┐
│   Routes    │  API endpoints and request handling
├─────────────┤
│ Controllers │  Request validation and response formatting
├─────────────┤
│  Services   │  Business logic and data processing
├─────────────┤
│ API Client  │  Communication with Klaviyo API
└─────────────┘
```

### Key Components

1. **Routes**: Define API endpoints and map them to controller methods
2. **Controllers**: Handle HTTP requests, validate inputs, and format responses
3. **Services**: Implement business logic, data transformation, and API calls
4. **API Client**: Manages communication with the Klaviyo API
5. **Utilities**: Provide helper functions for date handling, caching, etc.
6. **Middleware**: Implement cross-cutting concerns like caching, rate limiting, etc.

## API Endpoints

All endpoints follow a consistent pattern and support date range filtering via the `dateRange` query parameter.

### Overview Endpoint

- **Path**: `/api/overview`
- **Method**: GET
- **Purpose**: Provides high-level marketing metrics with period comparison
- **Implementation**: `overviewController.ts` and `overviewService.ts`
- **Key Logic**: Aggregates metrics from multiple sources and calculates period-over-period changes

### Campaigns Endpoint

- **Path**: `/api/campaigns`
- **Method**: GET
- **Purpose**: Returns campaign performance data
- **Implementation**: `campaignsController.ts` and `campaignsService.ts`
- **Key Logic**: Fetches campaign data and enriches it with performance metrics

### Flows Endpoint

- **Path**: `/api/flows`
- **Method**: GET
- **Purpose**: Returns flow performance metrics
- **Implementation**: `flowsController.ts` and `flowsService.ts`
- **Key Logic**: Combines flow definitions with message metrics

### Forms Endpoint

- **Path**: `/api/forms`
- **Method**: GET
- **Purpose**: Returns form submission and conversion data
- **Implementation**: `formsController.ts` and `formsService.ts`
- **Key Logic**: Calculates submission rates and conversion metrics

### Segments Endpoint

- **Path**: `/api/segments`
- **Method**: GET
- **Purpose**: Returns segment membership and performance data
- **Implementation**: `segmentsController.ts` and `segmentsService.ts`
- **Key Logic**: Combines segment definitions with performance metrics

## Performance Optimizations

### Caching Strategy

The backend implements a caching strategy to improve performance and reduce load on the Klaviyo API:

- **Implementation**: `cacheMiddleware.ts` and `cacheUtils.ts`
- **Cache Keys**: Based on request URL and query parameters
- **TTL Configuration**: Different TTLs for different endpoints based on data volatility
- **Cache Invalidation**: Automatic expiration based on TTL

### Rate Limiting

To avoid hitting Klaviyo API rate limits, the backend implements rate limiting:

- **Implementation**: `rateLimitMiddleware.ts`
- **Limits**: 
  - Default: 120 requests per minute (increased from 60)
  - Strict: 40 requests per minute (increased from 20)
  - Very Strict: 10 requests per minute (increased from 5)
- **Headers**: Returns standard rate limit headers

> **Note**: The rate limits were increased to accommodate the frontend's concurrent API requests. The original limits were too restrictive and caused "429 too many requests" errors when multiple components loaded simultaneously.

### Retry Mechanism

The Klaviyo API client includes a retry mechanism for transient errors:

- **Implementation**: `klaviyoApiClient.ts`
- **Strategy**: Exponential backoff with configurable max retries
- **Error Handling**: Different handling for rate limiting vs. other errors

## Environment Configuration

The application requires certain environment variables to be set:

- **KLAVIYO_API_KEY**: Your Klaviyo API key
- **PORT**: The port to run the server on (default: 3001)

Environment validation is performed on startup to ensure all required variables are set:

- **Implementation**: `envValidator.ts`
- **Behavior**: Exits with error if validation fails

## Testing Strategy

The backend follows a test-first development approach:

- **Unit Tests**: For services, controllers, and utilities
- **Integration Tests**: For API endpoints with various parameters
- **End-to-End Tests**: For frontend-backend integration
- **Mocking**: External dependencies are mocked
- **Coverage**: Aim for >80% test coverage

### Running Tests

```bash
cd backend
npm test
```

### End-to-End Testing

The project includes comprehensive end-to-end tests that verify the integration between frontend and backend:

1. **Test Files**:
   - `public/e2e-test.js`: Contains the test cases
   - `public/e2e-test-runner.html`: Interactive test runner UI
   - `public/dashboard.test.js`: Contains mock API responses
   - `public/test-runner.html`: Basic test runner for unit tests

2. **Test Features**:
   - Backend connectivity verification
   - Date range selection functionality
   - Dashboard component rendering
   - Tab navigation
   - Error handling
   - API integration

3. **Running E2E Tests**:
   ```bash
   # Start the backend
   cd backend
   npm run dev
   
   # In a separate terminal, start the frontend
   cd ..
   npm run dev
   
   # Open the test runner in your browser
   open http://localhost:3000/e2e-test-runner.html
   ```

4. **Test Modes**:
   - **Mock Mode**: Tests run with mock data (no backend required)
   - **E2E Mode**: Tests run against the actual backend API

### Handling Jest Open Handles

When running backend tests, you might encounter the following warning:

```
Force exiting Jest: Have you considered using `--detectOpenHandles` to detect async operations that kept running after all tests finished?
```

This warning indicates that some asynchronous operations (like timers, network requests, or database connections) are not being properly closed after the tests finish. To address this:

1. **Identify open handles**: Run tests with the `--detectOpenHandles` flag to identify which operations are not being closed:

   ```bash
   npm run test:detect-handles
   ```

2. **Common causes and solutions**:
   - **Timers**: Call `.unref()` on timers or clear them with `clearTimeout()`/`clearInterval()`
   - **Network requests**: Ensure all requests are completed or aborted in test teardown
   - **API clients**: Close connections in `afterEach()` or `afterAll()` hooks
   - **Mock servers**: Properly close mock servers in test teardown

3. **In our codebase**: The main source of open handles was in the `klaviyoApiClient.ts` file, where network requests might not be properly closed in tests. We've addressed this by:
   - Creating a client with no retries in the test files to avoid hanging connections
   - Properly mocking all external API calls in tests
   - Adding proper error handling in the API client

4. **Jest configuration**: Our current configuration in `jest.config.js` includes:
   ```javascript
   module.exports = {
     // other config...
     forceExit: true,
     clearMocks: true,
     resetMocks: true,
     restoreMocks: true,
     // ...
   };
   ```

5. **NPM Scripts**: We've added dedicated test scripts in package.json:
   ```json
   "scripts": {
     "test": "jest",
     "test:watch": "jest --watch",
     "test:detect-handles": "jest --detectOpenHandles",
     "test:debug": "jest --runInBand --detectOpenHandles"
   }
   ```
   
   Use `npm run test:detect-handles` when debugging open handle issues, and `npm run test:debug` for more detailed debugging with sequential test execution.

## Common Patterns and Conventions

### Error Handling

- Controllers catch and format errors
- Services return empty arrays or default values on error
- API client includes retry logic for transient errors

### Date Handling

- All endpoints support flexible date range formats
- Date ranges are parsed and validated by `dateUtils.ts`
- Default date range is last 30 days

### Response Format

- Consistent JSON structure across all endpoints
- Error responses include error message and status code
- Successful responses return arrays or objects depending on endpoint

## Extending the Backend

### Adding a New Endpoint

1. Create a new service file in `src/services/`
2. Create a new controller file in `src/controllers/`
3. Create a new route file in `src/routes/`
4. Register the route in `src/index.ts`
5. Add tests for the service and controller
6. Update API documentation

### Modifying an Existing Endpoint

1. Identify the relevant service and controller
2. Make changes to the service logic
3. Update tests to reflect changes
4. Update API documentation if the response format changes

### Adding New Klaviyo API Functionality

1. Add new methods to `klaviyoApiClient.ts`
2. Add tests for the new methods
3. Use the new methods in services

## Deployment Considerations

### Environment Variables

- Ensure all required environment variables are set in production
- Use secure storage for API keys

### Performance Monitoring

- Monitor API response times
- Watch for cache hit/miss rates
- Monitor Klaviyo API rate limit usage

### Security

- Keep dependencies up to date
- Use HTTPS in production
- Consider adding authentication for the API

## Troubleshooting

### Common Issues

- **"Missing required environment variable"**: Check your `.env` file
- **Klaviyo API errors**: Verify API key and check rate limits
- **Slow responses**: Check cache configuration and Klaviyo API status
- **429 Rate Limit Errors**: The backend implements rate limiting to avoid overloading the Klaviyo API. If you're seeing 429 errors, check the rate limiting configuration in `backend/src/middleware/rateLimitMiddleware.ts`. You may need to adjust the limits based on your usage patterns.
- **Syntax Errors in API Code**: If you encounter unexpected syntax errors in the API code, check for missing commas in function parameters and object definitions, especially in the rate limiting middleware and API query hooks.

### Debugging

- Check server logs for errors
- Use the `/api/health` endpoint to verify the API is running
- Examine the response from Klaviyo API for error details

## Frontend Implementation

### UI Architecture

The frontend follows a component-based architecture using React and Next.js:

- **Dashboard Layout**: The main dashboard component that orchestrates the overall UI
- **Metric Cards**: Reusable components for displaying KPIs with trends
- **Data Tables**: Components for displaying tabular data (campaigns, flows, forms, segments)
- **Charts and Visualizations**: Components for data visualization (revenue charts, distribution charts)
- **Navigation**: Tab-based navigation for switching between different views

### Key Frontend Components

1. **Dashboard Component**: The main container component that:
   - Manages the overall layout and state
   - Keeps metric cards visible across all tabs
   - Handles tab navigation
   - Provides consistent header with search and filters

2. **Overview Section**: Always visible section that:
   - Displays key metrics (revenue, subscribers, conversion rate, form submissions)
   - Shows period-over-period changes
   - Uses conditional styling for positive/negative trends

3. **Tab Content**: Content specific to each tab:
   - **Overview**: Charts and top performers for each category
   - **Campaigns**: Detailed campaign performance metrics
   - **Flows**: Automated flow performance data
   - **Forms**: Form submission and conversion metrics
   - **Segments**: Segment membership and performance data

### Client-Side Caching

The frontend implements client-side caching to reduce API requests and improve performance:

- **Implementation**: `lib/api-client.ts` includes a caching mechanism
- **Cache Keys**: Based on endpoint path and query parameters
- **TTL**: 5-minute default cache lifetime
- **Cache Clearing**: 
  - Automatic clearing when date range changes
  - Manual clearing via "Refresh Data" button
  - Automatic expiration based on TTL

### Frontend-Backend Integration

#### Connection Architecture

- **Frontend API Client**: The frontend uses a centralized API client (`lib/api-client.ts`) to communicate with the backend
- **Backend Endpoints**: The backend exposes RESTful endpoints at `http://localhost:3001/api/*`
- **Data Flow**: Frontend components use custom hooks that fetch data from the backend API
- **Lazy Loading**: Components only fetch data when they are rendered, reducing concurrent API requests

#### Common Integration Issues

- **Connection Failures**: "Failed to fetch" errors occur when the frontend cannot connect to the backend
- **CORS Issues**: Cross-Origin Resource Sharing is configured in the backend but may need adjustments in some environments
- **Environment Variables**: The frontend uses `NEXT_PUBLIC_API_URL` to configure the API base URL (defaults to `http://localhost:3001/api`)

#### Running the Full Application

To properly run the full application:

1. Start the backend server first:
   ```bash
   cd backend
   npm run dev
   ```

2. In a separate terminal, start the frontend:
   ```bash
   npm run dev
   ```

3. Access the application at `http://localhost:3000`

#### Troubleshooting Integration Issues

- **Backend Not Running**: Ensure the backend server is running on port 3001
- **API Connectivity**: Verify the backend is accessible by visiting `http://localhost:3001/api/health`
- **API Key**: Check that the Klaviyo API key is properly set in the backend's `.env` file
- **Network Issues**: Check for firewall or network configuration issues that might block local connections

## Future Enhancements

- Implement pagination for large data sets
- Add more granular caching strategies
- Implement background data syncing
- Add export functionality for reports
- Add fallback UI state with sample data when backend is unavailable
- Improve error handling in the frontend for API connection failures

## Common Issues and Solutions

### React Hydration Errors

When working with Next.js applications that use server-side rendering (SSR), you may encounter hydration errors. These occur when the HTML rendered on the server doesn't match what the client expects to render. Common causes include:

1. **Theme Provider Issues**: 
   - **Problem**: Using theme providers (like next-themes) incorrectly can cause hydration errors, especially when the provider is placed in individual pages instead of the root layout.
   - **Solution**: For simpler applications, consider using static theme classes directly in the layout.tsx file instead of using a dynamic theme provider. For example:
     ```tsx
     <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
     ```

2. **Date/Time Formatting**: 
   - **Problem**: Using `Date.now()` or locale-specific date formatting can cause hydration errors because the server and client may render different values.
   - **Solution**: Use stable date values or ensure date formatting is consistent between server and client.

3. **Random Values**: 
   - **Problem**: Using `Math.random()` or other non-deterministic functions can cause hydration errors.
   - **Solution**: Avoid using random values in components that are server-rendered, or use a stable seed.

4. **Browser-Specific Code**: 
   - **Problem**: Using `typeof window !== 'undefined'` checks can lead to different rendering between server and client.
   - **Solution**: Use the `'use client'` directive for components that need browser-specific functionality, or use dynamic imports with Next.js's `dynamic` function.

5. **Third-Party Libraries and Extensions**:
   - **Problem**: Some third-party libraries or browser extensions may add attributes to elements (like `data-sharkid`) that cause hydration mismatches.
   - **Solution**: If you see attributes like `data-sharkid` in hydration errors, check if you have any browser extensions that might be modifying the DOM. For libraries, consider using them only in client components or wrapping them with dynamic imports.

When you encounter a hydration error, check the browser console for specific details about what's causing the mismatch. The error message often includes information about the specific elements that don't match.
