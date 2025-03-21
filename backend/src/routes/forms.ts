import express from 'express';
import { getForms, syncForms, getFormPerformanceMetrics } from '../controllers/formsController';

const router = express.Router();

/**
 * @route   GET /api/forms
 * @desc    Get forms data for the dashboard
 * @query   dateRange - Date range to get forms for (e.g., 'last-30-days')
 * @access  Public
 */
router.get('/', getForms);

/**
 * @route   POST /api/forms/sync
 * @desc    Sync forms data from Klaviyo API to database
 * @query   force - Force sync even if data exists (true/false)
 * @query   since - Only sync data since this timestamp (ISO string)
 * @access  Public
 */
router.post('/sync', syncForms);

/**
 * @route   GET /api/forms/metrics
 * @desc    Get form performance metrics
 * @query   dateRange - Date range to get metrics for (e.g., 'last-30-days')
 * @access  Public
 */
router.get('/metrics', getFormPerformanceMetrics);

export default router;