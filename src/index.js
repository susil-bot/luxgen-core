// Load environment variables first
require('dotenv').config();

const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 4004;
const HOST = process.env.HOST || '0.0.0.0';

// Production-ready environment configuration
// Do not override environment variables in production
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}
if (!process.env.USE_LOCAL_DB) {
  process.env.USE_LOCAL_DB = 'true';
}

// Enhanced database connection with Atlas and local fallback
const DatabaseConfig = require('./config/database');
const AtlasConfig = require('./config/atlas');

const connectDB = async () => {
  try {
    const dbConfig = new DatabaseConfig();
    const atlasConfig = new AtlasConfig();
    
    // Log configurations
    dbConfig.logConfiguration();
    atlasConfig.logConfiguration();
    
    let connected = false;
    let connectionType = 'none';
    
    // Try Atlas connection first if enabled
    if (atlasConfig.isEnabled()) {
      try {
        console.log('Attempting Atlas connection...');
        const atlasUri = atlasConfig.getUri();
        const atlasOptions = {
          maxPoolSize: 20,
          minPoolSize: 5,
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
          socketTimeoutMS: 45000,
          maxIdleTimeMS: 30000,
          retryWrites: true,
          w: 'majority',
          readPreference: 'primary',
          ssl: true,
          authSource: 'admin'
        };
        
        await mongoose.connect(atlasUri, atlasOptions);
        console.log('MongoDB Atlas connected successfully');
        connected = true;
        connectionType = 'atlas';
        
      } catch (atlasError) {
        console.warn('Atlas connection failed:', atlasError.message);
        console.log('Falling back to local MongoDB...');
        // Close any partial Atlas connection
        try {
          await mongoose.disconnect();
        } catch (disconnectError) {
          // Ignore disconnect errors
        }
      }
    }
    
    // Try local MongoDB if Atlas failed or not enabled
    if (!connected) {
      try {
        console.log('Attempting local MongoDB connection...');
        const localUri = process.env.LOCAL_MONGODB_URI || 'mongodb://localhost:27017/luxgen';
        const localOptions = {
          maxPoolSize: 10,
          minPoolSize: 2,
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          maxIdleTimeMS: 30000,
          retryWrites: true,
          w: 'majority',
          readPreference: 'primary'
        };
        
        await mongoose.connect(localUri, localOptions);
        console.log('Local MongoDB connected successfully');
        connected = true;
        connectionType = 'local';
        
      } catch (localError) {
        console.error('Local MongoDB connection failed:', localError.message);
        throw new Error('No database connection available');
      }
    }
    
    // Set up connection event listeners
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });
    
    console.log(`Database connection established: ${connectionType.toUpperCase()}`);
    return connectionType;

  } catch (error) {
    console.error('Database connection error:', error.message);
    // Don't exit in production, allow server to start without DB
    if (process.env.NODE_ENV !== 'production') {
      console.log('Running without database connection');
    }
    return 'none';
  }
};

// Start server with enhanced error handling
const startServer = async () => {
  try {
    const connectionResult = await connectDB();
    
    const server = app.listen(PORT, HOST, () => {
      console.log(`Server running on ${HOST}:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API endpoint: http://localhost:${PORT}/api`);
      
      console.log(`${process.env.NODE_ENV} mode enabled`);
      console.log('Security features active');
      console.log('Monitoring enabled');
      console.log(`Using ${connectionResult || 'Local MongoDB'} for ${process.env.NODE_ENV} setup`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        console.log(`Try using a different port: PORT=${parseInt(PORT) + 1} npm start`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Enhanced graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  
  try {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Database connection closed');
    }
    
    // Close server
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  // Don't shutdown for Atlas connection failures - they're handled gracefully
  if (reason && reason.message && reason.message.includes('bad auth')) {
    console.log('Atlas authentication failed - continuing with local database');
    return;
  }
  
  // Only shutdown for critical errors
  if (reason && reason.code && reason.code !== 8000) {
    gracefulShutdown('unhandledRejection');
  }
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
