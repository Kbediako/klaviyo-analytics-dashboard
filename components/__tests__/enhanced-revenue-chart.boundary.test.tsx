import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnhancedRevenueChart } from '../enhanced-revenue-chart';
import { useTimeSeries } from '../../hooks/use-time-series';
import { useForecast } from '../../hooks/use-forecast';
import { useDateRange } from '../../hooks/use-date-range';

// Mock the hooks
jest.mock('../../hooks/use-time-series');
jest.mock('../../hooks/use-forecast');
jest.mock('../../hooks/use-date-range');

describe('EnhancedRevenueChart Boundary Tests', () => {
  beforeEach(() => {
    // Default mock implementations
    (useDateRange as jest.Mock).mockReturnValue({
      dateRange: { start: '2025-01-01', end: '2025-01-30' },
      dateRangeParam: 'last-30-days'
    });
    
    (useTimeSeries as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null
    });
    
    (useForecast as jest.Mock).mockReturnValue({
      data: {
        forecast: [],
        confidence: { upper: [], lower: [] }
      },
      isLoading: false,
      isError: false,
      error: null
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('handles very large data points gracefully', () => {
    // Mock large values
    const largeData = [
      { timestamp: '2025-01-01T00:00:00.000Z', value: 1000000000 }, // 1 billion
      { timestamp: '2025-01-02T00:00:00.000Z', value: 2000000000 }, // 2 billion
      { timestamp: '2025-01-03T00:00:00.000Z', value: 1500000000 }, // 1.5 billion
    ];
    
    (useTimeSeries as jest.Mock).mockReturnValue({
      data: largeData,
      isLoading: false,
      isError: false,
      error: null
    });
    
    render(<EnhancedRevenueChart metricId="revenue" />);
    
    // Chart should be rendered without errors
    expect(screen.getByText('Revenue Forecast')).toBeInTheDocument();
  });
  
  it('handles extremely small data points correctly', () => {
    // Mock very small values
    const smallData = [
      { timestamp: '2025-01-01T00:00:00.000Z', value: 0.00001 },
      { timestamp: '2025-01-02T00:00:00.000Z', value: 0.00002 },
      { timestamp: '2025-01-03T00:00:00.000Z', value: 0.00003 },
    ];
    
    (useTimeSeries as jest.Mock).mockReturnValue({
      data: smallData,
      isLoading: false,
      isError: false,
      error: null
    });
    
    render(<EnhancedRevenueChart metricId="revenue" />);
    
    // Chart should be rendered without errors
    expect(screen.getByText('Revenue Forecast')).toBeInTheDocument();
  });
  
  it('handles negative values correctly', () => {
    // Mock negative values (e.g., for representing losses or refunds)
    const negativeData = [
      { timestamp: '2025-01-01T00:00:00.000Z', value: -100 },
      { timestamp: '2025-01-02T00:00:00.000Z', value: -200 },
      { timestamp: '2025-01-03T00:00:00.000Z', value: -150 },
    ];
    
    (useTimeSeries as jest.Mock).mockReturnValue({
      data: negativeData,
      isLoading: false,
      isError: false,
      error: null
    });
    
    render(<EnhancedRevenueChart metricId="revenue" />);
    
    // Chart should be rendered without errors
    expect(screen.getByText('Revenue Forecast')).toBeInTheDocument();
  });
  
  it('handles mixed positive and negative values', () => {
    // Mock mixed values
    const mixedData = [
      { timestamp: '2025-01-01T00:00:00.000Z', value: 100 },
      { timestamp: '2025-01-02T00:00:00.000Z', value: -50 },
      { timestamp: '2025-01-03T00:00:00.000Z', value: 150 },
      { timestamp: '2025-01-04T00:00:00.000Z', value: -20 },
    ];
    
    (useTimeSeries as jest.Mock).mockReturnValue({
      data: mixedData,
      isLoading: false,
      isError: false,
      error: null
    });
    
    render(<EnhancedRevenueChart metricId="revenue" />);
    
    // Chart should be rendered without errors
    expect(screen.getByText('Revenue Forecast')).toBeInTheDocument();
  });
  
  it('handles non-chronological data points', () => {
    // Mock data that's not in chronological order
    const nonChronologicalData = [
      { timestamp: '2025-01-03T00:00:00.000Z', value: 150 },
      { timestamp: '2025-01-01T00:00:00.000Z', value: 100 },
      { timestamp: '2025-01-02T00:00:00.000Z', value: 120 },
    ];
    
    (useTimeSeries as jest.Mock).mockReturnValue({
      data: nonChronologicalData,
      isLoading: false,
      isError: false,
      error: null
    });
    
    render(<EnhancedRevenueChart metricId="revenue" />);
    
    // Chart should be rendered without errors
    expect(screen.getByText('Revenue Forecast')).toBeInTheDocument();
  });
  
  it('handles sparse data with missing days', () => {
    // Mock data with gaps (missing days)
    const sparseData = [
      { timestamp: '2025-01-01T00:00:00.000Z', value: 100 },
      // Missing Jan 2
      { timestamp: '2025-01-03T00:00:00.000Z', value: 120 },
      // Missing Jan 4-5
      { timestamp: '2025-01-06T00:00:00.000Z', value: 150 },
    ];
    
    (useTimeSeries as jest.Mock).mockReturnValue({
      data: sparseData,
      isLoading: false,
      isError: false,
      error: null
    });
    
    render(<EnhancedRevenueChart metricId="revenue" />);
    
    // Chart should be rendered without errors
    expect(screen.getByText('Revenue Forecast')).toBeInTheDocument();
  });
  
  it('handles malformed data gracefully', () => {
    // Mock malformed data
    const malformedData = [
      { timestamp: '2025-01-01T00:00:00.000Z', value: 100 },
      { timestamp: 'invalid-date', value: 120 },
      { timestamp: '2025-01-03T00:00:00.000Z', value: 'not-a-number' },
      { invalid: 'data-point' }
    ];
    
    (useTimeSeries as jest.Mock).mockReturnValue({
      // @ts-ignore - intentionally passing malformed data
      data: malformedData,
      isLoading: false,
      isError: false,
      error: null
    });
    
    render(<EnhancedRevenueChart metricId="revenue" />);
    
    // Chart should not crash and should render something
    expect(screen.getByText('Revenue Forecast')).toBeInTheDocument();
  });
  
  it('handles simultaneous loading states for time series and forecast', () => {
    (useTimeSeries as jest.Mock).mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      error: null
    });
    
    (useForecast as jest.Mock).mockReturnValue({
      data: {
        forecast: [],
        confidence: { upper: [], lower: [] }
      },
      isLoading: true,
      isError: false,
      error: null
    });
    
    render(<EnhancedRevenueChart metricId="revenue" initialShowForecast={true} />);
    
    // Loading skeletons should be displayed
    const skeletons = screen.getAllByRole('status');
    expect(skeletons.length).toBeGreaterThan(0);
  });
  
  it('handles different error scenarios', async () => {
    // Test with network error
    (useTimeSeries as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      error: new Error('Network error: Failed to fetch')
    });
    
    render(<EnhancedRevenueChart metricId="revenue" />);
    
    // Error message should show the specific error
    expect(screen.getByText(/Failed to load chart data/)).toBeInTheDocument();
    expect(screen.getByText(/Network error: Failed to fetch/)).toBeInTheDocument();
    
    // Test with API error
    (useTimeSeries as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      error: new Error('API error: 500 Internal Server Error')
    });
    
    render(<EnhancedRevenueChart metricId="revenue" />);
    
    // Error message should show the specific error
    expect(screen.getByText(/API error: 500 Internal Server Error/)).toBeInTheDocument();
  });
  
  it('handles empty data scenarios', () => {
    // Empty data array
    (useTimeSeries as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null
    });
    
    render(<EnhancedRevenueChart metricId="revenue" />);
    
    // No data message should be displayed
    expect(screen.getByText(/No data available/)).toBeInTheDocument();
  });
});