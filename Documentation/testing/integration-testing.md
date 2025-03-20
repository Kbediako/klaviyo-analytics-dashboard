# Integration Testing with API Mocks

For testing API endpoints without live calls, we use Supertest to make requests to Express endpoints while mocking the service layer.

## Example Implementation

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

## Mock Server Implementation

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

### Running with Mock Server

```bash
# Start the mock server
cd backend
npm run mock-server

# In a separate terminal, start the frontend with the mock API URL
cd ..
NEXT_PUBLIC_API_URL=http://localhost:3002/api NEXT_PUBLIC_API_MOCKING=disabled npm run dev
```

Alternatively, use the provided script:

```bash
# From the project root
./run-with-mock-server.sh
```

### Error Simulation

The mock server can simulate various error scenarios:

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
