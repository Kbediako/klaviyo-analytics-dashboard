import { db } from '../database';

/**
 * Interface representing a Klaviyo profile
 */
export interface Profile {
  id: string;
  email?: string;
  phone_number?: string;
  external_id?: string;
  first_name?: string;
  last_name?: string;
  created_at: Date;
  updated_at: Date;
  properties?: Record<string, any>;
  last_event_date?: Date;
}

/**
 * Repository for managing Klaviyo profiles in the database
 */
export class ProfileRepository {
  /**
   * Find a profile by its ID
   * @param id Profile ID
   * @returns Profile or null if not found
   */
  async findById(id: string): Promise<Profile | null> {
    const result = await db.query(
      'SELECT * FROM klaviyo_profiles WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  }
  
  /**
   * Find a profile by email
   * @param email Email address
   * @returns Profile or null if not found
   */
  async findByEmail(email: string): Promise<Profile | null> {
    const result = await db.query(
      'SELECT * FROM klaviyo_profiles WHERE email = $1',
      [email]
    );
    
    return result.rows[0] || null;
  }
  
  /**
   * Find a profile by phone number
   * @param phoneNumber Phone number
   * @returns Profile or null if not found
   */
  async findByPhoneNumber(phoneNumber: string): Promise<Profile | null> {
    const result = await db.query(
      'SELECT * FROM klaviyo_profiles WHERE phone_number = $1',
      [phoneNumber]
    );
    
    return result.rows[0] || null;
  }
  
  /**
   * Create a new profile
   * @param profile Profile data (without created_at/updated_at)
   * @returns Created profile
   */
  async create(profile: Omit<Profile, 'created_at' | 'updated_at'>): Promise<Profile> {
    const now = new Date();
    
    const result = await db.query(
      `INSERT INTO klaviyo_profiles (
        id, email, phone_number, external_id, first_name, last_name, 
        created_at, updated_at, properties, last_event_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING *`,
      [
        profile.id,
        profile.email,
        profile.phone_number,
        profile.external_id,
        profile.first_name,
        profile.last_name,
        now,
        now,
        profile.properties || {},
        profile.last_event_date
      ]
    );
    
    return result.rows[0];
  }
  
  /**
   * Create or update a profile
   * @param profile Profile data (with optional created_at)
   * @returns Created or updated profile
   */
  async createOrUpdate(profile: Omit<Profile, 'updated_at'>): Promise<Profile> {
    const now = new Date();
    
    const result = await db.query(
      `INSERT INTO klaviyo_profiles (
        id, email, phone_number, external_id, first_name, last_name, 
        created_at, updated_at, properties, last_event_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        email = COALESCE($2, klaviyo_profiles.email),
        phone_number = COALESCE($3, klaviyo_profiles.phone_number),
        external_id = COALESCE($4, klaviyo_profiles.external_id),
        first_name = COALESCE($5, klaviyo_profiles.first_name),
        last_name = COALESCE($6, klaviyo_profiles.last_name),
        updated_at = $8,
        properties = COALESCE($9, klaviyo_profiles.properties),
        last_event_date = COALESCE($10, klaviyo_profiles.last_event_date)
      RETURNING *`,
      [
        profile.id,
        profile.email,
        profile.phone_number,
        profile.external_id,
        profile.first_name,
        profile.last_name,
        profile.created_at || now,
        now,
        profile.properties || {},
        profile.last_event_date
      ]
    );
    
    return result.rows[0];
  }
  
  /**
   * Update an existing profile
   * @param id Profile ID
   * @param data Fields to update
   * @returns Updated profile
   */
  async update(id: string, data: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>): Promise<Profile | null> {
    // Build the SET clause dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    // Add each field to the updates array if it exists
    if (data.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(data.email);
    }
    
    if (data.phone_number !== undefined) {
      updates.push(`phone_number = $${paramIndex++}`);
      values.push(data.phone_number);
    }
    
    if (data.external_id !== undefined) {
      updates.push(`external_id = $${paramIndex++}`);
      values.push(data.external_id);
    }
    
    if (data.first_name !== undefined) {
      updates.push(`first_name = $${paramIndex++}`);
      values.push(data.first_name);
    }
    
    if (data.last_name !== undefined) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(data.last_name);
    }
    
    if (data.properties !== undefined) {
      updates.push(`properties = $${paramIndex++}`);
      values.push(data.properties);
    }
    
    if (data.last_event_date !== undefined) {
      updates.push(`last_event_date = $${paramIndex++}`);
      values.push(data.last_event_date);
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
      `UPDATE klaviyo_profiles 
       SET ${updates.join(', ')} 
       WHERE id = $${paramIndex} 
       RETURNING *`,
      values
    );
    
    return result.rows[0] || null;
  }
  
  /**
   * Delete a profile by ID
   * @param id Profile ID
   * @returns True if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM klaviyo_profiles WHERE id = $1 RETURNING id',
      [id]
    );
    
    return result.rowCount > 0;
  }
  
  /**
   * Find all profiles
   * @param limit Maximum number of records to return
   * @param offset Offset for pagination
   * @returns Array of profiles
   */
  async findAll(limit = 100, offset = 0): Promise<Profile[]> {
    const result = await db.query(
      'SELECT * FROM klaviyo_profiles ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    
    return result.rows;
  }
  
  /**
   * Find profiles created within a time range
   * @param startTime Start of time range
   * @param endTime End of time range
   * @param limit Maximum number of records to return
   * @param offset Offset for pagination
   * @returns Array of profiles
   */
  async findByTimeRange(
    startTime: Date, 
    endTime: Date, 
    limit = 100, 
    offset = 0
  ): Promise<Profile[]> {
    const result = await db.query(
      `SELECT * FROM klaviyo_profiles 
       WHERE created_at >= $1 AND created_at <= $2
       ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [startTime, endTime, limit, offset]
    );
    
    return result.rows;
  }
  
  /**
   * Count profiles created within a time range
   * @param startTime Start of time range
   * @param endTime End of time range
   * @returns Count of profiles
   */
  async countByTimeRange(startTime: Date, endTime: Date): Promise<number> {
    const result = await db.query(
      `SELECT COUNT(*) FROM klaviyo_profiles 
       WHERE created_at >= $1 AND created_at <= $2`,
      [startTime, endTime]
    );
    
    return parseInt(result.rows[0].count, 10);
  }
  
  /**
   * Update the last event date for a profile
   * @param id Profile ID
   * @param eventDate Event date
   * @returns Updated profile
   */
  async updateLastEventDate(id: string, eventDate: Date): Promise<Profile | null> {
    const result = await db.query(
      `UPDATE klaviyo_profiles 
       SET last_event_date = $1, updated_at = $2
       WHERE id = $3 AND (last_event_date IS NULL OR last_event_date < $1)
       RETURNING *`,
      [eventDate, new Date(), id]
    );
    
    return result.rows[0] || null;
  }
}
