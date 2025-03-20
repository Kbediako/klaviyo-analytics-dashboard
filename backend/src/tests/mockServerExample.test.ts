import request from 'supertest';
import { createMockServer, mockData } from './mockServer';
// Import Jest functions explicitly
import { describe, it, expect } from '@jest/globals';

/**
 * This test file demonstrates how to use the mock server for testing without live API calls.
 * It uses supertest to make requests to the mock server and verifies the responses.
 */
describe('Mock Server Example Tests', () => {
  const app = createMockServer();

  describe('GET /api/overview', () => {
    it('should return overview data with the correct structure', async () => {
      const response = await request(app)
        .get('/api/overview')
        .expect(200);
      
      // Verify the response structure matches what the frontend expects
      expect(response.body).toHaveProperty('revenue.current');
      expect(response.body).toHaveProperty('revenue.change');
      expect(response.body).toHaveProperty('subscribers.current');
      expect(response.body).toHaveProperty('subscribers.change');
      expect(response.body).toHaveProperty('conversionRate.current');
      expect(response.body).toHaveProperty('conversionRate.change');
      expect(response.body).toHaveProperty('formSubmissions.current');
      expect(response.body).toHaveProperty('formSubmissions.change');
    });

    it('should handle date range filtering correctly', async () => {
      const dateRanges = ['last-7-days', 'last-30-days', 'last-90-days'];
      
      for (const range of dateRanges) {
        const response = await request(app)
          .get(`/api/overview?dateRange=${range}`)
          .expect(200);
        
        // Verify the response has the correct structure
        expect(response.body).toHaveProperty('revenue.current');
        expect(response.body).toHaveProperty('revenue.change');
        
        // Verify the revenue is calculated correctly based on the date range
        const revenueData = mockData.charts.revenueOverTime;
        const today = new Date('2025-03-19');
        const startDate = new Date(today);
        
        switch (range) {
          case 'last-7-days':
            startDate.setDate(today.getDate() - 7);
            break;
          case 'last-30-days':
            startDate.setDate(today.getDate() - 30);
            break;
          case 'last-90-days':
            startDate.setDate(today.getDate() - 90);
            break;
        }
        
        const filteredData = revenueData.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= startDate && itemDate <= today;
        });
        
        const expectedRevenue = Math.round(filteredData.reduce((sum, item) => 
          sum + item.campaigns + item.flows + item.forms + item.other, 0));
        
        expect(response.body.revenue.current).toBe(expectedRevenue);
      }
    });
  });

  describe('GET /api/campaigns', () => {
    it('should return an array of campaigns', async () => {
      const response = await request(app)
        .get('/api/campaigns')
        .expect(200);
      
      // Verify the response is an array
      expect(Array.isArray(response.body)).toBe(true);
      
      // Verify each campaign has the expected structure
      response.body.forEach((campaign: any) => {
        expect(campaign).toHaveProperty('id');
        expect(campaign).toHaveProperty('name');
        expect(campaign).toHaveProperty('revenue');
      });
    });

    it('should adjust campaign revenue based on date range', async () => {
      const response = await request(app)
        .get('/api/campaigns?dateRange=last-7-days')
        .expect(200);
      
      // Verify revenue is calculated from the last 7 days of data
      const revenueData = mockData.charts.revenueOverTime.slice(-7);
      const expectedRevenue = Math.round(revenueData.reduce((sum, item) => 
        sum + item.campaigns / mockData.campaigns.length, 0));
      
      response.body.forEach((campaign: any) => {
        expect(campaign.revenue).toBe(expectedRevenue);
      });
    });
  });

  describe('GET /api/charts/revenue', () => {
    it('should filter revenue data by date range', async () => {
      const response = await request(app)
        .get('/api/charts/revenue?dateRange=last-7-days')
        .expect(200);
      
      // Verify we get exactly 7 days of data
      expect(response.body.length).toBe(7);
      
      // Verify the dates are within the last 7 days
      const today = new Date('2025-03-19');
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      
      response.body.forEach((item: any) => {
        const itemDate = new Date(item.date);
        expect(itemDate >= sevenDaysAgo && itemDate <= today).toBe(true);
      });
    });
  });

  describe('GET /api/charts/distribution', () => {
    it('should return correct distribution data for different date ranges', async () => {
      const dateRanges = ['last-7-days', 'last-30-days', 'last-90-days'] as const;
      
      for (const range of dateRanges) {
        const response = await request(app)
          .get(`/api/charts/distribution?dateRange=${range}`)
          .expect(200);
        
        // Verify the response matches the mock data for the given range
        expect(response.body).toEqual(mockData.charts.channelDistribution[range as keyof typeof mockData.charts.channelDistribution]);
      }
    });
  });

  describe('GET /api/error-test', () => {
    it('should return a 429 status for rate limit errors', async () => {
      const response = await request(app)
        .get('/api/error-test?type=rate-limit')
        .expect(429);
      
      expect(response.body).toHaveProperty('error', 'Too many requests');
    });

    it('should return a 500 status for server errors', async () => {
      const response = await request(app)
        .get('/api/error-test?type=server-error')
        .expect(500);
      
      expect(response.body).toHaveProperty('error', 'Internal server error');
    });

    it('should return a 401 status for unauthorized errors', async () => {
      const response = await request(app)
        .get('/api/error-test?type=unauthorized')
        .expect(401);
      
      expect(response.body).toHaveProperty('error', 'Invalid API key');
    });
  });

  describe('GET /api/health', () => {
    it('should return a health check response', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('mode', 'mock');
    });
  });
});

/**
 * Example of how to use the mock server in a frontend test
 * 
 * This is a pseudo-code example that demonstrates how you might use
 * the mock server in a frontend test with a tool like Cypress or Playwright.
 * 
 * ```typescript
 * // Start the mock server before tests
 * beforeAll(async () => {
 *   // Start the mock server on port 3002
 *   mockServer = await startMockServer(3002);
 *   
 *   // Configure the frontend to use the mock server
 *   process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3002/api';
 * });
 * 
 * // Stop the mock server after tests
 * afterAll(async () => {
 *   await stopMockServer(mockServer);
 * });
 * 
 * test('Dashboard displays correct metrics', async () => {
 *   // Visit the dashboard page
 *   await page.goto('http://localhost:3000');
 *   
 *   // Check that the revenue metric is displayed correctly
 *   const revenueValue = await page.textContent('[data-testid="revenue-value"]');
 *   expect(revenueValue).toBe('$12,500');
 *   
 *   // Check that the revenue change is displayed correctly
 *   const revenueChange = await page.textContent('[data-testid="revenue-change"]');
 *   expect(revenueChange).toBe('+15%');
 * });
 * ```
 */
