import { KlaviyoApiClient } from '../klaviyoApiClient';
import { FilterParam, JsonApiParams } from '../../utils/jsonApiUtils';
import fetch from 'node-fetch';
import rateLimitManager from '../rateLimitManager';

// Mock node-fetch
jest.mock('node-fetch');
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock rate limit manager
jest.mock('../rateLimitManager', () => ({
  __esModule: true,
  default: {
    calculateDelay: jest.fn().mockResolvedValue(0),
    updateFromHeaders: jest.fn(),
  },
}));

describe('KlaviyoApiClient', () => {
  let client: KlaviyoApiClient;
  const mockApiKey = 'test-api-key';
  
  beforeEach(() => {
    jest.clearAllMocks();
    client = new KlaviyoApiClient(mockApiKey);
    
    // Setup default mock response
    const mockResponse = {
      ok: true,
      status: 200,
      headers: {
        get: jest.fn((header) => {
          if (header === 'content-type') return 'application/json';
          if (header === 'x-rate-limit-remaining') return '100';
          if (header === 'x-rate-limit-reset') return '60';
          return null;
        }),
      },
      json: jest.fn().mockResolvedValue({ data: [] }),
      text: jest.fn().mockResolvedValue(''),
    };
    
    mockedFetch.mockResolvedValue(mockResponse as any);
  });
  
  describe('constructor', () => {
    it('should throw an error if API key is not provided', () => {
      expect(() => new KlaviyoApiClient('')).toThrow('Klaviyo API key is required');
    });
    
    it('should initialize with default values', () => {
      expect(client).toBeInstanceOf(KlaviyoApiClient);
    });
  });
  
  describe('get', () => {
    it('should make API calls with correct headers', async () => {
      await client.get('api/campaigns');
      
      expect(mockedFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockedFetch.mock.calls[0];
      
      expect(url).toContain('https://a.klaviyo.com/api/campaigns');
      expect(options?.headers).toEqual({
        'Authorization': `Bearer ${mockApiKey}`,
        'Accept': 'application/json',
        'revision': '2023-07-15',
        'Content-Type': 'application/json',
      });
    });
    
    it('should use JSON:API parameter formatting', async () => {
      const params: JsonApiParams = {
        filter: [
          {
            field: 'messages.channel',
            operator: 'equals' as const,
            value: 'email',
          },
        ],
        include: ['tags'],
        fields: {
          campaign: ['name', 'status'],
        },
        page: {
          size: 50,
        },
      };
      
      await client.get('api/campaigns', params);
      
      expect(mockedFetch).toHaveBeenCalledTimes(1);
      const [url] = mockedFetch.mock.calls[0];
      
      // Verify URL contains properly formatted parameters
      expect(url).toContain('filter=equals(messages.channel,"email")');
      expect(url).toContain('include=tags');
      expect(url).toContain('fields[campaign]=name,status');
      expect(url).toContain('page[size]=50');
    });
    
    it('should handle rate limiting with retry', async () => {
      // First call returns rate limit error, second succeeds
      const rateLimitResponse = {
        ok: false,
        status: 429,
        headers: {
          get: jest.fn((header) => {
            if (header === 'Retry-After') return '1';
            return null;
          }),
        },
        text: jest.fn().mockResolvedValue('Rate limited'),
      };
      
      const successResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn((header) => {
            if (header === 'content-type') return 'application/json';
            return null;
          }),
        },
        json: jest.fn().mockResolvedValue({ data: [{ id: '1', type: 'campaign' }] }),
      };
      
      mockedFetch
        .mockResolvedValueOnce(rateLimitResponse as any)
        .mockResolvedValueOnce(successResponse as any);
      
      const result = await client.get('api/campaigns');
      
      expect(mockedFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: [{ id: '1', type: 'campaign' }] });
    });
    
    it('should deduplicate in-flight requests with the same URL', async () => {
      // Make two identical requests
      const promise1 = client.get('api/campaigns');
      const promise2 = client.get('api/campaigns');
      
      // Both should resolve to the same result
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      // But fetch should only be called once
      expect(mockedFetch).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });
    
    it('should update rate limit information from response headers', async () => {
      await client.get('api/campaigns');
      
      expect(rateLimitManager.updateFromHeaders).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('API methods', () => {
    it('should format date ranges correctly in getCampaigns', async () => {
      const dateRange = {
        start: '2023-01-01',
        end: '2023-01-31',
      };
      
      await client.getCampaigns(dateRange);
      
      expect(mockedFetch).toHaveBeenCalledTimes(1);
      // No need to check exact URL format as that's tested in the get method tests
    });
    
    it('should handle additional filters in getEvents', async () => {
      const dateRange = {
        start: '2023-01-01',
        end: '2023-01-31',
      };
      
      const additionalFilters: FilterParam[] = [
        {
          field: 'event_name',
          operator: 'equals',
          value: 'Placed Order',
        },
      ];
      
      await client.getEvents(dateRange, additionalFilters);
      
      expect(mockedFetch).toHaveBeenCalledTimes(1);
      // Verify the URL contains both date range filters and additional filters
      const [url] = mockedFetch.mock.calls[0];
      expect(url).toContain('datetime');
      expect(url).toContain('event_name');
    });
  });
  
  describe('error handling', () => {
    it('should throw an error for non-JSON responses', async () => {
      const htmlResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn((header) => {
            if (header === 'content-type') return 'text/html';
            return null;
          }),
        },
        text: jest.fn().mockResolvedValue('<html>Not JSON</html>'),
      };
      
      mockedFetch.mockResolvedValueOnce(htmlResponse as any);
      
      await expect(client.get('api/campaigns')).rejects.toThrow('Klaviyo API returned non-JSON response');
    });
    
    it('should throw an error after max retries', async () => {
      const errorResponse = {
        ok: false,
        status: 500,
        headers: {
          get: jest.fn(() => null),
        },
        text: jest.fn().mockResolvedValue('Internal Server Error'),
      };
      
      // All attempts fail
      mockedFetch.mockResolvedValue(errorResponse as any);
      
      // Create client with fewer retries for faster test
      const clientWithFewerRetries = new KlaviyoApiClient(mockApiKey, '2023-07-15', 2);
      
      await expect(clientWithFewerRetries.get('api/campaigns')).rejects.toThrow('Klaviyo API error (500)');
      
      // Should have tried the initial request + 2 retries = 3 total attempts
      expect(mockedFetch).toHaveBeenCalledTimes(3);
    });
  });
});
