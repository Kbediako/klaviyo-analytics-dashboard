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
      { date: '2025-02-19', campaigns: 4200, flows: 3100, forms: 1800, other: 950 },
      { date: '2025-02-20', campaigns: 4500, flows: 3300, forms: 1900, other: 1000 },
      { date: '2025-02-21', campaigns: 4800, flows: 3500, forms: 2000, other: 1050 },
      { date: '2025-02-22', campaigns: 5100, flows: 3700, forms: 2100, other: 1100 },
      { date: '2025-02-23', campaigns: 5400, flows: 3900, forms: 2200, other: 1150 },
      { date: '2025-02-24', campaigns: 5700, flows: 4100, forms: 2300, other: 1200 },
      { date: '2025-02-25', campaigns: 5800, flows: 4200, forms: 2400, other: 1250 },
      { date: '2025-02-26', campaigns: 5900, flows: 4300, forms: 2500, other: 1300 },
      { date: '2025-02-27', campaigns: 6000, flows: 4400, forms: 2600, other: 1350 },
      { date: '2025-02-28', campaigns: 6100, flows: 4500, forms: 2700, other: 1400 },
      { date: '2025-03-01', campaigns: 6200, flows: 4600, forms: 2800, other: 1450 },
      { date: '2025-03-02', campaigns: 6300, flows: 4700, forms: 2900, other: 1500 },
      { date: '2025-03-03', campaigns: 6400, flows: 4800, forms: 3000, other: 1550 },
      { date: '2025-03-04', campaigns: 6500, flows: 4900, forms: 3100, other: 1600 },
      { date: '2025-03-05', campaigns: 6600, flows: 5000, forms: 3200, other: 1650 },
      { date: '2025-03-06', campaigns: 6700, flows: 5100, forms: 3300, other: 1700 },
      { date: '2025-03-07', campaigns: 6800, flows: 5200, forms: 3400, other: 1750 },
      { date: '2025-03-08', campaigns: 6900, flows: 5300, forms: 3500, other: 1800 },
      { date: '2025-03-09', campaigns: 7000, flows: 5400, forms: 3600, other: 1850 },
      { date: '2025-03-10', campaigns: 7100, flows: 5500, forms: 3700, other: 1900 },
      { date: '2025-03-11', campaigns: 7200, flows: 5600, forms: 3800, other: 1950 },
      { date: '2025-03-12', campaigns: 7300, flows: 5700, forms: 3900, other: 2000 },
      { date: '2025-03-13', campaigns: 7400, flows: 5800, forms: 4000, other: 2050 },
      { date: '2025-03-14', campaigns: 7500, flows: 5900, forms: 4100, other: 2100 },
      { date: '2025-03-15', campaigns: 7600, flows: 6000, forms: 4200, other: 2150 },
      { date: '2025-03-16', campaigns: 7700, flows: 6100, forms: 4300, other: 2200 },
      { date: '2025-03-17', campaigns: 7800, flows: 6200, forms: 4400, other: 2250 },
      { date: '2025-03-18', campaigns: 7900, flows: 6300, forms: 4500, other: 2300 },
      { date: '2025-03-19', campaigns: 8000, flows: 6400, forms: 4600, other: 2350 },
      { date: '2025-03-20', campaigns: 8100, flows: 6500, forms: 4700, other: 2400 }
    ],
    channelDistribution: {
      'last-7-days': [
        { name: 'Campaigns', value: 45 },
        { name: 'Flows', value: 32 },
        { name: 'Forms', value: 15 },
        { name: 'Other', value: 8 }
      ],
      'last-30-days': [
        { name: 'Campaigns', value: 42 },
        { name: 'Flows', value: 35 },
        { name: 'Forms', value: 15 },
        { name: 'Other', value: 8 }
      ],
      'last-90-days': [
        { name: 'Campaigns', value: 40 },
        { name: 'Flows', value: 38 },
        { name: 'Forms', value: 14 },
        { name: 'Other', value: 8 }
      ]
    },
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
