/**
 * Database Test Setup Script
 * 
 * This script sets up a test database with the necessary tables and sample data
 * for running database validation tests in the CI environment.
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

/**
 * Sets up the test database with tables and sample data
 */
async function setupTestDb() {
  console.log('Setting up test database...');
  
  try {
    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS metrics (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES campaigns(id),
        name VARCHAR(255) NOT NULL,
        value NUMERIC NOT NULL,
        date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS flows (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS flow_metrics (
        id SERIAL PRIMARY KEY,
        flow_id INTEGER REFERENCES flows(id),
        name VARCHAR(255) NOT NULL,
        value NUMERIC NOT NULL,
        date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS forms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS segments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        member_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Insert sample data for campaigns
    await pool.query(`
      INSERT INTO campaigns (name, status)
      VALUES 
        ('Test Campaign 1', 'active'),
        ('Test Campaign 2', 'draft'),
        ('Test Campaign 3', 'completed')
      ON CONFLICT DO NOTHING;
    `);
    
    // Insert sample data for flows
    await pool.query(`
      INSERT INTO flows (name, status)
      VALUES 
        ('Welcome Series', 'active'),
        ('Abandoned Cart', 'active'),
        ('Re-engagement', 'draft')
      ON CONFLICT DO NOTHING;
    `);
    
    // Insert sample data for forms
    await pool.query(`
      INSERT INTO forms (name, status)
      VALUES 
        ('Newsletter Signup', 'active'),
        ('Exit Intent Popup', 'active'),
        ('Contact Form', 'inactive')
      ON CONFLICT DO NOTHING;
    `);
    
    // Insert sample data for segments
    await pool.query(`
      INSERT INTO segments (name, member_count)
      VALUES 
        ('Active Customers', 1250),
        ('Lapsed Customers', 450),
        ('High Value', 120)
      ON CONFLICT DO NOTHING;
    `);
    
    // Insert sample metrics data
    const campaignResult = await pool.query('SELECT id FROM campaigns LIMIT 3');
    if (campaignResult.rows.length > 0) {
      const campaignId = campaignResult.rows[0].id;
      
      // Add some metrics for the first campaign
      await pool.query(`
        INSERT INTO metrics (campaign_id, name, value, date)
        VALUES 
          ($1, 'opens', 1250, NOW() - INTERVAL '1 day'),
          ($1, 'clicks', 350, NOW() - INTERVAL '1 day'),
          ($1, 'conversions', 42, NOW() - INTERVAL '1 day')
        ON CONFLICT DO NOTHING;
      `, [campaignId]);
    }
    
    console.log('Test database setup complete');
  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the setup function
setupTestDb();
