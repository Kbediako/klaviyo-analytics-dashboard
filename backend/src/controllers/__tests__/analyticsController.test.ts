import { Request, Response } from 'express';
import { analyticsController } from '../analyticsController';
import { TimeSeriesAnalyzer } from '../../analytics/timeSeriesAnalyzer';
import { ForecastService } from '../../analytics/forecastService';

// Mock the TimeSeriesAnalyzer and ForecastService
jest.mock('../../analytics/timeSeriesAnalyzer');
jest.mock('../../analytics/forecastService');

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock the parseDateRange function
jest.mock('../../utils/dateUtils', () => ({
  parseDateRange: jest.fn().mockImplementation((dateRangeStr) => {
    return {
      start: '2025-01-01T00:00:00.000Z',
      end: '2025-01-31T23:59:59.999Z'
    };
  })
}));

describe('AnalyticsController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockTimeSeriesAnalyzer: jest.Mocked<TimeSeriesAnalyzer>;
  let mockForecastService: jest.Mocked<ForecastService>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup request and response mocks
    mockRequest = {
      params: {},
      query: {}
    };
    
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    
    // Setup TimeSeriesAnalyzer mock
    mockTimeSeriesAnalyzer = {
      getTimeSeries: jest.fn(),
      extractTrend: jest.fn(),
      decompose: jest.fn(),
      detectAnomalies: jest.fn(),
      calculateCorrelation: jest.fn()
    } as unknown as jest.Mocked<TimeSeriesAnalyzer>;
    
    // Setup ForecastService mock
    mockForecastService = {
      naiveForecast: jest.fn(),
      movingAverageForecast: jest.fn(),
      linearRegressionForecast: jest.fn()
    } as unknown as jest.Mocked<ForecastService>;
    
    // Inject mocks
    (TimeSeriesAnalyzer as jest.Mock).mockImplementation(() => mockTimeSeriesAnalyzer);
    (ForecastService as jest.Mock).mockImplementation(() => mockForecastService);
  });
  
  describe('getTimeSeries', () => {
    it('should return time series data for a valid request', async () => {
      // Setup request
      mockRequest.params = { metricId: 'metric-123' };
      mockRequest.query = { dateRange: 'last-30-days', interval: '1 day' };
      
      // Setup mock response data
      const mockTimeSeriesData = [
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 12 }
      ];
      
      mockTimeSeriesAnalyzer.getTimeSeries.mockResolvedValue(mockTimeSeriesData);
      
      // Call the controller method
      await analyticsController.getTimeSeries(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Verify the response
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        metricId: 'metric-123',
        points: mockTimeSeriesData
      }));
      
      // Verify the analyzer was called with correct parameters
      expect(mockTimeSeriesAnalyzer.getTimeSeries).toHaveBeenCalledWith(
        'metric-123',
        expect.any(Date),
        expect.any(Date),
        '1 day'
      );
    });
    
    it('should return 400 if metricId is missing', async () => {
      // Setup request without metricId
      mockRequest.params = {};
      mockRequest.query = { dateRange: 'last-30-days' };
      
      // Call the controller method
      await analyticsController.getTimeSeries(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Verify the response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Missing required parameter: metricId'
      }));
    });
    
    it('should return 500 if analyzer throws an error', async () => {
      // Setup request
      mockRequest.params = { metricId: 'metric-123' };
      mockRequest.query = { dateRange: 'last-30-days' };
      
      // Setup mock to throw error
      mockTimeSeriesAnalyzer.getTimeSeries.mockRejectedValue(new Error('Database error'));
      
      // Call the controller method
      await analyticsController.getTimeSeries(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Verify the response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Failed to fetch time series data'
      }));
    });
  });
  
  describe('getTimeSeriesDecomposition', () => {
    it('should return decomposition for a valid request', async () => {
      // Setup request
      mockRequest.params = { metricId: 'metric-123' };
      mockRequest.query = { dateRange: 'last-30-days', interval: '1 day', windowSize: '7' };
      
      // Setup mock response data
      const mockDecomposition = {
        trend: [{ timestamp: new Date('2025-01-01'), value: 10 }],
        seasonal: [{ timestamp: new Date('2025-01-01'), value: 1 }],
        residual: [{ timestamp: new Date('2025-01-01'), value: 0.5 }],
        original: [{ timestamp: new Date('2025-01-01'), value: 11.5 }]
      };
      
      mockTimeSeriesAnalyzer.decompose.mockResolvedValue(mockDecomposition);
      
      // Call the controller method
      await analyticsController.getTimeSeriesDecomposition(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Verify the response
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        metricId: 'metric-123',
        decomposition: mockDecomposition
      }));
      
      // Verify the analyzer was called with correct parameters
      expect(mockTimeSeriesAnalyzer.decompose).toHaveBeenCalledWith(
        'metric-123',
        expect.any(Date),
        expect.any(Date),
        '1 day',
        7
      );
    });
    
    it('should return 400 if window size is too small', async () => {
      // Setup request with small window size
      mockRequest.params = { metricId: 'metric-123' };
      mockRequest.query = { dateRange: 'last-30-days', windowSize: '2' };
      
      // Call the controller method
      await analyticsController.getTimeSeriesDecomposition(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Verify the response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Window size must be at least 3'
      }));
    });
  });
  
  describe('detectAnomalies', () => {
    it('should return anomalies for a valid request', async () => {
      // Setup request
      mockRequest.params = { metricId: 'metric-123' };
      mockRequest.query = { dateRange: 'last-30-days', threshold: '2.5' };
      
      // Setup mock response data
      const mockTimeSeries = [
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 50 } // Anomaly
      ];
      
      const mockAnomalies = [
        { timestamp: new Date('2025-01-02'), value: 50 }
      ];
      
      mockTimeSeriesAnalyzer.getTimeSeries.mockResolvedValue(mockTimeSeries);
      mockTimeSeriesAnalyzer.detectAnomalies.mockResolvedValue(mockAnomalies);
      
      // Call the controller method
      await analyticsController.detectAnomalies(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Verify the response
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        metricId: 'metric-123',
        anomalies: mockAnomalies,
        totalPoints: 2,
        anomalyCount: 1
      }));
      
      // Verify the analyzer was called with correct parameters
      expect(mockTimeSeriesAnalyzer.detectAnomalies).toHaveBeenCalledWith(
        mockTimeSeries,
        2.5
      );
    });
  });
  
  describe('getForecast', () => {
    it('should return naive forecast for a valid request', async () => {
      // Setup request
      mockRequest.params = { metricId: 'metric-123' };
      mockRequest.query = { 
        dateRange: 'last-30-days', 
        horizon: '7',
        method: 'naive'
      };
      
      // Setup mock response data
      const mockForecast = {
        forecast: [{ timestamp: new Date('2025-02-01'), value: 15 }],
        confidence: {
          upper: [{ timestamp: new Date('2025-02-01'), value: 18 }],
          lower: [{ timestamp: new Date('2025-02-01'), value: 12 }]
        },
        accuracy: 0.8,
        method: 'naive'
      };
      
      mockForecastService.naiveForecast.mockResolvedValue(mockForecast);
      
      // Call the controller method
      await analyticsController.getForecast(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Verify the response
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        metricId: 'metric-123',
        forecast: mockForecast
      }));
      
      // Verify the forecast service was called with correct parameters
      expect(mockForecastService.naiveForecast).toHaveBeenCalledWith(
        'metric-123',
        expect.any(Date),
        expect.any(Date),
        7,
        '1 day'
      );
    });
    
    it('should return moving average forecast when method is specified', async () => {
      // Setup request
      mockRequest.params = { metricId: 'metric-123' };
      mockRequest.query = { 
        dateRange: 'last-30-days', 
        horizon: '7',
        method: 'moving_average'
      };
      
      // Setup mock response data
      const mockForecast = {
        forecast: [{ timestamp: new Date('2025-02-01'), value: 15 }],
        confidence: {
          upper: [{ timestamp: new Date('2025-02-01'), value: 18 }],
          lower: [{ timestamp: new Date('2025-02-01'), value: 12 }]
        },
        accuracy: 0.8,
        method: 'moving_average'
      };
      
      mockForecastService.movingAverageForecast.mockResolvedValue(mockForecast);
      
      // Call the controller method
      await analyticsController.getForecast(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Verify the response
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        metricId: 'metric-123',
        forecast: mockForecast
      }));
      
      // Verify the forecast service was called with correct parameters
      expect(mockForecastService.movingAverageForecast).toHaveBeenCalledWith(
        'metric-123',
        expect.any(Date),
        expect.any(Date),
        7,
        7,
        '1 day'
      );
    });
    
    it('should return 400 if forecast horizon is invalid', async () => {
      // Setup request with invalid horizon
      mockRequest.params = { metricId: 'metric-123' };
      mockRequest.query = { dateRange: 'last-30-days', horizon: '500' };
      
      // Call the controller method
      await analyticsController.getForecast(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Verify the response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Forecast horizon must be between 1 and 365'
      }));
    });
  });
  
  describe('getCorrelation', () => {
    it('should return correlation for valid metrics', async () => {
      // Setup request
      mockRequest.query = { 
        metric1: 'metric-123', 
        metric2: 'metric-456',
        dateRange: 'last-30-days'
      };
      
      // Setup mock response data
      const mockSeries1 = [
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 12 }
      ];
      
      const mockSeries2 = [
        { timestamp: new Date('2025-01-01'), value: 20 },
        { timestamp: new Date('2025-01-02'), value: 24 }
      ];
      
      mockTimeSeriesAnalyzer.getTimeSeries.mockResolvedValueOnce(mockSeries1);
      mockTimeSeriesAnalyzer.getTimeSeries.mockResolvedValueOnce(mockSeries2);
      mockTimeSeriesAnalyzer.calculateCorrelation.mockReturnValue(0.95);
      
      // Call the controller method
      await analyticsController.getCorrelation(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Verify the response
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        metric1Id: 'metric-123',
        metric2Id: 'metric-456',
        correlation: 0.95,
        interpretation: expect.stringContaining('strong positive correlation')
      }));
      
      // Verify the analyzer was called with correct parameters
      expect(mockTimeSeriesAnalyzer.calculateCorrelation).toHaveBeenCalledWith(
        mockSeries1,
        mockSeries2
      );
    });
    
    it('should return 400 if metrics have different lengths', async () => {
      // Setup request
      mockRequest.query = { 
        metric1: 'metric-123', 
        metric2: 'metric-456',
        dateRange: 'last-30-days'
      };
      
      // Setup mock response data with different lengths
      const mockSeries1 = [
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 12 }
      ];
      
      const mockSeries2 = [
        { timestamp: new Date('2025-01-01'), value: 20 }
      ];
      
      mockTimeSeriesAnalyzer.getTimeSeries.mockResolvedValueOnce(mockSeries1);
      mockTimeSeriesAnalyzer.getTimeSeries.mockResolvedValueOnce(mockSeries2);
      
      // Call the controller method
      await analyticsController.getCorrelation(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Verify the response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Time series have different lengths'
      }));
    });
    
    it('should return 400 if metrics are missing', async () => {
      // Setup request without metrics
      mockRequest.query = { dateRange: 'last-30-days' };
      
      // Call the controller method
      await analyticsController.getCorrelation(
        mockRequest as Request,
        mockResponse as Response
      );
      
      // Verify the response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Missing required parameters: metric1 and metric2'
      }));
    });
  });
  
  describe('interpretCorrelation', () => {
    it('should interpret very strong positive correlation', () => {
      const interpretation = (analyticsController as any).interpretCorrelation(0.95);
      expect(interpretation).toBe('Very strong positive correlation');
    });
    
    it('should interpret strong negative correlation', () => {
      const interpretation = (analyticsController as any).interpretCorrelation(-0.8);
      expect(interpretation).toBe('Strong negative correlation');
    });
    
    it('should interpret moderate positive correlation', () => {
      const interpretation = (analyticsController as any).interpretCorrelation(0.6);
      expect(interpretation).toBe('Moderate positive correlation');
    });
    
    it('should interpret weak negative correlation', () => {
      const interpretation = (analyticsController as any).interpretCorrelation(-0.4);
      expect(interpretation).toBe('Weak negative correlation');
    });
    
    it('should interpret very weak correlation', () => {
      const interpretation = (analyticsController as any).interpretCorrelation(0.1);
      expect(interpretation).toBe('Very weak or no correlation');
    });
  });
});
