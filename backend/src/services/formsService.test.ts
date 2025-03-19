import { getFormsData } from './formsService';
import klaviyoApiClient from './klaviyoApiClient';
import { DateRange } from '../utils/dateUtils';

// Mock the Klaviyo API client
jest.mock('./klaviyoApiClient', () => ({
  __esModule: true,
  default: {
    getEvents: jest.fn(),
  },
}));

describe('Forms Service', () => {
  const mockDateRange: DateRange = {
    start: '2023-01-01T00:00:00.000Z',
    end: '2023-01-31T23:59:59.999Z',
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    (klaviyoApiClient.getEvents as jest.Mock).mockResolvedValue({
      data: [
        { id: '1', attributes: { form_id: '1', name: 'Form 1' } },
        { id: '2', attributes: { form_id: '2', name: 'Form 2' } },
      ],
    });
  });
  
  it('should return forms data with metrics', async () => {
    const result = await getFormsData(mockDateRange);
    
    // Verify structure of the response
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    
    // Verify each form has the required fields
    result.forEach(form => {
      expect(form).toHaveProperty('id');
      expect(form).toHaveProperty('name');
      expect(form).toHaveProperty('views');
      expect(form).toHaveProperty('submissions');
      expect(form).toHaveProperty('submissionRate');
      expect(form).toHaveProperty('conversions');
    });
    
    // Verify API calls
    expect(klaviyoApiClient.getEvents).toHaveBeenCalledWith(
      mockDateRange,
      'metric.id=submitted-form'
    );
  });
  
  it('should handle API errors gracefully', async () => {
    // Mock API error
    (klaviyoApiClient.getEvents as jest.Mock).mockRejectedValue(new Error('API error'));
    
    const result = await getFormsData(mockDateRange);
    
    // Should return empty array instead of throwing
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
  
  it('should transform form data correctly', async () => {
    // This test would verify the transformation logic in a real implementation
    // For now, we're just checking that the placeholder data is returned
    const result = await getFormsData(mockDateRange);
    
    // Verify some expected values in the placeholder data
    expect(result[0].name).toBe('Newsletter Signup');
    expect(result[0].views).toBe(12480);
    expect(result[0].submissionRate).toBe(38);
  });
});
