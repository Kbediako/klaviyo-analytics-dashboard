import { Request, Response } from 'express';
import { getSegments } from './segmentsController';
import { getSegmentsData } from '../services/segmentsService';

// Mock the segments service
jest.mock('../services/segmentsService', () => ({
  getSegmentsData: jest.fn(),
}));

describe('Segments Controller', () => {
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
    (getSegmentsData as jest.Mock).mockResolvedValue([
      {
        id: '1',
        name: 'VIP Customers',
        count: 5842,
        conversionRate: 42,
        revenue: 28450
      },
      {
        id: '2',
        name: 'Active Subscribers',
        count: 24853,
        conversionRate: 28,
        revenue: 42580
      },
    ]);
  });
  
  it('should return segments data with 200 status', async () => {
    // Set date range query parameter
    mockRequest.query = { dateRange: 'last-30-days' };
    
    // Call the controller
    await getSegments(mockRequest as Request, mockResponse as Response);
    
    // Verify response
    expect(responseStatus).toHaveBeenCalledWith(200);
    expect(responseJson).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        count: expect.any(Number),
        conversionRate: expect.any(Number),
        revenue: expect.any(Number),
      }),
    ]));
    
    // Verify service was called with correct parameters
    expect(getSegmentsData).toHaveBeenCalledWith(expect.objectContaining({
      start: expect.any(String),
      end: expect.any(String),
    }));
  });
  
  it('should use default date range if none provided', async () => {
    // No date range query parameter
    mockRequest.query = {};
    
    // Call the controller
    await getSegments(mockRequest as Request, mockResponse as Response);
    
    // Verify response
    expect(responseStatus).toHaveBeenCalledWith(200);
    
    // Verify service was called (with default date range)
    expect(getSegmentsData).toHaveBeenCalled();
  });
  
  it('should handle errors and return 500 status', async () => {
    // Mock service to throw an error
    const errorMessage = 'Service error';
    (getSegmentsData as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Call the controller
    await getSegments(mockRequest as Request, mockResponse as Response);
    
    // Verify error response
    expect(responseStatus).toHaveBeenCalledWith(500);
    expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.any(String),
      message: errorMessage,
    }));
  });
});
