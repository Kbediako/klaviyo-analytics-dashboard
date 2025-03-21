import { TimeSeriesPoint } from '../hooks/use-time-series';

/**
 * Simple LTTB (Largest Triangle Three Buckets) implementation for downsampling
 * Preserves visual characteristics of the data with fewer points
 * 
 * @param data - Time series data to downsample
 * @param threshold - Maximum number of points to keep
 * @returns - Downsampled data
 */
export function downsampleLTTB(data: TimeSeriesPoint[], threshold: number): TimeSeriesPoint[] {
  if (!data || data.length <= threshold) return data;
  
  // Always keep the first and last points
  const result: TimeSeriesPoint[] = [];
  result.push(data[0]);
  
  const bucketSize = (data.length - 2) / (threshold - 2);
  
  let lastBucketPoint = 0;
  
  for (let i = 0; i < threshold - 2; i++) {
    const nextBucketPoint = Math.floor((i + 1) * bucketSize) + 1;
    const currentBucket = data.slice(lastBucketPoint, nextBucketPoint);
    
    // Find the point in the current bucket with the largest triangle area
    let maxArea = -1;
    let maxAreaIndex = 0;
    
    const a = data[lastBucketPoint];
    const c = data[nextBucketPoint];
    
    // Skip the first point as it's already added
    for (let j = 1; j < currentBucket.length; j++) {
      const b = currentBucket[j];
      
      // Calculate triangle area
      const area = Math.abs(
        (new Date(a.timestamp).getTime()) * (c.value - b.value) -
        (a.value - b.value) * (new Date(c.timestamp).getTime())
      );
      
      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = j;
      }
    }
    
    // Add the point with the largest triangle area
    if (currentBucket[maxAreaIndex]) {
      result.push(currentBucket[maxAreaIndex]);
    }
    
    lastBucketPoint = nextBucketPoint;
  }
  
  // Add the last point
  result.push(data[data.length - 1]);
  
  return result;
}

/**
 * Min-max downsampling - keeps local minimums and maximums
 * Good for preserving peaks and valleys in the data
 * 
 * @param data - Time series data to downsample
 * @param threshold - Maximum number of points to keep
 * @returns - Downsampled data
 */
export function downsampleMinMax(data: TimeSeriesPoint[], threshold: number): TimeSeriesPoint[] {
  if (!data || data.length <= threshold) return data;
  
  const result: TimeSeriesPoint[] = [];
  result.push(data[0]); // Keep first point
  
  const bucketSize = Math.ceil(data.length / (threshold / 2));
  
  for (let i = 0; i < (threshold / 2) - 1; i++) {
    const bucketStart = (i * bucketSize) + 1;
    const bucketEnd = Math.min(bucketStart + bucketSize, data.length - 1);
    const bucket = data.slice(bucketStart, bucketEnd);
    
    if (bucket.length === 0) continue;
    
    // Find min and max in bucket
    let minPoint = bucket[0];
    let maxPoint = bucket[0];
    
    for (let j = 1; j < bucket.length; j++) {
      if (bucket[j].value < minPoint.value) minPoint = bucket[j];
      if (bucket[j].value > maxPoint.value) maxPoint = bucket[j];
    }
    
    // Add min and max points (if they differ)
    if (minPoint !== maxPoint) {
      // Determine which came first in time
      const minTime = new Date(minPoint.timestamp).getTime();
      const maxTime = new Date(maxPoint.timestamp).getTime();
      
      if (minTime < maxTime) {
        result.push(minPoint);
        result.push(maxPoint);
      } else {
        result.push(maxPoint);
        result.push(minPoint);
      }
    } else {
      // If min and max are the same point
      result.push(minPoint);
    }
  }
  
  result.push(data[data.length - 1]); // Keep last point
  
  return result;
}

/**
 * Average downsampling - averages values within buckets
 * Good for smoothing noisy data
 * 
 * @param data - Time series data to downsample
 * @param threshold - Maximum number of points to keep
 * @returns - Downsampled data
 */
export function downsampleAverage(data: TimeSeriesPoint[], threshold: number): TimeSeriesPoint[] {
  if (!data || data.length <= threshold) return data;
  
  const result: TimeSeriesPoint[] = [];
  const bucketSize = Math.ceil(data.length / threshold);
  
  for (let i = 0; i < threshold; i++) {
    const bucketStart = i * bucketSize;
    const bucketEnd = Math.min(bucketStart + bucketSize, data.length);
    const bucket = data.slice(bucketStart, bucketEnd);
    
    if (bucket.length === 0) continue;
    
    // Calculate average value in bucket
    const sum = bucket.reduce((acc, point) => acc + point.value, 0);
    const avg = sum / bucket.length;
    
    // Use middle point's timestamp (or first if only one point)
    const middleIndex = Math.floor(bucket.length / 2);
    const timestamp = bucket[middleIndex].timestamp;
    
    result.push({
      timestamp,
      value: avg
    });
  }
  
  return result;
}

/**
 * Apply a downsampling method to time series data
 * 
 * @param data - The time series data to downsample
 * @param maxPoints - Maximum number of points to return
 * @param method - The downsampling method to use
 * @returns - The downsampled data
 */
export function downsampleTimeSeries(
  data: TimeSeriesPoint[], 
  maxPoints: number, 
  method: 'lttb' | 'minmax' | 'average' | 'none' = 'lttb'
): TimeSeriesPoint[] {
  if (!data || data.length <= maxPoints || method === 'none') {
    return data;
  }
  
  switch (method) {
    case 'lttb':
      return downsampleLTTB(data, maxPoints);
    case 'minmax':
      return downsampleMinMax(data, maxPoints);
    case 'average':
      return downsampleAverage(data, maxPoints);
    default:
      return data;
  }
}