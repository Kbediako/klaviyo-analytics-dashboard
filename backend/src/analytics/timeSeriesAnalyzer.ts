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
 * Interface for time series validation errors
 */
export interface ValidationError {
  type: string;
  message: string;
  details?: any;
}

/**
 * Interface representing preprocessed time series input
 */
export interface PreprocessedTimeSeries {
  data: TimeSeriesPoint[];
  validation: {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
  };
  metadata: {
    originalLength: number;
    processedLength: number;
    hasMissingValues: boolean;
    hasOutliers: boolean;
    timeInterval: {
      mean: number;
      min: number;
      max: number;
      isRegular: boolean;
    };
  };
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
 * Interface for time interval configuration
 */
export interface TimeIntervalConfig {
  interval: string;
  milliseconds: number;
  displayName: string;
}

/**
 * Class for analyzing time series data from Klaviyo events
 */
export class TimeSeriesAnalyzer {
  // Known time interval configurations
  private readonly timeIntervals: { [key: string]: TimeIntervalConfig } = {
    '1 hour': { 
      interval: '1 hour', 
      milliseconds: 60 * 60 * 1000,
      displayName: 'Hourly' 
    },
    '1 day': { 
      interval: '1 day', 
      milliseconds: 24 * 60 * 60 * 1000,
      displayName: 'Daily' 
    },
    '1 week': { 
      interval: '1 week', 
      milliseconds: 7 * 24 * 60 * 60 * 1000,
      displayName: 'Weekly' 
    },
    '1 month': { 
      interval: '1 month', 
      milliseconds: 30 * 24 * 60 * 60 * 1000,
      displayName: 'Monthly' 
    }
  };

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
    
    // Input validation
    if (!metricId || metricId.trim() === '') {
      throw new Error('Invalid metric ID: Metric ID cannot be empty');
    }
    
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      throw new Error('Invalid start date: Date must be a valid Date object');
    }
    
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      throw new Error('Invalid end date: Date must be a valid Date object');
    }
    
    if (startDate > endDate) {
      throw new Error('Invalid date range: Start date must be before end date');
    }
    
    // Validate the interval
    if (!this.isValidInterval(interval)) {
      logger.warn(`Unknown interval "${interval}", defaulting to "1 day"`);
      interval = '1 day';
    }
    
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
      
      // If no data was found, return an empty array instead of throwing an error
      if (result.rows.length === 0) {
        logger.warn(`No data found for metric ${metricId} in the specified date range`);
        return [];
      }
      
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
   * Preprocess time series data for analysis
   * - Validates input data
   * - Handles missing values
   * - Detects and handles outliers
   * - Normalizes timestamps for irregular intervals
   * 
   * @param timeSeries Raw time series data
   * @param options Preprocessing options
   * @returns Preprocessed time series with validation info
   */
  preprocess(
    timeSeries: TimeSeriesPoint[],
    options: {
      fillMissingValues?: boolean;
      removeOutliers?: boolean;
      outlierThreshold?: number;
      normalizeTimestamps?: boolean;
      expectedInterval?: string;
    } = {}
  ): PreprocessedTimeSeries {
    const {
      fillMissingValues = true,
      removeOutliers = false,
      outlierThreshold = 3.0,
      normalizeTimestamps = false,
      expectedInterval = '1 day'
    } = options;
    
    logger.debug(`Preprocessing ${timeSeries.length} time series points`);
    
    // Initialize validation result
    const result: PreprocessedTimeSeries = {
      data: [],
      validation: {
        isValid: true,
        errors: [],
        warnings: []
      },
      metadata: {
        originalLength: timeSeries.length,
        processedLength: 0,
        hasMissingValues: false,
        hasOutliers: false,
        timeInterval: {
          mean: 0,
          min: 0,
          max: 0,
          isRegular: true
        }
      }
    };
    
    // Check for empty input
    if (!timeSeries || timeSeries.length === 0) {
      result.validation.isValid = false;
      result.validation.errors.push({
        type: 'EMPTY_INPUT',
        message: 'Empty time series data provided'
      });
      return result;
    }
    
    // Sort by timestamp
    const sortedData = [...timeSeries].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    // Validate data types and detect missing values
    const validatedData: TimeSeriesPoint[] = [];
    for (const point of sortedData) {
      // Validate timestamp
      if (!(point.timestamp instanceof Date) || isNaN(point.timestamp.getTime())) {
        result.validation.warnings.push({
          type: 'INVALID_TIMESTAMP',
          message: 'Invalid timestamp found and skipped',
          details: point
        });
        continue;
      }
      
      // Validate value
      if (typeof point.value !== 'number' || isNaN(point.value)) {
        if (fillMissingValues) {
          result.validation.warnings.push({
            type: 'MISSING_VALUE',
            message: 'Missing value found and will be filled',
            details: point
          });
          result.metadata.hasMissingValues = true;
          // We'll handle filling later, but still add the point
          validatedData.push({
            timestamp: new Date(point.timestamp),
            value: 0  // Temporary placeholder
          });
        } else {
          result.validation.warnings.push({
            type: 'MISSING_VALUE',
            message: 'Missing value found and skipped',
            details: point
          });
          result.metadata.hasMissingValues = true;
        }
        continue;
      }
      
      // Add valid point
      validatedData.push({
        timestamp: new Date(point.timestamp),
        value: point.value
      });
    }
    
    // If no valid points remain, return early
    if (validatedData.length === 0) {
      result.validation.isValid = false;
      result.validation.errors.push({
        type: 'NO_VALID_POINTS',
        message: 'No valid data points found after validation'
      });
      return result;
    }
    
    // Check for outliers
    if (validatedData.length >= 3) {
      const values = validatedData.map(p => p.value);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
      const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      const outliers = validatedData.filter(point => 
        Math.abs((point.value - mean) / stdDev) > outlierThreshold
      );
      
      if (outliers.length > 0) {
        result.metadata.hasOutliers = true;
        result.validation.warnings.push({
          type: 'OUTLIERS_DETECTED',
          message: `${outliers.length} outliers detected`,
          details: { count: outliers.length, threshold: outlierThreshold }
        });
        
        if (removeOutliers) {
          // Remove outliers if requested
          const withoutOutliers = validatedData.filter(point => 
            Math.abs((point.value - mean) / stdDev) <= outlierThreshold
          );
          
          if (withoutOutliers.length < 3) {
            // Don't remove outliers if it would leave too few points
            result.validation.warnings.push({
              type: 'OUTLIERS_NOT_REMOVED',
              message: 'Outliers not removed as it would leave too few points'
            });
          } else {
            validatedData.length = 0;
            validatedData.push(...withoutOutliers);
          }
        }
      }
    }
    
    // Analyze time intervals
    if (validatedData.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < validatedData.length; i++) {
        intervals.push(validatedData[i].timestamp.getTime() - validatedData[i-1].timestamp.getTime());
      }
      
      const intervalMean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      const intervalMin = Math.min(...intervals);
      const intervalMax = Math.max(...intervals);
      
      // Determine if the interval is regular (within 10% variance)
      const isRegular = (intervalMax - intervalMin) / intervalMean < 0.1;
      
      result.metadata.timeInterval = {
        mean: intervalMean,
        min: intervalMin,
        max: intervalMax,
        isRegular
      };
      
      // Handle irregular intervals if requested
      if (!isRegular && normalizeTimestamps) {
        // Get expected interval in milliseconds
        const expectedIntervalMs = this.timeIntervals[expectedInterval]?.milliseconds || 
                                  (24 * 60 * 60 * 1000); // Default to 1 day
        
        // Generate normalized timestamps
        const startTime = validatedData[0].timestamp.getTime();
        const endTime = validatedData[validatedData.length - 1].timestamp.getTime();
        const normalizedPoints: TimeSeriesPoint[] = [];
        
        // Create map of original points for lookup
        const pointsMap = new Map<number, TimeSeriesPoint>();
        for (const point of validatedData) {
          pointsMap.set(point.timestamp.getTime(), point);
        }
        
        // Generate regular intervals
        for (let time = startTime; time <= endTime; time += expectedIntervalMs) {
          const closestPoint = this.findClosestPoint(time, pointsMap, expectedIntervalMs * 0.5);
          
          if (closestPoint) {
            normalizedPoints.push({
              timestamp: new Date(time),
              value: closestPoint.value
            });
          } else if (fillMissingValues && normalizedPoints.length > 0) {
            // Fill missing with previous value or interpolation
            normalizedPoints.push({
              timestamp: new Date(time),
              value: normalizedPoints[normalizedPoints.length - 1].value
            });
          }
        }
        
        if (normalizedPoints.length >= 2) {
          result.validation.warnings.push({
            type: 'TIMESTAMPS_NORMALIZED',
            message: `Irregular intervals normalized to ${expectedInterval}`,
            details: { 
              originalMin: intervalMin, 
              originalMax: intervalMax, 
              normalized: expectedIntervalMs 
            }
          });
          
          validatedData.length = 0;
          validatedData.push(...normalizedPoints);
        } else {
          result.validation.warnings.push({
            type: 'NORMALIZATION_FAILED',
            message: 'Failed to normalize timestamps - insufficient data'
          });
        }
      }
    }
    
    // Fill missing values if needed
    if (fillMissingValues && result.metadata.hasMissingValues) {
      // Simple approach: fill with mean value
      const validValues = validatedData.filter(p => !isNaN(p.value)).map(p => p.value);
      if (validValues.length > 0) {
        const meanValue = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
        for (let i = 0; i < validatedData.length; i++) {
          if (isNaN(validatedData[i].value)) {
            validatedData[i].value = meanValue;
          }
        }
      }
    }
    
    // Set final result
    result.data = validatedData;
    result.metadata.processedLength = validatedData.length;
    result.validation.isValid = validatedData.length >= 2;
    
    if (!result.validation.isValid && result.validation.errors.length === 0) {
      result.validation.errors.push({
        type: 'INSUFFICIENT_DATA',
        message: 'Insufficient data points after preprocessing'
      });
    }
    
    return result;
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
    
    // Validate input
    if (!timeSeries || timeSeries.length === 0) {
      logger.warn('Empty time series provided for trend extraction');
      return [];
    }
    
    if (windowSize < 2) {
      logger.warn(`Invalid window size (${windowSize}), using minimum of 2`);
      windowSize = 2;
    }
    
    // Preprocess the data
    const preprocessed = this.preprocess(timeSeries, {
      fillMissingValues: true,
      normalizeTimestamps: false
    });
    
    if (!preprocessed.validation.isValid) {
      logger.warn('Invalid time series data for trend extraction', preprocessed.validation.errors);
      return [...timeSeries]; // Return original data if preprocessing fails
    }
    
    const processedData = preprocessed.data;
    
    if (processedData.length < windowSize) {
      logger.warn(`Time series length (${processedData.length}) is less than window size (${windowSize}), using original data as trend`);
      return [...processedData];
    }
    
    const trend: TimeSeriesPoint[] = [];
    
    for (let i = 0; i < processedData.length; i++) {
      let sum = 0;
      let count = 0;
      
      // Calculate centered moving average
      for (let j = Math.max(0, i - Math.floor(windowSize / 2)); 
           j <= Math.min(processedData.length - 1, i + Math.floor(windowSize / 2)); 
           j++) {
        sum += processedData[j].value;
        count++;
      }
      
      trend.push({
        timestamp: new Date(processedData[i].timestamp),
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
   * @param seasonalPeriod Seasonality period (number of data points in one cycle)
   * @returns Decomposed time series components
   */
  async decompose(
    metricId: string, 
    startDate: Date, 
    endDate: Date,
    interval: string = '1 day',
    windowSize: number = 7,
    seasonalPeriod?: number
  ): Promise<TimeSeriesResult> {
    logger.info(`Decomposing time series for metric ${metricId}`);
    
    // Input validation
    if (!metricId || metricId.trim() === '') {
      throw new Error('Invalid metric ID: Metric ID cannot be empty');
    }
    
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      throw new Error('Invalid start date: Date must be a valid Date object');
    }
    
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      throw new Error('Invalid end date: Date must be a valid Date object');
    }
    
    if (startDate > endDate) {
      throw new Error('Invalid date range: Start date must be before end date');
    }
    
    // Auto-detect seasonality period if not provided
    if (!seasonalPeriod) {
      // Default periods based on interval
      if (interval === '1 hour') {
        seasonalPeriod = 24; // Daily cycle for hourly data
      } else if (interval === '1 day') {
        seasonalPeriod = 7; // Weekly cycle for daily data
      } else if (interval === '1 week') {
        seasonalPeriod = 4; // Monthly cycle for weekly data
      } else if (interval === '1 month') {
        seasonalPeriod = 12; // Yearly cycle for monthly data
      } else {
        seasonalPeriod = 7; // Default to weekly
      }
    }
    
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
    
    // Preprocess the data
    const preprocessed = this.preprocess(original, {
      fillMissingValues: true,
      normalizeTimestamps: true,
      expectedInterval: interval
    });
    
    if (!preprocessed.validation.isValid) {
      logger.warn('Invalid time series data for decomposition', preprocessed.validation.errors);
      return {
        trend: [],
        seasonal: [],
        residual: [],
        original
      };
    }
    
    const processedData = preprocessed.data;
    
    // Extract trend component
    const trend = await this.extractTrend(processedData, windowSize);
    
    // Calculate residual (original - trend)
    const residual = processedData.map((point, i) => ({
      timestamp: new Date(point.timestamp),
      value: point.value - trend[i].value
    }));
    
    // Extract seasonal component using period averaging
    const seasonal = await this.extractSeasonality(residual, seasonalPeriod);
    
    return {
      trend,
      seasonal,
      residual: residual.map((point, i) => ({
        timestamp: new Date(point.timestamp),
        value: point.value - seasonal[i].value
      })),
      original: processedData
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
    // Validate input
    if (!residual || residual.length === 0) {
      return [];
    }
    
    if (period < 2) {
      logger.warn(`Invalid seasonality period (${period}), defaulting to 7`);
      period = 7;
    }
    
    if (residual.length < period * 2) {
      // Not enough data for reliable seasonality extraction
      logger.warn(`Not enough data for seasonality extraction (need ${period * 2}, got ${residual.length})`);
      return residual.map(point => ({
        timestamp: new Date(point.timestamp),
        value: 0
      }));
    }
    
    // Calculate average value for each position in the period
    const seasonalPattern: number[] = Array(period).fill(0);
    const countPerPosition: number[] = Array(period).fill(0);
    
    // Sort by timestamp to ensure correct ordering
    const sortedResidual = [...residual].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    // Sum values for each position in the period
    for (let i = 0; i < sortedResidual.length; i++) {
      const position = i % period;
      seasonalPattern[position] += sortedResidual[i].value;
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
    return sortedResidual.map((point, i) => ({
      timestamp: new Date(point.timestamp),
      value: seasonalPattern[i % period]
    }));
  }
  
  /**
   * Detect anomalies in a time series using Z-score method
   * 
   * @param timeSeries Time series data
   * @param threshold Z-score threshold for anomaly detection
   * @param lookbackWindow Optional window size for local anomaly detection
   * @returns Time series points marked as anomalies
   */
  async detectAnomalies(
    timeSeries: TimeSeriesPoint[],
    threshold: number = 3.0,
    lookbackWindow?: number
  ): Promise<TimeSeriesPoint[]> {
    // Validate input
    if (!timeSeries || timeSeries.length === 0) {
      logger.warn('Empty time series provided for anomaly detection');
      return [];
    }
    
    if (threshold <= 0) {
      logger.warn(`Invalid threshold (${threshold}), using default of 3.0`);
      threshold = 3.0;
    }
    
    // Preprocess the data
    const preprocessed = this.preprocess(timeSeries, {
      fillMissingValues: true,
      removeOutliers: false // We want to keep outliers for anomaly detection
    });
    
    if (!preprocessed.validation.isValid) {
      logger.warn('Invalid time series data for anomaly detection', preprocessed.validation.errors);
      return [];
    }
    
    const processedData = preprocessed.data;
    
    if (processedData.length < 3) {
      logger.warn('Need at least 3 data points for anomaly detection');
      return [];
    }
    
    const anomalies: TimeSeriesPoint[] = [];
    
    // If lookback window is specified, use local anomaly detection
    if (lookbackWindow && lookbackWindow > 0 && lookbackWindow < processedData.length) {
      // Sort by timestamp to ensure correct ordering
      const sortedData = [...processedData].sort((a, b) => 
        a.timestamp.getTime() - b.timestamp.getTime()
      );
      
      // Detect anomalies using moving window
      for (let i = lookbackWindow; i < sortedData.length; i++) {
        const window = sortedData.slice(i - lookbackWindow, i);
        const values = window.map(p => p.value);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        
        // Skip if all values in the window are identical (avoid division by zero)
        const allSame = values.every(val => val === values[0]);
        if (allSame) continue;
        
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        const currentPoint = sortedData[i];
        const zScore = Math.abs((currentPoint.value - mean) / stdDev);
        
        if (zScore > threshold) {
          anomalies.push({
            timestamp: new Date(currentPoint.timestamp),
            value: currentPoint.value
          });
        }
      }
    } else {
      // Global anomaly detection (using all data points)
      const values = processedData.map(p => p.value);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
      const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      // Avoid division by zero if all values are identical
      if (stdDev === 0) {
        return [];
      }
      
      for (const point of processedData) {
        const zScore = Math.abs((point.value - mean) / stdDev);
        if (zScore > threshold) {
          anomalies.push({
            timestamp: new Date(point.timestamp),
            value: point.value
          });
        }
      }
    }
    
    return anomalies;
  }
  
  /**
   * Calculate correlation between two time series
   * 
   * @param series1 First time series
   * @param series2 Second time series
   * @param alignTimestamps Whether to align timestamps before calculation
   * @returns Correlation coefficient (-1 to 1)
   */
  calculateCorrelation(
    series1: TimeSeriesPoint[], 
    series2: TimeSeriesPoint[],
    alignTimestamps: boolean = false
  ): number {
    // Validate input
    if (!series1 || !series2 || series1.length === 0 || series2.length === 0) {
      throw new Error('Empty time series provided for correlation calculation');
    }
    
    // If alignTimestamps is true, match points by closest timestamp
    let values1: number[];
    let values2: number[];
    
    if (alignTimestamps) {
      // Create maps of timestamp to value for quick lookup
      const map1 = new Map<number, number>();
      const map2 = new Map<number, number>();
      
      for (const point of series1) {
        map1.set(point.timestamp.getTime(), point.value);
      }
      
      for (const point of series2) {
        map2.set(point.timestamp.getTime(), point.value);
      }
      
      // Get all unique timestamps
      const allTimestamps = [...new Set([
        ...Array.from(map1.keys()),
        ...Array.from(map2.keys())
      ])].sort();
      
      // Find matching points or closest points
      const matchedPairs: Array<[number, number]> = [];
      
      for (const timestamp of allTimestamps) {
        if (map1.has(timestamp) && map2.has(timestamp)) {
          // Direct match
          matchedPairs.push([map1.get(timestamp)!, map2.get(timestamp)!]);
        } else {
          // Find closest timestamp within a reasonable window (1 day)
          const MAX_DISTANCE = 24 * 60 * 60 * 1000; // 1 day in milliseconds
          
          if (map1.has(timestamp) && !map2.has(timestamp)) {
            const closestTs2 = this.findClosestTimestamp(timestamp, Array.from(map2.keys()), MAX_DISTANCE);
            if (closestTs2 !== null) {
              matchedPairs.push([map1.get(timestamp)!, map2.get(closestTs2)!]);
            }
          } else if (!map1.has(timestamp) && map2.has(timestamp)) {
            const closestTs1 = this.findClosestTimestamp(timestamp, Array.from(map1.keys()), MAX_DISTANCE);
            if (closestTs1 !== null) {
              matchedPairs.push([map1.get(closestTs1)!, map2.get(timestamp)!]);
            }
          }
        }
      }
      
      // Check if we have enough matched pairs
      if (matchedPairs.length < 2) {
        throw new Error('Not enough matching data points for correlation calculation');
      }
      
      values1 = matchedPairs.map(pair => pair[0]);
      values2 = matchedPairs.map(pair => pair[1]);
    } else {
      // Require exact match in series length
      if (series1.length !== series2.length) {
        throw new Error(`Time series must have the same length (got ${series1.length} and ${series2.length})`);
      }
      
      if (series1.length < 2) {
        throw new Error('Time series must have at least 2 points for correlation calculation');
      }
      
      values1 = series1.map(p => p.value);
      values2 = series2.map(p => p.value);
    }
    
    // Calculate means
    const mean1 = values1.reduce((sum, val) => sum + val, 0) / values1.length;
    const mean2 = values2.reduce((sum, val) => sum + val, 0) / values2.length;
    
    // Check for constant series
    const isConstant1 = values1.every(val => val === values1[0]);
    const isConstant2 = values2.every(val => val === values2[0]);
    
    if (isConstant1 && isConstant2) {
      return 1; // Two constant series are perfectly correlated
    } else if (isConstant1 || isConstant2) {
      return 0; // Constant series has no correlation with non-constant series
    }
    
    // Calculate correlation
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
  
  /**
   * Check if an interval string is valid
   * 
   * @param interval Interval string to check
   * @returns Whether the interval is valid
   */
  private isValidInterval(interval: string): boolean {
    return Object.keys(this.timeIntervals).includes(interval);
  }
  
  /**
   * Find closest timestamp within a maximum distance
   * 
   * @param target Target timestamp (ms)
   * @param timestamps Array of timestamps to search (ms)
   * @param maxDistance Maximum allowed distance (ms)
   * @returns Closest timestamp or null if none within maxDistance
   */
  private findClosestTimestamp(
    target: number, 
    timestamps: number[], 
    maxDistance: number
  ): number | null {
    if (timestamps.length === 0) return null;
    
    let closest = timestamps[0];
    let minDistance = Math.abs(target - closest);
    
    for (let i = 1; i < timestamps.length; i++) {
      const distance = Math.abs(target - timestamps[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closest = timestamps[i];
      }
    }
    
    return minDistance <= maxDistance ? closest : null;
  }
  
  /**
   * Find closest time series point to a timestamp
   * 
   * @param timestamp Target timestamp (ms)
   * @param points Map of timestamp to point
   * @param maxDistance Maximum allowed distance (ms)
   * @returns Closest point or undefined if none within maxDistance
   */
  private findClosestPoint(
    timestamp: number,
    pointsMap: Map<number, TimeSeriesPoint>,
    maxDistance: number
  ): TimeSeriesPoint | undefined {
    // Check for exact match
    if (pointsMap.has(timestamp)) {
      return pointsMap.get(timestamp);
    }
    
    // Find closest within max distance
    let closestPoint: TimeSeriesPoint | undefined;
    let minDistance = maxDistance;
    
    for (const [pointTime, point] of pointsMap.entries()) {
      const distance = Math.abs(timestamp - pointTime);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    }
    
    return closestPoint;
  }
  
  /**
   * Calculate sample entropy, a measure of time series complexity and randomness
   * 
   * @param timeSeries Time series data
   * @param m Embedding dimension (default: 2)
   * @param r Tolerance (default: 0.2 * standard deviation)
   * @returns Sample entropy value
   */
  calculateSampleEntropy(
    timeSeries: TimeSeriesPoint[],
    m: number = 2,
    r?: number
  ): number {
    // Extract values from time series
    const values = timeSeries.map(p => p.value);
    
    if (values.length < m + 2) {
      throw new Error(`Need at least ${m + 2} data points to calculate sample entropy`);
    }
    
    // Set default tolerance if not provided
    if (r === undefined) {
      const std = this.calculateStandardDeviation(values);
      r = 0.2 * std;
    }
    
    // Count number of matches for embedding dimensions m and m+1
    const count1 = this.countMatches(values, m, r);
    const count2 = this.countMatches(values, m + 1, r);
    
    // Avoid log(0)
    if (count1 === 0 || count2 === 0) {
      return Infinity;
    }
    
    // Calculate sample entropy
    return -Math.log(count2 / count1);
  }
  
  /**
   * Helper method to count matches for sample entropy
   */
  private countMatches(values: number[], m: number, r: number): number {
    let count = 0;
    const N = values.length;
    
    for (let i = 0; i <= N - m - 1; i++) {
      for (let j = i + 1; j <= N - m - 1; j++) {
        let maxDiff = 0;
        for (let k = 0; k < m; k++) {
          const diff = Math.abs(values[i + k] - values[j + k]);
          maxDiff = Math.max(maxDiff, diff);
        }
        if (maxDiff <= r) {
          count++;
        }
      }
    }
    
    return count * 2 / ((N - m) * (N - m - 1));
  }
  
  /**
   * Helper method to calculate standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(variance);
  }
}
