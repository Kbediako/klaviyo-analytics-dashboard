#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '5432',
  user: process.env.DB_USER || 'klaviyo',
  password: process.env.DB_PASSWORD || 'klaviyo_pass',
  database: process.env.DB_NAME || 'klaviyo_analytics',
};

// Path to migrations directory
const migrationsDir = path.join(__dirname, 'migrations');

// Get all migration files sorted by name
const getMigrationFiles = () => {
  return fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
};

// Run a single migration file
const runMigration = (file) => {
  return new Promise((resolve, reject) => {
    console.log(`Running migration: ${file}`);
    
    const psql = spawn('psql', [
      `-h${config.host}`,
      `-p${config.port}`,
      `-U${config.user}`,
      `-d${config.database}`,
      '-f', path.join(migrationsDir, file)
    ], {
      env: {
        ...process.env,
        PGPASSWORD: config.password
      }
    });
    
    let output = '';
    
    psql.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    psql.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    psql.on('close', (code) => {
      if (code === 0) {
        console.log(`Migration ${file} completed successfully`);
        resolve();
      } else {
        console.error(`Migration ${file} failed with code ${code}`);
        console.error(output);
        reject(new Error(`Migration failed: ${file}`));
      }
    });
  });
};

// Run all migrations
const runMigrations = async () => {
  try {
    const files = getMigrationFiles();
    
    if (files.length === 0) {
      console.log('No migration files found');
      return;
    }
    
    console.log(`Found ${files.length} migration files`);
    
    for (const file of files) {
      await runMigration(file);
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration process failed:', error.message);
    process.exit(1);
  }
};

// Create a migration tracking table if it doesn't exist
const setupMigrationTable = () => {
  return new Promise((resolve, reject) => {
    console.log('Setting up migration tracking table...');
    
    const psql = spawn('psql', [
      `-h${config.host}`,
      `-p${config.port}`,
      `-U${config.user}`,
      `-d${config.database}`,
    ], {
      env: {
        ...process.env,
        PGPASSWORD: config.password
      }
    });
    
    psql.stdin.write(`
      CREATE TABLE IF NOT EXISTS klaviyo_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    psql.stdin.end();
    
    let output = '';
    
    psql.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    psql.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    psql.on('close', (code) => {
      if (code === 0) {
        console.log('Migration table setup complete');
        resolve();
      } else {
        console.error(`Migration table setup failed with code ${code}`);
        console.error(output);
        reject(new Error('Migration table setup failed'));
      }
    });
  });
};

// Main function
const main = async () => {
  try {
    await setupMigrationTable();
    await runMigrations();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

// Run the script
main();
