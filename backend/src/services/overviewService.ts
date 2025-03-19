import klaviyoApiClient from './klaviyoApiClient';
import { DateRange, getPreviousPeriodDateRange, calculatePercentageChange } from '../utils/dateUtils';

export interface OverviewMetrics {
  totalRevenue: number;
  activeSubscribers: number;
  conversionRate: number;
  formSubmissions: number;
  periodComparison: {
    totalRevenue: string;
    activeSubscribers: string;
    conversionRate: string;
    formSubmissions: string;
  };
}

/**
 * Get overview metrics for the dashboard
 * 
 * @param dateRange Date range to get metrics for
 * @returns Overview metrics
 */
export async function getOverviewMetrics(dateRange: DateRange): Promise<OverviewMetrics> {
  // Get previous period for comparison
  const previousPeriod = getPreviousPeriodDateRange(dateRange);
  
  // Get current period metrics
  const currentMetrics = await fetchPeriodMetrics(dateRange);
  
  // Get previous period metrics for comparison
  const previousMetrics = await fetchPeriodMetrics(previousPeriod);
  
  // Calculate period comparison percentages
  const periodComparison = {
    totalRevenue: calculatePercentageChange(currentMetrics.totalRevenue, previousMetrics.totalRevenue),
    activeSubscribers: calculatePercentageChange(currentMetrics.activeSubscribers, previousMetrics.activeSubscribers),
    conversionRate: calculatePercentageChange(currentMetrics.conversionRate, previousMetrics.conversionRate),
    formSubmissions: calculatePercentageChange(currentMetrics.formSubmissions, previousMetrics.formSubmissions),
  };
  
  return {
    ...currentMetrics,
    periodComparison,
  };
}

/**
 * Fetch metrics for a specific period
 * 
 * @param dateRange Date range to fetch metrics for
 * @returns Metrics for the period
 */
async function fetchPeriodMetrics(dateRange: DateRange): Promise<Omit<OverviewMetrics, 'periodComparison'>> {
  try {
    // In a real implementation, these would be parallel requests to Klaviyo API
    // For now, we'll use placeholder logic
    
    // 1. Get total revenue from "Placed Order" events
    const revenueEvents = await klaviyoApiClient.getEvents(dateRange, 'metric.id=placed-order');
    const totalRevenue = calculateTotalRevenue(revenueEvents);
    
    // 2. Get active subscribers count
    const profiles = await klaviyoApiClient.getProfiles(dateRange);
    const activeSubscribers = countActiveSubscribers(profiles);
    
    // 3. Calculate conversion rate from email opens to purchases
    const openEvents = await klaviyoApiClient.getEvents(dateRange, 'metric.id=opened-email');
    const conversionRate = calculateConversionRate(openEvents, revenueEvents);
    
    // 4. Get form submissions
    const formEvents = await klaviyoApiClient.getEvents(dateRange, 'metric.id=submitted-form');
    const formSubmissions = countFormSubmissions(formEvents);
    
    return {
      totalRevenue,
      activeSubscribers,
      conversionRate,
      formSubmissions,
    };
  } catch (error) {
    console.error('Error fetching overview metrics:', error);
    // Return default values in case of error
    return {
      totalRevenue: 0,
      activeSubscribers: 0,
      conversionRate: 0,
      formSubmissions: 0,
    };
  }
}

/**
 * Calculate total revenue from order events
 * 
 * @param events Order events from Klaviyo
 * @returns Total revenue
 */
function calculateTotalRevenue(events: any): number {
  // In a real implementation, we would extract revenue from each event
  // For now, return a placeholder value
  return 42582;
}

/**
 * Count active subscribers from profiles
 * 
 * @param profiles Profiles from Klaviyo
 * @returns Number of active subscribers
 */
function countActiveSubscribers(profiles: any): number {
  // In a real implementation, we would count profiles with active subscription status
  // For now, return a placeholder value
  return 24853;
}

/**
 * Calculate conversion rate from email opens to purchases
 * 
 * @param openEvents Email open events
 * @param purchaseEvents Purchase events
 * @returns Conversion rate as a percentage
 */
function calculateConversionRate(openEvents: any, purchaseEvents: any): number {
  // In a real implementation, we would calculate the ratio of purchases to opens
  // For now, return a placeholder value
  return 18.5;
}

/**
 * Count form submissions
 * 
 * @param formEvents Form submission events
 * @returns Number of form submissions
 */
function countFormSubmissions(formEvents: any): number {
  // In a real implementation, we would count form submission events
  // For now, return a placeholder value
  return 3842;
}
