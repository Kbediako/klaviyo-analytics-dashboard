# Knowledge Transfer: Mock Data vs Live Klaviyo API Integration

## Overview

This document provides essential information for developers working on the Klaviyo Analytics Dashboard, focusing on the transition between mock data and the live Klaviyo API.

## Mock Data Implementation

Our dashboard has a comprehensive mock data system that allows development and testing without requiring access to the Klaviyo API. Key components include:

1. **Mock Data Structure**
   - Located in `/app/public/mock-data.js` (ES module with export default)
   - Contains realistic sample data for all API endpoints
   - Structured to match the live API response format

2. **Mock Server**
   - Located in `/backend/src/tests/mockServer.ts`
   - Implements all API endpoints using the mock data
   - Supports date range filtering and query parameters
   - Simulates network delays and error scenarios

3. **Running with Mock Server**
   - Use `./run-with-mock-server.sh` to start both the frontend and mock server
   - Mock server runs on port 3002 by default
   - Frontend connects to the mock server through environment variable: `NEXT_PUBLIC_API_URL=http://localhost:3002/api`

## Live Klaviyo API Integration

To transition to the live Klaviyo API:

1. **Environment Setup**
   - Create a `.env` file in the `/backend` directory with your Klaviyo API credentials:
     ```
     KLAVIYO_API_KEY=pk_2d109a05c4b7b9bb3b7259ba172e385f2d
     PORT=3001
     DEBUG=true
     ```
   - The API key above is pre-configured for this project
   - Ensure you have sufficient permissions in your Klaviyo account

2. **Important Metric IDs**
   - The dashboard uses specific Klaviyo metric IDs for accurate data:
     - **Shopify Placed Order Metric ID:** `WRfUa5` (used for revenue calculations)
   - Klaviyo requires specific metric IDs for data retrieval - you cannot query by metric name
   - These IDs are specific to each Klaviyo account and must be configured accordingly
   - The system will attempt to find appropriate metric IDs by scanning metric names in the `/api/metrics` response
   - If automatic discovery fails, you'll need to manually configure these IDs in the service implementations

3. **API Client Configuration**
   - The API client at `/backend/src/services/klaviyoApiClient.ts` handles all Klaviyo API requests
   - Uses proper authentication via API key
   - Implements rate limiting protection and error handling
   - Includes comprehensive logging for debugging

4. **Running with Live API**
   - Use `./run-with-live-api.sh` to start both the frontend and backend with live API
   - Backend runs on port 3001 and connects to Klaviyo's API
   - Frontend connects to the backend through environment variable: `NEXT_PUBLIC_API_URL=http://localhost:3001/api`
   - Check backend logs for API request/response details

## Transitioning Between Mock and Live Data

### When to Use Mock Data
- During initial development of new features
- For CI/CD pipelines and automated testing
- When demonstrating the app without a Klaviyo account
- For consistent, reproducible testing scenarios

### When to Use Live Data
- For final integration testing
- To verify API contract adherence
- For performance testing with real-world data volumes
- Before deployment to production

### Testing Strategy
1. Begin with mock data for rapid development iterations
2. Progress to live API testing for final validation
3. Use both approaches for comprehensive testing

## Common Issues and Troubleshooting

### Mock Server Issues
- **404 for `/mock-data.js`**: Ensure the path is correct and file exists
- **Data format mismatches**: Verify mock data structure matches frontend expectations
- **Date range filtering issues**: Check date formatting in requests and responses

### Live API Issues
- **Authentication errors**: Verify your API key and permissions
- **Rate limiting**: Implement proper backoff strategies (configured in klaviyoApiClient.ts)
- **Data differences**: Document and adapt to any differences between mock and real data
- **405 Method Not Allowed errors**: Ensure endpoint paths have 'api/' prefix and proper structure
- **Incorrect data transformations**: Check that response mapping matches frontend expectations
- **Missing data properties**: Add validation and fallbacks for missing API response properties

For detailed troubleshooting of integration issues, refer to [Integration Issues Guide](/Documentation/troubleshooting/integration-issues.md)

## Best Practices

1. **Keep mock data updated** as the Klaviyo API evolves
2. **Document any discrepancies** between mock and live data
3. **Test both scenarios** before deploying new features
4. **Use feature flags** to switch between data sources when needed
5. **Add validation** for required properties in UI components
6. **Implement robust fallbacks** when API data is missing or incorrect
7. **Use deterministic approaches** for consistent display of metrics
8. **Follow Klaviyo API structure** exactly, including proper URL prefixes and headers
9. **Test different date ranges** to ensure proper data retrieval
10. **Enable detailed logging** during development and debugging

## Additional Resources

- [Klaviyo API Documentation](https://developers.klaviyo.com/en/reference)
- [Mock Data Structure Guide](/Documentation/testing/mock-data.md)
- [Live API Testing Guide](/Documentation/roadmap/live-api-testing.md)
- [Live API Implementation Guide](/Documentation/implementation/live-api-implementation.md)
- [Integration Issues Guide](/Documentation/troubleshooting/integration-issues.md)
- [Klaviyo API Revision](https://developers.klaviyo.com/en/docs/api_versioning_and_deprecation_policy)