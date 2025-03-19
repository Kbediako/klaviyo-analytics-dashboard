import { Request, Response } from 'express';
import { getForms } from './formsController';
import { getFormsData } from '../services/formsService';

// Mock the forms service
jest.mock('../services/formsService', () => ({
  getFormsData: jest.fn(),
}));

describe('Forms Controller', () => {
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
    (getFormsData as jest.Mock).mockResolvedValue([
      {
        id: '1',
        name: 'Newsletter Signup',
        views: 12480,
        submissions: 4742,
        submissionRate: 38,
        conversions: 1850
      },
      {
        id: '2',
        name: 'Contact Form',
        views: 8650,
        submissions: 2850,
        submissionRate: 33,
        conversions: 950
      },
    ]);
  });
  
  it('should return forms data with 200 status', async () => {
    // Set date range query parameter
    mockRequest.query = { dateRange: 'last-30-days' };
    
    // Call the controller
    await getForms(mockRequest as Request, mockResponse as Response);
    
    // Verify response
    expect(responseStatus).toHaveBeenCalledWith(200);
    expect(responseJson).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        views: expect.any(Number),
        submissions: expect.any(Number),
        submissionRate: expect.any(Number),
        conversions: expect.any(Number),
      }),
    ]));
    
    // Verify service was called with correct parameters
    expect(getFormsData).toHaveBeenCalledWith(expect.objectContaining({
      start: expect.any(String),
      end: expect.any(String),
    }));
  });
  
  it('should use default date range if none provided', async () => {
    // No date range query parameter
    mockRequest.query = {};
    
    // Call the controller
    await getForms(mockRequest as Request, mockResponse as Response);
    
    // Verify response
    expect(responseStatus).toHaveBeenCalledWith(200);
    
    // Verify service was called (with default date range)
    expect(getFormsData).toHaveBeenCalled();
  });
  
  it('should handle errors and return 500 status', async () => {
    // Mock service to throw an error
    const errorMessage = 'Service error';
    (getFormsData as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Call the controller
    await getForms(mockRequest as Request, mockResponse as Response);
    
    // Verify error response
    expect(responseStatus).toHaveBeenCalledWith(500);
    expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.any(String),
      message: errorMessage,
    }));
  });
});
