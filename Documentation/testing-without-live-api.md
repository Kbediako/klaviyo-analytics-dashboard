# Testing the Klaviyo Analytics Dashboard Without Live API Calls

This guide provides detailed instructions on how to test the Klaviyo Analytics Dashboard application without making live API calls to Klaviyo. These approaches are useful during development, when you want to avoid hitting API rate limits, or when you need consistent test data.

## Table of Contents

1. [Unit Testing with Mocks](#1-unit-testing-with-mocks)
2. [Integration Testing with API Mocks](#2-integration-testing-with-api-mocks)
3. [Mock API Server](#3-mock-api-server)
4. [MSW (Mock Service Worker)](#4-msw-mock-service-worker)
5. [Using the Existing E2E Test Mock Mode](#5-using-the-existing-e2e-test-mock-mode)
6. [Testing API Client in Isolation](#6-testing-api-client-in-isolation)
7. [Creating Comprehensive Mock Data](#7-creating-comprehensive-mock-data)
8. [Handling Error Scenarios](#8-handling-error-scenarios)

## 1. Unit Testing with Mocks

The backend is already set up for unit testing with Jest, using mocks to avoid live API calls.

### Example Implementation

```typescript
// Example from a service test (e.g., campaignsService.test.ts)
import { getCampaigns } from '../campaignsService';
import * as klaviyoApiClient from '../klaviyoApiClient';

// Mock data
const mockApiResponse = {
  // Sample Klaviyo API response data
};

const expectedOutput = {
  // Expected transformed data
};

// Mock the API client
jest.mock('../klaviyoApiClient', () => ({
  getKlaviyoData: jest.fn().mockResolvedValue(mockApiResponse)
}));

describe('Campaigns Service', () => {
  test('should process campaign data correctly', async () => {
    // The test will use the mocked API client instead of making real calls
    const result = await getCampaigns('last-30-days');
    expect(result).toEqual(expectedOutput);
    
    // Verify the API client was called with correct parameters
    expect(klaviyoApiClient.getKlaviyoData).toHaveBeenCalledWith(
      'campaigns',
      expect.objectContaining({ dateRange: 'last-30-days' })
    );
  });
});
```

### Running Unit Tests

```bash
cd backend
npm test
```

## 2. Integration Testing with API Mocks

For testing API endpoints without live calls, we use Supertest to make requests to Express endpoints while mocking the service layer.

### Example Implementation

```typescript
// Example integration test (e.g., campaignsController.test.ts)
import request from 'supertest';
import express from 'express';
import campaignsRouter from '../routes/campaigns';
import * as campaignsService from '../services/campaignsService';

// Mock data
const mockCampaigns = [
  {
    id: 'campaign1',
    name: 'Black Friday Sale',
    status: 'sent',
    metrics: {
      opens: 1200,
      clicks: 350,
    }
  }
];

// Setup test app
const app = express();
app.use('/api/campaigns', campaignsRouter);

describe('GET /api/campaigns', () => {
  beforeEach(() => {
    // Mock the service before each test
    jest.spyOn(campaignsService, 'getCampaigns').mockResolvedValue(mockCampaigns);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return campaigns data', async () => {
    const response = await request(app)
      .get('/api/campaigns?dateRange=last-30-days')
      .expect(200);
    
    expect(response.body).toEqual(mockCampaigns);
    expect(campaignsService.getCampaigns).toHaveBeenCalledWith('last-30-days');
  });
});
```

## 3. Mock API Server

For more comprehensive testing, you can create a dedicated mock API server that mimics the behavior of your backend API.

### Implementation Steps

1. Create a mock server file in your backend:

```typescript
// backend/src/mockServer.ts
import express from 'express';
import cors from 'cors';
import mockResponses from './tests/mockData';

const app = express();
app.use(cors());

// Mock endpoints that return predefined data
app.get('/api/overview', (req, res) => {
  // You can add logic to handle query parameters like dateRange
  const dateRange = req.query.dateRange || 'last-30-days';
  console.log(`Mock server: GET /api/overview with dateRange=${dateRange}`);
  res.json(mockResponses.overview);
});

app.get('/api/campaigns', (req, res) => {
  const dateRange = req.query.dateRange || 'last-30-days';
  console.log(`Mock server: GET /api/campaigns with dateRange=${dateRange}`);
  res.json(mockResponses.campaigns);
});

app.get('/api/flows', (req, res) => {
  res.json(mockResponses.flows);
});

app.get('/api/forms', (req, res) => {
  res.json(mockResponses.forms);
});

app.get('/api/segments', (req, res) => {
  res.json(mockResponses.segments);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'mock' });
});

const PORT = process.env.MOCK_PORT || 3002;
app.listen(PORT, () => {
  console.log(`Mock API server running on port ${PORT}`);
});
```

2. Add a script to run it in your backend/package.json:

```json
"scripts": {
  "mock-server": "ts-node src/mockServer.ts"
}
```

3. Create a comprehensive mock data file:

```typescript
// backend/src/tests/mockData.ts
export default {
  overview: {
    revenue: 12500,
    subscribers: 1250,
    conversionRate: 3.2,
    formSubmissions: 450,
    periodComparison: {
      revenue: 15,
      subscribers: 8,
      conversionRate: -1.5,
      formSubmissions: 12
    }
  },
  campaigns: [
    {
      id: 'campaign1',
      name: 'Black Friday Sale',
      status: 'sent',
      metrics: {
        opens: 1200,
        clicks: 350,
        revenue: 5600,
        unsubscribes: 15
      }
    },
    // More campaigns...
  ],
  flows: [
    // Flow data...
  ],
  forms: [
    // Form data...
  ],
  segments: [
    // Segment data...
  ]
};
```

4. Point your frontend to the mock server during testing:

```bash
# Start the mock server
cd backend
npm run mock-server

# In a separate terminal, start the frontend with the mock API URL and explicitly disable MSW
cd ..
NEXT_PUBLIC_API_URL=http://localhost:3002/api NEXT_PUBLIC_API_MOCKING=disabled npm run dev
```

Alternatively, you can use the provided script that handles this for you:

```bash
# From the project root
./run-with-mock-server.sh
```

This script starts both the mock server and the frontend with the correct environment variables, including explicitly disabling MSW to prevent it from intercepting requests intended for the mock server.

## 4. MSW (Mock Service Worker)

For advanced frontend testing, MSW provides a way to intercept network requests at the browser level.

### Implementation Steps

1. Install MSW:

```bash
npm install --save-dev msw
```

2. Create a mocks directory in your frontend project:

```bash
mkdir -p frontend/src/mocks
```

3. Set up handlers for your API endpoints:

```typescript
// frontend/src/mocks/handlers.js
import { rest } from 'msw'
import mockData from './mockData'

export const handlers = [
  rest.get('http://localhost:3001/api/overview', (req, res, ctx) => {
    // You can handle query parameters
    const dateRange = req.url.searchParams.get('dateRange') || 'last-30-days';
    console.log(`MSW intercepted: GET /api/overview with dateRange=${dateRange}`);
    
    // Return a mocked response
    return res(
      ctx.status(200),
      ctx.json(mockData.overview)
    )
  }),
  
  rest.get('http://localhost:3001/api/campaigns', (req, res, ctx) => {
    return res(ctx.json(mockData.campaigns))
  }),
  
  rest.get('http://localhost:3001/api/flows', (req, res, ctx) => {
    return res(ctx.json(mockData.flows))
  }),
  
  rest.get('http://localhost:3001/api/forms', (req, res, ctx) => {
    return res(ctx.json(mockData.forms))
  }),
  
  rest.get('http://localhost:3001/api/segments', (req, res, ctx) => {
    return res(ctx.json(mockData.segments))
  }),
  
  // Health check endpoint
  rest.get('http://localhost:3001/api/health', (req, res, ctx) => {
    return res(ctx.json({ status: 'ok', mode: 'msw' }))
  }),
]
```

4. Create a browser setup file:

```typescript
// frontend/src/mocks/browser.js
import { setupWorker } from 'msw'
import { handlers } from './handlers'

// This configures a Service Worker with the given request handlers
export const worker = setupWorker(...handlers)
```

5. Initialize MSW in your frontend application:

```typescript
// frontend/src/index.js or _app.js
async function initMocks() {
  if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled') {
    if (typeof window === 'undefined') {
      const { server } = await import('./mocks/server')
      server.listen()
    } else {
      const { worker } = await import('./mocks/browser')
      worker.start()
    }
    console.log('🔶 Mock Service Worker enabled')
  }
}

// Call the function before your app renders
initMocks().then(() => {
  // Initialize your app
})
```

6. Run your frontend with MSW enabled:

```bash
NEXT_PUBLIC_API_MOCKING=enabled npm run dev
```

## 5. Using the Existing E2E Test Mock Mode

The project already includes a mock mode for E2E testing, which you can use for development as well.

### Steps to Use Mock Mode

1. Start just the frontend (no need for the backend):

```bash
npm run dev
```

2. Open the test runner in your browser:

```
http://localhost:3000/e2e-test-runner.html
```

3. Select "Mock Mode" in the test runner UI

This will run the tests using the mock data defined in `public/dashboard.test.js` instead of making real API calls.

## 6. Testing API Client in Isolation

To test the Klaviyo API client without making real calls, you can use nock to intercept HTTP requests.

### Example Implementation

```typescript
// klaviyoApiClient.test.ts
import nock from 'nock';
import { getKlaviyoData } from './klaviyoApiClient';

// Mock Klaviyo API response
const mockKlaviyoResponse = {
  // Sample API response
};

// Expected transformed data
const expectedTransformedData = {
  // Expected output after transformation
};

describe('Klaviyo API Client', () => {
  beforeEach(() => {
    // Mock the HTTP requests at the network level
    nock('https://a.klaviyo.com/api')
      .get('/v1/campaigns')
      .query(true) // Match any query parameters
      .reply(200, mockKlaviyoResponse);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should fetch and transform campaign data', async () => {
    const result = await getKlaviyoData('campaigns', { dateRange: 'last-30-days' });
    expect(result).toEqual(expectedTransformedData);
  });
  
  it('should handle API errors gracefully', async () => {
    // Mock an API error
    nock('https://a.klaviyo.com/api')
      .get('/v1/campaigns')
      .query(true)
      .reply(429, { error: 'Too many requests' });
      
    // The client should handle this error and return a default value
    const result = await getKlaviyoData('campaigns', { dateRange: 'last-30-days' });
    expect(result).toEqual([]); // Or whatever default value your client returns
  });
});
```

## 7. Creating Comprehensive Mock Data

To effectively test without live API calls, you need comprehensive mock data that covers various scenarios.

### Mock Data Structure

It's critical that your mock data structure matches exactly what your components expect. Examine your components to understand the expected data structure before creating mock data.

For example, the OverviewSection component expects data in this format:

```typescript
// mockData.ts
export default {
  // Overview data with the structure expected by OverviewSection component
  overview: {
    revenue: {
      current: 12500,
      change: 15
    },
    subscribers: {
      current: 1250,
      change: 8
    },
    conversionRate: {
      current: 3.2,
      change: -1.5
    },
    formSubmissions: {
      current: 450,
      change: 12
    }
  },
  
  // Campaigns with the structure expected by CampaignsTable component
  campaigns: [
    {
      id: 'campaign1',
      name: 'Black Friday Sale',
      sent: 5000,
      openRate: 24.0,
      clickRate: 7.0,
      conversionRate: 3.2,
      revenue: 5600
    },
    {
      id: 'campaign2',
      name: 'Welcome Series',
      sent: 1200,
      openRate: 32.5,
      clickRate: 12.8,
      conversionRate: 5.5,
      revenue: 2800
    },
    {
      id: 'campaign3',
      name: 'Product Launch',
      sent: 3500,
      openRate: 28.0,
      clickRate: 6.0,
      conversionRate: 2.8,
      revenue: 3200
    }
  ],
  
  // Flows data with the structure expected by FlowsTable component
  flows: [
    {
      id: 'flow1',
      name: 'Welcome Flow',
      recipients: 2500,
      openRate: 35.2,
      clickRate: 18.5,
      conversionRate: 12.8,
      revenue: 4800
    },
    {
      id: 'flow2',
      name: 'Abandoned Cart',
      recipients: 1800,
      openRate: 42.0,
      clickRate: 24.5,
      conversionRate: 11.7,
      revenue: 3600
    }
  ],
  
  // Forms data with the structure expected by FormsTable component
  forms: [
    {
      id: 'form1',
      name: 'Newsletter Signup',
      views: 5600,
      submissions: 980,
      submissionRate: 17.5,
      conversions: 245
    },
    {
      id: 'form2',
      name: 'Exit Intent Popup',
      views: 3200,
      submissions: 420,
      submissionRate: 13.1,
      conversions: 105
    }
  ],
  
  // Segments data with the structure expected by SegmentsTable component
  segments: [
    {
      id: 'segment1',
      name: 'Active Customers',
      count: 3500,
      conversionRate: 8.5,
      revenue: 28000
    },
    {
      id: 'segment2',
      name: 'Lapsed Customers',
      count: 1200,
      conversionRate: 2.1,
      revenue: 4500
    }
  ],
  
  // Chart data for visualizations
  charts: {
    // Time series data for the Revenue Overview chart
    revenueOverTime: [
      { date: '2023-01', campaigns: 4200, flows: 3100, forms: 1800, other: 950 },
      { date: '2023-02', campaigns: 4500, flows: 3300, forms: 1900, other: 1000 },
      { date: '2023-03', campaigns: 4800, flows: 3500, forms: 2000, other: 1050 },
      { date: '2023-04', campaigns: 5100, flows: 3700, forms: 2100, other: 1100 },
      { date: '2023-05', campaigns: 5400, flows: 3900, forms: 2200, other: 1150 },
      { date: '2023-06', campaigns: 5700, flows: 4100, forms: 2300, other: 1200 }
    ],
    
    // Pie chart data for the Channel Distribution chart
    channelDistribution: [
      { name: 'Campaigns', value: 42 },
      { name: 'Flows', value: 35 },
      { name: 'Forms', value: 15 },
      { name: 'Other', value: 8 }
    ],
    
    // Data for other visualizations
    topSegments: [
      { name: 'VIP Customers', conversionRate: 42, count: 5842, revenue: 28450 },
      { name: 'Recent Purchasers', conversionRate: 35, count: 12480, revenue: 42680 },
      { name: 'Cart Abandoners', conversionRate: 28, count: 8640, revenue: 15280 },
      { name: 'Email Engaged', conversionRate: 22, count: 18540, revenue: 24850 }
    ],
    topFlows: [
      { name: 'Welcome Series', recipients: 8450, conversionRate: 32 },
      { name: 'Abandoned Cart', recipients: 6280, conversionRate: 28 },
      { name: 'Post-Purchase', recipients: 12480, conversionRate: 24 },
      { name: 'Win-Back', recipients: 5840, conversionRate: 18 }
    ],
    topForms: [
      { name: 'Newsletter Signup', views: 12480, submissionRate: 38 },
      { name: 'Exit Intent Popup', views: 28450, submissionRate: 24 },
      { name: 'Product Registration', views: 8640, submissionRate: 42 },
      { name: 'Contact Form', views: 5840, submissionRate: 32 }
    ]
  },
  
  // Include edge cases
  emptyResponse: {
    campaigns: [],
    flows: [],
    forms: [],
    segments: [],
    charts: {
      revenueOverTime: [],
      channelDistribution: [],
      topSegments: [],
      topFlows: [],
      topForms: []
    }
  },
  
  // Error responses
  errors: {
    rateLimitExceeded: {
      status: 429,
      message: 'Rate limit exceeded. Try again later.'
    },
    unauthorized: {
      status: 401,
      message: 'Invalid API key'
    },
    serverError: {
      status: 500,
      message: 'Internal server error'
    }
  }
};
```

### Chart Visualization Data

For chart visualizations, the mock data structure needs to match what the charting library (Recharts) expects:

1. **Line/Area Charts**: Array of objects with consistent property names
   ```typescript
   // Revenue over time chart data
   [
     { date: '2023-01', campaigns: 4200, flows: 3100, forms: 1800, other: 950 },
     { date: '2023-02', campaigns: 4500, flows: 3300, forms: 1900, other: 1000 },
     // ...more data points
   ]
   ```

2. **Pie/Donut Charts**: Array of objects with `name` and `value` properties
   ```typescript
   // Channel distribution chart data
   [
     { name: 'Campaigns', value: 42 },
     { name: 'Flows', value: 35 },
     { name: 'Forms', value: 15 },
     { name: 'Other', value: 8 }
   ]
   ```

3. **Bar Charts**: Similar to line charts, with categories and values
   ```typescript
   [
     { category: 'Jan', value: 4200 },
     { category: 'Feb', value: 4500 },
     // ...more data points
   ]
   ```

When testing visualizations with mock data:
- Ensure the mock data structure matches what the visualization components expect
- Include edge cases like empty data sets, single data points, or extreme values
- Test different date ranges to ensure visualizations handle varying amounts of data
- For interactive charts, test with both mouse and keyboard interactions

### Using Mock Data in Different Contexts

1. **For unit tests**: Import directly into test files
2. **For the mock server**: Use as response data
3. **For MSW**: Use to define response handlers
4. **For E2E tests**: Adapt for the test runner

## 8. Handling Error Scenarios

Testing error handling is crucial. Here's how to simulate different error scenarios:

### With Jest Mocks

```typescript
// Test service error handling
jest.spyOn(klaviyoApiClient, 'getKlaviyoData').mockRejectedValue(
  new Error('API request failed')
);

// Verify the service handles errors gracefully
const result = await campaignsService.getCampaigns('last-30-days');
expect(result).toEqual([]); // Or whatever fallback value you expect
```

### With Nock

```typescript
// Simulate rate limiting
nock('https://a.klaviyo.com/api')
  .get('/v1/campaigns')
  .query(true)
  .reply(429, { error: 'Too many requests' });

// Simulate server error
nock('https://a.klaviyo.com/api')
  .get('/v1/flows')
  .query(true)
  .reply(500, { error: 'Internal server error' });

// Simulate network failure
nock('https://a.klaviyo.com/api')
  .get('/v1/forms')
  .query(true)
  .replyWithError('Connection refused');
```

### With MSW

```typescript
// In your MSW handlers
rest.get('http://localhost:3001/api/campaigns', (req, res, ctx) => {
  // Simulate an error response
  return res(
    ctx.status(500),
    ctx.json({ error: 'Internal server error' })
  )
})
```

### With Mock Server

```typescript
// In your mock server
app.get('/api/error-test', (req, res) => {
  const errorType = req.query.type;
  
  switch(errorType) {
    case 'rate-limit':
      return res.status(429).json({ error: 'Too many requests' });
    case 'server-error':
      return res.status(500).json({ error: 'Internal server error' });
    case 'timeout':
      // Simulate a timeout by not responding for 30 seconds
      setTimeout(() => {
        res.json({ result: 'This response was delayed' });
      }, 30000);
      break;
    default:
      return res.status(400).json({ error: 'Bad request' });
  }
});
```

## Conclusion

By using these approaches, you can effectively test your Klaviyo Analytics Dashboard without making live API calls. This allows for faster, more reliable testing during development and helps avoid hitting API rate limits.

Choose the approach that best fits your current needs:

- **Unit testing with mocks**: For testing individual functions and components
- **Integration testing with API mocks**: For testing API endpoints
- **Mock API server**: For comprehensive testing of the frontend against a fake backend
- **MSW**: For intercepting and mocking network requests in the browser
- **E2E test mock mode**: For using the existing test infrastructure
- **API client isolation testing**: For testing the API client specifically

Remember to create comprehensive mock data that covers various scenarios, including edge cases and error conditions.
