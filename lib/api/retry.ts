/**
 * Retry logic for the API client
 */

import { ApiError } from './errors';
import { isRetryableError } from './errors';
import { INITIAL_RETRY_DELAY, MAX_RETRIES } from './config';

/**
 * Implements exponential backoff retry logic
 * 
 * @param operation Function to retry
 * @param retryCount Current retry attempt
 * @returns Promise with operation result
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  retryCount = 0
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // Only retry for certain error types
    if (
      error instanceof ApiError &&
      isRetryableError(error) &&
      retryCount < MAX_RETRIES
    ) {
      // Calculate delay with exponential backoff
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      
      console.log(`Retry attempt ${retryCount + 1} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Recursive retry with incremented count
      return withRetry(operation, retryCount + 1);
    }
    
    // If we've exhausted retries or it's not a retryable error, rethrow
    throw error;
  }
}

/**
 * Handle rate limiting with exponential backoff
 */
export async function handleRateLimit(retryAfter: number): Promise<void> {
  const backoffTime = retryAfter * 1000 || 60000;
  console.warn(`Rate limit hit. Backing off for ${backoffTime}ms`);
  await new Promise(resolve => setTimeout(resolve, backoffTime));
}
