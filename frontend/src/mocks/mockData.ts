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
  // Chart data for visualizations
  charts: {
    revenueOverTime: [
      { date: '2023-01', campaigns: 4200, flows: 3100, forms: 1800, other: 950 },
      { date: '2023-02', campaigns: 4500, flows: 3300, forms: 1900, other: 1000 },
      { date: '2023-03', campaigns: 4800, flows: 3500, forms: 2000, other: 1050 },
      { date: '2023-04', campaigns: 5100, flows: 3700, forms: 2100, other: 1100 },
      { date: '2023-05', campaigns: 5400, flows: 3900, forms: 2200, other: 1150 },
      { date: '2023-06', campaigns: 5700, flows: 4100, forms: 2300, other: 1200 }
    ],
    channelDistribution: [
      { name: 'Campaigns', value: 42 },
      { name: 'Flows', value: 35 },
      { name: 'Forms', value: 15 },
      { name: 'Other', value: 8 }
    ],
    topSegments: [
      { name: 'VIP Customers', conversionRate: 42, count: 5842, revenue: 28450 },
      { name: 'Recent Purchasers', conversionRate: 35, count: 12480, revenue: 42680 },
      { name: 'Cart Abandoners', conversionRate: 28, count: 8640, revenue: 15280 },
      { name: 'Email Engaged', conversionRate: 22, count: 18540, revenue: 24850 }
    ],
    topFlows: [
      { name: 'Welcome Series', recipients: 8450, conversionRate: 32 },
      { name: 'Abandoned Cart', recipients: 6280, conversionRate: 28 },
      { name: 'Post-Purchase', recipients: 12480, conversionRate: 24 },
      { name: 'Win-Back', recipients: 5840, conversionRate: 18 }
    ],
    topForms: [
      { name: 'Newsletter Signup', views: 12480, submissionRate: 38 },
      { name: 'Exit Intent Popup', views: 28450, submissionRate: 24 },
      { name: 'Product Registration', views: 8640, submissionRate: 42 },
      { name: 'Contact Form', views: 5840, submissionRate: 32 }
    ]
  },
  campaigns: [
    {
      id: 'campaign1',
      name: 'Black Friday Sale',
      sent: 5000,
      openRate: 24.0,
      clickRate: 7.0,
      conversionRate: 3.2,
      revenue: 5600
    },
    {
      id: 'campaign2',
      name: 'Welcome Series',
      sent: 1200,
      openRate: 32.5,
      clickRate: 12.8,
      conversionRate: 5.5,
      revenue: 2800
    },
    {
      id: 'campaign3',
      name: 'Product Launch',
      sent: 3500,
      openRate: 28.0,
      clickRate: 6.0,
      conversionRate: 2.8,
      revenue: 3200
    }
  ],
  flows: [
    {
      id: 'flow1',
      name: 'Welcome Flow',
      recipients: 2500,
      openRate: 35.2,
      clickRate: 18.5,
      conversionRate: 12.8,
      revenue: 4800
    },
    {
      id: 'flow2',
      name: 'Abandoned Cart',
      recipients: 1800,
      openRate: 42.0,
      clickRate: 24.5,
      conversionRate: 11.7,
      revenue: 3600
    }
  ],
  forms: [
    {
      id: 'form1',
      name: 'Newsletter Signup',
      views: 5600,
      submissions: 980,
      submissionRate: 17.5,
      conversions: 245
    },
    {
      id: 'form2',
      name: 'Exit Intent Popup',
      views: 3200,
      submissions: 420,
      submissionRate: 13.1,
      conversions: 105
    }
  ],
  segments: [
    {
      id: 'segment1',
      name: 'Active Customers',
      count: 3500,
      conversionRate: 8.5,
      revenue: 28000
    },
    {
      id: 'segment2',
      name: 'Lapsed Customers',
      count: 1200,
      conversionRate: 2.1,
      revenue: 4500
    }
  ]
};

export default mockData;
