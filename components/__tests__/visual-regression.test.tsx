/**
 * Visual regression tests for chart components
 * 
 * These tests are designed to detect unexpected changes in chart rendering
 * by comparing snapshots of the rendered output.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { EnhancedRevenueChart } from '../enhanced-revenue-chart';
import { ChannelDistributionChart } from '../channel-distribution-chart';
import { useTimeSeries } from '../../hooks/use-time-series';
import { useForecast } from '../../hooks/use-forecast';
import { useDateRange } from '../../hooks/use-date-range';
import { ChannelDataPoint } from '@/lib/api-client';

// Mock the hooks
jest.mock('../../hooks/use-time-series');
jest.mock('../../hooks/use-forecast');
jest.mock('../../hooks/use-date-range');

/**
 * Prepare test data for consistent visual regression testing
 */
const mockTimeSeriesData = [
  { timestamp: '2025-01-01T00:00:00.000Z', value: 100 },
  { timestamp: '2025-01-02T00:00:00.000Z', value: 150 },
  { timestamp: '2025-01-03T00:00:00.000Z', value: 120 },
  { timestamp: '2025-01-04T00:00:00.000Z', value: 200 },
  { timestamp: '2025-01-05T00:00:00.000Z', value: 180 },
  { timestamp: '2025-01-06T00:00:00.000Z', value: 220 },
  { timestamp: '2025-01-07T00:00:00.000Z', value: 250 }
];

const mockForecastData = {
  forecast: [
    { timestamp: '2025-01-08T00:00:00.000Z', value: 230 },
    { timestamp: '2025-01-09T00:00:00.000Z', value: 240 },
    { timestamp: '2025-01-10T00:00:00.000Z', value: 260 }
  ],
  confidence: {
    upper: [
      { timestamp: '2025-01-08T00:00:00.000Z', value: 250 },
      { timestamp: '2025-01-09T00:00:00.000Z', value: 270 },
      { timestamp: '2025-01-10T00:00:00.000Z', value: 290 }
    ],
    lower: [
      { timestamp: '2025-01-08T00:00:00.000Z', value: 210 },
      { timestamp: '2025-01-09T00:00:00.000Z', value: 220 },
      { timestamp: '2025-01-10T00:00:00.000Z', value: 230 }
    ]
  }
};

const mockChannelData: ChannelDataPoint[] = [
  { name: 'Email', value: 60 },
  { name: 'SMS', value: 20 },
  { name: 'Push', value: 15 },
  { name: 'Other', value: 5 }
];

describe('Chart Visual Regression Tests', () => {
  beforeEach(() => {
    // Set up default mock implementations
    (useTimeSeries as jest.Mock).mockReturnValue({
      data: mockTimeSeriesData,
      isLoading: false,
      isError: false,
      error: null
    });
    
    (useForecast as jest.Mock).mockReturnValue({
      data: mockForecastData,
      isLoading: false,
      isError: false,
      error: null
    });
    
    (useDateRange as jest.Mock).mockReturnValue({
      dateRange: { start: '2025-01-01', end: '2025-01-07' },
      dateRangeParam: 'last-7-days'
    });
    
    // Mock RAF for charts that use animation
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      cb(0);
      return 0;
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    (window.requestAnimationFrame as jest.Mock).mockRestore();
  });
  
  it('EnhancedRevenueChart renders consistently', () => {
    const { container } = render(
      <EnhancedRevenueChart metricId="revenue" initialShowForecast={true} />
    );
    
    // Snapshot test will fail if the rendered output changes
    expect(container).toMatchSnapshot();
  });
  
  it('EnhancedRevenueChart renders consistently with confidence intervals', () => {
    const { container } = render(
      <EnhancedRevenueChart 
        metricId="revenue" 
        initialShowForecast={true} 
        initialShowConfidenceInterval={true}
      />
    );
    
    expect(container).toMatchSnapshot();
  });
  
  it('EnhancedRevenueChart renders consistently in print mode', () => {
    const { container } = render(
      <EnhancedRevenueChart 
        metricId="revenue" 
        initialShowForecast={true} 
        printFriendly={true}
      />
    );
    
    expect(container).toMatchSnapshot();
  });
  
  it('ChannelDistributionChart renders consistently', () => {
    const { container } = render(
      <ChannelDistributionChart data={mockChannelData} />
    );
    
    expect(container).toMatchSnapshot();
  });
  
  it('EnhancedRevenueChart loading state renders consistently', () => {
    (useTimeSeries as jest.Mock).mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      error: null
    });
    
    const { container } = render(
      <EnhancedRevenueChart metricId="revenue" />
    );
    
    expect(container).toMatchSnapshot();
  });
  
  it('EnhancedRevenueChart error state renders consistently', () => {
    (useTimeSeries as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      error: new Error('Failed to load data')
    });
    
    const { container } = render(
      <EnhancedRevenueChart metricId="revenue" />
    );
    
    expect(container).toMatchSnapshot();
  });
  
  it('ChannelDistributionChart loading state renders consistently', () => {
    const { container } = render(
      <ChannelDistributionChart isLoading={true} />
    );
    
    expect(container).toMatchSnapshot();
  });
  
  it('ChannelDistributionChart error state renders consistently', () => {
    const { container } = render(
      <ChannelDistributionChart error={new Error('Failed to load data')} />
    );
    
    expect(container).toMatchSnapshot();
  });
});