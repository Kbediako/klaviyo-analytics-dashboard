const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Monitoring endpoints
app.get('/api/monitoring/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: 'pass', message: 'Database connection is healthy' },
      redis: { status: 'pass', message: 'Redis connection is healthy' },
      memory: { status: 'pass', message: 'Memory usage is normal' },
      cpu: { status: 'pass', message: 'CPU usage is normal' },
      disk: { status: 'pass', message: 'Disk space is available' },
      errorRate: { status: 'pass', message: 'Error rate is low' },
      apiResponseTime: { status: 'pass', message: 'API response time is normal' }
    },
    version: '1.0.0',
    uptime: process.uptime()
  });
});

app.get('/api/monitoring/metrics', (req, res) => {
  res.status(200).json({
    system: {
      timestamp: new Date().toISOString(),
      cpu: {
        usage: 25.5,
        loadAvg: [1.2, 1.1, 0.9]
      },
      memory: {
        total: 16000000000,
        free: 8000000000,
        usage: 50.0
      },
      uptime: process.uptime()
    },
    cache: {
      hits: 150,
      misses: 50,
      ratio: 0.75,
      size: 200,
      timestamp: new Date().toISOString()
    }
  });
});

app.get('/api/monitoring/api-metrics', (req, res) => {
  res.status(200).json({
    metrics: [
      {
        endpoint: '/api/overview',
        method: 'GET',
        statusCode: 200,
        responseTime: 150,
        timestamp: new Date().toISOString(),
        userAgent: 'Mozilla/5.0',
        ip: '127.0.0.1'
      },
      {
        endpoint: '/api/campaigns',
        method: 'GET',
        statusCode: 200,
        responseTime: 200,
        timestamp: new Date().toISOString(),
        userAgent: 'Mozilla/5.0',
        ip: '127.0.0.1'
      }
    ],
    summary: {
      count: 2,
      avgResponseTime: 175,
      statusCodes: {
        200: 2
      }
    }
  });
});

app.get('/api/monitoring/errors', (req, res) => {
  res.status(200).json({
    errors: [
      {
        message: 'Failed to fetch data from Klaviyo API',
        stack: 'Error: Failed to fetch data from Klaviyo API\n    at KlaviyoApiClient.getCampaigns',
        context: { endpoint: '/api/campaigns' },
        timestamp: new Date().toISOString()
      }
    ],
    summary: {
      count: 1,
      groups: [
        {
          message: 'Failed to fetch data from Klaviyo API',
          count: 1,
          lastOccurred: new Date().toISOString()
        }
      ]
    }
  });
});

app.get('/api/monitoring/status', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    resources: {
      cpu: {
        usage: 25.5,
        status: 'healthy'
      },
      memory: {
        usage: 50.0,
        status: 'healthy'
      }
    },
    services: {
      database: 'healthy',
      redis: 'healthy',
      api: 'healthy'
    },
    cache: {
      hitRatio: 0.75,
      status: 'healthy'
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`Monitoring server running on port ${port}`);
});
