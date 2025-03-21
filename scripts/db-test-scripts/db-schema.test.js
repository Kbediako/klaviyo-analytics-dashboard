/**
 * Database Schema Validation Tests
 * 
 * This file contains tests to verify that the database schema matches
 * the expected structure for the Klaviyo Analytics Dashboard.
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

describe('Database Schema Tests', () => {
  // Close the pool after all tests
  afterAll(async () => {
    await pool.end();
  });
  
  // Test that all required tables exist
  test('required tables exist', async () => {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tables = result.rows.map(row => row.table_name);
    
    // Check for required tables
    expect(tables).toContain('campaigns');
    expect(tables).toContain('metrics');
    expect(tables).toContain('flows');
    expect(tables).toContain('flow_metrics');
    expect(tables).toContain('forms');
    expect(tables).toContain('segments');
  });
  
  // Test campaigns table schema
  test('campaigns table has expected columns', async () => {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'campaigns'
    `);
    
    const columns = result.rows.reduce((acc, row) => {
      acc[row.column_name] = row.data_type;
      return acc;
    }, {});
    
    // Check for required columns
    expect(columns).toHaveProperty('id');
    expect(columns).toHaveProperty('name');
    expect(columns).toHaveProperty('status');
    expect(columns).toHaveProperty('created_at');
    expect(columns).toHaveProperty('updated_at');
    
    // Check column types
    expect(columns.id).toMatch(/integer|serial/i);
    expect(columns.name).toMatch(/character varying/i);
    expect(columns.status).toMatch(/character varying/i);
    expect(columns.created_at).toMatch(/timestamp/i);
    expect(columns.updated_at).toMatch(/timestamp/i);
  });
  
  // Test metrics table schema
  test('metrics table has expected columns', async () => {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'metrics'
    `);
    
    const columns = result.rows.reduce((acc, row) => {
      acc[row.column_name] = row.data_type;
      return acc;
    }, {});
    
    // Check for required columns
    expect(columns).toHaveProperty('id');
    expect(columns).toHaveProperty('campaign_id');
    expect(columns).toHaveProperty('name');
    expect(columns).toHaveProperty('value');
    expect(columns).toHaveProperty('date');
    expect(columns).toHaveProperty('created_at');
    
    // Check column types
    expect(columns.id).toMatch(/integer|serial/i);
    expect(columns.campaign_id).toMatch(/integer/i);
    expect(columns.name).toMatch(/character varying/i);
    expect(columns.value).toMatch(/numeric/i);
    expect(columns.date).toMatch(/timestamp/i);
    expect(columns.created_at).toMatch(/timestamp/i);
  });
  
  // Test flows table schema
  test('flows table has expected columns', async () => {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'flows'
    `);
    
    const columns = result.rows.reduce((acc, row) => {
      acc[row.column_name] = row.data_type;
      return acc;
    }, {});
    
    // Check for required columns
    expect(columns).toHaveProperty('id');
    expect(columns).toHaveProperty('name');
    expect(columns).toHaveProperty('status');
    expect(columns).toHaveProperty('created_at');
    expect(columns).toHaveProperty('updated_at');
  });
  
  // Test forms table schema
  test('forms table has expected columns', async () => {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'forms'
    `);
    
    const columns = result.rows.reduce((acc, row) => {
      acc[row.column_name] = row.data_type;
      return acc;
    }, {});
    
    // Check for required columns
    expect(columns).toHaveProperty('id');
    expect(columns).toHaveProperty('name');
    expect(columns).toHaveProperty('status');
    expect(columns).toHaveProperty('created_at');
    expect(columns).toHaveProperty('updated_at');
  });
  
  // Test segments table schema
  test('segments table has expected columns', async () => {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'segments'
    `);
    
    const columns = result.rows.reduce((acc, row) => {
      acc[row.column_name] = row.data_type;
      return acc;
    }, {});
    
    // Check for required columns
    expect(columns).toHaveProperty('id');
    expect(columns).toHaveProperty('name');
    expect(columns).toHaveProperty('member_count');
    expect(columns).toHaveProperty('created_at');
    expect(columns).toHaveProperty('updated_at');
  });
  
  // Test foreign key relationships
  test('metrics table has foreign key to campaigns', async () => {
    const result = await pool.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'metrics';
    `);
    
    expect(result.rows.length).toBeGreaterThan(0);
    
    const fk = result.rows.find(row => 
      row.column_name === 'campaign_id' && 
      row.foreign_table_name === 'campaigns'
    );
    
    expect(fk).toBeTruthy();
    expect(fk.foreign_column_name).toBe('id');
  });
  
  // Test flow_metrics foreign key
  test('flow_metrics table has foreign key to flows', async () => {
    const result = await pool.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'flow_metrics';
    `);
    
    expect(result.rows.length).toBeGreaterThan(0);
    
    const fk = result.rows.find(row => 
      row.column_name === 'flow_id' && 
      row.foreign_table_name === 'flows'
    );
    
    expect(fk).toBeTruthy();
    expect(fk.foreign_column_name).toBe('id');
  });
});
