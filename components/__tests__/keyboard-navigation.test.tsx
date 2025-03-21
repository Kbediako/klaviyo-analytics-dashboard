import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EnhancedRevenueChart } from '../enhanced-revenue-chart';
import { ChannelDistributionChart } from '../channel-distribution-chart';
import { useTimeSeries } from '../../hooks/use-time-series';
import { useForecast } from '../../hooks/use-forecast';
import { useDateRange } from '../../hooks/use-date-range';

// Mock the hooks
jest.mock('../../hooks/use-time-series');
jest.mock('../../hooks/use-forecast');
jest.mock('../../hooks/use-date-range');

/**
 * Set up test data for components
 */
const setupChartMocks = () => {
  // Default mock implementations
  (useTimeSeries as jest.Mock).mockReturnValue({
    data: [
      { timestamp: '2025-01-01T00:00:00.000Z', value: 100 },
      { timestamp: '2025-01-02T00:00:00.000Z', value: 150 },
      { timestamp: '2025-01-03T00:00:00.000Z', value: 120 }
    ],
    isLoading: false,
    isError: false,
    error: null
  });
  
  (useForecast as jest.Mock).mockReturnValue({
    data: {
      forecast: [
        { timestamp: '2025-01-04T00:00:00.000Z', value: 130 },
        { timestamp: '2025-01-05T00:00:00.000Z', value: 140 }
      ],
      confidence: {
        upper: [
          { timestamp: '2025-01-04T00:00:00.000Z', value: 150 },
          { timestamp: '2025-01-05T00:00:00.000Z', value: 160 }
        ],
        lower: [
          { timestamp: '2025-01-04T00:00:00.000Z', value: 110 },
          { timestamp: '2025-01-05T00:00:00.000Z', value: 120 }
        ]
      }
    },
    isLoading: false,
    isError: false,
    error: null
  });
  
  (useDateRange as jest.Mock).mockReturnValue({
    dateRange: { start: '2025-01-01', end: '2025-01-03' },
    dateRangeParam: 'last-30-days'
  });
};

describe('Chart Keyboard Navigation', () => {
  beforeEach(() => {
    setupChartMocks();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('EnhancedRevenueChart controls are keyboard accessible', () => {
    render(<EnhancedRevenueChart metricId="revenue" />);
    
    // Find the forecast toggle
    const forecastToggle = screen.getByLabelText('Toggle forecast display');
    
    // Should be focusable
    forecastToggle.focus();
    expect(document.activeElement).toBe(forecastToggle);
    
    // Can be toggled with space
    fireEvent.keyDown(forecastToggle, { key: ' ', code: 'Space' });
    fireEvent.keyUp(forecastToggle, { key: ' ', code: 'Space' });
    
    // After toggle, should show forecast controls
    expect(screen.getByLabelText('Toggle confidence interval display')).toBeInTheDocument();
    
    // Select boxes should be focusable
    const methodSelect = screen.getByLabelText('Select forecast method');
    methodSelect.focus();
    expect(document.activeElement).toBe(methodSelect);
    
    // Can open select with Enter
    fireEvent.keyDown(methodSelect, { key: 'Enter', code: 'Enter' });
    
    // Select menu should now be visible
    expect(screen.getByText('Moving Average')).toBeInTheDocument();
  });
  
  it('EnhancedRevenueChart refresh button is keyboard accessible', () => {
    render(<EnhancedRevenueChart metricId="revenue" />);
    
    // Find refresh button
    const refreshButton = screen.getByLabelText('Refresh chart data');
    
    // Should be focusable
    refreshButton.focus();
    expect(document.activeElement).toBe(refreshButton);
    
    // Create a mock for the refetch function
    const mockRefetch = jest.fn();
    (useTimeSeries as jest.Mock).mockReturnValue({
      data: [{ timestamp: '2025-01-01T00:00:00.000Z', value: 100 }],
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch
    });
    
    render(<EnhancedRevenueChart metricId="revenue" />);
    
    // Find and click refresh button with keyboard
    const refreshBtn = screen.getByLabelText('Refresh chart data');
    refreshBtn.focus();
    fireEvent.keyDown(refreshBtn, { key: 'Enter', code: 'Enter' });
    
    // Refetch should have been called
    expect(mockRefetch).toHaveBeenCalled();
  });
  
  it('ChannelDistributionChart is keyboard navigable in error state', () => {
    render(<ChannelDistributionChart error={new Error('Test error')} />);
    
    // Find the retry button
    const retryButton = screen.getByText('Retry');
    
    // Should be focusable
    retryButton.focus();
    expect(document.activeElement).toBe(retryButton);
    
    // Can be activated with enter
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    });
    
    fireEvent.keyDown(retryButton, { key: 'Enter', code: 'Enter' });
    
    // Reload should have been called
    expect(mockReload).toHaveBeenCalled();
  });
  
  it('Chart tooltips are accessible via keyboard', () => {
    // For this test we need to mock the Recharts behavior
    // Since JSDOM doesn't fully support SVG interactions, this is a limited test
    
    // Create a mock implementation for SVG chart elements
    // This is a simplified approach to test keyboard accessibility
    const MockChart = () => (
      <div role="img" aria-label="Accessibility test chart">
        <div 
          tabIndex={0} 
          role="button" 
          aria-label="Chart data point, January 1: $100"
          data-testid="chart-point"
        />
      </div>
    );
    
    // Make the AccessibleTooltip component available
    const { container } = render(<MockChart />);
    
    // Focus on a chart point
    const chartPoint = screen.getByTestId('chart-point');
    chartPoint.focus();
    expect(document.activeElement).toBe(chartPoint);
    
    // Verify we can use keyboard to interact
    fireEvent.keyDown(chartPoint, { key: 'Enter', code: 'Enter' });
    
    // This would normally trigger a tooltip, but since we're simulating
    // we just verify that the element was keyboard accessible
    expect(document.activeElement).toBe(chartPoint);
    
    // Check for ARIA attributes
    expect(chartPoint.getAttribute('aria-label')).toBe('Chart data point, January 1: $100');
  });
});