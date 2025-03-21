/**
 * Type guards for API responses
 * 
 * This file contains type guard functions to ensure type safety when working with API responses.
 * Type guards are functions that perform runtime checks to determine if a value matches a specific type.
 */

import { 
  Campaign, 
  Flow, 
  Form, 
  Segment, 
  OverviewMetrics,
  RevenueDataPoint,
  ChannelDataPoint,
  TopSegmentData,
  TopFlowData,
  TopFormData
} from './types';

/**
 * Type guard for checking if a value is a non-null object
 * 
 * @param value Value to check
 * @returns True if the value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Type guard for checking if a value is an array
 * 
 * @param value Value to check
 * @returns True if the value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Type guard for checking if a value is a string
 * 
 * @param value Value to check
 * @returns True if the value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard for checking if a value is a number
 * 
 * @param value Value to check
 * @returns True if the value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard for checking if a value is a boolean
 * 
 * @param value Value to check
 * @returns True if the value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard for checking if a value is a Campaign
 * 
 * @param value Value to check
 * @returns True if the value is a Campaign
 */
export function isCampaign(value: unknown): value is Campaign {
  if (!isObject(value)) return false;
  
  return (
    isNumber(value.id) &&
    isString(value.name) &&
    isNumber(value.sent) &&
    isNumber(value.openRate) &&
    isNumber(value.clickRate) &&
    isNumber(value.conversionRate) &&
    isNumber(value.revenue)
  );
}

/**
 * Type guard for checking if a value is an array of Campaigns
 * 
 * @param value Value to check
 * @returns True if the value is an array of Campaigns
 */
export function isCampaignArray(value: unknown): value is Campaign[] {
  return isArray(value) && value.every(isCampaign);
}

/**
 * Type guard for checking if a value is a Flow
 * 
 * @param value Value to check
 * @returns True if the value is a Flow
 */
export function isFlow(value: unknown): value is Flow {
  if (!isObject(value)) return false;
  
  return (
    isNumber(value.id) &&
    isString(value.name) &&
    isNumber(value.recipients) &&
    isNumber(value.openRate) &&
    isNumber(value.clickRate) &&
    isNumber(value.conversionRate) &&
    isNumber(value.revenue)
  );
}

/**
 * Type guard for checking if a value is an array of Flows
 * 
 * @param value Value to check
 * @returns True if the value is an array of Flows
 */
export function isFlowArray(value: unknown): value is Flow[] {
  return isArray(value) && value.every(isFlow);
}

/**
 * Type guard for checking if a value is a Form
 * 
 * @param value Value to check
 * @returns True if the value is a Form
 */
export function isForm(value: unknown): value is Form {
  if (!isObject(value)) return false;
  
  return (
    isNumber(value.id) &&
    isString(value.name) &&
    isNumber(value.views) &&
    isNumber(value.submissions) &&
    isNumber(value.submissionRate) &&
    isNumber(value.conversions)
  );
}

/**
 * Type guard for checking if a value is an array of Forms
 * 
 * @param value Value to check
 * @returns True if the value is an array of Forms
 */
export function isFormArray(value: unknown): value is Form[] {
  return isArray(value) && value.every(isForm);
}

/**
 * Type guard for checking if a value is a Segment
 * 
 * @param value Value to check
 * @returns True if the value is a Segment
 */
export function isSegment(value: unknown): value is Segment {
  if (!isObject(value)) return false;
  
  return (
    isNumber(value.id) &&
    isString(value.name) &&
    isNumber(value.count) &&
    isNumber(value.conversionRate) &&
    isNumber(value.revenue)
  );
}

/**
 * Type guard for checking if a value is an array of Segments
 * 
 * @param value Value to check
 * @returns True if the value is an array of Segments
 */
export function isSegmentArray(value: unknown): value is Segment[] {
  return isArray(value) && value.every(isSegment);
}

/**
 * Type guard for checking if a value is a RevenueDataPoint
 * 
 * @param value Value to check
 * @returns True if the value is a RevenueDataPoint
 */
export function isRevenueDataPoint(value: unknown): value is RevenueDataPoint {
  if (!isObject(value)) return false;
  
  return (
    isString(value.date) &&
    isNumber(value.campaigns) &&
    isNumber(value.flows) &&
    isNumber(value.forms) &&
    isNumber(value.other)
  );
}

/**
 * Type guard for checking if a value is an array of RevenueDataPoints
 * 
 * @param value Value to check
 * @returns True if the value is an array of RevenueDataPoints
 */
export function isRevenueDataPointArray(value: unknown): value is RevenueDataPoint[] {
  return isArray(value) && value.every(isRevenueDataPoint);
}

/**
 * Type guard for checking if a value is a ChannelDataPoint
 * 
 * @param value Value to check
 * @returns True if the value is a ChannelDataPoint
 */
export function isChannelDataPoint(value: unknown): value is ChannelDataPoint {
  if (!isObject(value)) return false;
  
  return (
    isString(value.name) &&
    isNumber(value.value) &&
    isString(value.color)
  );
}

/**
 * Type guard for checking if a value is an array of ChannelDataPoints
 * 
 * @param value Value to check
 * @returns True if the value is an array of ChannelDataPoints
 */
export function isChannelDataPointArray(value: unknown): value is ChannelDataPoint[] {
  return isArray(value) && value.every(isChannelDataPoint);
}

/**
 * Type guard for checking if a value is a TopSegmentData
 * 
 * @param value Value to check
 * @returns True if the value is a TopSegmentData
 */
export function isTopSegmentData(value: unknown): value is TopSegmentData {
  if (!isObject(value)) return false;
  
  return (
    isNumber(value.id) &&
    isString(value.name) &&
    isNumber(value.conversionRate) &&
    isNumber(value.count) &&
    isNumber(value.revenue)
  );
}

/**
 * Type guard for checking if a value is an array of TopSegmentData
 * 
 * @param value Value to check
 * @returns True if the value is an array of TopSegmentData
 */
export function isTopSegmentDataArray(value: unknown): value is TopSegmentData[] {
  return isArray(value) && value.every(isTopSegmentData);
}

/**
 * Type guard for checking if a value is a TopFlowData
 * 
 * @param value Value to check
 * @returns True if the value is a TopFlowData
 */
export function isTopFlowData(value: unknown): value is TopFlowData {
  if (!isObject(value)) return false;
  
  return (
    isNumber(value.id) &&
    isString(value.name) &&
    isNumber(value.recipients) &&
    isNumber(value.conversionRate)
  );
}

/**
 * Type guard for checking if a value is an array of TopFlowData
 * 
 * @param value Value to check
 * @returns True if the value is an array of TopFlowData
 */
export function isTopFlowDataArray(value: unknown): value is TopFlowData[] {
  return isArray(value) && value.every(isTopFlowData);
}

/**
 * Type guard for checking if a value is a TopFormData
 * 
 * @param value Value to check
 * @returns True if the value is a TopFormData
 */
export function isTopFormData(value: unknown): value is TopFormData {
  if (!isObject(value)) return false;
  
  return (
    isNumber(value.id) &&
    isString(value.name) &&
    isNumber(value.views) &&
    isNumber(value.submissionRate)
  );
}

/**
 * Type guard for checking if a value is an array of TopFormData
 * 
 * @param value Value to check
 * @returns True if the value is an array of TopFormData
 */
export function isTopFormDataArray(value: unknown): value is TopFormData[] {
  return isArray(value) && value.every(isTopFormData);
}

/**
 * Type guard for checking if a value is an OverviewMetrics object
 * 
 * @param value Value to check
 * @returns True if the value is an OverviewMetrics object
 */
export function isOverviewMetrics(value: unknown): value is OverviewMetrics {
  if (!isObject(value)) return false;
  
  // Check revenue metrics
  if (!isObject(value.revenue)) return false;
  if (!isNumber(value.revenue.current)) return false;
  if (!isNumber(value.revenue.previous)) return false;
  if (!isNumber(value.revenue.change)) return false;
  
  // Check subscribers metrics
  if (!isObject(value.subscribers)) return false;
  if (!isNumber(value.subscribers.current)) return false;
  if (!isNumber(value.subscribers.previous)) return false;
  if (!isNumber(value.subscribers.change)) return false;
  
  // Check openRate metrics
  if (!isObject(value.openRate)) return false;
  if (!isNumber(value.openRate.current)) return false;
  if (!isNumber(value.openRate.previous)) return false;
  if (!isNumber(value.openRate.change)) return false;
  
  // Check clickRate metrics
  if (!isObject(value.clickRate)) return false;
  if (!isNumber(value.clickRate.current)) return false;
  if (!isNumber(value.clickRate.previous)) return false;
  if (!isNumber(value.clickRate.change)) return false;
  
  // Check conversionRate metrics
  if (!isObject(value.conversionRate)) return false;
  if (!isNumber(value.conversionRate.current)) return false;
  if (!isNumber(value.conversionRate.previous)) return false;
  if (!isNumber(value.conversionRate.change)) return false;
  
  // Check formSubmissions metrics
  if (!isObject(value.formSubmissions)) return false;
  if (!isNumber(value.formSubmissions.current)) return false;
  if (!isNumber(value.formSubmissions.previous)) return false;
  if (!isNumber(value.formSubmissions.change)) return false;
  
  // Check channels array
  if (!isArray(value.channels)) return false;
  if (!value.channels.every(isChannelDataPoint)) return false;
  
  return true;
}

/**
 * Type guard for checking if a value is a Klaviyo API response with data array
 * 
 * @param value Value to check
 * @returns True if the value is a Klaviyo API response with data array
 */
export function isKlaviyoApiResponse(value: unknown): value is { data: unknown[] } {
  if (!isObject(value)) return false;
  
  return isArray(value.data);
}

/**
 * Apply type guard to API response data
 * 
 * @param data Response data
 * @param typeGuard Type guard function to apply
 * @param fallback Fallback value if type guard fails
 * @returns Typed data or fallback
 */
export function applyTypeGuard<T>(
  data: unknown, 
  typeGuard: (value: unknown) => value is T,
  fallback: T
): T {
  return typeGuard(data) ? data : fallback;
}
