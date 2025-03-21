import { Request, Response } from 'express';
import { getFlowsData } from '../services/flowsService';
import { parseDateRange } from '../utils/dateUtils';
import { flowRepository } from '../repositories/flowRepository';
import { logger } from '../utils/logger';
import { klaviyoApiClient } from '../services/klaviyoApiClient';

/**
 * Get flows data for the dashboard
 * Database-first approach: check DB before calling API
 * 
 * @param req Express request object
 * @param res Express response object
 */
export async function getFlows(req: Request, res: Response) {
  try {
    // Parse date range from query parameter
    const dateRangeStr = req.query.dateRange as string;
    const dateRange = parseDateRange(dateRangeStr);
    
    // Check if database is disabled
    const isDbDisabled = process.env.DISABLE_DB === 'true';
    
    if (!isDbDisabled) {
      try {
        // Try to get data from the database first
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        const flows = await flowRepository.findByDateRange(startDate, endDate);
        
        // If we have data in the database, return it
        if (flows.length > 0) {
          logger.info(`Retrieved ${flows.length} flows from database for date range ${dateRange.start} to ${dateRange.end}`);
          
          // Transform database flows to the format expected by the frontend
          const transformedFlows = flows.map(flow => ({
            id: flow.id,
            name: flow.name,
            recipients: flow.recipient_count || 0,
            openRate: flow.recipient_count ? (flow.open_count || 0) / flow.recipient_count * 100 : 0,
            clickRate: flow.open_count ? (flow.click_count || 0) / flow.open_count * 100 : 0,
            conversionRate: flow.recipient_count ? (flow.conversion_count || 0) / flow.recipient_count * 100 : 0,
            revenue: flow.revenue || 0
          }));
          
          return res.status(200).json(transformedFlows);
        }
      } catch (dbError) {
        logger.warn('Error accessing database, falling back to API:', dbError);
        // Continue to API fallback
      }
    } else {
      logger.info('Database is disabled, fetching flows directly from API');
    }
    
    // If not found in database or database is disabled, fetch from API
    logger.info(`Fetching flows from API for date range ${dateRange.start} to ${dateRange.end}`);
    const apiFlows = await getFlowsData(dateRange);
    
    // Store the results in the database for future requests if database is enabled
    if (!isDbDisabled && apiFlows.length > 0) {
      try {
        const dbFlows = apiFlows.map(flow => ({
          id: flow.id,
          name: flow.name,
          status: flow.status || 'unknown',
          trigger_type: flow.trigger_type || 'unknown',
          created_date: new Date(), // Set to current date as a fallback
          recipient_count: flow.recipients || 0,
          open_count: Math.round(flow.recipients * (flow.openRate / 100)) || 0,
          click_count: Math.round(flow.recipients * (flow.clickRate / 100)) || 0,
          conversion_count: Math.round(flow.recipients * (flow.conversionRate / 100)) || 0,
          revenue: flow.revenue || 0,
          metadata: flow.metadata || {}
        }));
        
        await flowRepository.createBatch(dbFlows);
        logger.info(`Stored ${dbFlows.length} flows in database`);
      } catch (dbError) {
        logger.error('Error storing flows in database:', dbError);
        // Continue execution to return API data even if DB storage fails
      }
    }
    
    // Return data from API
    return res.status(200).json(apiFlows);
  } catch (error) {
    logger.error('Error in flows controller:', error);
    res.status(500).json({
      error: 'Failed to fetch flows data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Sync flows data from Klaviyo API to database
 * 
 * @param req Express request object
 * @param res Express response object
 */
export async function syncFlows(req: Request, res: Response) {
  try {
    const force = req.query.force === 'true';
    const lastSyncTimestamp = req.query.since ? new Date(req.query.since as string) : null;
    
    logger.info(`Starting flows sync${force ? ' (forced)' : ''}${lastSyncTimestamp ? ` since ${lastSyncTimestamp.toISOString()}` : ''}`);
    
    // Get flows from Klaviyo API
    const flowsResponse = await klaviyoApiClient.getFlows();
    
    if (!flowsResponse || !flowsResponse.data || !Array.isArray(flowsResponse.data)) {
      return res.status(500).json({
        error: 'Invalid response from Klaviyo API',
        message: 'Failed to fetch flows data from Klaviyo API'
      });
    }
    
    const flows = flowsResponse.data;
    logger.info(`Retrieved ${flows.length} flows from Klaviyo API`);
    
    // Prepare flows for database storage
    const dbFlows = flows.map(flow => {
      const attributes = flow.attributes || {};
      const metrics = attributes.metrics || {};
      const revenue = parseFloat(metrics.revenue || '0');
      
      // Calculate recipient count, open count, etc. from API response
      // In a real implementation, you would use actual metrics from the API
      const recipientCount = parseInt(metrics.recipient_count || '0', 10);
      const openCount = parseInt(metrics.open_count || '0', 10);
      const clickCount = parseInt(metrics.click_count || '0', 10);
      const conversionCount = parseInt(metrics.conversion_count || '0', 10);
      
      return {
        id: flow.id,
        name: attributes.name || 'Unnamed Flow',
        status: attributes.status || 'unknown',
        trigger_type: attributes.trigger_type || 'unknown',
        created_date: attributes.created_at ? new Date(attributes.created_at) : new Date(),
        recipient_count: recipientCount,
        open_count: openCount,
        click_count: clickCount,
        conversion_count: conversionCount,
        revenue: revenue,
        metadata: {
          original_data: attributes,
          klaviyo_updated_at: attributes.updated_at
        }
      };
    });
    
    // Store flows in database
    const createdFlows = await flowRepository.createBatch(dbFlows);
    
    // Return success response
    res.status(200).json({
      success: true,
      message: `Successfully synced ${createdFlows.length} flows`,
      count: createdFlows.length,
      syncedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in flows sync controller:', error);
    res.status(500).json({
      error: 'Failed to sync flows data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get flow performance metrics
 * 
 * @param req Express request object
 * @param res Express response object
 */
export async function getFlowPerformanceMetrics(req: Request, res: Response) {
  try {
    // Parse date range from query parameter
    const dateRangeStr = req.query.dateRange as string;
    const dateRange = parseDateRange(dateRangeStr);
    
    // Get metrics from repository
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const metrics = await flowRepository.getPerformanceMetrics(
      startDate, 
      endDate
    );
    
    // Return metrics as JSON
    res.status(200).json(metrics);
  } catch (error) {
    logger.error('Error in flow performance metrics controller:', error);
    res.status(500).json({
      error: 'Failed to fetch flow performance metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
