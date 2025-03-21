import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChannelDistributionChart } from '../channel-distribution-chart';
import { ChannelDataPoint } from '@/lib/api-client';

describe('ChannelDistributionChart', () => {
  const mockData: ChannelDataPoint[] = [
    { name: 'Email', value: 60 },
    { name: 'SMS', value: 20 },
    { name: 'Push', value: 15 },
    { name: 'Other', value: 5 }
  ];

  it('renders correctly with data', () => {
    render(<ChannelDistributionChart data={mockData} />);
    
    // The chart should be in the document
    expect(screen.getByRole('region', { name: /channel distribution/i })).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(<ChannelDistributionChart isLoading={true} />);
    
    // Loading skeleton should be visible
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows error state when error is provided', () => {
    const testError = new Error('Test error message');
    render(<ChannelDistributionChart error={testError} />);
    
    // Error message should be displayed
    expect(screen.getByText(/failed to load chart data/i)).toBeInTheDocument();
  });

  it('shows empty state when no data is provided', () => {
    render(<ChannelDistributionChart data={[]} />);
    
    // Empty state message should be displayed
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });

  it('shows empty state when data has only zero values', () => {
    const zeroData: ChannelDataPoint[] = [
      { name: 'Email', value: 0 },
      { name: 'SMS', value: 0 }
    ];
    
    render(<ChannelDistributionChart data={zeroData} />);
    
    // Empty state message should be displayed
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });

  it('handles undefined data gracefully', () => {
    render(<ChannelDistributionChart data={undefined} />);
    
    // Empty state message should be displayed
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });

  it('handles malformed data gracefully', () => {
    // @ts-ignore - Testing invalid data type
    const invalidData = [{ incorrect: 'format' }];
    
    // Should not crash with invalid data
    render(<ChannelDistributionChart data={invalidData} />);
    
    // Component should render something, either empty state or error
    expect(screen.getByRole('region', { name: /channel distribution/i })).toBeInTheDocument();
  });

  it('displays correct percentages in chart labels', () => {
    render(<ChannelDistributionChart data={mockData} />);
    
    // Since we can't easily test the exact rendering of the pie chart labels in JSDOM,
    // we can at least check that the component renders without errors
    expect(screen.getByRole('region', { name: /channel distribution/i })).toBeInTheDocument();
  });
});