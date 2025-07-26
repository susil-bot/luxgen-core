const mongoose = require('mongoose');
const Redis = require('redis');

class DatabaseManager {
  constructor() {
    this.mongodb = null;
    this.redis = null;
    this.connections = {
      mongodb: { isConnected: false, connection: null },
      redis: { isConnected: false, client: null }
    };
    this.healthCheckInterval = 30000; // 30 seconds
    this.healthCheckTimer = null;
  }

  // MongoDB Connection
  async connectMongoDB() {
    try {
      if (this.connections.mongodb.isConnected) {
        console.log('✅ MongoDB already connected');
        return this.connections.mongodb.connection;
      }

      console.log('🔌 Connecting to MongoDB...');
      
      const mongoUri = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/luxgen_trainer_platform';
      
      const connectionOptions = {
        maxPoolSize: 5,
        minPoolSize: 1,
        serverSelectionTimeoutMS: 60000,
        socketTimeoutMS: 60000,
        bufferCommands: false,
        maxIdleTimeMS: 60000,
        retryWrites: true,
        w: 'majority',
        readPreference: 'primary',
        heartbeatFrequencyMS: 30000,
        family: 4,
        connectTimeoutMS: 60000,
        serverApi: {
          version: '1',
          strict: true,
          deprecationErrors: true,
        }
      };

      const connection = await mongoose.connect(mongoUri, {
        ...connectionOptions,
        dbName: 'luxgen_trainer_platform'
      });

      this.connections.mongodb.connection = connection;
      this.connections.mongodb.isConnected = true;

      console.log('✅ MongoDB connected successfully');

      // Set up event handlers
      connection.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        this.connections.mongodb.isConnected = false;
      });

      connection.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        this.connections.mongodb.isConnected = false;
      });

      connection.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
        this.connections.mongodb.isConnected = true;
      });

      return connection;
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ MongoDB is optional for development - continuing without MongoDB');
        this.connections.mongodb.isConnected = false;
        this.connections.mongodb.connection = null;
        return null;
      } else {
        throw error;
      }
    }
  }

  // Redis Connection
  async connectRedis() {
    try {
      if (this.connections.redis.isConnected) {
        console.log('✅ Redis already connected');
        return this.connections.redis.client;
      }

      console.log('🔌 Connecting to Redis...');
      
      const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;
      
      const client = Redis.createClient({
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

      await client.connect();

      this.connections.redis.client = client;
      this.connections.redis.isConnected = true;

      console.log('✅ Redis connected successfully');

      // Set up event handlers
      client.on('error', (err) => {
        console.error('⚠️ Redis disconnected:', err);
        this.connections.redis.isConnected = false;
      });

      client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.connections.redis.isConnected = true;
      });

      return client;
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error.message);
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Redis is optional for development - continuing without Redis');
        this.connections.redis.isConnected = false;
        this.connections.redis.client = null;
        return null;
      } else {
        throw error;
      }
    }
  }

  // Initialize all database connections
  async initialize() {
    try {
      console.log('🚀 Initializing database connections...');
      
      // Connect to MongoDB
      try {
        await this.connectMongoDB();
        console.log('✅ MongoDB: Connected');
      } catch (error) {
        console.log('❌ MongoDB: Failed to connect');
      }
      
      // Connect to Redis
      try {
        await this.connectRedis();
        console.log('✅ Redis: Connected');
      } catch (error) {
        console.log('❌ Redis: Failed to connect');
      }
      
      console.log('🎉 Database initialization completed');
      
      // Start health monitoring
      this.startHealthCheck();
      
      return true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      throw error;
    }
  }

  // Health check for all databases
  async healthCheck() {
    const health = {
      mongodb: { status: 'unknown', error: null },
      redis: { status: 'unknown', error: null },
      timestamp: new Date().toISOString()
    };

    // Check MongoDB
    if (this.connections.mongodb.isConnected && this.connections.mongodb.connection) {
      try {
        await this.connections.mongodb.connection.connection.db.admin().ping();
        health.mongodb.status = 'healthy';
      } catch (error) {
        health.mongodb.status = 'unhealthy';
        health.mongodb.error = error.message;
      }
    } else {
      health.mongodb.status = 'disconnected';
    }

    // Check Redis
    if (this.connections.redis.isConnected && this.connections.redis.client) {
      try {
        await this.connections.redis.client.ping();
        health.redis.status = 'healthy';
      } catch (error) {
        health.redis.status = 'unhealthy';
        health.redis.error = error.message;
      }
    } else {
      health.redis.status = 'disconnected';
    }

    return health;
  }

  // Start health check monitoring
  startHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      try {
        const health = await this.healthCheck();
        const allHealthy = health.mongodb.status === 'healthy' &&
                          health.redis.status === 'healthy';

        if (!allHealthy) {
          console.log('⚠️ Database health check failed:', health);
        }
      } catch (error) {
        console.error('❌ Health check error:', error.message);
      }
    }, this.healthCheckInterval);

    console.log('🏥 Database health monitoring started');
  }

  // Stop health check monitoring
  stopHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  // Setup graceful shutdown
  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      
      // Stop health monitoring
      this.stopHealthCheck();

      // Close MongoDB connections
      if (this.connections.mongodb.connection) {
        await this.connections.mongodb.connection.disconnect();
        this.connections.mongodb.isConnected = false;
        console.log('✅ MongoDB connections closed');
      }

      // Close Redis connections
      if (this.connections.redis.client) {
        await this.connections.redis.client.quit();
        this.connections.redis.isConnected = false;
        console.log('✅ Redis connections closed');
      }

      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  }

  // Get MongoDB connection
  getMongoConnection() {
    return this.connections.mongodb.connection;
  }

  // Get Redis client
  getRedisClient() {
    return this.connections.redis.client;
  }

  // Get connection status
  getConnectionStatus() {
    return {
      mongodb: this.connections.mongodb.isConnected,
      redis: this.connections.redis.isConnected,
      timestamp: new Date().toISOString()
    };
  }

  // Test all connections
  async testConnections() {
    const results = {
      mongodb: { success: false, error: null },
      redis: { success: false, error: null },
      timestamp: new Date().toISOString()
    };

    // Test MongoDB
    if (this.connections.mongodb.connection) {
      try {
        await this.connections.mongodb.connection.connection.db.admin().ping();
        results.mongodb.success = true;
      } catch (error) {
        results.mongodb.error = error.message;
      }
    }

    // Test Redis
    if (this.connections.redis.client) {
      try {
        await this.connections.redis.client.ping();
        results.redis.success = true;
      } catch (error) {
        results.redis.error = error.message;
      }
    }

    return results;
  }
}

module.exports = new DatabaseManager(); 