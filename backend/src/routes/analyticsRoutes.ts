import express from 'express';
import { analyticsController } from '../controllers/analyticsController';

const router = express.Router();

/**
 * @route   GET /api/analytics/timeseries/:metricId
 * @desc    Get time series data for a specific metric
 * @query   dateRange - Date range to get data for (e.g., 'last-30-days')
 * @query   interval - Time bucket interval (e.g., '1 day', '1 hour')
 * @access  Public
 */
router.get('/timeseries/:metricId', analyticsController.getTimeSeries.bind(analyticsController));

/**
 * @route   GET /api/analytics/decomposition/:metricId
 * @desc    Get time series decomposition for a specific metric
 * @query   dateRange - Date range to get data for (e.g., 'last-30-days')
 * @query   interval - Time bucket interval (e.g., '1 day', '1 hour')
 * @query   windowSize - Window size for trend extraction (default: 7)
 * @access  Public
 */
router.get('/decomposition/:metricId', analyticsController.getTimeSeriesDecomposition.bind(analyticsController));

/**
 * @route   GET /api/analytics/anomalies/:metricId
 * @desc    Detect anomalies in time series data
 * @query   dateRange - Date range to get data for (e.g., 'last-30-days')
 * @query   interval - Time bucket interval (e.g., '1 day', '1 hour')
 * @query   threshold - Z-score threshold for anomaly detection (default: 3.0)
 * @access  Public
 */
router.get('/anomalies/:metricId', analyticsController.detectAnomalies.bind(analyticsController));

/**
 * @route   GET /api/analytics/forecast/:metricId
 * @desc    Generate forecast for a specific metric
 * @query   dateRange - Date range for historical data (e.g., 'last-30-days')
 * @query   horizon - Number of periods to forecast (default: 30)
 * @query   interval - Time bucket interval (e.g., '1 day', '1 hour')
 * @query   method - Forecasting method ('naive', 'moving_average', 'linear_regression')
 * @access  Public
 */
router.get('/forecast/:metricId', analyticsController.getForecast.bind(analyticsController));

/**
 * @route   GET /api/analytics/correlation
 * @desc    Calculate correlation between two metrics
 * @query   metric1 - First metric ID
 * @query   metric2 - Second metric ID
 * @query   dateRange - Date range to get data for (e.g., 'last-30-days')
 * @query   interval - Time bucket interval (e.g., '1 day', '1 hour')
 * @access  Public
 */
router.get('/correlation', analyticsController.getCorrelation.bind(analyticsController));

export default router;
