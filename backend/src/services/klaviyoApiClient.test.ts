import { KlaviyoApiClient } from './klaviyoApiClient';
import { FilterParam } from '../utils/jsonApiUtils';
import fetch from 'node-fetch';

// Mock node-fetch
jest.mock('node-fetch');
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('KlaviyoApiClient', () => {
  let client: KlaviyoApiClient;
  const mockApiKey = 'test-api-key';
  
  beforeEach(() => {
    client = new KlaviyoApiClient(mockApiKey);
    jest.clearAllMocks();
    
    // Setup default mock response
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ data: [] }),
      text: jest.fn().mockResolvedValue(''),
    };
    mockedFetch.mockResolvedValue(mockResponse as any);
  });
  
  it('should throw an error if no API key is provided', () => {
    expect(() => new KlaviyoApiClient('')).toThrow('Klaviyo API key is required');
  });
  
  it('should make a GET request with the correct headers', async () => {
    await client.get('campaigns');
    
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    
    const [url, options] = mockedFetch.mock.calls[0];
    expect(url).toContain('https://a.klaviyo.com/api/campaigns');
    expect(options).toEqual({
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mockApiKey}`,
        'Accept': 'application/json',
        'revision': '2023-07-15',
        'Content-Type': 'application/json',
      },
    });
  });
  
  it('should include query parameters in the URL', async () => {
    await client.get('campaigns', { 'filter': 'test-filter', 'include': 'test-include' });
    
    const [url] = mockedFetch.mock.calls[0];
    expect(url).toContain('filter=test-filter');
    expect(url).toContain('include=test-include');
  });
  
  it('should throw an error if the response is not ok', async () => {
    // Create a client with no retries to avoid timeout
    const noRetryClient = new KlaviyoApiClient(mockApiKey, '2023-07-15', 0);
    
    const errorResponse = {
      ok: false,
      status: 401,
      text: jest.fn().mockResolvedValue('Unauthorized'),
    };
    mockedFetch.mockResolvedValue(errorResponse as any);
    
    await expect(noRetryClient.get('campaigns')).rejects.toThrow('Klaviyo API error (401): Unauthorized');
  }, 10000); // Increase timeout just in case
  
  it('should return the JSON response if successful', async () => {
    const mockData = { data: [{ id: '1', type: 'campaign' }] };
    const successResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockData),
    };
    mockedFetch.mockResolvedValue(successResponse as any);
    
    const result = await client.get('campaigns');
    expect(result).toEqual(mockData);
  });
  
  // Test specific API methods
  describe('API methods', () => {
    const mockDateRange = {
      start: '2023-01-01T00:00:00.000Z',
      end: '2023-01-31T23:59:59.999Z',
    };
    
    it('should call getCampaigns with correct parameters', async () => {
      await client.getCampaigns(mockDateRange);
      
      const [url] = mockedFetch.mock.calls[0];
      expect(url).toContain('campaigns');
      expect(url).toContain('messages.channel');
      expect(url).toContain('include=tags');
      expect(url).toContain('fields');
    });
    
    it('should call getFlows with correct parameters', async () => {
      await client.getFlows();
      
      const [url] = mockedFetch.mock.calls[0];
      expect(url).toContain('flows');
      expect(url).toContain('include=tags');
      expect(url).toContain('fields');
      expect(url).toContain('page');
    });
    
    it('should call getEvents with correct parameters', async () => {
      const additionalFilters: FilterParam[] = [
        {
          field: 'metric.id',
          operator: 'equals',
          value: 'opened-email'
        }
      ];
      
      await client.getEvents(mockDateRange, additionalFilters);
      
      const [url] = mockedFetch.mock.calls[0];
      expect(url).toContain('events');
      expect(url).toContain(`datetime`);
      expect(url).toContain(`metric.id`);
      expect(url).toContain('opened-email');
    });
  });
});
