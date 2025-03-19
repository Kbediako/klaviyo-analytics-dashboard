import cache from './cacheUtils';

describe('Cache Utilities', () => {
  beforeEach(() => {
    // Clear the cache before each test
    cache.clear();
  });
  
  it('should store and retrieve values', () => {
    const key = 'test-key';
    const value = { data: 'test-value' };
    
    cache.set(key, value, 60);
    const retrieved = cache.get(key);
    
    expect(retrieved).toEqual(value);
  });
  
  it('should return undefined for expired values', async () => {
    const key = 'expired-key';
    const value = { data: 'expired-value' };
    
    // Set with a very short TTL
    cache.set(key, value, 0.01); // 10ms
    
    // Wait for expiry
    await new Promise(resolve => setTimeout(resolve, 20));
    
    const retrieved = cache.get(key);
    expect(retrieved).toBeUndefined();
  });
  
  it('should delete values', () => {
    const key = 'delete-key';
    const value = { data: 'delete-value' };
    
    cache.set(key, value, 60);
    cache.delete(key);
    
    const retrieved = cache.get(key);
    expect(retrieved).toBeUndefined();
  });
  
  it('should clear all values', () => {
    cache.set('key1', 'value1', 60);
    cache.set('key2', 'value2', 60);
    
    cache.clear();
    
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBeUndefined();
  });
  
  it('should compute and cache values with getOrCompute', async () => {
    const key = 'compute-key';
    const computeFn = jest.fn().mockResolvedValue('computed-value');
    
    // First call should compute
    const result1 = await cache.getOrCompute(key, computeFn, 60);
    expect(result1).toBe('computed-value');
    expect(computeFn).toHaveBeenCalledTimes(1);
    
    // Second call should use cache
    const result2 = await cache.getOrCompute(key, computeFn, 60);
    expect(result2).toBe('computed-value');
    expect(computeFn).toHaveBeenCalledTimes(1); // Still only called once
  });
  
  it('should recompute expired values with getOrCompute', async () => {
    const key = 'recompute-key';
    const computeFn = jest.fn().mockResolvedValue('recomputed-value');
    
    // Set with a very short TTL
    await cache.getOrCompute(key, computeFn, 0.01); // 10ms
    
    // Wait for expiry
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // Should recompute
    await cache.getOrCompute(key, computeFn, 60);
    expect(computeFn).toHaveBeenCalledTimes(2);
  });
});
