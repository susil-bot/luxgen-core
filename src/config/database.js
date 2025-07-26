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
        password: process.env.POSTGRES_PASSWORD || 'trainer_password_2024',
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
      
      const mongoUri = process.env.MONGODB_URL || 'mongodb://trainer_admin:mongo_password_2024@localhost:27017/trainer_platform?authSource=admin';
      
      const connectionOptions = {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        maxIdleTimeMS: 30000,
        retryWrites: true,
        w: 'majority',
        readPreference: 'primary',
        heartbeatFrequencyMS: 10000,
        family: 4
      };

      const connection = await mongoose.connect(mongoUri, connectionOptions);
      
      this.connections.mongodb.connection = connection;
      this.connections.mongodb.isConnected = true;

      console.log('✅ MongoDB connected successfully');

      // Set up event handlers
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        this.connections.mongodb.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
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
      
      const client = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
        socket: {
          connectTimeout: 10000,
          lazyConnect: true
        }
      });

      client.on('error', (err) => {
        console.error('❌ Redis error:', err);
        this.connections.redis.isConnected = false;
      });

      client.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.connections.redis.isConnected = true;
      });

      client.on('disconnect', () => {
        console.log('⚠️ Redis disconnected');
        this.connections.redis.isConnected = false;
      });

      await client.connect();
      
      this.connections.redis.client = client;
      return client;
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error.message);
      throw error;
    }
  }

  // Initialize all databases
  async initialize() {
    console.log('🚀 Initializing database connections...');
    
    try {
      // Connect to all databases in parallel
      const [postgresPool, mongoConnection, redisClient] = await Promise.allSettled([
        this.connectPostgres(),
        this.connectMongoDB(),
        this.connectRedis()
      ]);

      // Log connection results
      if (postgresPool.status === 'fulfilled') {
        console.log('✅ PostgreSQL: Connected');
      } else {
        console.error('❌ PostgreSQL: Failed to connect');
      }

      if (mongoConnection.status === 'fulfilled') {
        console.log('✅ MongoDB: Connected');
      } else {
        console.error('❌ MongoDB: Failed to connect');
      }

      if (redisClient.status === 'fulfilled') {
        console.log('✅ Redis: Connected');
      } else {
        console.error('❌ Redis: Failed to connect');
      }

      // Start health monitoring
      this.startHealthCheck();

      // Set up graceful shutdown
      this.setupGracefulShutdown();

      console.log('🎉 Database initialization completed');
    } catch (error) {
      console.error('💥 Database initialization failed:', error);
      throw error;
    }
  }

  // Health check for all databases
  async healthCheck() {
    const health = {
      timestamp: new Date().toISOString(),
      postgres: { status: 'unknown', message: '' },
      mongodb: { status: 'unknown', message: '' },
      redis: { status: 'unknown', message: '' }
    };

    // Check PostgreSQL
    try {
      if (this.connections.postgres.isConnected && this.connections.postgres.pool) {
        const client = await this.connections.postgres.pool.connect();
        await client.query('SELECT 1');
        client.release();
        health.postgres = { status: 'healthy', message: 'Connection OK' };
      } else {
        health.postgres = { status: 'disconnected', message: 'Not connected' };
      }
    } catch (error) {
      health.postgres = { status: 'unhealthy', message: error.message };
    }

    // Check MongoDB
    try {
      if (this.connections.mongodb.isConnected) {
        await mongoose.connection.db.admin().ping();
        health.mongodb = { status: 'healthy', message: 'Connection OK' };
      } else {
        health.mongodb = { status: 'disconnected', message: 'Not connected' };
      }
    } catch (error) {
      health.mongodb = { status: 'unhealthy', message: error.message };
    }

    // Check Redis
    try {
      if (this.connections.redis.isConnected && this.connections.redis.client) {
        await this.connections.redis.client.ping();
        health.redis = { status: 'healthy', message: 'Connection OK' };
      } else {
        health.redis = { status: 'disconnected', message: 'Not connected' };
      }
    } catch (error) {
      health.redis = { status: 'unhealthy', message: error.message };
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
        const unhealthy = Object.values(health).filter(h => h.status === 'unhealthy');
        
        if (unhealthy.length > 0) {
          console.warn('⚠️ Database health check issues:', unhealthy);
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
      console.log('🏥 Database health monitoring stopped');
    }
  }

  // Setup graceful shutdown
  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      
      try {
        this.stopHealthCheck();
        
        // Close PostgreSQL connections
        if (this.connections.postgres.pool) {
          await this.connections.postgres.pool.end();
          console.log('✅ PostgreSQL connections closed');
        }
        
        // Close MongoDB connection
        if (this.connections.mongodb.connection) {
          await mongoose.disconnect();
          console.log('✅ MongoDB connection closed');
        }
        
        // Close Redis connection
        if (this.connections.redis.client) {
          await this.connections.redis.client.quit();
          console.log('✅ Redis connection closed');
        }
        
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  // Get database connections
  getPostgresPool() {
    return this.connections.postgres.pool;
  }

  getMongoConnection() {
    return this.connections.mongodb.connection;
  }

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

  // Test all database connections
  async testConnections() {
    const results = {
      postgres: { success: false, message: '' },
      mongodb: { success: false, message: '' },
      redis: { success: false, message: '' }
    };

    // Test PostgreSQL
    try {
      if (this.connections.postgres.pool) {
        const client = await this.connections.postgres.pool.connect();
        await client.query('SELECT version()');
        client.release();
        results.postgres = { success: true, message: 'Connection test passed' };
      }
    } catch (error) {
      results.postgres = { success: false, message: error.message };
    }

    // Test MongoDB
    try {
      if (this.connections.mongodb.connection) {
        await mongoose.connection.db.admin().ping();
        results.mongodb = { success: true, message: 'Connection test passed' };
      }
    } catch (error) {
      results.mongodb = { success: false, message: error.message };
    }

    // Test Redis
    try {
      if (this.connections.redis.client) {
        await this.connections.redis.client.ping();
        results.redis = { success: true, message: 'Connection test passed' };
      }
    } catch (error) {
      results.redis = { success: false, message: error.message };
    }

    return results;
  }
}

// Create singleton instance
const databaseManager = new DatabaseManager();

module.exports = databaseManager; 