/**
 * Rate Limit Manager for Klaviyo API
 * 
 * This module provides a singleton service for managing API rate limits
 * with dynamic backoff based on Klaviyo API response headers.
 * 
 * The Klaviyo API uses rate limiting to ensure fair usage of the API.
 * This manager helps to avoid hitting rate limits by:
 * 1. Tracking rate limit information from API response headers
 * 2. Calculating appropriate delays between requests
 * 3. Distributing requests evenly over time
 * 
 * @see https://developers.klaviyo.com/en/docs/rate_limits_and_error_handling
 */
import { Headers as NodeFetchHeaders } from 'node-fetch';

// Type for headers that works with both browser Headers and node-fetch Headers
type HeadersLike = {
  get(name: string): string | null;
};

/**
 * Rate limit information extracted from API response headers
 */
interface RateLimitInfo {
  // Number of requests remaining in the current time window
  remaining: number;
  
  // Timestamp when the rate limit will reset (in milliseconds)
  resetTime: number;
  
  // Burst rate limit remaining (for high-frequency requests)
  burstRemaining?: number;
  
  // Steady rate limit remaining (for sustained requests)
  steadyRemaining?: number;
}

/**
 * Manages rate limiting for API endpoints with dynamic backoff
 */
export class RateLimitManager {
  private static instance: RateLimitManager;
  
  // Store rate limit info by endpoint
  private rateLimits: Map<string, RateLimitInfo> = new Map();
  
  // Default delay between requests (in milliseconds)
  private defaultDelay: number = 1000;
  
  // Minimum delay between requests (in milliseconds)
  private minDelay: number = 200;
  
  // Maximum delay between requests (in milliseconds)
  private maxDelay: number = 10000;
  
  // Safety buffer to avoid hitting rate limits (percentage)
  private safetyBuffer: number = 0.1;
  
  // Endpoint tiers for rate limiting (based on Klaviyo API documentation)
  private endpointTiers: Record<string, string> = {
    // High-volume endpoints (Tier L)
    'profiles': 'L',
    'events': 'L',
    'metrics': 'L',
    
    // Medium-volume endpoints (Tier M)
    'campaigns': 'M',
    'flows': 'M',
    'segments': 'M',
    'lists': 'M',
    
    // Standard endpoints (Tier S)
    'templates': 'S',
    'tags': 'S',
    'accounts': 'S'
  };
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}
  
  /**
   * Get the singleton instance of RateLimitManager
   * 
   * @returns RateLimitManager instance
   */
  public static getInstance(): RateLimitManager {
    if (!RateLimitManager.instance) {
      RateLimitManager.instance = new RateLimitManager();
    }
    return RateLimitManager.instance;
  }
  
  /**
   * Update rate limit information from API response headers
   * 
   * @param endpoint API endpoint
   * @param headers Response headers (works with both browser Headers and node-fetch Headers)
   */
  public updateFromHeaders(endpoint: string, headers: HeadersLike | Record<string, any> | null | undefined): void {
    if (!headers) return;
    
    // Normalize endpoint to handle path variations
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    
    // Function to safely get header values
    const getHeader = (name: string): string | null => {
      if (typeof headers.get === 'function') {
        return headers.get(name);
      } else if (typeof headers === 'object' && headers !== null) {
        const record = headers as Record<string, any>;
        if (record[name]) {
          return record[name].toString();
        }
      }
      return null;
    };
    
    // Extract rate limit information from headers
    const remaining = parseInt(getHeader('x-rate-limit-remaining') || '-1', 10);
    const resetTime = parseInt(getHeader('x-rate-limit-reset') || '-1', 10) * 1000; // Convert to ms
    const burstRemaining = parseInt(getHeader('x-rate-limit-burst-remaining') || '-1', 10);
    const steadyRemaining = parseInt(getHeader('x-rate-limit-steady-remaining') || '-1', 10);
    
    // Only update if we have valid rate limit information
    if (remaining >= 0 || burstRemaining >= 0 || steadyRemaining >= 0) {
      this.rateLimits.set(normalizedEndpoint, {
        remaining: remaining >= 0 ? remaining : Number.MAX_SAFE_INTEGER,
        resetTime: resetTime > 0 ? resetTime : Date.now() + 60000, // Default to 1 minute
        burstRemaining: burstRemaining >= 0 ? burstRemaining : undefined,
        steadyRemaining: steadyRemaining >= 0 ? steadyRemaining : undefined
      });
      
      console.log(`Rate limit updated for ${normalizedEndpoint}:`, {
        remaining,
        resetTime: new Date(resetTime).toISOString(),
        burstRemaining,
        steadyRemaining
      });
    }
  }
  
  /**
   * Calculate delay before next request based on rate limit information
   * 
   * @param endpoint API endpoint
   * @returns Delay in milliseconds
   */
  public async calculateDelay(endpoint: string): Promise<number> {
    // Normalize endpoint to handle path variations
    const normalizedEndpoint = this.normalizeEndpoint(endpoint);
    
    // Get endpoint tier for more intelligent rate limiting
    const tier = this.getEndpointTier(normalizedEndpoint);
    
    // Adjust default delay based on endpoint tier
    const tierBasedDelay = this.getDelayForTier(tier);
    
    // Get rate limit info for this endpoint
    const rateLimitInfo = this.rateLimits.get(normalizedEndpoint);
    
    // If no rate limit info, use tier-based default delay
    if (!rateLimitInfo) {
      return tierBasedDelay;
    }
    
    // Calculate time until reset
    const now = Date.now();
    const timeUntilReset = Math.max(0, rateLimitInfo.resetTime - now);
    
    // If reset time is in the past, use default delay
    if (timeUntilReset <= 0) {
      return this.defaultDelay;
    }
    
    // Calculate remaining requests (use the most restrictive limit)
    const effectiveRemaining = Math.min(
      rateLimitInfo.remaining,
      rateLimitInfo.burstRemaining !== undefined ? rateLimitInfo.burstRemaining : Number.MAX_SAFE_INTEGER,
      rateLimitInfo.steadyRemaining !== undefined ? rateLimitInfo.steadyRemaining : Number.MAX_SAFE_INTEGER
    );
    
    // Apply safety buffer to avoid hitting rate limits
    const safeRemaining = Math.floor(effectiveRemaining * (1 - this.safetyBuffer));
    
    // If we're out of requests, wait until reset
    if (safeRemaining <= 0) {
      console.warn(`Rate limit exhausted for ${normalizedEndpoint}, waiting ${timeUntilReset}ms until reset`);
      return Math.min(timeUntilReset, this.maxDelay);
    }
    
    // Calculate delay based on remaining requests and time until reset
    // Distribute remaining requests evenly over the time until reset
    const calculatedDelay = timeUntilReset / safeRemaining;
    
    // Ensure delay is within bounds
    const boundedDelay = Math.max(this.minDelay, Math.min(calculatedDelay, this.maxDelay));
    
    console.log(`Rate limit delay for ${normalizedEndpoint}: ${boundedDelay}ms (${safeRemaining} requests remaining, reset in ${timeUntilReset}ms)`);
    
    return boundedDelay;
  }
  
  /**
   * Normalize endpoint to handle path variations
   * 
   * @param endpoint API endpoint
   * @returns Normalized endpoint
   */
  private normalizeEndpoint(endpoint: string): string {
    // Remove leading slash and api/ prefix if present
    let normalized = endpoint.replace(/^\//, '').replace(/^api\//, '');
    
    // Extract base resource type (e.g., 'campaigns' from 'campaigns/123')
    const parts = normalized.split('/');
    return parts[0];
  }
  
  /**
   * Clear rate limit information for all endpoints
   */
  public clearRateLimits(): void {
    this.rateLimits.clear();
  }
  
  /**
   * Set default delay between requests
   * 
   * @param delay Default delay in milliseconds
   */
  public setDefaultDelay(delay: number): void {
    this.defaultDelay = delay;
  }
  
  /**
   * Set safety buffer percentage
   * 
   * @param buffer Safety buffer as a decimal (0.1 = 10%)
   */
  public setSafetyBuffer(buffer: number): void {
    this.safetyBuffer = Math.max(0, Math.min(buffer, 0.5)); // Limit to 0-50%
  }
  
  /**
   * Get the rate limit tier for an endpoint
   * 
   * @param endpoint Normalized endpoint name
   * @returns Rate limit tier ('L', 'M', 'S')
   */
  private getEndpointTier(endpoint: string): string {
    return this.endpointTiers[endpoint] || 'S'; // Default to standard tier
  }
  
  /**
   * Get the appropriate delay for a rate limit tier
   * 
   * @param tier Rate limit tier ('L', 'M', 'S')
   * @returns Delay in milliseconds
   */
  private getDelayForTier(tier: string): number {
    switch (tier) {
      case 'L': // High-volume endpoints
        return 500; // Lower delay for high-volume endpoints
      case 'M': // Medium-volume endpoints
        return 750; // Medium delay
      case 'S': // Standard endpoints
      default:
        return this.defaultDelay; // Standard delay
    }
  }
}

// Export singleton instance
export default RateLimitManager.getInstance();
