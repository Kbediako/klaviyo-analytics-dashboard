/**
 * Data Integrity Tests
 * 
 * This file contains tests to verify data integrity in the database,
 * including validation of data values, relationships, and constraints.
 */

const { Pool } = require('pg');

// Create database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'test',
  password: process.env.DB_PASSWORD || 'test',
  database: process.env.DB_NAME || 'test_db'
});

describe('Data Integrity Tests', () => {
  // Close the pool after all tests
  afterAll(async () => {
    await pool.end();
  });
  
  // Test campaign status values
  test('campaigns have valid status values', async () => {
    const result = await pool.query('SELECT DISTINCT status FROM campaigns');
    const statuses = result.rows.map(row => row.status);
    
    // Check that all statuses are one of the allowed values
    const validStatuses = ['active', 'draft', 'completed', 'archived', 'inactive'];
    statuses.forEach(status => {
      expect(validStatuses).toContain(status);
    });
  });
  
  // Test flow status values
  test('flows have valid status values', async () => {
    const result = await pool.query('SELECT DISTINCT status FROM flows');
    const statuses = result.rows.map(row => row.status);
    
    // Check that all statuses are one of the allowed values
    const validStatuses = ['active', 'draft', 'completed', 'archived', 'inactive'];
    statuses.forEach(status => {
      expect(validStatuses).toContain(status);
    });
  });
  
  // Test form status values
  test('forms have valid status values', async () => {
    const result = await pool.query('SELECT DISTINCT status FROM forms');
    const statuses = result.rows.map(row => row.status);
    
    // Check that all statuses are one of the allowed values
    const validStatuses = ['active', 'draft', 'inactive'];
    statuses.forEach(status => {
      expect(validStatuses).toContain(status);
    });
  });
  
  // Test metrics have valid campaign references
  test('metrics have valid campaign references', async () => {
    const result = await pool.query(`
      SELECT m.id, m.campaign_id, c.id as campaign_exists
      FROM metrics m
      LEFT JOIN campaigns c ON m.campaign_id = c.id
      WHERE m.campaign_id IS NOT NULL
    `);
    
    // Check that all metrics reference a valid campaign
    result.rows.forEach(row => {
      expect(row.campaign_exists).not.toBeNull();
    });
  });
  
  // Test flow_metrics have valid flow references
  test('flow_metrics have valid flow references', async () => {
    const result = await pool.query(`
      SELECT fm.id, fm.flow_id, f.id as flow_exists
      FROM flow_metrics fm
      LEFT JOIN flows f ON fm.flow_id = f.id
      WHERE fm.flow_id IS NOT NULL
    `);
    
    // Check that all flow_metrics reference a valid flow
    result.rows.forEach(row => {
      expect(row.flow_exists).not.toBeNull();
    });
  });
  
  // Test segment member counts are non-negative
  test('segment member counts are non-negative', async () => {
    const result = await pool.query('SELECT id, name, member_count FROM segments');
    
    // Check that all member counts are non-negative
    result.rows.forEach(row => {
      expect(row.member_count).toBeGreaterThanOrEqual(0);
    });
  });
  
  // Test metric values are valid
  test('metric values are valid', async () => {
    const result = await pool.query('SELECT id, name, value FROM metrics');
    
    // Check that all metric values are numeric
    result.rows.forEach(row => {
      expect(typeof row.value).toBe('string'); // PostgreSQL returns numeric as string
      expect(parseFloat(row.value)).not.toBeNaN();
    });
  });
  
  // Test timestamps are valid
  test('created_at timestamps are valid', async () => {
    const tables = ['campaigns', 'flows', 'forms', 'segments'];
    
    for (const table of tables) {
      const result = await pool.query(`SELECT id, created_at FROM ${table}`);
      
      // Check that all created_at timestamps are valid dates
      result.rows.forEach(row => {
        const date = new Date(row.created_at);
        expect(date).toBeInstanceOf(Date);
        expect(date.toString()).not.toBe('Invalid Date');
      });
    }
  });
  
  // Test that updated_at is not before created_at
  test('updated_at is not before created_at', async () => {
    const tables = ['campaigns', 'flows', 'forms', 'segments'];
    
    for (const table of tables) {
      const result = await pool.query(`SELECT id, created_at, updated_at FROM ${table}`);
      
      // Check that all updated_at timestamps are not before created_at
      result.rows.forEach(row => {
        const createdAt = new Date(row.created_at);
        const updatedAt = new Date(row.updated_at);
        
        expect(updatedAt.getTime()).toBeGreaterThanOrEqual(createdAt.getTime());
      });
    }
  });
});
