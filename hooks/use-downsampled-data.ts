import { useState, useEffect } from 'react';
import { TimeSeriesPoint } from './use-time-series';
import { downsampleTimeSeries } from '../lib/downsampling';

/**
 * Custom hook for client-side downsampling of time series data
 * 
 * @param data Original time series data
 * @param maxPoints Maximum points to display
 * @param method Downsampling method to use
 * @returns Downsampled data and metadata
 */
export function useDownsampledData(
  data: TimeSeriesPoint[] | undefined,
  maxPoints: number = 200,
  method: 'lttb' | 'minmax' | 'average' | 'none' = 'lttb'
) {
  const [downsampledData, setDownsampledData] = useState<TimeSeriesPoint[]>([]);
  const [isDownsampled, setIsDownsampled] = useState<boolean>(false);
  
  useEffect(() => {
    if (!data || data.length === 0) {
      setDownsampledData([]);
      setIsDownsampled(false);
      return;
    }
    
    // Only downsample if we have more points than the threshold
    if (data.length > maxPoints) {
      const result = downsampleTimeSeries(data, maxPoints, method);
      setDownsampledData(result);
      setIsDownsampled(true);
    } else {
      setDownsampledData(data);
      setIsDownsampled(false);
    }
  }, [data, maxPoints, method]);
  
  return {
    data: downsampledData,
    isDownsampled,
    originalLength: data?.length || 0,
    downsampledLength: downsampledData.length,
    reductionPercent: data && data.length > 0 
      ? Math.round(((data.length - downsampledData.length) / data.length) * 100) 
      : 0
  };
}

/**
 * Hook to progressively load data for better performance
 * 
 * @param data Full dataset to progressively load
 * @param initialPoints Number of points to show initially
 * @param loadDelay Delay in ms before loading the full dataset
 * @returns Progressively loaded data and loading state
 */
export function useProgressiveLoading(
  data: TimeSeriesPoint[] | undefined,
  initialPoints: number = 50,
  loadDelay: number = 300
) {
  const [visibleData, setVisibleData] = useState<TimeSeriesPoint[]>([]);
  const [isFullyLoaded, setIsFullyLoaded] = useState<boolean>(false);
  
  useEffect(() => {
    if (!data || data.length === 0) {
      setVisibleData([]);
      setIsFullyLoaded(true);
      return;
    }
    
    // Always show initial points immediately
    const initialData = data.length > initialPoints 
      ? data.slice(0, initialPoints) 
      : data;
    
    setVisibleData(initialData);
    setIsFullyLoaded(initialData.length === data.length);
    
    // Load the rest after a delay
    if (data.length > initialPoints) {
      const timer = setTimeout(() => {
        setVisibleData(data);
        setIsFullyLoaded(true);
      }, loadDelay);
      
      return () => clearTimeout(timer);
    }
  }, [data, initialPoints, loadDelay]);
  
  return {
    data: visibleData,
    isFullyLoaded,
    progress: data && data.length > 0 
      ? Math.round((visibleData.length / data.length) * 100) 
      : 100
  };
}