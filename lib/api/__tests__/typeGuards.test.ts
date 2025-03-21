/**
 * Tests for API type guards
 */

import {
  isObject,
  isArray,
  isString,
  isNumber,
  isBoolean,
  isCampaign,
  isCampaignArray,
  isFlow,
  isFlowArray,
  isForm,
  isFormArray,
  isSegment,
  isSegmentArray,
  isRevenueDataPoint,
  isRevenueDataPointArray,
  isChannelDataPoint,
  isChannelDataPointArray,
  isTopSegmentData,
  isTopSegmentDataArray,
  isTopFlowData,
  isTopFlowDataArray,
  isTopFormData,
  isTopFormDataArray,
  isOverviewMetrics,
  isKlaviyoApiResponse,
  applyTypeGuard
} from '../typeGuards';

import {
  Campaign,
  Flow,
  Form,
  Segment,
  OverviewMetrics,
  RevenueDataPoint,
  ChannelDataPoint,
  TopSegmentData,
  TopFlowData,
  TopFormData
} from '../types';

describe('Basic type guards', () => {
  test('isObject correctly identifies objects', () => {
    expect(isObject({})).toBe(true);
    expect(isObject({ a: 1 })).toBe(true);
    expect(isObject(null)).toBe(false);
    expect(isObject(undefined)).toBe(false);
    expect(isObject(42)).toBe(false);
    expect(isObject('string')).toBe(false);
    expect(isObject(true)).toBe(false);
    expect(isObject([])).toBe(true); // Arrays are objects in JavaScript
  });

  test('isArray correctly identifies arrays', () => {
    expect(isArray([])).toBe(true);
    expect(isArray([1, 2, 3])).toBe(true);
    expect(isArray({})).toBe(false);
    expect(isArray(null)).toBe(false);
    expect(isArray(undefined)).toBe(false);
    expect(isArray(42)).toBe(false);
    expect(isArray('string')).toBe(false);
    expect(isArray(true)).toBe(false);
  });

  test('isString correctly identifies strings', () => {
    expect(isString('')).toBe(true);
    expect(isString('hello')).toBe(true);
    expect(isString({})).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isString(undefined)).toBe(false);
    expect(isString(42)).toBe(false);
    expect(isString([])).toBe(false);
    expect(isString(true)).toBe(false);
  });

  test('isNumber correctly identifies numbers', () => {
    expect(isNumber(0)).toBe(true);
    expect(isNumber(42)).toBe(true);
    expect(isNumber(-1.5)).toBe(true);
    expect(isNumber(NaN)).toBe(false);
    expect(isNumber({})).toBe(false);
    expect(isNumber(null)).toBe(false);
    expect(isNumber(undefined)).toBe(false);
    expect(isNumber('42')).toBe(false);
    expect(isNumber([])).toBe(false);
    expect(isNumber(true)).toBe(false);
  });

  test('isBoolean correctly identifies booleans', () => {
    expect(isBoolean(true)).toBe(true);
    expect(isBoolean(false)).toBe(true);
    expect(isBoolean({})).toBe(false);
    expect(isBoolean(null)).toBe(false);
    expect(isBoolean(undefined)).toBe(false);
    expect(isBoolean(42)).toBe(false);
    expect(isBoolean('true')).toBe(false);
    expect(isBoolean([])).toBe(false);
  });
});

describe('Campaign type guards', () => {
  const validCampaign: Campaign = {
    id: 1,
    name: 'Test Campaign',
    sent: 100,
    openRate: 0.5,
    clickRate: 0.3,
    conversionRate: 0.1,
    revenue: 1000
  };

  const invalidCampaign = {
    id: 'not-a-number',
    name: 'Invalid Campaign',
    sent: 100,
    openRate: 0.5,
    clickRate: 0.3,
    conversionRate: 0.1,
    revenue: 1000
  };

  test('isCampaign correctly identifies Campaign objects', () => {
    expect(isCampaign(validCampaign)).toBe(true);
    expect(isCampaign(invalidCampaign)).toBe(false);
    expect(isCampaign({})).toBe(false);
    expect(isCampaign(null)).toBe(false);
    expect(isCampaign(undefined)).toBe(false);
  });

  test('isCampaignArray correctly identifies Campaign arrays', () => {
    expect(isCampaignArray([validCampaign])).toBe(true);
    expect(isCampaignArray([validCampaign, validCampaign])).toBe(true);
    expect(isCampaignArray([invalidCampaign])).toBe(false);
    expect(isCampaignArray([validCampaign, invalidCampaign])).toBe(false);
    expect(isCampaignArray([])).toBe(true);
    expect(isCampaignArray({})).toBe(false);
    expect(isCampaignArray(null)).toBe(false);
    expect(isCampaignArray(undefined)).toBe(false);
  });
});

describe('Flow type guards', () => {
  const validFlow: Flow = {
    id: 1,
    name: 'Test Flow',
    recipients: 100,
    openRate: 0.5,
    clickRate: 0.3,
    conversionRate: 0.1,
    revenue: 1000
  };

  const invalidFlow = {
    id: 1,
    name: 'Invalid Flow',
    recipients: '100', // Should be a number
    openRate: 0.5,
    clickRate: 0.3,
    conversionRate: 0.1,
    revenue: 1000
  };

  test('isFlow correctly identifies Flow objects', () => {
    expect(isFlow(validFlow)).toBe(true);
    expect(isFlow(invalidFlow)).toBe(false);
    expect(isFlow({})).toBe(false);
    expect(isFlow(null)).toBe(false);
    expect(isFlow(undefined)).toBe(false);
  });

  test('isFlowArray correctly identifies Flow arrays', () => {
    expect(isFlowArray([validFlow])).toBe(true);
    expect(isFlowArray([validFlow, validFlow])).toBe(true);
    expect(isFlowArray([invalidFlow])).toBe(false);
    expect(isFlowArray([validFlow, invalidFlow])).toBe(false);
    expect(isFlowArray([])).toBe(true);
    expect(isFlowArray({})).toBe(false);
    expect(isFlowArray(null)).toBe(false);
    expect(isFlowArray(undefined)).toBe(false);
  });
});

describe('Form type guards', () => {
  const validForm: Form = {
    id: 1,
    name: 'Test Form',
    views: 100,
    submissions: 50,
    submissionRate: 0.5,
    conversions: 25
  };

  const invalidForm = {
    id: 1,
    name: 'Invalid Form',
    views: 100,
    submissions: 50,
    submissionRate: '50%', // Should be a number
    conversions: 25
  };

  test('isForm correctly identifies Form objects', () => {
    expect(isForm(validForm)).toBe(true);
    expect(isForm(invalidForm)).toBe(false);
    expect(isForm({})).toBe(false);
    expect(isForm(null)).toBe(false);
    expect(isForm(undefined)).toBe(false);
  });

  test('isFormArray correctly identifies Form arrays', () => {
    expect(isFormArray([validForm])).toBe(true);
    expect(isFormArray([validForm, validForm])).toBe(true);
    expect(isFormArray([invalidForm])).toBe(false);
    expect(isFormArray([validForm, invalidForm])).toBe(false);
    expect(isFormArray([])).toBe(true);
    expect(isFormArray({})).toBe(false);
    expect(isFormArray(null)).toBe(false);
    expect(isFormArray(undefined)).toBe(false);
  });
});

describe('Segment type guards', () => {
  const validSegment: Segment = {
    id: 1,
    name: 'Test Segment',
    count: 100,
    conversionRate: 0.5,
    revenue: 1000
  };

  const invalidSegment = {
    id: 1,
    name: 'Invalid Segment',
    count: 100,
    conversionRate: 0.5,
    // Missing revenue
  };

  test('isSegment correctly identifies Segment objects', () => {
    expect(isSegment(validSegment)).toBe(true);
    expect(isSegment(invalidSegment)).toBe(false);
    expect(isSegment({})).toBe(false);
    expect(isSegment(null)).toBe(false);
    expect(isSegment(undefined)).toBe(false);
  });

  test('isSegmentArray correctly identifies Segment arrays', () => {
    expect(isSegmentArray([validSegment])).toBe(true);
    expect(isSegmentArray([validSegment, validSegment])).toBe(true);
    expect(isSegmentArray([invalidSegment])).toBe(false);
    expect(isSegmentArray([validSegment, invalidSegment])).toBe(false);
    expect(isSegmentArray([])).toBe(true);
    expect(isSegmentArray({})).toBe(false);
    expect(isSegmentArray(null)).toBe(false);
    expect(isSegmentArray(undefined)).toBe(false);
  });
});

describe('Data point type guards', () => {
  const validRevenueDataPoint: RevenueDataPoint = {
    date: '2023-01-01',
    campaigns: 500,
    flows: 300,
    forms: 100,
    other: 100
  };

  const validChannelDataPoint: ChannelDataPoint = {
    name: 'Email',
    value: 75,
    color: '#ff0000'
  };

  test('isRevenueDataPoint correctly identifies RevenueDataPoint objects', () => {
    expect(isRevenueDataPoint(validRevenueDataPoint)).toBe(true);
    expect(isRevenueDataPoint({ ...validRevenueDataPoint, date: 123 })).toBe(false);
    expect(isRevenueDataPoint({})).toBe(false);
    expect(isRevenueDataPoint(null)).toBe(false);
    expect(isRevenueDataPoint(undefined)).toBe(false);
  });

  test('isChannelDataPoint correctly identifies ChannelDataPoint objects', () => {
    expect(isChannelDataPoint(validChannelDataPoint)).toBe(true);
    expect(isChannelDataPoint({ ...validChannelDataPoint, color: 123 })).toBe(false);
    expect(isChannelDataPoint({})).toBe(false);
    expect(isChannelDataPoint(null)).toBe(false);
    expect(isChannelDataPoint(undefined)).toBe(false);
  });
});

describe('Top data type guards', () => {
  const validTopSegmentData: TopSegmentData = {
    id: 1,
    name: 'Top Segment',
    conversionRate: 0.5,
    count: 100,
    revenue: 1000
  };

  const validTopFlowData: TopFlowData = {
    id: 1,
    name: 'Top Flow',
    recipients: 100,
    conversionRate: 0.5
  };

  const validTopFormData: TopFormData = {
    id: 1,
    name: 'Top Form',
    views: 100,
    submissionRate: 0.5
  };

  test('isTopSegmentData correctly identifies TopSegmentData objects', () => {
    expect(isTopSegmentData(validTopSegmentData)).toBe(true);
    expect(isTopSegmentData({ ...validTopSegmentData, revenue: '1000' })).toBe(false);
    expect(isTopSegmentData({})).toBe(false);
    expect(isTopSegmentData(null)).toBe(false);
    expect(isTopSegmentData(undefined)).toBe(false);
  });

  test('isTopFlowData correctly identifies TopFlowData objects', () => {
    expect(isTopFlowData(validTopFlowData)).toBe(true);
    expect(isTopFlowData({ ...validTopFlowData, recipients: '100' })).toBe(false);
    expect(isTopFlowData({})).toBe(false);
    expect(isTopFlowData(null)).toBe(false);
    expect(isTopFlowData(undefined)).toBe(false);
  });

  test('isTopFormData correctly identifies TopFormData objects', () => {
    expect(isTopFormData(validTopFormData)).toBe(true);
    expect(isTopFormData({ ...validTopFormData, views: '100' })).toBe(false);
    expect(isTopFormData({})).toBe(false);
    expect(isTopFormData(null)).toBe(false);
    expect(isTopFormData(undefined)).toBe(false);
  });
});

describe('OverviewMetrics type guard', () => {
  const validOverviewMetrics: OverviewMetrics = {
    revenue: { current: 1000, previous: 800, change: 25 },
    subscribers: { current: 500, previous: 400, change: 25 },
    openRate: { current: 0.5, previous: 0.4, change: 25 },
    clickRate: { current: 0.3, previous: 0.2, change: 50 },
    conversionRate: { current: 0.1, previous: 0.08, change: 25 },
    formSubmissions: { current: 100, previous: 80, change: 25 },
    channels: [
      { name: 'Email', value: 75, color: '#ff0000' },
      { name: 'SMS', value: 25, color: '#00ff00' }
    ]
  };

  test('isOverviewMetrics correctly identifies OverviewMetrics objects', () => {
    expect(isOverviewMetrics(validOverviewMetrics)).toBe(true);
    
    // Test with invalid revenue
    expect(isOverviewMetrics({
      ...validOverviewMetrics,
      revenue: { current: '1000', previous: 800, change: 25 }
    })).toBe(false);
    
    // Test with invalid channels
    expect(isOverviewMetrics({
      ...validOverviewMetrics,
      channels: [{ name: 'Email', value: '75', color: '#ff0000' }]
    })).toBe(false);
    
    expect(isOverviewMetrics({})).toBe(false);
    expect(isOverviewMetrics(null)).toBe(false);
    expect(isOverviewMetrics(undefined)).toBe(false);
  });
});

describe('Klaviyo API response type guard', () => {
  test('isKlaviyoApiResponse correctly identifies Klaviyo API responses', () => {
    expect(isKlaviyoApiResponse({ data: [] })).toBe(true);
    expect(isKlaviyoApiResponse({ data: [{ id: '1', attributes: {} }] })).toBe(true);
    expect(isKlaviyoApiResponse({ data: {} })).toBe(false);
    expect(isKlaviyoApiResponse({ data: null })).toBe(false);
    expect(isKlaviyoApiResponse({ meta: {} })).toBe(false);
    expect(isKlaviyoApiResponse({})).toBe(false);
    expect(isKlaviyoApiResponse(null)).toBe(false);
    expect(isKlaviyoApiResponse(undefined)).toBe(false);
  });
});

describe('applyTypeGuard utility', () => {
  test('applyTypeGuard returns data when type guard passes', () => {
    const validCampaign: Campaign = {
      id: 1,
      name: 'Test Campaign',
      sent: 100,
      openRate: 0.5,
      clickRate: 0.3,
      conversionRate: 0.1,
      revenue: 1000
    };
    
    const fallback: Campaign[] = [];
    
    expect(applyTypeGuard(validCampaign, isCampaign, {} as Campaign)).toBe(validCampaign);
    expect(applyTypeGuard([validCampaign], isCampaignArray, fallback)).toEqual([validCampaign]);
  });
  
  test('applyTypeGuard returns fallback when type guard fails', () => {
    const invalidCampaign = {
      id: 'not-a-number',
      name: 'Invalid Campaign',
      sent: 100,
      openRate: 0.5,
      clickRate: 0.3,
      conversionRate: 0.1,
      revenue: 1000
    };
    
    const fallback: Campaign = {
      id: 0,
      name: 'Fallback Campaign',
      sent: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      revenue: 0
    };
    
    const fallbackArray: Campaign[] = [];
    
    expect(applyTypeGuard(invalidCampaign, isCampaign, fallback)).toBe(fallback);
    expect(applyTypeGuard([invalidCampaign], isCampaignArray, fallbackArray)).toBe(fallbackArray);
    expect(applyTypeGuard(null, isCampaign, fallback)).toBe(fallback);
    expect(applyTypeGuard(undefined, isCampaign, fallback)).toBe(fallback);
  });
});
