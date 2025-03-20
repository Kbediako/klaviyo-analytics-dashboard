import express from 'express';
import cors from 'cors';
import { Request, Response } from 'express';

/**
 * Mock data for testing without live API calls
 */
const mockData = {
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
    {
      id: 'campaign2',
      name: 'Welcome Series',
      status: 'draft',
      metrics: {
        opens: 0,
        clicks: 0,
        revenue: 0,
        unsubscribes: 0
      }
    },
    {
      id: 'campaign3',
      name: 'Product Launch',
      status: 'sent',
      metrics: {
        opens: 980,
        clicks: 210,
        revenue: 3200,
        unsubscribes: 8
      }
    }
  ],
  flows: [
    {
      id: 'flow1',
      name: 'Welcome Flow',
      status: 'active',
      metrics: {
        recipients: 2500,
        conversions: 320,
        revenue: 4800
      }
    },
    {
      id: 'flow2',
      name: 'Abandoned Cart',
      status: 'active',
      metrics: {
        recipients: 1800,
        conversions: 210,
        revenue: 3600
      }
    }
  ],
  forms: [
    {
      id: 'form1',
      name: 'Newsletter Signup',
      metrics: {
        views: 5600,
        submissions: 980,
        conversionRate: 17.5
      }
    },
    {
      id: 'form2',
      name: 'Exit Intent Popup',
      metrics: {
        views: 3200,
        submissions: 420,
        conversionRate: 13.1
      }
    }
  ],
  segments: [
    {
      id: 'segment1',
      name: 'Active Customers',
      memberCount: 3500,
      metrics: {
        revenue: 28000,
        averageOrderValue: 80
      }
    },
    {
      id: 'segment2',
      name: 'Lapsed Customers',
      memberCount: 1200,
      metrics: {
        revenue: 0,
        averageOrderValue: 0
      }
    }
  ]
};

/**
 * Create and configure the mock server
 */
function createMockServer() {
  const app = express();
  
  // Enable CORS for all routes
  app.use(cors());
  
  // Log all requests
  app.use((req: Request, _res: Response, next) => {
    console.log(`[Mock Server] ${req.method} ${req.path}${req.query.dateRange ? ` (dateRange: ${req.query.dateRange})` : ''}`);
    next();
  });

  // Overview endpoint
  app.get('/api/overview', (_req: Request, res: Response) => {
    res.json(mockData.overview);
  });

  // Campaigns endpoint
  app.get('/api/campaigns', (_req: Request, res: Response) => {
    res.json(mockData.campaigns);
  });

  // Flows endpoint
  app.get('/api/flows', (_req: Request, res: Response) => {
    res.json(mockData.flows);
  });

  // Forms endpoint
  app.get('/api/forms', (_req: Request, res: Response) => {
    res.json(mockData.forms);
  });

  // Segments endpoint
  app.get('/api/segments', (_req: Request, res: Response) => {
    res.json(mockData.segments);
  });

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', mode: 'mock' });
  });

  // Error simulation endpoint
  app.get('/api/error-test', (req: Request, res: Response) => {
    const errorType = req.query.type as string;
    
    if (errorType === 'rate-limit') {
      res.status(429).json({ error: 'Too many requests' });
    } else if (errorType === 'server-error') {
      res.status(500).json({ error: 'Internal server error' });
    } else if (errorType === 'timeout') {
      // Simulate a timeout by not responding for 30 seconds
      setTimeout(() => {
        res.json({ result: 'This response was delayed' });
      }, 30000);
    } else if (errorType === 'unauthorized') {
      res.status(401).json({ error: 'Invalid API key' });
    } else {
      res.status(400).json({ error: 'Bad request' });
    }
  });

  return app;
}

/**
 * Start the mock server if this file is run directly
 */
if (require.main === module) {
  const PORT = process.env.MOCK_PORT || 3002;
  const app = createMockServer();
  
  app.listen(PORT, () => {
    console.log(`Mock API server running on port ${PORT}`);
    console.log(`Test the server with: curl http://localhost:${PORT}/api/health`);
    console.log(`To test with the frontend: NEXT_PUBLIC_API_URL=http://localhost:${PORT}/api npm run dev`);
  });
}

export { createMockServer, mockData };
