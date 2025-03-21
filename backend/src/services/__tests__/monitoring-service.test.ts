import { monitoringService } from '../monitoring-service';
import { cacheService } from '../cache-service';
import { db } from '../../database';

// Mock dependencies
jest.mock('../cache-service', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock('../../database', () => ({
  db: {
    healthCheck: jest.fn(),
    getPoolMetrics: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock os module
jest.mock('os', () => ({
  cpus: jest.fn().mockReturnValue([
    {
      times: {
        user: 100,
        nice: 0,
        sys: 50,
        idle: 200,
        irq: 0,
      },
    },
  ]),
  totalmem: jest.fn().mockReturnValue(16000000000),
  freemem: jest.fn().mockReturnValue(8000000000),
  loadavg: jest.fn().mockReturnValue([1.5, 1.2, 1.0]),
}));

describe('MonitoringService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSystemMetrics', () => {
    it('should return system metrics', () => {
      const metrics = monitoringService.getSystemMetrics();
      
      expect(metrics).toHaveProperty('cpu');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('timestamp');
      
      expect(metrics.cpu).toHaveProperty('usage');
      expect(metrics.cpu).toHaveProperty('loadAvg');
      expect(metrics.memory).toHaveProperty('total');
      expect(metrics.memory).toHaveProperty('free');
      expect(metrics.memory).toHaveProperty('usage');
    });
  });

  describe('trackApiRequest', () => {
    it('should track API requests', () => {
      const requestMetrics = {
        endpoint: '/api/test',
        method: 'GET',
        statusCode: 200,
        responseTime: 50,
        userAgent: 'test-agent',
        ip: '127.0.0.1',
      };
      
      monitoringService.trackApiRequest(requestMetrics);
      
      const metrics = monitoringService.getApiMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      
      const lastMetric = metrics[metrics.length - 1];
      expect(lastMetric.endpoint).toBe(requestMetrics.endpoint);
      expect(lastMetric.method).toBe(requestMetrics.method);
      expect(lastMetric.statusCode).toBe(requestMetrics.statusCode);
      expect(lastMetric.responseTime).toBe(requestMetrics.responseTime);
      expect(lastMetric.userAgent).toBe(requestMetrics.userAgent);
      expect(lastMetric.ip).toBe(requestMetrics.ip);
    });
    
    it('should log slow responses', () => {
      const requestMetrics = {
        endpoint: '/api/slow',
        method: 'GET',
        statusCode: 200,
        responseTime: 1500, // Slow response
        userAgent: 'test-agent',
        ip: '127.0.0.1',
      };
      
      monitoringService.trackApiRequest(requestMetrics);
      
      // Check if warning was logged
      expect(require('../../utils/logger').logger.warn).toHaveBeenCalled();
    });
    
    it('should log server errors', () => {
      const requestMetrics = {
        endpoint: '/api/error',
        method: 'GET',
        statusCode: 500, // Server error
        responseTime: 50,
        userAgent: 'test-agent',
        ip: '127.0.0.1',
      };
      
      monitoringService.trackApiRequest(requestMetrics);
      
      // Check if error was logged
      expect(require('../../utils/logger').logger.error).toHaveBeenCalled();
    });
  });

  describe('trackError', () => {
    it('should track application errors', () => {
      const error = new Error('Test error');
      const context = { source: 'test' };
      
      monitoringService.trackError(error, context);
      
      const errors = monitoringService.getErrorMetrics();
      expect(errors.length).toBeGreaterThan(0);
      
      const lastError = errors[errors.length - 1];
      expect(lastError.message).toBe(error.message);
      expect(lastError.context).toEqual(context);
    });
  });

  describe('trackCacheOperation', () => {
    it('should track cache hits', () => {
      // Get initial metrics
      const initialMetrics = monitoringService.getCacheMetrics();
      const initialHits = initialMetrics.hits;
      
      // Track a cache hit
      monitoringService.trackCacheOperation(true);
      
      // Get updated metrics
      const updatedMetrics = monitoringService.getCacheMetrics();
      
      // Verify hit was tracked
      expect(updatedMetrics.hits).toBe(initialHits + 1);
    });
    
    it('should track cache misses', () => {
      // Get initial metrics
      const initialMetrics = monitoringService.getCacheMetrics();
      const initialMisses = initialMetrics.misses;
      
      // Track a cache miss
      monitoringService.trackCacheOperation(false);
      
      // Get updated metrics
      const updatedMetrics = monitoringService.getCacheMetrics();
      
      // Verify miss was tracked
      expect(updatedMetrics.misses).toBe(initialMisses + 1);
    });
    
    it('should calculate cache hit ratio', () => {
      // Reset metrics
      monitoringService.setCacheSize(0);
      
      // Track 3 hits and 1 miss
      monitoringService.trackCacheOperation(true);
      monitoringService.trackCacheOperation(true);
      monitoringService.trackCacheOperation(true);
      monitoringService.trackCacheOperation(false);
      
      // Get metrics
      const metrics = monitoringService.getCacheMetrics();
      
      // Verify ratio calculation
      expect(metrics.ratio).toBe(0.75); // 3 hits / 4 total = 0.75
    });
  });

  describe('getHealthCheck', () => {
    it('should return a default health check if none has been run', () => {
      // Mock implementation to simulate no health check has been run
      jest.spyOn(monitoringService as any, 'lastHealthCheck', 'get').mockReturnValue(null);
      
      const healthCheck = monitoringService.getHealthCheck();
      
      expect(healthCheck.status).toBe('degraded');
      expect(healthCheck.checks).toHaveProperty('healthCheck');
      expect(healthCheck.checks.healthCheck.status).toBe('warn');
    });
  });

  describe('runHealthCheck', () => {
    it('should run a comprehensive health check', async () => {
      // Mock database health check to return true
      (db.healthCheck as jest.Mock).mockResolvedValue(true);
      (db.getPoolMetrics as jest.Mock).mockReturnValue({
        total: 10,
        idle: 5,
        active: 5,
        waitingClients: 0,
        maxConnections: 20,
        usage: 25,
        lastChecked: new Date(),
      });
      
      // Mock cache service
      (cacheService.set as jest.Mock).mockResolvedValue(undefined);
      (cacheService.get as jest.Mock).mockImplementation((key) => {
        if (key === 'health:test') {
          return Promise.resolve(Date.now().toString());
        }
        return Promise.resolve(null);
      });
      
      const healthCheck = await monitoringService.runHealthCheck();
      
      expect(healthCheck.status).toBe('healthy');
      expect(healthCheck).toHaveProperty('checks');
      expect(healthCheck.checks).toHaveProperty('database');
      expect(healthCheck.checks).toHaveProperty('redis');
      expect(healthCheck.checks).toHaveProperty('memory');
      expect(healthCheck.checks).toHaveProperty('cpu');
      expect(healthCheck.checks).toHaveProperty('disk');
      expect(healthCheck.checks).toHaveProperty('errorRate');
      expect(healthCheck.checks).toHaveProperty('apiResponseTime');
    });
    
    it('should handle database health check failure', async () => {
      // Mock database health check to return false
      (db.healthCheck as jest.Mock).mockResolvedValue(false);
      
      const healthCheck = await monitoringService.runHealthCheck();
      
      expect(healthCheck.status).toBe('unhealthy');
      expect(healthCheck.checks.database.status).toBe('fail');
    });
    
    it('should handle redis health check failure', async () => {
      // Mock database health check to return true
      (db.healthCheck as jest.Mock).mockResolvedValue(true);
      
      // Mock cache service to simulate Redis failure
      (cacheService.set as jest.Mock).mockRejectedValue(new Error('Redis connection error'));
      
      const healthCheck = await monitoringService.runHealthCheck();
      
      expect(healthCheck.status).toBe('degraded');
      expect(healthCheck.checks.redis.status).toBe('warn');
    });
  });
});
