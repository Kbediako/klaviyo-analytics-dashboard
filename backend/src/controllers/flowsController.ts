import { Request, Response } from 'express';
import { getFlowsData } from '../services/flowsService';
import { parseDateRange } from '../utils/dateUtils';

/**
 * Get flows data for the dashboard
 * 
 * @param req Express request object
 * @param res Express response object
 */
export async function getFlows(req: Request, res: Response) {
  try {
    // Parse date range from query parameter
    const dateRangeStr = req.query.dateRange as string;
    const dateRange = parseDateRange(dateRangeStr);
    
    // Get flows data
    const flows = await getFlowsData(dateRange);
    
    // Return flows as JSON
    res.status(200).json(flows);
  } catch (error) {
    console.error('Error in flows controller:', error);
    res.status(500).json({
      error: 'Failed to fetch flows data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
