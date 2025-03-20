import { KlaviyoApiClient } from '../klaviyoApiClient';
import nock from 'nock';
import rateLimitManager from '../rateLimitManager';
import { FilterParam } from '../../utils/jsonApiUtils';

// Mock rateLimitManager
jest.mock('../rateLimitManager', () => ({
  calculateDelay: jest.fn().mockResolvedValue(0),
  updateFromHeaders: jest.fn(),
  getInstance: jest.fn().mockReturnValue({
    calculateDelay: jest.fn().mockResolvedValue(0),
    updateFromHeaders: jest.fn()
  })
}));

describe('KlaviyoApiClient', () => {
  let client: KlaviyoApiClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();
    client = new KlaviyoApiClient('test-api-key');
  });
  
  afterAll(() => {
    nock.restore();
  });
  
  describe('Constructor', () => {
    it('should throw an error if no API key is provided', () => {
      expect(() => new KlaviyoApiClient('')).toThrow('Klaviyo API key is required');
    });
    
    it('should use default values if not provided', () => {
      const client = new KlaviyoApiClient('test-api-key');
      // @ts-ignore - accessing private properties for testing
      expect(client.apiVersion).toBe('2023-07-15');
      // @ts-ignore - accessing private properties for testing
      expect(client.maxRetries).toBe(5);
      // @ts-ignore - accessing private properties for testing
      expect(client.retryDelay).toBe(2000);
    });
    
    it('should use provided values', () => {
      const client = new KlaviyoApiClient('test-api-key', 'custom-version', 10, 5000);
      // @ts-ignore - accessing private properties for testing
      expect(client.apiVersion).toBe('custom-version');
      // @ts-ignore - accessing private properties for testing
      expect(client.maxRetries).toBe(10);
      // @ts-ignore - accessing private properties for testing
      expect(client.retryDelay).toBe(5000);
    });
  });
  
  describe('get', () => {
    it('should make API calls with correct headers', async () => {
      const scope = nock('https://a.klaviyo.com')
        .get('/api/metrics')
        .matchHeader('Authorization', 'Bearer test-api-key')
        .matchHeader('revision', '2023-07-15')
        .matchHeader('Accept', 'application/json')
        .matchHeader('Content-Type', 'application/json')
        .reply(200, { data: [] });
      
      await client.get('/api/metrics');
      
      expect(scope.isDone()).toBeTruthy();
    });
    
    it('should handle query parameters correctly', async () => {
      const scope = nock('https://a.klaviyo.com')
        .get('/api/metrics?param1=value1&param2=value2')
        .reply(200, { data: [] });
      
      await client.get('/api/metrics', { param1: 'value1', param2: 'value2' });
      
      expect(scope.isDone()).toBeTruthy();
    });
    
    it('should handle JSON:API parameters correctly', async () => {
      const scope = nock('https://a.klaviyo.com')
        .get('/api/metrics?filter=equals(status,"active")')
        .reply(200, { data: [] });
      
      await client.get('/api/metrics', {
        filter: [
          {
            field: 'status',
            operator: 'equals',
            value: 'active'
          }
        ]
      });
      
      expect(scope.isDone()).toBeTruthy();
    });
    
    it('should retry on rate limiting', async () => {
      // First request returns 429 (rate limit)
      const scope1 = nock('https://a.klaviyo.com')
        .get('/api/metrics')
        .reply(429, {}, { 'Retry-After': '1' });
      
      // Second request succeeds
      const scope2 = nock('https://a.klaviyo.com')
        .get('/api/metrics')
        .reply(200, { data: [] });
      
      await client.get('/api/metrics');
      
      expect(scope1.isDone()).toBeTruthy();
      expect(scope2.isDone()).toBeTruthy();
    });
    
    it('should handle non-JSON responses', async () => {
      const scope = nock('https://a.klaviyo.com')
        .get('/api/metrics')
        .reply(200, 'Not JSON', { 'Content-Type': 'text/plain' });
      
      await expect(client.get('/api/metrics')).rejects.toThrow('Klaviyo API returned non-JSON response');
      
      expect(scope.isDone()).toBeTruthy();
    });
    
    it('should handle server errors', async () => {
      const scope = nock('https://a.klaviyo.com')
        .get('/api/metrics')
        .reply(500, 'Internal Server Error');
      
      await expect(client.get('/api/metrics')).rejects.toThrow('Klaviyo API error (500)');
      
      expect(scope.isDone()).toBeTruthy();
    });
    
    it('should deduplicate in-flight requests with the same URL', async () => {
      const scope = nock('https://a.klaviyo.com')
        .get('/api/metrics')
        .reply(200, { data: [] });
      
      // Make two requests with the same URL
      const promise1 = client.get('/api/metrics');
      const promise2 = client.get('/api/metrics');
      
      // Both promises should resolve to the same response
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      // The nock scope should only be called once
      expect(scope.isDone()).toBeTruthy();
      expect(result1).toEqual(result2);
    });
    
    it('should update rate limit information from response headers', async () => {
      const headers = {
        'x-rate-limit-remaining': '100',
        'x-rate-limit-reset': '60'
      };
      
      const scope = nock('https://a.klaviyo.com')
        .get('/api/metrics')
        .reply(200, { data: [] }, headers);
      
      await client.get('/api/metrics');
      
      expect(scope.isDone()).toBeTruthy();
      expect(rateLimitManager.updateFromHeaders).toHaveBeenCalledWith('api/metrics', expect.anything());
    });
    
    it('should calculate delay based on rate limits', async () => {
      const scope = nock('https://a.klaviyo.com')
        .get('/api/metrics')
        .reply(200, { data: [] });
      
      await client.get('/api/metrics');
      
      expect(scope.isDone()).toBeTruthy();
      expect(rateLimitManager.calculateDelay).toHaveBeenCalledWith('api/metrics');
    });
  });
  
  describe('API methods', () => {
    const mockDateRange = {
      start: '2023-01-01T00:00:00.000Z',
      end: '2023-01-31T23:59:59.999Z',
    };
    
    it('should call getCampaigns with correct parameters', async () => {
      const scope = nock('https://a.klaviyo.com')
        .get(/\/api\/campaigns/)
        .reply(200, { data: [] });
      
      await client.getCampaigns(mockDateRange);
      
      expect(scope.isDone()).toBeTruthy();
    });
    
    it('should call getFlows with correct parameters', async () => {
      const scope = nock('https://a.klaviyo.com')
        .get(/\/api\/flows/)
        .reply(200, { data: [] });
      
      await client.getFlows();
      
      expect(scope.isDone()).toBeTruthy();
    });
    
    it('should call getFlowMessages with correct parameters', async () => {
      const scope = nock('https://a.klaviyo.com')
        .get(/\/api\/flow-messages/)
        .reply(200, { data: [] });
      
      await client.getFlowMessages(mockDateRange);
      
      expect(scope.isDone()).toBeTruthy();
    });
    
    it('should call getMetrics with correct parameters', async () => {
      const scope = nock('https://a.klaviyo.com')
        .get(/\/api\/metrics/)
        .reply(200, { data: [] });
      
      await client.getMetrics();
      
      expect(scope.isDone()).toBeTruthy();
    });
    
    it('should call getMetricAggregates with correct parameters', async () => {
      const metricId = 'test-metric-id';
      const scope = nock('https://a.klaviyo.com')
        .get(/\/api\/metric-aggregates\/test-metric-id/)
        .reply(200, { data: [] });
      
      await client.getMetricAggregates(metricId, mockDateRange);
      
      expect(scope.isDone()).toBeTruthy();
    });
    
    it('should call getProfiles with correct parameters', async () => {
      const scope = nock('https://a.klaviyo.com')
        .get(/\/api\/profiles/)
        .reply(200, { data: [] });
      
      await client.getProfiles(mockDateRange);
      
      expect(scope.isDone()).toBeTruthy();
    });
    
    it('should call getSegments with correct parameters', async () => {
      const scope = nock('https://a.klaviyo.com')
        .get(/\/api\/segments/)
        .reply(200, { data: [] });
      
      await client.getSegments();
      
      expect(scope.isDone()).toBeTruthy();
    });
    
    it('should call getEvents with correct parameters', async () => {
      const scope = nock('https://a.klaviyo.com')
        .get(/\/api\/events/)
        .reply(200, { data: [] });
      
      await client.getEvents(mockDateRange);
      
      expect(scope.isDone()).toBeTruthy();
    });
    
    it('should call getEvents with additional filters', async () => {
      const additionalFilters: FilterParam[] = [
        {
          field: 'metric.id',
          operator: 'equals',
          value: 'opened-email'
        }
      ];
      
      const scope = nock('https://a.klaviyo.com')
        .get(/\/api\/events/)
        .reply(200, { data: [] });
      
      await client.getEvents(mockDateRange, additionalFilters);
      
      expect(scope.isDone()).toBeTruthy();
    });
    
    it('should handle API errors gracefully', async () => {
      const scope = nock('https://a.klaviyo.com')
        .get(/\/api\/campaigns/)
        .replyWithError('Network error');
      
      const result = await client.getCampaigns(mockDateRange);
      
      expect(scope.isDone()).toBeTruthy();
      expect(result).toEqual({ data: [] });
    });
  });
  
  describe('executeWithRetries', () => {
    it('should retry failed requests up to maxRetries', async () => {
      // Create a client with 2 retries
      const client = new KlaviyoApiClient('test-api-key', '2023-07-15', 2, 100);
      
      // Mock 3 failed requests (initial + 2 retries)
      const scope1 = nock('https://a.klaviyo.com')
        .get('/api/metrics')
        .replyWithError('Network error 1');
      
      const scope2 = nock('https://a.klaviyo.com')
        .get('/api/metrics')
        .replyWithError('Network error 2');
      
      const scope3 = nock('https://a.klaviyo.com')
        .get('/api/metrics')
        .replyWithError('Network error 3');
      
      // Should fail after maxRetries
      await expect(client.get('/api/metrics')).rejects.toThrow('Network error 3');
      
      expect(scope1.isDone()).toBeTruthy();
      expect(scope2.isDone()).toBeTruthy();
      expect(scope3.isDone()).toBeTruthy();
    });
    
    it('should succeed if a retry succeeds', async () => {
      // Create a client with 2 retries
      const client = new KlaviyoApiClient('test-api-key', '2023-07-15', 2, 100);
      
      // First request fails
      const scope1 = nock('https://a.klaviyo.com')
        .get('/api/metrics')
        .replyWithError('Network error');
      
      // Second request succeeds
      const scope2 = nock('https://a.klaviyo.com')
        .get('/api/metrics')
        .reply(200, { data: [{ id: 'metric-1' }] });
      
      const result = await client.get('/api/metrics');
      
      expect(scope1.isDone()).toBeTruthy();
      expect(scope2.isDone()).toBeTruthy();
      expect(result).toEqual({ data: [{ id: 'metric-1' }] });
    });
  });
});
