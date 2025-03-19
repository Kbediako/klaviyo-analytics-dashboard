import { Request, Response } from 'express';
import { getFlows } from './flowsController';
import { getFlowsData } from '../services/flowsService';

// Mock the flows service
jest.mock('../services/flowsService', () => ({
  getFlowsData: jest.fn(),
}));

describe('Flows Controller', () => {
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
    (getFlowsData as jest.Mock).mockResolvedValue([
      {
        id: '1',
        name: 'Welcome Series',
        recipients: 8450,
        openRate: 68.5,
        clickRate: 42.8,
        conversionRate: 32,
        revenue: 24850,
      },
      {
        id: '2',
        name: 'Abandoned Cart',
        recipients: 6280,
        openRate: 58.2,
        clickRate: 38.5,
        conversionRate: 28,
        revenue: 18650,
      },
    ]);
  });
  
  it('should return flows data with 200 status', async () => {
    // Set date range query parameter
    mockRequest.query = { dateRange: 'last-30-days' };
    
    // Call the controller
    await getFlows(mockRequest as Request, mockResponse as Response);
    
    // Verify response
    expect(responseStatus).toHaveBeenCalledWith(200);
    expect(responseJson).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        recipients: expect.any(Number),
        openRate: expect.any(Number),
        clickRate: expect.any(Number),
        conversionRate: expect.any(Number),
        revenue: expect.any(Number),
      }),
    ]));
    
    // Verify service was called with correct parameters
    expect(getFlowsData).toHaveBeenCalledWith(expect.objectContaining({
      start: expect.any(String),
      end: expect.any(String),
    }));
  });
  
  it('should use default date range if none provided', async () => {
    // No date range query parameter
    mockRequest.query = {};
    
    // Call the controller
    await getFlows(mockRequest as Request, mockResponse as Response);
    
    // Verify response
    expect(responseStatus).toHaveBeenCalledWith(200);
    
    // Verify service was called (with default date range)
    expect(getFlowsData).toHaveBeenCalled();
  });
  
  it('should handle errors and return 500 status', async () => {
    // Mock service to throw an error
    const errorMessage = 'Service error';
    (getFlowsData as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Call the controller
    await getFlows(mockRequest as Request, mockResponse as Response);
    
    // Verify error response
    expect(responseStatus).toHaveBeenCalledWith(500);
    expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.any(String),
      message: errorMessage,
    }));
  });
});
