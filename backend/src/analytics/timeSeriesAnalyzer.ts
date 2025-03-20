import { db } from '../database';
import { logger } from '../utils/logger';

/**
 * Interface representing a point in a time series
 */
export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
}

/**
 * Interface representing the result of time series decomposition
 */
export interface TimeSeriesResult {
  trend: TimeSeriesPoint[];
  seasonal: TimeSeriesPoint[];
  residual: TimeSeriesPoint[];
  original: TimeSeriesPoint[];
}

/**
 * Class for analyzing time series data from Klaviyo events
 */
export class TimeSeriesAnalyzer {
  /**
   * Get time series data for a specific metric
   * 
   * @param metricId Metric ID to get data for
   * @param startDate Start date for the time range
   * @param endDate End date for the time range
   * @param interval Time bucket interval (e.g., '1 day', '1 hour')
   * @returns Array of time series points
   */
  async getTimeSeries(
    metricId: string, 
    startDate: Date, 
    endDate: Date, 
    interval: string = '1 day'
  ): Promise<TimeSeriesPoint[]> {
    logger.info(`Fetching time series for metric ${metricId} from ${startDate} to ${endDate} with interval ${interval}`);
    
    try {
      // First check if we have pre-aggregated data
      const aggregatedResult = await db.query(
        `SELECT 
          time_bucket, 
          sum_value AS value
        FROM klaviyo_aggregated_metrics
        WHERE 
          metric_id = $1 AND 
          bucket_size = $2 AND
          time_bucket BETWEEN $3 AND $4
        ORDER BY time_bucket ASC`,
        [metricId, interval, startDate, endDate]
      );
      
      if (aggregatedResult.rows.length > 0) {
        logger.info(`Found ${aggregatedResult.rows.length} pre-aggregated data points`);
        return aggregatedResult.rows.map((row: any) => ({
          timestamp: new Date(row.time_bucket),
          value: parseFloat(row.value)
        }));
      }
      
      // If no pre-aggregated data, calculate on the fly
      logger.info('No pre-aggregated data found, calculating on the fly');
      const result = await db.query(
        `SELECT 
          time_bucket($1, timestamp) AS bucket,
          SUM(value) AS value
        FROM klaviyo_events
        WHERE metric_id = $2 AND timestamp BETWEEN $3 AND $4
        GROUP BY bucket
        ORDER BY bucket ASC`,
        [interval, metricId, startDate, endDate]
      );
      
      logger.info(`Generated ${result.rows.length} time series data points`);
      
      return result.rows.map((row: any) => ({
        timestamp: new Date(row.bucket),
        value: parseFloat(row.value) || 0
      }));
    } catch (error) {
      logger.error('Error fetching time series data:', error);
      throw new Error(`Failed to fetch time series data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Extract trend component using simple moving average
   * 
   * @param timeSeries Original time series data
   * @param windowSize Window size for moving average
   * @returns Trend component as time series
   */
  async extractTrend(
    timeSeries: TimeSeriesPoint[], 
    windowSize: number = 7
  ): Promise<TimeSeriesPoint[]> {
    logger.debug(`Extracting trend with window size ${windowSize}`);
    
    if (timeSeries.length === 0) {
      return [];
    }
    
    if (timeSeries.length < windowSize) {
      logger.warn(`Time series length (${timeSeries.length}) is less than window size (${windowSize}), using original data as trend`);
      return [...timeSeries];
    }
    
    const trend: TimeSeriesPoint[] = [];
    
    for (let i = 0; i < timeSeries.length; i++) {
      let sum = 0;
      let count = 0;
      
      // Calculate centered moving average
      for (let j = Math.max(0, i - Math.floor(windowSize / 2)); 
           j <= Math.min(timeSeries.length - 1, i + Math.floor(windowSize / 2)); 
           j++) {
        sum += timeSeries[j].value;
        count++;
      }
      
      trend.push({
        timestamp: new Date(timeSeries[i].timestamp),
        value: sum / count
      });
    }
    
    return trend;
  }
  
  /**
   * Decompose time series into trend, seasonal, and residual components
   * 
   * @param metricId Metric ID to analyze
   * @param startDate Start date for the time range
   * @param endDate End date for the time range
   * @param interval Time bucket interval (e.g., '1 day', '1 hour')
   * @param windowSize Window size for trend extraction
   * @returns Decomposed time series components
   */
  async decompose(
    metricId: string, 
    startDate: Date, 
    endDate: Date,
    interval: string = '1 day',
    windowSize: number = 7
  ): Promise<TimeSeriesResult> {
    logger.info(`Decomposing time series for metric ${metricId}`);
    
    // Get original time series
    const original = await this.getTimeSeries(metricId, startDate, endDate, interval);
    
    if (original.length === 0) {
      logger.warn('No data points found for decomposition');
      return {
        trend: [],
        seasonal: [],
        residual: [],
        original: []
      };
    }
    
    // Extract trend component
    const trend = await this.extractTrend(original, windowSize);
    
    // Calculate residual (original - trend)
    const residual = original.map((point, i) => ({
      timestamp: new Date(point.timestamp),
      value: point.value - trend[i].value
    }));
    
    // Extract seasonal component using period averaging
    // For simplicity, we're assuming daily data with weekly seasonality
    const seasonal = await this.extractSeasonality(residual, 7);
    
    return {
      trend,
      seasonal,
      residual: residual.map((point, i) => ({
        timestamp: new Date(point.timestamp),
        value: point.value - seasonal[i].value
      })),
      original
    };
  }
  
  /**
   * Extract seasonal component from residuals
   * 
   * @param residual Residual component (original - trend)
   * @param period Seasonality period (e.g., 7 for weekly)
   * @returns Seasonal component as time series
   */
  private async extractSeasonality(
    residual: TimeSeriesPoint[],
    period: number = 7
  ): Promise<TimeSeriesPoint[]> {
    if (residual.length < period * 2) {
      // Not enough data for reliable seasonality extraction
      return residual.map(point => ({
        timestamp: new Date(point.timestamp),
        value: 0
      }));
    }
    
    // Calculate average value for each position in the period
    const seasonalPattern: number[] = Array(period).fill(0);
    const countPerPosition: number[] = Array(period).fill(0);
    
    // Sum values for each position in the period
    for (let i = 0; i < residual.length; i++) {
      const position = i % period;
      seasonalPattern[position] += residual[i].value;
      countPerPosition[position]++;
    }
    
    // Calculate averages
    for (let i = 0; i < period; i++) {
      seasonalPattern[i] = countPerPosition[i] > 0 ? 
        seasonalPattern[i] / countPerPosition[i] : 0;
    }
    
    // Ensure the seasonal component sums to zero
    const seasonalMean = seasonalPattern.reduce((sum, val) => sum + val, 0) / period;
    for (let i = 0; i < period; i++) {
      seasonalPattern[i] -= seasonalMean;
    }
    
    // Apply the seasonal pattern to the entire series
    return residual.map((point, i) => ({
      timestamp: new Date(point.timestamp),
      value: seasonalPattern[i % period]
    }));
  }
  
  /**
   * Detect anomalies in a time series using Z-score method
   * 
   * @param timeSeries Time series data
   * @param threshold Z-score threshold for anomaly detection
   * @returns Time series points marked as anomalies
   */
  async detectAnomalies(
    timeSeries: TimeSeriesPoint[],
    threshold: number = 3.0
  ): Promise<TimeSeriesPoint[]> {
    if (timeSeries.length < 3) {
      return [];
    }
    
    // Calculate mean and standard deviation
    const values = timeSeries.map(p => p.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Detect anomalies based on Z-score
    const anomalies: TimeSeriesPoint[] = [];
    
    for (const point of timeSeries) {
      const zScore = Math.abs((point.value - mean) / stdDev);
      if (zScore > threshold) {
        anomalies.push({
          timestamp: new Date(point.timestamp),
          value: point.value
        });
      }
    }
    
    return anomalies;
  }
  
  /**
   * Calculate correlation between two time series
   * 
   * @param series1 First time series
   * @param series2 Second time series
   * @returns Correlation coefficient (-1 to 1)
   */
  calculateCorrelation(series1: TimeSeriesPoint[], series2: TimeSeriesPoint[]): number {
    if (series1.length !== series2.length || series1.length < 2) {
      throw new Error('Time series must have the same length and at least 2 points');
    }
    
    const values1 = series1.map(p => p.value);
    const values2 = series2.map(p => p.value);
    
    const mean1 = values1.reduce((sum, val) => sum + val, 0) / values1.length;
    const mean2 = values2.reduce((sum, val) => sum + val, 0) / values2.length;
    
    let numerator = 0;
    let denom1 = 0;
    let denom2 = 0;
    
    for (let i = 0; i < values1.length; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      
      numerator += diff1 * diff2;
      denom1 += diff1 * diff1;
      denom2 += diff2 * diff2;
    }
    
    if (denom1 === 0 || denom2 === 0) {
      return 0; // No correlation if one series has no variance
    }
    
    return numerator / (Math.sqrt(denom1) * Math.sqrt(denom2));
  }
}
