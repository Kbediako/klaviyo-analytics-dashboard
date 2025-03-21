# Analytics Engine Documentation

## Overview

This document provides detailed information about the Klaviyo Analytics Dashboard's analytics engine implementation. The analytics engine is responsible for time series analysis, forecasting, and anomaly detection on Klaviyo event data. It is designed to handle large volumes of data efficiently while providing accurate analytics results.

## Capabilities

The analytics engine provides the following capabilities:

1. **Time Series Analysis**:
   - Time series decomposition (trend, seasonal, residual)
   - Correlation analysis between metrics
   - Handling irregular time intervals
   - Advanced preprocessing of time series data

2. **Forecasting**:
   - Multiple forecasting methods (naive, seasonal naive, moving average, linear regression)
   - Automatic method selection based on historical accuracy
   - Confidence intervals for all forecasts
   - Forecast validation against historical data

3. **Anomaly Detection**:
   - Z-score based anomaly detection
   - Flexible threshold configuration
   - Local and global anomaly detection
   - Support for custom lookback windows

4. **Performance Optimization**:
   - Pre-aggregated data support
   - Efficient data preprocessing
   - Caching for expensive calculations
   - Optimized algorithms for large datasets

## Component Architecture

The analytics engine consists of two primary components:

1. **TimeSeriesAnalyzer**: Responsible for retrieving, preprocessing, and analyzing time series data
2. **ForecastService**: Uses the TimeSeriesAnalyzer to generate forecasts using various forecasting methods

```
+----------------------------------+
|         Analytics Engine         |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  |    TimeSeriesAnalyzer      |  |
|  +----------------------------+  |
|  | - getTimeSeries()          |  |
|  | - preprocess()             |  |
|  | - decompose()              |  |
|  | - extractTrend()           |  |
|  | - extractSeasonality()     |  |
|  | - detectAnomalies()        |  |
|  | - calculateCorrelation()   |  |
|  | - calculateSampleEntropy() |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  |      ForecastService       |  |
|  +----------------------------+  |
|  | - generateForecast()       |  |
|  | - naiveForecast()          |  |
|  | - seasonalNaiveForecast()  |  |
|  | - movingAverageForecast()  |  |
|  | - linearRegressionForecast()|  |
|  | - validateForecastAccuracy()|  |
|  +----------------------------+  |
|                                  |
+----------------------------------+
        |               |
        v               v
+------------------+  +-----------------+
| Database Layer   |  | API Layer       |
+------------------+  +-----------------+
```

## Time Series Analysis

### Preprocessing

The analytics engine includes robust preprocessing capabilities through the `preprocess()` method in the TimeSeriesAnalyzer. This preprocessing handles:

- Validation of timestamps and values
- Handling of missing values (filling with means, interpolation, etc.)
- Detection and optional removal of outliers
- Normalization of irregular timestamp intervals
- Sorting and alignment of time series data

```typescript
const preprocessed = timeSeriesAnalyzer.preprocess(timeSeries, {
  fillMissingValues: true,
  removeOutliers: false,
  outlierThreshold: 3.0,
  normalizeTimestamps: true,
  expectedInterval: '1 day'
});
```

The preprocessing result includes metadata about the processed data, which helps identify potential issues:

```typescript
{
  data: TimeSeriesPoint[],
  validation: {
    isValid: boolean,
    errors: ValidationError[],
    warnings: ValidationError[]
  },
  metadata: {
    originalLength: number,
    processedLength: number,
    hasMissingValues: boolean,
    hasOutliers: boolean,
    timeInterval: {
      mean: number,
      min: number,
      max: number,
      isRegular: boolean
    }
  }
}
```

### Time Series Decomposition

The time series decomposition breaks down a time series into three components:

1. **Trend**: The long-term movement in the data
2. **Seasonal**: Repeating patterns at regular intervals
3. **Residual**: The random variation after removing trend and seasonal components

```typescript
const decomposition = await timeSeriesAnalyzer.decompose(
  metricId,
  startDate,
  endDate,
  interval,
  windowSize,
  seasonalPeriod
);

// Result contains:
{
  trend: TimeSeriesPoint[],
  seasonal: TimeSeriesPoint[],
  residual: TimeSeriesPoint[],
  original: TimeSeriesPoint[]
}
```

The implementation uses:

- Moving averages for trend extraction (configurable window size)
- Period averaging for seasonality extraction (configurable period)
- Auto-detection of seasonality period based on data interval

### Anomaly Detection

The analytics engine supports both global and local anomaly detection using Z-scores:

```typescript
// Global anomaly detection
const anomalies = await timeSeriesAnalyzer.detectAnomalies(
  timeSeries,
  3.0 // Z-score threshold
);

// Local anomaly detection with lookback window
const localAnomalies = await timeSeriesAnalyzer.detectAnomalies(
  timeSeries,
  3.0,  // Z-score threshold
  10    // Lookback window size
);
```

The local detection approach is more sensitive to recent patterns, making it suitable for detecting changes in otherwise stable metrics.

### Correlation Analysis

The analytics engine can calculate correlations between different metrics:

```typescript
// Exact timestamp matching
const correlation = timeSeriesAnalyzer.calculateCorrelation(series1, series2);

// Timestamp alignment with approximate matching
const alignedCorrelation = timeSeriesAnalyzer.calculateCorrelation(
  series1,
  series2,
  true // Align timestamps
);
```

The correlation implementation:
- Handles timestamp alignment for series with different sampling frequencies
- Detects and handles constant series edge cases
- Returns values between -1 and 1, with 0 indicating no correlation

## Forecasting

### Forecast Methods

The ForecastService supports several forecasting methods:

1. **Naive Forecast**: Uses the last observed value for all future periods
2. **Seasonal Naive Forecast**: Uses values from the previous season for forecasting
3. **Moving Average Forecast**: Uses the average of the last n observations
4. **Linear Regression Forecast**: Fits a linear trend to the historical data

Alternatively, the auto-selection capability can choose the best method based on historical performance:

```typescript
// Auto-select the best forecasting method
const forecast = await forecastService.generateForecast(
  metricId,
  startDate,
  endDate,
  forecastHorizon,
  'auto',
  interval
);
```

### Confidence Intervals

All forecasts include confidence intervals calculated based on:

- Historical variance or residuals
- Forecast horizon (uncertainty increases with time)
- Appropriate Z-values or T-values for the requested confidence level

```typescript
// Forecast with custom confidence level
const forecast = await forecastService.generateForecast(
  metricId,
  startDate,
  endDate,
  forecastHorizon,
  method,
  interval,
  { confidenceLevel: 0.90 } // 90% confidence
);

// Result includes:
{
  forecast: TimeSeriesPoint[],
  confidence: {
    upper: TimeSeriesPoint[],
    lower: TimeSeriesPoint[]
  },
  accuracy: number,
  method: string
}
```

### Forecast Validation

The analytics engine can validate forecast accuracy against historical data:

```typescript
const forecast = await forecastService.generateForecast(
  metricId,
  startDate,
  endDate,
  forecastHorizon,
  method,
  interval,
  { validateWithHistory: true }
);

// Result includes validation metrics:
forecast.metadata.validationMetrics = {
  mape: number,  // Mean Absolute Percentage Error
  rmse: number,  // Root Mean Square Error
  mae: number,   // Mean Absolute Error
  r2: number     // R-squared
}
```

This validation is performed by:
1. Splitting historical data into training and testing sets
2. Forecasting the test period using only training data
3. Comparing forecasts to actual values
4. Calculating various error metrics

## Database Integration

The analytics engine integrates with the database in two primary ways:

1. **Time Series Data Retrieval**:
   ```typescript
   const timeSeries = await timeSeriesAnalyzer.getTimeSeries(
     metricId,
     startDate,
     endDate,
     interval
   );
   ```

2. **Pre-aggregated Metrics**:
   The engine first checks for pre-aggregated data to improve performance:
   ```sql
   SELECT time_bucket, sum_value AS value
   FROM klaviyo_aggregated_metrics
   WHERE 
     metric_id = $1 AND 
     bucket_size = $2 AND
     time_bucket BETWEEN $3 AND $4
   ORDER BY time_bucket ASC
   ```

   If pre-aggregated data is not available, it calculates metrics on-the-fly:
   ```sql
   SELECT 
     time_bucket($1, timestamp) AS bucket,
     SUM(value) AS value
   FROM klaviyo_events
   WHERE metric_id = $2 AND timestamp BETWEEN $3 AND $4
   GROUP BY bucket
   ORDER BY bucket ASC
   ```

## API Integration

The analytics functionality is exposed through the Analytics Controller, which provides several endpoints.

For detailed API documentation, refer to the following resources:

1. [Analytics API Overview](/Documentation/api/analytics-endpoints.md) - General overview of all endpoints
2. [Time Series Endpoints](/Documentation/api/time-series-endpoints.md) - Time series data and decomposition
3. [Anomaly Detection Endpoints](/Documentation/api/anomaly-detection-endpoints.md) - Anomaly detection capabilities
4. [Forecasting Endpoints](/Documentation/api/forecasting-endpoints.md) - Forecast generation endpoints
5. [Correlation Endpoints](/Documentation/api/correlation-endpoints.md) - Correlation analysis between metrics
6. [Entropy Endpoints](/Documentation/api/entropy-endpoints.md) - Complexity/randomness measurement
7. [Cache Management Endpoints](/Documentation/api/cache-management-endpoints.md) - Cache control APIs

Additionally, see:
- [Performance Considerations](/Documentation/api/performance-considerations.md) - Details on optimization techniques
- [Error Handling](/Documentation/api/error-handling.md) - Common error patterns and responses

Each endpoint accepts query parameters for date ranges, intervals, and method-specific options.

## Edge Case Handling

The analytics engine has been enhanced to handle various edge cases:

1. **Empty Data Sets**:
   - Returns appropriate error messages
   - Validates all inputs before processing

2. **Irregular Time Intervals**:
   - Detects and reports irregular intervals
   - Provides normalization options
   - Supports configuration of expected intervals

3. **Outliers and Extreme Values**:
   - Detects outliers automatically
   - Provides options for outlier removal or retention
   - Reports outlier statistics in preprocessing metadata

4. **Zero Values and Division by Zero**:
   - Handles zeros in denominators for calculations like MAPE
   - Provides fallback mechanisms for undefined statistics

5. **Missing Data Points**:
   - Detects and reports missing values
   - Offers multiple strategies for handling missing data
   - Supports interpolation for irregular intervals

6. **Constant Series**:
   - Properly handles time series with constant values
   - Avoids division by zero in variance calculations
   - Provides meaningful statistical measures for constant data

## Performance Considerations

The analytics engine includes several performance optimizations designed to handle large datasets efficiently. For comprehensive documentation on these optimizations, see:

- [Performance Optimizations for Analytics Engine](./performance-optimizations.md) - Detailed implementation documentation
- [API Performance Considerations](/Documentation/api/performance-considerations.md) - User-facing performance features

Key performance features include:

1. **Data Downsampling**:
   - Multiple downsampling methods for different use cases (LTTB, min-max, average, first-last-significant)
   - Configurable target points to balance detail and performance
   - Preserves visual patterns while reducing data volume

2. **Chunked Processing**:
   - Processes data in manageable chunks for large time series
   - Supports both sequential and parallel processing modes
   - Prevents memory exhaustion with very large datasets

3. **Computation Caching**:
   - Time-based caching with configurable TTLs
   - Separate caches for different types of computations
   - Automatic cache invalidation and manual clearing option

4. **Pre-aggregated Metrics**:
   - Uses pre-calculated metrics when available
   - Falls back to on-the-fly calculation when necessary

5. **API Optimization Parameters**:
   - Client control over performance tradeoffs
   - Query parameters for downsampling, caching, and processing options

## Usage Examples

### Basic Time Series Analysis

```typescript
// Get a controller instance
const analyticsController = new AnalyticsController();

// Get time series data
const timeSeriesResponse = await analyticsController.getTimeSeries(req, res);

// Decompose time series
const decompositionResponse = await analyticsController.getTimeSeriesDecomposition(req, res);

// Detect anomalies
const anomaliesResponse = await analyticsController.detectAnomalies(req, res);
```

### Forecasting with Different Methods

```typescript
// Get a forecast service instance
const forecastService = new ForecastService();

// Generate forecast with automatic method selection
const autoPrediction = await forecastService.generateForecast(
  'conversion_rate', 
  new Date('2025-01-01'), 
  new Date('2025-01-31'),
  14, // 14-day forecast horizon
  'auto', 
  '1 day'
);

// Generate forecast with specific method
const movingAveragePrediction = await forecastService.generateForecast(
  'revenue', 
  new Date('2025-01-01'), 
  new Date('2025-01-31'),
  7, // 7-day forecast horizon
  'moving_average', 
  '1 day',
  { windowSize: 5 }
);

// Generate forecast with validation
const validatedPrediction = await forecastService.generateForecast(
  'unique_clicks', 
  new Date('2025-01-01'), 
  new Date('2025-01-31'),
  10, // 10-day forecast horizon
  'linear_regression', 
  '1 day',
  { validateWithHistory: true }
);
```

### Advanced Use Cases

```typescript
// Compare two metrics with correlation analysis
const correlation = timeSeriesAnalyzer.calculateCorrelation(
  openRateSeries,
  clickRateSeries,
  true // align timestamps
);

// Evaluate entropy (randomness/complexity) of a metric
const entropy = timeSeriesAnalyzer.calculateSampleEntropy(
  conversionRateSeries,
  2, // embedding dimension
  0.2 * standardDeviation // tolerance
);
```

## Limitations and Future Enhancements

### Current Limitations

1. **Forecast Methods**: Currently limited to simple forecasting methods
2. **Seasonality Detection**: Uses fixed seasonality periods rather than auto-detection
3. **Multivariate Analysis**: Limited to pairwise correlation analysis
4. **Performance**: May become slow with very large datasets (millions of data points)

### Planned Enhancements

1. **Advanced Forecasting Methods**:
   - ARIMA/SARIMA models
   - Exponential smoothing (Holt-Winters)
   - Neural network-based forecasting

2. **Automatic Seasonality Detection**:
   - Fourier analysis for periodicity detection
   - Multiple seasonality support (e.g., daily and weekly patterns)

3. **Enhanced Anomaly Detection**:
   - Isolation forests for multivariate anomaly detection
   - Contextual anomaly detection

4. **Additional Performance Optimizations**:
   - Distributed processing for very large datasets
   - Adaptive downsampling based on data characteristics
   - Computation offloading to worker processes

5. **Multivariate Analysis**:
   - Multivariate outlier detection
   - Causal inference between metrics
   - Factor analysis for metric grouping