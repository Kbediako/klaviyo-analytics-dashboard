import express from 'express';
import { getFlows } from '../controllers/flowsController';

const router = express.Router();

/**
 * @route   GET /api/flows
 * @desc    Get flows data for the dashboard
 * @query   dateRange - Date range to get flows for (e.g., 'last-30-days')
 * @access  Public
 */
router.get('/', getFlows);

export default router;
