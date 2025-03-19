import { Request, Response } from 'express';
import { getFormsData } from '../services/formsService';
import { parseDateRange } from '../utils/dateUtils';

/**
 * Get forms data for the dashboard
 * 
 * @param req Express request object
 * @param res Express response object
 */
export async function getForms(req: Request, res: Response) {
  try {
    // Parse date range from query parameter
    const dateRangeStr = req.query.dateRange as string;
    const dateRange = parseDateRange(dateRangeStr);
    
    // Get forms data
    const forms = await getFormsData(dateRange);
    
    // Return forms as JSON
    res.status(200).json(forms);
  } catch (error) {
    console.error('Error in forms controller:', error);
    res.status(500).json({
      error: 'Failed to fetch forms data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
