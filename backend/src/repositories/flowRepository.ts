import { db } from '../database';
import { logger } from '../utils/logger';

/**
 * Interface representing a Klaviyo flow
 */
export interface Flow {
  id: string;
  name: string;
  status: string;
  trigger_type?: string;
  created_date?: Date;
  recipient_count?: number;
  open_count?: number;
  click_count?: number;
  conversion_count?: number;
  revenue?: number;
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
}

/**
 * Repository for managing Klaviyo flows in the database
 */
export class FlowRepository {
  /**
   * Find a flow by its ID
   * @param id Flow ID
   * @returns Flow or null if not found
   */
  async findById(id: string): Promise<Flow | null> {
    const result = await db.query(
      'SELECT * FROM klaviyo_flows WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  }
  
  /**
   * Find flows by name (partial match)
   * @param name Flow name to search for
   * @returns Array of matching flows
   */
  async findByName(name: string): Promise<Flow[]> {
    const result = await db.query(
      'SELECT * FROM klaviyo_flows WHERE name ILIKE $1',
      [`%${name}%`]
    );
    
    return result.rows;
  }
  
  /**
   * Find flows by status
   * @param status Flow status
   * @returns Array of matching flows
   */
  async findByStatus(status: string): Promise<Flow[]> {
    const result = await db.query(
      'SELECT * FROM klaviyo_flows WHERE status = $1',
      [status]
    );
    
    return result.rows;
  }
  
  /**
   * Find flows by trigger type
   * @param triggerType Flow trigger type
   * @returns Array of matching flows
   */
  async findByTriggerType(triggerType: string): Promise<Flow[]> {
    const result = await db.query(
      'SELECT * FROM klaviyo_flows WHERE trigger_type = $1',
      [triggerType]
    );
    
    return result.rows;
  }
  
  /**
   * Find flows by date range
   * @param startDate Start date
   * @param endDate End date
   * @returns Array of flows within the date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Flow[]> {
    const result = await db.query(
      `SELECT * FROM klaviyo_flows 
       WHERE created_date >= $1 AND created_date <= $2
       ORDER BY created_date DESC`,
      [startDate, endDate]
    );
    
    return result.rows;
  }
  
  /**
   * Create a new flow
   * @param flow Flow data (without created_at/updated_at)
   * @returns Created flow
   */
  async create(flow: Omit<Flow, 'created_at' | 'updated_at'>): Promise<Flow> {
    const now = new Date();
    
    const result = await db.query(
      `INSERT INTO klaviyo_flows (
        id, name, status, trigger_type, created_date, recipient_count, open_count, 
        click_count, conversion_count, revenue, created_at, updated_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
      RETURNING *`,
      [
        flow.id,
        flow.name,
        flow.status,
        flow.trigger_type,
        flow.created_date,
        flow.recipient_count || 0,
        flow.open_count || 0,
        flow.click_count || 0,
        flow.conversion_count || 0,
        flow.revenue || 0,
        now,
        now,
        flow.metadata || {}
      ]
    );
    
    return result.rows[0];
  }
  
  /**
   * Create or update a flow
   * @param flow Flow data (with optional created_at)
   * @returns Created or updated flow
   */
  async createOrUpdate(flow: Omit<Flow, 'updated_at'>): Promise<Flow> {
    const now = new Date();
    
    const result = await db.query(
      `INSERT INTO klaviyo_flows (
        id, name, status, trigger_type, created_date, recipient_count, open_count, 
        click_count, conversion_count, revenue, created_at, updated_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET
        name = $2,
        status = $3,
        trigger_type = $4,
        created_date = $5,
        recipient_count = $6,
        open_count = $7,
        click_count = $8,
        conversion_count = $9,
        revenue = $10,
        updated_at = $12,
        metadata = $13
      RETURNING *`,
      [
        flow.id,
        flow.name,
        flow.status,
        flow.trigger_type,
        flow.created_date,
        flow.recipient_count || 0,
        flow.open_count || 0,
        flow.click_count || 0,
        flow.conversion_count || 0,
        flow.revenue || 0,
        flow.created_at || now,
        now,
        flow.metadata || {}
      ]
    );
    
    return result.rows[0];
  }
  
  /**
   * Update flow metrics
   * @param id Flow ID
   * @param metrics Metrics to update
   * @returns Updated flow
   */
  async updateMetrics(
    id: string, 
    metrics: {
      recipient_count?: number;
      open_count?: number;
      click_count?: number;
      conversion_count?: number;
      revenue?: number;
    }
  ): Promise<Flow | null> {
    // Build the SET clause dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    // Add each field to the updates array if it exists
    if (metrics.recipient_count !== undefined) {
      updates.push(`recipient_count = $${paramIndex++}`);
      values.push(metrics.recipient_count);
    }
    
    if (metrics.open_count !== undefined) {
      updates.push(`open_count = $${paramIndex++}`);
      values.push(metrics.open_count);
    }
    
    if (metrics.click_count !== undefined) {
      updates.push(`click_count = $${paramIndex++}`);
      values.push(metrics.click_count);
    }
    
    if (metrics.conversion_count !== undefined) {
      updates.push(`conversion_count = $${paramIndex++}`);
      values.push(metrics.conversion_count);
    }
    
    if (metrics.revenue !== undefined) {
      updates.push(`revenue = $${paramIndex++}`);
      values.push(metrics.revenue);
    }
    
    // Always update the updated_at timestamp
    updates.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());
    
    // Add the ID as the last parameter
    values.push(id);
    
    // If no fields to update, return the existing record
    if (updates.length === 1) { // Only updated_at
      return this.findById(id);
    }
    
    const result = await db.query(
      `UPDATE klaviyo_flows 
       SET ${updates.join(', ')} 
       WHERE id = $${paramIndex} 
       RETURNING *`,
      values
    );
    
    return result.rows[0] || null;
  }
  
  /**
   * Delete a flow by ID
   * @param id Flow ID
   * @returns True if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM klaviyo_flows WHERE id = $1 RETURNING id',
      [id]
    );
    
    return result.rowCount > 0;
  }
  
  /**
   * Find all flows
   * @param limit Maximum number of records to return
   * @param offset Offset for pagination
   * @returns Array of flows
   */
  async findAll(limit = 100, offset = 0): Promise<Flow[]> {
    const result = await db.query(
      'SELECT * FROM klaviyo_flows ORDER BY created_date DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    
    return result.rows;
  }
  
  /**
   * Create multiple flows in a single transaction
   * @param flows Array of flows to create
   * @returns Array of created flows
   */
  async createBatch(flows: Omit<Flow, 'created_at' | 'updated_at'>[]): Promise<Flow[]> {
    return db.transaction(async (client) => {
      const createdFlows: Flow[] = [];
      const now = new Date();
      
      for (const flow of flows) {
        const result = await client.query(
          `INSERT INTO klaviyo_flows (
            id, name, status, trigger_type, created_date, recipient_count, open_count, 
            click_count, conversion_count, revenue, created_at, updated_at, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (id) DO UPDATE SET
            name = $2,
            status = $3,
            trigger_type = $4,
            created_date = $5,
            recipient_count = $6,
            open_count = $7,
            click_count = $8,
            conversion_count = $9,
            revenue = $10,
            updated_at = $12,
            metadata = $13
          RETURNING *`,
          [
            flow.id,
            flow.name,
            flow.status,
            flow.trigger_type,
            flow.created_date,
            flow.recipient_count || 0,
            flow.open_count || 0,
            flow.click_count || 0,
            flow.conversion_count || 0,
            flow.revenue || 0,
            now,
            now,
            flow.metadata || {}
          ]
        );
        
        createdFlows.push(result.rows[0]);
      }
      
      return createdFlows;
    });
  }
  
  /**
   * Count flows by status
   * @param status Flow status
   * @returns Count of flows
   */
  async countByStatus(status: string): Promise<number> {
    const result = await db.query(
      'SELECT COUNT(*) FROM klaviyo_flows WHERE status = $1',
      [status]
    );
    
    return parseInt(result.rows[0].count, 10);
  }
  
  /**
   * Get flow performance metrics
   * @param startDate Start date
   * @param endDate End date
   * @returns Performance metrics
   */
  async getPerformanceMetrics(startDate: Date, endDate: Date): Promise<{
    totalFlows: number;
    totalRecipients: number;
    totalOpens: number;
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    avgOpenRate: number;
    avgClickRate: number;
    avgConversionRate: number;
  }> {
    const result = await db.query(
      `SELECT 
        COUNT(*) as total_flows,
        SUM(recipient_count) as total_recipients,
        SUM(open_count) as total_opens,
        SUM(click_count) as total_clicks,
        SUM(conversion_count) as total_conversions,
        SUM(revenue) as total_revenue
       FROM klaviyo_flows 
       WHERE created_date >= $1 AND created_date <= $2`,
      [startDate, endDate]
    );
    
    const metrics = result.rows[0];
    const totalRecipients = parseInt(metrics.total_recipients, 10) || 0;
    const totalOpens = parseInt(metrics.total_opens, 10) || 0;
    const totalClicks = parseInt(metrics.total_clicks, 10) || 0;
    const totalConversions = parseInt(metrics.total_conversions, 10) || 0;
    
    // Calculate rates
    const avgOpenRate = totalRecipients > 0 ? (totalOpens / totalRecipients) * 100 : 0;
    const avgClickRate = totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0;
    const avgConversionRate = totalRecipients > 0 ? (totalConversions / totalRecipients) * 100 : 0;
    
    return {
      totalFlows: parseInt(metrics.total_flows, 10) || 0,
      totalRecipients,
      totalOpens,
      totalClicks,
      totalConversions,
      totalRevenue: parseFloat(metrics.total_revenue) || 0,
      avgOpenRate,
      avgClickRate,
      avgConversionRate
    };
  }
}

// Create a singleton instance
export const flowRepository = new FlowRepository();

export default flowRepository;