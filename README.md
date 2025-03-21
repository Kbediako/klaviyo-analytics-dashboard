# Klaviyo Analytics Dashboard

[![CI Status](https://github.com/yourusername/klaviyo-analytics-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/klaviyo-analytics-dashboard/actions/workflows/ci.yml)

A comprehensive analytics dashboard for Klaviyo marketing data, featuring real-time metrics, campaign performance, and customer insights.

## Project Structure

This project is organized with the frontend in the root directory and the backend in a separate folder:

```
klaviyo-analytics-dashboard/
├── app/                # Next.js app directory
├── components/         # UI components
├── public/             # Static assets
├── styles/            # Global styles
├── analytics-dashboard.tsx # Main dashboard component
├── hooks/             # React hooks for data fetching
├── lib/               # Utility functions and API client
└── backend/           # Node.js/Express backend (API)
```

## Features

- **Persistent Metric Cards**: Key metrics remain visible across all dashboard tabs
- **Overview Dashboard**: 
  - High-level metrics including revenue, subscribers, conversion rates, and form submissions
  - Data visualizations including revenue trends and channel distribution
  - Top performing segments, flows, and forms
- **Campaign Analytics**: Performance metrics for email campaigns
- **Flow Insights**: Automated flow performance and optimization opportunities
- **Form Analytics**: Form submission rates and conversion data
- **Segment Analysis**: Customer segment performance and growth
- **Client-Side Caching**: Improved performance with local caching of API responses
- **Date Range Support**: 
  - Standard ranges (7, 30, 90 days)
  - Custom date selection
  - Year boundary handling
  - Error validation

## Tech Stack

### Frontend
- **Framework**: Next.js with React
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

### Backend
- **Framework**: Node.js with Express
- **Language**: TypeScript
- **Database**: PostgreSQL with TimescaleDB for time-series optimization
- **Testing**: Jest and Supertest
- **API Integration**: Klaviyo REST API

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL with TimescaleDB extension (or Docker for containerized setup)
- Klaviyo API key

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Add your Klaviyo API key to the `.env` file:
   ```
   KLAVIYO_API_KEY=your_api_key_here
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The backend server will be available at http://localhost:3001.

### Frontend Setup

The frontend is already set up with Next.js and all necessary UI components. To run it:

1. From the project root, install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at http://localhost:3000.

### Running the Application

You can run the application in two modes: with the mock API server or with the live Klaviyo API.

#### Option 1: Run with Mock API Server

Use this option for development and testing without making real API calls to Klaviyo.

```bash
# From the project root
./run-with-mock-server.sh
```

This script will:
1. Start the mock API server on port 3002
2. Start the frontend with the mock API URL
3. Both servers can be stopped with Ctrl+C

#### Option 2: Run with Live Klaviyo API

Use this option when you want to test with real data from your Klaviyo account.

```bash
# From the project root
./run-with-live-api.sh
```

This script will:
1. Start the backend server with your Klaviyo API key
2. Start the frontend connected to the backend
3. Both servers can be stopped with Ctrl+C

#### Option 3: Start Servers Manually

If you prefer to start the servers manually:

1. **Start the backend server first**:
   ```bash
   cd backend
   npm run dev
   ```

2. **In a separate terminal, start the frontend**:
   ```bash
   # From the project root
   npm run dev
   ```

3. **Verify the backend is running** by visiting http://localhost:3001/api/health in your browser. You should see a JSON response with status "OK".

4. **Access the dashboard** at http://localhost:3000

### Troubleshooting Connection Issues

If you see "Failed to fetch" errors in the frontend:

1. Ensure the backend server is running on port 3001
2. Check that your Klaviyo API key is correctly set in the backend's `.env` file
3. Verify the backend is accessible by visiting http://localhost:3001/api/health
4. Check browser console for specific error messages
5. If using a custom API URL, ensure NEXT_PUBLIC_API_URL is set correctly in your frontend environment

### Recent Updates

#### Service Layer Enhancement (Phase 3)

We've implemented significant service layer enhancements as part of the Gap Remediation Plan:

1. **Flow Repository Implementation**:
   - Complete CRUD operations for flow data
   - Batch operations for efficiency
   - Comprehensive test coverage
   - Date range filtering and search capabilities
   - Performance metrics aggregation
   - Time-based change tracking for incremental sync

2. **Database-First Approach**:
   - Enhanced controllers to check database before API calls
   - Automatic storage of API results for future requests
   - Intelligent data transformation between API and database formats
   - Improved error handling and logging

3. **Data Synchronization**:
   - New sync endpoints: POST /api/flows/sync, POST /api/sync/all, and GET /api/sync/status
   - Implemented DataSyncService for centralized sync management
   - Added support for incremental sync with database-backed timestamp tracking
   - Created sync_status_table for monitoring sync operations and reporting
   - Implemented force sync option to override incremental sync when needed

4. **Database Schema Expansion**:
   - Added flows table with specialized indexes for efficient querying
   - Implemented sync status tracking table for proper incremental sync
   - Added timestamp-based tracking for change detection
   - Optimized schema for analytics queries with BRIN and GIN indexes

See the [Phase 3 Implementation Summary](/Documentation/implementation/phase3-implementation-summary.md) for technical details.

#### Database Optimization (Phase 2)

We've implemented comprehensive database optimizations as part of the Gap Remediation Plan:

1. **Enhanced Indexing Strategy**:
   - Multi-column indexes with INCLUDE for common query patterns
   - BRIN indexes for efficient time-series data access
   - GIN indexes for JSON property querying
   - Partial indexes for frequent filter conditions

2. **Optimized Connection Pooling**:
   - Configurable pool size with environment variables
   - Comprehensive retry logic with exponential backoff
   - Connection metrics collection for monitoring
   - Statement timeout handling to prevent runaway queries

3. **Automated Backup and Recovery**:
   - Scheduled hourly, daily, weekly, and monthly backups
   - Backup integrity verification
   - Point-in-time recovery capabilities
   - Retention policies and rotation management

4. **TimescaleDB Optimizations**:
   - Optimized chunk size and compression policies
   - Multi-dimensional partitioning for improved query performance
   - Retention policies for automatic data lifecycle management
   - Specialized configuration for analytics workloads

See the [Database Optimization Guide](/Documentation/architecture/database-optimization.md) for technical details.

#### API Integration Updates (Phase 1)

We've fixed several issues with the Klaviyo API integration:

1. **Updated to latest API version**:
   - API client updated to use latest Klaviyo API version (2025-01-15)
   - Properly configured to get version from environment variables with fallback
   - Added API version validation on client initialization

2. **Fixed 405 Method Not Allowed errors**:
   - Updated endpoint paths to include 'api/' prefix (e.g., 'api/campaigns')
   - Fixed base URL structure from 'https://a.klaviyo.com/api' to 'https://a.klaviyo.com'
   - Updated header case sensitivity ('revision' vs 'Revision')

3. **Improved data transformation**:
   - Enhanced API response mapping to frontend models
   - Added deterministic metrics generation for consistent display
   - Implemented proper overview metrics calculation

4. **Enhanced error handling**:
   - Added comprehensive logging for API requests and responses
   - Improved validation and fallback behaviors
   - Added robust error handling in UI components

See [Integration Issues Guide](/Documentation/troubleshooting/integration-issues.md) for more details on specific API issues and solutions.

## API Endpoints

### Data Retrieval Endpoints

| Endpoint | Description | Query Parameters |
|----------|-------------|------------------|
| `GET /api/overview` | High-level marketing metrics | `dateRange` (e.g., 'last-30-days') |
| `GET /api/campaigns` | Campaign performance data | `dateRange` |
| `GET /api/flows` | Flow performance metrics | `dateRange` |
| `GET /api/forms` | Form submission and conversion data | `dateRange` |
| `GET /api/segments` | Segment membership and performance | `dateRange` |
| `GET /api/charts/revenue` | Revenue data for charts | `dateRange` |
| `GET /api/charts/distribution` | Channel distribution data | `dateRange` |
| `GET /api/charts/top-segments` | Top segments data | `dateRange` |
| `GET /api/charts/top-flows` | Top flows data | `dateRange` |
| `GET /api/charts/top-forms` | Top forms data | `dateRange` |
| `GET /api/flows/metrics` | Flow performance metrics | `dateRange` |

### Sync Endpoints

| Endpoint | Description | Query Parameters |
|----------|-------------|------------------|
| `POST /api/flows/sync` | Sync flow data from Klaviyo API | `force` (true/false), `since` (ISO timestamp) |
| `POST /api/sync/all` | Sync all entity types | `force` (true/false), `since` (ISO timestamp), `entities` (comma-separated list) |
| `GET /api/sync/status` | Get sync status information | none |

## Development Workflow

This project follows a test-first development approach:

1. Create a feature branch from `main` (e.g., `feature/backend-campaigns-endpoint`)
2. Write failing tests first
3. Implement the feature to pass the tests
4. Open a Pull Request to `main`
5. After CI checks pass and code review, merge into `main`

## Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
npm test
```

### Testing Without Live API Calls

The project includes several options for testing without making live API calls to Klaviyo:

1. **Mock API Server**: Use the `run-with-mock-server.sh` script to run the application with a mock API server.

2. **MSW (Mock Service Worker)**: The frontend includes MSW for intercepting and mocking API requests during development.
   ```bash
   NEXT_PUBLIC_API_MOCKING=enabled npm run dev
   ```

3. **Unit Tests with Mocks**: All unit tests use mocks to avoid making real API calls.

4. **Date Range Testing**: Comprehensive test suite for date range functionality:
   - Standard date ranges (7, 30, 90 days)
   - Custom date selections
   - Edge cases (year boundaries, single days)
   - Error scenarios
   ```bash
   # Run date range tests
   open public/test-runner.html
   ```

For more details, see:
- [Testing Without Live API Calls](Documentation/testing/mock-vs-live.md)
- [Date Range Testing Documentation](Documentation/testing/mock-data.md)
- [Testing Process Guide](Documentation/testing/process.md)
- [Knowledge Transfer: Mock vs Live API](Documentation/knowledge-transfer.md)
- [Integration Issues Guide](Documentation/troubleshooting/integration-issues.md)
- [Live API Implementation Guide](Documentation/implementation/live-api-implementation.md)
- [Klaviyo API Integration Guide](Documentation/implementation/klaviyo-api-integration.md)

## Contributing

Please refer to the [Action Plan](Documentation/ActionPlan.md) and [Coding Rules](Documentation/CodingRules.md) for detailed information on project structure, coding standards, and implementation guidelines.

### Gap Remediation Plan

After completing the six phases of the Klaviyo Analytics Dashboard enhancement, we've identified several gaps that need to be addressed to ensure the system is fully production-ready. The [Gap Remediation Plan](Documentation/implementation/gap-remediation-plan.md) outlines a comprehensive approach to address these gaps over an 8-week period.

Key gaps being addressed include:
- Missing repositories (FlowRepository, FormRepository, SegmentRepository)
- Incomplete controller updates for database-first approach
- Missing sync endpoints
- Incremental sync implementation
- Enhanced error handling and monitoring
- CI/CD pipeline completion
- Performance and security improvements

See the [Knowledge Transfer Documentation](Documentation/knowledge-transfer.md) for more details on the implementation plan and architecture.

## Troubleshooting

### Common Issues

#### Backend API Connection Issues

- **Issue**: Frontend can't connect to backend API
  - **Solution**: Ensure the backend server is running on port 3001 and that there are no CORS issues.

- **Issue**: "Missing required environment variable" error
  - **Solution**: Make sure all required environment variables are set in your `.env` file.

- **Issue**: Klaviyo API errors
  - **Solution**: Verify your API key is correct and that you're not exceeding Klaviyo's rate limits.

#### Klaviyo API Integration Issues

- **Issue**: 405 Method Not Allowed errors
  - **Solution**: Check that all endpoint paths include the 'api/' prefix and that the base URL is set to 'https://a.klaviyo.com'.

- **Issue**: Incorrect data display or missing metrics
  - **Solution**: Verify data transformation functions are correctly mapping API responses to frontend models.

- **Issue**: Data validation errors
  - **Solution**: Ensure UI components have proper validation for required properties and fallbacks for missing data.

- **Issue**: Rate limiting errors (429 responses)
  - **Solution**: Review and adjust the exponential backoff strategy in klaviyoApiClient.ts.

#### Database Performance Issues

- **Issue**: Slow database queries
  - **Solution**: Check the query execution plan with EXPLAIN ANALYZE to identify missing indexes or optimization opportunities.

- **Issue**: Connection pool exhaustion
  - **Solution**: Check pool metrics with `db.getPoolMetrics()` and adjust pool size with the DB_MAX_CONNECTIONS environment variable.

- **Issue**: High database CPU usage
  - **Solution**: Review the TimescaleDB chunk size and compression settings. Consider adjusting the work_mem setting.

- **Issue**: Database backup failures
  - **Solution**: Check backup logs in `/app/backups/backup.log` and verify disk space availability.

#### API Performance Issues

- **Issue**: Slow API responses
  - **Solution**: The application implements caching. Check that the cache is working properly.

- **Issue**: High memory usage
  - **Solution**: Consider implementing pagination for large data sets.

### Debugging

- Check the browser console for frontend errors
- Examine the server logs for backend errors
- Use the `/api/health` endpoint to verify the API is running correctly

## License

This project is licensed under the MIT License.
