import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Initialize Redis client with fallback to in-memory cache if Redis is not available
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class CacheService {
  private redis: Redis | null = null;
  private memoryCache: Map<string, { value: any; expires: number }> = new Map();
  private isRedisAvailable: boolean = false;

  constructor() {
    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redis = new Redis(REDIS_URL, {
        retryStrategy: (times: number): number => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.redis.on('error', (error: Error) => {
        logger.error('Redis connection error:', error);
        this.isRedisAvailable = false;
      });

      this.redis.on('connect', () => {
        logger.info('Connected to Redis successfully');
        this.isRedisAvailable = true;
      });
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      this.isRedisAvailable = false;
    }
  }

  private getMemoryCache(key: string): any | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  private setMemoryCache(key: string, value: any, ttlSeconds: number): void {
    this.memoryCache.set(key, {
      value,
      expires: Date.now() + (ttlSeconds * 1000),
    });
  }

  async get(key: string): Promise<any | null> {
    try {
      if (this.isRedisAvailable && this.redis) {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      }
      return this.getMemoryCache(key);
    } catch (error) {
      logger.error('Cache get error:', error);
      return this.getMemoryCache(key);
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 900): Promise<void> {
    try {
      if (this.isRedisAvailable && this.redis) {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
      }
      this.setMemoryCache(key, value, ttlSeconds);
    } catch (error) {
      logger.error('Cache set error:', error);
      this.setMemoryCache(key, value, ttlSeconds);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (this.isRedisAvailable && this.redis) {
        await this.redis.del(key);
      }
      this.memoryCache.delete(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
      this.memoryCache.delete(key);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      if (this.isRedisAvailable && this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
      
      // Delete matching keys from memory cache
      for (const key of this.memoryCache.keys()) {
        if (key.includes(pattern)) {
          this.memoryCache.delete(key);
        }
      }
    } catch (error) {
      logger.error('Cache deletePattern error:', error);
    }
  }

  async clearAll(): Promise<void> {
    try {
      if (this.isRedisAvailable && this.redis) {
        await this.redis.flushdb();
      }
      this.memoryCache.clear();
    } catch (error) {
      logger.error('Cache clearAll error:', error);
      this.memoryCache.clear();
    }
  }
}

export const cacheService = new CacheService();
