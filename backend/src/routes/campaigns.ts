import express from 'express';
import { getCampaigns } from '../controllers/campaignsController';

const router = express.Router();

/**
 * @route   GET /api/campaigns
 * @desc    Get campaigns data for the dashboard
 * @query   dateRange - Date range to get campaigns for (e.g., 'last-30-days')
 * @access  Public
 */
router.get('/', getCampaigns);

export default router;
