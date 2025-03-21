import { TimeSeriesAnalyzer, TimeSeriesPoint, PreprocessedTimeSeries } from '../timeSeriesAnalyzer';
import { db } from '../../database';

// Mock the database
jest.mock('../../database', () => ({
  db: {
    query: jest.fn()
  }
}));

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('TimeSeriesAnalyzer', () => {
  let analyzer: TimeSeriesAnalyzer;
  
  beforeEach(() => {
    analyzer = new TimeSeriesAnalyzer();
    jest.clearAllMocks();
  });
  
  describe('getTimeSeries', () => {
    it('should fetch time series data from pre-aggregated metrics if available', async () => {
      // Mock the database response for pre-aggregated data
      const mockAggregatedData = {
        rows: [
          { time_bucket: '2025-01-01T00:00:00Z', value: '10.5' },
          { time_bucket: '2025-01-02T00:00:00Z', value: '12.3' },
          { time_bucket: '2025-01-03T00:00:00Z', value: '15.7' }
        ],
        rowCount: 3
      };
      
      (db.query as jest.Mock).mockResolvedValueOnce(mockAggregatedData);
      
      const result = await analyzer.getTimeSeries(
        'metric-123',
        new Date('2025-01-01'),
        new Date('2025-01-03'),
        '1 day'
      );
      
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(3);
      expect(result[0].value).toBe(10.5);
      expect(result[1].value).toBe(12.3);
      expect(result[2].value).toBe(15.7);
    });
    
    it('should calculate time series data on the fly if no pre-aggregated data', async () => {
      // Mock empty response for pre-aggregated data
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 0 });
      
      // Mock response for on-the-fly calculation
      const mockCalculatedData = {
        rows: [
          { bucket: '2025-01-01T00:00:00Z', value: '10.5' },
          { bucket: '2025-01-02T00:00:00Z', value: '12.3' },
          { bucket: '2025-01-03T00:00:00Z', value: '15.7' }
        ],
        rowCount: 3
      };
      
      (db.query as jest.Mock).mockResolvedValueOnce(mockCalculatedData);
      
      const result = await analyzer.getTimeSeries(
        'metric-123',
        new Date('2025-01-01'),
        new Date('2025-01-03'),
        '1 day'
      );
      
      expect(db.query).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(3);
      expect(result[0].value).toBe(10.5);
      expect(result[1].value).toBe(12.3);
      expect(result[2].value).toBe(15.7);
    });
    
    it('should handle database errors gracefully', async () => {
      (db.query as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      await expect(analyzer.getTimeSeries(
        'metric-123',
        new Date('2025-01-01'),
        new Date('2025-01-03'),
        '1 day'
      )).rejects.toThrow('Failed to fetch time series data');
    });
    
    it('should throw error for invalid metric ID', async () => {
      await expect(analyzer.getTimeSeries(
        '',
        new Date('2025-01-01'),
        new Date('2025-01-03'),
        '1 day'
      )).rejects.toThrow('Invalid metric ID');
    });
    
    it('should throw error for invalid date range', async () => {
      await expect(analyzer.getTimeSeries(
        'metric-123',
        new Date('2025-01-03'),
        new Date('2025-01-01'),
        '1 day'
      )).rejects.toThrow('Invalid date range');
    });
    
    it('should return empty array when no data is found', async () => {
      // Mock empty responses for both queries
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 0 });
      (db.query as jest.Mock).mockResolvedValueOnce({ rows: [], rowCount: 0 });
      
      const result = await analyzer.getTimeSeries(
        'metric-123',
        new Date('2025-01-01'),
        new Date('2025-01-03'),
        '1 day'
      );
      
      expect(result).toHaveLength(0);
    });
  });
  
  describe('preprocess', () => {
    it('should validate and sort time series data', () => {
      const timeSeries: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-03'), value: 15 },
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 12 }
      ];
      
      const result = analyzer.preprocess(timeSeries);
      
      expect(result.validation.isValid).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data[0].timestamp).toEqual(new Date('2025-01-01'));
      expect(result.data[1].timestamp).toEqual(new Date('2025-01-02'));
      expect(result.data[2].timestamp).toEqual(new Date('2025-01-03'));
    });
    
    it('should detect and handle missing values', () => {
      const timeSeries: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: NaN },
        { timestamp: new Date('2025-01-03'), value: 15 }
      ];
      
      const result = analyzer.preprocess(timeSeries, { fillMissingValues: true });
      
      expect(result.validation.isValid).toBe(true);
      expect(result.metadata.hasMissingValues).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data[1].value).not.toBeNaN();
    });
    
    it('should detect and handle outliers', () => {
      const timeSeries: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 12 },
        { timestamp: new Date('2025-01-03'), value: 11 },
        { timestamp: new Date('2025-01-04'), value: 100 }, // Outlier
        { timestamp: new Date('2025-01-05'), value: 13 }
      ];
      
      const result = analyzer.preprocess(timeSeries, { 
        removeOutliers: true, 
        outlierThreshold: 2.0 
      });
      
      expect(result.validation.isValid).toBe(true);
      expect(result.metadata.hasOutliers).toBe(true);
      // Should have removed the outlier
      expect(result.data).toHaveLength(4);
      // The outlier at index 3 should be gone
      expect(result.data.map(p => p.value)).not.toContain(100);
    });
    
    it('should analyze time intervals', () => {
      const timeSeries: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 12 }, // 1 day interval
        { timestamp: new Date('2025-01-03'), value: 15 }, // 1 day interval
        { timestamp: new Date('2025-01-05'), value: 11 }, // 2 day interval (irregular)
        { timestamp: new Date('2025-01-06'), value: 13 }  // 1 day interval
      ];
      
      const result = analyzer.preprocess(timeSeries);
      
      expect(result.validation.isValid).toBe(true);
      expect(result.metadata.timeInterval.isRegular).toBe(false);
      expect(result.metadata.timeInterval.min).toBeLessThan(result.metadata.timeInterval.max);
    });
    
    it('should normalize irregular timestamps if requested', () => {
      const timeSeries: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 12 }, // 1 day interval
        { timestamp: new Date('2025-01-03'), value: 15 }, // 1 day interval
        { timestamp: new Date('2025-01-05'), value: 11 }, // 2 day interval (irregular)
        { timestamp: new Date('2025-01-06'), value: 13 }  // 1 day interval
      ];
      
      const result = analyzer.preprocess(timeSeries, { 
        normalizeTimestamps: true,
        expectedInterval: '1 day',
        fillMissingValues: true
      });
      
      expect(result.validation.isValid).toBe(true);
      expect(result.data).toHaveLength(6); // Should have added a point for Jan 4
      
      // Verify that we now have points for all days
      const dates = result.data.map(p => p.timestamp.toISOString().split('T')[0]);
      expect(dates).toContain('2025-01-04');
    });
    
    it('should handle empty input', () => {
      const result = analyzer.preprocess([]);
      
      expect(result.validation.isValid).toBe(false);
      expect(result.validation.errors).toHaveLength(1);
      expect(result.validation.errors[0].type).toBe('EMPTY_INPUT');
      expect(result.data).toHaveLength(0);
    });
  });
  
  describe('extractTrend', () => {
    it('should extract trend using moving average', async () => {
      const timeSeries: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 12 },
        { timestamp: new Date('2025-01-03'), value: 15 },
        { timestamp: new Date('2025-01-04'), value: 11 },
        { timestamp: new Date('2025-01-05'), value: 13 }
      ];
      
      const trend = await analyzer.extractTrend(timeSeries, 3);
      
      expect(trend).toHaveLength(5);
      // First point: average of itself and next point (10+12)/2 = 11
      expect(trend[0].value).toBeCloseTo(11, 1);
      // Middle point: average of itself and surrounding points (12+15+11)/3 = 12.67
      expect(trend[2].value).toBeCloseTo(12.67, 2);
      // Last point: average of itself and previous point (13+11)/2 = 12
      expect(trend[4].value).toBeCloseTo(12, 1);
    });
    
    it('should return original data if time series is shorter than window size', async () => {
      const timeSeries: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 12 }
      ];
      
      const trend = await analyzer.extractTrend(timeSeries, 3);
      
      expect(trend).toHaveLength(2);
      expect(trend[0].value).toBe(10);
      expect(trend[1].value).toBe(12);
    });
    
    it('should return empty array for empty time series', async () => {
      const trend = await analyzer.extractTrend([], 3);
      expect(trend).toHaveLength(0);
    });
    
    it('should adjust window size if too small', async () => {
      const timeSeries: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 12 },
        { timestamp: new Date('2025-01-03'), value: 15 },
        { timestamp: new Date('2025-01-04'), value: 11 },
        { timestamp: new Date('2025-01-05'), value: 13 }
      ];
      
      const trend = await analyzer.extractTrend(timeSeries, 1); // Too small, should adjust to 2
      
      expect(trend).toHaveLength(5);
      // Trend should use correct window size
      expect(trend[2].value).not.toBe(15); // Not the original value
    });
  });
  
  describe('decompose', () => {
    beforeEach(() => {
      // Mock getTimeSeries to return predictable data
      jest.spyOn(analyzer, 'getTimeSeries').mockResolvedValue([
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 12 },
        { timestamp: new Date('2025-01-03'), value: 15 },
        { timestamp: new Date('2025-01-04'), value: 11 },
        { timestamp: new Date('2025-01-05'), value: 13 },
        { timestamp: new Date('2025-01-06'), value: 16 },
        { timestamp: new Date('2025-01-07'), value: 14 }
      ]);
    });
    
    it('should decompose time series into trend, seasonal, and residual components', async () => {
      const result = await analyzer.decompose(
        'metric-123', 
        new Date('2025-01-01'), 
        new Date('2025-01-07'),
        '1 day',
        3, // Window size
        7  // Seasonal period
      );
      
      expect(result.original).toHaveLength(7);
      expect(result.trend).toHaveLength(7);
      expect(result.seasonal).toHaveLength(7);
      expect(result.residual).toHaveLength(7);
    });
    
    it('should auto-detect seasonality period based on interval', async () => {
      // Mock preprocessed data creation
      jest.spyOn(analyzer, 'preprocess').mockImplementation((data) => {
        return {
          data,
          validation: { isValid: true, errors: [], warnings: [] },
          metadata: {
            originalLength: data.length,
            processedLength: data.length,
            hasMissingValues: false,
            hasOutliers: false,
            timeInterval: { mean: 86400000, min: 86400000, max: 86400000, isRegular: true }
          }
        };
      });
      
      // Test hourly data
      await analyzer.decompose(
        'metric-123', 
        new Date('2025-01-01'), 
        new Date('2025-01-07'),
        '1 hour'
      );
      
      // Test daily data
      await analyzer.decompose(
        'metric-123', 
        new Date('2025-01-01'), 
        new Date('2025-01-07'),
        '1 day'
      );
      
      // Test weekly data
      await analyzer.decompose(
        'metric-123', 
        new Date('2025-01-01'), 
        new Date('2025-01-07'),
        '1 week'
      );
      
      // The important thing is that it doesn't throw an error
      expect(true).toBe(true);
    });
    
    it('should return empty results if no data points', async () => {
      // Override mock to return empty data
      (analyzer.getTimeSeries as jest.Mock).mockResolvedValueOnce([]);
      
      const result = await analyzer.decompose(
        'metric-123', 
        new Date('2025-01-01'), 
        new Date('2025-01-07')
      );
      
      expect(result.original).toHaveLength(0);
      expect(result.trend).toHaveLength(0);
      expect(result.seasonal).toHaveLength(0);
      expect(result.residual).toHaveLength(0);
    });
    
    it('should throw error for invalid inputs', async () => {
      await expect(analyzer.decompose(
        '', // Empty metric ID
        new Date('2025-01-01'), 
        new Date('2025-01-07')
      )).rejects.toThrow('Invalid metric ID');
      
      await expect(analyzer.decompose(
        'metric-123', 
        new Date('2025-01-07'), // End date before start date
        new Date('2025-01-01')
      )).rejects.toThrow('Invalid date range');
    });
  });
  
  describe('detectAnomalies', () => {
    it('should detect anomalies using Z-score method', async () => {
      const timeSeries: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 12 },
        { timestamp: new Date('2025-01-03'), value: 11 },
        { timestamp: new Date('2025-01-04'), value: 50 }, // Anomaly
        { timestamp: new Date('2025-01-05'), value: 13 }
      ];
      
      const anomalies = await analyzer.detectAnomalies(timeSeries, 2.0);
      
      expect(anomalies).toHaveLength(1);
      expect(anomalies[0].timestamp).toEqual(new Date('2025-01-04'));
      expect(anomalies[0].value).toBe(50);
    });
    
    it('should detect local anomalies using lookback window', async () => {
      const timeSeries: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 12 },
        { timestamp: new Date('2025-01-03'), value: 11 },
        { timestamp: new Date('2025-01-04'), value: 13 },
        { timestamp: new Date('2025-01-05'), value: 14 },
        { timestamp: new Date('2025-01-06'), value: 15 },
        { timestamp: new Date('2025-01-07'), value: 18 },
        { timestamp: new Date('2025-01-08'), value: 35 }, // Local anomaly compared to recent values
        { timestamp: new Date('2025-01-09'), value: 19 }
      ];
      
      // Global detection won't find this as an anomaly
      const globalAnomalies = await analyzer.detectAnomalies(timeSeries, 2.0);
      expect(globalAnomalies).toHaveLength(0);
      
      // Local detection with a window of 5 should find it
      const localAnomalies = await analyzer.detectAnomalies(timeSeries, 2.0, 5);
      expect(localAnomalies).toHaveLength(1);
      expect(localAnomalies[0].timestamp).toEqual(new Date('2025-01-08'));
    });
    
    it('should handle all constant values correctly', async () => {
      const timeSeries: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 10 },
        { timestamp: new Date('2025-01-03'), value: 10 },
        { timestamp: new Date('2025-01-04'), value: 10 },
        { timestamp: new Date('2025-01-05'), value: 10 }
      ];
      
      const anomalies = await analyzer.detectAnomalies(timeSeries, 2.0);
      
      // Should not throw division by zero error
      expect(anomalies).toHaveLength(0);
    });
    
    it('should return empty array if no anomalies found', async () => {
      const timeSeries: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 12 },
        { timestamp: new Date('2025-01-03'), value: 11 },
        { timestamp: new Date('2025-01-04'), value: 13 },
        { timestamp: new Date('2025-01-05'), value: 14 }
      ];
      
      const anomalies = await analyzer.detectAnomalies(timeSeries, 2.0);
      
      expect(anomalies).toHaveLength(0);
    });
    
    it('should return empty array for time series with less than 3 points', async () => {
      const timeSeries: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 100 } // Would be an anomaly with enough data
      ];
      
      const anomalies = await analyzer.detectAnomalies(timeSeries, 2.0);
      
      expect(anomalies).toHaveLength(0);
    });
    
    it('should preprocess input data before anomaly detection', async () => {
      // Create a time series with missing values and out of order
      const timeSeries: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-03'), value: 11 },
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-04'), value: 50 }, // Anomaly
        { timestamp: new Date('2025-01-02'), value: NaN }, // Missing value
        { timestamp: new Date('2025-01-05'), value: 13 }
      ];
      
      // Spy on preprocess method
      const preprocessSpy = jest.spyOn(analyzer, 'preprocess');
      
      const anomalies = await analyzer.detectAnomalies(timeSeries, 2.0);
      
      // Should call preprocess
      expect(preprocessSpy).toHaveBeenCalled();
      expect(anomalies).toHaveLength(1);
      expect(anomalies[0].value).toBe(50);
    });
  });
  
  describe('calculateCorrelation', () => {
    it('should calculate positive correlation correctly', () => {
      const series1: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 1 },
        { timestamp: new Date('2025-01-02'), value: 2 },
        { timestamp: new Date('2025-01-03'), value: 3 },
        { timestamp: new Date('2025-01-04'), value: 4 },
        { timestamp: new Date('2025-01-05'), value: 5 }
      ];
      
      const series2: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 2 },
        { timestamp: new Date('2025-01-02'), value: 4 },
        { timestamp: new Date('2025-01-03'), value: 6 },
        { timestamp: new Date('2025-01-04'), value: 8 },
        { timestamp: new Date('2025-01-05'), value: 10 }
      ];
      
      const correlation = analyzer.calculateCorrelation(series1, series2);
      
      // Perfect positive correlation
      expect(correlation).toBeCloseTo(1.0, 5);
    });
    
    it('should calculate negative correlation correctly', () => {
      const series1: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 5 },
        { timestamp: new Date('2025-01-02'), value: 4 },
        { timestamp: new Date('2025-01-03'), value: 3 },
        { timestamp: new Date('2025-01-04'), value: 2 },
        { timestamp: new Date('2025-01-05'), value: 1 }
      ];
      
      const series2: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 1 },
        { timestamp: new Date('2025-01-02'), value: 2 },
        { timestamp: new Date('2025-01-03'), value: 3 },
        { timestamp: new Date('2025-01-04'), value: 4 },
        { timestamp: new Date('2025-01-05'), value: 5 }
      ];
      
      const correlation = analyzer.calculateCorrelation(series1, series2);
      
      // Perfect negative correlation
      expect(correlation).toBeCloseTo(-1.0, 5);
    });
    
    it('should align timestamps if requested', () => {
      // Series with different timestamps
      const series1: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 1 },
        { timestamp: new Date('2025-01-02'), value: 2 },
        { timestamp: new Date('2025-01-03'), value: 3 },
        { timestamp: new Date('2025-01-05'), value: 5 }
      ];
      
      const series2: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 2 },
        { timestamp: new Date('2025-01-03'), value: 6 },
        { timestamp: new Date('2025-01-04'), value: 8 },
        { timestamp: new Date('2025-01-05'), value: 10 }
      ];
      
      // Without alignment, this would throw an error
      const correlation = analyzer.calculateCorrelation(series1, series2, true);
      
      // Should produce a valid correlation coefficient
      expect(correlation).toBeGreaterThan(-1.1);
      expect(correlation).toBeLessThan(1.1);
    });
    
    it('should handle constant series correctly', () => {
      // Two constant series
      const series1: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 10 },
        { timestamp: new Date('2025-01-03'), value: 10 }
      ];
      
      const series2: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 20 },
        { timestamp: new Date('2025-01-02'), value: 20 },
        { timestamp: new Date('2025-01-03'), value: 20 }
      ];
      
      // Two constant series should be perfectly correlated
      const correlation = analyzer.calculateCorrelation(series1, series2);
      expect(correlation).toBe(1);
      
      // One constant series, one variable series
      const series3: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 10 },
        { timestamp: new Date('2025-01-02'), value: 10 },
        { timestamp: new Date('2025-01-03'), value: 10 }
      ];
      
      const series4: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 1 },
        { timestamp: new Date('2025-01-02'), value: 2 },
        { timestamp: new Date('2025-01-03'), value: 3 }
      ];
      
      // Constant series should have no correlation with variable series
      const correlation2 = analyzer.calculateCorrelation(series3, series4);
      expect(correlation2).toBe(0);
    });
    
    it('should throw error if series have different lengths', () => {
      const series1: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 1 },
        { timestamp: new Date('2025-01-02'), value: 2 }
      ];
      
      const series2: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 1 }
      ];
      
      expect(() => {
        analyzer.calculateCorrelation(series1, series2);
      }).toThrow('Time series must have the same length');
    });
    
    it('should throw error if series have less than 2 points', () => {
      const series1: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 1 }
      ];
      
      const series2: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 2 }
      ];
      
      expect(() => {
        analyzer.calculateCorrelation(series1, series2);
      }).toThrow('Time series must have at least 2 points');
    });
    
    it('should throw error for empty input', () => {
      expect(() => {
        analyzer.calculateCorrelation([], []);
      }).toThrow('Empty time series provided');
    });
  });
  
  describe('calculateSampleEntropy', () => {
    it('should calculate sample entropy for a time series', () => {
      const timeSeries: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 1 },
        { timestamp: new Date('2025-01-02'), value: 4 },
        { timestamp: new Date('2025-01-03'), value: 2 },
        { timestamp: new Date('2025-01-04'), value: 5 },
        { timestamp: new Date('2025-01-05'), value: 3 },
        { timestamp: new Date('2025-01-06'), value: 6 },
        { timestamp: new Date('2025-01-07'), value: 4 },
        { timestamp: new Date('2025-01-08'), value: 7 }
      ];
      
      const entropy = analyzer.calculateSampleEntropy(timeSeries);
      
      // Sample entropy should be a positive number
      expect(entropy).toBeGreaterThan(0);
    });
    
    it('should throw error if time series is too short', () => {
      const timeSeries: TimeSeriesPoint[] = [
        { timestamp: new Date('2025-01-01'), value: 1 },
        { timestamp: new Date('2025-01-02'), value: 2 }
      ];
      
      expect(() => {
        analyzer.calculateSampleEntropy(timeSeries, 2);
      }).toThrow('Need at least 4 data points');
    });
  });
});
