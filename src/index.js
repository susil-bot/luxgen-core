const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { createDatabaseInitializer } = require('./config/databaseInit');
const databaseManager = require('./config/database');
const environmentConfig = require('./config/environment');
const { errorHandler } = require('./utils/errors');
const { cacheManager } = require('./utils/cache');
require('dotenv').config();

const app = express();
const PORT = environmentConfig.get('PORT', 3001);

// Rate limiting
const limiter = rateLimit(environmentConfig.getRateLimitConfig());

// Security middleware
app.use(helmet(environmentConfig.getSecurityConfig().helmet));

// CORS configuration
app.use(cors(environmentConfig.getCORSConfig()));

// Compression middleware
if (environmentConfig.get('ENABLE_COMPRESSION', true)) {
  app.use(compression());
}

// Rate limiting
app.use('/api/', limiter);

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      console.log(message.trim());
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
    const dbHealth = await databaseManager.healthCheck();
    const dbStatus = databaseManager.getConnectionStatus();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'trainer-platform-backend',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        status: dbStatus,
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
    const status = databaseManager.getConnectionStatus();
    const health = await databaseManager.healthCheck();
    const test = await databaseManager.testConnections();
    
    res.json({
      success: true,
      status,
      health,
      test,
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

// Import and mount centralized API routes
const apiRoutes = require('./routes/index');
app.use('/', apiRoutes);

// Tenant-specific routes
app.get('/api/:tenantId/users', (req, res) => {
  res.json({
    message: `Users for tenant: ${req.tenantId}`,
    users: [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'trainer' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'participant' }
    ]
  });
});

app.get('/api/:tenantId/courses', (req, res) => {
  res.json({
    message: `Courses for tenant: ${req.tenantId}`,
    courses: [
      { id: 1, title: 'React Basics', instructor: 'John Doe', modules: 10 },
      { id: 2, title: 'Node.js Advanced', instructor: 'Jane Smith', modules: 15 }
    ]
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Starting Trainer Platform Backend...');
    console.log('='.repeat(60));
    
    // Initialize cache
    await cacheManager.connect();
    
    // Initialize database with step-by-step process
    const dbInitializer = createDatabaseInitializer();
    await dbInitializer.initialize();
    
    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(60));
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
          
          // Stop database health checks
          databaseManager.stopHealthCheck();
          
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