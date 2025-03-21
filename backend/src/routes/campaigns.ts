import express from 'express';
import { getCampaigns, syncCampaigns } from '../controllers/campaignsController';

const router = express.Router();

/**
 * @route   GET /api/campaigns
 * @desc    Get campaigns data for the dashboard
 * @query   dateRange - Date range to get campaigns for (e.g., 'last-30-days')
 * @access  Public
 */
router.get('/', (req, res) => getCampaigns(req, res));

/**
 * @route   POST /api/campaigns/sync
 * @desc    Manually trigger a sync of campaigns data
 * @access  Public
 */
router.post('/sync', syncCampaigns);

export default router;
