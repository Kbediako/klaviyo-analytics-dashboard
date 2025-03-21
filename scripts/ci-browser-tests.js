/**
 * CI Browser Tests
 * Enhanced version of browser-action-demo.js for CI environment
 * 
 * This script runs browser tests in a CI environment with:
 * - Headless browser execution
 * - Screenshot capture
 * - Performance metrics collection
 * - Structured test results
 * - Proper error handling and reporting
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create directories if they don't exist
const dirs = ['screenshots', 'test-reports'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Test results object
const testResults = {
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  },
  performance: {},
  timestamp: new Date().toISOString()
};

// Helper function to add test result
function addTestResult(name, status, duration, error = null) {
  testResults.tests.push({
    name,
    status,
    duration,
    error: error ? error.toString() : null,
    timestamp: new Date().toISOString()
  });
  
  testResults.summary.total++;
  if (status === 'passed') testResults.summary.passed++;
  else if (status === 'failed') testResults.summary.failed++;
  else if (status === 'skipped') testResults.summary.skipped++;
}

async function runBrowserTests() {
  console.log('Starting Browser Tests in CI environment...');
  
  const startTime = Date.now();
  let browser;
  
  try {
    // Launch browser with specific viewport size to match browser_action tool
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: {
        width: 900,
        height: 600
      }
    });
    
    const page = await browser.newPage();
    
    // Collect console logs
    page.on('console', msg => {
      console.log(`Browser console ${msg.type()}: ${msg.text()}`);
    });
    
    // Collect performance metrics
    const performanceMetrics = {};
    
    // Test 1: Initial page load
    try {
      const testStartTime = Date.now();
      console.log('Test 1: Launching application...');
      
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
      performanceMetrics.initialLoadTime = Date.now() - testStartTime;
      
      await page.screenshot({ path: 'screenshots/01-initial-load.png' });
      
      const title = await page.title();
      console.log(`Page title: ${title}`);
      
      addTestResult('Initial page load', 'passed', Date.now() - testStartTime);
    } catch (error) {
      console.error('Test 1 failed:', error);
      await page.screenshot({ path: 'screenshots/01-initial-load-error.png' });
      addTestResult('Initial page load', 'failed', Date.now() - startTime, error);
    }
    
    // Test 2: Scroll to see content below the fold
    try {
      const testStartTime = Date.now();
      console.log('Test 2: Scrolling down to see content below the fold...');
      
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.screenshot({ path: 'screenshots/02-scrolled-overview.png' });
      
      addTestResult('Scroll to see content', 'passed', Date.now() - testStartTime);
    } catch (error) {
      console.error('Test 2 failed:', error);
      await page.screenshot({ path: 'screenshots/02-scrolled-overview-error.png' });
      addTestResult('Scroll to see content', 'failed', Date.now() - testStartTime, error);
    }
    
    // Test 3: Navigate to Campaigns tab
    try {
      const testStartTime = Date.now();
      console.log('Test 3: Clicking on Campaigns tab...');
      
      await page.click('button:has-text("Campaigns")');
      await page.screenshot({ path: 'screenshots/03-campaigns-tab-clicked.png' });
      
      // Scroll down to see campaigns table (following best practices)
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.screenshot({ path: 'screenshots/04-campaigns-scrolled.png' });
      
      // Verify campaigns table is visible
      const campaignsTable = await page.$('table');
      if (!campaignsTable) {
        throw new Error('Campaigns table not found');
      }
      
      addTestResult('Navigate to Campaigns tab', 'passed', Date.now() - testStartTime);
    } catch (error) {
      console.error('Test 3 failed:', error);
      await page.screenshot({ path: 'screenshots/03-campaigns-error.png' });
      addTestResult('Navigate to Campaigns tab', 'failed', Date.now() - testStartTime, error);
    }
    
    // Test 4: Navigate to Flows tab
    try {
      const testStartTime = Date.now();
      console.log('Test 4: Clicking on Flows tab...');
      
      await page.click('button:has-text("Flows")');
      await page.screenshot({ path: 'screenshots/05-flows-tab-clicked.png' });
      
      // Scroll down to see flows visualization
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.screenshot({ path: 'screenshots/06-flows-scrolled.png' });
      
      addTestResult('Navigate to Flows tab', 'passed', Date.now() - testStartTime);
    } catch (error) {
      console.error('Test 4 failed:', error);
      await page.screenshot({ path: 'screenshots/04-flows-error.png' });
      addTestResult('Navigate to Flows tab', 'failed', Date.now() - testStartTime, error);
    }
    
    // Test 5: Navigate to Forms tab
    try {
      const testStartTime = Date.now();
      console.log('Test 5: Clicking on Forms tab...');
      
      await page.click('button:has-text("Forms")');
      await page.screenshot({ path: 'screenshots/07-forms-tab-clicked.png' });
      
      // Scroll down to see forms data
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.screenshot({ path: 'screenshots/08-forms-scrolled.png' });
      
      addTestResult('Navigate to Forms tab', 'passed', Date.now() - testStartTime);
    } catch (error) {
      console.error('Test 5 failed:', error);
      await page.screenshot({ path: 'screenshots/05-forms-error.png' });
      addTestResult('Navigate to Forms tab', 'failed', Date.now() - testStartTime, error);
    }
    
    // Test 6: Navigate to Segments tab
    try {
      const testStartTime = Date.now();
      console.log('Test 6: Clicking on Segments tab...');
      
      await page.click('button:has-text("Segments")');
      await page.screenshot({ path: 'screenshots/09-segments-tab-clicked.png' });
      
      // Scroll down to see segments data
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.screenshot({ path: 'screenshots/10-segments-scrolled.png' });
      
      addTestResult('Navigate to Segments tab', 'passed', Date.now() - testStartTime);
    } catch (error) {
      console.error('Test 6 failed:', error);
      await page.screenshot({ path: 'screenshots/06-segments-error.png' });
      addTestResult('Navigate to Segments tab', 'failed', Date.now() - testStartTime, error);
    }
    
    // Test 7: Return to Overview tab
    try {
      const testStartTime = Date.now();
      console.log('Test 7: Returning to Overview tab...');
      
      await page.click('button:has-text("Overview")');
      await page.screenshot({ path: 'screenshots/11-overview-tab-clicked.png' });
      
      // Final scroll to see all overview content
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.screenshot({ path: 'screenshots/12-overview-scrolled.png' });
      
      addTestResult('Return to Overview tab', 'passed', Date.now() - testStartTime);
    } catch (error) {
      console.error('Test 7 failed:', error);
      await page.screenshot({ path: 'screenshots/07-overview-error.png' });
      addTestResult('Return to Overview tab', 'failed', Date.now() - testStartTime, error);
    }
    
    // Collect performance metrics
    try {
      const metrics = await page.metrics();
      testResults.performance = {
        jsHeapSizeLimit: metrics.JSHeapUsedSize,
        jsHeapTotalSize: metrics.JSHeapTotalSize,
        jsHeapUsedSize: metrics.JSHeapUsedSize,
        layoutCount: metrics.LayoutCount,
        recalcStyleCount: metrics.RecalcStyleCount,
        layoutDuration: metrics.LayoutDuration,
        recalcStyleDuration: metrics.RecalcStyleDuration,
        scriptDuration: metrics.ScriptDuration,
        taskDuration: metrics.TaskDuration,
        initialLoadTime: performanceMetrics.initialLoadTime
      };
    } catch (error) {
      console.error('Error collecting performance metrics:', error);
    }
    
    // Save test results
    testResults.duration = Date.now() - startTime;
    fs.writeFileSync('test-reports/browser-test-report.json', JSON.stringify(testResults, null, 2));
    
    // Log summary
    console.log('\nBrowser Tests Summary:');
    console.log(`Total: ${testResults.summary.total}`);
    console.log(`Passed: ${testResults.summary.passed}`);
    console.log(`Failed: ${testResults.summary.failed}`);
    console.log(`Skipped: ${testResults.summary.skipped}`);
    console.log(`Duration: ${testResults.duration}ms`);
    
    // Exit with error if any tests failed
    if (testResults.summary.failed > 0) {
      console.error(`${testResults.summary.failed} tests failed!`);
      process.exitCode = 1;
    } else {
      console.log('All tests passed!');
    }
    
  } catch (error) {
    console.error('Error during browser tests:', error);
    process.exitCode = 1;
  } finally {
    // Close the browser
    if (browser) {
      await browser.close();
    }
  }
}

// Run the tests
runBrowserTests().catch(error => {
  console.error('Unhandled error in browser tests:', error);
  process.exitCode = 1;
});
