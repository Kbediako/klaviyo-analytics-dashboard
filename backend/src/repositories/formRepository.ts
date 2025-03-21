import { db } from '../database';
import { logger } from '../utils/logger';

/**
 * Interface representing a Klaviyo form
 */
export interface Form {
  id: string;
  name: string;
  status: string;
  form_type?: string;
  views?: number;
  submissions?: number;
  conversions?: number;
  created_date?: Date;
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
}

/**
 * Repository for managing Klaviyo forms in the database
 */
export class FormRepository {
  /**
   * Find a form by its ID
   * @param id Form ID
   * @returns Form or null if not found
   */
  async findById(id: string): Promise<Form | null> {
    const result = await db.query(
      'SELECT * FROM klaviyo_forms WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  }
  
  /**
   * Find forms by name (partial match)
   * @param name Form name to search for
   * @returns Array of matching forms
   */
  async findByName(name: string): Promise<Form[]> {
    const result = await db.query(
      'SELECT * FROM klaviyo_forms WHERE name ILIKE $1',
      [`%${name}%`]
    );
    
    return result.rows;
  }
  
  /**
   * Find forms by status
   * @param status Form status
   * @returns Array of matching forms
   */
  async findByStatus(status: string): Promise<Form[]> {
    const result = await db.query(
      'SELECT * FROM klaviyo_forms WHERE status = $1',
      [status]
    );
    
    return result.rows;
  }
  
  /**
   * Find forms by type
   * @param formType Form type
   * @returns Array of matching forms
   */
  async findByType(formType: string): Promise<Form[]> {
    const result = await db.query(
      'SELECT * FROM klaviyo_forms WHERE form_type = $1',
      [formType]
    );
    
    return result.rows;
  }
  
  /**
   * Find forms by date range
   * @param startDate Start date
   * @param endDate End date
   * @returns Array of forms within the date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Form[]> {
    const result = await db.query(
      `SELECT * FROM klaviyo_forms 
       WHERE created_date >= $1 AND created_date <= $2
       ORDER BY created_date DESC`,
      [startDate, endDate]
    );
    
    return result.rows;
  }
  
  /**
   * Create a new form
   * @param form Form data (without created_at/updated_at)
   * @returns Created form
   */
  async create(form: Omit<Form, 'created_at' | 'updated_at'>): Promise<Form> {
    const now = new Date();
    
    const result = await db.query(
      `INSERT INTO klaviyo_forms (
        id, name, status, form_type, views, submissions, conversions, 
        created_date, created_at, updated_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *`,
      [
        form.id,
        form.name,
        form.status,
        form.form_type,
        form.views || 0,
        form.submissions || 0,
        form.conversions || 0,
        form.created_date,
        now,
        now,
        form.metadata || {}
      ]
    );
    
    return result.rows[0];
  }
  
  /**
   * Create or update a form
   * @param form Form data (with optional created_at)
   * @returns Created or updated form
   */
  async createOrUpdate(form: Omit<Form, 'updated_at'>): Promise<Form> {
    const now = new Date();
    
    const result = await db.query(
      `INSERT INTO klaviyo_forms (
        id, name, status, form_type, views, submissions, conversions,
        created_date, created_at, updated_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        name = $2,
        status = $3,
        form_type = $4,
        views = $5,
        submissions = $6,
        conversions = $7,
        created_date = $8,
        updated_at = $10,
        metadata = $11
      RETURNING *`,
      [
        form.id,
        form.name,
        form.status,
        form.form_type,
        form.views || 0,
        form.submissions || 0,
        form.conversions || 0,
        form.created_date,
        form.created_at || now,
        now,
        form.metadata || {}
      ]
    );
    
    return result.rows[0];
  }
  
  /**
   * Update form metrics
   * @param id Form ID
   * @param metrics Metrics to update
   * @returns Updated form
   */
  async updateMetrics(
    id: string, 
    metrics: {
      views?: number;
      submissions?: number;
      conversions?: number;
    }
  ): Promise<Form | null> {
    // Build the SET clause dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    // Add each field to the updates array if it exists
    if (metrics.views !== undefined) {
      updates.push(`views = $${paramIndex++}`);
      values.push(metrics.views);
    }
    
    if (metrics.submissions !== undefined) {
      updates.push(`submissions = $${paramIndex++}`);
      values.push(metrics.submissions);
    }
    
    if (metrics.conversions !== undefined) {
      updates.push(`conversions = $${paramIndex++}`);
      values.push(metrics.conversions);
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
      `UPDATE klaviyo_forms 
       SET ${updates.join(', ')} 
       WHERE id = $${paramIndex} 
       RETURNING *`,
      values
    );
    
    return result.rows[0] || null;
  }
  
  /**
   * Delete a form by ID
   * @param id Form ID
   * @returns True if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM klaviyo_forms WHERE id = $1 RETURNING id',
      [id]
    );
    
    return result.rowCount > 0;
  }
  
  /**
   * Find all forms
   * @param limit Maximum number of records to return
   * @param offset Offset for pagination
   * @returns Array of forms
   */
  async findAll(limit = 100, offset = 0): Promise<Form[]> {
    const result = await db.query(
      'SELECT * FROM klaviyo_forms ORDER BY created_date DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    
    return result.rows;
  }
  
  /**
   * Create multiple forms in a single transaction
   * @param forms Array of forms to create
   * @returns Array of created forms
   */
  async createBatch(forms: Omit<Form, 'created_at' | 'updated_at'>[]): Promise<Form[]> {
    return db.transaction(async (client) => {
      const createdForms: Form[] = [];
      const now = new Date();
      
      for (const form of forms) {
        const result = await client.query(
          `INSERT INTO klaviyo_forms (
            id, name, status, form_type, views, submissions, conversions,
            created_date, created_at, updated_at, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET
            name = $2,
            status = $3,
            form_type = $4,
            views = $5,
            submissions = $6,
            conversions = $7,
            created_date = $8,
            updated_at = $10,
            metadata = $11
          RETURNING *`,
          [
            form.id,
            form.name,
            form.status,
            form.form_type,
            form.views || 0,
            form.submissions || 0,
            form.conversions || 0,
            form.created_date,
            now,
            now,
            form.metadata || {}
          ]
        );
        
        createdForms.push(result.rows[0]);
      }
      
      return createdForms;
    });
  }
  
  /**
   * Count forms by status
   * @param status Form status
   * @returns Count of forms
   */
  async countByStatus(status: string): Promise<number> {
    const result = await db.query(
      'SELECT COUNT(*) FROM klaviyo_forms WHERE status = $1',
      [status]
    );
    
    return parseInt(result.rows[0].count, 10);
  }
  
  /**
   * Get form performance metrics
   * @param startDate Start date
   * @param endDate End date
   * @returns Performance metrics
   */
  async getPerformanceMetrics(startDate: Date, endDate: Date): Promise<{
    totalForms: number;
    totalViews: number;
    totalSubmissions: number;
    totalConversions: number;
    avgSubmissionRate: number;
    avgConversionRate: number;
  }> {
    const result = await db.query(
      `SELECT 
        COUNT(*) as total_forms,
        SUM(views) as total_views,
        SUM(submissions) as total_submissions,
        SUM(conversions) as total_conversions
       FROM klaviyo_forms 
       WHERE created_date >= $1 AND created_date <= $2`,
      [startDate, endDate]
    );
    
    const metrics = result.rows[0];
    const totalViews = parseInt(metrics.total_views, 10) || 0;
    const totalSubmissions = parseInt(metrics.total_submissions, 10) || 0;
    const totalConversions = parseInt(metrics.total_conversions, 10) || 0;
    
    // Calculate rates
    const avgSubmissionRate = totalViews > 0 ? (totalSubmissions / totalViews) * 100 : 0;
    const avgConversionRate = totalSubmissions > 0 ? (totalConversions / totalSubmissions) * 100 : 0;
    
    return {
      totalForms: parseInt(metrics.total_forms, 10) || 0,
      totalViews,
      totalSubmissions,
      totalConversions,
      avgSubmissionRate,
      avgConversionRate
    };
  }

  /**
   * Find forms updated since a specific timestamp
   * Used for incremental sync operations
   * @param since Timestamp to find forms updated since
   * @returns Array of forms updated since the timestamp
   */
  async findUpdatedSince(since: Date): Promise<Form[]> {
    logger.info(`Finding forms updated since ${since.toISOString()}`);
    
    const result = await db.query(
      `SELECT * FROM klaviyo_forms 
       WHERE updated_at > $1
       ORDER BY updated_at DESC`,
      [since]
    );
    
    return result.rows;
  }

  /**
   * Get the most recent update timestamp from the forms table
   * Used for tracking sync operations
   * @returns The most recent update timestamp or null if no forms exist
   */
  async getLatestUpdateTimestamp(): Promise<Date | null> {
    const result = await db.query(
      `SELECT MAX(updated_at) as latest_timestamp FROM klaviyo_forms`
    );
    
    return result.rows[0]?.latest_timestamp || null;
  }
}

// Create a singleton instance
export const formRepository = new FormRepository();

export default formRepository;