# Testing Process Documentation

## Testing Workflows

### Mock Testing Workflow
1. Start mock environment:
   ```bash
   npm run dev:mock
   ```
2. Open test runner:
   ```
   http://localhost:3000/comprehensive-test-runner.html
   ```
3. Run tests in Mock API Mode
4. Document results in the test results file

### Live API Testing Workflow
1. Start full environment:
   ```bash
   npm run dev:all
   ```
2. Open test runner:
   ```
   http://localhost:3000/comprehensive-test-runner.html
   ```
3. Switch to Live API Mode
4. Run tests
5. Document results in the test results file

## Common Issues and Solutions

### 1. Mock API Server Connection Issues

**Issue**: Frontend fails to connect to the mock API server, showing "Failed to fetch" errors on the metric tiles.

**Solution**: 
- Ensure the mock server is running on port 3002 (`npm run mock-server` in the backend directory)
- Check that the frontend is configured to use the mock API URL (`NEXT_PUBLIC_API_URL=http://localhost:3002/api`)
- Verify there are no CORS issues by checking the browser console
- If you've stopped the mock server and want to view the dashboard again, restart it with `npm run dev:mock`

### 2. Missing or Incorrect Mock Data

**Issue**: Components display empty or incorrect data.

**Solution**:
- Check the mock data structure in `mockData.ts` to ensure it matches what the components expect
- Verify that the mock server endpoints are returning the correct data structure
- Use browser developer tools to inspect the API responses

### 3. Date Range Selection Issues

**Issue**: Date range selection doesn't update the displayed data.

**Solution**:
- Since we're using mock data, the date range selection only updates the displayed date range in the UI, not the actual data
- In a real implementation with live API, the date range would be passed to the API endpoints

### 4. Chart Rendering Issues

**Issue**: Charts don't render correctly or show no data.

**Solution**:
- Ensure the mock data includes the correct data structure for the charts
- Check that the chart components are properly configured to use the mock data
- Verify that the chart libraries (e.g., Recharts) are properly installed and imported

## Testing Environment Setup

### Mock Environment
1. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm run mock-server
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   NEXT_PUBLIC_API_URL=http://localhost:3002/api NEXT_PUBLIC_API_MOCKING=disabled npm run dev
   ```

### Live Environment
1. **Backend Setup**
   ```bash
   cd backend
   npm install
   KLAVIYO_API_KEY=your_api_key npm run dev
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   NEXT_PUBLIC_API_URL=http://localhost:3001/api npm run dev
   ```

## Test Types

### End-to-End Tests
- Use the comprehensive test runner
- Test all major user flows
- Verify data display and interactions
- Check error handling

### Integration Tests
- Test API endpoints
- Verify data transformations
- Check error responses
- Test date range handling

### Unit Tests
- Test individual components
- Verify utility functions
- Test data processing
- Check edge cases

## Test Data Management

### Mock Data
- Keep mock data up to date
- Match production data structure
- Include edge cases
- Test with various scenarios

### Live Data
- Use test account data
- Avoid modifying production data
- Test with realistic volumes
- Include various data types
