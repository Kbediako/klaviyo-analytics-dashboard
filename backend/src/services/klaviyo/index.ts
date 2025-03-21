/**
 * Klaviyo API Client Module
 * 
 * This module provides a comprehensive client for interacting with the Klaviyo API.
 * It includes:
 * - Type definitions for Klaviyo API responses and entities
 * - Core API client with authentication, rate limiting, and error handling
 * - Endpoint-specific methods for common Klaviyo resources
 * - Utility functions for working with the API
 * 
 * @example
 * ```typescript
 * // Import the default client instance
 * import klaviyoApi from './services/klaviyo';
 * 
 * // Use endpoint methods
 * const campaigns = await klaviyoApi.getCampaigns({
 *   start: '2023-01-01T00:00:00Z',
 *   end: '2023-01-31T23:59:59Z'
 * });
 * 
 * // Or import specific components
 * import { KlaviyoApiClient, klaviyoApiEndpoints } from './services/klaviyo';
 * ```
 */

// Export types
export * from './types';

// Export utility functions
export * from './klaviyoApiUtils';

// Export core client
export { KlaviyoApiClient, klaviyoApiClient } from './klaviyoApiClient';

// Export endpoints
export { KlaviyoApiEndpoints, klaviyoApiEndpoints } from './klaviyoApiEndpoints';

// Export default client for convenience
import { klaviyoApiEndpoints } from './klaviyoApiEndpoints';
export default klaviyoApiEndpoints;
