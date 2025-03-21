import express from 'express';
import { getFlows, syncFlows, getFlowPerformanceMetrics } from '../controllers/flowsController';

const router = express.Router();

/**
 * @route   GET /api/flows
 * @desc    Get flows data for the dashboard
 * @query   dateRange - Date range to get flows for (e.g., 'last-30-days')
 * @access  Public
 */
router.get('/', getFlows);

/**
 * @route   POST /api/flows/sync
 * @desc    Sync flows data from Klaviyo API to database
 * @query   force - Force sync even if data exists (true/false)
 * @query   since - Only sync data since this timestamp (ISO string)
 * @access  Public
 */
router.post('/sync', syncFlows);

/**
 * @route   GET /api/flows/metrics
 * @desc    Get flow performance metrics
 * @query   dateRange - Date range to get metrics for (e.g., 'last-30-days')
 * @access  Public
 */
router.get('/metrics', getFlowPerformanceMetrics);

export default router;