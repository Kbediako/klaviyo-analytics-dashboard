import { renderHook, waitFor } from '@testing-library/react';
import { useRevenueChartData, useChannelDistributionData } from './use-chart-data';
import fetchMock from 'jest-fetch-mock';

// Mock fetch
global.fetch = fetchMock as any;

describe('Chart Data Hooks', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  describe('useRevenueChartData', () => {
    const mockRevenueData = [
      { date: '2023-01', campaigns: 4200, flows: 3100, forms: 1800, other: 950 },
      { date: '2023-02', campaigns: 4500, flows: 3300, forms: 1900, other: 1000 },
    ];

    it('should fetch revenue data with no date range', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(mockRevenueData));

      const { result } = renderHook(() => useRevenueChartData());

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toEqual([]);

      // Wait for data to load
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Check fetch was called correctly
      expect(fetchMock).toHaveBeenCalledWith('/api/charts/revenue');
      
      // Check data was set correctly
      expect(result.current.data).toEqual(mockRevenueData);
      expect(result.current.error).toBeNull();
    });

    it('should fetch revenue data with date range parameter', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(mockRevenueData));

      const { result } = renderHook(() => useRevenueChartData({ dateRange: 'last-30-days' }));

      // Wait for data to load
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Check fetch was called with date range parameter
      expect(fetchMock).toHaveBeenCalledWith('/api/charts/revenue?dateRange=last-30-days');
      
      // Check data was set correctly
      expect(result.current.data).toEqual(mockRevenueData);
    });

    it('should handle API errors', async () => {
      fetchMock.mockRejectOnce(new Error('API error'));

      const { result } = renderHook(() => useRevenueChartData());

      // Wait for error to be set
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Check error was set correctly
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toBe('API error');
      expect(result.current.data).toEqual([]);
    });
  });

  describe('useChannelDistributionData', () => {
    const mockDistributionData = [
      { name: 'Campaigns', value: 42 },
      { name: 'Flows', value: 35 },
    ];

    it('should fetch distribution data with date range parameter', async () => {
      fetchMock.mockResponseOnce(JSON.stringify(mockDistributionData));

      const { result } = renderHook(() => useChannelDistributionData({ dateRange: 'last-7-days' }));

      // Wait for data to load
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Check fetch was called with date range parameter
      expect(fetchMock).toHaveBeenCalledWith('/api/charts/distribution?dateRange=last-7-days');
      
      // Check data was set correctly
      expect(result.current.data).toEqual(mockDistributionData);
    });
  });
});
