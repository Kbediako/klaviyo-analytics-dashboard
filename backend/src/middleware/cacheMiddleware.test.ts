import { Request, Response, NextFunction } from 'express';
import { cacheMiddleware, clearCacheMiddleware } from './cacheMiddleware';
import cache from '../utils/cacheUtils';

// Mock the cache
jest.mock('../utils/cacheUtils', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Cache Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock request
    mockRequest = {
      method: 'GET',
      originalUrl: '/api/test',
    };
    
    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    // Setup next function
    nextFunction = jest.fn();
  });
  
  describe('cacheMiddleware', () => {
    it('should return cached response if available', async () => {
      // Mock cached response
      const cachedResponse = { data: 'cached-data' };
      (cache.get as jest.Mock).mockReturnValue(cachedResponse);
      
      // Call middleware
      await cacheMiddleware(60)(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );
      
      // Verify cache was checked
      expect(cache.get).toHaveBeenCalledWith('/api/test');
      
      // Verify cached response was returned
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(cachedResponse);
      
      // Verify next was not called
      expect(nextFunction).not.toHaveBeenCalled();
    });
    
    it('should override json method and call next if no cached response', async () => {
      // Mock no cached response
      (cache.get as jest.Mock).mockReturnValue(undefined);
      
      // Call middleware
      await cacheMiddleware(60)(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );
      
      // Verify cache was checked
      expect(cache.get).toHaveBeenCalledWith('/api/test');
      
      // Verify json method was overridden
      expect(mockResponse.json).not.toBe(undefined);
      
      // Verify next was called
      expect(nextFunction).toHaveBeenCalled();
      
      // Test the overridden json method
      const responseBody = { data: 'response-data' };
      mockResponse.json!(responseBody);
      
      // Verify response was cached
      expect(cache.set).toHaveBeenCalledWith('/api/test', responseBody, 60);
    });
    
    it('should skip caching for non-GET requests', async () => {
      // Setup non-GET request
      mockRequest.method = 'POST';
      
      // Call middleware
      await cacheMiddleware(60)(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );
      
      // Verify cache was not checked
      expect(cache.get).not.toHaveBeenCalled();
      
      // Verify next was called
      expect(nextFunction).toHaveBeenCalled();
    });
    
    it('should continue to next middleware if there is an error', async () => {
      // Mock cache error
      (cache.get as jest.Mock).mockImplementation(() => {
        throw new Error('Cache error');
      });
      
      // Call middleware
      await cacheMiddleware(60)(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );
      
      // Verify next was called
      expect(nextFunction).toHaveBeenCalled();
    });
  });
  
  describe('clearCacheMiddleware', () => {
    it('should clear the cache for the specified endpoint', () => {
      // Call middleware
      clearCacheMiddleware('/api/test')(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );
      
      // Verify cache was cleared
      expect(cache.delete).toHaveBeenCalledWith('/api/test');
      
      // Verify next was called
      expect(nextFunction).toHaveBeenCalled();
    });
  });
});
