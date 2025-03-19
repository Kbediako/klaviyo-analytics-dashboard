import express from 'express';
import { getForms } from '../controllers/formsController';

const router = express.Router();

/**
 * @route   GET /api/forms
 * @desc    Get forms data for the dashboard
 * @query   dateRange - Date range to get forms for (e.g., 'last-30-days')
 * @access  Public
 */
router.get('/', getForms);

export default router;
