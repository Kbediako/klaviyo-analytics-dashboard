import { Request, Response } from 'express';
import { getCampaignsData, getCampaignsFromDb } from '../services/campaignsService';
import { parseDateRange } from '../utils/dateUtils';
import { logger } from '../utils/logger';
import { dataSyncService } from '../services/dataSyncService';

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
    
    // Start performance timer
    const startTime = Date.now();
    
    // Try to get campaigns from database first
    logger.info(`Fetching campaigns from database for date range: ${dateRangeStr}`);
    const campaignsFromDb = await getCampaignsFromDb(dateRange);
    
    if (campaignsFromDb.length > 0) {
      // If we have data in the database, use it
      logger.info(`Found ${campaignsFromDb.length} campaigns in database`);
      const dbDuration = Date.now() - startTime;
      logger.info(`Database fetch completed in ${dbDuration}ms`);
      
      // Return campaigns from database
      return res.status(200).json(campaignsFromDb);
    }
    
    // If no data in database, fetch from API
    logger.info('No campaigns found in database, fetching from API');
    const campaigns = await getCampaignsData(dateRange);
    
    // Calculate API fetch duration
    const apiDuration = Date.now() - startTime;
    logger.info(`API fetch completed in ${apiDuration}ms`);
    
    // Trigger background sync to update database for future requests
    // This happens after we've already sent the response to the client
    setTimeout(() => {
      dataSyncService.syncCampaigns()
        .then(count => logger.info(`Background sync completed: ${count} campaigns synced`))
        .catch(err => logger.error('Background sync failed:', err));
    }, 100);
    
    // Return campaigns from API
    return res.status(200).json(campaigns);
  } catch (error) {
    logger.error('Error in campaigns controller:', error);
    res.status(500).json({
      error: 'Failed to fetch campaigns data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Manually trigger a sync of campaigns data
 * 
 * @param req Express request object
 * @param res Express response object
 */
export async function syncCampaigns(req: Request, res: Response) {
  try {
    logger.info('Manual campaign sync triggered');
    const startTime = Date.now();
    
    // Trigger sync
    const count = await dataSyncService.syncCampaigns();
    
    const duration = Date.now() - startTime;
    logger.info(`Manual sync completed in ${duration}ms: ${count} campaigns synced`);
    
    // Return success response
    res.status(200).json({
      success: true,
      message: `Successfully synced ${count} campaigns`,
      duration: `${duration}ms`
    });
  } catch (error) {
    logger.error('Error in campaigns sync controller:', error);
    res.status(500).json({
      error: 'Failed to sync campaigns data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
