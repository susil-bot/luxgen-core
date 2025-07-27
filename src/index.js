const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const mongoose = require('mongoose');
const { createDatabaseInitializer } = require('./config/databaseInit');
const { connectToDatabase } = require('./config/database');
const environmentConfig = require('./config/environment');
const { errorHandler } = require('./utils/errors');
const cacheManager = require('./utils/cache');
const aiService = require('./services/aiService');

// Import error handling middleware
const {
  requestLogger,
  performanceMonitor,
  errorTracker,
  rateLimitErrorHandler,
  databaseErrorHandler,
  aiServiceErrorHandler,
  trainingErrorHandler,
  presentationErrorHandler,
  tenantErrorHandler,
  validationErrorHandler,
  authenticationErrorHandler,
  authorizationErrorHandler,
  notFoundErrorHandler,
  conflictErrorHandler,
  genericErrorHandler
} = require('./middleware/errorHandling');
require('dotenv').config();

const app = express();
const PORT = environmentConfig.get('PORT', 3001);

// Rate limiting
const limiter = rateLimit(environmentConfig.getRateLimitConfig());

// Security middleware
app.use(helmet(environmentConfig.getSecurityConfig().helmet));

// CORS configuration
app.use(cors(environmentConfig.getCORSConfig()));

// Response compression for better performance
app.use(compression({
  level: 6, // Compression level (0-9)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression for all other requests
    return compression.filter(req, res);
  }
}));

// Rate limiting
app.use('/api/', limiter);

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      const logger = require('./utils/logger');
      logger.info(message.trim());
    }
  }
}));

// Body parsing middleware
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'trainer-platform-backend',
    version: '1.0.0',
    uptime: process.uptime()
  });
});

app.get('/health/detailed', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const dbHealth = {
      status: dbStatus === 1 ? 'connected' : 'disconnected',
      readyState: dbStatus,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'trainer-platform-backend',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        status: dbHealth.status,
        health: dbHealth
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'trainer-platform-backend',
      version: '1.0.0',
      error: error.message
    });
  }
});

// Database status endpoint
app.get('/api/database/status', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const status = dbStatus === 1 ? 'connected' : 'disconnected';
    const health = {
      status,
      readyState: dbStatus,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      collections: Object.keys(mongoose.connection.collections)
    };

    res.json({
      success: true,
      status,
      health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API information endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Trainer Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      healthDetailed: '/health/detailed',
      databaseStatus: '/api/database/status',
      api: '/api',
      auth: '/api/auth',
      users: '/api/users',
      tenants: '/api/tenants',
      polls: '/api/polls'
    },
    documentation: '/api/docs',
    timestamp: new Date().toISOString()
  });
});

// Apply request logging and performance monitoring BEFORE routes
app.use(requestLogger);
app.use(performanceMonitor);

// Import and mount centralized API routes
const apiRoutes = require('./routes/index');
app.use('/', apiRoutes);

// Apply comprehensive error handling middleware chain AFTER routes
app.use(errorTracker);
app.use(rateLimitErrorHandler);
app.use(databaseErrorHandler);
app.use(aiServiceErrorHandler);
app.use(trainingErrorHandler);
app.use(presentationErrorHandler);
app.use(tenantErrorHandler);
app.use(validationErrorHandler);
app.use(authenticationErrorHandler);
app.use(authorizationErrorHandler);
app.use(notFoundErrorHandler);
app.use(conflictErrorHandler);
app.use(genericErrorHandler);

// 404 handler - must be last
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      statusCode: 404,
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    }
  });
});

// Initialize database and start server
async function startServer () {
  try {
    console.log('🚀 Starting Trainer Platform Backend...');
    console.log('='.repeat(60));

    // Initialize cache
    await cacheManager.connect();

    // Initialize AI service
    await aiService.initialize();

    // Initialize database connections first
    const mongoUri = environmentConfig.get('MONGODB_URI', 'mongodb://localhost:27017/luxgen_trainer_platform');
    await connectToDatabase(mongoUri);

    // Initialize database with step-by-step process (skip connection since already connected)
    const dbInitializer = createDatabaseInitializer();
    await dbInitializer.initialize();

    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log('🎉 TRAINER PLATFORM BACKEND STARTED SUCCESSFULLY');
      console.log('='.repeat(60));
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔍 Detailed health: http://localhost:${PORT}/health/detailed`);
      console.log(`🗄️  Database status: http://localhost:${PORT}/api/database/status`);
      console.log(`🔗 API base: http://localhost:${PORT}/api`);
      console.log(`🌐 External access: http://192.168.1.9:${PORT}`);
      console.log(`🌍 Environment: ${environmentConfig.get('NODE_ENV', 'development')}`);
      console.log(`⏰ Started at: ${new Date().toISOString()}`);
      console.log('='.repeat(60));
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

      server.close(async () => {
        try {
          // Stop cache
          await cacheManager.disconnect();

          // Close database connection
          await mongoose.connection.close();

          console.log('✅ Server closed gracefully');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('💥 Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('\n💥 Failed to start server:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
