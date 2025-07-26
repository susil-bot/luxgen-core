const { Pool } = require('pg');
const mongoose = require('mongoose');
const Redis = require('redis');

class DatabaseManager {
  constructor() {
    this.postgres = null;
    this.mongodb = null;
    this.redis = null;
    this.connections = {
      postgres: { isConnected: false, pool: null },
      mongodb: { isConnected: false, connection: null },
      redis: { isConnected: false, client: null }
    };
    this.healthCheckInterval = 30000; // 30 seconds
    this.healthCheckTimer = null;
  }

  // PostgreSQL Connection
  async connectPostgres() {
    try {
      if (this.connections.postgres.isConnected) {
        console.log('✅ PostgreSQL already connected');
        return this.connections.postgres.pool;
      }

      console.log('🔌 Connecting to PostgreSQL...');
      
      const pool = new Pool({
        host: process.env.POSTGRES_HOST || '127.0.0.1',
        port: process.env.POSTGRES_PORT || 5432,
        database: process.env.POSTGRES_DB || 'trainer_platform',
        user: process.env.POSTGRES_USER || 'trainer_user',
        password: process.env.POSTGRES_PASSWORD || '',
        max: 20, // Maximum number of clients in the pool
        min: 2,  // Minimum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
        maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      // Test the connection
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.connections.postgres.pool = pool;
      this.connections.postgres.isConnected = true;

      console.log('✅ PostgreSQL connected successfully');

      // Set up event handlers
      pool.on('error', (err) => {
        console.error('❌ PostgreSQL pool error:', err);
        this.connections.postgres.isConnected = false;
      });

      return pool;
    } catch (error) {
      console.error('❌ Failed to connect to PostgreSQL:', error.message);
      throw error;
    }
  }

  // MongoDB Connection
  async connectMongoDB() {
    try {
      if (this.connections.mongodb.isConnected) {
        console.log('✅ MongoDB already connected');
        return this.connections.mongodb.connection;
      }

      console.log('🔌 Connecting to MongoDB...');
      
      const mongoUri = process.env.MONGODB_URL || 'mongodb://localhost:27017/luxgen_trainer_platform';
      
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
      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        this.connections.mongodb.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
        this.connections.mongodb.isConnected = true;
      });

      mongoose.connection.on('close', () => {
        console.log('🔌 MongoDB connection closed');
        this.connections.mongodb.isConnected = false;
      });

      return connection;
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      throw error;
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
      throw error;
    }
  }

  // Initialize all database connections
  async initialize() {
    try {
      console.log('🚀 Initializing database connections...');
      
      // Connect to PostgreSQL
      try {
        await this.connectPostgres();
        console.log('✅ PostgreSQL: Connected');
      } catch (error) {
        console.log('❌ PostgreSQL: Failed to connect');
      }
      
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
      postgres: { status: 'unknown', error: null },
      mongodb: { status: 'unknown', error: null },
      redis: { status: 'unknown', error: null },
      timestamp: new Date().toISOString()
    };

    // Check PostgreSQL
    if (this.connections.postgres.isConnected && this.connections.postgres.pool) {
      try {
        const client = await this.connections.postgres.pool.connect();
        await client.query('SELECT 1');
        client.release();
        health.postgres.status = 'healthy';
      } catch (error) {
        health.postgres.status = 'unhealthy';
        health.postgres.error = error.message;
      }
    } else {
      health.postgres.status = 'disconnected';
    }

    // Check MongoDB
    if (this.connections.mongodb.isConnected && this.connections.mongodb.connection) {
      try {
        await this.connections.mongodb.connection.db.admin().ping();
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

  // Start periodic health checks
  startHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      try {
        const health = await this.healthCheck();
        const allHealthy = health.postgres.status === 'healthy' && 
                          health.mongodb.status === 'healthy' && 
                          health.redis.status === 'healthy';
        
        if (!allHealthy) {
          console.warn('⚠️ Database health check failed:', health);
        }
      } catch (error) {
        console.error('❌ Health check error:', error.message);
      }
    }, this.healthCheckInterval);

    console.log('🏥 Database health monitoring started');
  }

  // Stop health checks
  stopHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      console.log('🏥 Database health monitoring stopped');
    }
  }

  // Graceful shutdown
  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      
      try {
        // Stop health checks
        this.stopHealthCheck();
        
        // Close PostgreSQL connections
        if (this.connections.postgres.pool) {
          await this.connections.postgres.pool.end();
          this.connections.postgres.isConnected = false;
          console.log('✅ PostgreSQL connections closed');
        }
        
        // Close MongoDB connection
        if (this.connections.mongodb.connection) {
          await mongoose.connection.close();
          this.connections.mongodb.isConnected = false;
          console.log('✅ MongoDB connection closed');
        }
        
        // Close Redis connection
        if (this.connections.redis.client) {
          await this.connections.redis.client.quit();
          this.connections.redis.isConnected = false;
          console.log('✅ Redis connection closed');
        }
        
        console.log('✅ Graceful shutdown completed');
      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  // Get PostgreSQL pool
  getPostgresPool() {
    return this.connections.postgres.pool;
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
      postgres: this.connections.postgres.isConnected,
      mongodb: this.connections.mongodb.isConnected,
      redis: this.connections.redis.isConnected,
      timestamp: new Date().toISOString()
    };
  }

  // Test all connections
  async testConnections() {
    const results = {
      postgres: { success: false, error: null },
      mongodb: { success: false, error: null },
      redis: { success: false, error: null }
    };

    // Test PostgreSQL
    if (this.connections.postgres.pool) {
      try {
        const client = await this.connections.postgres.pool.connect();
        await client.query('SELECT version()');
        client.release();
        results.postgres.success = true;
      } catch (error) {
        results.postgres.error = error.message;
      }
    }

    // Test MongoDB
    if (this.connections.mongodb.connection) {
      try {
        await this.connections.mongodb.connection.db.admin().ping();
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