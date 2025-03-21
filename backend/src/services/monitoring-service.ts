import { logger } from '../utils/logger';
import { cacheService } from './cache-service';
import { db } from '../database';
import os from 'os';

/**
 * Metrics collected for monitoring
 */
interface SystemMetrics {
  timestamp: string;
  cpu: {
    usage: number;
    loadAvg: number[];
  };
  memory: {
    total: number;
    free: number;
    usage: number;
  };
  uptime: number;
}

/**
 * API metrics for tracking usage and performance
 */
interface ApiMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
  userAgent?: string;
  ip?: string;
}

/**
 * Error metrics for tracking application errors
 */
interface ErrorMetrics {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: string;
  endpoint?: string;
  userAgent?: string;
  ip?: string;
}

/**
 * Cache metrics for monitoring cache performance
 */
interface CacheMetrics {
  hits: number;
  misses: number;
  ratio: number;
  size: number;
  timestamp: string;
}

/**
 * Health check result
 */
interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    [key: string]: {
      status: 'pass' | 'warn' | 'fail';
      message?: string;
      details?: any;
    };
  };
  version: string;
  uptime: number;
}

/**
 * Service for monitoring application performance and health
 */
class MonitoringService {
  private metricsInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private apiMetrics: ApiMetrics[] = [];
  private errorMetrics: ErrorMetrics[] = [];
  private cacheMetrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    ratio: 0,
    size: 0,
    timestamp: new Date().toISOString(),
  };
  private lastHealthCheck: HealthCheckResult | null = null;
  private readonly version: string;
  private readonly startTime: Date;
  
  constructor() {
    this.version = process.env.npm_package_version || '1.0.0';
    this.startTime = new Date();
    this.initializeMonitoring();
  }
  
  /**
   * Initialize monitoring intervals
   */
  private initializeMonitoring(): void {
    try {
      // Collect system metrics every minute
      const metricsInterval = parseInt(process.env.METRICS_INTERVAL || '60000', 10);
      this.metricsInterval = setInterval(() => {
        this.collectSystemMetrics();
      }, metricsInterval);
      
      // Run health checks every 5 minutes
      const healthCheckInterval = parseInt(process.env.HEALTH_CHECK_INTERVAL || '300000', 10);
      this.healthCheckInterval = setInterval(() => {
        this.runHealthCheck().catch(error => {
          logger.error('Health check failed:', error);
        });
      }, healthCheckInterval);
      
      // Initial health check
      this.runHealthCheck().catch(error => {
        logger.error('Initial health check failed:', error);
      });
      
      logger.info('Monitoring service initialized', {
        metricsInterval: `${metricsInterval}ms`,
        healthCheckInterval: `${healthCheckInterval}ms`,
      });
    } catch (error) {
      logger.error('Failed to initialize monitoring service:', error);
    }
  }
  
  /**
   * Collect system metrics
   */
  private collectSystemMetrics(): void {
    try {
      const cpus = os.cpus();
      const totalCpuTime = cpus.reduce((acc, cpu) => {
        return acc + Object.values(cpu.times).reduce((sum, time) => sum + time, 0);
      }, 0);
      const idleCpuTime = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
      const cpuUsage = 100 - (idleCpuTime / totalCpuTime * 100);
      
      const metrics: SystemMetrics = {
        timestamp: new Date().toISOString(),
        cpu: {
          usage: parseFloat(cpuUsage.toFixed(2)),
          loadAvg: os.loadavg(),
        },
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          usage: parseFloat(((1 - os.freemem() / os.totalmem()) * 100).toFixed(2)),
        },
        uptime: process.uptime(),
      };
      
      // Store metrics (in a real implementation, this would be sent to a monitoring service)
      logger.debug('System metrics collected', { metrics });
      
      // Check for high resource usage
      if (metrics.cpu.usage > 80) {
        logger.warn('High CPU usage detected', { usage: `${metrics.cpu.usage}%` });
      }
      
      if (metrics.memory.usage > 80) {
        logger.warn('High memory usage detected', { usage: `${metrics.memory.usage}%` });
      }
    } catch (error) {
      logger.error('Error collecting system metrics:', error);
    }
  }
  
  /**
   * Track API request metrics
   */
  trackApiRequest(metrics: Omit<ApiMetrics, 'timestamp'>): void {
    try {
      const apiMetric: ApiMetrics = {
        ...metrics,
        timestamp: new Date().toISOString(),
      };
      
      this.apiMetrics.push(apiMetric);
      
      // Keep only the last 1000 metrics
      if (this.apiMetrics.length > 1000) {
        this.apiMetrics.shift();
      }
      
      // Log slow responses
      if (apiMetric.responseTime > 1000) {
        logger.warn('Slow API response detected', {
          endpoint: apiMetric.endpoint,
          method: apiMetric.method,
          responseTime: `${apiMetric.responseTime}ms`,
        });
      }
      
      // Log errors
      if (apiMetric.statusCode >= 500) {
        logger.error('API server error', {
          endpoint: apiMetric.endpoint,
          method: apiMetric.method,
          statusCode: apiMetric.statusCode,
        });
      } else if (apiMetric.statusCode >= 400) {
        logger.warn('API client error', {
          endpoint: apiMetric.endpoint,
          method: apiMetric.method,
          statusCode: apiMetric.statusCode,
        });
      }
    } catch (error) {
      logger.error('Error tracking API request:', error);
    }
  }
  
  /**
   * Track application errors
   */
  trackError(error: Error, context: Record<string, any> = {}): void {
    try {
      const errorMetric: ErrorMetrics = {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
      };
      
      this.errorMetrics.push(errorMetric);
      
      // Keep only the last 100 errors
      if (this.errorMetrics.length > 100) {
        this.errorMetrics.shift();
      }
      
      // Log the error
      logger.error('Application error tracked:', {
        message: error.message,
        context,
      });
    } catch (trackingError) {
      logger.error('Error tracking application error:', trackingError);
    }
  }
  
  /**
   * Track cache operations
   */
  trackCacheOperation(hit: boolean): void {
    try {
      if (hit) {
        this.cacheMetrics.hits++;
      } else {
        this.cacheMetrics.misses++;
      }
      
      const total = this.cacheMetrics.hits + this.cacheMetrics.misses;
      this.cacheMetrics.ratio = total > 0 ? this.cacheMetrics.hits / total : 0;
      this.cacheMetrics.timestamp = new Date().toISOString();
    } catch (error) {
      logger.error('Error tracking cache operation:', error);
    }
  }
  
  /**
   * Set cache size
   */
  setCacheSize(size: number): void {
    this.cacheMetrics.size = size;
  }
  
  /**
   * Run a comprehensive health check
   */
  async runHealthCheck(): Promise<HealthCheckResult> {
    try {
      const checks: HealthCheckResult['checks'] = {};
      let overallStatus: HealthCheckResult['status'] = 'healthy';
      
      // Check database connection
      try {
        const dbHealthy = await db.healthCheck();
        checks.database = {
          status: dbHealthy ? 'pass' : 'fail',
          message: dbHealthy ? 'Database connection is healthy' : 'Database connection failed',
          details: dbHealthy ? db.getPoolMetrics() : undefined,
        };
        
        if (!dbHealthy) {
          overallStatus = 'unhealthy';
        }
      } catch (error) {
        checks.database = {
          status: 'fail',
          message: error instanceof Error ? error.message : 'Unknown database error',
        };
        overallStatus = 'unhealthy';
      }
      
      // Check Redis connection (if not disabled)
      if (process.env.DISABLE_REDIS === 'true') {
        checks.redis = {
          status: 'pass',
          message: 'Redis is disabled by configuration',
        };
      } else {
        try {
          // Simple check - if we can set and get a value, Redis is working
          const testKey = 'health:test';
          const testValue = Date.now().toString();
          await cacheService.set(testKey, testValue, 10);
          const retrievedValue = await cacheService.get(testKey);
          
          const redisHealthy = retrievedValue === testValue;
          checks.redis = {
            status: redisHealthy ? 'pass' : 'warn',
            message: redisHealthy ? 'Redis connection is healthy' : 'Redis connection is degraded',
          };
          
          if (!redisHealthy && overallStatus === 'healthy') {
            overallStatus = 'degraded';
          }
        } catch (error) {
          checks.redis = {
            status: 'warn',
            message: error instanceof Error ? error.message : 'Unknown Redis error',
          };
          
          if (overallStatus === 'healthy') {
            overallStatus = 'degraded';
          }
        }
      }
      
      // Check memory usage
      const memoryUsage = process.memoryUsage();
      const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      
      checks.memory = {
        status: memoryUsagePercent < 80 ? 'pass' : memoryUsagePercent < 90 ? 'warn' : 'fail',
        message: `Memory usage: ${memoryUsagePercent.toFixed(2)}%`,
        details: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          rss: memoryUsage.rss,
        },
      };
      
      if (checks.memory.status === 'fail' && overallStatus === 'healthy') {
        overallStatus = 'degraded';
      }
      
      // Check CPU usage
      const cpus = os.cpus();
      const totalCpuTime = cpus.reduce((acc, cpu) => {
        return acc + Object.values(cpu.times).reduce((sum, time) => sum + time, 0);
      }, 0);
      const idleCpuTime = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
      const cpuUsage = 100 - (idleCpuTime / totalCpuTime * 100);
      
      checks.cpu = {
        status: cpuUsage < 80 ? 'pass' : cpuUsage < 90 ? 'warn' : 'fail',
        message: `CPU usage: ${cpuUsage.toFixed(2)}%`,
        details: {
          usage: cpuUsage,
          loadAvg: os.loadavg(),
        },
      };
      
      if (checks.cpu.status === 'fail' && overallStatus === 'healthy') {
        overallStatus = 'degraded';
      }
      
      // Check disk space (simplified)
      // In a real implementation, you would use a library like 'diskusage'
      checks.disk = {
        status: 'pass',
        message: 'Disk space check not implemented',
      };
      
      // Check error rate
      const recentErrors = this.errorMetrics.filter(
        error => new Date(error.timestamp).getTime() > Date.now() - 15 * 60 * 1000
      ).length;
      
      checks.errorRate = {
        status: recentErrors < 5 ? 'pass' : recentErrors < 20 ? 'warn' : 'fail',
        message: `Recent errors (15m): ${recentErrors}`,
      };
      
      if (checks.errorRate.status === 'fail' && overallStatus === 'healthy') {
        overallStatus = 'degraded';
      }
      
      // Check API response times
      const recentRequests = this.apiMetrics.filter(
        metric => new Date(metric.timestamp).getTime() > Date.now() - 15 * 60 * 1000
      );
      
      const avgResponseTime = recentRequests.length > 0
        ? recentRequests.reduce((sum, metric) => sum + metric.responseTime, 0) / recentRequests.length
        : 0;
      
      checks.apiResponseTime = {
        status: avgResponseTime < 200 ? 'pass' : avgResponseTime < 500 ? 'warn' : 'fail',
        message: `Average response time (15m): ${avgResponseTime.toFixed(2)}ms`,
        details: {
          count: recentRequests.length,
          average: avgResponseTime,
        },
      };
      
      if (checks.apiResponseTime.status === 'fail' && overallStatus === 'healthy') {
        overallStatus = 'degraded';
      }
      
      // Create health check result
      const result: HealthCheckResult = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        checks,
        version: this.version,
        uptime: process.uptime(),
      };
      
      this.lastHealthCheck = result;
      
      // Log health check result
      if (result.status !== 'healthy') {
        logger.warn('Health check completed with issues', {
          status: result.status,
          failedChecks: Object.entries(result.checks)
            .filter(([_, check]) => check.status !== 'pass')
            .map(([name, check]) => ({ name, status: check.status, message: check.message })),
        });
      } else {
        logger.info('Health check completed successfully');
      }
      
      return result;
    } catch (error) {
      logger.error('Health check failed:', error);
      
      // Return a minimal health check result
      const result: HealthCheckResult = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          healthCheck: {
            status: 'fail',
            message: error instanceof Error ? error.message : 'Unknown error during health check',
          },
        },
        version: this.version,
        uptime: process.uptime(),
      };
      
      this.lastHealthCheck = result;
      return result;
    }
  }
  
  /**
   * Get the latest health check result
   */
  getHealthCheck(): HealthCheckResult {
    if (!this.lastHealthCheck) {
      return {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        checks: {
          healthCheck: {
            status: 'warn',
            message: 'Health check has not been run yet',
          },
        },
        version: this.version,
        uptime: process.uptime(),
      };
    }
    
    return this.lastHealthCheck;
  }
  
  /**
   * Get API metrics
   */
  getApiMetrics(): ApiMetrics[] {
    return [...this.apiMetrics];
  }
  
  /**
   * Get error metrics
   */
  getErrorMetrics(): ErrorMetrics[] {
    return [...this.errorMetrics];
  }
  
  /**
   * Get cache metrics
   */
  getCacheMetrics(): CacheMetrics {
    return { ...this.cacheMetrics };
  }
  
  /**
   * Get system metrics
   */
  getSystemMetrics(): SystemMetrics {
    const cpus = os.cpus();
    const totalCpuTime = cpus.reduce((acc, cpu) => {
      return acc + Object.values(cpu.times).reduce((sum, time) => sum + time, 0);
    }, 0);
    const idleCpuTime = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
    const cpuUsage = 100 - (idleCpuTime / totalCpuTime * 100);
    
    return {
      timestamp: new Date().toISOString(),
      cpu: {
        usage: parseFloat(cpuUsage.toFixed(2)),
        loadAvg: os.loadavg(),
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        usage: parseFloat(((1 - os.freemem() / os.totalmem()) * 100).toFixed(2)),
      },
      uptime: process.uptime(),
    };
  }
  
  /**
   * Close monitoring service
   */
  close(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    logger.info('Monitoring service closed');
  }
}

export const monitoringService = new MonitoringService();
