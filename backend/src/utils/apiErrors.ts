/**
 * Custom error classes for API-related errors
 * These provide more specific error types for better error handling and debugging
 * 
 * The error hierarchy allows for more granular error handling in the application:
 * - ApiError (base class)
 *   - AuthenticationError (401, 403)
 *   - RateLimitError (429)
 *   - NotFoundError (404)
 *   - ValidationError (422)
 *   - ServerError (500, 502, 503, 504)
 *   - NetworkError (connection issues)
 *   - TimeoutError (request timeouts)
 * 
 * @example
 * ```typescript
 * try {
 *   await klaviyoApiClient.get('api/campaigns');
 * } catch (error) {
 *   if (error instanceof AuthenticationError) {
 *     // Handle authentication issues
 *   } else if (error instanceof RateLimitError) {
 *     // Handle rate limiting
 *   } else if (error instanceof ApiError) {
 *     // Handle other API errors
 *   } else {
 *     // Handle unexpected errors
 *   }
 * }
 * ```
 */

/**
 * Base class for all API-related errors
 * 
 * This is the parent class for all specific API error types.
 * It extends the standard Error class with additional properties
 * and methods specific to API errors.
 * 
 * @property name The name of the error ('ApiError')
 * @property message The error message
 * @property timestamp When the error occurred
 */
export class ApiError extends Error {
  public timestamp: Date;
  
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
    this.timestamp = new Date();
    Object.setPrototypeOf(this, ApiError.prototype);
  }
  
  /**
   * Get a formatted string representation of the error
   * 
   * @returns Formatted error string with timestamp
   */
  public toString(): string {
    return `[${this.timestamp.toISOString()}] ${this.name}: ${this.message}`;
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = 'API authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Error thrown when rate limits are exceeded
 */
export class RateLimitError extends ApiError {
  public retryAfter: number;

  constructor(message: string, retryAfter: number = 60000) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Error thrown when a resource is not found
 */
export class NotFoundError extends ApiError {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `Resource not found: ${resource} with ID ${id}`
      : `Resource not found: ${resource}`;
    super(message);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Error thrown when a request is invalid
 */
export class ValidationError extends ApiError {
  public errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown when the API returns a server error
 */
export class ServerError extends ApiError {
  public statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'ServerError';
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Error thrown when a network error occurs
 */
export class NetworkError extends ApiError {
  constructor(message: string = 'Network error occurred') {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Error thrown when a request times out
 */
export class TimeoutError extends ApiError {
  constructor(message: string = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Map HTTP status codes to appropriate error classes
 * 
 * @param statusCode HTTP status code
 * @param message Error message
 * @param retryAfter Retry-After header value (for rate limit errors)
 * @returns Appropriate error instance
 */
export function createErrorFromStatus(
  statusCode: number,
  message: string,
  retryAfter?: number
): ApiError {
  switch (statusCode) {
    case 401:
    case 403:
      return new AuthenticationError(message);
    case 404:
      return new NotFoundError(message);
    case 422:
      return new ValidationError(message);
    case 429:
      return new RateLimitError(message, retryAfter);
    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(message, statusCode);
    default:
      return new ApiError(message);
  }
}
