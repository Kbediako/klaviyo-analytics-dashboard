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

describe('EnhancedRevenueChart', () => {
  // Set up mock data
  const mockTimeSeriesData = [
    { timestamp: '2025-01-01T00:00:00.000Z', value: 100 },
    { timestamp: '2025-01-02T00:00:00.000Z', value: 150 },
    { timestamp: '2025-01-03T00:00:00.000Z', value: 120 }
  ];
  
  const mockForecastData = {
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
  };
  
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
      dateRange: { start: '2025-01-01', end: '2025-01-03' },
      dateRangeParam: 'last-30-days'
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the chart with historical data', () => {
    render(<EnhancedRevenueChart metricId="revenue" />);
    
    // Check that the component renders with the correct title
    expect(screen.getByText('Revenue Forecast')).toBeInTheDocument();
    
    // Check that the historical data line is rendered
    expect(screen.getByLabelText('Historical revenue data')).toBeInTheDocument();
    
    // Check that the forecast toggle is rendered
    expect(screen.getByLabelText('Show Forecast')).toBeInTheDocument();
  });
  
  it('shows loading state when data is loading', () => {
    (useTimeSeries as jest.Mock).mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      error: null
    });
    
    render(<EnhancedRevenueChart metricId="revenue" />);
    
    // Check for loading skeletons
    const skeletons = screen.getAllByRole('status');
    expect(skeletons.length).toBeGreaterThan(0);
  });
  
  it('shows error state when data fetch fails', () => {
    (useTimeSeries as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      error: new Error('Failed to fetch data')
    });
    
    render(<EnhancedRevenueChart metricId="revenue" />);
    
    // Check for error message
    expect(screen.getByText(/Failed to load chart data/)).toBeInTheDocument();
  });
  
  it('toggles forecast display when switch is clicked', async () => {
    render(<EnhancedRevenueChart metricId="revenue" />);
    
    // Initially, forecast should not be visible
    expect(screen.queryByText('Forecast')).not.toBeInTheDocument();
    
    // Click the forecast toggle
    const forecastToggle = screen.getByLabelText('Show Forecast');
    fireEvent.click(forecastToggle);
    
    // Now forecast should be visible
    await waitFor(() => {
      expect(screen.getByText('Forecast')).toBeInTheDocument();
    });
    
    // Method selector should be visible
    expect(screen.getByText('Method:')).toBeInTheDocument();
    
    // Horizon selector should be visible
    expect(screen.getByText('Horizon (days):')).toBeInTheDocument();
  });
  
  it('toggles confidence interval display when switch is clicked', async () => {
    render(<EnhancedRevenueChart metricId="revenue" initialShowForecast={true} />);
    
    // Initially, confidence interval toggle should be visible but not checked
    const confidenceToggle = screen.getByLabelText('Show Confidence');
    expect(confidenceToggle).toBeInTheDocument();
    
    // Click the confidence interval toggle
    fireEvent.click(confidenceToggle);
    
    // useForecast should be called with the updated parameters
    await waitFor(() => {
      expect(useForecast).toHaveBeenCalledWith(
        expect.objectContaining({
          metricId: 'revenue',
          enabled: true
        })
      );
    });
  });
  
  it('changes forecast method when selector is changed', async () => {
    render(<EnhancedRevenueChart metricId="revenue" initialShowForecast={true} />);
    
    // Open the method selector
    const methodSelector = screen.getByRole('combobox', { name: /method/i });
    fireEvent.click(methodSelector);
    
    // Select "Moving Average"
    const movingAverageOption = screen.getByRole('option', { name: /moving average/i });
    fireEvent.click(movingAverageOption);
    
    // useForecast should be called with the updated method
    await waitFor(() => {
      expect(useForecast).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'moving_average'
        })
      );
    });
  });
  
  it('changes forecast horizon when selector is changed', async () => {
    render(<EnhancedRevenueChart metricId="revenue" initialShowForecast={true} />);
    
    // Open the horizon selector
    const horizonSelector = screen.getByRole('combobox', { name: /horizon/i });
    fireEvent.click(horizonSelector);
    
    // Select "90" days
    const ninetyDaysOption = screen.getByRole('option', { name: '90' });
    fireEvent.click(ninetyDaysOption);
    
    // useForecast should be called with the updated horizon
    await waitFor(() => {
      expect(useForecast).toHaveBeenCalledWith(
        expect.objectContaining({
          horizon: "90"
        })
      );
    });
  });
  
  it('renders with custom title and description', () => {
    const customTitle = 'Custom Chart Title';
    const customDescription = 'Custom chart description';
    
    render(
      <EnhancedRevenueChart 
        metricId="revenue" 
        title={customTitle} 
        description={customDescription} 
      />
    );
    
    expect(screen.getByText(customTitle)).toBeInTheDocument();
    expect(screen.getByText(customDescription)).toBeInTheDocument();
  });
  
  it('renders with initial forecast settings', () => {
    render(
      <EnhancedRevenueChart 
        metricId="revenue" 
        initialShowForecast={true}
        initialShowConfidenceInterval={true}
        initialForecastMethod="linear_regression"
      />
    );
    
    // Forecast should be visible
    expect(screen.getByText('Forecast')).toBeInTheDocument();
    
    // Confidence interval toggle should be checked
    const confidenceToggle = screen.getByLabelText('Show Confidence');
    expect(confidenceToggle).toBeChecked();
    
    // Method should be set to linear regression
    expect(useForecast).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'linear_regression'
      })
    );
  });
});
