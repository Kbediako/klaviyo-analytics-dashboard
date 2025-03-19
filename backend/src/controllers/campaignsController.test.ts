import { Request, Response } from 'express';
import { getCampaigns } from './campaignsController';
import { getCampaignsData } from '../services/campaignsService';

// Mock the campaigns service
jest.mock('../services/campaignsService', () => ({
  getCampaignsData: jest.fn(),
}));

describe('Campaigns Controller', () => {
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
    (getCampaignsData as jest.Mock).mockResolvedValue([
      {
        id: '1',
        name: 'Summer Sale Announcement',
        sent: 24850,
        openRate: 42.8,
        clickRate: 18.5,
        conversionRate: 8.2,
        revenue: 12580,
      },
      {
        id: '2',
        name: 'New Product Launch',
        sent: 18650,
        openRate: 38.5,
        clickRate: 15.2,
        conversionRate: 6.8,
        revenue: 9840,
      },
    ]);
  });
  
  it('should return campaigns data with 200 status', async () => {
    // Set date range query parameter
    mockRequest.query = { dateRange: 'last-30-days' };
    
    // Call the controller
    await getCampaigns(mockRequest as Request, mockResponse as Response);
    
    // Verify response
    expect(responseStatus).toHaveBeenCalledWith(200);
    expect(responseJson).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        sent: expect.any(Number),
        openRate: expect.any(Number),
        clickRate: expect.any(Number),
        conversionRate: expect.any(Number),
        revenue: expect.any(Number),
      }),
    ]));
    
    // Verify service was called with correct parameters
    expect(getCampaignsData).toHaveBeenCalledWith(expect.objectContaining({
      start: expect.any(String),
      end: expect.any(String),
    }));
  });
  
  it('should use default date range if none provided', async () => {
    // No date range query parameter
    mockRequest.query = {};
    
    // Call the controller
    await getCampaigns(mockRequest as Request, mockResponse as Response);
    
    // Verify response
    expect(responseStatus).toHaveBeenCalledWith(200);
    
    // Verify service was called (with default date range)
    expect(getCampaignsData).toHaveBeenCalled();
  });
  
  it('should handle errors and return 500 status', async () => {
    // Mock service to throw an error
    const errorMessage = 'Service error';
    (getCampaignsData as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    // Call the controller
    await getCampaigns(mockRequest as Request, mockResponse as Response);
    
    // Verify error response
    expect(responseStatus).toHaveBeenCalledWith(500);
    expect(responseJson).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.any(String),
      message: errorMessage,
    }));
  });
});
