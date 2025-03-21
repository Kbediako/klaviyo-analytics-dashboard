import { PerformanceOptimizer, ComputationCache } from '../performanceOptimizer';
import { TimeSeriesPoint } from '../timeSeriesAnalyzer';

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('PerformanceOptimizer', () => {
  let optimizer: PerformanceOptimizer;
  
  beforeEach(() => {
    optimizer = new PerformanceOptimizer();
    jest.clearAllMocks();
  });
  
  describe('downsampleTimeSeries', () => {
    // Create a large time series for testing
    const createLargeTimeSeries = (length: number): TimeSeriesPoint[] => {
      const result: TimeSeriesPoint[] = [];
      const baseDate = new Date('2025-01-01').getTime();
      
      for (let i = 0; i < length; i++) {
        result.push({
          timestamp: new Date(baseDate + i * 60000), // 1-minute intervals
          value: Math.sin(i * 0.1) * 10 + Math.random() * 2 // Sine wave with noise
        });
      }
      
      return result;
    };
    
    it('should return original series if below target points', () => {
      const timeSeries = createLargeTimeSeries(50);
      const result = optimizer.downsampleTimeSeries(timeSeries, { targetPoints: 100 });
      
      expect(result.length).toBe(timeSeries.length);
    });
    
    it('should downsample to target number of points using LTTB by default', () => {
      const timeSeries = createLargeTimeSeries(1000);
      const targetPoints = 100;
      
      const result = optimizer.downsampleTimeSeries(timeSeries, { targetPoints });
      
      // Should have target number of points
      expect(result.length).toBe(targetPoints);
      
      // First and last points should be the same as the original
      expect(result[0].timestamp).toEqual(timeSeries[0].timestamp);
      expect(result[result.length - 1].timestamp).toEqual(timeSeries[timeSeries.length - 1].timestamp);
    });
    
    it('should downsample using min-max method', () => {
      const timeSeries = createLargeTimeSeries(1000);
      const targetPoints = 100;
      
      const result = optimizer.downsampleTimeSeries(timeSeries, { 
        targetPoints,
        method: 'min-max'
      });
      
      // Should have roughly target number of points
      expect(result.length).toBeLessThanOrEqual(targetPoints);
      expect(result.length).toBeGreaterThanOrEqual(targetPoints - 10);
      
      // First and last points should be the same as the original
      expect(result[0].timestamp).toEqual(timeSeries[0].timestamp);
      expect(result[result.length - 1].timestamp).toEqual(timeSeries[timeSeries.length - 1].timestamp);
    });
    
    it('should downsample using average method', () => {
      const timeSeries = createLargeTimeSeries(1000);
      const targetPoints = 100;
      
      const result = optimizer.downsampleTimeSeries(timeSeries, { 
        targetPoints,
        method: 'average'
      });
      
      // Should have target number of points
      expect(result.length).toBeLessThanOrEqual(targetPoints);
      
      // Average should smooth out the data
      const originalVariance = calculateVariance(timeSeries.map(p => p.value));
      const resultVariance = calculateVariance(result.map(p => p.value));
      
      // Variance should be smaller in the averaged result
      expect(resultVariance).toBeLessThan(originalVariance);
    });
    
    it('should downsample using first-last-significant method', () => {
      const timeSeries = createLargeTimeSeries(1000);
      const targetPoints = 100;
      
      const result = optimizer.downsampleTimeSeries(timeSeries, { 
        targetPoints,
        method: 'first-last-significant',
        significanceThreshold: 0.1
      });
      
      // Should have target number of points or less
      expect(result.length).toBeLessThanOrEqual(targetPoints);
      
      // First and last points should be the same as the original
      expect(result[0].timestamp).toEqual(timeSeries[0].timestamp);
      expect(result[result.length - 1].timestamp).toEqual(timeSeries[timeSeries.length - 1].timestamp);
    });
    
    // Helper to calculate variance
    function calculateVariance(values: number[]): number {
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
      return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    }
  });
  
  describe('processInChunks', () => {
    it('should process large arrays in chunks', async () => {
      const items = Array.from({ length: 1000 }, (_, i) => i);
      const chunkSize = 100;
      
      // Simple processor that doubles each number
      const processor = async (chunk: number[]): Promise<number[]> => {
        return chunk.map(n => n * 2);
      };
      
      const result = await optimizer.processInChunks(items, chunkSize, processor);
      
      // Should get results for all items
      expect(result.length).toBe(items.length);
      
      // Each item should be doubled
      expect(result[0]).toBe(0);
      expect(result[10]).toBe(20);
      expect(result[999]).toBe(1998);
    });
    
    it('should return empty array for empty input', async () => {
      const processor = async (chunk: number[]): Promise<number[]> => {
        return chunk.map(n => n * 2);
      };
      
      const result = await optimizer.processInChunks([], 100, processor);
      expect(result.length).toBe(0);
    });
    
    it('should throw error for invalid chunk size', async () => {
      const items = [1, 2, 3];
      const processor = async (chunk: number[]): Promise<number[]> => {
        return chunk.map(n => n * 2);
      };
      
      await expect(optimizer.processInChunks(items, 0, processor))
        .rejects.toThrow('Chunk size must be positive');
    });
  });
  
  describe('processInParallelChunks', () => {
    it('should process large arrays in parallel chunks', async () => {
      const items = Array.from({ length: 1000 }, (_, i) => i);
      const chunkSize = 100;
      const concurrentChunks = 2;
      
      // Simple processor that doubles each number
      const processor = async (chunk: number[]): Promise<number[]> => {
        return chunk.map(n => n * 2);
      };
      
      const result = await optimizer.processInParallelChunks(items, chunkSize, concurrentChunks, processor);
      
      // Should get results for all items
      expect(result.length).toBe(items.length);
      
      // Each item should be doubled
      expect(result[0]).toBe(0);
      expect(result[10]).toBe(20);
      expect(result[999]).toBe(1998);
    });
    
    it('should return empty array for empty input', async () => {
      const processor = async (chunk: number[]): Promise<number[]> => {
        return chunk.map(n => n * 2);
      };
      
      const result = await optimizer.processInParallelChunks([], 100, 2, processor);
      expect(result.length).toBe(0);
    });
    
    it('should throw error for invalid chunk size', async () => {
      const items = [1, 2, 3];
      const processor = async (chunk: number[]): Promise<number[]> => {
        return chunk.map(n => n * 2);
      };
      
      await expect(optimizer.processInParallelChunks(items, 0, 2, processor))
        .rejects.toThrow('Chunk size must be positive');
    });
    
    it('should throw error for invalid concurrent chunks', async () => {
      const items = [1, 2, 3];
      const processor = async (chunk: number[]): Promise<number[]> => {
        return chunk.map(n => n * 2);
      };
      
      await expect(optimizer.processInParallelChunks(items, 2, 0, processor))
        .rejects.toThrow('Concurrent chunks must be positive');
    });
  });
});

describe('ComputationCache', () => {
  let cache: ComputationCache<string, number>;
  
  beforeEach(() => {
    cache = new ComputationCache<string, number>({
      maxEntries: 10,
      defaultTTL: 1000 // 1 second
    });
  });
  
  it('should cache and retrieve values', () => {
    cache.set('test', 123);
    expect(cache.get('test')).toBe(123);
    
    cache.set('test2', 456);
    expect(cache.get('test2')).toBe(456);
  });
  
  it('should return undefined for non-existent keys', () => {
    expect(cache.get('nonexistent')).toBeUndefined();
  });
  
  it('should respect TTL for cached values', async () => {
    cache.set('expires-soon', 123, 50); // Expires in 50ms
    
    expect(cache.get('expires-soon')).toBe(123);
    
    // Wait for expiry
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(cache.get('expires-soon')).toBeUndefined();
  });
  
  it('should respect maxAge parameter', async () => {
    cache.set('test', 123, 5000); // Expires in 5 seconds
    
    expect(cache.get('test')).toBe(123);
    
    // Should be undefined with maxAge of 1ms
    expect(cache.get('test', 1)).toBeUndefined();
  });
  
  it('should compute and cache values on-demand', async () => {
    let computeCount = 0;
    const compute = async () => {
      computeCount++;
      return 42;
    };
    
    // First call should compute
    const result1 = await cache.getOrCompute('computed', compute);
    expect(result1).toBe(42);
    expect(computeCount).toBe(1);
    
    // Second call should use cache
    const result2 = await cache.getOrCompute('computed', compute);
    expect(result2).toBe(42);
    expect(computeCount).toBe(1); // Still 1, didn't recompute
    
    // After expiry, should recompute
    await new Promise(resolve => setTimeout(resolve, 1100));
    const result3 = await cache.getOrCompute('computed', compute);
    expect(result3).toBe(42);
    expect(computeCount).toBe(2); // Recomputed
  });
  
  it('should evict oldest entries when cache is full', () => {
    // Fill the cache
    for (let i = 0; i < 10; i++) {
      cache.set(`key${i}`, i);
    }
    
    // Verify all entries exist
    for (let i = 0; i < 10; i++) {
      expect(cache.get(`key${i}`)).toBe(i);
    }
    
    // Add one more entry
    cache.set('new-entry', 999);
    
    // The oldest entry should be evicted
    expect(cache.get('key0')).toBeUndefined();
    expect(cache.get('new-entry')).toBe(999);
  });
  
  it('should clear the cache', () => {
    cache.set('test1', 1);
    cache.set('test2', 2);
    
    expect(cache.size()).toBe(2);
    
    cache.clear();
    
    expect(cache.size()).toBe(0);
    expect(cache.get('test1')).toBeUndefined();
  });
  
  it('should remove specific keys', () => {
    cache.set('test1', 1);
    cache.set('test2', 2);
    
    cache.remove('test1');
    
    expect(cache.get('test1')).toBeUndefined();
    expect(cache.get('test2')).toBe(2);
  });
  
  it('should handle complex keys', () => {
    const complexKey = { id: 123, name: 'test' };
    
    cache.set(complexKey, 456);
    
    expect(cache.get(complexKey)).toBe(456);
    expect(cache.get({ id: 123, name: 'test' })).toBe(456); // Should match equivalent key
  });
});