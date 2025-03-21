# API Integration Details

## Overview

This document details the integration between our analytics dashboard and the Klaviyo API, including authentication, rate limiting, error handling, and data synchronization strategies.

## Klaviyo API Configuration

### API Version and Endpoints
```typescript
const API_CONFIG = {
  version: '2025-01-15',
  baseUrl: 'https://a.klaviyo.com/api',
  endpoints: {
    metrics: '/metrics',
    campaigns: '/campaigns',
    flows: '/flows',
    events: '/events',
    profiles: '/profiles'
  }
};
```

### Authentication
```typescript
const HEADERS = {
  'Authorization': `Klaviyo-API-Key ${process.env.KLAVIYO_API_KEY}`,
  'revision': API_CONFIG.version,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};
```

## Rate Limiting Strategy

### Current Implementation
```typescript
class RateLimitManager {
  private static instance: RateLimitManager;
  private lastRequestTime: number = 0;
  private requestQueue: Map<string, Promise<any>> = new Map();
  
  // Singleton pattern
  static getInstance(): RateLimitManager {
    if (!RateLimitManager.instance) {
      RateLimitManager.instance = new RateLimitManager();
    }
    return RateLimitManager.instance;
  }
  
  async executeRequest(
    key: string,
    requestFn: () => Promise<any>
  ): Promise<any> {
    // Check for existing request
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key);
    }
    
    // Implement delay between requests
    const now = Date.now();
    const timeToWait = Math.max(0, 1000 - (now - this.lastRequestTime));
    if (timeToWait > 0) {
      await new Promise(resolve => setTimeout(resolve, timeToWait));
    }
    
    // Execute request
    const promise = requestFn().finally(() => {
      this.requestQueue.delete(key);
      this.lastRequestTime = Date.now();
    });
    
    this.requestQueue.set(key, promise);
    return promise;
  }
}
```

### Rate Limit Configuration
```typescript
const RATE_LIMIT_CONFIG = {
  baseDelay: 1000,        // 1 second between requests
  maxRetries: 5,          // Maximum retry attempts
  retryDelay: 2000,       // Base retry delay
  retryMultiplier: 3,     // Exponential backoff multiplier
  maxConcurrent: 3        // Maximum concurrent requests
};
```

## Error Handling

### Error Types
```typescript
enum KlaviyoErrorType {
  RateLimit = 'RATE_LIMIT',
  Authentication = 'AUTHENTICATION',
  NotFound = 'NOT_FOUND',
  ValidationError = 'VALIDATION_ERROR',
  ServerError = 'SERVER_ERROR',
  NetworkError = 'NETWORK_ERROR'
}

interface KlaviyoError {
  type: KlaviyoErrorType;
  message: string;
  retryable: boolean;
  statusCode?: number;
  details?: any;
}
```

### Error Handler Implementation
```typescript
class KlaviyoErrorHandler {
  static handleError(error: any): KlaviyoError {
    if (error.response) {
      const { status } = error.response;
      
      switch (status) {
        case 429:
          return {
            type: KlaviyoErrorType.RateLimit,
            message: 'Rate limit exceeded',
            retryable: true,
            statusCode: status
          };
        
        case 401:
        case 403:
          return {
            type: KlaviyoErrorType.Authentication,
            message: 'Authentication failed',
            retryable: false,
            statusCode: status
          };
          
        // Add other status code handlers
      }
    }
    
    return {
      type: KlaviyoErrorType.NetworkError,
      message: 'Network error occurred',
      retryable: true
    };
  }
}
```

## Data Synchronization

### Sync Strategy
```typescript
interface SyncConfig {
  endpoint: string;
  frequency: number;  // milliseconds
  batchSize: number;
  priority: number;   // 1 (highest) to 5 (lowest)
}

const SYNC_CONFIGS: Record<string, SyncConfig> = {
  metrics: {
    endpoint: '/metrics',
    frequency: 24 * 60 * 60 * 1000,  // daily
    batchSize: 100,
    priority: 1
  },
  campaigns: {
    endpoint: '/campaigns',
    frequency: 60 * 60 * 1000,       // hourly
    batchSize: 50,
    priority: 2
  },
  // Add other endpoint configs
};
```

### Sync Manager
```typescript
class DataSyncManager {
  private syncJobs: Map<string, NodeJS.Timeout> = new Map();
  
  startSync(endpoint: string): void {
    const config = SYNC_CONFIGS[endpoint];
    if (!config) return;
    
    const job = setInterval(async () => {
      try {
        await this.performSync(endpoint, config);
      } catch (error) {
        console.error(`Sync failed for ${endpoint}:`, error);
      }
    }, config.frequency);
    
    this.syncJobs.set(endpoint, job);
  }
  
  private async performSync(
    endpoint: string,
    config: SyncConfig
  ): Promise<void> {
    // Implementation details
  }
}
```

## Metric ID Management

### Metric Registry
```typescript
interface MetricDefinition {
  id: string;
  name: string;
  type: string;
  description: string;
  calculation?: string;
}

const CORE_METRICS: Record<string, MetricDefinition> = {
  placed_order: {
    id: 'WRfUa5',
    name: 'Placed Order',
    type: 'conversion',
    description: 'When someone places an order'
  },
  // Add other core metrics
};
```

### Metric Discovery
```typescript
class MetricDiscovery {
  private metricCache: Map<string, MetricDefinition> = new Map();
  
  async discoverMetrics(): Promise<void> {
    const response = await klaviyoClient.get('/metrics');
    
    for (const metric of response.data) {
      this.metricCache.set(metric.name, {
        id: metric.id,
        name: metric.name,
        type: metric.type,
        description: metric.description
      });
    }
  }
  
  getMetricId(name: string): string | null {
    const metric = this.metricCache.get(name);
    return metric?.id || null;
  }
}
```

## Data Transformation

### Response Transformation
```typescript
interface TransformConfig {
  includeFields: string[];
  excludeFields: string[];
  computedFields?: Record<string, (data: any) => any>;
}

class ResponseTransformer {
  transform(
    data: any,
    config: TransformConfig
  ): any {
    // Implementation details
  }
}
```

### Field Mapping
```typescript
const FIELD_MAPPINGS = {
  campaigns: {
    id: 'campaign_id',
    name: 'campaign_name',
    status: 'campaign_status',
    metrics: {
      sent: 'recipient_count',
      opened: 'open_count',
      clicked: 'click_count'
    }
  }
  // Add other entity mappings
};
```

## Testing & Validation

### API Tests
```typescript
describe('Klaviyo API Integration', () => {
  it('should handle rate limiting correctly', async () => {
    const requests = Array(10).fill(null).map(() => 
      klaviyoClient.get('/metrics')
    );
    
    const results = await Promise.all(requests);
    expect(results).toHaveLength(10);
  });
  
  it('should retry failed requests', async () => {
    // Test implementation
  });
});
```

### Mock API Responses
```typescript
const MOCK_RESPONSES = {
  metrics: {
    success: {
      data: [
        {
          id: 'WRfUa5',
          name: 'Placed Order',
          // Add other fields
        }
      ]
    },
    rateLimit: {
      status: 429,
      headers: {
        'Retry-After': '60'
      }
    }
  }
  // Add other mock responses
};
```

## Monitoring & Logging

### Request Logging
```typescript
interface APILog {
  timestamp: Date;
  endpoint: string;
  duration: number;
  status: number;
  error?: any;
}

class APILogger {
  private logs: APILog[] = [];
  
  logRequest(log: APILog): void {
    this.logs.push(log);
    
    // Log to external system if needed
    console.log(
      `API Request: ${log.endpoint} - ${log.status} - ${log.duration}ms`
    );
  }
}
```

### Performance Monitoring
```typescript
class APIMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  recordMetric(
    endpoint: string,
    value: number
  ): void {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }
    this.metrics.get(endpoint)?.push(value);
  }
  
  getAverageResponseTime(endpoint: string): number {
    const times = this.metrics.get(endpoint) || [];
    return times.reduce((a, b) => a + b, 0) / times.length;
  }
}
```

## Maintenance & Updates

### Version Management
- Monitor Klaviyo API changelog
- Test new API versions in staging
- Plan version migrations
- Maintain backward compatibility

### Health Checks
- Regular API connectivity tests
- Rate limit monitoring
- Error rate tracking
- Response time monitoring

### Documentation Updates
- Keep API documentation current
- Document breaking changes
- Maintain integration guides
- Update troubleshooting guides
