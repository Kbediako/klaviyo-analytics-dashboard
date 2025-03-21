import { Request, Response } from 'express';
import { monitoringService } from '../services/monitoring-service';
import { logger } from '../utils/logger';

export class MonitoringController {
  getHealth = async (req: Request, res: Response): Promise<void> => {
    try {
      // Run a new health check if requested
      if (req.query.refresh === 'true') {
        const healthCheck = await monitoringService.runHealthCheck();
        res.json(healthCheck);
        return;
      }
      
      // Otherwise return the latest health check
      const healthCheck = monitoringService.getHealthCheck();
      res.json(healthCheck);
    } catch (error) {
      logger.error('Error getting health check:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get health check',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  getMetrics = (req: Request, res: Response): void => {
    try {
      const metrics = {
        system: monitoringService.getSystemMetrics(),
        cache: monitoringService.getCacheMetrics(),
      };
      
      res.json(metrics);
    } catch (error) {
      logger.error('Error getting metrics:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  getApiMetrics = (req: Request, res: Response): void => {
    try {
      const metrics = monitoringService.getApiMetrics();
      
      // Filter by endpoint if provided
      const endpoint = req.query.endpoint as string | undefined;
      const filteredMetrics = endpoint
        ? metrics.filter(metric => metric.endpoint.includes(endpoint))
        : metrics;
      
      // Calculate average response time
      const avgResponseTime = filteredMetrics.length > 0
        ? filteredMetrics.reduce((sum, metric) => sum + metric.responseTime, 0) / filteredMetrics.length
        : 0;
      
      // Calculate status code distribution
      const statusCodes = filteredMetrics.reduce((acc, metric) => {
        const statusGroup = Math.floor(metric.statusCode / 100) * 100;
        acc[statusGroup] = (acc[statusGroup] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      res.json({
        metrics: filteredMetrics,
        summary: {
          count: filteredMetrics.length,
          avgResponseTime,
          statusCodes,
        },
      });
    } catch (error) {
      logger.error('Error getting API metrics:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get API metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  getErrors = (req: Request, res: Response): void => {
    try {
      const errors = monitoringService.getErrorMetrics();
      
      // Group errors by message
      const errorGroups = errors.reduce((acc, error) => {
        if (!acc[error.message]) {
          acc[error.message] = [];
        }
        acc[error.message].push(error);
        return acc;
      }, {} as Record<string, typeof errors>);
      
      // Calculate error frequency
      const errorFrequency = Object.entries(errorGroups).map(([message, errors]) => ({
        message,
        count: errors.length,
        lastOccurred: errors[errors.length - 1].timestamp,
      }));
      
      res.json({
        errors,
        summary: {
          count: errors.length,
          groups: errorFrequency,
        },
      });
    } catch (error) {
      logger.error('Error getting error metrics:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get error metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  getStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const healthCheck = monitoringService.getHealthCheck();
      const systemMetrics = monitoringService.getSystemMetrics();
      const cacheMetrics = monitoringService.getCacheMetrics();
      
      res.json({
        status: healthCheck.status,
        uptime: systemMetrics.uptime,
        version: healthCheck.version,
        timestamp: new Date().toISOString(),
        resources: {
          cpu: {
            usage: systemMetrics.cpu.usage,
            status: systemMetrics.cpu.usage < 80 ? 'healthy' : systemMetrics.cpu.usage < 90 ? 'warning' : 'critical',
          },
          memory: {
            usage: systemMetrics.memory.usage,
            status: systemMetrics.memory.usage < 80 ? 'healthy' : systemMetrics.memory.usage < 90 ? 'warning' : 'critical',
          },
        },
        services: {
          database: healthCheck.checks.database?.status === 'pass' ? 'healthy' : 'degraded',
          redis: healthCheck.checks.redis?.status === 'pass' ? 'healthy' : 'degraded',
          api: healthCheck.checks.apiResponseTime?.status === 'pass' ? 'healthy' : 'degraded',
        },
        cache: {
          hitRatio: cacheMetrics.ratio,
          status: cacheMetrics.ratio > 0.8 ? 'healthy' : cacheMetrics.ratio > 0.5 ? 'warning' : 'degraded',
        },
      });
    } catch (error) {
      logger.error('Error getting system status:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get system status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const monitoringController = new MonitoringController();
