import { Request, Response } from 'express';
import { getSegmentsData } from '../services/segmentsService';
import { parseDateRange } from '../utils/dateUtils';

/**
 * Get segments data for the dashboard
 * 
 * @param req Express request object
 * @param res Express response object
 */
export async function getSegments(req: Request, res: Response) {
  try {
    // Parse date range from query parameter
    const dateRangeStr = req.query.dateRange as string;
    const dateRange = parseDateRange(dateRangeStr);
    
    // Get segments data
    const segments = await getSegmentsData(dateRange);
    
    // Return segments as JSON
    res.status(200).json(segments);
  } catch (error) {
    console.error('Error in segments controller:', error);
    res.status(500).json({
      error: 'Failed to fetch segments data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
