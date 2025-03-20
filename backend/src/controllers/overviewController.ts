import { Request, Response } from 'express';
import { getOverviewMetrics } from '../services/overviewService';
import { parseDateRange } from '../utils/dateUtils';

/**
 * Get overview metrics for the dashboard
 * 
 * @param req Express request object
 * @param res Express response object
 */
export async function getOverview(req: Request, res: Response) {
  try {
    // Parse date range from query parameter
    const dateRangeStr = req.query.dateRange as string;
    const dateRange = parseDateRange(dateRangeStr);
    
    // Get overview metrics
    const metrics = await getOverviewMetrics(dateRange);
    
    // Return metrics as JSON
    res.status(200).json(metrics);
  } catch (error) {
    console.error('Error in overview controller:', error);
    res.status(500).json({
      error: 'Failed to fetch overview metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
