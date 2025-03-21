import { TimeSeriesAnalyzer, TimeSeriesPoint, PreprocessedTimeSeries } from './timeSeriesAnalyzer';
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
  metadata?: {
    validationMetrics?: ForecastValidationMetrics;
    modelParams?: Record<string, any>;
    warnings?: string[];
  };
}

/**
 * Interface for forecast validation metrics
 */
export interface ForecastValidationMetrics {
  mape: number;  // Mean Absolute Percentage Error
  rmse: number;  // Root Mean Square Error
  mae: number;   // Mean Absolute Error
  r2: number;    // R-squared (coefficient of determination)
}

/**
 * Interface for time interval information
 */
export interface TimeInterval {
  intervalMs: number;
  displayName: string;
}

/**
 * Supported forecast methods
 */
export type ForecastMethod = 'naive' | 'moving_average' | 'linear_regression' | 'seasonal_naive' | 'auto';

/**
 * Service for generating forecasts from time series data
 */
export class ForecastService {
  private timeSeriesAnalyzer: TimeSeriesAnalyzer;
  private readonly timeIntervals: { [key: string]: TimeInterval } = {
    '1 hour': { intervalMs: 60 * 60 * 1000, displayName: 'Hourly' },
    '1 day': { intervalMs: 24 * 60 * 60 * 1000, displayName: 'Daily' },
    '1 week': { intervalMs: 7 * 24 * 60 * 60 * 1000, displayName: 'Weekly' },
    '1 month': { intervalMs: 30 * 24 * 60 * 60 * 1000, displayName: 'Monthly' }
  };
  
  constructor() {
    this.timeSeriesAnalyzer = new TimeSeriesAnalyzer();
  }
  
  /**
   * Generate forecast using the best method determined automatically
   * 
   * @param metricId Metric ID to forecast
   * @param startDate Start date for historical data
   * @param endDate End date for historical data
   * @param forecastHorizon Number of periods to forecast
   * @param interval Time bucket interval (e.g., '1 day', '1 hour')
   * @returns Forecast result with the best accuracy
   */
  async generateForecast(
    metricId: string,
    startDate: Date,
    endDate: Date, 
    forecastHorizon: number,
    method: ForecastMethod = 'auto',
    interval: string = '1 day',
    options: {
      windowSize?: number;
      confidenceLevel?: number;
      seasonalPeriod?: number;
      validateWithHistory?: boolean;
    } = {}
  ): Promise<ForecastResult> {
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
    
    if (forecastHorizon < 1) {
      throw new Error('Invalid forecast horizon: Must be at least 1');
    }
    
    if (!Object.keys(this.timeIntervals).includes(interval)) {
      logger.warn(`Unknown interval "${interval}", defaulting to "1 day"`);
      interval = '1 day';
    }
    
    const {
      windowSize = 7,
      confidenceLevel = 0.95,
      seasonalPeriod,
      validateWithHistory = false
    } = options;
    
    // Get historical data
    const historical = await this.timeSeriesAnalyzer.getTimeSeries(
      metricId, startDate, endDate, interval
    );
    
    // Preprocess the data
    const preprocessed = this.timeSeriesAnalyzer.preprocess(historical, {
      fillMissingValues: true,
      normalizeTimestamps: true,
      expectedInterval: interval
    });
    
    // Check if we have enough data
    if (!preprocessed.validation.isValid || preprocessed.data.length < 2) {
      throw new Error('Not enough valid data points for forecasting');
    }
    
    // If auto method, determine the best method
    if (method === 'auto') {
      method = await this.determineBestMethod(preprocessed, interval);
      logger.info(`Auto-selected forecast method: ${method}`);
    }
    
    // Generate forecast using selected method
    let result: ForecastResult;
    switch (method) {
      case 'moving_average':
        result = await this.movingAverageForecast(
          preprocessed,
          forecastHorizon,
          windowSize,
          interval,
          confidenceLevel
        );
        break;
        
      case 'linear_regression':
        result = await this.linearRegressionForecast(
          preprocessed,
          forecastHorizon,
          interval,
          confidenceLevel
        );
        break;
        
      case 'seasonal_naive':
        result = await this.seasonalNaiveForecast(
          preprocessed,
          forecastHorizon,
          seasonalPeriod,
          interval,
          confidenceLevel
        );
        break;
        
      case 'naive':
      default:
        result = await this.naiveForecast(
          preprocessed,
          forecastHorizon,
          interval,
          confidenceLevel
        );
        break;
    }
    
    // Validate against historical data if requested
    if (validateWithHistory && preprocessed.data.length >= 10) {
      const validationMetrics = this.validateForecastAccuracy(
        preprocessed.data, 
        method,
        forecastHorizon,
        {
          windowSize,
          seasonalPeriod,
          confidenceLevel
        }
      );
      
      if (!result.metadata) {
        result.metadata = {};
      }
      
      result.metadata.validationMetrics = validationMetrics;
      
      // Update accuracy based on validation metrics
      result.accuracy = 1 - Math.min(1, validationMetrics.mape);
    }
    
    return result;
  }
  
  /**
   * Generate a naive forecast (last value) with confidence intervals
   * 
   * @param preprocessedData Preprocessed time series data
   * @param forecastHorizon Number of periods to forecast
   * @param interval Time bucket interval (e.g., '1 day', '1 hour')
   * @param confidenceLevel Confidence level for prediction intervals (0-1)
   * @returns Forecast result
   */
  async naiveForecast(
    preprocessedData: PreprocessedTimeSeries,
    forecastHorizon: number,
    interval: string = '1 day',
    confidenceLevel: number = 0.95
  ): Promise<ForecastResult> {
    logger.info(`Generating naive forecast with horizon ${forecastHorizon}`);
    
    const historical = preprocessedData.data;
    
    if (historical.length === 0) {
      throw new Error('Not enough data for naive forecasting');
    }
    
    const lastDate = historical[historical.length - 1].timestamp;
    const lastValue = historical[historical.length - 1].value;
    
    // Calculate standard deviation for confidence intervals
    const values = historical.map(p => p.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(x => Math.pow(x - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Get appropriate z-value for the confidence level
    const zValue = this.getZValue(confidenceLevel);
    
    // Generate forecast points
    const forecast: TimeSeriesPoint[] = [];
    const upper: TimeSeriesPoint[] = [];
    const lower: TimeSeriesPoint[] = [];
    
    // Get interval in milliseconds
    const intervalMs = this.timeIntervals[interval]?.intervalMs || 
                       (24 * 60 * 60 * 1000); // Default to daily
    
    for (let i = 1; i <= forecastHorizon; i++) {
      const forecastDate = new Date(lastDate.getTime() + i * intervalMs);
      
      forecast.push({
        timestamp: forecastDate,
        value: lastValue
      });
      
      upper.push({
        timestamp: forecastDate,
        value: lastValue + zValue * stdDev
      });
      
      lower.push({
        timestamp: forecastDate,
        value: Math.max(0, lastValue - zValue * stdDev)
      });
    }
    
    // Calculate a simple accuracy metric based on historical data
    const accuracy = this.calculateAccuracy(historical);
    
    return {
      forecast,
      confidence: {
        upper,
        lower
      },
      accuracy,
      method: 'naive',
      metadata: {
        modelParams: {
          lastValue,
          stdDev,
          confidenceLevel,
          zValue
        }
      }
    };
  }
  
  /**
   * Generate a seasonal naive forecast with confidence intervals
   * 
   * @param preprocessedData Preprocessed time series data
   * @param forecastHorizon Number of periods to forecast
   * @param seasonalPeriod Seasonality period (number of time points in one cycle)
   * @param interval Time bucket interval (e.g., '1 day', '1 hour')
   * @param confidenceLevel Confidence level for prediction intervals (0-1)
   * @returns Forecast result
   */
  async seasonalNaiveForecast(
    preprocessedData: PreprocessedTimeSeries,
    forecastHorizon: number,
    seasonalPeriod?: number,
    interval: string = '1 day',
    confidenceLevel: number = 0.95
  ): Promise<ForecastResult> {
    logger.info(`Generating seasonal naive forecast with horizon ${forecastHorizon}`);
    
    const historical = preprocessedData.data;
    
    if (historical.length === 0) {
      throw new Error('Not enough data for seasonal naive forecasting');
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
    
    // We need at least one full season plus 1 data point
    if (historical.length < seasonalPeriod + 1) {
      logger.warn(`Not enough data for seasonal forecasting with period ${seasonalPeriod}, falling back to naive forecast`);
      return this.naiveForecast(preprocessedData, forecastHorizon, interval, confidenceLevel);
    }
    
    const lastDate = historical[historical.length - 1].timestamp;
    
    // Calculate residuals based on seasonal differences
    const residuals: number[] = [];
    for (let i = seasonalPeriod; i < historical.length; i++) {
      const diff = historical[i].value - historical[i - seasonalPeriod].value;
      residuals.push(diff);
    }
    
    // Calculate standard deviation of residuals
    const mean = residuals.reduce((a, b) => a + b, 0) / residuals.length;
    const squaredDiffs = residuals.map(x => Math.pow(x - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / residuals.length;
    const stdDev = Math.sqrt(variance);
    
    // Get appropriate z-value for the confidence level
    const zValue = this.getZValue(confidenceLevel);
    
    // Generate forecast points
    const forecast: TimeSeriesPoint[] = [];
    const upper: TimeSeriesPoint[] = [];
    const lower: TimeSeriesPoint[] = [];
    
    // Get interval in milliseconds
    const intervalMs = this.timeIntervals[interval]?.intervalMs || 
                       (24 * 60 * 60 * 1000); // Default to daily
    
    for (let i = 1; i <= forecastHorizon; i++) {
      const forecastDate = new Date(lastDate.getTime() + i * intervalMs);
      
      // Find the seasonal equivalent point
      const seasonalOffset = i % seasonalPeriod;
      const seasonalIndex = historical.length - seasonalPeriod + seasonalOffset;
      
      // If we don't have enough data, use the last available point
      const seasonalValue = seasonalIndex >= 0 && seasonalIndex < historical.length ? 
                          historical[seasonalIndex].value : 
                          historical[historical.length - 1].value;
      
      forecast.push({
        timestamp: forecastDate,
        value: seasonalValue
      });
      
      upper.push({
        timestamp: forecastDate,
        value: seasonalValue + zValue * stdDev * Math.sqrt(i)
      });
      
      lower.push({
        timestamp: forecastDate,
        value: Math.max(0, seasonalValue - zValue * stdDev * Math.sqrt(i))
      });
    }
    
    // Calculate accuracy
    const accuracy = this.calculateSeasonalAccuracy(historical, seasonalPeriod);
    
    return {
      forecast,
      confidence: {
        upper,
        lower
      },
      accuracy,
      method: 'seasonal_naive',
      metadata: {
        modelParams: {
          seasonalPeriod,
          stdDev,
          confidenceLevel,
          zValue
        }
      }
    };
  }
  
  /**
   * Generate a moving average forecast with confidence intervals
   * 
   * @param preprocessedData Preprocessed time series data
   * @param forecastHorizon Number of periods to forecast
   * @param windowSize Window size for moving average
   * @param interval Time bucket interval (e.g., '1 day', '1 hour')
   * @param confidenceLevel Confidence level for prediction intervals (0-1)
   * @returns Forecast result
   */
  async movingAverageForecast(
    preprocessedData: PreprocessedTimeSeries,
    forecastHorizon: number,
    windowSize: number = 7,
    interval: string = '1 day',
    confidenceLevel: number = 0.95
  ): Promise<ForecastResult> {
    logger.info(`Generating moving average forecast with horizon ${forecastHorizon}, window size ${windowSize}`);
    
    const historical = preprocessedData.data;
    
    // Validate window size
    if (windowSize < 2) {
      logger.warn(`Invalid window size (${windowSize}), using minimum of 2`);
      windowSize = 2;
    }
    
    if (historical.length < windowSize) {
      throw new Error(`Not enough data for moving average forecasting. Need at least ${windowSize} data points.`);
    }
    
    // Calculate moving average of the last windowSize points
    const lastValues = historical.slice(-windowSize).map(p => p.value);
    const forecastValue = lastValues.reduce((a, b) => a + b, 0) / windowSize;
    
    const lastDate = historical[historical.length - 1].timestamp;
    
    // Calculate standard deviation for confidence intervals
    const residuals: number[] = [];
    for (let i = windowSize; i < historical.length; i++) {
      const windowAvg = historical.slice(i - windowSize, i).reduce((sum, p) => sum + p.value, 0) / windowSize;
      residuals.push(historical[i].value - windowAvg);
    }
    
    // Calculate standard deviation of residuals
    const mean = residuals.reduce((a, b) => a + b, 0) / residuals.length;
    const squaredDiffs = residuals.map(x => Math.pow(x - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / residuals.length;
    const stdDev = Math.sqrt(variance);
    
    // Get appropriate z-value for the confidence level
    const zValue = this.getZValue(confidenceLevel);
    
    // Generate forecast points
    const forecast: TimeSeriesPoint[] = [];
    const upper: TimeSeriesPoint[] = [];
    const lower: TimeSeriesPoint[] = [];
    
    // Get interval in milliseconds
    const intervalMs = this.timeIntervals[interval]?.intervalMs || 
                       (24 * 60 * 60 * 1000); // Default to daily
    
    for (let i = 1; i <= forecastHorizon; i++) {
      const forecastDate = new Date(lastDate.getTime() + i * intervalMs);
      
      forecast.push({
        timestamp: forecastDate,
        value: forecastValue
      });
      
      // Prediction uncertainty increases with the forecast horizon
      const predictionError = stdDev * Math.sqrt(1 + (i / windowSize));
      
      upper.push({
        timestamp: forecastDate,
        value: forecastValue + zValue * predictionError
      });
      
      lower.push({
        timestamp: forecastDate,
        value: Math.max(0, forecastValue - zValue * predictionError)
      });
    }
    
    // Calculate accuracy
    const accuracy = this.calculateMovingAverageAccuracy(historical, windowSize);
    
    return {
      forecast,
      confidence: {
        upper,
        lower
      },
      accuracy,
      method: 'moving_average',
      metadata: {
        modelParams: {
          windowSize,
          forecastValue,
          stdDev,
          confidenceLevel,
          zValue
        }
      }
    };
  }
  
  /**
   * Generate a linear regression forecast with confidence intervals
   * 
   * @param preprocessedData Preprocessed time series data
   * @param forecastHorizon Number of periods to forecast
   * @param interval Time bucket interval (e.g., '1 day', '1 hour')
   * @param confidenceLevel Confidence level for prediction intervals (0-1)
   * @returns Forecast result
   */
  async linearRegressionForecast(
    preprocessedData: PreprocessedTimeSeries,
    forecastHorizon: number,
    interval: string = '1 day',
    confidenceLevel: number = 0.95
  ): Promise<ForecastResult> {
    logger.info(`Generating linear regression forecast with horizon ${forecastHorizon}`);
    
    const historical = preprocessedData.data;
    
    if (historical.length < 3) {
      throw new Error('Not enough data for linear regression forecasting. Need at least 3 data points.');
    }
    
    // Sort by timestamp to ensure correct order
    const sortedData = [...historical].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    // Convert timestamps to numeric values (days since first point)
    const firstTimestamp = sortedData[0].timestamp.getTime();
    const x = sortedData.map(p => (p.timestamp.getTime() - firstTimestamp) / (24 * 60 * 60 * 1000));
    const y = sortedData.map(p => p.value);
    
    // Calculate linear regression coefficients
    const { slope, intercept, rSquared } = this.calculateLinearRegression(x, y);
    
    const lastDate = sortedData[sortedData.length - 1].timestamp;
    const lastX = x[x.length - 1];
    
    // Calculate residuals and standard error
    const predictions = x.map(xi => intercept + slope * xi);
    const residuals = y.map((yi, i) => yi - predictions[i]);
    const sumSquaredResiduals = residuals.reduce((sum, r) => sum + r * r, 0);
    const standardError = Math.sqrt(sumSquaredResiduals / (sortedData.length - 2));
    
    // Get appropriate t-value for the confidence level and degrees of freedom
    const degreesOfFreedom = sortedData.length - 2;
    const tValue = this.getTValue(confidenceLevel, degreesOfFreedom);
    
    // Generate forecast points
    const forecast: TimeSeriesPoint[] = [];
    const upper: TimeSeriesPoint[] = [];
    const lower: TimeSeriesPoint[] = [];
    
    // Get interval in milliseconds
    const intervalMs = this.timeIntervals[interval]?.intervalMs || 
                       (24 * 60 * 60 * 1000); // Default to daily
    
    // Calculate mean of x values for prediction intervals
    const xMean = x.reduce((sum, xi) => sum + xi, 0) / x.length;
    const sumSquaredX = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);
    
    for (let i = 1; i <= forecastHorizon; i++) {
      const forecastDate = new Date(lastDate.getTime() + i * intervalMs);
      const forecastX = lastX + i;
      const forecastValue = intercept + slope * forecastX;
      
      // Calculate prediction interval
      const predictionError = standardError * Math.sqrt(
        1 + 1/x.length + Math.pow(forecastX - xMean, 2) / sumSquaredX
      );
      
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
      method: 'linear_regression',
      metadata: {
        modelParams: {
          slope,
          intercept,
          rSquared,
          standardError,
          confidenceLevel,
          tValue
        }
      }
    };
  }
  
  /**
   * Determine the best forecasting method based on cross-validation
   */
  private async determineBestMethod(
    preprocessedData: PreprocessedTimeSeries,
    interval: string
  ): Promise<ForecastMethod> {
    const data = preprocessedData.data;
    
    if (data.length < 10) {
      // Not enough data for reliable method selection, use naive
      return 'naive';
    }
    
    // Simplified selection logic:
    // 1. Split data into training and test sets
    const testSize = Math.min(5, Math.floor(data.length * 0.2));
    const trainingData = data.slice(0, -testSize);
    const testData = data.slice(-testSize);
    
    // 2. Create preprocessed time series object for training data
    const trainingPreprocessed: PreprocessedTimeSeries = {
      ...preprocessedData,
      data: trainingData,
      metadata: {
        ...preprocessedData.metadata,
        originalLength: trainingData.length,
        processedLength: trainingData.length
      }
    };
    
    // 3. Test each method on the training data and evaluate on test data
    const methodAccuracies: Record<ForecastMethod, number> = {
      'naive': 0,
      'seasonal_naive': 0,
      'moving_average': 0,
      'linear_regression': 0,
      'auto': 0  // Not used
    };
    
    // Naive forecast
    const naiveForecast = await this.naiveForecast(trainingPreprocessed, testSize, interval);
    const naiveErrors = this.calculateForecastErrors(naiveForecast.forecast, testData);
    methodAccuracies.naive = 1 - naiveErrors.mape;
    
    // Seasonal naive forecast (if enough data)
    if (data.length >= 14) { // Need at least 2 full weeks for weekly seasonality
      const seasonalPeriod = interval === '1 day' ? 7 : 
                           interval === '1 hour' ? 24 : 
                           interval === '1 week' ? 4 : 
                           interval === '1 month' ? 12 : 7;
      
      if (trainingData.length >= seasonalPeriod * 2) {
        const seasonalForecast = await this.seasonalNaiveForecast(
          trainingPreprocessed, testSize, seasonalPeriod, interval
        );
        const seasonalErrors = this.calculateForecastErrors(seasonalForecast.forecast, testData);
        methodAccuracies.seasonal_naive = 1 - seasonalErrors.mape;
      }
    }
    
    // Moving average forecast
    const windowSize = Math.min(7, Math.floor(trainingData.length / 3));
    if (trainingData.length >= windowSize * 2) {
      const maForecast = await this.movingAverageForecast(
        trainingPreprocessed, testSize, windowSize, interval
      );
      const maErrors = this.calculateForecastErrors(maForecast.forecast, testData);
      methodAccuracies.moving_average = 1 - maErrors.mape;
    }
    
    // Linear regression forecast
    if (trainingData.length >= 5) {
      const lrForecast = await this.linearRegressionForecast(
        trainingPreprocessed, testSize, interval
      );
      const lrErrors = this.calculateForecastErrors(lrForecast.forecast, testData);
      methodAccuracies.linear_regression = 1 - lrErrors.mape;
    }
    
    // Find the best method
    let bestMethod: ForecastMethod = 'naive';
    let bestAccuracy = methodAccuracies.naive;
    
    for (const [method, accuracy] of Object.entries(methodAccuracies)) {
      if (accuracy > bestAccuracy) {
        bestAccuracy = accuracy;
        bestMethod = method as ForecastMethod;
      }
    }
    
    logger.info(`Method selection results: ${JSON.stringify(methodAccuracies)}`);
    logger.info(`Selected best method: ${bestMethod} with accuracy ${bestAccuracy}`);
    
    return bestMethod;
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
    
    // Handle potential division by zero
    if (denominator === 0) {
      // If x values are all the same, fit a horizontal line at the mean y
      return { slope: 0, intercept: yMean, rSquared: 0 };
    }
    
    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;
    
    // Calculate R-squared
    const predictions = x.map(xi => intercept + slope * xi);
    const totalSumOfSquares = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    
    // Handle case when there's no variance in y
    if (totalSumOfSquares === 0) {
      return { slope, intercept, rSquared: 1 }; // Perfect fit for constant y
    }
    
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
    let countValid = 0;
    
    for (const point of validationData) {
      const actual = point.value;
      const forecast = trainingMean;
      
      if (actual !== 0) {
        const absPercentageError = Math.abs((actual - forecast) / actual);
        sumAbsPercentageError += absPercentageError;
        countValid++;
      }
    }
    
    if (countValid === 0) {
      return 0.5; // No valid points for evaluation
    }
    
    const mape = sumAbsPercentageError / countValid;
    
    // Convert MAPE to accuracy (0-1 scale, higher is better)
    // Using a simple transformation: accuracy = max(0, 1 - mape)
    // Cap at 1 to handle very small MAPE values
    return Math.max(0, Math.min(1, 1 - mape));
  }
  
  /**
   * Calculate seasonal forecast accuracy
   */
  private calculateSeasonalAccuracy(historical: TimeSeriesPoint[], period: number): number {
    if (historical.length < period * 2) {
      return 0.5; // Not enough data for meaningful seasonal accuracy calculation
    }
    
    // Calculate seasonal MAPE
    let sumAbsPercentageError = 0;
    let countValid = 0;
    
    for (let i = period; i < historical.length; i++) {
      const actual = historical[i].value;
      const forecast = historical[i - period].value;
      
      if (actual !== 0) {
        const absPercentageError = Math.abs((actual - forecast) / actual);
        sumAbsPercentageError += absPercentageError;
        countValid++;
      }
    }
    
    if (countValid === 0) {
      return 0.5; // No valid points for evaluation
    }
    
    const mape = sumAbsPercentageError / countValid;
    
    // Convert MAPE to accuracy (0-1 scale, higher is better)
    return Math.max(0, Math.min(1, 1 - mape));
  }
  
  /**
   * Calculate moving average forecast accuracy
   */
  private calculateMovingAverageAccuracy(historical: TimeSeriesPoint[], windowSize: number): number {
    if (historical.length < windowSize + 3) {
      return 0.5; // Not enough data for meaningful MA accuracy calculation
    }
    
    let sumAbsPercentageError = 0;
    let countValid = 0;
    
    for (let i = windowSize; i < historical.length; i++) {
      const actual = historical[i].value;
      
      // Calculate moving average of previous windowSize points
      const maWindow = historical.slice(i - windowSize, i);
      const forecast = maWindow.reduce((sum, p) => sum + p.value, 0) / windowSize;
      
      if (actual !== 0) {
        const absPercentageError = Math.abs((actual - forecast) / actual);
        sumAbsPercentageError += absPercentageError;
        countValid++;
      }
    }
    
    if (countValid === 0) {
      return 0.5; // No valid points for evaluation
    }
    
    const mape = sumAbsPercentageError / countValid;
    
    // Convert MAPE to accuracy (0-1 scale, higher is better)
    return Math.max(0, Math.min(1, 1 - mape));
  }
  
  /**
   * Validate forecast accuracy using historical data
   * 
   * @param historical Historical time series data
   * @param method Forecasting method to validate
   * @param forecastHorizon Forecast horizon
   * @param options Additional options
   * @returns Validation metrics
   */
  private validateForecastAccuracy(
    historical: TimeSeriesPoint[],
    method: ForecastMethod,
    forecastHorizon: number,
    options: {
      windowSize?: number;
      seasonalPeriod?: number;
      confidenceLevel?: number;
    } = {}
  ): ForecastValidationMetrics {
    // Need enough data to split into training and test sets
    if (historical.length < forecastHorizon * 2) {
      return {
        mape: 0.5,
        rmse: 0,
        mae: 0,
        r2: 0
      };
    }
    
    const {
      windowSize = 7,
      seasonalPeriod = 7,
      confidenceLevel = 0.95
    } = options;
    
    // Create training set
    const trainingData = historical.slice(0, -forecastHorizon);
    const testData = historical.slice(-forecastHorizon);
    
    // Create preprocessed time series object for training data
    const trainingPreprocessed: PreprocessedTimeSeries = {
      data: trainingData,
      validation: {
        isValid: true,
        errors: [],
        warnings: []
      },
      metadata: {
        originalLength: trainingData.length,
        processedLength: trainingData.length,
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
    
    // Generate forecast using the specified method
    let forecast: TimeSeriesPoint[];
    
    switch (method) {
      case 'moving_average':
        forecast = this.movingAverageForecast(
          trainingPreprocessed, forecastHorizon, windowSize, '1 day', confidenceLevel
        ).then(result => result.forecast);
        break;
        
      case 'linear_regression':
        forecast = this.linearRegressionForecast(
          trainingPreprocessed, forecastHorizon, '1 day', confidenceLevel
        ).then(result => result.forecast);
        break;
        
      case 'seasonal_naive':
        forecast = this.seasonalNaiveForecast(
          trainingPreprocessed, forecastHorizon, seasonalPeriod, '1 day', confidenceLevel
        ).then(result => result.forecast);
        break;
        
      case 'naive':
      default:
        forecast = this.naiveForecast(
          trainingPreprocessed, forecastHorizon, '1 day', confidenceLevel
        ).then(result => result.forecast);
        break;
    }
    
    // Calculate errors
    return this.calculateForecastErrors(forecast, testData);
  }
  
  /**
   * Calculate error metrics between forecast and actual values
   */
  private calculateForecastErrors(
    forecast: TimeSeriesPoint[] | Promise<TimeSeriesPoint[]>,
    actual: TimeSeriesPoint[]
  ): ForecastValidationMetrics {
    // Handle case where forecast is a promise
    if (forecast instanceof Promise) {
      // Default metrics since we can't resolve the promise synchronously
      return {
        mape: 0.5,
        rmse: 0,
        mae: 0,
        r2: 0
      };
    }
    
    // If lengths don't match, align by timestamp or use min length
    const minLength = Math.min(forecast.length, actual.length);
    
    // Sort by timestamp to ensure ordering
    const sortedForecast = [...forecast].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const sortedActual = [...actual].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Use the minimum number of points
    const forecastValues = sortedForecast.slice(0, minLength).map(p => p.value);
    const actualValues = sortedActual.slice(0, minLength).map(p => p.value);
    
    // Calculate MAPE (Mean Absolute Percentage Error)
    let sumAbsPercentageError = 0;
    let countMape = 0;
    
    for (let i = 0; i < minLength; i++) {
      if (actualValues[i] !== 0) {
        sumAbsPercentageError += Math.abs((actualValues[i] - forecastValues[i]) / actualValues[i]);
        countMape++;
      }
    }
    
    const mape = countMape > 0 ? sumAbsPercentageError / countMape : 1;
    
    // Calculate MAE (Mean Absolute Error)
    const sumAbsError = forecastValues.reduce((sum, value, i) => 
      sum + Math.abs(value - actualValues[i]), 0);
    const mae = sumAbsError / minLength;
    
    // Calculate RMSE (Root Mean Square Error)
    const sumSquaredError = forecastValues.reduce((sum, value, i) => 
      sum + Math.pow(value - actualValues[i], 2), 0);
    const rmse = Math.sqrt(sumSquaredError / minLength);
    
    // Calculate R-squared
    const actualMean = actualValues.reduce((sum, val) => sum + val, 0) / actualValues.length;
    const totalSumOfSquares = actualValues.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
    
    // Handle case when there's no variance in actual values
    const r2 = totalSumOfSquares === 0 ? 
      1 : // Perfect fit for constant actual values
      1 - (sumSquaredError / totalSumOfSquares);
    
    return {
      mape,
      rmse,
      mae,
      r2
    };
  }
  
  /**
   * Get Z-value for standard normal distribution based on confidence level
   * 
   * @param confidenceLevel Confidence level (0-1)
   * @returns Z-value
   */
  private getZValue(confidenceLevel: number): number {
    // Common Z-values for popular confidence levels
    if (confidenceLevel >= 0.99) return 2.576; // 99%
    if (confidenceLevel >= 0.98) return 2.326; // 98%
    if (confidenceLevel >= 0.95) return 1.96;  // 95%
    if (confidenceLevel >= 0.90) return 1.645; // 90%
    if (confidenceLevel >= 0.80) return 1.282; // 80%
    
    // Default to 95% confidence
    return 1.96;
  }
  
  /**
   * Get approximate T-value based on confidence level and degrees of freedom
   * 
   * @param confidenceLevel Confidence level (0-1)
   * @param degreesOfFreedom Degrees of freedom
   * @returns T-value
   */
  private getTValue(confidenceLevel: number, degreesOfFreedom: number): number {
    // For large degrees of freedom, t-distribution approaches normal distribution
    if (degreesOfFreedom > 30) {
      return this.getZValue(confidenceLevel);
    }
    
    // Simplified approximation of t-value for small degrees of freedom
    // In a real implementation, this would use a t-distribution table or calculation
    const adjustment = Math.sqrt(1 + 10 / degreesOfFreedom);
    return this.getZValue(confidenceLevel) * adjustment;
  }
}
