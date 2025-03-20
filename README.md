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
├── styles/             # Global styles
├── analytics-dashboard.tsx # Main dashboard component
├── hooks/              # React hooks for data fetching
├── lib/                # Utility functions and API client
└── backend/            # Node.js/Express backend (API)
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

## Tech Stack

### Frontend
- **Framework**: Next.js with React
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

### Backend
- **Framework**: Node.js with Express
- **Language**: TypeScript
- **Testing**: Jest and Supertest
- **API Integration**: Klaviyo REST API

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
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

## API Endpoints

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

For more details, see the [Testing Without Live API Calls](Documentation/testing-without-live-api.md) documentation.

## Contributing

Please refer to the [Action Plan](Documentation/ActionPlan.md) and [Coding Rules](Documentation/CodingRules.md) for detailed information on project structure, coding standards, and implementation guidelines.

## Troubleshooting

### Common Issues

#### Backend API Connection Issues

- **Issue**: Frontend can't connect to backend API
  - **Solution**: Ensure the backend server is running on port 3001 and that there are no CORS issues.

- **Issue**: "Missing required environment variable" error
  - **Solution**: Make sure all required environment variables are set in your `.env` file.

- **Issue**: Klaviyo API errors
  - **Solution**: Verify your API key is correct and that you're not exceeding Klaviyo's rate limits.

#### Performance Issues

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
