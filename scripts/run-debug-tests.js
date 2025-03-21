/**
 * Run Debug Tests Locally
 * 
 * This script runs the debug workflow tests locally to help identify issues
 * before pushing to GitHub. It supports the same test scopes as the GitHub
 * Actions workflow.
 * 
 * Usage:
 *   node scripts/run-debug-tests.js [scope]
 * 
 * Where [scope] is one of:
 *   - full (default): Run all tests
 *   - backend: Run only backend tests
 *   - frontend: Run only frontend tests
 *   - database: Run only database validation tests
 *   - api: Run only API tests
 * 
 * Examples:
 *   node scripts/run-debug-tests.js
 *   node scripts/run-debug-tests.js backend
 *   node scripts/run-debug-tests.js database
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get test scope from command line arguments
const scope = process.argv[2] || 'full';
const validScopes = ['full', 'backend', 'frontend', 'database', 'api'];

if (!validScopes.includes(scope)) {
  console.error(`Error: Invalid test scope '${scope}'`);
  console.error(`Valid scopes are: ${validScopes.join(', ')}`);
  process.exit(1);
}

// Create necessary directories
const dirs = ['logs', 'screenshots', 'test-reports'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Set environment variables
process.env.DEBUG = 'true';
process.env.VERBOSE_LOGGING = 'true';
process.env.DEBUG_LEVEL = 'verbose';

// Database connection info for local testing
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';
process.env.DB_USER = process.env.DB_USER || 'test';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test';
process.env.DB_NAME = process.env.DB_NAME || 'test_db';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

console.log(`Running debug tests with scope: ${scope}`);
console.log('Environment:');
console.log(`  DEBUG: ${process.env.DEBUG}`);
console.log(`  VERBOSE_LOGGING: ${process.env.VERBOSE_LOGGING}`);
console.log(`  DB_HOST: ${process.env.DB_HOST}`);
console.log(`  DB_PORT: ${process.env.DB_PORT}`);
console.log(`  DB_NAME: ${process.env.DB_NAME}`);
console.log(`  REDIS_URL: ${process.env.REDIS_URL}`);

// Run tests based on scope
try {
  if (scope === 'full' || scope === 'backend') {
    console.log('\n=== Running Backend Tests ===\n');
    execSync('cd backend && npm test -- --reporter=junit --outputFile=test-results.xml --verbose', { 
      stdio: 'inherit',
      env: process.env
    });
  }
  
  if (scope === 'full' || scope === 'database') {
    console.log('\n=== Running Database Tests ===\n');
    
    // Ensure database test scripts exist
    const dbScriptsDir = path.join(__dirname, 'db-test-scripts');
    if (!fs.existsSync(dbScriptsDir)) {
      console.error(`Error: Database test scripts directory not found: ${dbScriptsDir}`);
      console.error('Run this script from the project root directory');
      process.exit(1);
    }
    
    // Setup test database
    console.log('Setting up test database...');
    execSync('node scripts/db-test-scripts/setup-test-db.js', { 
      stdio: 'inherit',
      env: process.env
    });
    
    // Run schema tests
    console.log('Running schema validation tests...');
    execSync('cd backend && npx jest ../scripts/db-test-scripts/db-schema.test.js', { 
      stdio: 'inherit',
      env: process.env
    });
    
    // Run data integrity tests
    console.log('Running data integrity tests...');
    execSync('cd backend && npx jest ../scripts/db-test-scripts/data-integrity.test.js', { 
      stdio: 'inherit',
      env: process.env
    });
  }
  
  if (scope === 'full' || scope === 'api') {
    console.log('\n=== Running API Tests ===\n');
    
    // Create API test file if it doesn't exist
    const apiTestDir = path.join('backend', 'src', 'tests');
    const apiTestFile = path.join(apiTestDir, 'api.test.js');
    
    if (!fs.existsSync(apiTestDir)) {
      fs.mkdirSync(apiTestDir, { recursive: true });
    }
    
    if (!fs.existsSync(apiTestFile)) {
      console.log('Creating API test file...');
      fs.writeFileSync(apiTestFile, `
const request = require('supertest');
const app = require('../app');

describe('API Endpoints', () => {
  test('GET /api/overview returns 200', async () => {
    const response = await request(app).get('/api/overview');
    expect(response.statusCode).toBe(200);
  });
  
  test('GET /api/campaigns returns 200', async () => {
    const response = await request(app).get('/api/campaigns');
    expect(response.statusCode).toBe(200);
  });
});
      `);
    }
    
    // Install supertest if not already installed
    try {
      require.resolve('supertest');
    } catch (e) {
      console.log('Installing supertest...');
      execSync('cd backend && npm install --save-dev supertest', { 
        stdio: 'inherit',
        env: process.env
      });
    }
    
    // Run API tests
    execSync('cd backend && npx jest src/tests/api.test.js --forceExit', { 
      stdio: 'inherit',
      env: process.env
    });
  }
  
  if (scope === 'full' || scope === 'frontend') {
    console.log('\n=== Running Browser Tests ===\n');
    
    // Check if Puppeteer is installed
    try {
      require.resolve('puppeteer');
    } catch (e) {
      console.log('Installing puppeteer...');
      execSync('npm install --save-dev puppeteer', { 
        stdio: 'inherit',
        env: process.env
      });
    }
    
    // Start the application in the background
    console.log('Starting the application...');
    const app = require('child_process').spawn('npm', ['run', 'dev'], {
      detached: true,
      stdio: 'ignore',
      env: process.env
    });
    
    // Give the app time to start
    console.log('Waiting for application to start...');
    execSync('sleep 10');
    
    try {
      // Run browser tests
      console.log('Running browser tests...');
      execSync('node scripts/ci-browser-tests.js', { 
        stdio: 'inherit',
        env: process.env
      });
    } finally {
      // Kill the application process
      console.log('Stopping the application...');
      process.kill(-app.pid);
    }
  }
  
  console.log('\n=== All Tests Completed ===\n');
  console.log('Test artifacts:');
  console.log('  - Test reports: backend/test-results.xml');
  console.log('  - Screenshots: screenshots/');
  console.log('  - Logs: logs/');
  
} catch (error) {
  console.error('\n=== Tests Failed ===\n');
  console.error(error.message);
  process.exit(1);
}
