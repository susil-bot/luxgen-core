/**
 * Caching System
 * Provides Redis-based caching with automatic serialization/deserialization
 */

const Redis = require('redis');
const environmentConfig = require('../config/environment');

class CacheManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = environmentConfig.get('CACHE_TTL', 3600);
  }

  async connect() {
    try {
      if (this.isConnected) {
        return this.client;
      }

      const redisConfig = environmentConfig.getDatabaseConfig().redis;
      
      this.client = Redis.createClient(redisConfig);
      
      this.client.on('error', (err) => {
        console.error('❌ Redis cache error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis cache connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('⚠️ Redis cache disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('❌ Failed to connect to Redis cache:', error.message);
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Redis cache is optional for development - continuing without cache');
        this.isConnected = false;
        this.client = null;
        return null;
      } else {
        this.isConnected = false;
        return null;
      }
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      console.log('✅ Redis cache disconnected');
    }
  }

  // Generate cache key
  generateKey(prefix, ...parts) {
    const keyParts = [prefix, ...parts.filter(part => part !== undefined && part !== null)];
    return keyParts.join(':');
  }

  // Set cache with automatic serialization
  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }

      const serializedValue = JSON.stringify(value);
      await this.client.setEx(key, ttl, serializedValue);
      return true;
    } catch (error) {
      console.error('❌ Cache set error:', error.message);
      return false;
    }
  }

  // Get cache with automatic deserialization
  async get(key) {
    try {
      if (!this.isConnected || !this.client) {
        return null;
      }

      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('❌ Cache get error:', error.message);
      return null;
    }
  }

  // Delete cache key
  async del(key) {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }

      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('❌ Cache delete error:', error.message);
      return false;
    }
  }

  // Check if key exists
  async exists(key) {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('❌ Cache exists error:', error.message);
      return false;
    }
  }

  // Set cache with expiration
  async setEx(key, value, ttl) {
    return this.set(key, value, ttl);
  }

  // Get or set cache (cache-aside pattern)
  async getOrSet(key, fetchFunction, ttl = this.defaultTTL) {
    try {
      // Try to get from cache first
      let value = await this.get(key);
      
      if (value !== null) {
        return value;
      }

      // If not in cache, fetch from source
      value = await fetchFunction();
      
      // Store in cache
      if (value !== null && value !== undefined) {
        await this.set(key, value, ttl);
      }

      return value;
    } catch (error) {
      console.error('❌ Cache getOrSet error:', error.message);
      // Fallback to fetch function
      return await fetchFunction();
    }
  }

  // Clear cache by pattern
  async clearPattern(pattern) {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }

      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('❌ Cache clear pattern error:', error.message);
      return false;
    }
  }

  // Clear all cache
  async clearAll() {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }

      await this.client.flushDb();
      return true;
    } catch (error) {
      console.error('❌ Cache clear all error:', error.message);
      return false;
    }
  }

  // Get cache statistics
  async getStats() {
    try {
      if (!this.isConnected || !this.client) {
        return null;
      }

      const info = await this.client.info();
      const keys = await this.client.dbSize();
      
      return {
        connected: this.isConnected,
        keys,
        info: info.split('\r\n').reduce((acc, line) => {
          const [key, value] = line.split(':');
          if (key && value) {
            acc[key] = value;
          }
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('❌ Cache stats error:', error.message);
      return null;
    }
  }

  // Cache middleware for Express routes
  cacheMiddleware(ttl = this.defaultTTL, keyGenerator = null) {
    return async (req, res, next) => {
      try {
        // Generate cache key
        const cacheKey = keyGenerator ? 
          keyGenerator(req) : 
          this.generateKey('api', req.method, req.originalUrl, req.user?.id);

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
        console.error('❌ Cache middleware error:', error.message);
        next();
      }
    };
  }

  // Invalidate cache by tags
  async invalidateByTags(tags) {
    try {
      if (!this.isConnected || !this.client) {
        return false;
      }

      const patterns = Array.isArray(tags) ? tags : [tags];
      const promises = patterns.map(pattern => this.clearPattern(`*:${pattern}:*`));
      
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('❌ Cache invalidate by tags error:', error.message);
      return false;
    }
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.isConnected || !this.client) {
        return { status: 'disconnected', message: 'Cache not connected' };
      }

      await this.client.ping();
      return { status: 'healthy', message: 'Cache is working' };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

// Cache decorator for functions
const cache = (ttl = cacheManager.defaultTTL, keyGenerator = null) => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args) {
      try {
        // Generate cache key
        const cacheKey = keyGenerator ? 
          keyGenerator(...args) : 
          cacheManager.generateKey('func', target.constructor.name, propertyKey, JSON.stringify(args));

        // Try to get from cache
        const cachedResult = await cacheManager.get(cacheKey);
        
        if (cachedResult !== null) {
          return cachedResult;
        }

        // Execute original method
        const result = await originalMethod.apply(this, args);
        
        // Cache the result
        if (result !== null && result !== undefined) {
          await cacheManager.set(cacheKey, result, ttl);
        }

        return result;
      } catch (error) {
        console.error('❌ Cache decorator error:', error.message);
        // Fallback to original method
        return await originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
};

module.exports = {
  cacheManager,
  cache
}; 