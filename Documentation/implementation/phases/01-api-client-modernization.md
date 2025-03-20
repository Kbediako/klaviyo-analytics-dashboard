# Phase 1: API Client Modernization (Weeks 1-2)

## Overview

This phase focuses on updating our API client to align with Klaviyo's latest API standards and best practices.

## Timeline

- Week 1: Authentication and JSON:API Parameter Formatting
- Week 2: Rate Limiting and Request Methods

## Implementation Details

### 1.1 Update Authentication and Client Structure (Week 1)

```typescript
// backend/src/services/klaviyoApiClient.ts
export class KlaviyoApiClient {
  private apiKey: string;
  private baseUrl: string = 'https://a.klaviyo.com';
  private apiVersion: string = '2023-10-15'; // Update to latest version
  private maxRetries: number = 5;
  private retryDelay: number = 2000;
  private requestQueue: Map<string, Promise<any>> = new Map();
  private lastRequestTime: number = 0;

  constructor(
    apiKey: string,
    apiVersion: string = '2023-10-15',
    maxRetries: number = 5,
    retryDelay: number = 2000
  ) {
    if (!apiKey) {
      throw new Error('Klaviyo API key is required');
    }
    
    this.apiKey = apiKey;
    this.apiVersion = apiVersion;
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  // Updated to use Bearer token format
  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json',
      'revision': this.apiVersion,
      'Content-Type': 'application/json',
    };
  }
}
```

### 1.2 Implement JSON:API Parameter Formatting (Week 1)

```typescript
// backend/src/utils/jsonApiUtils.ts
export interface FilterParam {
  field: string;
  operator: 'equals' | 'greater-than' | 'less-than' | 'greater-or-equal' | 'less-or-equal' | 'contains';
  value: string | number | boolean;
}

export interface JsonApiParams {
  filter?: FilterParam[];
  sort?: string[];
  include?: string[];
  fields?: SparseFieldset;
  page?: {
    cursor?: string;
    size?: number;
  };
}

export function buildQueryString(params: JsonApiParams): string {
  const queryParams = new URLSearchParams();
  
  if (params.filter && params.filter.length > 0) {
    queryParams.append('filter', buildFilterString(params.filter));
  }
  
  // Add other parameters...
  
  return queryParams.toString() ? `?${queryParams.toString()}` : '';
}
```

### 1.3 Enhance Rate Limiting Strategy (Week 2)

```typescript
// backend/src/services/rateLimitManager.ts
interface RateLimitInfo {
  remaining: number;
  resetTime: number;
  burstRemaining: number;
  steadyRemaining: number;
}

export class RateLimitManager {
  private static instance: RateLimitManager;
  private rateLimits: Map<string, RateLimitInfo> = new Map();
  
  static getInstance(): RateLimitManager {
    if (!RateLimitManager.instance) {
      RateLimitManager.instance = new RateLimitManager();
    }
    return RateLimitManager.instance;
  }
  
  // Implementation details...
}
```

### 1.4 Update API Client Request Methods (Week 2)

```typescript
// Update the KlaviyoApiClient get method
async get<T>(endpoint: string, params: JsonApiParams = {}): Promise<T> {
  const queryString = buildQueryString(params);
  const url = `${this.baseUrl}${endpoint}${queryString}`;
  const cacheKey = url;
  
  // Check for in-flight request
  if (this.requestQueue.has(cacheKey)) {
    return this.requestQueue.get(cacheKey) as Promise<T>;
  }
  
  // Calculate delay based on rate limits
  const rateLimitManager = RateLimitManager.getInstance();
  const delay = await rateLimitManager.calculateDelay(endpoint);
  await this.delay(delay);
  
  // Execute request with retries
  const requestPromise = this.executeWithRetries<T>(url);
  this.requestQueue.set(cacheKey, requestPromise);
  
  return requestPromise;
}
```

## Testing

### Unit Tests

```typescript
// backend/src/services/__tests__/klaviyoApiClient.test.ts
describe('KlaviyoApiClient', () => {
  it('should make API calls with correct headers', async () => {
    const client = new KlaviyoApiClient('test-api-key');
    // Test implementation...
  });
  
  it('should retry on rate limiting', async () => {
    const client = new KlaviyoApiClient('test-api-key');
    // Test implementation...
  });
});
```

## Success Criteria

- [ ] API client uses Bearer token authentication
- [ ] JSON:API parameter formatting implemented
- [ ] Rate limiting with dynamic backoff implemented
- [ ] Request queuing and deduplication working
- [ ] All tests passing

## Next Steps

After completing this phase:
1. Review and update API integration documentation
2. Plan database schema for Phase 2
3. Begin implementing data persistence layer
