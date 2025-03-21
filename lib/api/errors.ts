/**
 * Error handling for the API client
 */

import { toast } from '../../components/ui/use-toast';

export enum ApiErrorType {
  Network = 'NETWORK_ERROR',
  RateLimit = 'RATE_LIMIT',
  Authentication = 'AUTHENTICATION_ERROR',
  NotFound = 'NOT_FOUND',
  Validation = 'VALIDATION_ERROR',
  Server = 'SERVER_ERROR',
  Unknown = 'UNKNOWN_ERROR'
}

export class ApiError extends Error {
  constructor(
    public type: ApiErrorType,
    message: string,
    public status?: number,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const ERROR_MESSAGES = {
  [ApiErrorType.Network]: 'Unable to connect to the server. Please check your internet connection.',
  [ApiErrorType.RateLimit]: 'Too many requests. Please try again in a moment.',
  [ApiErrorType.Authentication]: 'Authentication failed. Please check your API key.',
  [ApiErrorType.NotFound]: 'The requested resource was not found.',
  [ApiErrorType.Validation]: 'Invalid request. Please check your input.',
  [ApiErrorType.Server]: 'Server error. Our team has been notified.',
  [ApiErrorType.Unknown]: 'An unexpected error occurred. Please try again.'
};

/**
 * Show error notification to user
 */
export function showErrorNotification(error: ApiError): void {
  toast.destructive({
    title: "Error",
    description: ERROR_MESSAGES[error.type]
  });
}

/**
 * Create network error
 */
export function createNetworkError(): ApiError {
  const error = new ApiError(
    ApiErrorType.Network,
    'Network request failed',
    undefined
  );
  showErrorNotification(error);
  return error;
}

/**
 * Create API error from response
 */
export function createApiError(
  status: number,
  message: string,
  retryAfter?: number
): ApiError {
  let errorType: ApiErrorType;
  
  switch (status) {
    case 429:
      errorType = ApiErrorType.RateLimit;
      break;
    case 401:
    case 403:
      errorType = ApiErrorType.Authentication;
      break;
    case 404:
      errorType = ApiErrorType.NotFound;
      break;
    case 422:
      errorType = ApiErrorType.Validation;
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      errorType = ApiErrorType.Server;
      break;
    default:
      errorType = ApiErrorType.Unknown;
  }

  const error = new ApiError(errorType, message, status, retryAfter);
  showErrorNotification(error);
  return error;
}

/**
 * Create unknown error
 */
export function createUnknownError(error: unknown): ApiError {
  const apiError = new ApiError(
    ApiErrorType.Unknown,
    error instanceof Error ? error.message : 'Unknown error occurred',
    undefined
  );
  showErrorNotification(apiError);
  return apiError;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: ApiError): boolean {
  return [ApiErrorType.Network, ApiErrorType.Server].includes(error.type);
}
