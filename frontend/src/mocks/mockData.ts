/**
 * Mock data for testing without live API calls
 */
export const mockData = {
  overview: {
    revenue: {
      current: 12500,
      change: 15
    },
    subscribers: {
      current: 1250,
      change: 8
    },
    conversionRate: {
      current: 3.2,
      change: -1.5
    },
    formSubmissions: {
      current: 450,
      change: 12
    }
  },
  campaigns: [
    {
      id: 'campaign1',
      name: 'Black Friday Sale',
      status: 'sent',
      metrics: {
        opens: 1200,
        clicks: 350,
        revenue: 5600,
        unsubscribes: 15
      }
    },
    {
      id: 'campaign2',
      name: 'Welcome Series',
      status: 'draft',
      metrics: {
        opens: 0,
        clicks: 0,
        revenue: 0,
        unsubscribes: 0
      }
    },
    {
      id: 'campaign3',
      name: 'Product Launch',
      status: 'sent',
      metrics: {
        opens: 980,
        clicks: 210,
        revenue: 3200,
        unsubscribes: 8
      }
    }
  ],
  flows: [
    {
      id: 'flow1',
      name: 'Welcome Flow',
      status: 'active',
      metrics: {
        recipients: 2500,
        conversions: 320,
        revenue: 4800
      }
    },
    {
      id: 'flow2',
      name: 'Abandoned Cart',
      status: 'active',
      metrics: {
        recipients: 1800,
        conversions: 210,
        revenue: 3600
      }
    }
  ],
  forms: [
    {
      id: 'form1',
      name: 'Newsletter Signup',
      metrics: {
        views: 5600,
        submissions: 980,
        conversionRate: 17.5
      }
    },
    {
      id: 'form2',
      name: 'Exit Intent Popup',
      metrics: {
        views: 3200,
        submissions: 420,
        conversionRate: 13.1
      }
    }
  ],
  segments: [
    {
      id: 'segment1',
      name: 'Active Customers',
      memberCount: 3500,
      metrics: {
        revenue: 28000,
        averageOrderValue: 80
      }
    },
    {
      id: 'segment2',
      name: 'Lapsed Customers',
      memberCount: 1200,
      metrics: {
        revenue: 0,
        averageOrderValue: 0
      }
    }
  ]
};

export default mockData;
