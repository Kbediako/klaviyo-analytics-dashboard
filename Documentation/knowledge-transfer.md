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
  - Default: 60 requests per minute
  - Strict: 20 requests per minute
  - Very Strict: 5 requests per minute
- **Headers**: Returns standard rate limit headers

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
- **Mocking**: External dependencies are mocked
- **Coverage**: Aim for >80% test coverage

### Running Tests

```bash
cd backend
npm test
```

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

### Debugging

- Check server logs for errors
- Use the `/api/health` endpoint to verify the API is running
- Examine the response from Klaviyo API for error details

## Future Enhancements

- Implement pagination for large data sets
- Add more granular caching strategies
- Implement background data syncing
- Add export functionality for reports
