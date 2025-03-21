#!/usr/bin/env node

/**
 * Smoke tests for the Klaviyo Analytics Dashboard
 * 
 * These tests verify that the API endpoints are responding as expected
 * and that the frontend is properly serving content.
 * 
 * Usage: node smoke-test.js [baseUrl]
 * Default baseUrl is http://localhost:3001
 */

const fetch = require('node-fetch');
const { exit } = require('process');

// Configuration
const baseUrl = process.argv[2] || 'http://localhost:3001';
const frontendUrl = baseUrl.replace(':3001', ':3000');
const apiEndpoints = [
  '/api/health',
  '/api/overview',
  '/api/campaigns',
  '/api/flows',
  '/api/forms',
  '/api/segments'
];

// Color output for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

console.log(`${colors.blue}Starting smoke tests for ${baseUrl}${colors.reset}`);

async function testEndpoint(url) {
  try {
    console.log(`${colors.yellow}Testing ${url}...${colors.reset}`);
    const response = await fetch(url);
    
    if (response.ok) {
      console.log(`${colors.green}✓ ${url} - ${response.status} ${response.statusText}${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}✗ ${url} - ${response.status} ${response.statusText}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ ${url} - ${error.message}${colors.reset}`);
    return false;
  }
}

async function testFrontend() {
  try {
    console.log(`${colors.yellow}Testing frontend at ${frontendUrl}...${colors.reset}`);
    const response = await fetch(frontendUrl);
    
    if (response.ok) {
      console.log(`${colors.green}✓ Frontend - ${response.status} ${response.statusText}${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Frontend - ${response.status} ${response.statusText}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Frontend - ${error.message}${colors.reset}`);
    return false;
  }
}

async function runTests() {
  let passed = 0;
  let failed = 0;
  
  // Test backend API endpoints
  for (const endpoint of apiEndpoints) {
    const result = await testEndpoint(`${baseUrl}${endpoint}`);
    result ? passed++ : failed++;
  }
  
  // Test frontend
  const frontendResult = await testFrontend();
  frontendResult ? passed++ : failed++;
  
  // Report results
  console.log('\n===== Test Summary =====');
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log('=======================\n');
  
  if (failed > 0) {
    console.log(`${colors.red}❌ Smoke tests failed with ${failed} errors${colors.reset}`);
    exit(1);
  } else {
    console.log(`${colors.green}✅ All smoke tests passed successfully!${colors.reset}`);
    exit(0);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Error running tests: ${error.message}${colors.reset}`);
  exit(1);
});