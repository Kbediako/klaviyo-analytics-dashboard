import { ForecastService } from '../forecastService';
import { TimeSeriesAnalyzer, TimeSeriesPoint } from '../timeSeriesAnalyzer';

// Mock the TimeSeriesAnalyzer
jest.mock('../timeSeriesAnalyzer', () => {
  const originalModule = jest.requireActual('../timeSeriesAnalyzer');
  
  return {
    ...originalModule,
    TimeSeriesAnalyzer: jest.fn().mockImplementation(() => ({
      getTimeSeries: jest.fn()
    }))
  };
});

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('ForecastService', () => {
  let forecastService: ForecastService;
  let mockTimeSeriesAnalyzer: jest.Mocked<TimeSeriesAnalyzer>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    forecastService = new ForecastService();
    mockTimeSeriesAnalyzer = new TimeSeriesAnalyzer() as jest.Mocked<TimeSeriesAnalyzer>;
  });
  
  describe('naiveForecast', () => {
    it('should generate a naive forecast with confidence intervals', async () => {
      // Mock historical data
      const historicalData: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 12 },
        { timestamp: new Date('2025-01-03'), value: 11 },
        { timestamp: new Date('2025-01-04'), value: 13 },
        { timestamp: new Date('2025-01-05'), value: 15 }
      ];
      
      // Setup mock
      mockTimeSeriesAnalyzer.getTimeSeries.mockResolvedValue(historicalData);
      (TimeSeriesAnalyzer as jest.Mock).mockImplementation(() => mockTimeSeriesAnalyzer);
      
      // Call the method
      const result = await forecastService.naiveForecast(
        'metric-123',
        new Date('2025-01-01'),
        new Date('2025-01-05'),
        3,
        '1 day'
      );
      
      // Verify the forecast
      expect(result.forecast).toHaveLength(3);
      expect(result.confidence.upper).toHaveLength(3);
      expect(result.confidence.lower).toHaveLength(3);
      
      // Last value should be used for all forecast points
      expect(result.forecast[0].value).toBe(15);
      expect(result.forecast[1].value).toBe(15);
      expect(result.forecast[2].value).toBe(15);
      
      // Confidence intervals should be wider than the forecast value
      expect(result.confidence.upper[0].value).toBeGreaterThan(15);
      expect(result.confidence.lower[0].value).toBeLessThan(15);
      
      // Method should be 'naive'
      expect(result.method).toBe('naive');
    });
    
    it('should throw an error if no historical data is available', async () => {
      // Setup mock to return empty array
      mockTimeSeriesAnalyzer.getTimeSeries.mockResolvedValue([]);
      (TimeSeriesAnalyzer as jest.Mock).mockImplementation(() => mockTimeSeriesAnalyzer);
      
      // Expect the method to throw an error
      await expect(forecastService.naiveForecast(
        'metric-123',
        new Date('2025-01-01'),
        new Date('2025-01-05'),
        3,
        '1 day'
      )).rejects.toThrow('Not enough data for forecasting');
    });
  });
  
  describe('movingAverageForecast', () => {
    it('should generate a moving average forecast with confidence intervals', async () => {
      // Mock historical data
      const historicalData: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 12 },
        { timestamp: new Date('2025-01-03'), value: 11 },
        { timestamp: new Date('2025-01-04'), value: 13 },
        { timestamp: new Date('2025-01-05'), value: 15 },
        { timestamp: new Date('2025-01-06'), value: 14 },
        { timestamp: new Date('2025-01-07'), value: 16 }
      ];
      
      // Setup mock
      mockTimeSeriesAnalyzer.getTimeSeries.mockResolvedValue(historicalData);
      (TimeSeriesAnalyzer as jest.Mock).mockImplementation(() => mockTimeSeriesAnalyzer);
      
      // Call the method with window size 3
      const result = await forecastService.movingAverageForecast(
        'metric-123',
        new Date('2025-01-01'),
        new Date('2025-01-07'),
        2,
        3,
        '1 day'
      );
      
      // Verify the forecast
      expect(result.forecast).toHaveLength(2);
      expect(result.confidence.upper).toHaveLength(2);
      expect(result.confidence.lower).toHaveLength(2);
      
      // Moving average of last 3 points should be (14+15+16)/3 = 15
      expect(result.forecast[0].value).toBeCloseTo(15, 1);
      expect(result.forecast[1].value).toBeCloseTo(15, 1);
      
      // Confidence intervals should be wider than the forecast value
      expect(result.confidence.upper[0].value).toBeGreaterThan(15);
      expect(result.confidence.lower[0].value).toBeLessThan(15);
      
      // Method should be 'moving_average'
      expect(result.method).toBe('moving_average');
    });
    
    it('should throw an error if not enough historical data is available', async () => {
      // Setup mock to return insufficient data
      mockTimeSeriesAnalyzer.getTimeSeries.mockResolvedValue([
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 12 }
      ]);
      (TimeSeriesAnalyzer as jest.Mock).mockImplementation(() => mockTimeSeriesAnalyzer);
      
      // Expect the method to throw an error when window size is 3
      await expect(forecastService.movingAverageForecast(
        'metric-123',
        new Date('2025-01-01'),
        new Date('2025-01-02'),
        2,
        3,
        '1 day'
      )).rejects.toThrow('Not enough data for forecasting');
    });
  });
  
  describe('linearRegressionForecast', () => {
    it('should generate a linear regression forecast with confidence intervals', async () => {
      // Mock historical data with a clear upward trend
      const historicalData: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 12 },
        { timestamp: new Date('2025-01-03'), value: 14 },
        { timestamp: new Date('2025-01-04'), value: 16 },
        { timestamp: new Date('2025-01-05'), value: 18 }
      ];
      
      // Setup mock
      mockTimeSeriesAnalyzer.getTimeSeries.mockResolvedValue(historicalData);
      (TimeSeriesAnalyzer as jest.Mock).mockImplementation(() => mockTimeSeriesAnalyzer);
      
      // Call the method
      const result = await forecastService.linearRegressionForecast(
        'metric-123',
        new Date('2025-01-01'),
        new Date('2025-01-05'),
        3,
        '1 day'
      );
      
      // Verify the forecast
      expect(result.forecast).toHaveLength(3);
      expect(result.confidence.upper).toHaveLength(3);
      expect(result.confidence.lower).toHaveLength(3);
      
      // With a perfect linear trend of +2 per day, next values should be 20, 22, 24
      // Allow some floating point imprecision
      expect(result.forecast[0].value).toBeCloseTo(20, 1);
      expect(result.forecast[1].value).toBeCloseTo(22, 1);
      expect(result.forecast[2].value).toBeCloseTo(24, 1);
      
      // Confidence intervals should exist
      expect(result.confidence.upper[0].value).toBeGreaterThan(result.forecast[0].value);
      expect(result.confidence.lower[0].value).toBeLessThan(result.forecast[0].value);
      
      // Method should be 'linear_regression'
      expect(result.method).toBe('linear_regression');
      
      // R-squared should be close to 1 for perfect linear data
      expect(result.accuracy).toBeCloseTo(1, 2);
    });
    
    it('should throw an error if not enough historical data is available', async () => {
      // Setup mock to return insufficient data
      mockTimeSeriesAnalyzer.getTimeSeries.mockResolvedValue([
        { timestamp: new Date('2025-01-01'), value: 10 }
      ]);
      (TimeSeriesAnalyzer as jest.Mock).mockImplementation(() => mockTimeSeriesAnalyzer);
      
      // Expect the method to throw an error
      await expect(forecastService.linearRegressionForecast(
        'metric-123',
        new Date('2025-01-01'),
        new Date('2025-01-01'),
        3,
        '1 day'
      )).rejects.toThrow('Not enough data for forecasting');
    });
  });
  
  describe('calculateAccuracy', () => {
    it('should return a default value for short time series', () => {
      // Create a private method accessor
      const calculateAccuracy = (forecastService as any).calculateAccuracy.bind(forecastService);
      
      const shortTimeSeries: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 12 },
        { timestamp: new Date('2025-01-03'), value: 14 }
      ];
      
      const accuracy = calculateAccuracy(shortTimeSeries);
      
      // Default value should be 0.5
      expect(accuracy).toBe(0.5);
    });
    
    it('should calculate accuracy based on validation data', () => {
      // Create a private method accessor
      const calculateAccuracy = (forecastService as any).calculateAccuracy.bind(forecastService);
      
      // Create time series with stable values followed by a spike
      const timeSeries: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 10 },
        { timestamp: new Date('2025-01-03'), value: 10 },
        { timestamp: new Date('2025-01-04'), value: 10 },
        { timestamp: new Date('2025-01-05'), value: 20 }, // Validation point 1
        { timestamp: new Date('2025-01-06'), value: 20 }, // Validation point 2
        { timestamp: new Date('2025-01-07'), value: 20 }  // Validation point 3
      ];
      
      const accuracy = calculateAccuracy(timeSeries);
      
      // Accuracy should be less than 1 due to the error
      expect(accuracy).toBeLessThan(1);
      // But should be greater than 0
      expect(accuracy).toBeGreaterThan(0);
    });
  });
});
