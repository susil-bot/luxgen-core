/**
 * Caching System
 * Provides Redis-based caching with automatic serialization/deserialization
 */

const Redis = require('redis');
const logger = require('./logger');

class EnhancedCacheManager {
  constructor() {
    this.redisClient = null;
    this.memoryCache = new Map();
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour default
    this.maxMemorySize = 100; // Maximum items in memory cache
  }

  /**
   * Initialize cache with Redis connection
   */
  async connect() {
    try {
      logger.info('🔌 Connecting to Redis cache...');
      
      const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;
      
      this.redisClient = Redis.createClient({
        url: redisUrl,
        password: process.env.REDIS_PASSWORD || undefined,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('The server refused the connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      await this.redisClient.connect();
      this.isConnected = true;
      
      logger.info('✅ Redis cache connected successfully');
      
      // Set up event handlers
      this.redisClient.on('error', (error) => {
        logger.error('❌ Redis cache error:', error);
        this.isConnected = false;
      });
      
      this.redisClient.on('connect', () => {
        logger.info('✅ Redis cache connected');
        this.isConnected = true;
      });
      
      this.redisClient.on('disconnect', () => {
        logger.warn('⚠️ Redis cache disconnected');
        this.isConnected = false;
      });
      
      return true;
    } catch (error) {
      logger.warn('⚠️ Redis cache connection failed, falling back to memory cache:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Get value from cache
   */
  async get(key) {
    try {
      if (this.isConnected && this.redisClient) {
        const value = await this.redisClient.get(key);
        if (value) {
          logger.debug(`📥 Cache hit (Redis): ${key}`);
          return JSON.parse(value);
        }
      } else {
        // Fallback to memory cache
        const item = this.memoryCache.get(key);
        if (item && item.expiresAt > Date.now()) {
          logger.debug(`📥 Cache hit (Memory): ${key}`);
          return item.value;
        } else if (item) {
          // Remove expired item
          this.memoryCache.delete(key);
        }
      }
      
      logger.debug(`📤 Cache miss: ${key}`);
      return null;
    } catch (error) {
      logger.error('❌ Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (this.isConnected && this.redisClient) {
        await this.redisClient.setex(key, ttl, JSON.stringify(value));
        logger.debug(`💾 Cache set (Redis): ${key}, TTL: ${ttl}s`);
      } else {
        // Fallback to memory cache
        this.setMemoryCache(key, value, ttl);
        logger.debug(`💾 Cache set (Memory): ${key}, TTL: ${ttl}s`);
      }
      return true;
    } catch (error) {
      logger.error('❌ Cache set error:', error);
      return false;
    }
  }

  /**
   * Set value in memory cache with TTL
   */
  setMemoryCache(key, value, ttl) {
    // Clean up expired items first
    this.cleanupMemoryCache();
    
    // Check if we need to evict items
    if (this.memoryCache.size >= this.maxMemorySize) {
      this.evictOldestItem();
    }
    
    const expiresAt = Date.now() + (ttl * 1000);
    this.memoryCache.set(key, { value, expiresAt });
  }

  /**
   * Delete value from cache
   */
  async delete(key) {
    try {
      if (this.isConnected && this.redisClient) {
        await this.redisClient.del(key);
        logger.debug(`🗑️ Cache delete (Redis): ${key}`);
      } else {
        this.memoryCache.delete(key);
        logger.debug(`🗑️ Cache delete (Memory): ${key}`);
      }
      return true;
    } catch (error) {
      logger.error('❌ Cache delete error:', error);
      return false;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidate(pattern) {
    try {
      if (this.isConnected && this.redisClient) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
          logger.info(`🗑️ Cache invalidated (Redis): ${pattern}, ${keys.length} keys`);
        }
      } else {
        // Fallback to memory cache pattern matching
        this.invalidateMemoryCache(pattern);
      }
      return true;
    } catch (error) {
      logger.error('❌ Cache invalidate error:', error);
      return false;
    }
  }

  /**
   * Invalidate memory cache by pattern
   */
  invalidateMemoryCache(pattern) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let deletedCount = 0;
    
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      logger.info(`🗑️ Cache invalidated (Memory): ${pattern}, ${deletedCount} keys`);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      const stats = {
        isConnected: this.isConnected,
        memoryCacheSize: this.memoryCache.size,
        timestamp: new Date().toISOString()
      };
      
      if (this.isConnected && this.redisClient) {
        const info = await this.redisClient.info();
        stats.redisInfo = info;
      }
      
      return stats;
    } catch (error) {
      logger.error('❌ Cache stats error:', error);
      return { error: error.message };
    }
  }

  /**
   * Clean up expired items from memory cache
   */
  cleanupMemoryCache() {
    const now = Date.now();
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.expiresAt <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Evict oldest item from memory cache
   */
  evictOldestItem() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.expiresAt < oldestTime) {
        oldestTime = item.expiresAt;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      logger.debug(`🗑️ Evicted oldest cache item: ${oldestKey}`);
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      if (this.isConnected && this.redisClient) {
        await this.redisClient.flushall();
        logger.info('🗑️ Cache cleared (Redis)');
      } else {
        this.memoryCache.clear();
        logger.info('🗑️ Cache cleared (Memory)');
      }
      return true;
    } catch (error) {
      logger.error('❌ Cache clear error:', error);
      return false;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect() {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
        this.isConnected = false;
        logger.info('✅ Redis cache disconnected');
      }
    } catch (error) {
      logger.error('❌ Cache disconnect error:', error);
    }
  }

  /**
   * Cache middleware for Express routes
   */
  cacheMiddleware(ttl = this.defaultTTL, keyGenerator = null) {
    return async (req, res, next) => {
      try {
        // Generate cache key
        const cacheKey = keyGenerator ? keyGenerator(req) : `route:${req.method}:${req.originalUrl}`;
        
        // Try to get from cache
        const cachedResponse = await this.get(cacheKey);
        if (cachedResponse) {
          return res.json(cachedResponse);
        }
        
        // Store original send method
        const originalSend = res.json;
        
        // Override send method to cache response
        res.json = function(data) {
          // Cache the response
          this.set(cacheKey, data, ttl);
          
          // Call original send method
          return originalSend.call(this, data);
        }.bind(this);
        
        next();
      } catch (error) {
        logger.error('❌ Cache middleware error:', error);
        next();
      }
    };
  }
}

// Create singleton instance
const cacheManager = new EnhancedCacheManager();

module.exports = cacheManager; 