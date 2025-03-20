export default {
  // Overview endpoint
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
    conversionRate: {
      current: 8.2,
      previous: 7.5,
      change: 9.3
    }
  },
  
  // Campaigns endpoint
  campaigns: [
    {
      id: 'camp_1',
      name: 'Summer Sale Announcement',
      recipients: 24850,
      openRate: 42.8,
      clickRate: 18.5,
      conversionRate: 8.2,
      revenue: 12580
    },
    {
      id: 'camp_2',
      name: 'New Product Launch',
      recipients: 18650,
      openRate: 38.2,
      clickRate: 15.8,
      conversionRate: 6.5,
      revenue: 8450
    },
    {
      id: 'camp_3',
      name: 'Customer Feedback Survey',
      recipients: 12480,
      openRate: 32.5,
      clickRate: 12.2,
      conversionRate: 4.8,
      revenue: 0
    }
  ],
  
  // Flows endpoint
  flows: [
    {
      id: 'flow_1',
      name: 'Welcome Series',
      recipients: 8450,
      openRate: 68.5,
      clickRate: 42.8,
      conversionRate: 32,
      revenue: 24850
    },
    {
      id: 'flow_2',
      name: 'Abandoned Cart',
      recipients: 5280,
      openRate: 58.2,
      clickRate: 38.5,
      conversionRate: 28.5,
      revenue: 18650
    },
    {
      id: 'flow_3',
      name: 'Post-Purchase',
      recipients: 4250,
      openRate: 52.8,
      clickRate: 32.5,
      conversionRate: 18.2,
      revenue: 12480
    }
  ],
  
  // Forms endpoint
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
  
  // Segments endpoint
  segments: [
    {
      id: 'seg_1',
      name: 'VIP Customers',
      members: 5842,
      openRate: 42,
      revenue: 28450
    },
    {
      id: 'seg_2',
      name: 'Frequent Shoppers',
      members: 8450,
      openRate: 38,
      revenue: 24850
    },
    {
      id: 'seg_3',
      name: 'New Subscribers',
      members: 12480,
      openRate: 28,
      revenue: 18650
    }
  ],

  // Chart endpoints
  'charts/revenue': [
    {
      date: '2024-03-01',
      campaigns: 12580,
      flows: 24850,
      forms: 8450,
      other: 4250
    },
    {
      date: '2024-03-02',
      campaigns: 15680,
      flows: 22450,
      forms: 9250,
      other: 3850
    },
    {
      date: '2024-03-03',
      campaigns: 18450,
      flows: 26850,
      forms: 7850,
      other: 4650
    },
    {
      date: '2024-03-04',
      campaigns: 14580,
      flows: 23450,
      forms: 8950,
      other: 4150
    },
    {
      date: '2024-03-05',
      campaigns: 16780,
      flows: 25650,
      forms: 8250,
      other: 4450
    }
  ],

  'charts/distribution': [
    {
      name: 'Campaigns',
      value: 35,
      color: 'blue'
    },
    {
      name: 'Flows',
      value: 45,
      color: 'violet'
    },
    {
      name: 'Forms',
      value: 15,
      color: 'amber'
    },
    {
      name: 'Other',
      value: 5,
      color: 'emerald'
    }
  ],

  'charts/top-segments': [
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
  ],

  'charts/top-flows': [
    {
      id: 1,
      name: 'Welcome Series',
      recipients: 8450,
      conversionRate: 32
    },
    {
      id: 2,
      name: 'Abandoned Cart',
      recipients: 5280,
      conversionRate: 28.5
    },
    {
      id: 3,
      name: 'Post-Purchase',
      recipients: 4250,
      conversionRate: 18.2
    }
  ],

  'charts/top-forms': [
    {
      id: 1,
      name: 'Newsletter Signup',
      views: 12480,
      submissionRate: 38
    },
    {
      id: 2,
      name: 'Exit Intent Popup',
      views: 8450,
      submissionRate: 30
    },
    {
      id: 3,
      name: 'Product Registration',
      views: 5280,
      submissionRate: 25
    }
  ]
};
