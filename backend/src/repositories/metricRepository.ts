import { db } from '../database';

/**
 * Interface representing a Klaviyo metric
 */
export interface Metric {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
  integration_id?: string;
  integration_name?: string;
  integration_category?: string;
  metadata?: Record<string, any>;
}

/**
 * Repository for managing Klaviyo metrics in the database
 */
export class MetricRepository {
  /**
   * Find a metric by its ID
   * @param id Metric ID
   * @returns Metric or null if not found
   */
  async findById(id: string): Promise<Metric | null> {
    const result = await db.query(
      'SELECT * FROM klaviyo_metrics WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  }
  
  /**
   * Find metrics by name (partial match)
   * @param name Metric name to search for
   * @returns Array of matching metrics
   */
  async findByName(name: string): Promise<Metric[]> {
    const result = await db.query(
      'SELECT * FROM klaviyo_metrics WHERE name ILIKE $1',
      [`%${name}%`]
    );
    
    return result.rows;
  }
  
  /**
   * Find metrics by integration category
   * @param category Integration category
   * @returns Array of matching metrics
   */
  async findByCategory(category: string): Promise<Metric[]> {
    const result = await db.query(
      'SELECT * FROM klaviyo_metrics WHERE integration_category = $1',
      [category]
    );
    
    return result.rows;
  }
  
  /**
   * Create a new metric
   * @param metric Metric data (without created_at/updated_at)
   * @returns Created metric
   */
  async create(metric: Omit<Metric, 'created_at' | 'updated_at'>): Promise<Metric> {
    const now = new Date();
    
    const result = await db.query(
      `INSERT INTO klaviyo_metrics (
        id, name, created_at, updated_at, integration_id, 
        integration_name, integration_category, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *`,
      [
        metric.id,
        metric.name,
        now,
        now,
        metric.integration_id,
        metric.integration_name,
        metric.integration_category,
        metric.metadata || {}
      ]
    );
    
    return result.rows[0];
  }
  
  /**
   * Create or update a metric
   * @param metric Metric data (with optional created_at)
   * @returns Created or updated metric
   */
  async createOrUpdate(metric: Omit<Metric, 'updated_at'>): Promise<Metric> {
    const now = new Date();
    
    const result = await db.query(
      `INSERT INTO klaviyo_metrics (
        id, name, created_at, updated_at, integration_id, 
        integration_name, integration_category, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        name = $2,
        updated_at = $4,
        integration_id = $5,
        integration_name = $6,
        integration_category = $7,
        metadata = $8
      RETURNING *`,
      [
        metric.id,
        metric.name,
        metric.created_at || now,
        now,
        metric.integration_id,
        metric.integration_name,
        metric.integration_category,
        metric.metadata || {}
      ]
    );
    
    return result.rows[0];
  }
  
  /**
   * Update an existing metric
   * @param id Metric ID
   * @param data Fields to update
   * @returns Updated metric
   */
  async update(id: string, data: Partial<Omit<Metric, 'id' | 'created_at' | 'updated_at'>>): Promise<Metric | null> {
    // Build the SET clause dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    // Add each field to the updates array if it exists
    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    
    if (data.integration_id !== undefined) {
      updates.push(`integration_id = $${paramIndex++}`);
      values.push(data.integration_id);
    }
    
    if (data.integration_name !== undefined) {
      updates.push(`integration_name = $${paramIndex++}`);
      values.push(data.integration_name);
    }
    
    if (data.integration_category !== undefined) {
      updates.push(`integration_category = $${paramIndex++}`);
      values.push(data.integration_category);
    }
    
    if (data.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      values.push(data.metadata);
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
      `UPDATE klaviyo_metrics 
       SET ${updates.join(', ')} 
       WHERE id = $${paramIndex} 
       RETURNING *`,
      values
    );
    
    return result.rows[0] || null;
  }
  
  /**
   * Delete a metric by ID
   * @param id Metric ID
   * @returns True if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM klaviyo_metrics WHERE id = $1 RETURNING id',
      [id]
    );
    
    return result.rowCount > 0;
  }
  
  /**
   * Find all metrics
   * @param limit Maximum number of records to return
   * @param offset Offset for pagination
   * @returns Array of metrics
   */
  async findAll(limit = 100, offset = 0): Promise<Metric[]> {
    const result = await db.query(
      'SELECT * FROM klaviyo_metrics ORDER BY name LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    
    return result.rows;
  }
}
