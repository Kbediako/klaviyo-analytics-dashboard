import { TimeSeriesAnalyzer, TimeSeriesPoint } from './timeSeriesAnalyzer';
import { logger } from '../utils/logger';

/**
 * Interface representing a forecast result
 */
export interface ForecastResult {
  forecast: TimeSeriesPoint[];
  confidence: {
    upper: TimeSeriesPoint[];
    lower: TimeSeriesPoint[];
  };
  accuracy: number;
  method: string;
}

/**
 * Service for generating forecasts from time series data
 */
export class ForecastService {
  private timeSeriesAnalyzer: TimeSeriesAnalyzer;
  
  constructor() {
    this.timeSeriesAnalyzer = new TimeSeriesAnalyzer();
  }
  
  /**
   * Generate a naive forecast (last value) with confidence intervals
   * 
   * @param metricId Metric ID to forecast
   * @param startDate Start date for historical data
   * @param endDate End date for historical data
   * @param forecastHorizon Number of periods to forecast
   * @param interval Time bucket interval (e.g., '1 day', '1 hour')
   * @returns Forecast result
   */
  async naiveForecast(
    metricId: string,
    startDate: Date,
    endDate: Date,
    forecastHorizon: number,
    interval: string = '1 day'
  ): Promise<ForecastResult> {
    logger.info(`Generating naive forecast for metric ${metricId} with horizon ${forecastHorizon}`);
    
    // Get historical data
    const historical = await this.timeSeriesAnalyzer.getTimeSeries(
      metricId, startDate, endDate, interval
    );
    
    if (historical.length === 0) {
      throw new Error('Not enough data for forecasting');
    }
    
    const lastDate = historical[historical.length - 1].timestamp;
    const lastValue = historical[historical.length - 1].value;
    
    // Calculate standard deviation for confidence intervals
    const values = historical.map(p => p.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(x => Math.pow(x - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Generate forecast points
    const forecast: TimeSeriesPoint[] = [];
    const upper: TimeSeriesPoint[] = [];
    const lower: TimeSeriesPoint[] = [];
    
    // Determine the interval in milliseconds
    let intervalMs: number;
    if (interval === '1 day') {
      intervalMs = 24 * 60 * 60 * 1000;
    } else if (interval === '1 hour') {
      intervalMs = 60 * 60 * 1000;
    } else if (interval === '1 week') {
      intervalMs = 7 * 24 * 60 * 60 * 1000;
    } else {
      // Default to daily
      intervalMs = 24 * 60 * 60 * 1000;
    }
    
    for (let i = 1; i <= forecastHorizon; i++) {
      const forecastDate = new Date(lastDate.getTime() + i * intervalMs);
      
      forecast.push({
        timestamp: forecastDate,
        value: lastValue
      });
      
      upper.push({
        timestamp: forecastDate,
        value: lastValue + 1.96 * stdDev
      });
      
      lower.push({
        timestamp: forecastDate,
        value: Math.max(0, lastValue - 1.96 * stdDev)
      });
    }
    
    // Calculate a simple accuracy metric based on historical data
    // (using mean absolute percentage error on the last few points)
    const accuracy = this.calculateAccuracy(historical);
    
    return {
      forecast,
      confidence: {
        upper,
        lower
      },
      accuracy,
      method: 'naive'
    };
  }
  
  /**
   * Generate a moving average forecast with confidence intervals
   * 
   * @param metricId Metric ID to forecast
   * @param startDate Start date for historical data
   * @param endDate End date for historical data
   * @param forecastHorizon Number of periods to forecast
   * @param windowSize Window size for moving average
   * @param interval Time bucket interval (e.g., '1 day', '1 hour')
   * @returns Forecast result
   */
  async movingAverageForecast(
    metricId: string,
    startDate: Date,
    endDate: Date,
    forecastHorizon: number,
    windowSize: number = 7,
    interval: string = '1 day'
  ): Promise<ForecastResult> {
    logger.info(`Generating moving average forecast for metric ${metricId} with horizon ${forecastHorizon}`);
    
    // Get historical data
    const historical = await this.timeSeriesAnalyzer.getTimeSeries(
      metricId, startDate, endDate, interval
    );
    
    if (historical.length < windowSize) {
      throw new Error(`Not enough data for forecasting. Need at least ${windowSize} data points.`);
    }
    
    // Calculate moving average of the last windowSize points
    const lastValues = historical.slice(-windowSize).map(p => p.value);
    const forecastValue = lastValues.reduce((a, b) => a + b, 0) / windowSize;
    
    const lastDate = historical[historical.length - 1].timestamp;
    
    // Calculate standard deviation for confidence intervals
    const values = historical.map(p => p.value);
    const squaredDiffs = values.map(x => Math.pow(x - forecastValue, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Generate forecast points
    const forecast: TimeSeriesPoint[] = [];
    const upper: TimeSeriesPoint[] = [];
    const lower: TimeSeriesPoint[] = [];
    
    // Determine the interval in milliseconds
    let intervalMs: number;
    if (interval === '1 day') {
      intervalMs = 24 * 60 * 60 * 1000;
    } else if (interval === '1 hour') {
      intervalMs = 60 * 60 * 1000;
    } else if (interval === '1 week') {
      intervalMs = 7 * 24 * 60 * 60 * 1000;
    } else {
      // Default to daily
      intervalMs = 24 * 60 * 60 * 1000;
    }
    
    for (let i = 1; i <= forecastHorizon; i++) {
      const forecastDate = new Date(lastDate.getTime() + i * intervalMs);
      
      forecast.push({
        timestamp: forecastDate,
        value: forecastValue
      });
      
      upper.push({
        timestamp: forecastDate,
        value: forecastValue + 1.96 * stdDev
      });
      
      lower.push({
        timestamp: forecastDate,
        value: Math.max(0, forecastValue - 1.96 * stdDev)
      });
    }
    
    // Calculate accuracy
    const accuracy = this.calculateAccuracy(historical);
    
    return {
      forecast,
      confidence: {
        upper,
        lower
      },
      accuracy,
      method: 'moving_average'
    };
  }
  
  /**
   * Generate a linear regression forecast with confidence intervals
   * 
   * @param metricId Metric ID to forecast
   * @param startDate Start date for historical data
   * @param endDate End date for historical data
   * @param forecastHorizon Number of periods to forecast
   * @param interval Time bucket interval (e.g., '1 day', '1 hour')
   * @returns Forecast result
   */
  async linearRegressionForecast(
    metricId: string,
    startDate: Date,
    endDate: Date,
    forecastHorizon: number,
    interval: string = '1 day'
  ): Promise<ForecastResult> {
    logger.info(`Generating linear regression forecast for metric ${metricId} with horizon ${forecastHorizon}`);
    
    // Get historical data
    const historical = await this.timeSeriesAnalyzer.getTimeSeries(
      metricId, startDate, endDate, interval
    );
    
    if (historical.length < 2) {
      throw new Error('Not enough data for forecasting. Need at least 2 data points.');
    }
    
    // Convert timestamps to numeric values (days since first point)
    const firstTimestamp = historical[0].timestamp.getTime();
    const x = historical.map(p => (p.timestamp.getTime() - firstTimestamp) / (24 * 60 * 60 * 1000));
    const y = historical.map(p => p.value);
    
    // Calculate linear regression coefficients
    const { slope, intercept, rSquared } = this.calculateLinearRegression(x, y);
    
    const lastDate = historical[historical.length - 1].timestamp;
    const lastX = x[x.length - 1];
    
    // Calculate residuals and standard error
    const predictions = x.map(xi => intercept + slope * xi);
    const residuals = y.map((yi, i) => yi - predictions[i]);
    const sumSquaredResiduals = residuals.reduce((sum, r) => sum + r * r, 0);
    const standardError = Math.sqrt(sumSquaredResiduals / (historical.length - 2));
    
    // Generate forecast points
    const forecast: TimeSeriesPoint[] = [];
    const upper: TimeSeriesPoint[] = [];
    const lower: TimeSeriesPoint[] = [];
    
    // Determine the interval in milliseconds
    let intervalMs: number;
    if (interval === '1 day') {
      intervalMs = 24 * 60 * 60 * 1000;
    } else if (interval === '1 hour') {
      intervalMs = 60 * 60 * 1000;
    } else if (interval === '1 week') {
      intervalMs = 7 * 24 * 60 * 60 * 1000;
    } else {
      // Default to daily
      intervalMs = 24 * 60 * 60 * 1000;
    }
    
    for (let i = 1; i <= forecastHorizon; i++) {
      const forecastDate = new Date(lastDate.getTime() + i * intervalMs);
      const forecastX = lastX + i;
      const forecastValue = intercept + slope * forecastX;
      
      // Calculate prediction interval
      // t-value for 95% confidence with n-2 degrees of freedom
      // Using approximate t-value of 2 for simplicity
      const tValue = 2;
      const xMean = x.reduce((sum, xi) => sum + xi, 0) / x.length;
      const sumSquaredX = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);
      const predictionError = standardError * Math.sqrt(1 + 1/x.length + Math.pow(forecastX - xMean, 2) / sumSquaredX);
      
      forecast.push({
        timestamp: forecastDate,
        value: Math.max(0, forecastValue)
      });
      
      upper.push({
        timestamp: forecastDate,
        value: forecastValue + tValue * predictionError
      });
      
      lower.push({
        timestamp: forecastDate,
        value: Math.max(0, forecastValue - tValue * predictionError)
      });
    }
    
    return {
      forecast,
      confidence: {
        upper,
        lower
      },
      accuracy: rSquared,
      method: 'linear_regression'
    };
  }
  
  /**
   * Calculate linear regression coefficients
   * 
   * @param x X values (independent variable)
   * @param y Y values (dependent variable)
   * @returns Slope, intercept, and R-squared
   */
  private calculateLinearRegression(x: number[], y: number[]): { slope: number; intercept: number; rSquared: number } {
    const n = x.length;
    
    // Calculate means
    const xMean = x.reduce((sum, val) => sum + val, 0) / n;
    const yMean = y.reduce((sum, val) => sum + val, 0) / n;
    
    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (y[i] - yMean);
      denominator += Math.pow(x[i] - xMean, 2);
    }
    
    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;
    
    // Calculate R-squared
    const predictions = x.map(xi => intercept + slope * xi);
    const totalSumOfSquares = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const residualSumOfSquares = y.reduce((sum, yi, i) => sum + Math.pow(yi - predictions[i], 2), 0);
    const rSquared = 1 - (residualSumOfSquares / totalSumOfSquares);
    
    return { slope, intercept, rSquared };
  }
  
  /**
   * Calculate forecast accuracy using mean absolute percentage error
   * 
   * @param historical Historical time series data
   * @returns Accuracy as a value between 0 and 1 (higher is better)
   */
  private calculateAccuracy(historical: TimeSeriesPoint[]): number {
    if (historical.length < 4) {
      return 0.5; // Not enough data for meaningful accuracy calculation
    }
    
    // Use the last 3 points for validation
    const trainingData = historical.slice(0, -3);
    const validationData = historical.slice(-3);
    
    // Calculate mean of training data (simple forecast)
    const trainingMean = trainingData.reduce((sum, point) => sum + point.value, 0) / trainingData.length;
    
    // Calculate mean absolute percentage error
    let sumAbsPercentageError = 0;
    
    for (const point of validationData) {
      const actual = point.value;
      const forecast = trainingMean;
      
      if (actual !== 0) {
        const absPercentageError = Math.abs((actual - forecast) / actual);
        sumAbsPercentageError += absPercentageError;
      }
    }
    
    const mape = sumAbsPercentageError / validationData.length;
    
    // Convert MAPE to accuracy (0-1 scale, higher is better)
    // Using a simple transformation: accuracy = max(0, 1 - mape)
    return Math.max(0, Math.min(1, 1 - mape));
  }
}
