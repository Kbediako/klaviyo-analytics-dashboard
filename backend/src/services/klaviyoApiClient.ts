/**
 * @deprecated This file is deprecated and will be removed in a future version.
 * Please import from './klaviyo' instead.
 * 
 * Example:
 * ```typescript
 * // Old import
 * import klaviyoApiClient from './klaviyoApiClient';
 * 
 * // New import
 * import klaviyoApi from './klaviyo';
 * ```
 */

// Re-export everything from the refactored module
export * from './klaviyo';

// Re-export default for backward compatibility
import klaviyoApi from './klaviyo';
export default klaviyoApi;
