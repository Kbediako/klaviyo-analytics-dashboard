# Mock Server & MSW Setup

The project includes two methods for mocking API requests:

## 1. Mock Server

Located in `backend/src/tests/mockServer.ts`:
- Full Express server implementation
- Handles all chart endpoints under `/api/charts/` prefix
- Implements proper date range filtering
- Runs on a separate port (default: 3002)

### Running with Mock Server

```bash
# Use run-with-mock-server.sh (MSW explicitly disabled)
./run-with-mock-server.sh

# Or manually with environment variables
PORT=3000 NEXT_PUBLIC_API_URL=http://localhost:3002/api NEXT_PUBLIC_API_MOCKING=disabled npm run dev
```

## 2. Mock Service Worker (MSW)

Located in `frontend/src/mocks/`:
- Browser-based request interception
- Useful for component testing
- Can be disabled by removing `NEXT_PUBLIC_API_MOCKING=enabled`
- Should be disabled when using the mock server

### Running with MSW

```bash
# Enable MSW
NEXT_PUBLIC_API_MOCKING=enabled npm run dev
```

## Choosing Between Mock Server and MSW

### When to Use Mock Server
- For end-to-end testing
- When testing date range filtering
- When you need a full server implementation
- For testing API endpoints directly

### When to Use MSW
- For component testing
- During development
- When you need to intercept specific requests
- For testing error scenarios

## Implementation Details

### Mock Server
- Provides realistic test data
- Implements all API endpoints
- Handles query parameters
- Supports all date range formats

### MSW Handlers
- Mirror mock server behavior
- Support component testing
- Can simulate errors
- Easy to customize responses

## Best Practices

1. **Environment Variables**
   - Set `NEXT_PUBLIC_API_MOCKING` appropriately
   - Configure API URL correctly
   - Use consistent ports

2. **Testing**
   - Use MSW for unit tests
   - Use mock server for integration tests
   - Don't mix MSW and mock server
   - Test both success and error cases

3. **Data Consistency**
   - Keep mock data realistic
   - Use consistent data structures
   - Match API response formats
   - Test all date range scenarios
