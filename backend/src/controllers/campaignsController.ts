import { Request, Response } from 'express';
import { getCampaignsData } from '../services/campaignsService';
import { parseDateRange } from '../utils/dateUtils';

/**
 * Get campaigns data for the dashboard
 * 
 * @param req Express request object
 * @param res Express response object
 */
export async function getCampaigns(req: Request, res: Response) {
  try {
    // Parse date range from query parameter
    const dateRangeStr = req.query.dateRange as string;
    const dateRange = parseDateRange(dateRangeStr);
    
    // Get campaigns data
    const campaigns = await getCampaignsData(dateRange);
    
    // Return campaigns as JSON
    res.status(200).json(campaigns);
  } catch (error) {
    console.error('Error in campaigns controller:', error);
    res.status(500).json({
      error: 'Failed to fetch campaigns data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
