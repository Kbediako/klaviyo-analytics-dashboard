import express from 'express';
import { analyticsController } from '../controllers/analyticsController';

const router = express.Router();

/**
 * @route   GET /api/analytics/timeseries/:metricId
 * @desc    Get time series data for a specific metric with performance optimizations
 * @query   dateRange - Date range to get data for (e.g., 'last-30-days')
 * @query   interval - Time bucket interval (e.g., '1 day', '1 hour')
 * @query   maxPoints - Maximum number of data points to return (default: 1000)
 * @query   downsampleMethod - Method to use for downsampling ('lttb', 'min-max', 'average', 'first-last-significant')
 * @access  Public
 */
router.get('/timeseries/:metricId', analyticsController.getTimeSeries.bind(analyticsController));

/**
 * @route   GET /api/analytics/decomposition/:metricId
 * @desc    Get time series decomposition with performance optimizations
 * @query   dateRange - Date range to get data for (e.g., 'last-30-days')
 * @query   interval - Time bucket interval (e.g., '1 day', '1 hour')
 * @query   windowSize - Window size for trend extraction (default: 7)
 * @query   maxPoints - Maximum number of data points to return (default: 500)
 * @query   downsampleMethod - Method to use for downsampling ('lttb', 'min-max', 'average', 'first-last-significant')
 * @access  Public
 */
router.get('/decomposition/:metricId', analyticsController.getTimeSeriesDecomposition.bind(analyticsController));

/**
 * @route   GET /api/analytics/anomalies/:metricId
 * @desc    Detect anomalies in time series data with performance optimizations
 * @query   dateRange - Date range to get data for (e.g., 'last-30-days')
 * @query   interval - Time bucket interval (e.g., '1 day', '1 hour')
 * @query   threshold - Z-score threshold for anomaly detection (default: 3.0)
 * @query   lookbackWindow - Window size for local anomaly detection (omit for global detection)
 * @access  Public
 */
router.get('/anomalies/:metricId', analyticsController.detectAnomalies.bind(analyticsController));

/**
 * @route   GET /api/analytics/forecast/:metricId
 * @desc    Generate forecast with performance optimizations
 * @query   dateRange - Date range for historical data (e.g., 'last-30-days')
 * @query   horizon - Number of periods to forecast (default: 30)
 * @query   interval - Time bucket interval (e.g., '1 day', '1 hour')
 * @query   method - Forecasting method ('auto', 'naive', 'seasonal_naive', 'moving_average', 'linear_regression')
 * @query   confidenceLevel - Confidence level for prediction intervals (0-1, default: 0.95)
 * @query   validate - Whether to validate forecast against historical data ('true' or 'false', default: false)
 * @access  Public
 */
router.get('/forecast/:metricId', analyticsController.getForecast.bind(analyticsController));

/**
 * @route   GET /api/analytics/correlation
 * @desc    Calculate correlation between two metrics with performance optimizations
 * @query   metric1 - First metric ID
 * @query   metric2 - Second metric ID
 * @query   dateRange - Date range to get data for (e.g., 'last-30-days')
 * @query   interval - Time bucket interval (e.g., '1 day', '1 hour')
 * @query   alignTimestamps - Whether to align timestamps before calculation ('true' or 'false', default: false)
 * @access  Public
 */
router.get('/correlation', analyticsController.getCorrelation.bind(analyticsController));

/**
 * @route   GET /api/analytics/entropy/:metricId
 * @desc    Calculate entropy (measure of complexity/randomness) of a time series
 * @query   dateRange - Date range to get data for (e.g., 'last-30-days')
 * @query   interval - Time bucket interval (e.g., '1 day', '1 hour')
 * @query   dimension - Embedding dimension for sample entropy calculation (default: 2)
 * @access  Public
 */
router.get('/entropy/:metricId', analyticsController.getEntropy.bind(analyticsController));

/**
 * @route   POST /api/analytics/clear-cache
 * @desc    Clear all analytics caches
 * @access  Public
 */
router.post('/clear-cache', analyticsController.clearCaches.bind(analyticsController));

export default router;