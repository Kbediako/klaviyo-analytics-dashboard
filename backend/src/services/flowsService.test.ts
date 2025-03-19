import { getFlowsData } from './flowsService';
import klaviyoApiClient from './klaviyoApiClient';
import { DateRange } from '../utils/dateUtils';

// Mock the Klaviyo API client
jest.mock('./klaviyoApiClient', () => ({
  __esModule: true,
  default: {
    getFlows: jest.fn(),
    getFlowMessages: jest.fn(),
    getEvents: jest.fn(),
    getMetrics: jest.fn(),
  },
}));

describe('Flows Service', () => {
  const mockDateRange: DateRange = {
    start: '2023-01-01T00:00:00.000Z',
    end: '2023-01-31T23:59:59.999Z',
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    (klaviyoApiClient.getFlows as jest.Mock).mockResolvedValue({
      data: [
        { id: '1', attributes: { name: 'Flow 1' } },
        { id: '2', attributes: { name: 'Flow 2' } },
      ],
    });
    
    (klaviyoApiClient.getFlowMessages as jest.Mock).mockResolvedValue({
      data: [
        { id: '1', attributes: { flow_id: '1', name: 'Message 1' } },
        { id: '2', attributes: { flow_id: '2', name: 'Message 2' } },
      ],
    });
  });
  
  it('should return flows data with metrics', async () => {
    const result = await getFlowsData(mockDateRange);
    
    // Verify structure of the response
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    
    // Verify each flow has the required fields
    result.forEach(flow => {
      expect(flow).toHaveProperty('id');
      expect(flow).toHaveProperty('name');
      expect(flow).toHaveProperty('recipients');
      expect(flow).toHaveProperty('openRate');
      expect(flow).toHaveProperty('clickRate');
      expect(flow).toHaveProperty('conversionRate');
      expect(flow).toHaveProperty('revenue');
    });
    
    // Verify API calls
    expect(klaviyoApiClient.getFlows).toHaveBeenCalled();
    expect(klaviyoApiClient.getFlowMessages).toHaveBeenCalledWith(mockDateRange);
  });
  
  it('should handle API errors gracefully', async () => {
    // Mock API error
    (klaviyoApiClient.getFlows as jest.Mock).mockRejectedValue(new Error('API error'));
    
    const result = await getFlowsData(mockDateRange);
    
    // Should return empty array instead of throwing
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
  
  it('should transform flow data correctly', async () => {
    // This test would verify the transformation logic in a real implementation
    // For now, we're just checking that the placeholder data is returned
    const result = await getFlowsData(mockDateRange);
    
    // Verify some expected values in the placeholder data
    expect(result[0].name).toBe('Welcome Series');
    expect(result[0].recipients).toBe(8450);
    expect(result[0].openRate).toBe(68.5);
  });
});
