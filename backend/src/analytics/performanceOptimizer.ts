import { TimeSeriesPoint } from './timeSeriesAnalyzer';
import { logger } from '../utils/logger';

/**
 * Interface for cache entry
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Interface for compute cache options
 */
interface ComputeCacheOptions {
  /**
   * Maximum number of entries to store in cache
   */
  maxEntries?: number;
  /**
   * Default time-to-live in milliseconds
   */
  defaultTTL?: number;
}

/**
 * Interface for downsampling options
 */
export interface DownsamplingOptions {
  /**
   * Target number of points
   */
  targetPoints?: number;
  /**
   * Method to use for downsampling
   */
  method?: 'min-max' | 'lttb' | 'average' | 'first-last-significant';
  /**
   * Minimum threshold for considering a point significant
   * (percentage of range, used in first-last-significant method)
   */
  significanceThreshold?: number;
}

/**
 * Class that provides performance optimization techniques for time series data
 */
export class PerformanceOptimizer {
  /**
   * Downsample a time series to a smaller number of points while preserving visual patterns
   * 
   * @param timeSeries Original time series data
   * @param options Downsampling options
   * @returns Downsampled time series
   */
  downsampleTimeSeries(
    timeSeries: TimeSeriesPoint[],
    options: DownsamplingOptions = {}
  ): TimeSeriesPoint[] {
    const {
      targetPoints = 100,
      method = 'lttb',
      significanceThreshold = 0.1
    } = options;
    
    logger.debug(`Downsampling ${timeSeries.length} points to ${targetPoints} using ${method} method`);
    
    // If we already have fewer points than target, return original
    if (timeSeries.length <= targetPoints) {
      return [...timeSeries];
    }
    
    // Sort by timestamp to ensure correct ordering
    const sortedData = [...timeSeries].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    // Choose downsampling method
    switch (method) {
      case 'min-max':
        return this.downsampleMinMax(sortedData, targetPoints);
      case 'lttb':
        return this.downsampleLTTB(sortedData, targetPoints);
      case 'average':
        return this.downsampleAverage(sortedData, targetPoints);
      case 'first-last-significant':
        return this.downsampleFirstLastSignificant(sortedData, targetPoints, significanceThreshold);
      default:
        logger.warn(`Unknown downsampling method: ${method}, using LTTB`);
        return this.downsampleLTTB(sortedData, targetPoints);
    }
  }
  
  /**
   * Process a large array of items in chunks to avoid memory issues
   * 
   * @param items Array of items to process
   * @param chunkSize Size of each chunk
   * @param processor Function to process each chunk
   * @returns Array of processed results
   */
  async processInChunks<T, R>(
    items: T[],
    chunkSize: number,
    processor: (chunk: T[]) => Promise<R[]>
  ): Promise<R[]> {
    logger.debug(`Processing ${items.length} items in chunks of ${chunkSize}`);
    
    if (items.length === 0) {
      return [];
    }
    
    if (chunkSize <= 0) {
      throw new Error('Chunk size must be positive');
    }
    
    const result: R[] = [];
    
    // Process in chunks
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const chunkResult = await processor(chunk);
      result.push(...chunkResult);
      
      // Allow event loop to progress
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    return result;
  }
  
  /**
   * Process a large array of items in parallel chunks for better performance
   * 
   * @param items Array of items to process
   * @param chunkSize Size of each chunk
   * @param concurrentChunks Number of chunks to process concurrently
   * @param processor Function to process each chunk
   * @returns Array of processed results
   */
  async processInParallelChunks<T, R>(
    items: T[],
    chunkSize: number,
    concurrentChunks: number,
    processor: (chunk: T[]) => Promise<R[]>
  ): Promise<R[]> {
    logger.debug(`Processing ${items.length} items in ${concurrentChunks} parallel chunks of ${chunkSize}`);
    
    if (items.length === 0) {
      return [];
    }
    
    if (chunkSize <= 0) {
      throw new Error('Chunk size must be positive');
    }
    
    if (concurrentChunks <= 0) {
      throw new Error('Concurrent chunks must be positive');
    }
    
    const chunks: T[][] = [];
    
    // Split into chunks
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }
    
    const results: R[] = [];
    
    // Process chunks in batches
    for (let i = 0; i < chunks.length; i += concurrentChunks) {
      const batchChunks = chunks.slice(i, i + concurrentChunks);
      const batchPromises = batchChunks.map(chunk => processor(chunk));
      const batchResults = await Promise.all(batchPromises);
      
      // Flatten and add to results
      for (const result of batchResults) {
        results.push(...result);
      }
    }
    
    return results;
  }
  
  /**
   * A generic computation cache with time-based expiration
   */
  createComputationCache<K, V>(options: ComputeCacheOptions = {}): ComputationCache<K, V> {
    return new ComputationCache<K, V>(options);
  }
  
  /**
   * Min-max downsampling: Keep min and max values in each bucket
   * Good for preserving peaks and valleys
   */
  private downsampleMinMax(timeSeries: TimeSeriesPoint[], targetPoints: number): TimeSeriesPoint[] {
    // Ensure target points is even to accommodate min/max pairs
    const adjustedTargetPoints = Math.floor(targetPoints / 2) * 2;
    const bucketSize = Math.ceil(timeSeries.length / (adjustedTargetPoints / 2));
    
    const result: TimeSeriesPoint[] = [];
    
    // Add first point
    result.push(timeSeries[0]);
    
    // Process each bucket (except first and last points)
    for (let i = 0; i < Math.floor(timeSeries.length / bucketSize); i++) {
      const bucketStart = 1 + i * bucketSize;
      const bucketEnd = Math.min(bucketStart + bucketSize, timeSeries.length - 1);
      
      if (bucketStart >= bucketEnd) continue;
      
      const bucket = timeSeries.slice(bucketStart, bucketEnd);
      
      // Find min and max in this bucket
      let minPoint = bucket[0];
      let maxPoint = bucket[0];
      
      for (let j = 1; j < bucket.length; j++) {
        if (bucket[j].value < minPoint.value) {
          minPoint = bucket[j];
        }
        if (bucket[j].value > maxPoint.value) {
          maxPoint = bucket[j];
        }
      }
      
      // Add min and max to result in chronological order
      if (minPoint.timestamp.getTime() <= maxPoint.timestamp.getTime()) {
        result.push(minPoint);
        result.push(maxPoint);
      } else {
        result.push(maxPoint);
        result.push(minPoint);
      }
    }
    
    // Add last point if not already added
    if (result[result.length - 1] !== timeSeries[timeSeries.length - 1]) {
      result.push(timeSeries[timeSeries.length - 1]);
    }
    
    return result;
  }
  
  /**
   * Largest Triangle Three Buckets (LTTB) downsampling algorithm
   * Excellent for maintaining visual patterns in line charts
   */
  private downsampleLTTB(timeSeries: TimeSeriesPoint[], targetPoints: number): TimeSeriesPoint[] {
    // We need at least 3 points for this algorithm
    if (timeSeries.length <= targetPoints || targetPoints < 3) {
      return [...timeSeries];
    }
    
    const result: TimeSeriesPoint[] = [];
    
    // Always add first point
    result.push(timeSeries[0]);
    
    // Calculate effective points needed (minus first and last point)
    const effectiveTargetPoints = targetPoints - 2;
    const bucketSize = (timeSeries.length - 2) / effectiveTargetPoints;
    
    let lastSelectedIndex = 0;
    
    for (let i = 0; i < effectiveTargetPoints; i++) {
      // Next bucket boundaries
      const nextBucketStart = Math.floor((i + 1) * bucketSize) + 1;
      const nextBucketEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, timeSeries.length - 1);
      
      // Current bucket
      const currentBucketStart = Math.floor(i * bucketSize) + 1;
      const currentBucketEnd = Math.floor((i + 1) * bucketSize) + 1;
      
      // Find average point in next bucket
      let avgX = 0;
      let avgY = 0;
      
      for (let j = nextBucketStart; j < nextBucketEnd; j++) {
        avgX += timeSeries[j].timestamp.getTime();
        avgY += timeSeries[j].value;
      }
      
      avgX /= (nextBucketEnd - nextBucketStart);
      avgY /= (nextBucketEnd - nextBucketStart);
      
      // Point with the largest triangle
      let maxArea = -1;
      let maxAreaIndex = currentBucketStart;
      
      // Last selected point
      const lastPointX = timeSeries[lastSelectedIndex].timestamp.getTime();
      const lastPointY = timeSeries[lastSelectedIndex].value;
      
      for (let j = currentBucketStart; j < currentBucketEnd; j++) {
        const currentPointX = timeSeries[j].timestamp.getTime();
        const currentPointY = timeSeries[j].value;
        
        // Calculate area of triangle
        const area = Math.abs(
          (lastPointX - avgX) * (currentPointY - lastPointY) -
          (lastPointX - currentPointX) * (avgY - lastPointY)
        ) * 0.5;
        
        if (area > maxArea) {
          maxArea = area;
          maxAreaIndex = j;
        }
      }
      
      // Add selected point to result
      result.push(timeSeries[maxAreaIndex]);
      lastSelectedIndex = maxAreaIndex;
    }
    
    // Always add last point
    result.push(timeSeries[timeSeries.length - 1]);
    
    return result;
  }
  
  /**
   * Simple averaging downsampling: Average values in each bucket
   * Good for smoothing noisy data
   */
  private downsampleAverage(timeSeries: TimeSeriesPoint[], targetPoints: number): TimeSeriesPoint[] {
    const bucketSize = Math.ceil(timeSeries.length / targetPoints);
    const result: TimeSeriesPoint[] = [];
    
    for (let i = 0; i < targetPoints; i++) {
      const bucketStart = i * bucketSize;
      const bucketEnd = Math.min(bucketStart + bucketSize, timeSeries.length);
      
      if (bucketStart >= bucketEnd) break;
      
      const bucket = timeSeries.slice(bucketStart, bucketEnd);
      
      // Calculate average value
      let sumValue = 0;
      let sumTimestamp = 0;
      
      for (const point of bucket) {
        sumValue += point.value;
        sumTimestamp += point.timestamp.getTime();
      }
      
      // Create average point
      result.push({
        timestamp: new Date(Math.round(sumTimestamp / bucket.length)),
        value: sumValue / bucket.length
      });
    }
    
    return result;
  }
  
  /**
   * First-last-significant downsampling: Keep first, last, and significant points
   * Good for preserving important features while reducing data
   */
  private downsampleFirstLastSignificant(
    timeSeries: TimeSeriesPoint[], 
    targetPoints: number,
    significanceThreshold: number
  ): TimeSeriesPoint[] {
    if (timeSeries.length <= targetPoints) {
      return [...timeSeries];
    }
    
    // Always include first and last points
    const result: TimeSeriesPoint[] = [timeSeries[0]];
    
    // Identify significant points
    const significantPoints: TimeSeriesPoint[] = [];
    
    // Calculate value range for significance threshold
    const values = timeSeries.map(p => p.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue;
    
    // Only consider significant if there's a meaningful range
    if (valueRange > 0) {
      const significanceValue = valueRange * significanceThreshold;
      
      // Find points with significant changes
      let lastSignificantValue = timeSeries[0].value;
      
      for (let i = 1; i < timeSeries.length - 1; i++) {
        const currentValue = timeSeries[i].value;
        const delta = Math.abs(currentValue - lastSignificantValue);
        
        if (delta >= significanceValue) {
          significantPoints.push(timeSeries[i]);
          lastSignificantValue = currentValue;
        }
      }
    }
    
    // Select points to keep
    const pointsToKeep = targetPoints - 2; // Minus first and last
    
    if (significantPoints.length <= pointsToKeep) {
      // If we have fewer significant points than needed, add them all
      result.push(...significantPoints);
    } else {
      // Otherwise, evenly sample from significant points
      const step = significantPoints.length / pointsToKeep;
      
      for (let i = 0; i < pointsToKeep; i++) {
        const index = Math.floor(i * step);
        result.push(significantPoints[index]);
      }
    }
    
    // Add last point
    result.push(timeSeries[timeSeries.length - 1]);
    
    // Sort by timestamp
    return result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}

/**
 * Generic computation cache with time-based expiration
 */
export class ComputationCache<K, V> {
  private cache = new Map<string, CacheEntry<V>>();
  private readonly maxEntries: number;
  private readonly defaultTTL: number;
  
  constructor(options: ComputeCacheOptions = {}) {
    const {
      maxEntries = 1000,
      defaultTTL = 5 * 60 * 1000 // 5 minutes
    } = options;
    
    this.maxEntries = maxEntries;
    this.defaultTTL = defaultTTL;
  }
  
  /**
   * Get a cached value if not expired
   * 
   * @param key Cache key
   * @param maxAge Maximum age in milliseconds (optional, overrides TTL)
   * @returns Cached value or undefined if not found or expired
   */
  get(key: K, maxAge?: number): V | undefined {
    const cacheKey = this.generateCacheKey(key);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      return undefined;
    }
    
    const now = Date.now();
    const maxAgeToUse = maxAge || this.defaultTTL;
    
    if (entry.expiresAt < now || now - entry.timestamp > maxAgeToUse) {
      // Remove expired entry
      this.cache.delete(cacheKey);
      return undefined;
    }
    
    return entry.value;
  }
  
  /**
   * Set a value in the cache
   * 
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time-to-live in milliseconds (optional)
   */
  set(key: K, value: V, ttl?: number): void {
    const cacheKey = this.generateCacheKey(key);
    const now = Date.now();
    const ttlToUse = ttl || this.defaultTTL;
    
    this.cache.set(cacheKey, {
      value,
      timestamp: now,
      expiresAt: now + ttlToUse
    });
    
    // Evict oldest entries if cache is full
    this.evictIfNeeded();
  }
  
  /**
   * Get or compute a value, using the cache if available
   * 
   * @param key Cache key
   * @param compute Function to compute the value if not in cache
   * @param ttl Time-to-live in milliseconds (optional)
   * @returns Value from cache or computed
   */
  async getOrCompute(key: K, compute: () => Promise<V>, ttl?: number): Promise<V> {
    const cachedValue = this.get(key);
    
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    // Compute value
    const computedValue = await compute();
    
    // Cache the computed value
    this.set(key, computedValue, ttl);
    
    return computedValue;
  }
  
  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Remove a specific key from the cache
   * 
   * @param key Cache key to remove
   */
  remove(key: K): void {
    const cacheKey = this.generateCacheKey(key);
    this.cache.delete(cacheKey);
  }
  
  /**
   * Get the number of entries in the cache
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * Generate a consistent string key for caching
   */
  private generateCacheKey(key: K): string {
    if (typeof key === 'string') {
      return key;
    } else if (typeof key === 'number' || typeof key === 'boolean') {
      return key.toString();
    } else {
      return JSON.stringify(key);
    }
  }
  
  /**
   * Evict oldest entries if the cache is full
   */
  private evictIfNeeded(): void {
    if (this.cache.size <= this.maxEntries) {
      return;
    }
    
    // Find the oldest entries
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove the oldest entries until we're under the limit
    const entriesToRemove = entries.slice(0, this.cache.size - this.maxEntries);
    
    for (const [key] of entriesToRemove) {
      this.cache.delete(key);
    }
  }
}