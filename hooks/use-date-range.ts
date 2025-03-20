import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { clearCache } from '../lib/api-client';

/**
 * Date range options for the dashboard
 */
export type DateRangeOption = 
  | 'last-7-days'
  | 'last-30-days'
  | 'last-90-days'
  | 'this-month'
  | 'last-month'
  | 'this-year'
  | 'custom';

/**
 * Interface for date range
 */
export interface DateRange {
  start: string;
  end: string;
}

/**
 * Interface for custom date range
 */
export interface CustomDateRange {
  startDate: Date | null;
  endDate: Date | null;
}

/**
 * Format date as ISO string (YYYY-MM-DD)
 * 
 * @param date Date to format
 * @returns Formatted date string
 */
function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get date range for a given option
 * 
 * @param option Date range option
 * @param customRange Custom date range (for 'custom' option)
 * @returns Date range object with start and end dates
 */
function getDateRangeForOption(option: DateRangeOption, customRange?: CustomDateRange): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (option) {
    case 'last-7-days': {
      const start = new Date(today);
      start.setDate(today.getDate() - 7);
      return {
        start: formatDateISO(start),
        end: formatDateISO(today),
      };
    }
    
    case 'last-30-days': {
      const start = new Date(today);
      start.setDate(today.getDate() - 30);
      return {
        start: formatDateISO(start),
        end: formatDateISO(today),
      };
    }
    
    case 'last-90-days': {
      const start = new Date(today);
      start.setDate(today.getDate() - 90);
      return {
        start: formatDateISO(start),
        end: formatDateISO(today),
      };
    }
    
    case 'this-month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        start: formatDateISO(start),
        end: formatDateISO(today),
      };
    }
    
    case 'last-month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        start: formatDateISO(start),
        end: formatDateISO(end),
      };
    }
    
    case 'this-year': {
      const start = new Date(today.getFullYear(), 0, 1);
      return {
        start: formatDateISO(start),
        end: formatDateISO(today),
      };
    }
    
    case 'custom': {
      if (!customRange || !customRange.startDate || !customRange.endDate) {
        // Default to last 30 days if custom range is invalid
        const start = new Date(today);
        start.setDate(today.getDate() - 30);
        return {
          start: formatDateISO(start),
          end: formatDateISO(today),
        };
      }
      
      return {
        start: formatDateISO(customRange.startDate),
        end: formatDateISO(customRange.endDate),
      };
    }
    
    default:
      // Default to last 30 days
      const start = new Date(today);
      start.setDate(today.getDate() - 30);
      return {
        start: formatDateISO(start),
        end: formatDateISO(today),
      };
  }
}

/**
 * Get formatted date range label
 * 
 * @param dateRange Date range object
 * @returns Formatted date range label
 */
function getDateRangeLabel(dateRange: DateRange): string {
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };
  
  // Add year if different years
  if (startDate.getFullYear() !== endDate.getFullYear()) {
    formatOptions.year = 'numeric';
  }
  
  const formatter = new Intl.DateTimeFormat('en-US', formatOptions);
  
  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}

/**
 * Get previous period date range
 * 
 * @param dateRange Current date range
 * @returns Previous period date range
 */
function getPreviousPeriodDateRange(dateRange: DateRange): DateRange {
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const previousEndDate = new Date(startDate);
  previousEndDate.setDate(previousEndDate.getDate() - 1);
  
  const previousStartDate = new Date(previousEndDate);
  previousStartDate.setDate(previousStartDate.getDate() - diffDays);
  
  return {
    start: formatDateISO(previousStartDate),
    end: formatDateISO(previousEndDate),
  };
}

/**
 * Custom hook for debouncing values
 * 
 * @param value Value to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced value
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Custom hook for date range selection
 * 
 * @param defaultOption Default date range option
 * @returns Date range state and handlers
 */
export function useDateRange(defaultOption: DateRangeOption = 'last-30-days') {
  const [selectedOption, setSelectedOption] = useState<DateRangeOption>(defaultOption);
  const [customDateRange, setCustomDateRange] = useState<CustomDateRange>({
    startDate: null,
    endDate: null,
  });
  
  // Track previous date range param for cache clearing
  const prevDateRangeParamRef = useRef<string | null>(null);
  
  // Get current date range based on selected option
  const dateRange = useMemo(() => {
    return getDateRangeForOption(selectedOption, customDateRange);
  }, [selectedOption, customDateRange]);
  
  // Get previous period date range for comparison
  const previousPeriodDateRange = useMemo(() => {
    return getPreviousPeriodDateRange(dateRange);
  }, [dateRange]);
  
  // Get formatted date range label
  const dateRangeLabel = useMemo(() => {
    return getDateRangeLabel(dateRange);
  }, [dateRange]);
  
  // Handle date range option change with debouncing
  const handleDateRangeChange = useCallback((option: DateRangeOption) => {
    setSelectedOption(option);
  }, []);
  
  // Handle custom date range change with debouncing
  const handleCustomDateRangeChange = useCallback((range: CustomDateRange) => {
    setCustomDateRange(range);
    setSelectedOption('custom');
  }, []);
  
  // Get date range parameter for API requests
  const rawDateRangeParam = useMemo(() => {
    return selectedOption === 'custom' 
      ? `${dateRange.start},${dateRange.end}` 
      : selectedOption;
  }, [selectedOption, dateRange]);
  
  // Debounce the date range parameter to prevent rapid API requests
  const dateRangeParam = useDebounce(rawDateRangeParam, 500);
  
  // Clear cache when date range changes
  useEffect(() => {
    if (prevDateRangeParamRef.current && prevDateRangeParamRef.current !== dateRangeParam) {
      // Clear cache for all endpoints when date range changes
      clearCache();
    }
    
    prevDateRangeParamRef.current = dateRangeParam;
  }, [dateRangeParam]);
  
  return {
    selectedOption,
    dateRange,
    previousPeriodDateRange,
    dateRangeLabel,
    dateRangeParam,
    customDateRange,
    handleDateRangeChange,
    handleCustomDateRangeChange,
  };
}
