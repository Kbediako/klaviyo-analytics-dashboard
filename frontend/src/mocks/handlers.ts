import { rest } from 'msw';
import mockData from './mockData';

// Define the base URL for the API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * MSW handlers for mocking API requests
 */
export const handlers = [
  // Overview endpoint
  rest.get(`${API_BASE_URL}/overview`, (req, res, ctx) => {
    // You can handle query parameters
    const dateRange = req.url.searchParams.get('dateRange') || 'last-30-days';
    console.log(`MSW intercepted: GET /api/overview with dateRange=${dateRange}`);
    
    // Return a mocked response
    return res(
      ctx.status(200),
      ctx.json(mockData.overview)
    );
  }),
  
  // Campaigns endpoint
  rest.get(`${API_BASE_URL}/campaigns`, (req, res, ctx) => {
    const dateRange = req.url.searchParams.get('dateRange') || 'last-30-days';
    console.log(`MSW intercepted: GET /api/campaigns with dateRange=${dateRange}`);
    
    return res(
      ctx.status(200),
      ctx.json(mockData.campaigns)
    );
  }),
  
  // Flows endpoint
  rest.get(`${API_BASE_URL}/flows`, (req, res, ctx) => {
    const dateRange = req.url.searchParams.get('dateRange') || 'last-30-days';
    console.log(`MSW intercepted: GET /api/flows with dateRange=${dateRange}`);
    
    return res(
      ctx.status(200),
      ctx.json(mockData.flows)
    );
  }),
  
  // Forms endpoint
  rest.get(`${API_BASE_URL}/forms`, (req, res, ctx) => {
    const dateRange = req.url.searchParams.get('dateRange') || 'last-30-days';
    console.log(`MSW intercepted: GET /api/forms with dateRange=${dateRange}`);
    
    return res(
      ctx.status(200),
      ctx.json(mockData.forms)
    );
  }),
  
  // Segments endpoint
  rest.get(`${API_BASE_URL}/segments`, (req, res, ctx) => {
    const dateRange = req.url.searchParams.get('dateRange') || 'last-30-days';
    console.log(`MSW intercepted: GET /api/segments with dateRange=${dateRange}`);
    
    return res(
      ctx.status(200),
      ctx.json(mockData.segments)
    );
  }),
  
  // Charts endpoint
  rest.get(`${API_BASE_URL}/charts`, (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockData.charts)
    );
  }),
  
  // Individual chart endpoints
  rest.get(`${API_BASE_URL}/charts/revenue`, (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockData.charts.revenueOverTime)
    );
  }),
  
  rest.get(`${API_BASE_URL}/charts/distribution`, (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockData.charts.channelDistribution)
    );
  }),
  
  rest.get(`${API_BASE_URL}/charts/top-segments`, (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockData.charts.topSegments)
    );
  }),
  
  rest.get(`${API_BASE_URL}/charts/top-flows`, (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockData.charts.topFlows)
    );
  }),
  
  rest.get(`${API_BASE_URL}/charts/top-forms`, (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockData.charts.topForms)
    );
  }),
  
  // Health check endpoint
  rest.get(`${API_BASE_URL}/health`, (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ status: 'ok', mode: 'msw' })
    );
  }),
  
  // Error simulation endpoint
  rest.get(`${API_BASE_URL}/error-test`, (req, res, ctx) => {
    const errorType = req.url.searchParams.get('type');
    
    switch(errorType) {
      case 'rate-limit':
        return res(
          ctx.status(429),
          ctx.json({ error: 'Too many requests' })
        );
      case 'server-error':
        return res(
          ctx.status(500),
          ctx.json({ error: 'Internal server error' })
        );
      case 'unauthorized':
        return res(
          ctx.status(401),
          ctx.json({ error: 'Invalid API key' })
        );
      default:
        return res(
          ctx.status(400),
          ctx.json({ error: 'Bad request' })
        );
    }
  })
];
