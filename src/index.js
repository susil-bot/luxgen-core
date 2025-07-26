const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const { createDatabaseInitializer } = require('./config/databaseInit');
const databaseManager = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression middleware
app.use(compression());

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

// Import routes
const pollsRoutes = require('./routes/polls');
const tenantRoutes = require('./routes/tenantRoutes');
const tenantStylingRoutes = require('./routes/tenantStylingRoutes');
const userRegistrationRoutes = require('./routes/userRegistrationRoutes');
const userDetailsRoutes = require('./routes/userDetailsRoutes');
const tenantSchemaRoutes = require('./routes/tenantSchemaRoutes');

// Mount tenant routes BEFORE multi-tenancy middleware
app.use('/api/tenants', tenantRoutes);
app.use('/api/tenant-styling', tenantStylingRoutes);

// Multi-tenancy middleware
app.use('/api/:tenantId', (req, res, next) => {
  const tenantId = req.params.tenantId;
  req.tenantId = tenantId;
  console.log(`Request for tenant: ${tenantId}`);
  next();
});

// Mount other routes
app.use('/api/polls', pollsRoutes);
app.use('/api/user-registration', userRegistrationRoutes);
app.use('/api/user-details', userDetailsRoutes);
app.use('/api/tenant-schema', tenantSchemaRoutes);

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
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Log error details
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Determine error type and response
  let statusCode = 500;
  let errorMessage = 'Internal server error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = 'Validation error';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorMessage = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorMessage = 'Forbidden';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    errorMessage = 'Resource not found';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    errorMessage = 'Service temporarily unavailable';
  }

  res.status(statusCode).json({
    error: errorMessage,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
});

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
    
    // Initialize database with step-by-step process
    const dbInitializer = createDatabaseInitializer();
    await dbInitializer.initialize();
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('🎉 TRAINER PLATFORM BACKEND STARTED SUCCESSFULLY');
      console.log('='.repeat(60));
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔍 Detailed health: http://localhost:${PORT}/health/detailed`);
      console.log(`🗄️  Database status: http://localhost:${PORT}/api/database/status`);
      console.log(`🔗 API base: http://localhost:${PORT}/api`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ Started at: ${new Date().toISOString()}`);
      console.log('='.repeat(60));
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        try {
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