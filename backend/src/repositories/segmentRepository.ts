import { db } from '../utils/db';
import { logger } from '../utils/logger';

/**
 * Interface representing a Klaviyo segment
 */
export interface Segment {
  id: string;
  name: string;
  status: string;
  member_count?: number;
  active_count?: number;
  conversion_rate?: number;
  revenue?: number;
  created_date?: Date;
  created_at: Date;
  updated_at: Date;
  last_synced_at?: Date;
  metadata?: Record<string, any>;
}

/**
 * Performance metrics for segments
 */
export interface SegmentPerformanceMetrics {
  totalSegments: number;
  activeSegments: number;
  inactiveSegments: number;
  totalMembers: number;
  averageConversionRate: number;
  totalRevenue: number;
  averageRevenuePerSegment: number;
}

/**
 * Repository for managing Klaviyo segments in the database
 */
export class SegmentRepository {
  /**
   * Find a segment by ID
   */
  async findById(id: string): Promise<Segment | null> {
    try {
      const query = 'SELECT * FROM klaviyo_segments WHERE id = $1';
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error finding segment by ID:', error);
      throw error;
    }
  }
  
  /**
   * Find segments by name (partial match)
   */
  async findByName(name: string): Promise<Segment[]> {
    try {
      const query = 'SELECT * FROM klaviyo_segments WHERE name ILIKE $1 ORDER BY name';
      const result = await db.query(query, [`%${name}%`]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding segments by name:', error);
      throw error;
    }
  }
  
  /**
   * Find segments by status
   */
  async findByStatus(status: string): Promise<Segment[]> {
    try {
      const query = 'SELECT * FROM klaviyo_segments WHERE status = $1 ORDER BY name';
      const result = await db.query(query, [status]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding segments by status:', error);
      throw error;
    }
  }
  
  /**
   * Find segments by date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Segment[]> {
    try {
      // If the created_date is null, use created_at as a fallback
      const query = `
        SELECT * FROM klaviyo_segments 
        WHERE (created_date IS NOT NULL AND created_date BETWEEN $1 AND $2)
           OR (created_date IS NULL AND created_at BETWEEN $1 AND $2)
        ORDER BY revenue DESC, member_count DESC
      `;
      const result = await db.query(query, [startDate, endDate]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding segments by date range:', error);
      throw error;
    }
  }
  
  /**
   * Create a new segment
   */
  async create(segment: Omit<Segment, 'created_at' | 'updated_at'>): Promise<Segment> {
    try {
      const query = `
        INSERT INTO klaviyo_segments (
          id, name, status, member_count, active_count, conversion_rate, revenue, 
          created_date, last_synced_at, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *
      `;
      
      const result = await db.query(query, [
        segment.id,
        segment.name,
        segment.status || 'active',
        segment.member_count || 0,
        segment.active_count || 0,
        segment.conversion_rate || 0,
        segment.revenue || 0,
        segment.created_date || null,
        segment.last_synced_at || null,
        segment.metadata || null
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating segment:', error);
      throw error;
    }
  }
  
  /**
   * Create or update a segment (upsert)
   */
  async createOrUpdate(segment: Omit<Segment, 'updated_at'>): Promise<Segment> {
    try {
      const query = `
        INSERT INTO klaviyo_segments (
          id, name, status, member_count, active_count, conversion_rate, revenue, 
          created_date, last_synced_at, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        ON CONFLICT (id)
        DO UPDATE SET
          name = EXCLUDED.name,
          status = EXCLUDED.status,
          member_count = EXCLUDED.member_count,
          active_count = EXCLUDED.active_count,
          conversion_rate = EXCLUDED.conversion_rate,
          revenue = EXCLUDED.revenue,
          created_date = EXCLUDED.created_date,
          last_synced_at = EXCLUDED.last_synced_at,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
        RETURNING *
      `;
      
      const result = await db.query(query, [
        segment.id,
        segment.name,
        segment.status || 'active',
        segment.member_count || 0,
        segment.active_count || 0,
        segment.conversion_rate || 0,
        segment.revenue || 0,
        segment.created_date || null,
        segment.last_synced_at || null,
        segment.metadata || null,
        segment.created_at || new Date()
      ]);
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating or updating segment:', error);
      throw error;
    }
  }
  
  /**
   * Update segment metrics
   */
  async updateMetrics(
    id: string, 
    metrics: {
      member_count?: number,
      active_count?: number,
      conversion_rate?: number,
      revenue?: number,
      metadata?: Record<string, any>
    }
  ): Promise<Segment | null> {
    try {
      // Dynamically build the SET clause based on provided fields
      const updateFields: string[] = [];
      const params: any[] = [id];
      let paramIndex = 2;
      
      Object.entries(metrics).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      });
      
      // Always update the timestamp
      updateFields.push(`updated_at = NOW()`);
      
      if (updateFields.length === 1) {
        // Only the timestamp is being updated, still need to find the segment
        const result = await db.query('SELECT * FROM klaviyo_segments WHERE id = $1', [id]);
        return result.rows[0] || null;
      }
      
      const query = `
        UPDATE klaviyo_segments
        SET ${updateFields.join(', ')}
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await db.query(query, params);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating segment metrics:', error);
      throw error;
    }
  }
  
  /**
   * Delete a segment
   */
  async delete(id: string): Promise<boolean> {
    try {
      const query = 'DELETE FROM klaviyo_segments WHERE id = $1 RETURNING id';
      const result = await db.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Error deleting segment:', error);
      throw error;
    }
  }
  
  /**
   * Find all segments with pagination
   */
  async findAll(limit = 100, offset = 0): Promise<Segment[]> {
    try {
      const query = 'SELECT * FROM klaviyo_segments ORDER BY name LIMIT $1 OFFSET $2';
      const result = await db.query(query, [limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding all segments:', error);
      throw error;
    }
  }
  
  /**
   * Create multiple segments in a single transaction
   */
  async createBatch(segments: Omit<Segment, 'created_at' | 'updated_at'>[]): Promise<Segment[]> {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      const createdSegments: Segment[] = [];
      
      for (const segment of segments) {
        const query = `
          INSERT INTO klaviyo_segments (
            id, name, status, member_count, active_count, conversion_rate, revenue, 
            created_date, last_synced_at, metadata, created_at, updated_at
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          ON CONFLICT (id)
          DO UPDATE SET
            name = EXCLUDED.name,
            status = EXCLUDED.status,
            member_count = EXCLUDED.member_count,
            active_count = EXCLUDED.active_count,
            conversion_rate = EXCLUDED.conversion_rate,
            revenue = EXCLUDED.revenue,
            created_date = EXCLUDED.created_date,
            last_synced_at = EXCLUDED.last_synced_at,
            metadata = EXCLUDED.metadata,
            updated_at = NOW()
          RETURNING *
        `;
        
        const result = await client.query(query, [
          segment.id,
          segment.name,
          segment.status || 'active',
          segment.member_count || 0,
          segment.active_count || 0,
          segment.conversion_rate || 0,
          segment.revenue || 0,
          segment.created_date || null,
          segment.last_synced_at || null,
          segment.metadata || null
        ]);
        
        createdSegments.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      return createdSegments;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating batch of segments:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Count segments by status
   */
  async countByStatus(status: string): Promise<number> {
    try {
      const query = 'SELECT COUNT(*) FROM klaviyo_segments WHERE status = $1';
      const result = await db.query(query, [status]);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      logger.error('Error counting segments by status:', error);
      throw error;
    }
  }
  
  /**
   * Get performance metrics for segments in a date range
   */
  async getPerformanceMetrics(startDate: Date, endDate: Date): Promise<SegmentPerformanceMetrics> {
    try {
      const query = `
        SELECT
          COUNT(*) as total_segments,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_segments,
          COUNT(CASE WHEN status != 'active' THEN 1 END) as inactive_segments,
          SUM(member_count) as total_members,
          AVG(CASE WHEN member_count > 0 THEN conversion_rate ELSE 0 END) as avg_conversion_rate,
          SUM(revenue) as total_revenue,
          CASE 
            WHEN COUNT(*) > 0 THEN SUM(revenue) / COUNT(*)
            ELSE 0
          END as avg_revenue_per_segment
        FROM klaviyo_segments
        WHERE (created_date IS NOT NULL AND created_date BETWEEN $1 AND $2)
           OR (created_date IS NULL AND created_at BETWEEN $1 AND $2)
      `;
      
      const result = await db.query(query, [startDate, endDate]);
      
      if (result.rows.length === 0) {
        return {
          totalSegments: 0,
          activeSegments: 0,
          inactiveSegments: 0,
          totalMembers: 0,
          averageConversionRate: 0,
          totalRevenue: 0,
          averageRevenuePerSegment: 0
        };
      }
      
      const row = result.rows[0];
      
      return {
        totalSegments: parseInt(row.total_segments, 10) || 0,
        activeSegments: parseInt(row.active_segments, 10) || 0,
        inactiveSegments: parseInt(row.inactive_segments, 10) || 0,
        totalMembers: parseInt(row.total_members, 10) || 0,
        averageConversionRate: parseFloat(row.avg_conversion_rate) || 0,
        totalRevenue: parseFloat(row.total_revenue) || 0,
        averageRevenuePerSegment: parseFloat(row.avg_revenue_per_segment) || 0
      };
    } catch (error) {
      logger.error('Error getting segment performance metrics:', error);
      throw error;
    }
  }
  
  /**
   * Find segments updated since a given date
   */
  async findUpdatedSince(since: Date): Promise<Segment[]> {
    try {
      const query = 'SELECT * FROM klaviyo_segments WHERE updated_at > $1 ORDER BY updated_at DESC';
      const result = await db.query(query, [since]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding segments updated since date:', error);
      throw error;
    }
  }
  
  /**
   * Get the latest update timestamp from all segments
   */
  async getLatestUpdateTimestamp(): Promise<Date | null> {
    try {
      const query = 'SELECT MAX(updated_at) as latest FROM klaviyo_segments';
      const result = await db.query(query);
      
      if (result.rows.length === 0 || !result.rows[0].latest) {
        return null;
      }
      
      return result.rows[0].latest;
    } catch (error) {
      logger.error('Error getting latest segment update timestamp:', error);
      throw error;
    }
  }
  
  /**
   * Get segments sorted by revenue in descending order
   */
  async getTopPerformingSegments(limit = 10): Promise<Segment[]> {
    try {
      const query = `
        SELECT * FROM klaviyo_segments 
        WHERE status = 'active' AND revenue > 0
        ORDER BY revenue DESC
        LIMIT $1
      `;
      
      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting top performing segments:', error);
      throw error;
    }
  }
  
  /**
   * Get segments sorted by conversion rate in descending order
   */
  async getHighestConversionSegments(limit = 10): Promise<Segment[]> {
    try {
      const query = `
        SELECT * FROM klaviyo_segments 
        WHERE status = 'active' AND conversion_rate > 0
        ORDER BY conversion_rate DESC
        LIMIT $1
      `;
      
      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting highest conversion segments:', error);
      throw error;
    }
  }
}

// Create a singleton instance
export const segmentRepository = new SegmentRepository();
export default segmentRepository;