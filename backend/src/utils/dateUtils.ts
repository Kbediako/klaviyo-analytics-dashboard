/**
 * Utility functions for handling date ranges in the API
 */

export interface DateRange {
  start: string;
  end: string;
}

/**
 * Format a date for Klaviyo API in YYYY-MM-DD format
 * 
 * @param date The date to format
 * @returns Formatted date string
 */
export function formatDateForKlaviyo(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get a date range from a predefined option
 * 
 * @param option The predefined option (e.g., 'last-30-days')
 * @param referenceDate Optional reference date (defaults to now)
 * @returns Date range object
 */
export function getDateRangeFromOption(option: string, referenceDate: Date = new Date()): { start: Date; end: Date } {
  const now = referenceDate;
  let start: Date;
  let end: Date = new Date(now);
  
  // Set end time to end of day
  end.setHours(23, 59, 59, 999);
  
  switch (option) {
    case 'last-7-days':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
      
    case 'last-30-days':
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
      
    case 'last-90-days':
      start = new Date(now);
      start.setDate(start.getDate() - 90);
      start.setHours(0, 0, 0, 0);
      break;
      
    case 'this-month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      break;
      
    case 'last-month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      break;
      
    case 'this-year':
      start = new Date(now.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      break;
      
    default:
      // Default to last 30 days
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
  }
  
  return { start, end };
}

/**
 * Parse a date range string into start and end dates
 * Supports formats:
 * - "last-30-days", "last-7-days", "last-90-days"
 * - "2023-01-01_to_2023-02-01" (custom date range)
 * 
 * @param dateRangeStr The date range string to parse
 * @returns Object with start and end dates in ISO format
 */
export function parseDateRange(dateRangeStr: string = 'last-30-days'): DateRange {
  const now = new Date();
  let start: Date;
  let end: Date = new Date(now);
  
  // Set end time to end of day
  end.setHours(23, 59, 59, 999);
  
  if (dateRangeStr.startsWith('last-')) {
    const days = parseInt(dateRangeStr.replace('last-', '').replace('-days', ''));
    start = new Date(now);
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
  } else if (dateRangeStr.includes('_to_')) {
    const [startStr, endStr] = dateRangeStr.split('_to_');
    start = new Date(startStr);
    start.setHours(0, 0, 0, 0);
    end = new Date(endStr);
    end.setHours(23, 59, 59, 999);
  } else {
    // Default to last 30 days if format is not recognized
    start = new Date(now);
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
  }
  
  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

/**
 * Generate a Klaviyo API filter string for date filtering
 * 
 * @param field The field to filter on (e.g., 'created')
 * @param dateRange The date range to filter by
 * @returns A filter string for Klaviyo API
 */
export function generateKlaviyoDateFilter(field: string, dateRange: DateRange): string {
  // Remove quotes around date values as per Klaviyo API requirements
  return `greater-or-equal(${field},${dateRange.start}),less-or-equal(${field},${dateRange.end})`;
}

/**
 * Calculate the percentage change between two values
 * 
 * @param current Current period value
 * @param previous Previous period value
 * @returns Percentage change as a string with % sign
 */
export function calculatePercentageChange(current: number, previous: number): string {
  if (previous === 0) {
    return current > 0 ? '+∞%' : '0%';
  }
  
  const change = ((current - previous) / previous) * 100;
  return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
}

/**
 * Get the previous date range of the same length
 * 
 * @param dateRange Current date range
 * @returns Previous date range of the same length
 */
export function getPreviousPeriodDateRange(dateRange: DateRange): DateRange {
  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);
  
  const rangeDuration = end.getTime() - start.getTime();
  
  const previousEnd = new Date(start);
  previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1);
  
  const previousStart = new Date(previousEnd);
  previousStart.setTime(previousStart.getTime() - rangeDuration);
  
  return {
    start: previousStart.toISOString(),
    end: previousEnd.toISOString()
  };
}
