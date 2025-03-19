import rateLimit from 'express-rate-limit';

/**
 * Create a rate limiter middleware for API endpoints
 * 
 * @param windowMs Time window in milliseconds
 * @param max Maximum number of requests per window
 * @param message Error message to return when rate limit is exceeded
 * @returns Express middleware function
 */
export function createRateLimiter(
  windowMs: number = 60 * 1000, // 1 minute
  max: number = 60, // 60 requests per minute
  message: string = 'Too many requests, please try again later.'
) {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
}

/**
 * Default rate limiter for API endpoints
 * Limits to 60 requests per minute
 */
export const defaultRateLimiter = createRateLimiter();

/**
 * Strict rate limiter for expensive API endpoints
 * Limits to 20 requests per minute
 */
export const strictRateLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  20, // 20 requests per minute
  'Rate limit exceeded for this endpoint. Please try again later.'
);

/**
 * Very strict rate limiter for the most expensive API endpoints
 * Limits to 5 requests per minute
 */
export const veryStrictRateLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  5, // 5 requests per minute
  'Rate limit exceeded for this resource-intensive endpoint. Please try again later.'
);
