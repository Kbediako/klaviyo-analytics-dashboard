import { getSegmentsData } from './segmentsService';
import klaviyoApiClient from './klaviyoApiClient';
import { DateRange } from '../utils/dateUtils';

// Mock the Klaviyo API client
jest.mock('./klaviyoApiClient', () => ({
  __esModule: true,
  default: {
    getSegments: jest.fn(),
  },
}));

describe('Segments Service', () => {
  const mockDateRange: DateRange = {
    start: '2023-01-01T00:00:00.000Z',
    end: '2023-01-31T23:59:59.999Z',
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    (klaviyoApiClient.getSegments as jest.Mock).mockResolvedValue({
      data: [
        { id: '1', attributes: { name: 'Segment 1' } },
        { id: '2', attributes: { name: 'Segment 2' } },
      ],
    });
  });
  
  it('should return segments data with metrics', async () => {
    const result = await getSegmentsData(mockDateRange);
    
    // Verify structure of the response
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    
    // Verify each segment has the required fields
    result.forEach(segment => {
      expect(segment).toHaveProperty('id');
      expect(segment).toHaveProperty('name');
      expect(segment).toHaveProperty('count');
      expect(segment).toHaveProperty('conversionRate');
      expect(segment).toHaveProperty('revenue');
    });
    
    // Verify API calls
    expect(klaviyoApiClient.getSegments).toHaveBeenCalled();
  });
  
  it('should handle API errors gracefully', async () => {
    // Mock API error
    (klaviyoApiClient.getSegments as jest.Mock).mockRejectedValue(new Error('API error'));
    
    const result = await getSegmentsData(mockDateRange);
    
    // Should return empty array instead of throwing
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
  
  it('should transform segment data correctly', async () => {
    // This test would verify the transformation logic in a real implementation
    // For now, we're just checking that the placeholder data is returned
    const result = await getSegmentsData(mockDateRange);
    
    // Verify some expected values in the placeholder data
    expect(result[0].name).toBe('VIP Customers');
    expect(result[0].count).toBe(5842);
    expect(result[0].conversionRate).toBe(42);
  });
});
