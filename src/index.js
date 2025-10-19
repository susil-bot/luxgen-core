// Load environment variables first
require('dotenv').config();

const app = require('./app');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Enhanced database connection with production options
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI) {
      const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI;
      
      // Skip connection if URI is empty or contains placeholder
      if (!mongoUri || mongoUri.includes('<db_password>') || mongoUri.trim() === '') {
        console.log('⚠️ MongoDB URI not properly configured, running without database');
        return;
      }
      
      const options = {
        maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10,
        minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 2,
        maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME) || 30000,
        serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT) || 5000,
        connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT) || 10000,
        socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 45000,
        retryWrites: true,
        w: 'majority',
        readPreference: 'primary'
      };

      await mongoose.connect(mongoUri, options);
      console.log('✅ MongoDB connected successfully');
      
      // Set up connection event listeners
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error.message);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
      });

    } else {
      console.log('⚠️ MongoDB URI not provided, running without database');
    }
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    // Don't exit in production, allow server to start without DB
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

// Start server with enhanced error handling
const startServer = async () => {
  try {
    await connectDB();
    
    const server = app.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on ${HOST}:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 API endpoint: http://localhost:${PORT}/api`);
      
      if (process.env.NODE_ENV === 'production') {
        console.log('🔒 Production mode enabled');
        console.log('🛡️ Security features active');
        console.log('📈 Monitoring enabled');
      }
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log(`💡 Try using a different port: PORT=${parseInt(PORT) + 1} npm start`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Enhanced graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 ${signal} received, shutting down gracefully...`);
  
  try {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('✅ Database connection closed');
    }
    
    // Close server
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
