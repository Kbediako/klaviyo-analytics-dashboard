import { db } from '../database';

/**
 * Interface representing a Klaviyo event
 */
export interface Event {
  id: string;
  metric_id: string;
  profile_id: string;
  timestamp: Date;
  value?: number;
  properties: Record<string, any>;
  raw_data: Record<string, any>;
}

/**
 * Repository for managing Klaviyo events in the database
 */
export class EventRepository {
  /**
   * Find an event by its ID
   * @param id Event ID
   * @returns Event or null if not found
   */
  async findById(id: string): Promise<Event | null> {
    const result = await db.query(
      'SELECT * FROM klaviyo_events WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  }
  
  /**
   * Create a new event
   * @param event Event data
   * @returns Created event
   */
  async create(event: Event): Promise<Event> {
    const result = await db.query(
      `INSERT INTO klaviyo_events (
        id, metric_id, profile_id, timestamp, value, properties, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [
        event.id,
        event.metric_id,
        event.profile_id,
        event.timestamp,
        event.value,
        event.properties,
        event.raw_data
      ]
    );
    
    return result.rows[0];
  }
  
  /**
   * Create multiple events in a single transaction
   * @param events Array of events to create
   * @returns Array of created events
   */
  async createBatch(events: Event[]): Promise<Event[]> {
    return db.transaction(async (client) => {
      const createdEvents: Event[] = [];
      
      for (const event of events) {
        const result = await client.query(
          `INSERT INTO klaviyo_events (
            id, metric_id, profile_id, timestamp, value, properties, raw_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
          RETURNING *`,
          [
            event.id,
            event.metric_id,
            event.profile_id,
            event.timestamp,
            event.value,
            event.properties,
            event.raw_data
          ]
        );
        
        createdEvents.push(result.rows[0]);
      }
      
      return createdEvents;
    });
  }
  
  /**
   * Find events by metric ID
   * @param metricId Metric ID
   * @param limit Maximum number of records to return
   * @param offset Offset for pagination
   * @returns Array of events
   */
  async findByMetricId(metricId: string, limit = 100, offset = 0): Promise<Event[]> {
    const result = await db.query(
      `SELECT * FROM klaviyo_events 
       WHERE metric_id = $1 
       ORDER BY timestamp DESC 
       LIMIT $2 OFFSET $3`,
      [metricId, limit, offset]
    );
    
    return result.rows;
  }
  
  /**
   * Find events by profile ID
   * @param profileId Profile ID
   * @param limit Maximum number of records to return
   * @param offset Offset for pagination
   * @returns Array of events
   */
  async findByProfileId(profileId: string, limit = 100, offset = 0): Promise<Event[]> {
    const result = await db.query(
      `SELECT * FROM klaviyo_events 
       WHERE profile_id = $1 
       ORDER BY timestamp DESC 
       LIMIT $2 OFFSET $3`,
      [profileId, limit, offset]
    );
    
    return result.rows;
  }
  
  /**
   * Find events by time range
   * @param startTime Start of time range
   * @param endTime End of time range
   * @param metricId Optional metric ID filter
   * @param limit Maximum number of records to return
   * @param offset Offset for pagination
   * @returns Array of events
   */
  async findByTimeRange(
    startTime: Date, 
    endTime: Date, 
    metricId?: string, 
    limit = 100, 
    offset = 0
  ): Promise<Event[]> {
    let query = `
      SELECT * FROM klaviyo_events 
      WHERE timestamp >= $1 AND timestamp <= $2
    `;
    
    const params: any[] = [startTime, endTime];
    
    if (metricId) {
      query += ` AND metric_id = $3`;
      params.push(metricId);
    }
    
    query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    return result.rows;
  }
  
  /**
   * Get count of events by metric ID
   * @param metricId Metric ID
   * @param startTime Optional start time filter
   * @param endTime Optional end time filter
   * @returns Count of events
   */
  async getCountByMetricId(
    metricId: string, 
    startTime?: Date, 
    endTime?: Date
  ): Promise<number> {
    let query = `SELECT COUNT(*) FROM klaviyo_events WHERE metric_id = $1`;
    const params: any[] = [metricId];
    
    if (startTime) {
      query += ` AND timestamp >= $${params.length + 1}`;
      params.push(startTime);
    }
    
    if (endTime) {
      query += ` AND timestamp <= $${params.length + 1}`;
      params.push(endTime);
    }
    
    const result = await db.query(query, params);
    
    return parseInt(result.rows[0].count, 10);
  }
  
  /**
   * Get sum of event values by metric ID
   * @param metricId Metric ID
   * @param startTime Optional start time filter
   * @param endTime Optional end time filter
   * @returns Sum of event values
   */
  async getSumByMetricId(
    metricId: string, 
    startTime?: Date, 
    endTime?: Date
  ): Promise<number> {
    let query = `SELECT SUM(value) FROM klaviyo_events WHERE metric_id = $1`;
    const params: any[] = [metricId];
    
    if (startTime) {
      query += ` AND timestamp >= $${params.length + 1}`;
      params.push(startTime);
    }
    
    if (endTime) {
      query += ` AND timestamp <= $${params.length + 1}`;
      params.push(endTime);
    }
    
    const result = await db.query(query, params);
    
    return parseFloat(result.rows[0].sum) || 0;
  }
  
  /**
   * Get aggregated metrics for a specific time bucket
   * @param metricId Metric ID
   * @param bucketSize Size of the time bucket ('1 hour', '1 day', '1 week', etc.)
   * @param startTime Start time
   * @param endTime End time
   * @returns Array of aggregated metrics
   */
  async getAggregatedMetrics(
    metricId: string,
    bucketSize: string,
    startTime: Date,
    endTime: Date
  ): Promise<Array<{
    time_bucket: Date;
    count: number;
    sum_value: number;
    min_value: number;
    max_value: number;
    avg_value: number;
  }>> {
    const query = `
      SELECT 
        time_bucket($1, timestamp) AS time_bucket,
        COUNT(*) AS count,
        SUM(value) AS sum_value,
        MIN(value) AS min_value,
        MAX(value) AS max_value,
        AVG(value) AS avg_value
      FROM klaviyo_events
      WHERE 
        metric_id = $2 AND
        timestamp >= $3 AND
        timestamp <= $4
      GROUP BY time_bucket
      ORDER BY time_bucket
    `;
    
    const result = await db.query(query, [bucketSize, metricId, startTime, endTime]);
    
    return result.rows;
  }
  
  /**
   * Store aggregated metrics for faster future queries
   * @param metricId Metric ID
   * @param timeBucket Time bucket
   * @param bucketSize Size of the time bucket ('1 hour', '1 day', '1 week', etc.)
   * @param metrics Aggregated metrics
   * @returns Created aggregated metrics record
   */
  async storeAggregatedMetrics(
    metricId: string,
    timeBucket: Date,
    bucketSize: string,
    metrics: {
      count: number;
      sum_value: number;
      min_value?: number;
      max_value?: number;
      avg_value?: number;
    }
  ): Promise<any> {
    const result = await db.query(
      `INSERT INTO klaviyo_aggregated_metrics (
        metric_id, time_bucket, bucket_size, count, sum_value, min_value, max_value, avg_value
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (metric_id, time_bucket, bucket_size) DO UPDATE SET
        count = $4,
        sum_value = $5,
        min_value = $6,
        max_value = $7,
        avg_value = $8
      RETURNING *`,
      [
        metricId,
        timeBucket,
        bucketSize,
        metrics.count,
        metrics.sum_value,
        metrics.min_value,
        metrics.max_value,
        metrics.avg_value
      ]
    );
    
    return result.rows[0];
  }
  
  /**
   * Get stored aggregated metrics
   * @param metricId Metric ID
   * @param bucketSize Size of the time bucket ('1 hour', '1 day', '1 week', etc.)
   * @param startTime Start time
   * @param endTime End time
   * @returns Array of aggregated metrics
   */
  async getStoredAggregatedMetrics(
    metricId: string,
    bucketSize: string,
    startTime: Date,
    endTime: Date
  ): Promise<any[]> {
    const query = `
      SELECT * FROM klaviyo_aggregated_metrics
      WHERE 
        metric_id = $1 AND
        bucket_size = $2 AND
        time_bucket >= $3 AND
        time_bucket <= $4
      ORDER BY time_bucket
    `;
    
    const result = await db.query(query, [metricId, bucketSize, startTime, endTime]);
    
    return result.rows;
  }
}
