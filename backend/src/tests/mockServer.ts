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
  // Chart data for visualizations
  charts: {
    revenueOverTime: [
      { date: '2025-03-12', campaigns: 4700, flows: 3400, forms: 1950, other: 1025 },
      { date: '2025-03-13', campaigns: 4800, flows: 3500, forms: 2000, other: 1050 },
      { date: '2025-03-14', campaigns: 4900, flows: 3600, forms: 2050, other: 1075 },
      { date: '2025-03-15', campaigns: 5000, flows: 3700, forms: 2100, other: 1100 },
      { date: '2025-03-16', campaigns: 5100, flows: 3800, forms: 2150, other: 1125 },
      { date: '2025-03-17', campaigns: 5200, flows: 3900, forms: 2200, other: 1150 },
      { date: '2025-03-18', campaigns: 5300, flows: 4000, forms: 2250, other: 1175 },
      { date: '2025-03-19', campaigns: 5400, flows: 4100, forms: 2300, other: 1200 }
    ],
    channelDistribution: [
      { name: 'Campaigns', value: 42 },
      { name: 'Flows', value: 35 },
      { name: 'Forms', value: 15 },
      { name: 'Other', value: 8 }
    ],
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
  ]
};

/**
 * Create and configure the mock server
 */
function createMockServer() {
  const app = express();
  
  // Enable CORS for all routes with proper options
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));

  // Handle preflight requests
  app.options('*', cors());
  
  // Log all requests
  app.use((req: Request, _res: Response, next) => {
    console.log(`[Mock Server] ${req.method} ${req.path}${req.query.dateRange ? ` (dateRange: ${req.query.dateRange})` : ''}`);
    next();
  });

  // Helper function to filter data by date range
  const filterDataByDateRange = (data: any[], dateRange: string | undefined, dateField: string = 'date') => {
    if (!dateRange) {
      return data;
    }
    
    // Handle predefined date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate: Date;
    let endDate: Date = today;
    
    console.log('Filtering with date range:', dateRange);
    console.log('Current date:', today.toISOString());
    
    switch (dateRange) {
      case 'last-7-days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last-30-days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last-90-days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 90);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'this-month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last-month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'this-year':
        startDate = new Date(today.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        // Handle custom date range format: 'YYYY-MM-DD,YYYY-MM-DD'
        if (dateRange.includes(',')) {
          const [start, end] = dateRange.split(',');
          startDate = new Date(start);
          endDate = new Date(end);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
        } else {
          // Default to last 30 days if format is not recognized
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
        }
    }
    
    console.log('Date range:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    // For data with date field, filter by date range
    if (data.length > 0 && data[0][dateField]) {
      const filteredData = data.filter(item => {
        const itemDate = new Date(item[dateField]);
        itemDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
        const result = itemDate >= startDate && itemDate <= endDate;
        console.log('Filtering item:', {
          date: item[dateField],
          itemDate: itemDate.toISOString(),
          included: result
        });
        return result;
      });
      console.log('Filtered data length:', filteredData.length);
      return filteredData;
    }
    
    // For data without date field, return all data
    return data;
  };

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', mode: 'mock' });
  });

  // Overview endpoint
  app.get('/api/overview', (_req: Request, res: Response) => {
    // Add artificial delay to simulate network latency
    setTimeout(() => {
      res.json(mockData.overview);
    }, 200);
  });

  // Campaigns endpoint
  app.get('/api/campaigns', (_req: Request, res: Response) => {
    setTimeout(() => {
      res.json(mockData.campaigns);
    }, 200);
  });

  // Flows endpoint
  app.get('/api/flows', (_req: Request, res: Response) => {
    setTimeout(() => {
      res.json(mockData.flows);
    }, 200);
  });

  // Forms endpoint
  app.get('/api/forms', (_req: Request, res: Response) => {
    setTimeout(() => {
      res.json(mockData.forms);
    }, 200);
  });

  // Segments endpoint
  app.get('/api/segments', (_req: Request, res: Response) => {
    setTimeout(() => {
      res.json(mockData.segments);
    }, 200);
  });

  // Charts endpoint
  app.get('/api/charts', (_req: Request, res: Response) => {
    setTimeout(() => {
      res.json(mockData.charts);
    }, 200);
  });

  // Chart endpoints
  app.get('/api/charts/revenue', (req: Request, res: Response) => {
    const dateRange = req.query.dateRange as string | undefined;
    console.log('Revenue data request with date range:', dateRange);
    try {
      const data = mockData.charts.revenueOverTime;
      console.log('Revenue data before filtering:', data);
      const filteredData = filterDataByDateRange(data, dateRange);
      console.log('Revenue data after filtering:', filteredData);
      res.json(filteredData);
    } catch (error) {
      console.error('Error processing revenue data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/charts/distribution', (req: Request, res: Response) => {
    console.log('Distribution data request');
    setTimeout(() => {
      const data = mockData.charts.channelDistribution;
      console.log('Sending distribution data:', data);
      res.json(data);
    }, 200);
  });

  app.get('/api/charts/top-segments', (req: Request, res: Response) => {
    setTimeout(() => {
      res.json(mockData.charts.topSegments);
    }, 200);
  });

  app.get('/api/charts/top-flows', (req: Request, res: Response) => {
    setTimeout(() => {
      res.json(mockData.charts.topFlows);
    }, 200);
  });

  app.get('/api/charts/top-forms', (req: Request, res: Response) => {
    setTimeout(() => {
      res.json(mockData.charts.topForms);
    }, 200);
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
  const PORT = process.env.PORT || 3002;
  const app = createMockServer();
  
  app.listen(PORT, () => {
    console.log(`Mock API server running on port ${PORT}`);
    console.log(`Test the server with: curl http://localhost:${PORT}/api/health`);
    console.log(`To test with the frontend: NEXT_PUBLIC_API_URL=http://localhost:${PORT}/api npm run dev`);
  });
}

export { createMockServer, mockData };
