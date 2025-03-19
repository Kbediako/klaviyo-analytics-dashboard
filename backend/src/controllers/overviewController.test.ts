import { Request, Response } from 'express';
import { getOverview } from './overviewController';
import { getOverviewMetrics } from '../services/overviewService';

// Mock the overview service
jest.mock('../services/overviewService', () => ({
  getOverviewMetrics: jest.fn(),
}));

describe('Overview Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock response
    responseJson = jest.fn().mockReturnThis();
    responseStatus = jest.fn().mockReturnThis();
    
    mockRequest = {
      query: {},
    };
    
    mockResponse = {
      json: responseJson,
      status: responseStatus,
    };
    
    // Setup default mock response from service
    (getOverviewMetrics as jest.Mock).mockResolvedValue({
      totalRevenue: 42582,
      activeSubscribers: 24853,
      conversionRate: 18.5,
      formSubmissions: 3842,
      periodComparison: {
        totalRevenue: '+10.0%',
        activeSubscribers: '+5.2%',
        conversionRate: '-2.1%',
        formSubmissions: '+15.3%',
      },
    });
  });
  
  it('should return overview metrics with 200 status', async () => {
    // Set date range query parameter
    mockRequest.query = { dateRange: 'last-30-days' };
    
    // Call the controller
    await getOverview(mockRequest as Request, mockResponse as Response);
    
    // Verify response
    expect(responseStatus).toHaveBeenCalledWith(200);
    expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
      totalRevenue: expect.any(Number),
      activeSubscribers: expect.any(Number),
      conversionRate: expect.any(Number),
      formSubmissions: expect.any(Number),
      periodComparison: expect.any(Object),
    }));
    
    // Verify service was called with correct parameters
    expect(getOverviewMetrics).toHaveBeenCalledWith(expect.objectContaining({
      start: expect.any(String),
      end: expect.any(String),
    }));
  });
  
  it('should use default date range if none provided', async () => {
    // No date range query parameter
    mockRequest.query = {};
    
    // Call the controller
    await getOverview(mockRequest as Request, mockResponse as Response);
    
    // Verify response
    expect(responseStatus).toHaveBeenCalledWith(200);
    
    // Verify service was called (with default date range)
    expect(getOverviewMetrics).toHaveBeenCalled();
  });
  
  it('should handle errors and return 500 status', async () => {
    // Mock service to throw an error
    const errorMessage = 'Service error';
    (getOverviewMetrics as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Call the controller
    await getOverview(mockRequest as Request, mockResponse as Response);
    
    // Verify error response
    expect(responseStatus).toHaveBeenCalledWith(500);
    expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.any(String),
      message: errorMessage,
    }));
  });
});
