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
     KLAVIYO_API_KEY=your_api_key_here
     PORT=3001
     ```
   - Ensure you have sufficient permissions in your Klaviyo account

2. **API Client Configuration**
   - The API client at `/backend/src/services/klaviyoApiClient.ts` handles all Klaviyo API requests
   - Uses proper authentication via API key
   - Implements rate limiting protection and error handling

3. **Running with Live API**
   - Use `./run-with-live-api.sh` to start both the frontend and backend with live API
   - Backend runs on port 3001 and connects to Klaviyo's API
   - Frontend connects to the backend through environment variable: `NEXT_PUBLIC_API_URL=http://localhost:3001/api`

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
- **Rate limiting**: Implement proper backoff strategies
- **Data differences**: Document and adapt to any differences between mock and real data

## Best Practices

1. **Keep mock data updated** as the Klaviyo API evolves
2. **Document any discrepancies** between mock and live data
3. **Test both scenarios** before deploying new features
4. **Use feature flags** to switch between data sources when needed

## Additional Resources

- [Klaviyo API Documentation](https://developers.klaviyo.com/en/reference)
- [Mock Data Structure Guide](/Documentation/testing/mock-data.md)
- [Live API Testing Guide](/Documentation/roadmap/live-api-testing.md)