import express from 'express';
import { getSegments, getSegmentPerformanceMetrics, syncSegments } from '../controllers/segmentsController';

const router = express.Router();

/**
 * @route   GET /api/segments
 * @desc    Get segments data for the dashboard
 * @query   dateRange - Date range to get segments for (e.g., 'last-30-days')
 * @access  Public
 */
router.get('/', getSegments);

/**
 * @route   GET /api/segments/metrics
 * @desc    Get segment performance metrics
 * @query   dateRange - Date range to get metrics for (e.g., 'last-30-days')
 * @access  Public
 */
router.get('/metrics', getSegmentPerformanceMetrics);

/**
 * @route   POST /api/segments/sync
 * @desc    Sync segments data from Klaviyo API to database
 * @query   force - Whether to force a full sync (optional, default: false)
 * @access  Public
 */
router.post('/sync', syncSegments);

export default router;