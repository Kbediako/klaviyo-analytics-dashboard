import { KlaviyoApiClient, KlaviyoApiResponse } from './klaviyoApiClient';
import { FilterParam } from '../utils/jsonApiUtils';
import fetch from 'node-fetch';
import { 
  ApiError, 
  AuthenticationError, 
  RateLimitError, 
  NotFoundError,
  ValidationError,
  ServerError,
  NetworkError,
  TimeoutError
} from '../utils/apiErrors';

// Define test types
interface Campaign {
  id: string;
  type: string;
  attributes: {
    name: string;
    status: string;
    created: string;
    updated: string;
    archived: boolean;
    send_time: string;
  };
  relationships?: {
    tags: {
      data: Array<{ id: string; type: string }>;
    };
  };
}

// Mock node-fetch
jest.mock('node-fetch');
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
  process.env.KLAVIYO_API_VERSION = '2023-12-15';
});

afterEach(() => {
  process.env = originalEnv;
});

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
      headers: {
        get: jest.fn().mockImplementation((name) => {
          if (name === 'content-type') return 'application/json';
          if (name === 'x-rate-limit-remaining') return '100';
          if (name === 'x-rate-limit-reset') return '60';
          return null;
        })
      }
    };
    mockedFetch.mockResolvedValue(mockResponse as any);
  });
  
  it('should throw an AuthenticationError if no API key is provided', () => {
    expect(() => new KlaviyoApiClient('')).toThrow(AuthenticationError);
    expect(() => new KlaviyoApiClient('')).toThrow('Klaviyo API key is required');
  });
  
  it('should use the API version from environment variables if available', () => {
    const client = new KlaviyoApiClient(mockApiKey);
    expect(client['apiVersion']).toBe('2023-12-15');
  });
  
  it('should use the provided API version if environment variable is not set', () => {
    delete process.env.KLAVIYO_API_VERSION;
    const client = new KlaviyoApiClient(mockApiKey, '2023-07-15');
    expect(client['apiVersion']).toBe('2023-07-15');
  });
  
  it('should use the default API version if neither environment variable nor parameter is provided', () => {
    delete process.env.KLAVIYO_API_VERSION;
    const client = new KlaviyoApiClient(mockApiKey);
    expect(client['apiVersion']).toBe('2025-01-15'); // Default version in the client
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
        'revision': '2023-12-15',
        'Content-Type': 'application/json',
      },
    });
  });
  
  it('should automatically add api/ prefix to endpoints if missing', async () => {
    await client.get('campaigns');
    
    const [url] = mockedFetch.mock.calls[0];
    expect(url).toContain('https://a.klaviyo.com/api/campaigns');
  });
  
  it('should not duplicate api/ prefix if already present', async () => {
    await client.get('api/campaigns');
    
    const [url] = mockedFetch.mock.calls[0];
    expect(url).toContain('https://a.klaviyo.com/api/campaigns');
    expect(url).not.toContain('https://a.klaviyo.com/api/api/campaigns');
  });
  
  it('should include query parameters in the URL', async () => {
    await client.get('campaigns', { 'filter': 'test-filter', 'include': 'test-include' });
    
    const [url] = mockedFetch.mock.calls[0];
    expect(url).toContain('filter=test-filter');
    expect(url).toContain('include=test-include');
  });
  
  it('should throw an AuthenticationError if the response is 401', async () => {
    // Create a client with no retries to avoid timeout
    const noRetryClient = new KlaviyoApiClient(mockApiKey, '2023-10-15', 0);
    
    const errorResponse = {
      ok: false,
      status: 401,
      text: jest.fn().mockResolvedValue('Unauthorized'),
      headers: {
        get: jest.fn().mockReturnValue(null)
      }
    };
    mockedFetch.mockResolvedValue(errorResponse as any);
    
    await expect(noRetryClient.get('campaigns')).rejects.toThrow(AuthenticationError);
    await expect(noRetryClient.get('campaigns')).rejects.toThrow('Klaviyo API error (401): Unauthorized');
  }, 10000); // Increase timeout just in case
  
  it('should throw a NotFoundError if the response is 404', async () => {
    // Create a client with no retries to avoid timeout
    const noRetryClient = new KlaviyoApiClient(mockApiKey, '2023-10-15', 0);
    
    const errorResponse = {
      ok: false,
      status: 404,
      text: jest.fn().mockResolvedValue('Not Found'),
      headers: {
        get: jest.fn().mockReturnValue(null)
      }
    };
    mockedFetch.mockResolvedValue(errorResponse as any);
    
    await expect(noRetryClient.get('campaigns')).rejects.toThrow(NotFoundError);
  }, 10000);
  
  it('should throw a RateLimitError if the response is 429', async () => {
    // Create a client with no retries to avoid timeout
    const noRetryClient = new KlaviyoApiClient(mockApiKey, '2023-10-15', 0);
    
    const errorResponse = {
      ok: false,
      status: 429,
      text: jest.fn().mockResolvedValue('Too Many Requests'),
      headers: {
        get: jest.fn().mockImplementation((name) => {
          if (name === 'Retry-After') return '60';
          return null;
        })
      }
    };
    mockedFetch.mockResolvedValue(errorResponse as any);
    
    await expect(noRetryClient.get('campaigns')).rejects.toThrow(RateLimitError);
  }, 10000);
  
  it('should return the JSON response if successful', async () => {
    const mockData = { data: [{ id: '1', type: 'campaign' }] };
    const successResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue(mockData),
      headers: {
        get: jest.fn().mockImplementation((name) => {
          if (name === 'content-type') return 'application/json';
          return null;
        })
      }
    };
    mockedFetch.mockResolvedValue(successResponse as any);
    
    const result = await client.get('campaigns');
    expect(result).toEqual(mockData);
  });
  
  it('should verify API key on initialization', async () => {
    // Mock the verifyApiKey method
    const verifyApiKeySpy = jest.spyOn(KlaviyoApiClient.prototype, 'verifyApiKey')
      .mockResolvedValue();
    
    // Call a method that triggers initialization
    await client.get('campaigns');
    
    // Verify that verifyApiKey was called
    expect(verifyApiKeySpy).toHaveBeenCalled();
    
    // Clean up
    verifyApiKeySpy.mockRestore();
  });
  
  it('should rotate API key successfully', async () => {
    // Mock the verifyApiKey method to succeed
    const verifyApiKeySpy = jest.spyOn(KlaviyoApiClient.prototype, 'verifyApiKey')
      .mockResolvedValue();
    
    const newApiKey = 'new-test-api-key';
    await client.rotateApiKey(newApiKey);
    
    // Verify that the API key was updated
    expect(client['apiKey']).toBe(newApiKey);
    
    // Clean up
    verifyApiKeySpy.mockRestore();
  });
  
  it('should throw an error when rotating to an invalid API key', async () => {
    // Mock the verifyApiKey method to fail
    const verifyApiKeySpy = jest.spyOn(KlaviyoApiClient.prototype, 'verifyApiKey')
      .mockRejectedValue(new AuthenticationError('Invalid API key'));
    
    const newApiKey = 'invalid-api-key';
    await expect(client.rotateApiKey(newApiKey)).rejects.toThrow(AuthenticationError);
    
    // Verify that the API key was not updated
    expect(client['apiKey']).toBe(mockApiKey);
    
    // Clean up
    verifyApiKeySpy.mockRestore();
  });
  
  it('should handle API version errors', async () => {
    // Create a client with no retries to avoid timeout
    const noRetryClient = new KlaviyoApiClient(mockApiKey, '2023-10-15', 0);
    
    const errorResponse = {
      ok: false,
      status: 400,
      text: jest.fn().mockResolvedValue('API version error'),
      headers: {
        get: jest.fn().mockImplementation((name) => {
          if (name === 'x-version-error') return 'Unsupported API version';
          return null;
        })
      }
    };
    mockedFetch.mockResolvedValue(errorResponse as any);
    
    // Mock verifyApiKey to test version error handling
    const verifyApiKeySpy = jest.spyOn(KlaviyoApiClient.prototype, 'verifyApiKey');
    
    try {
      await noRetryClient.initialize();
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).message).toContain('API version error');
    }
    
    verifyApiKeySpy.mockRestore();
  }, 10000);

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
    
    it('should handle type-safe responses', async () => {
      const mockData: KlaviyoApiResponse<Campaign> = { 
        data: [{ 
          id: '1', 
          type: 'campaign',
          attributes: {
            name: 'Test Campaign',
            status: 'draft',
            created: '2023-01-01T00:00:00Z',
            updated: '2023-01-01T00:00:00Z',
            archived: false,
            send_time: '2023-01-02T00:00:00Z'
          }
        }] 
      };
      
      const successResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockData),
        headers: {
          get: jest.fn().mockImplementation((name) => {
            if (name === 'content-type') return 'application/json';
            return null;
          })
        }
      };
      mockedFetch.mockResolvedValue(successResponse as any);
      
      const result = await client.get<KlaviyoApiResponse<Campaign>>('campaigns');
      expect(result).toEqual(mockData);
      expect(result.data[0].attributes.name).toBe('Test Campaign');
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
    
    it('should handle API errors gracefully in getCampaigns', async () => {
      // Mock fetch to throw an error
      mockedFetch.mockRejectedValue(new Error('API Error'));
      
      // Should return empty data instead of throwing
      const result = await client.getCampaigns(mockDateRange);
      expect(result).toEqual({ data: [] });
    });
    
    it('should handle network errors gracefully', async () => {
      // Mock fetch to throw a network error
      mockedFetch.mockRejectedValue(new Error('Network Error'));
      
      // Should return empty data instead of throwing
      const result = await client.getMetrics();
      expect(result).toEqual({ data: [] });
    });
    
    it('should handle validation errors gracefully', async () => {
      const errorResponse = {
        ok: false,
        status: 422,
        text: jest.fn().mockResolvedValue('Validation Error'),
        headers: {
          get: jest.fn().mockReturnValue(null)
        }
      };
      mockedFetch.mockResolvedValue(errorResponse as any);
      
      // Should return empty data instead of throwing
      const result = await client.getSegments();
      expect(result).toEqual({ data: [] });
    });
  });
});
