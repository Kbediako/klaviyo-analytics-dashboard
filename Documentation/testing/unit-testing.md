# Unit Testing with Mocks

The backend is already set up for unit testing with Jest, using mocks to avoid live API calls.

## Example Implementation

```typescript
// Example from a service test (e.g., campaignsService.test.ts)
import { getCampaigns } from '../campaignsService';
import * as klaviyoApiClient from '../klaviyoApiClient';

// Mock data
const mockApiResponse = {
  // Sample Klaviyo API response data
};

const expectedOutput = {
  // Expected transformed data
};

// Mock the API client
jest.mock('../klaviyoApiClient', () => ({
  getKlaviyoData: jest.fn().mockResolvedValue(mockApiResponse)
}));

describe('Campaigns Service', () => {
  test('should process campaign data correctly', async () => {
    // The test will use the mocked API client instead of making real calls
    const result = await getCampaigns('last-30-days');
    expect(result).toEqual(expectedOutput);
    
    // Verify the API client was called with correct parameters
    expect(klaviyoApiClient.getKlaviyoData).toHaveBeenCalledWith(
      'campaigns',
      expect.objectContaining({ dateRange: 'last-30-days' })
    );
  });
});
```

## Running Unit Tests

```bash
cd backend
npm test
```

## Testing API Client in Isolation

To test the Klaviyo API client without making real calls, you can use nock to intercept HTTP requests.

### Example Implementation

```typescript
// klaviyoApiClient.test.ts
import nock from 'nock';
import { getKlaviyoData } from './klaviyoApiClient';

// Mock Klaviyo API response
const mockKlaviyoResponse = {
  // Sample API response
};

// Expected transformed data
const expectedTransformedData = {
  // Expected output after transformation
};

describe('Klaviyo API Client', () => {
  beforeEach(() => {
    // Mock the HTTP requests at the network level
    nock('https://a.klaviyo.com/api')
      .get('/v1/campaigns')
      .query(true) // Match any query parameters
      .reply(200, mockKlaviyoResponse);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should fetch and transform campaign data', async () => {
    const result = await getKlaviyoData('campaigns', { dateRange: 'last-30-days' });
    expect(result).toEqual(expectedTransformedData);
  });
  
  it('should handle API errors gracefully', async () => {
    // Mock an API error
    nock('https://a.klaviyo.com/api')
      .get('/v1/campaigns')
      .query(true)
      .reply(429, { error: 'Too many requests' });
      
    // The client should handle this error and return a default value
    const result = await getKlaviyoData('campaigns', { dateRange: 'last-30-days' });
    expect(result).toEqual([]); // Or whatever default value your client returns
  });
});
```

## Error Handling Tests

### With Jest Mocks

```typescript
// Test service error handling
jest.spyOn(klaviyoApiClient, 'getKlaviyoData').mockRejectedValue(
  new Error('API request failed')
);

// Verify the service handles errors gracefully
const result = await campaignsService.getCampaigns('last-30-days');
expect(result).toEqual([]); // Or whatever fallback value you expect
```

### With Nock

```typescript
// Simulate rate limiting
nock('https://a.klaviyo.com/api')
  .get('/v1/campaigns')
  .query(true)
  .reply(429, { error: 'Too many requests' });

// Simulate server error
nock('https://a.klaviyo.com/api')
  .get('/v1/flows')
  .query(true)
  .reply(500, { error: 'Internal server error' });

// Simulate network failure
nock('https://a.klaviyo.com/api')
  .get('/v1/forms')
  .query(true)
  .replyWithError('Connection refused');
