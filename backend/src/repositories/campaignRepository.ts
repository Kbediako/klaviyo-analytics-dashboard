import { db } from '../database';
import { logger } from '../utils/logger';

/**
 * Interface representing a Klaviyo campaign
 */
export interface Campaign {
  id: string;
  name: string;
  status: string;
  send_time?: Date;
  sent_count?: number;
  open_count?: number;
  click_count?: number;
  conversion_count?: number;
  revenue?: number;
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
}

/**
 * Repository for managing Klaviyo campaigns in the database
 */
export class CampaignRepository {
  /**
   * Find a campaign by its ID
   * @param id Campaign ID
   * @returns Campaign or null if not found
   */
  async findById(id: string): Promise<Campaign | null> {
    const result = await db.query(
      'SELECT * FROM klaviyo_campaigns WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  }
  
  /**
   * Find campaigns by name (partial match)
   * @param name Campaign name to search for
   * @returns Array of matching campaigns
   */
  async findByName(name: string): Promise<Campaign[]> {
    const result = await db.query(
      'SELECT * FROM klaviyo_campaigns WHERE name ILIKE $1',
      [`%${name}%`]
    );
    
    return result.rows;
  }
  
  /**
   * Find campaigns by status
   * @param status Campaign status
   * @returns Array of matching campaigns
   */
  async findByStatus(status: string): Promise<Campaign[]> {
    const result = await db.query(
      'SELECT * FROM klaviyo_campaigns WHERE status = $1',
      [status]
    );
    
    return result.rows;
  }
  
  /**
   * Find campaigns by date range
   * @param startDate Start date
   * @param endDate End date
   * @returns Array of campaigns within the date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Campaign[]> {
    const result = await db.query(
      `SELECT * FROM klaviyo_campaigns 
       WHERE send_time >= $1 AND send_time <= $2
       ORDER BY send_time DESC`,
      [startDate, endDate]
    );
    
    return result.rows;
  }
  
  /**
   * Create a new campaign
   * @param campaign Campaign data (without created_at/updated_at)
   * @returns Created campaign
   */
  async create(campaign: Omit<Campaign, 'created_at' | 'updated_at'>): Promise<Campaign> {
    const now = new Date();
    
    const result = await db.query(
      `INSERT INTO klaviyo_campaigns (
        id, name, status, send_time, sent_count, open_count, 
        click_count, conversion_count, revenue, created_at, updated_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.send_time,
        campaign.sent_count || 0,
        campaign.open_count || 0,
        campaign.click_count || 0,
        campaign.conversion_count || 0,
        campaign.revenue || 0,
        now,
        now,
        campaign.metadata || {}
      ]
    );
    
    return result.rows[0];
  }
  
  /**
   * Create or update a campaign
   * @param campaign Campaign data (with optional created_at)
   * @returns Created or updated campaign
   */
  async createOrUpdate(campaign: Omit<Campaign, 'updated_at'>): Promise<Campaign> {
    const now = new Date();
    
    const result = await db.query(
      `INSERT INTO klaviyo_campaigns (
        id, name, status, send_time, sent_count, open_count, 
        click_count, conversion_count, revenue, created_at, updated_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        name = $2,
        status = $3,
        send_time = $4,
        sent_count = $5,
        open_count = $6,
        click_count = $7,
        conversion_count = $8,
        revenue = $9,
        updated_at = $11,
        metadata = $12
      RETURNING *`,
      [
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.send_time,
        campaign.sent_count || 0,
        campaign.open_count || 0,
        campaign.click_count || 0,
        campaign.conversion_count || 0,
        campaign.revenue || 0,
        campaign.created_at || now,
        now,
        campaign.metadata || {}
      ]
    );
    
    return result.rows[0];
  }
  
  /**
   * Update campaign metrics
   * @param id Campaign ID
   * @param metrics Metrics to update
   * @returns Updated campaign
   */
  async updateMetrics(
    id: string, 
    metrics: {
      sent_count?: number;
      open_count?: number;
      click_count?: number;
      conversion_count?: number;
      revenue?: number;
    }
  ): Promise<Campaign | null> {
    // Build the SET clause dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    // Add each field to the updates array if it exists
    if (metrics.sent_count !== undefined) {
      updates.push(`sent_count = $${paramIndex++}`);
      values.push(metrics.sent_count);
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
      `UPDATE klaviyo_campaigns 
       SET ${updates.join(', ')} 
       WHERE id = $${paramIndex} 
       RETURNING *`,
      values
    );
    
    return result.rows[0] || null;
  }
  
  /**
   * Delete a campaign by ID
   * @param id Campaign ID
   * @returns True if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM klaviyo_campaigns WHERE id = $1 RETURNING id',
      [id]
    );
    
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  /**
   * Find all campaigns
   * @param limit Maximum number of records to return
   * @param offset Offset for pagination
   * @returns Array of campaigns
   */
  async findAll(limit = 100, offset = 0): Promise<Campaign[]> {
    const result = await db.query(
      'SELECT * FROM klaviyo_campaigns ORDER BY send_time DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    
    return result.rows;
  }
  
  /**
   * Create multiple campaigns in a single transaction
   * @param campaigns Array of campaigns to create
   * @returns Array of created campaigns
   */
  async createBatch(campaigns: Omit<Campaign, 'created_at' | 'updated_at'>[]): Promise<Campaign[]> {
    return db.transaction(async (client) => {
      const createdCampaigns: Campaign[] = [];
      const now = new Date();
      
      for (const campaign of campaigns) {
        const result = await client.query(
          `INSERT INTO klaviyo_campaigns (
            id, name, status, send_time, sent_count, open_count, 
            click_count, conversion_count, revenue, created_at, updated_at, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO UPDATE SET
            name = $2,
            status = $3,
            send_time = $4,
            sent_count = $5,
            open_count = $6,
            click_count = $7,
            conversion_count = $8,
            revenue = $9,
            updated_at = $11,
            metadata = $12
          RETURNING *`,
          [
            campaign.id,
            campaign.name,
            campaign.status,
            campaign.send_time,
            campaign.sent_count || 0,
            campaign.open_count || 0,
            campaign.click_count || 0,
            campaign.conversion_count || 0,
            campaign.revenue || 0,
            now,
            now,
            campaign.metadata || {}
          ]
        );
        
        createdCampaigns.push(result.rows[0]);
      }
      
      return createdCampaigns;
    });
  }
  
  /**
   * Count campaigns by status
   * @param status Campaign status
   * @returns Count of campaigns
   */
  async countByStatus(status: string): Promise<number> {
    const result = await db.query(
      'SELECT COUNT(*) FROM klaviyo_campaigns WHERE status = $1',
      [status]
    );
    
    return parseInt(result.rows[0].count, 10);
  }
  
  /**
   * Get campaign performance metrics
   * @param startDate Start date
   * @param endDate End date
   * @returns Performance metrics
   */
  async getPerformanceMetrics(startDate: Date, endDate: Date): Promise<{
    totalCampaigns: number;
    totalSent: number;
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
        COUNT(*) as total_campaigns,
        SUM(sent_count) as total_sent,
        SUM(open_count) as total_opens,
        SUM(click_count) as total_clicks,
        SUM(conversion_count) as total_conversions,
        SUM(revenue) as total_revenue
       FROM klaviyo_campaigns 
       WHERE send_time >= $1 AND send_time <= $2`,
      [startDate, endDate]
    );
    
    const metrics = result.rows[0];
    const totalSent = parseInt(metrics.total_sent, 10) || 0;
    const totalOpens = parseInt(metrics.total_opens, 10) || 0;
    const totalClicks = parseInt(metrics.total_clicks, 10) || 0;
    const totalConversions = parseInt(metrics.total_conversions, 10) || 0;
    
    // Calculate rates
    const avgOpenRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0;
    const avgClickRate = totalOpens > 0 ? (totalClicks / totalOpens) * 100 : 0;
    const avgConversionRate = totalSent > 0 ? (totalConversions / totalSent) * 100 : 0;
    
    return {
      totalCampaigns: parseInt(metrics.total_campaigns, 10) || 0,
      totalSent,
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
export const campaignRepository = new CampaignRepository();

export default campaignRepository;
