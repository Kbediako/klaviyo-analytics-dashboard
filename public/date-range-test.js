/**
 * End-to-end tests for date range functionality in the Klaviyo Analytics Dashboard
 */

describe('Date Range Functionality Tests', () => {
  beforeAll(() => {
    console.log('Starting date range tests...');
    
    // Load mock date range data
    const mockDateRangesScript = document.createElement('script');
    mockDateRangesScript.src = '/mock-date-ranges.js';
    document.head.appendChild(mockDateRangesScript);
    
    // Wait for script to load
    return new Promise((resolve) => {
      mockDateRangesScript.onload = resolve;
    });
  });

  /**
   * Test standard date range selections
   */
  describe('Standard Date Ranges', () => {
    const standardRanges = ['last-7-days', 'last-30-days', 'last-90-days'];
    
    standardRanges.forEach(range => {
      test(`should handle ${range} selection`, async () => {
        // Track API calls
        const apiCalls = [];
        const originalFetch = window.fetch;
        window.fetch = async (url) => {
          apiCalls.push(url);
          return originalFetch(url);
        };

        // Select date range
        const selector = document.querySelector('[data-testid="date-range-selector"]');
        const select = selector.querySelector('select');
        select.value = range;
        select.dispatchEvent(new Event('change'));

        // Wait for data to load
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verify API calls include correct date range
        expect(apiCalls.some(url => url.includes(`dateRange=${range}`))).toBe(true);

        // Verify data matches expected values for the range
        const mockData = window.mockDateRangeResponses[range];
        const revenueElement = document.querySelector('[data-testid="revenue-value"]');
        expect(revenueElement.textContent).toContain(mockData.overview.revenue.current.toLocaleString());

        // Restore fetch
        window.fetch = originalFetch;
      });
    });
  });

  /**
   * Test custom date range selections
   */
  describe('Custom Date Ranges', () => {
    test('should handle year boundary dates', async () => {
      const customRange = '2023-12-25_to_2024-01-05';
      
      // Select custom date range
      const dateRangePicker = document.querySelector('[data-testid="custom-date-picker"]');
      dateRangePicker.value = customRange;
      dateRangePicker.dispatchEvent(new Event('change'));

      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify data matches expected values
      const mockData = window.mockDateRangeResponses[customRange];
      const revenueElement = document.querySelector('[data-testid="revenue-value"]');
      expect(revenueElement.textContent).toContain(mockData.overview.revenue.current.toLocaleString());
    });

    test('should handle single day selection', async () => {
      const singleDay = '2024-01-01_to_2024-01-01';
      
      // Select single day
      const dateRangePicker = document.querySelector('[data-testid="custom-date-picker"]');
      dateRangePicker.value = singleDay;
      dateRangePicker.dispatchEvent(new Event('change'));

      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify data matches expected values
      const mockData = window.mockDateRangeResponses[singleDay];
      const revenueElement = document.querySelector('[data-testid="revenue-value"]');
      expect(revenueElement.textContent).toContain(mockData.overview.revenue.current.toLocaleString());
    });
  });

  /**
   * Test error handling for invalid date ranges
   */
  describe('Date Range Error Handling', () => {
    test('should handle invalid date format', async () => {
      const invalidRange = 'invalid-date-range';
      
      // Try to set invalid date range
      const dateRangePicker = document.querySelector('[data-testid="custom-date-picker"]');
      dateRangePicker.value = invalidRange;
      dateRangePicker.dispatchEvent(new Event('change'));

      // Wait for error to appear
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify error message is displayed
      const errorAlert = document.querySelector('[data-testid="error-alert"]');
      expect(errorAlert).toBeDefined();
      expect(errorAlert.textContent).toContain('Invalid date range format');
    });

    test('should handle future dates', async () => {
      const futureDate = '2025-01-01_to_2025-01-07';
      
      // Try to set future date range
      const dateRangePicker = document.querySelector('[data-testid="custom-date-picker"]');
      dateRangePicker.value = futureDate;
      dateRangePicker.dispatchEvent(new Event('change'));

      // Wait for error to appear
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify error message is displayed
      const errorAlert = document.querySelector('[data-testid="error-alert"]');
      expect(errorAlert).toBeDefined();
      expect(errorAlert.textContent).toContain('Date range cannot include future dates');
    });
  });

  /**
   * Test data consistency across components
   */
  describe('Data Consistency', () => {
    test('should update all components with new date range', async () => {
      const range = 'last-7-days';
      
      // Select date range
      const selector = document.querySelector('[data-testid="date-range-selector"]');
      const select = selector.querySelector('select');
      select.value = range;
      select.dispatchEvent(new Event('change'));

      // Wait for data to load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify all components updated
      const mockData = window.mockDateRangeResponses[range];
      
      // Check overview metrics
      const revenueElement = document.querySelector('[data-testid="revenue-value"]');
      expect(revenueElement.textContent).toContain(mockData.overview.revenue.current.toLocaleString());
      
      // Check campaign data
      const campaignTable = document.querySelector('[data-testid="campaigns-table"]');
      const campaignRow = campaignTable.querySelector('tbody tr');
      expect(campaignRow.textContent).toContain(mockData.campaigns[0].name);
      
      // Check charts
      const revenueChart = document.querySelector('[data-testid="revenue-chart"]');
      expect(revenueChart).toBeDefined();
      // Add specific chart verification based on your chart library
    });
  });

  /**
   * Test date range persistence
   */
  describe('Date Range Persistence', () => {
    test('should maintain selected date range after page reload', async () => {
      const range = 'last-90-days';
      
      // Select date range
      const selector = document.querySelector('[data-testid="date-range-selector"]');
      const select = selector.querySelector('select');
      select.value = range;
      select.dispatchEvent(new Event('change'));

      // Simulate page reload
      await new Promise(resolve => setTimeout(resolve, 500));
      window.dispatchEvent(new Event('load'));

      // Verify date range persisted
      const persistedSelect = document.querySelector('[data-testid="date-range-selector"] select');
      expect(persistedSelect.value).toBe(range);

      // Verify data matches persisted range
      const mockData = window.mockDateRangeResponses[range];
      const revenueElement = document.querySelector('[data-testid="revenue-value"]');
      expect(revenueElement.textContent).toContain(mockData.overview.revenue.current.toLocaleString());
    });
  });
});
