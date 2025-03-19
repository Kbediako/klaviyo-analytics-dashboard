import express from 'express';
import { getOverview } from '../controllers/overviewController';

const router = express.Router();

/**
 * @route   GET /api/overview
 * @desc    Get overview metrics for the dashboard
 * @query   dateRange - Date range to get metrics for (e.g., 'last-30-days')
 * @access  Public
 */
router.get('/', getOverview);

export default router;
