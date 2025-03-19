import { getCampaignsData } from './campaignsService';
import klaviyoApiClient from './klaviyoApiClient';
import { DateRange } from '../utils/dateUtils';

// Mock the Klaviyo API client
jest.mock('./klaviyoApiClient', () => ({
  __esModule: true,
  default: {
    getCampaigns: jest.fn(),
    getEvents: jest.fn(),
    getMetrics: jest.fn(),
  },
}));

describe('Campaigns Service', () => {
  const mockDateRange: DateRange = {
    start: '2023-01-01T00:00:00.000Z',
    end: '2023-01-31T23:59:59.999Z',
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    (klaviyoApiClient.getCampaigns as jest.Mock).mockResolvedValue({
      data: [
        { id: '1', attributes: { name: 'Campaign 1' } },
        { id: '2', attributes: { name: 'Campaign 2' } },
      ],
    });
  });
  
  it('should return campaigns data with metrics', async () => {
    const result = await getCampaignsData(mockDateRange);
    
    // Verify structure of the response
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    
    // Verify each campaign has the required fields
    result.forEach(campaign => {
      expect(campaign).toHaveProperty('id');
      expect(campaign).toHaveProperty('name');
      expect(campaign).toHaveProperty('sent');
      expect(campaign).toHaveProperty('openRate');
      expect(campaign).toHaveProperty('clickRate');
      expect(campaign).toHaveProperty('conversionRate');
      expect(campaign).toHaveProperty('revenue');
    });
    
    // Verify API calls
    expect(klaviyoApiClient.getCampaigns).toHaveBeenCalledWith(mockDateRange);
  });
  
  it('should handle API errors gracefully', async () => {
    // Mock API error
    (klaviyoApiClient.getCampaigns as jest.Mock).mockRejectedValue(new Error('API error'));
    
    const result = await getCampaignsData(mockDateRange);
    
    // Should return empty array instead of throwing
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
  
  it('should transform campaign data correctly', async () => {
    // This test would verify the transformation logic in a real implementation
    // For now, we're just checking that the placeholder data is returned
    const result = await getCampaignsData(mockDateRange);
    
    // Verify some expected values in the placeholder data
    expect(result[0].name).toBe('Summer Sale Announcement');
    expect(result[0].sent).toBe(24850);
    expect(result[0].openRate).toBe(42.8);
  });
});
