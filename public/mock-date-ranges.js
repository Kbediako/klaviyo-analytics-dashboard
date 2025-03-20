/**
 * Mock data for different date ranges to test the Klaviyo Analytics Dashboard
 */

window.mockDateRangeResponses = {
  // Last 7 days data
  'last-7-days': {
    overview: {
      revenue: {
        current: 28500,
        previous: 25800,
        change: 10.5
      },
      subscribers: {
        current: 5200,
        previous: 4800,
        change: 8.3
      },
      openRate: {
        current: 45.2,
        previous: 42.8,
        change: 5.6
      },
      conversionRate: {
        current: 8.8,
        previous: 8.2,
        change: 7.3
      }
    },
    campaigns: [
      {
        id: 'camp_1',
        name: 'Flash Sale',
        recipients: 5200,
        openRate: 45.2,
        clickRate: 20.5,
        conversionRate: 8.8,
        revenue: 28500
      }
    ]
  },

  // Last 30 days data (default)
  'last-30-days': window.mockApiResponses,

  // Last 90 days data
  'last-90-days': {
    overview: {
      revenue: {
        current: 385000,
        previous: 325000,
        change: 18.5
      },
      subscribers: {
        current: 75000,
        previous: 62000,
        change: 21.0
      },
      openRate: {
        current: 40.5,
        previous: 38.2,
        change: 6.0
      },
      conversionRate: {
        current: 7.8,
        previous: 7.2,
        change: 8.3
      }
    },
    campaigns: [
      {
        id: 'camp_1',
        name: 'Q3 Promotion',
        recipients: 75000,
        openRate: 40.5,
        clickRate: 16.8,
        conversionRate: 7.8,
        revenue: 385000
      }
    ]
  },

  // Custom date range (2023-12-25 to 2024-01-05) - Testing year boundary
  '2023-12-25_to_2024-01-05': {
    overview: {
      revenue: {
        current: 42000,
        previous: 38000,
        change: 10.5
      },
      subscribers: {
        current: 8500,
        previous: 7800,
        change: 9.0
      },
      openRate: {
        current: 44.5,
        previous: 41.2,
        change: 8.0
      },
      conversionRate: {
        current: 9.2,
        previous: 8.5,
        change: 8.2
      }
    },
    campaigns: [
      {
        id: 'camp_1',
        name: 'New Year Sale',
        recipients: 8500,
        openRate: 44.5,
        clickRate: 19.8,
        conversionRate: 9.2,
        revenue: 42000
      }
    ]
  },

  // Single day selection (2024-01-01)
  '2024-01-01_to_2024-01-01': {
    overview: {
      revenue: {
        current: 5200,
        previous: 4800,
        change: 8.3
      },
      subscribers: {
        current: 1200,
        previous: 1100,
        change: 9.1
      },
      openRate: {
        current: 46.5,
        previous: 43.2,
        change: 7.6
      },
      conversionRate: {
        current: 9.8,
        previous: 9.0,
        change: 8.9
      }
    },
    campaigns: [
      {
        id: 'camp_1',
        name: 'New Year Day Special',
        recipients: 1200,
        openRate: 46.5,
        clickRate: 21.2,
        conversionRate: 9.8,
        revenue: 5200
      }
    ]
  }
};

// Extend the original mock fetch to handle date ranges
const originalMockFetch = window.fetch;
window.fetch = async (url) => {
  // Parse date range from URL if present
  const dateRangeMatch = url.match(/dateRange=([^&]+)/);
  const dateRange = dateRangeMatch ? dateRangeMatch[1] : 'last-30-days';
  
  // Get the endpoint
  const endpoint = url.split('/').pop().split('?')[0];
  
  // Get the appropriate mock data for the date range
  const mockData = window.mockDateRangeResponses[dateRange] || window.mockDateRangeResponses['last-30-days'];
  
  if (mockData && mockData[endpoint]) {
    return {
      ok: true,
      json: async () => mockData[endpoint]
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
