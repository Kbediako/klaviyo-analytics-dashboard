import { Request, Response } from 'express';
import { getSegmentsData } from '../services/segmentsService';
import { parseDateRange } from '../utils/dateUtils';
import { logger } from '../utils/logger';
import { segmentRepository } from '../repositories/segmentRepository';
import dataSyncService from '../services/dataSyncService';

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
    
    // Try to get data from the database first
    const segments = await segmentRepository.findByDateRange(dateRange.startDate, dateRange.endDate);
    
    // If we have data in the database, transform and return it
    if (segments.length > 0) {
      logger.info(`Retrieved ${segments.length} segments from database`);
      
      // Transform data for frontend
      const transformedSegments = segments.map(segment => ({
        id: segment.id,
        name: segment.name,
        count: segment.member_count || 0,
        conversionRate: segment.conversion_rate || 0,
        revenue: segment.revenue || 0
      }));
      
      return res.status(200).json(transformedSegments);
    }
    
    // If not found in database, fetch from API
    logger.info('No segments found in database, fetching from API');
    const apiSegments = await getSegmentsData(dateRange);
    
    // Store in database for future requests
    if (apiSegments.length > 0) {
      try {
        const dbSegments = apiSegments.map(segment => ({
          id: segment.id,
          name: segment.name,
          status: 'active',
          member_count: segment.count || 0,
          conversion_rate: segment.conversionRate || 0,
          revenue: segment.revenue || 0,
          created_date: new Date(), // Fallback
          metadata: {
            source: 'api'
          }
        }));
        
        await segmentRepository.createBatch(dbSegments);
        logger.info(`Stored ${dbSegments.length} segments in database`);
      } catch (dbError) {
        logger.error('Error storing segments in database:', dbError);
      }
    }
    
    // Return API data
    return res.status(200).json(apiSegments);
  } catch (error) {
    logger.error('Error in segments controller:', error);
    res.status(500).json({
      error: 'Failed to fetch segments data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get segment performance metrics
 * 
 * @param req Express request object
 * @param res Express response object
 */
export async function getSegmentPerformanceMetrics(req: Request, res: Response) {
  try {
    // Parse date range from query parameter
    const dateRangeStr = req.query.dateRange as string;
    const dateRange = parseDateRange(dateRangeStr);
    
    // Get metrics from database
    const metrics = await segmentRepository.getPerformanceMetrics(dateRange.startDate, dateRange.endDate);
    
    return res.status(200).json(metrics);
  } catch (error) {
    logger.error('Error in segment performance metrics controller:', error);
    res.status(500).json({
      error: 'Failed to fetch segment performance metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Sync segments data from Klaviyo API to database
 * 
 * @param req Express request object
 * @param res Express response object
 */
export async function syncSegments(req: Request, res: Response) {
  try {
    const force = req.query.force === 'true';
    
    logger.info(`Starting segment sync${force ? ' (forced)' : ''}`);
    
    // Call dataSyncService to handle the sync
    const result = await dataSyncService.syncAll({
      force,
      entityTypes: ['segments']
    });
    
    return res.status(200).json({
      success: result.entityResults.segments?.success || false,
      message: result.entityResults.segments?.message || 'Segment sync completed',
      count: result.entityResults.segments?.count || 0
    });
  } catch (error) {
    logger.error('Error in segment sync controller:', error);
    res.status(500).json({
      error: 'Failed to sync segments data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}