import { http } from 'msw';
import mockData from './mockData';

// Define the base URL for the API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Helper function to filter data by date range
 */
const filterDataByDateRange = (data: any[], dateRange: string | null, dateField: string = 'date') => {
  if (!dateRange) {
    return data;
  }
  
  // Handle predefined date ranges
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let startDate: Date;
  let endDate: Date = today;
  
  switch (dateRange) {
    case 'last-7-days':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      break;
    case 'last-30-days':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
      break;
    case 'last-90-days':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 90);
      break;
    case 'this-month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'last-month':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    case 'this-year':
      startDate = new Date(today.getFullYear(), 0, 1);
      break;
    default:
      // Handle custom date range format: 'YYYY-MM-DD,YYYY-MM-DD'
      if (dateRange.includes(',')) {
        const [start, end] = dateRange.split(',');
        startDate = new Date(start);
        endDate = new Date(end);
      } else {
        // Default to last 30 days if format is not recognized
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
      }
  }
  
  // For data with date field, filter by date range
  if (data.length > 0 && data[0][dateField]) {
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }
  
  // For data without date field, return all data
  return data;
};

/**
 * MSW handlers for mocking API requests
 */
export const handlers = [
  // Overview endpoint
  http.get(`${API_BASE_URL}/overview`, ({ request, params }) => {
    // You can handle query parameters
    const url = new URL(request.url);
    const dateRange = url.searchParams.get('dateRange') || 'last-30-days';
    console.log(`MSW intercepted: GET /api/overview with dateRange=${dateRange}`);
    
    return Response.json(mockData.overview);
  }),
  
  // Campaigns endpoint
  http.get(`${API_BASE_URL}/campaigns`, ({ request }) => {
    const url = new URL(request.url);
    const dateRange = url.searchParams.get('dateRange') || 'last-30-days';
    console.log(`MSW intercepted: GET /api/campaigns with dateRange=${dateRange}`);
    
    return Response.json(mockData.campaigns);
  }),
  
  // Flows endpoint
  http.get(`${API_BASE_URL}/flows`, ({ request }) => {
    const url = new URL(request.url);
    const dateRange = url.searchParams.get('dateRange') || 'last-30-days';
    console.log(`MSW intercepted: GET /api/flows with dateRange=${dateRange}`);
    
    return Response.json(mockData.flows);
  }),
  
  // Forms endpoint
  http.get(`${API_BASE_URL}/forms`, ({ request }) => {
    const url = new URL(request.url);
    const dateRange = url.searchParams.get('dateRange') || 'last-30-days';
    console.log(`MSW intercepted: GET /api/forms with dateRange=${dateRange}`);
    
    return Response.json(mockData.forms);
  }),
  
  // Segments endpoint
  http.get(`${API_BASE_URL}/segments`, ({ request }) => {
    const url = new URL(request.url);
    const dateRange = url.searchParams.get('dateRange') || 'last-30-days';
    console.log(`MSW intercepted: GET /api/segments with dateRange=${dateRange}`);
    
    return Response.json(mockData.segments);
  }),
  
  // Charts endpoint
  http.get(`${API_BASE_URL}/charts`, () => {
    return Response.json(mockData.charts);
  }),
  
  // Individual chart endpoints with date range filtering
  http.get(`${API_BASE_URL}/charts/revenue`, ({ request }) => {
    const url = new URL(request.url);
    const dateRange = url.searchParams.get('dateRange');
    console.log(`MSW intercepted: GET /api/charts/revenue with dateRange=${dateRange}`);
    
    // Get the current date for filtering
    const now = new Date('2025-03-19'); // Fixed date for consistent mock data
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate: Date;
    let endDate: Date = today;
    
    // Determine date range
    switch (dateRange) {
      case 'last-7-days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'last-30-days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        break;
      case 'last-90-days':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 90);
        break;
      case 'this-month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'last-month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'this-year':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        // Default to last 30 days
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
    }
    
    // Filter data based on date range
    const filteredData = mockData.charts.revenueOverTime.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });
    
    return Response.json(filteredData);
  }),
  
  http.get(`${API_BASE_URL}/charts/distribution`, ({ request }) => {
    const url = new URL(request.url);
    const dateRange = url.searchParams.get('dateRange');
    console.log(`MSW intercepted: GET /api/charts/distribution with dateRange=${dateRange}`);
    
    // Get the distribution data for the specified range, fallback to last-30-days if range not found
    const range = dateRange || 'last-30-days';
    const validRanges = ['last-7-days', 'last-30-days', 'last-90-days'] as const;
    const validRange = validRanges.includes(range as any) ? range as keyof typeof mockData.charts.channelDistribution : 'last-30-days';
    const data = mockData.charts.channelDistribution[validRange];
    console.log('Sending distribution data:', data);
    return Response.json(data);
  }),
  
  http.get(`${API_BASE_URL}/charts/top-segments`, ({ request }) => {
    const url = new URL(request.url);
    const dateRange = url.searchParams.get('dateRange');
    console.log(`MSW intercepted: GET /api/charts/top-segments with dateRange=${dateRange}`);
    
    // For top segments, we don't filter by date since it's a snapshot
    return Response.json(mockData.charts.topSegments);
  }),
  
  http.get(`${API_BASE_URL}/charts/top-flows`, ({ request }) => {
    const url = new URL(request.url);
    const dateRange = url.searchParams.get('dateRange');
    console.log(`MSW intercepted: GET /api/charts/top-flows with dateRange=${dateRange}`);
    
    // For top flows, we don't filter by date since it's a snapshot
    return Response.json(mockData.charts.topFlows);
  }),
  
  http.get(`${API_BASE_URL}/charts/top-forms`, ({ request }) => {
    const url = new URL(request.url);
    const dateRange = url.searchParams.get('dateRange');
    console.log(`MSW intercepted: GET /api/charts/top-forms with dateRange=${dateRange}`);
    
    // For top forms, we don't filter by date since it's a snapshot
    return Response.json(mockData.charts.topForms);
  }),
  
  // Health check endpoint
  http.get(`${API_BASE_URL}/health`, () => {
    return Response.json({ status: 'ok', mode: 'msw' });
  }),
  
  // Error simulation endpoint
  http.get(`${API_BASE_URL}/error-test`, ({ request }) => {
    const url = new URL(request.url);
    const errorType = url.searchParams.get('type');
    
    switch(errorType) {
      case 'rate-limit':
        return new Response(
          JSON.stringify({ error: 'Too many requests' }),
          { status: 429 }
        );
      case 'server-error':
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          { status: 500 }
        );
      case 'unauthorized':
        return new Response(
          JSON.stringify({ error: 'Invalid API key' }),
          { status: 401 }
        );
      default:
        return new Response(
          JSON.stringify({ error: 'Bad request' }),
          { status: 400 }
        );
    }
  })
];
