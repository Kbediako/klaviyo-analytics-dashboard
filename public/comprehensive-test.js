/**
 * Comprehensive Test Script for Klaviyo Analytics Dashboard
 * 
 * This script tests all aspects of the dashboard with mock data
 * to ensure it's ready for live API integration.
 */

// Test configuration
const config = {
  // Base URL for the application
  baseUrl: window.location.origin,
  
  // API endpoints to test
  endpoints: [
    '/api/overview',
    '/api/campaigns',
    '/api/flows',
    '/api/forms',
    '/api/segments',
    '/api/charts',
    '/api/charts/revenue',
    '/api/charts/distribution',
    '/api/charts/top-segments',
    '/api/charts/top-flows',
    '/api/charts/top-forms',
    '/api/health'
  ],
  
  // Date ranges to test
  dateRanges: [
    'last-7-days',
    'last-30-days',
    'this-month',
    'last-month'
  ],
  
  // UI components to test
  components: [
    { name: 'Overview Section', selector: '.overview-section' },
    { name: 'Revenue Chart', selector: '.revenue-chart' },
    { name: 'Channel Distribution Chart', selector: '.channel-distribution-chart' },
    { name: 'Campaigns Table', selector: '.campaigns-table' },
    { name: 'Flows Table', selector: '.flows-table' },
    { name: 'Forms Table', selector: '.forms-table' },
    { name: 'Segments Table', selector: '.segments-table' }
  ],
  
  // Navigation tabs to test
  tabs: [
    { name: 'Overview', selector: '[value="overview"]' },
    { name: 'Campaigns', selector: '[value="campaigns"]' },
    { name: 'Flows', selector: '[value="flows"]' },
    { name: 'Forms', selector: '[value="forms"]' },
    { name: 'Segments', selector: '[value="segments"]' }
  ]
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Test utilities
const TestUtils = {
  /**
   * Log a test result
   * @param {string} testName - Name of the test
   * @param {boolean} passed - Whether the test passed
   * @param {string} message - Additional message
   * @param {any} error - Error object if test failed
   */
  logResult(testName, passed, message = '', error = null) {
    const result = {
      name: testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    };
    
    if (error) {
      result.error = error.message || String(error);
      result.stack = error.stack;
    }
    
    testResults.details.push(result);
    
    if (passed) {
      testResults.passed++;
      console.log(`✅ PASS: ${testName}${message ? ' - ' + message : ''}`);
    } else {
      testResults.failed++;
      console.error(`❌ FAIL: ${testName}${message ? ' - ' + message : ''}`, error);
    }
    
    testResults.total = testResults.passed + testResults.failed;
    
    // Update UI
    this.updateResultsUI();
  },
  
  /**
   * Update the results UI
   */
  updateResultsUI() {
    const resultsElement = document.getElementById('test-results');
    if (!resultsElement) return;
    
    const passRate = testResults.total > 0 
      ? Math.round((testResults.passed / testResults.total) * 100) 
      : 0;
    
    resultsElement.innerHTML = `
      <div class="results-summary">
        <h3>Test Results</h3>
        <div class="stats">
          <div class="stat">
            <span class="label">Total:</span>
            <span class="value">${testResults.total}</span>
          </div>
          <div class="stat">
            <span class="label">Passed:</span>
            <span class="value passed">${testResults.passed}</span>
          </div>
          <div class="stat">
            <span class="label">Failed:</span>
            <span class="value failed">${testResults.failed}</span>
          </div>
          <div class="stat">
            <span class="label">Pass Rate:</span>
            <span class="value ${passRate >= 90 ? 'passed' : passRate >= 70 ? 'warning' : 'failed'}">${passRate}%</span>
          </div>
        </div>
      </div>
      <div class="results-details">
        <h4>Details</h4>
        <ul>
          ${testResults.details.map(result => `
            <li class="${result.passed ? 'passed' : 'failed'}">
              ${result.passed ? '✅' : '❌'} ${result.name}
              ${result.message ? `<span class="message">- ${result.message}</span>` : ''}
              ${!result.passed && result.error ? `<div class="error">${result.error}</div>` : ''}
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  },
  
  /**
   * Wait for an element to be present in the DOM
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<Element>} - The element
   */
  async waitForElement(selector, timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) return element;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Element not found: ${selector} (timeout: ${timeout}ms)`);
  },
  
  /**
   * Test if an element exists in the DOM
   * @param {string} selector - CSS selector
   * @param {string} testName - Name of the test
   */
  async testElementExists(selector, testName) {
    try {
      const element = await this.waitForElement(selector);
      this.logResult(testName, true, `Element found: ${selector}`);
      return element;
    } catch (error) {
      this.logResult(testName, false, `Element not found: ${selector}`, error);
      return null;
    }
  },
  
  /**
   * Fetch data from an API endpoint
   * @param {string} endpoint - API endpoint
   * @param {string} dateRange - Date range parameter
   * @returns {Promise<any>} - Response data
   */
  async fetchData(endpoint, dateRange = 'last-30-days') {
    const url = new URL(`${config.baseUrl}${endpoint}`);
    url.searchParams.append('dateRange', dateRange);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  /**
   * Test an API endpoint
   * @param {string} endpoint - API endpoint
   * @param {string} dateRange - Date range parameter
   */
  async testEndpoint(endpoint, dateRange = 'last-30-days') {
    const testName = `API Endpoint: ${endpoint} (${dateRange})`;
    
    try {
      const data = await this.fetchData(endpoint, dateRange);
      const isValid = data !== null && typeof data === 'object';
      
      this.logResult(
        testName,
        isValid,
        isValid ? 'Returned valid data' : 'Returned invalid data'
      );
      
      return data;
    } catch (error) {
      this.logResult(testName, false, 'Failed to fetch data', error);
      return null;
    }
  },
  
  /**
   * Click on a tab
   * @param {string} tabSelector - CSS selector for the tab
   */
  async clickTab(tabSelector) {
    try {
      const tab = await this.waitForElement(tabSelector);
      tab.click();
      return true;
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Test navigation between tabs
   * @param {Array} tabs - Array of tab objects with name and selector
   */
  async testTabNavigation(tabs) {
    for (const tab of tabs) {
      const testName = `Tab Navigation: ${tab.name}`;
      
      try {
        const clicked = await this.clickTab(tab.selector);
        
        if (!clicked) {
          this.logResult(testName, false, `Failed to click tab: ${tab.name}`);
          continue;
        }
        
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if tab content is visible
        const tabContent = document.querySelector(`[data-state="active"][role="tabpanel"]`);
        const isVisible = tabContent && tabContent.offsetParent !== null;
        
        this.logResult(
          testName,
          isVisible,
          isVisible ? `Successfully navigated to ${tab.name} tab` : `Tab content not visible for ${tab.name}`
        );
      } catch (error) {
        this.logResult(testName, false, `Error testing tab: ${tab.name}`, error);
      }
    }
  },
  
  /**
   * Test date range selector
   * @param {Array} dateRanges - Array of date range values to test
   */
  async testDateRangeSelector(dateRanges) {
    const selector = document.querySelector('select[name="dateRange"]');
    
    if (!selector) {
      this.logResult('Date Range Selector', false, 'Date range selector not found');
      return;
    }
    
    for (const dateRange of dateRanges) {
      const testName = `Date Range Selection: ${dateRange}`;
      
      try {
        // Select the date range
        selector.value = dateRange;
        
        // Dispatch change event
        const event = new Event('change', { bubbles: true });
        selector.dispatchEvent(event);
        
        // Wait for data to reload
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.logResult(testName, true, `Successfully selected date range: ${dateRange}`);
      } catch (error) {
        this.logResult(testName, false, `Error selecting date range: ${dateRange}`, error);
      }
    }
  },
  
  /**
   * Test chart components
   */
  async testChartComponents() {
    // Test Revenue Chart
    await this.testElementExists('.recharts-wrapper', 'Revenue Chart Rendering');
    
    // Test Channel Distribution Chart
    await this.testElementExists('.recharts-pie', 'Channel Distribution Chart Rendering');
    
    // Test chart data
    try {
      const revenueData = await this.fetchData('/api/charts/revenue');
      const distributionData = await this.fetchData('/api/charts/distribution');
      
      this.logResult(
        'Chart Data',
        revenueData && distributionData,
        'Successfully fetched chart data'
      );
    } catch (error) {
      this.logResult('Chart Data', false, 'Failed to fetch chart data', error);
    }
  },
  
  /**
   * Test table components
   */
  async testTableComponents() {
    // Navigate to each tab and test the table
    for (const tab of config.tabs.slice(1)) { // Skip overview tab
      await this.clickTab(tab.selector);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const tableSelector = `.${tab.name.toLowerCase()}-table`;
      await this.testElementExists(tableSelector, `${tab.name} Table Rendering`);
      
      // Test table data
      try {
        const endpoint = `/api/${tab.name.toLowerCase()}`;
        const data = await this.fetchData(endpoint);
        
        this.logResult(
          `${tab.name} Table Data`,
          Array.isArray(data) && data.length > 0,
          `Successfully fetched ${tab.name.toLowerCase()} data`
        );
      } catch (error) {
        this.logResult(`${tab.name} Table Data`, false, `Failed to fetch ${tab.name.toLowerCase()} data`, error);
      }
    }
  },
  
  /**
   * Test error handling
   */
  async testErrorHandling() {
    // Test 404 error
    try {
      await this.fetchData('/api/non-existent-endpoint');
      this.logResult('Error Handling - 404', false, 'Should have thrown an error for non-existent endpoint');
    } catch (error) {
      this.logResult('Error Handling - 404', true, 'Correctly handled non-existent endpoint');
    }
    
    // Test error display in UI
    try {
      // Temporarily break the API URL to force an error
      const originalFetch = window.fetch;
      window.fetch = () => Promise.reject(new Error('Network error'));
      
      // Try to load data
      document.querySelector('button[aria-label="Refresh data"]')?.click();
      
      // Wait for error to display
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if error alert is displayed
      const errorAlert = document.querySelector('.error-alert');
      
      this.logResult(
        'Error Display in UI',
        !!errorAlert,
        errorAlert ? 'Error alert displayed correctly' : 'Error alert not displayed'
      );
      
      // Restore fetch
      window.fetch = originalFetch;
    } catch (error) {
      this.logResult('Error Display in UI', false, 'Failed to test error display', error);
      // Restore fetch in case of error
      window.fetch = window.originalFetch;
    }
  },
  
  /**
   * Test caching mechanism
   */
  async testCaching() {
    // Make two identical requests and check if the second one uses cache
    try {
      // First request
      console.log('Making first request...');
      await this.fetchData('/api/overview');
      
      // Second request (should use cache)
      console.log('Making second request (should use cache)...');
      const cacheStart = performance.now();
      await this.fetchData('/api/overview');
      const cacheTime = performance.now() - cacheStart;
      
      // If the second request is significantly faster, it's likely using cache
      this.logResult(
        'Caching Mechanism',
        cacheTime < 50, // Cached responses should be very fast
        `Second request took ${cacheTime.toFixed(2)}ms`
      );
    } catch (error) {
      this.logResult('Caching Mechanism', false, 'Failed to test caching', error);
    }
  },
  
  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('Starting comprehensive tests...');
    
    // Test API endpoints
    console.log('Testing API endpoints...');
    for (const endpoint of config.endpoints) {
      await this.testEndpoint(endpoint);
    }
    
    // Test date range selector
    console.log('Testing date range selector...');
    await this.testDateRangeSelector(config.dateRanges);
    
    // Test tab navigation
    console.log('Testing tab navigation...');
    await this.testTabNavigation(config.tabs);
    
    // Test chart components
    console.log('Testing chart components...');
    await this.testChartComponents();
    
    // Test table components
    console.log('Testing table components...');
    await this.testTableComponents();
    
    // Test error handling
    console.log('Testing error handling...');
    await this.testErrorHandling();
    
    // Test caching
    console.log('Testing caching mechanism...');
    await this.testCaching();
    
    console.log('All tests completed!');
    console.log(`Passed: ${testResults.passed}, Failed: ${testResults.failed}, Total: ${testResults.total}`);
  }
};

// Initialize and run tests when the page loads
window.addEventListener('DOMContentLoaded', () => {
  // Create test UI
  const testUI = document.createElement('div');
  testUI.id = 'test-ui';
  testUI.innerHTML = `
    <div class="test-controls">
      <h2>Comprehensive Dashboard Tests</h2>
      <button id="run-all-tests">Run All Tests</button>
      <button id="run-api-tests">Test API Endpoints</button>
      <button id="run-ui-tests">Test UI Components</button>
      <button id="export-results">Export Results</button>
    </div>
    <div id="test-results"></div>
  `;
  
  document.body.appendChild(testUI);
  
  // Add event listeners
  document.getElementById('run-all-tests').addEventListener('click', () => {
    TestUtils.runAllTests();
  });
  
  document.getElementById('run-api-tests').addEventListener('click', async () => {
    for (const endpoint of config.endpoints) {
      await TestUtils.testEndpoint(endpoint);
    }
  });
  
  document.getElementById('run-ui-tests').addEventListener('click', async () => {
    await TestUtils.testTabNavigation(config.tabs);
    await TestUtils.testChartComponents();
    await TestUtils.testTableComponents();
  });
  
  document.getElementById('export-results').addEventListener('click', () => {
    const resultsJson = JSON.stringify(testResults, null, 2);
    const blob = new Blob([resultsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-test-results-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  });
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #test-ui {
      position: fixed;
      top: 0;
      right: 0;
      width: 400px;
      max-height: 100vh;
      background: #f8f9fa;
      border-left: 1px solid #dee2e6;
      padding: 1rem;
      overflow-y: auto;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    
    .test-controls {
      margin-bottom: 1rem;
    }
    
    .test-controls button {
      margin-right: 0.5rem;
      margin-bottom: 0.5rem;
      padding: 0.375rem 0.75rem;
      border: 1px solid #ced4da;
      border-radius: 0.25rem;
      background-color: #fff;
      cursor: pointer;
    }
    
    .test-controls button:hover {
      background-color: #f1f3f5;
    }
    
    #test-results {
      margin-top: 1rem;
    }
    
    .results-summary {
      margin-bottom: 1rem;
    }
    
    .stats {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .stat {
      padding: 0.5rem;
      border-radius: 0.25rem;
      background-color: #e9ecef;
      flex: 1;
      min-width: 80px;
    }
    
    .stat .label {
      font-weight: bold;
      display: block;
      font-size: 0.75rem;
      color: #495057;
    }
    
    .stat .value {
      font-size: 1.25rem;
      font-weight: bold;
    }
    
    .value.passed {
      color: #28a745;
    }
    
    .value.failed {
      color: #dc3545;
    }
    
    .value.warning {
      color: #ffc107;
    }
    
    .results-details ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .results-details li {
      padding: 0.5rem;
      border-radius: 0.25rem;
      margin-bottom: 0.5rem;
    }
    
    .results-details li.passed {
      background-color: rgba(40, 167, 69, 0.1);
    }
    
    .results-details li.failed {
      background-color: rgba(220, 53, 69, 0.1);
    }
    
    .results-details .message {
      font-size: 0.875rem;
      color: #6c757d;
    }
    
    .results-details .error {
      margin-top: 0.5rem;
      padding: 0.5rem;
      background-color: rgba(220, 53, 69, 0.1);
      border-radius: 0.25rem;
      font-family: monospace;
      font-size: 0.875rem;
      white-space: pre-wrap;
      color: #dc3545;
    }
  `;
  
  document.head.appendChild(style);
});
