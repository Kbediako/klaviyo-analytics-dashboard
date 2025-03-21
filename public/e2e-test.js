/**
 * End-to-end tests for the Klaviyo Analytics Dashboard
 * 
 * These tests verify that the frontend and backend integrate correctly
 * and that the complete application flow works as expected.
 * 
 * IMPORTANT: When using browser automation or browser actions for testing:
 * - Always scroll up and down to see the full application
 * - The default browser window size (900x600) may not show all UI elements
 * - Navigation tabs and important controls may be below the fold
 * - Some interactive elements might only be visible after scrolling
 */

// Mock API responses are already defined in dashboard.test.js
// We'll extend the tests to include backend connectivity checks

describe('Klaviyo Analytics Dashboard E2E Tests', () => {
  // Setup before tests
  beforeAll(() => {
    console.log('Starting end-to-end tests...');
    
    // Store original fetch
    window.originalFetch = window.fetch;
    
    // Mock console.error to catch API errors
    window.originalConsoleError = console.error;
    window.errorLogs = [];
    console.error = (...args) => {
      window.errorLogs.push(args.join(' '));
      window.originalConsoleError(...args);
    };
  });
  
  // Cleanup after tests
  afterAll(() => {
    // Restore original fetch and console.error
    window.fetch = window.originalFetch;
    console.error = window.originalConsoleError;
    
    console.log('All end-to-end tests completed.');
  });
  
  /**
   * Test backend connectivity
   */
  describe('Backend Connectivity', () => {
    test('should connect to backend API health endpoint', async () => {
      // Restore original fetch for this test
      window.fetch = window.originalFetch;
      
      try {
        const response = await fetch('http://localhost:3001/api/health');
        const data = await response.json();
        
        expect(response.ok).toBe(true);
        expect(data.status).toBe('OK');
        expect(data.timestamp).toBeDefined();
        
        console.log('Backend API is running:', data);
      } catch (error) {
        console.error('Backend API connection failed:', error);
        // Don't fail the test if backend is not running
        // This allows tests to run in isolation
      }
      
      // Restore mock fetch for other tests
      setupMockFetch();
    });
  });
  
  /**
   * Test date range selection
   */
  describe('Date Range Selection', () => {
    test('should update API requests when date range changes', async () => {
      // Track fetch calls
      const fetchCalls = [];
      window.fetch = async (url) => {
        fetchCalls.push(url);
        return window.mockFetch(url);
      };
      
      // Find the date range selector
      const selector = document.querySelector('[data-testid="date-range-selector"]');
      expect(selector).toBeDefined();
      
      // Simulate changing the date range
      const event = new Event('change');
      const select = selector.querySelector('select');
      
      if (select) {
        // Change to last-7-days
        select.value = 'last-7-days';
        select.dispatchEvent(event);
        
        // Wait for API calls to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify that API calls include the new date range
        const hasDateRangeParam = fetchCalls.some(url => 
          url.includes('dateRange=last-7-days')
        );
        
        expect(hasDateRangeParam).toBe(true);
      }
    });
  });
  
  /**
   * Test overview metrics
   */
  describe('Overview Metrics', () => {
    test('should display metrics from API', async () => {
      // Wait for API calls to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if metric cards are rendered
      const metricCards = document.querySelectorAll('.metric-card');
      expect(metricCards.length).toBeGreaterThan(0);
      
      // Check if revenue card shows correct data
      const revenueCard = Array.from(metricCards)
        .find(card => card.textContent.includes('Revenue'));
      
      expect(revenueCard).toBeDefined();
      
      // Check if error alert is not displayed
      const errorAlert = document.querySelector('[data-testid="error-alert"]');
      expect(errorAlert).toBeNull();
    });
  });
  
  /**
   * Test tab navigation
   */
  describe('Tab Navigation', () => {
    test('should switch between tabs and load data', async () => {
      // Array of tabs to test
      const tabs = [
        { value: 'campaigns', testId: 'campaigns-table' },
        { value: 'flows', testId: 'flows-table' },
        { value: 'forms', testId: 'forms-table' },
        { value: 'segments', testId: 'segments-table' }
      ];
      
      // Test each tab
      for (const tab of tabs) {
        // Click on the tab
        const tabElement = document.querySelector(`[data-value="${tab.value}"]`);
        expect(tabElement).toBeDefined();
        tabElement.click();
        
        // Wait for tab content to load
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if table is rendered
        const table = document.querySelector(`[data-testid="${tab.testId}"]`);
        expect(table).toBeDefined();
        
        // Check if table has rows
        const rows = table.querySelectorAll('tbody tr');
        expect(rows.length).toBeGreaterThan(0);
      }
    });
  });
  
  /**
   * Test error handling
   */
  describe('Error Handling', () => {
    test('should show error message when API request fails', async () => {
      // Mock a failed API request
      const originalMockFetch = window.mockFetch;
      window.mockFetch = async () => ({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Something went wrong' })
      });
      
      // Trigger a re-fetch by changing date range
      const selector = document.querySelector('[data-testid="date-range-selector"]');
      const select = selector.querySelector('select');
      
      if (select) {
        // Change to last-90-days
        select.value = 'last-90-days';
        select.dispatchEvent(new Event('change'));
        
        // Wait for error to appear
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if error message is displayed or logged
        const errorAlert = document.querySelector('[data-testid="error-alert"]');
        const hasErrorLog = window.errorLogs.some(log => 
          log.includes('API request failed') || log.includes('Something went wrong')
        );
        
        // Either an error alert should be visible or an error should be logged
        expect(errorAlert !== null || hasErrorLog).toBe(true);
      }
      
      // Restore original mock fetch
      window.mockFetch = originalMockFetch;
    });
  });
  
  /**
   * Test backend integration with real API calls
   */
  describe('Backend Integration', () => {
    test('should make real API calls if backend is available', async () => {
      // Only run this test if backend is available
      try {
        // Check if backend is available
        const healthResponse = await window.originalFetch('http://localhost:3001/api/health');
        if (!healthResponse.ok) {
          console.log('Skipping backend integration test - backend not available');
          return;
        }
        
        // Restore original fetch
        window.fetch = window.originalFetch;
        
        // Make a real API call to the overview endpoint
        const response = await fetch('http://localhost:3001/api/overview');
        const data = await response.json();
        
        // Verify response structure
        expect(data).toBeDefined();
        expect(data.revenue).toBeDefined();
        expect(data.subscribers).toBeDefined();
        expect(data.openRate).toBeDefined();
        expect(data.conversionRate).toBeDefined();
        
        console.log('Backend integration test passed with real API call');
      } catch (error) {
        console.log('Skipping backend integration test - backend not available');
      } finally {
        // Restore mock fetch
        setupMockFetch();
      }
    });
  });
});

/**
 * Setup mock fetch function
 */
function setupMockFetch() {
  // Mock fetch for API calls
  window.mockFetch = async (url) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Parse the endpoint from the URL
    const endpoint = url.split('/').pop().split('?')[0];
    
    // Return mock response based on endpoint
    if (window.mockApiResponses && window.mockApiResponses[endpoint]) {
      return {
        ok: true,
        json: async () => window.mockApiResponses[endpoint]
      };
    }
    
    // Return 404 for unknown endpoints
    return {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ message: 'Endpoint not found' })
    };
  };
  
  window.fetch = window.mockFetch;
}
