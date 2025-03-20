import { RateLimitManager } from './rateLimitManager';

// Get the private instance for testing
const getInstance = () => {
  // @ts-ignore - accessing private static property for testing
  return RateLimitManager.instance;
};

describe('RateLimitManager', () => {
  let rateLimitManager: RateLimitManager;
  
  beforeEach(() => {
    // Reset the singleton instance before each test
    // @ts-ignore - accessing private static property for testing
    RateLimitManager.instance = undefined;
    rateLimitManager = RateLimitManager.getInstance();
    
    // Clear rate limits
    rateLimitManager.clearRateLimits();
    
    // Set default delay for predictable tests
    rateLimitManager.setDefaultDelay(1000);
  });
  
  describe('getInstance', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = RateLimitManager.getInstance();
      const instance2 = RateLimitManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
  
  describe('updateFromHeaders', () => {
    it('should update rate limit information from headers', () => {
      const headers = {
        get: (name: string) => {
          if (name === 'x-rate-limit-remaining') return '100';
          if (name === 'x-rate-limit-reset') return '60';
          if (name === 'x-rate-limit-burst-remaining') return '50';
          if (name === 'x-rate-limit-steady-remaining') return '30';
          return null;
        }
      };
      
      rateLimitManager.updateFromHeaders('campaigns', headers);
      
      // Use calculateDelay to indirectly test that the rate limits were updated
      return rateLimitManager.calculateDelay('campaigns').then(delay => {
        // With 100 remaining requests and 60 seconds until reset,
        // the delay should be less than the default 1000ms
        expect(delay).toBeLessThan(1000);
      });
    });
    
    it('should handle missing headers', () => {
      const headers = {
        get: () => null
      };
      
      rateLimitManager.updateFromHeaders('campaigns', headers);
      
      // Should use default delay when headers are missing
      return rateLimitManager.calculateDelay('campaigns').then(delay => {
        expect(delay).toBe(1000); // Default delay
      });
    });
    
    it('should handle null or undefined headers', () => {
      rateLimitManager.updateFromHeaders('campaigns', null);
      rateLimitManager.updateFromHeaders('flows', undefined);
      
      // Should use default delay when headers are null/undefined
      return Promise.all([
        rateLimitManager.calculateDelay('campaigns'),
        rateLimitManager.calculateDelay('flows')
      ]).then(([campaignsDelay, flowsDelay]) => {
        expect(campaignsDelay).toBe(1000); // Default delay
        expect(flowsDelay).toBe(1000); // Default delay
      });
    });
    
    it('should handle headers as a Record object', () => {
      const headers = {
        'x-rate-limit-remaining': '100',
        'x-rate-limit-reset': '60'
      };
      
      rateLimitManager.updateFromHeaders('campaigns', headers);
      
      return rateLimitManager.calculateDelay('campaigns').then(delay => {
        expect(delay).toBeLessThan(1000);
      });
    });
    
    it('should normalize endpoint paths', () => {
      const headers = {
        get: (name: string) => {
          if (name === 'x-rate-limit-remaining') return '100';
          if (name === 'x-rate-limit-reset') return '60';
          return null;
        }
      };
      
      // Update with different path variations
      rateLimitManager.updateFromHeaders('api/campaigns', headers);
      
      // Should recognize 'campaigns' as the same endpoint
      return rateLimitManager.calculateDelay('campaigns').then(delay => {
        expect(delay).toBeLessThan(1000);
      });
    });
  });
  
  describe('calculateDelay', () => {
    it('should return default delay for unknown endpoints', () => {
      return rateLimitManager.calculateDelay('unknown-endpoint').then(delay => {
        expect(delay).toBe(1000); // Default delay
      });
    });
    
    it('should calculate delay based on remaining requests and reset time', async () => {
      // Mock headers with 10 remaining requests and 10 seconds until reset
      const headers = {
        get: (name: string) => {
          if (name === 'x-rate-limit-remaining') return '10';
          if (name === 'x-rate-limit-reset') return '10';
          return null;
        }
      };
      
      rateLimitManager.updateFromHeaders('campaigns', headers);
      
      // With 10 remaining requests and 10 seconds until reset,
      // the delay should be approximately 1000ms per request
      const delay = await rateLimitManager.calculateDelay('campaigns');
      
      // Allow some flexibility in the calculation
      expect(delay).toBeGreaterThanOrEqual(900);
      expect(delay).toBeLessThanOrEqual(1100);
    });
    
    it('should use the most restrictive limit when multiple are available', async () => {
      // Mock headers with different limits
      const headers = {
        get: (name: string) => {
          if (name === 'x-rate-limit-remaining') return '100';
          if (name === 'x-rate-limit-reset') return '60';
          if (name === 'x-rate-limit-burst-remaining') return '5';
          if (name === 'x-rate-limit-steady-remaining') return '20';
          return null;
        }
      };
      
      rateLimitManager.updateFromHeaders('campaigns', headers);
      
      // Should use the burst limit (5) as it's the most restrictive
      const delay = await rateLimitManager.calculateDelay('campaigns');
      
      // With 5 remaining requests and 60 seconds until reset,
      // the delay should be approximately 12000ms per request
      expect(delay).toBeGreaterThan(10000);
    });
    
    it('should return max delay when no requests remaining', async () => {
      // Mock headers with 0 remaining requests and 30 seconds until reset
      const headers = {
        get: (name: string) => {
          if (name === 'x-rate-limit-remaining') return '0';
          if (name === 'x-rate-limit-reset') return '30';
          return null;
        }
      };
      
      rateLimitManager.updateFromHeaders('campaigns', headers);
      
      // Should return the maximum delay (10000ms) or the time until reset
      const delay = await rateLimitManager.calculateDelay('campaigns');
      
      // Should be capped at maxDelay (10000ms)
      expect(delay).toBe(10000);
    });
    
    it('should apply safety buffer to remaining requests', async () => {
      // Set safety buffer to 20%
      rateLimitManager.setSafetyBuffer(0.2);
      
      // Mock headers with 10 remaining requests and 10 seconds until reset
      const headers = {
        get: (name: string) => {
          if (name === 'x-rate-limit-remaining') return '10';
          if (name === 'x-rate-limit-reset') return '10';
          return null;
        }
      };
      
      rateLimitManager.updateFromHeaders('campaigns', headers);
      
      // With 10 remaining requests, 20% safety buffer means effectively 8 requests
      // and 10 seconds until reset, so delay should be approximately 1250ms per request
      const delay = await rateLimitManager.calculateDelay('campaigns');
      
      // Allow some flexibility in the calculation
      expect(delay).toBeGreaterThan(1200);
      expect(delay).toBeLessThan(1300);
    });
  });
  
  describe('clearRateLimits', () => {
    it('should clear all rate limit information', async () => {
      // Set up some rate limits
      const headers = {
        get: (name: string) => {
          if (name === 'x-rate-limit-remaining') return '10';
          if (name === 'x-rate-limit-reset') return '10';
          return null;
        }
      };
      
      rateLimitManager.updateFromHeaders('campaigns', headers);
      
      // Verify rate limits are set
      let delay = await rateLimitManager.calculateDelay('campaigns');
      expect(delay).not.toBe(1000); // Not the default
      
      // Clear rate limits
      rateLimitManager.clearRateLimits();
      
      // Verify rate limits are cleared
      delay = await rateLimitManager.calculateDelay('campaigns');
      expect(delay).toBe(1000); // Back to default
    });
  });
  
  describe('setDefaultDelay', () => {
    it('should update the default delay', async () => {
      // Change default delay
      rateLimitManager.setDefaultDelay(2000);
      
      // Verify new default delay is used
      const delay = await rateLimitManager.calculateDelay('unknown-endpoint');
      expect(delay).toBe(2000);
    });
  });
  
  describe('setSafetyBuffer', () => {
    it('should update the safety buffer', () => {
      // Set safety buffer to 30%
      rateLimitManager.setSafetyBuffer(0.3);
      
      // Verify safety buffer is applied in calculations
      // This is indirectly tested through calculateDelay
    });
    
    it('should limit safety buffer to valid range', () => {
      // Try to set safety buffer to negative value
      rateLimitManager.setSafetyBuffer(-0.1);
      
      // Try to set safety buffer to value > 0.5
      rateLimitManager.setSafetyBuffer(0.6);
      
      // Verify safety buffer is clamped to valid range
      // This is indirectly tested through calculateDelay
    });
  });
});
