/**
 * Simple in-memory cache implementation
 */

interface CacheItem<T> {
  value: T;
  expiry: number;
}

class Cache {
  private cache: Map<string, CacheItem<any>>;
  
  constructor() {
    this.cache = new Map();
  }
  
  /**
   * Set a value in the cache with an expiry time
   * 
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds Time to live in seconds
   */
  set<T>(key: string, value: T, ttlSeconds: number): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiry });
  }
  
  /**
   * Get a value from the cache
   * 
   * @param key Cache key
   * @returns Cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    // Return undefined if item doesn't exist
    if (!item) {
      return undefined;
    }
    
    // Return undefined if item has expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value as T;
  }
  
  /**
   * Delete a value from the cache
   * 
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all values from the cache or those matching a pattern
   * 
   * @param pattern Optional RegExp to match cache keys
   */
  clear(pattern?: RegExp): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    // Delete all keys matching the pattern
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        console.log(`Deleted cache key: ${key}`);
      }
    }
  }
  
  /**
   * Get a value from the cache or compute it if not found
   * 
   * @param key Cache key
   * @param fn Function to compute the value if not found
   * @param ttlSeconds Time to live in seconds
   * @returns Cached or computed value
   */
  async getOrCompute<T>(
    key: string,
    fn: () => Promise<T>,
    ttlSeconds: number
  ): Promise<T> {
    const cachedValue = this.get<T>(key);
    
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    const computedValue = await fn();
    this.set(key, computedValue, ttlSeconds);
    
    return computedValue;
  }
}

// Create a singleton instance
const cache = new Cache();

export default cache;
