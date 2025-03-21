/**
 * Caching functionality for the API client
 */

import { CacheEntry } from './types';

// Cache TTL in milliseconds (15 minutes)
export const CACHE_TTL = 15 * 60 * 1000;

// Simple in-memory cache
const cache = new Map<string, CacheEntry<any>>();

// Pending requests cache to prevent duplicate in-flight requests
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Get cached entry if valid
 */
export function getCachedEntry<T>(cacheKey: string): T | null {
  const cachedEntry = cache.get(cacheKey);
  if (cachedEntry && (Date.now() - cachedEntry.timestamp) < CACHE_TTL) {
    return cachedEntry.data as T;
  }
  return null;
}

/**
 * Store data in cache
 */
export function setCacheEntry<T>(cacheKey: string, data: T): void {
  cache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Get pending request if exists
 */
export function getPendingRequest<T>(cacheKey: string): Promise<T> | null {
  return pendingRequests.get(cacheKey) as Promise<T> | null;
}

/**
 * Store pending request
 */
export function setPendingRequest<T>(cacheKey: string, promise: Promise<T>): void {
  pendingRequests.set(cacheKey, promise);
}

/**
 * Remove pending request
 */
export function removePendingRequest(cacheKey: string): void {
  pendingRequests.delete(cacheKey);
}

/**
 * Clear cache for specific endpoint or all cache
 */
export function clearCache(baseUrl: string, endpoint?: string): void {
  if (endpoint) {
    // Clear specific endpoint
    const prefix = `${baseUrl}${endpoint}`;
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        cache.delete(key);
      }
    }
  } else {
    // Clear entire cache
    cache.clear();
  }
}

/**
 * Generate cache key from URL and options
 */
export function generateCacheKey(url: string, options: Record<string, any>): string {
  return `${url}:${JSON.stringify(options)}`;
}

/**
 * Force refresh event dispatcher
 */
export function dispatchForceRefreshEvent(): void {
  if (typeof window !== 'undefined') {
    const refreshEvent = new CustomEvent('forceDataRefresh');
    window.dispatchEvent(refreshEvent);
  }
}
