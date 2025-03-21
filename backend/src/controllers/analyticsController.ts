import { Request, Response } from 'express';
import { TimeSeriesAnalyzer, TimeSeriesPoint } from '../analytics/timeSeriesAnalyzer';
import { ForecastService } from '../analytics/forecastService';
import { PerformanceOptimizer, ComputationCache } from '../analytics/performanceOptimizer';
import { parseDateRange } from '../utils/dateUtils';
import { logger } from '../utils/logger';

/**
 * Controller for analytics-related endpoints
 */
export class AnalyticsController {
  private timeSeriesAnalyzer: TimeSeriesAnalyzer;
  private forecastService: ForecastService;
  private performanceOptimizer: PerformanceOptimizer;
  
  // Cache for expensive computations
  private timeSeriesCache: ComputationCache<string, TimeSeriesPoint[]>;
  private decompositionCache: ComputationCache<string, any>;
  private forecastCache: ComputationCache<string, any>;
  
  constructor() {
    this.timeSeriesAnalyzer = new TimeSeriesAnalyzer();
    this.forecastService = new ForecastService();
    this.performanceOptimizer = new PerformanceOptimizer();
    
    // Initialize caches with appropriate TTL values
    this.timeSeriesCache = this.performanceOptimizer.createComputationCache<string, TimeSeriesPoint[]>({
      maxEntries: 100,
      defaultTTL: 5 * 60 * 1000 // 5 minutes
    });
    
    this.decompositionCache = this.performanceOptimizer.createComputationCache<string, any>({
      maxEntries: 50,
      defaultTTL: 15 * 60 * 1000 // 15 minutes
    });
    
    this.forecastCache = this.performanceOptimizer.createComputationCache<string, any>({
      maxEntries: 50,
      defaultTTL: 30 * 60 * 1000 // 30 minutes
    });
  }
  
  /**
   * Get time series data for a specific metric with performance optimizations
   * 
   * @param req Express request
   * @param res Express response
   */
  async getTimeSeries(req: Request, res: Response): Promise<void> {
    try {
      const metricId = req.params.metricId;
      const dateRangeStr = req.query.dateRange as string;
      const interval = req.query.interval as string || '1 day';
      
      // Parse visualization options
      const maxDataPoints = parseInt(req.query.maxPoints as string || '1000', 10);
      const downsampleMethod = req.query.downsampleMethod as string || 'lttb';
      
      logger.info(`Analytics controller: Getting time series for metric ${metricId} with date range ${dateRangeStr}`);
      
      // Parse date range
      const dateRange = parseDateRange(dateRangeStr);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      // Validate parameters
      if (!metricId) {
        res.status(400).json({ error: 'Missing required parameter: metricId' });
        return;
      }
      
      // Create cache key
      const cacheKey = `${metricId}:${startDate.toISOString()}:${endDate.toISOString()}:${interval}`;
      
      // Get time series data (using cache if available)
      const timeSeries = await this.timeSeriesCache.getOrCompute(cacheKey, async () => {
        return this.timeSeriesAnalyzer.getTimeSeries(metricId, startDate, endDate, interval);
      });
      
      // Apply downsampling if needed
      let processedData = timeSeries;
      let wasDownsampled = false;
      
      if (timeSeries.length > maxDataPoints) {
        processedData = this.performanceOptimizer.downsampleTimeSeries(timeSeries, {
          targetPoints: maxDataPoints,
          method: downsampleMethod as any
        });
        wasDownsampled = true;
      }
      
      res.json({
        metricId,
        dateRange,
        interval,
        points: processedData,
        totalPoints: timeSeries.length,
        downsampledPoints: processedData.length,
        wasDownsampled
      });
    } catch (error) {
      logger.error('Error fetching time series:', error);
      res.status(500).json({ 
        error: 'Failed to fetch time series data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Get time series decomposition with performance optimizations
   * 
   * @param req Express request
   * @param res Express response
   */
  async getTimeSeriesDecomposition(req: Request, res: Response): Promise<void> {
    try {
      const metricId = req.params.metricId;
      const dateRangeStr = req.query.dateRange as string;
      const interval = req.query.interval as string || '1 day';
      const windowSize = parseInt(req.query.windowSize as string || '7', 10);
      
      // Parse visualization options
      const maxDataPoints = parseInt(req.query.maxPoints as string || '500', 10);
      const downsampleMethod = req.query.downsampleMethod as string || 'lttb';
      
      logger.info(`Analytics controller: Decomposing time series for metric ${metricId}`);
      
      // Parse date range
      const dateRange = parseDateRange(dateRangeStr);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      // Validate parameters
      if (!metricId) {
        res.status(400).json({ error: 'Missing required parameter: metricId' });
        return;
      }
      
      if (windowSize < 3) {
        res.status(400).json({ error: 'Window size must be at least 3' });
        return;
      }
      
      // Create cache key
      const cacheKey = `${metricId}:${startDate.toISOString()}:${endDate.toISOString()}:${interval}:${windowSize}`;
      
      // Get decomposition (using cache if available)
      const decomposition = await this.decompositionCache.getOrCompute(cacheKey, async () => {
        return this.timeSeriesAnalyzer.decompose(
          metricId, startDate, endDate, interval, windowSize
        );
      });
      
      // Apply downsampling if needed
      let wasDownsampled = false;
      let processedDecomposition = { ...decomposition };
      
      if (decomposition.original.length > maxDataPoints) {
        wasDownsampled = true;
        
        // Downsample each component
        processedDecomposition = {
          original: this.performanceOptimizer.downsampleTimeSeries(
            decomposition.original, { targetPoints: maxDataPoints, method: downsampleMethod as any }
          ),
          trend: this.performanceOptimizer.downsampleTimeSeries(
            decomposition.trend, { targetPoints: maxDataPoints, method: downsampleMethod as any }
          ),
          seasonal: this.performanceOptimizer.downsampleTimeSeries(
            decomposition.seasonal, { targetPoints: maxDataPoints, method: downsampleMethod as any }
          ),
          residual: this.performanceOptimizer.downsampleTimeSeries(
            decomposition.residual, { targetPoints: maxDataPoints, method: downsampleMethod as any }
          )
        };
      }
      
      res.json({
        metricId,
        dateRange,
        interval,
        windowSize,
        decomposition: processedDecomposition,
        totalPoints: decomposition.original.length,
        downsampledPoints: processedDecomposition.original.length,
        wasDownsampled
      });
    } catch (error) {
      logger.error('Error decomposing time series:', error);
      res.status(500).json({ 
        error: 'Failed to decompose time series data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Detect anomalies with performance optimizations
   * 
   * @param req Express request
   * @param res Express response
   */
  async detectAnomalies(req: Request, res: Response): Promise<void> {
    try {
      const metricId = req.params.metricId;
      const dateRangeStr = req.query.dateRange as string;
      const interval = req.query.interval as string || '1 day';
      const threshold = parseFloat(req.query.threshold as string || '3.0');
      const lookbackWindow = parseInt(req.query.lookbackWindow as string || '0', 10);
      
      logger.info(`Analytics controller: Detecting anomalies for metric ${metricId}`);
      
      // Parse date range
      const dateRange = parseDateRange(dateRangeStr);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      // Validate parameters
      if (!metricId) {
        res.status(400).json({ error: 'Missing required parameter: metricId' });
        return;
      }
      
      // Create cache key for time series
      const timeSeriesCacheKey = `${metricId}:${startDate.toISOString()}:${endDate.toISOString()}:${interval}`;
      
      // Get time series data (using cache if available)
      const timeSeries = await this.timeSeriesCache.getOrCompute(timeSeriesCacheKey, async () => {
        return this.timeSeriesAnalyzer.getTimeSeries(metricId, startDate, endDate, interval);
      });
      
      // Create cache key for anomalies
      const anomaliesCacheKey = `${timeSeriesCacheKey}:anomalies:${threshold}:${lookbackWindow}`;
      
      // Detect anomalies (using cache if available)
      const anomalies = await this.timeSeriesCache.getOrCompute(anomaliesCacheKey, async () => {
        return this.timeSeriesAnalyzer.detectAnomalies(timeSeries, threshold, lookbackWindow || undefined);
      });
      
      res.json({
        metricId,
        dateRange,
        interval,
        threshold,
        lookbackWindow: lookbackWindow || 'global',
        anomalies,
        totalPoints: timeSeries.length,
        anomalyCount: anomalies.length,
        anomalyPercentage: timeSeries.length > 0 ? 
          (anomalies.length / timeSeries.length * 100).toFixed(2) + '%' : '0%'
      });
    } catch (error) {
      logger.error('Error detecting anomalies:', error);
      res.status(500).json({ 
        error: 'Failed to detect anomalies',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Generate forecast with performance optimizations
   * 
   * @param req Express request
   * @param res Express response
   */
  async getForecast(req: Request, res: Response): Promise<void> {
    try {
      const metricId = req.params.metricId;
      const dateRangeStr = req.query.dateRange as string;
      const forecastHorizon = parseInt(req.query.horizon as string || '30', 10);
      const interval = req.query.interval as string || '1 day';
      const method = req.query.method as string || 'auto';
      const confidenceLevel = parseFloat(req.query.confidenceLevel as string || '0.95');
      const validateWithHistory = req.query.validate === 'true';
      
      logger.info(`Analytics controller: Generating ${method} forecast for metric ${metricId} with horizon ${forecastHorizon}`);
      
      // Parse date range
      const dateRange = parseDateRange(dateRangeStr);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      // Validate parameters
      if (!metricId) {
        res.status(400).json({ error: 'Missing required parameter: metricId' });
        return;
      }
      
      if (forecastHorizon < 1 || forecastHorizon > 365) {
        res.status(400).json({ error: 'Forecast horizon must be between 1 and 365' });
        return;
      }
      
      // Create cache key
      const cacheKey = `${metricId}:${startDate.toISOString()}:${endDate.toISOString()}:${method}:${forecastHorizon}:${interval}:${confidenceLevel}:${validateWithHistory}`;
      
      // Generate forecast (using cache if available)
      const forecast = await this.forecastCache.getOrCompute(cacheKey, async () => {
        return this.forecastService.generateForecast(
          metricId,
          startDate,
          endDate,
          forecastHorizon,
          method as any,
          interval,
          {
            confidenceLevel,
            validateWithHistory
          }
        );
      });
      
      res.json({
        metricId,
        dateRange,
        forecastHorizon,
        interval,
        method: forecast.method, // Return the actual method used (may differ if 'auto' was requested)
        accuracy: forecast.accuracy,
        forecast
      });
    } catch (error) {
      logger.error('Error generating forecast:', error);
      res.status(500).json({ 
        error: 'Failed to generate forecast',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Calculate correlation between two metrics with performance optimizations
   * 
   * @param req Express request
   * @param res Express response
   */
  async getCorrelation(req: Request, res: Response): Promise<void> {
    try {
      const metric1Id = req.query.metric1 as string;
      const metric2Id = req.query.metric2 as string;
      const dateRangeStr = req.query.dateRange as string;
      const interval = req.query.interval as string || '1 day';
      const alignTimestamps = req.query.alignTimestamps === 'true';
      
      logger.info(`Analytics controller: Calculating correlation between metrics ${metric1Id} and ${metric2Id}`);
      
      // Parse date range
      const dateRange = parseDateRange(dateRangeStr);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      // Validate parameters
      if (!metric1Id || !metric2Id) {
        res.status(400).json({ error: 'Missing required parameters: metric1 and metric2' });
        return;
      }
      
      // Create cache keys for time series
      const cacheKey1 = `${metric1Id}:${startDate.toISOString()}:${endDate.toISOString()}:${interval}`;
      const cacheKey2 = `${metric2Id}:${startDate.toISOString()}:${endDate.toISOString()}:${interval}`;
      
      // Get time series data for both metrics (using cache if available)
      const [series1, series2] = await Promise.all([
        this.timeSeriesCache.getOrCompute(cacheKey1, async () => {
          return this.timeSeriesAnalyzer.getTimeSeries(metric1Id, startDate, endDate, interval);
        }),
        this.timeSeriesCache.getOrCompute(cacheKey2, async () => {
          return this.timeSeriesAnalyzer.getTimeSeries(metric2Id, startDate, endDate, interval);
        })
      ]);
      
      // If not aligning timestamps, ensure both series have the same length
      if (!alignTimestamps && series1.length !== series2.length) {
        res.status(400).json({ 
          error: 'Time series have different lengths. Set alignTimestamps=true to handle unequal series lengths.',
          series1Length: series1.length,
          series2Length: series2.length
        });
        return;
      }
      
      // Calculate correlation
      const correlation = this.timeSeriesAnalyzer.calculateCorrelation(series1, series2, alignTimestamps);
      
      res.json({
        metric1Id,
        metric2Id,
        dateRange,
        interval,
        alignTimestamps,
        correlation,
        interpretation: this.interpretCorrelation(correlation),
        series1Points: series1.length,
        series2Points: series2.length
      });
    } catch (error) {
      logger.error('Error calculating correlation:', error);
      res.status(500).json({ 
        error: 'Failed to calculate correlation',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Calculate entropy of a time series (measure of complexity/randomness)
   * 
   * @param req Express request
   * @param res Express response
   */
  async getEntropy(req: Request, res: Response): Promise<void> {
    try {
      const metricId = req.params.metricId;
      const dateRangeStr = req.query.dateRange as string;
      const interval = req.query.interval as string || '1 day';
      const embeddingDimension = parseInt(req.query.dimension as string || '2', 10);
      
      logger.info(`Analytics controller: Calculating entropy for metric ${metricId}`);
      
      // Parse date range
      const dateRange = parseDateRange(dateRangeStr);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      // Validate parameters
      if (!metricId) {
        res.status(400).json({ error: 'Missing required parameter: metricId' });
        return;
      }
      
      if (embeddingDimension < 1) {
        res.status(400).json({ error: 'Embedding dimension must be at least 1' });
        return;
      }
      
      // Create cache key for time series
      const timeSeriesCacheKey = `${metricId}:${startDate.toISOString()}:${endDate.toISOString()}:${interval}`;
      
      // Get time series data (using cache if available)
      const timeSeries = await this.timeSeriesCache.getOrCompute(timeSeriesCacheKey, async () => {
        return this.timeSeriesAnalyzer.getTimeSeries(metricId, startDate, endDate, interval);
      });
      
      // Create cache key for entropy calculation
      const entropyCacheKey = `${timeSeriesCacheKey}:entropy:${embeddingDimension}`;
      
      // Calculate entropy (using cache if available)
      const entropy = await this.timeSeriesCache.getOrCompute(entropyCacheKey, async () => {
        return this.timeSeriesAnalyzer.calculateSampleEntropy(timeSeries, embeddingDimension);
      });
      
      res.json({
        metricId,
        dateRange,
        interval,
        embeddingDimension,
        entropy,
        interpretation: this.interpretEntropy(entropy)
      });
    } catch (error) {
      logger.error('Error calculating entropy:', error);
      res.status(500).json({ 
        error: 'Failed to calculate entropy',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Clear all caches
   * 
   * @param req Express request
   * @param res Express response
   */
  async clearCaches(req: Request, res: Response): Promise<void> {
    try {
      this.timeSeriesCache.clear();
      this.decompositionCache.clear();
      this.forecastCache.clear();
      
      logger.info('Analytics controller: Cleared all caches');
      
      res.json({
        message: 'All caches cleared successfully'
      });
    } catch (error) {
      logger.error('Error clearing caches:', error);
      res.status(500).json({ 
        error: 'Failed to clear caches',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Provide a human-readable interpretation of a correlation coefficient
   * 
   * @param correlation Correlation coefficient (-1 to 1)
   * @returns Interpretation string
   */
  private interpretCorrelation(correlation: number): string {
    const absCorrelation = Math.abs(correlation);
    const direction = correlation > 0 ? 'positive' : 'negative';
    
    if (absCorrelation > 0.9) {
      return `Very strong ${direction} correlation`;
    } else if (absCorrelation > 0.7) {
      return `Strong ${direction} correlation`;
    } else if (absCorrelation > 0.5) {
      return `Moderate ${direction} correlation`;
    } else if (absCorrelation > 0.3) {
      return `Weak ${direction} correlation`;
    } else {
      return `Very weak or no correlation`;
    }
  }
  
  /**
   * Provide a human-readable interpretation of entropy values
   * 
   * @param entropy Sample entropy value
   * @returns Interpretation string
   */
  private interpretEntropy(entropy: number): string {
    if (entropy === Infinity) {
      return 'Maximum complexity/randomness';
    } else if (entropy > 2.5) {
      return 'Very high complexity/randomness';
    } else if (entropy > 1.5) {
      return 'High complexity/randomness';
    } else if (entropy > 0.8) {
      return 'Moderate complexity/randomness';
    } else if (entropy > 0.3) {
      return 'Low complexity/randomness';
    } else {
      return 'Very low complexity/randomness (highly predictable pattern)';
    }
  }
}

// Export a singleton instance
export const analyticsController = new AnalyticsController();