import { Response, Headers } from 'node-fetch';
import { 
  ApiError, 
  NetworkError
} from '../../utils/apiErrors';

/**
 * Utility functions for the Klaviyo API client
 */

/**
 * Mask API key for logging (show only first 5 and last 3 characters)
 * 
 * @param apiKey API key to mask
 * @returns Masked API key
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return '*'.repeat(apiKey.length);
  }
  return `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 3)}`;
}

/**
 * Create a delay promise
 * 
 * @param ms Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get common headers for Klaviyo API requests
 * Uses Bearer token format according to latest Klaviyo API standards
 *
 * @param apiKey Klaviyo API key
 * @param apiVersion API version in YYYY-MM-DD format
 * @returns Headers object with authorization and content type
 * 
 * @remarks
 * The Klaviyo API requires the following headers:
 * - Authorization: Bearer token for authentication
 * - Accept: application/json for JSON responses
 * - revision: API version in YYYY-MM-DD format
 * - Content-Type: application/json for request bodies
 * 
 * Note that the 'revision' header is case-sensitive and must be lowercase
 * according to the latest Klaviyo API documentation.
 */
export function getHeaders(apiKey: string, apiVersion: string): Record<string, string> {
  return {
    'Authorization': `Klaviyo-API-Key ${apiKey}`,
    'Accept': 'application/vnd.api+json',
    'revision': apiVersion,
    'Content-Type': 'application/json'
  };
}

/**
 * Generate a random request ID for logging
 * 
 * @returns Random request ID
 */
export function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Log API request details
 * 
 * @param requestId Request ID for tracking
 * @param endpoint API endpoint
 * @param url Full URL
 * @param maskedKey Masked API key
 */
export function logRequest(requestId: string, endpoint: string, url: string, maskedKey: string): void {
  console.log(`API Request [${requestId}]: ${endpoint} starting with API key: ${maskedKey}`);
  console.log(`API Request [${requestId}]: URL: ${url}`);
}

/**
 * Log API response headers
 * 
 * @param requestId Request ID for tracking
 * @param headers Response headers
 */
export function logResponseHeaders(requestId: string, headers: Headers): void {
  console.log(`API Request [${requestId}]: Response headers:`, {
    'content-type': headers.get('content-type'),
    'x-rate-limit-remaining': headers.get('x-rate-limit-remaining'),
    'x-rate-limit-reset': headers.get('x-rate-limit-reset')
  });
}

/**
 * Validate response content type
 * 
 * @param requestId Request ID for tracking
 * @param contentType Content type header
 * @param response Response object
 * @throws {ApiError} If content type is not JSON or JSON:API
 */
export async function validateContentType(requestId: string, contentType: string | null, response: Response): Promise<void> {
  if (!contentType || (!contentType.includes('application/json') && !contentType.includes('application/vnd.api+json'))) {
    console.warn(`API Request [${requestId}]: Non-JSON response (${contentType})`);
    const text = await response.text();
    console.log(`API Request [${requestId}]: Response text:`, text.substring(0, 1000));
    throw new ApiError(`Klaviyo API returned non-JSON response: ${contentType}`);
  }
}

/**
 * Parse JSON response
 * 
 * @param requestId Request ID for tracking
 * @param response Response object
 * @returns Parsed JSON data
 * @throws {ApiError} If JSON parsing fails
 */
export async function parseJsonResponse<T>(requestId: string, response: Response): Promise<T> {
  try {
    return await response.json() as T;
  } catch (jsonError) {
    console.error(`API Request [${requestId}]: JSON parsing error:`, jsonError);
    throw new ApiError(`Failed to parse JSON response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
  }
}

/**
 * Log successful API request completion
 * 
 * @param requestId Request ID for tracking
 * @param endpoint API endpoint
 * @param data Response data
 */
export function logSuccess(requestId: string, endpoint: string, data: any): void {
  console.log(`API Request [${requestId}]: ${endpoint} completed successfully`);
  console.log(`API Request [${requestId}]: Response data:`, JSON.stringify(data).substring(0, 500) + '...');
}

/**
 * Log API request failure
 * 
 * @param requestId Request ID for tracking
 * @param retries Number of retries
 * @param error Error object
 */
export function logFailure(requestId: string, retries: number, error: Error): void {
  console.error(`API Request [${requestId}]: Failed after ${retries} retries:`, error);
}

/**
 * Log retry attempt
 * 
 * @param requestId Request ID for tracking
 * @param attempt Attempt number
 * @param maxRetries Maximum number of retries
 * @param error Error message
 * @param delayMs Delay before retry in milliseconds
 */
export function logRetry(requestId: string, attempt: number, maxRetries: number, error: string, delayMs: number): void {
  console.warn(`API Request [${requestId}]: Request failed (attempt ${attempt}/${maxRetries}): ${error}`);
  console.warn(`API Request [${requestId}]: Retrying after ${delayMs}ms...`);
}
