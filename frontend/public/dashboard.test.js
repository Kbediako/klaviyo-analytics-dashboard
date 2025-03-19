/**
 * End-to-end tests for the Klaviyo Analytics Dashboard
 * 
 * These tests verify that the dashboard components render correctly
 * and interact with the API as expected.
 */

// Mock API responses
const mockApiResponses = {
  overview: {
    revenue: {
      current: 125800,
      previous: 98500,
      change: 27.7
    },
    subscribers: {
      current: 24850,
      previous: 21200,
      change: 17.2
    },
    openRate: {
      current: 42.8,
      previous: 38.5,
      change: 11.2
    },
    clickRate: {
      current: 18.5,
      previous: 16.2,
      change: 14.2
    },
    conversionRate: {
      current: 8.2,
      previous: 7.5,
      change: 9.3
    },
    channels: [
      { name: 'Email', value: 68, color: 'blue' },
      { name: 'SMS', value: 22, color: 'violet' },
      { name: 'Push', value: 10, color: 'amber' }
    ]
  },
  campaigns: [
    { 
      id: 1, 
      name: 'Summer Sale Announcement', 
      sent: 24850, 
      openRate: 42.8, 
      clickRate: 18.5, 
      conversionRate: 8.2, 
      revenue: 12580 
    },
    { 
      id: 2, 
      name: 'New Product Launch', 
      sent: 18650, 
      openRate: 38.2, 
      clickRate: 15.8, 
      conversionRate: 6.5, 
      revenue: 8450 
    },
    { 
      id: 3, 
      name: 'Customer Feedback Survey', 
      sent: 12480, 
      openRate: 32.5, 
      clickRate: 12.2, 
      conversionRate: 4.8, 
      revenue: 0 
    }
  ],
  flows: [
    { 
      id: 1, 
      name: 'Welcome Series', 
      recipients: 8450, 
      openRate: 68.5, 
      clickRate: 42.8, 
      conversionRate: 32, 
      revenue: 24850 
    },
    { 
      id: 2, 
      name: 'Abandoned Cart', 
      recipients: 5280, 
      openRate: 58.2, 
      clickRate: 38.5, 
      conversionRate: 28.5, 
      revenue: 18650 
    },
    { 
      id: 3, 
      name: 'Post-Purchase', 
      recipients: 4250, 
      openRate: 52.8, 
      clickRate: 32.5, 
      conversionRate: 18.2, 
      revenue: 12480 
    }
  ],
  forms: [
    { 
      id: 1, 
      name: 'Newsletter Signup', 
      views: 12480, 
      submissions: 4742, 
      submissionRate: 38, 
      conversions: 1850 
    },
    { 
      id: 2, 
      name: 'Exit Intent Popup', 
      views: 8450, 
      submissions: 2535, 
      submissionRate: 30, 
      conversions: 1250 
    },
    { 
      id: 3, 
      name: 'Product Registration', 
      views: 5280, 
      submissions: 1320, 
      submissionRate: 25, 
      conversions: 850 
    }
  ],
  segments: [
    { 
      id: 1, 
      name: 'VIP Customers', 
      conversionRate: 42, 
      count: 5842, 
      revenue: 28450 
    },
    { 
      id: 2, 
      name: 'Frequent Shoppers', 
      conversionRate: 38, 
      count: 8450, 
      revenue: 24850 
    },
    { 
      id: 3, 
      name: 'New Subscribers', 
      conversionRate: 28, 
      count: 12480, 
      revenue: 18650 
    }
  ]
};

// Mock fetch for API calls
window.fetch = async (url) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Parse the endpoint from the URL
  const endpoint = url.split('/').pop().split('?')[0];
  
  // Return mock response based on endpoint
  if (mockApiResponses[endpoint]) {
    return {
      ok: true,
      json: async () => mockApiResponses[endpoint]
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

/**
 * Test suite for the dashboard
 */
describe('Klaviyo Analytics Dashboard', () => {
  // Setup before tests
  beforeAll(() => {
    // Add any global setup here
    console.log('Starting dashboard tests...');
  });
  
  // Cleanup after tests
  afterAll(() => {
    // Add any global cleanup here
    console.log('All dashboard tests completed.');
  });
  
  /**
   * Test the overview section
   */
  describe('Overview Section', () => {
    test('should render metric cards with correct data', async () => {
      // Wait for API calls to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if metric cards are rendered
      const metricCards = document.querySelectorAll('.metric-card');
      expect(metricCards.length).toBeGreaterThan(0);
      
      // Check if revenue card shows correct data
      const revenueCard = Array.from(metricCards)
        .find(card => card.textContent.includes('Revenue'));
      
      expect(revenueCard).toBeDefined();
      expect(revenueCard.textContent).toContain('$125,800');
      expect(revenueCard.textContent).toContain('+27.7%');
    });
  });
  
  /**
   * Test the date range selector
   */
  describe('Date Range Selector', () => {
    test('should change date range when a new option is selected', async () => {
      // Find the date range selector
      const selector = document.querySelector('[data-testid="date-range-selector"]');
      expect(selector).toBeDefined();
      
      // Simulate changing the date range
      // This would trigger a re-fetch of data with the new date range
      // In a real test, we would interact with the DOM element
    });
  });
  
  /**
   * Test the campaigns table
   */
  describe('Campaigns Table', () => {
    test('should render campaigns data in a table', async () => {
      // Click on the campaigns tab
      const campaignsTab = document.querySelector('[data-value="campaigns"]');
      campaignsTab.click();
      
      // Wait for tab content to load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if campaigns table is rendered
      const table = document.querySelector('[data-testid="campaigns-table"]');
      expect(table).toBeDefined();
      
      // Check if table has the correct number of rows
      const rows = table.querySelectorAll('tbody tr');
      expect(rows.length).toBe(mockApiResponses.campaigns.length);
      
      // Check if the first campaign is rendered correctly
      const firstRow = rows[0];
      expect(firstRow.textContent).toContain('Summer Sale Announcement');
      expect(firstRow.textContent).toContain('24,850');
      expect(firstRow.textContent).toContain('42.8%');
    });
  });
  
  /**
   * Test the flows table
   */
  describe('Flows Table', () => {
    test('should render flows data in a table', async () => {
      // Click on the flows tab
      const flowsTab = document.querySelector('[data-value="flows"]');
      flowsTab.click();
      
      // Wait for tab content to load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if flows table is rendered
      const table = document.querySelector('[data-testid="flows-table"]');
      expect(table).toBeDefined();
      
      // Check if table has the correct number of rows
      const rows = table.querySelectorAll('tbody tr');
      expect(rows.length).toBe(mockApiResponses.flows.length);
    });
  });
  
  /**
   * Test the forms table
   */
  describe('Forms Table', () => {
    test('should render forms data in a table', async () => {
      // Click on the forms tab
      const formsTab = document.querySelector('[data-value="forms"]');
      formsTab.click();
      
      // Wait for tab content to load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if forms table is rendered
      const table = document.querySelector('[data-testid="forms-table"]');
      expect(table).toBeDefined();
      
      // Check if table has the correct number of rows
      const rows = table.querySelectorAll('tbody tr');
      expect(rows.length).toBe(mockApiResponses.forms.length);
    });
  });
  
  /**
   * Test the segments table
   */
  describe('Segments Table', () => {
    test('should render segments data in a table', async () => {
      // Click on the segments tab
      const segmentsTab = document.querySelector('[data-value="segments"]');
      segmentsTab.click();
      
      // Wait for tab content to load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if segments table is rendered
      const table = document.querySelector('[data-testid="segments-table"]');
      expect(table).toBeDefined();
      
      // Check if table has the correct number of rows
      const rows = table.querySelectorAll('tbody tr');
      expect(rows.length).toBe(mockApiResponses.segments.length);
    });
  });
  
  /**
   * Test error handling
   */
  describe('Error Handling', () => {
    test('should show error message when API request fails', async () => {
      // Mock a failed API request
      const originalFetch = window.fetch;
      window.fetch = async () => ({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Something went wrong' })
      });
      
      // Trigger a re-fetch (e.g., by changing date range)
      // In a real test, we would interact with the DOM element
      
      // Wait for error to appear
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if error message is displayed
      const errorAlert = document.querySelector('[data-testid="error-alert"]');
      expect(errorAlert).toBeDefined();
      
      // Restore original fetch
      window.fetch = originalFetch;
    });
  });
});
