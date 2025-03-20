import { TimeSeriesAnalyzer, TimeSeriesPoint } from '../timeSeriesAnalyzer';
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
      }).toThrow('Time series must have the same length and at least 2 points');
    });
  });
});
