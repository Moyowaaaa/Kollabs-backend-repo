import { getRedisClient } from "../lib/redis";

/**
 * Cache Service - Provides Redis caching utilities
 * Gracefully handles cases where Redis is unavailable
 */
export const CacheService = {
  /**
   * Get cached data by key
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const redis = await getRedisClient();
      if (!redis) return null; // Redis unavailable, skip cache

      const data = await redis.get(key);
      if (data) {
        console.log(`🎯 CACHE HIT: ${key}`);
        return JSON.parse(data) as T;
      }
      console.log(`❌ CACHE MISS: ${key}`);
      return null;
    } catch (error) {
      console.error(`Cache GET error for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set data in cache with TTL
   * @param ttlSeconds - Time to live in seconds (default: 5 minutes)
   */
  async set(key: string, data: unknown, ttlSeconds = 300): Promise<void> {
    try {
      const redis = await getRedisClient();
      if (!redis) return; // Redis unavailable, skip cache

      await redis.setex(key, ttlSeconds, JSON.stringify(data));
      console.log(`💾 CACHE SET: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      console.error(`Cache SET error for key ${key}:`, error);
    }
  },

  /**
   * Delete a specific key from cache
   */
  async delete(key: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      if (!redis) return; // Redis unavailable, skip

      await redis.del(key);
    } catch (error) {
      console.error(`Cache DELETE error for key ${key}:`, error);
    }
  },

  /**
   * Invalidate all keys matching a pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      if (!redis) return; // Redis unavailable, skip

      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(
          `🗑️ Invalidated ${keys.length} cache keys matching: ${pattern}`,
        );
      }
    } catch (error) {
      console.error(`Cache INVALIDATE error for pattern ${pattern}:`, error);
    }
  },
};

export default CacheService;
