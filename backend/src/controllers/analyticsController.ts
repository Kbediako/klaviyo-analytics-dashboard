import { Request, Response } from 'express';
import { TimeSeriesAnalyzer } from '../analytics/timeSeriesAnalyzer';
import { ForecastService } from '../analytics/forecastService';
import { parseDateRange } from '../utils/dateUtils';
import { logger } from '../utils/logger';

/**
 * Controller for analytics-related endpoints
 */
export class AnalyticsController {
  private timeSeriesAnalyzer: TimeSeriesAnalyzer;
  private forecastService: ForecastService;
  
  constructor() {
    this.timeSeriesAnalyzer = new TimeSeriesAnalyzer();
    this.forecastService = new ForecastService();
  }
  
  /**
   * Get time series data for a specific metric
   * 
   * @param req Express request
   * @param res Express response
   */
  async getTimeSeries(req: Request, res: Response): Promise<void> {
    try {
      const metricId = req.params.metricId;
      const dateRangeStr = req.query.dateRange as string;
      const interval = req.query.interval as string || '1 day';
      
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
      
      // Get time series data
      const timeSeries = await this.timeSeriesAnalyzer.getTimeSeries(
        metricId, startDate, endDate, interval
      );
      
      res.json({
        metricId,
        dateRange,
        interval,
        points: timeSeries
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
   * Get time series decomposition for a specific metric
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
      
      // Get decomposition
      const decomposition = await this.timeSeriesAnalyzer.decompose(
        metricId, startDate, endDate, interval, windowSize
      );
      
      res.json({
        metricId,
        dateRange,
        interval,
        windowSize,
        decomposition
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
   * Detect anomalies in time series data
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
      
      // Get time series data
      const timeSeries = await this.timeSeriesAnalyzer.getTimeSeries(
        metricId, startDate, endDate, interval
      );
      
      // Detect anomalies
      const anomalies = await this.timeSeriesAnalyzer.detectAnomalies(timeSeries, threshold);
      
      res.json({
        metricId,
        dateRange,
        interval,
        threshold,
        anomalies,
        totalPoints: timeSeries.length,
        anomalyCount: anomalies.length
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
   * Generate forecast for a specific metric
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
      const method = req.query.method as string || 'naive';
      
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
      
      // Generate forecast based on method
      let forecast;
      
      switch (method) {
        case 'moving_average':
          forecast = await this.forecastService.movingAverageForecast(
            metricId, startDate, endDate, forecastHorizon, 7, interval
          );
          break;
          
        case 'linear_regression':
          forecast = await this.forecastService.linearRegressionForecast(
            metricId, startDate, endDate, forecastHorizon, interval
          );
          break;
          
        case 'naive':
        default:
          forecast = await this.forecastService.naiveForecast(
            metricId, startDate, endDate, forecastHorizon, interval
          );
          break;
      }
      
      res.json({
        metricId,
        dateRange,
        forecastHorizon,
        interval,
        method,
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
   * Calculate correlation between two metrics
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
      
      // Get time series data for both metrics
      const series1 = await this.timeSeriesAnalyzer.getTimeSeries(
        metric1Id, startDate, endDate, interval
      );
      
      const series2 = await this.timeSeriesAnalyzer.getTimeSeries(
        metric2Id, startDate, endDate, interval
      );
      
      // Ensure both series have the same length
      if (series1.length !== series2.length) {
        res.status(400).json({ 
          error: 'Time series have different lengths',
          series1Length: series1.length,
          series2Length: series2.length
        });
        return;
      }
      
      // Calculate correlation
      const correlation = this.timeSeriesAnalyzer.calculateCorrelation(series1, series2);
      
      res.json({
        metric1Id,
        metric2Id,
        dateRange,
        interval,
        correlation,
        interpretation: this.interpretCorrelation(correlation)
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
}

// Export a singleton instance
export const analyticsController = new AnalyticsController();
