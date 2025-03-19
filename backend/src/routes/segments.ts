import express from 'express';
import { getSegments } from '../controllers/segmentsController';

const router = express.Router();

/**
 * @route   GET /api/segments
 * @desc    Get segments data for the dashboard
 * @query   dateRange - Date range to get segments for (e.g., 'last-30-days')
 * @access  Public
 */
router.get('/', getSegments);

export default router;
