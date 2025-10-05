// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const mongoose = require('mongoose');

// Import tenant configuration
const { getTenantConfig, getTenantContext, validateTenantAccess } = require('./tenantConfig');

// API Routes Setup
function setupAPIRoutes(app) {
  // Authentication Endpoints
  app.post('/api/v1/auth/register', (req, res) => {
    const { firstName, lastName, email, password, role, department } = req.body;
    const tenantId = req.headers['x-tenant-id'] || 'luxgen';
    
    // Validate tenant access
    const access = validateTenantAccess(tenantId, null, 'user-management');
    if (!access.valid) {
      return res.status(403).json({
        success: false,
        message: access.reason
      });
    }
    
    // Get tenant context
    const tenantContext = getTenantContext(tenantId, null, role);
    
    // Simulate user registration
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId,
        email,
        firstName,
        lastName,
        role: role || 'user',
        department,
        tenantId: tenantContext.tenantId,
        tenantName: tenantContext.tenantName,
        token,
        createdAt: new Date().toISOString()
      },
      tenantConfig: {
        features: tenantContext.features,
        limits: tenantContext.limits,
        branding: tenantContext.branding
      }
    });
  });

  app.post('/api/v1/auth/login', (req, res) => {
    const { email, password } = req.body;
    const tenantId = req.headers['x-tenant-id'] || 'luxgen';
    
    // Validate tenant access
    const access = validateTenantAccess(tenantId, null, 'user-management');
    if (!access.valid) {
      return res.status(403).json({
        success: false,
        message: access.reason
      });
    }
    
    // Get tenant context
    const tenantContext = getTenantContext(tenantId, null, 'user');
    
    // Simulate user login
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        userId,
        email,
        token,
        tenantId: tenantContext.tenantId,
        tenantName: tenantContext.tenantName,
        role: 'user',
        lastLogin: new Date().toISOString()
      },
      tenantConfig: {
        features: tenantContext.features,
        limits: tenantContext.limits,
        branding: tenantContext.branding
      }
    });
  });

  app.get('/api/v1/auth/me', (req, res) => {
    const tenantId = req.headers['x-tenant-id'] || 'luxgen';
    const userId = req.headers['x-user-id'] || 'user-123';
    
    // Get tenant context
    const tenantContext = getTenantContext(tenantId, userId, 'user');
    
    res.json({
      success: true,
      data: {
        userId,
        email: 'user@luxgen.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        tenantId: tenantContext.tenantId,
        tenantName: tenantContext.tenantName,
        lastLogin: new Date().toISOString()
      },
      tenantConfig: {
        features: tenantContext.features,
        limits: tenantContext.limits,
        branding: tenantContext.branding
      }
    });
  });

  // Job Post Endpoints
  app.post('/api/v1/jobs', (req, res) => {
    const { title, description, company, location, salary, requirements } = req.body;
    const tenantId = req.headers['x-tenant-id'] || 'luxgen';
    
    // Validate tenant access
    const access = validateTenantAccess(tenantId, req.headers['x-user-id'], 'job-posting');
    if (!access.valid) {
      return res.status(403).json({
        success: false,
        message: access.reason
      });
    }
    
    // Get tenant context
    const tenantContext = getTenantContext(tenantId, req.headers['x-user-id'], req.headers['x-user-role']);
    
    // Simulate job creation
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.status(201).json({
      success: true,
      message: 'Job post created successfully',
      data: {
        jobId,
        title,
        company: company?.name,
        location: location?.city,
        salary,
        tenantId: tenantContext.tenantId,
        tenantName: tenantContext.tenantName,
        createdAt: new Date().toISOString()
      },
      tenantConfig: {
        features: tenantContext.features,
        limits: tenantContext.limits,
        branding: tenantContext.branding
      }
    });
  });

  app.get('/api/v1/jobs', (req, res) => {
    res.json({
      success: true,
      data: {
        jobPosts: [
          {
            _id: 'mock-job-1',
            title: 'Senior Software Engineer',
            description: 'We are looking for a senior software engineer...',
            company: {
              name: 'LuxGen Technologies',
              location: { city: 'San Francisco', country: 'USA' }
            },
            jobType: 'full-time',
            experienceLevel: 'senior',
            location: { city: 'San Francisco', country: 'USA' },
            salary: { min: 120000, max: 160000, currency: 'USD' },
            createdAt: new Date().toISOString()
          }
        ],
        total: 1,
        currentPage: 1,
        totalPages: 1
      },
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1
      }
    });
  });

  // Feed Endpoints
  app.get('/api/v1/feed/posts', (req, res) => {
    res.json({
      success: true,
      data: {
        posts: [
          {
            _id: 'mock-post-1',
            content: 'Welcome to LuxGen! We are excited to have you here.',
            type: 'announcement',
            visibility: 'public',
            createdBy: 'admin-user-123',
            createdAt: new Date().toISOString(),
            engagement: {
              likes: 5,
              comments: 2,
              shares: 1,
              views: 25
            }
          }
        ],
        total: 1,
        currentPage: 1,
        totalPages: 1
      }
    });
  });

  // Tenant Configuration Endpoints
  app.get('/api/v1/tenants/:tenantId/config', (req, res) => {
    const { tenantId } = req.params;
    const config = getTenantConfig(tenantId);
    
    res.json({
      success: true,
      data: {
        tenantId: config.id,
        tenantSlug: config.slug,
        tenantName: config.name,
        features: config.features,
        limits: config.limits,
        branding: config.branding,
        security: config.security
      }
    });
  });

  app.get('/api/v1/tenants', (req, res) => {
    const { getAllTenants } = require('./tenantConfig');
    const tenants = getAllTenants();
    
    res.json({
      success: true,
      data: {
        tenants: tenants.map(tenant => ({
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          domain: tenant.domain,
          features: tenant.features,
          limits: tenant.limits
        }))
      }
    });
  });
}
// Simple database connection - no complex config files needed
const connectToMongoDB = async () => {
  try {
    const useLocalDB = process.env.USE_LOCAL_DB === 'true';
    const uri = useLocalDB 
      ? `mongodb://localhost:27017/luxgen`
      : process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI;
    
    if (!uri) {
      throw new Error('MongoDB URI is required. Please set MONGODB_URI or MONGODB_ATLAS_URI environment variable.');
    }
    
    console.log(`🔗 Connecting to ${useLocalDB ? 'Local' : 'Atlas'} MongoDB...`);
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ Connected to ${useLocalDB ? 'Local' : 'Atlas'} MongoDB successfully`);
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    throw error;
  }
};

// Simple environment config
const environmentConfig = {
  get: (key, defaultValue) => process.env[key] || defaultValue,
  getRateLimitConfig: () => ({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }),
  getSecurityConfig: () => ({
    helmet: {
      contentSecurityPolicy: false
    }
  }),
  getCORSConfig: () => ({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  })
};
const { errorHandler } = require('./utils/errors');
const cacheManager = require('./utils/cache');
const aiService = require('./services/aiService'); // Import error handling middleware
const { requestLogger, performanceMonitor, errorTracker, rateLimitErrorHandler, databaseErrorHandler, aiServiceErrorHandler, trainingErrorHandler, presentationErrorHandler, tenantErrorHandler, validationErrorHandler, authenticationErrorHandler, authorizationErrorHandler, notFoundErrorHandler, conflictErrorHandler, genericErrorHandler
} = require('./middleware/errorHandling'); const app = express();
const PORT = environmentConfig.get('PORT', 3001); // Rate limiting
const limiter = rateLimit(environmentConfig.getRateLimitConfig()); // Security middleware
app.use(helmet(environmentConfig.getSecurityConfig().helmet));

// Add custom headers
app.use((req, res, next) => {
  res.setHeader('X-API-Source', 'luxgen-core');
  res.setHeader('X-API-Version', '1.0.0');
  next();
}); // CORS configuration
app.use(cors(environmentConfig.getCORSConfig())); // Response compression for better performance
app.use(compression({ level: 6, // Compression level (0-9) threshold: 1024, // Only compress responses larger than 1KB filter: (req, res) => { // Don't compress if client doesn't support it if (req.headers['x-no-compression']) { return false; } // Use compression for all other requests return compression.filter(req, res); }
})); // Rate limiting
app.use('/api/', limiter); // Logging middleware
app.use(morgan('combined', { stream: { write: (message) => { const logger = require('./utils/logger'); logger.info(message.trim()); } }
})); // Body parsing middleware
app.use(express.json({ limit: '10mb', verify: (req, res, buf) => { req.rawBody = buf; }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb'})); // Request logging middleware
app.use((req, res, next) => { console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`); next();
}); // Health check endpoints
app.get('/health', (req, res) => { res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString(), service: 'trainer-platform-backend', version: '1.0.0', uptime: process.uptime() });
}); app.get('/health/detailed', async (req, res) => { try { const dbStatus = mongoose.connection.readyState; const dbHealth = { status: dbStatus === 1 ? 'connected': 'disconnected', readyState: dbStatus, host: mongoose.connection.host, name: mongoose.connection.name }; res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString(), service: 'trainer-platform-backend', version: '1.0.0', uptime: process.uptime(), memory: process.memoryUsage(), database: { status: dbHealth.status, health: dbHealth } }); } catch (error) { res.status(500).json({ status: 'unhealthy', timestamp: new Date().toISOString(), service: 'trainer-platform-backend', version: '1.0.0', error: error.message }); }
}); // Database status endpoint
app.get('/api/database/status', async (req, res) => { try { const dbStatus = mongoose.connection.readyState; const status = dbStatus === 1 ? 'connected': 'disconnected'; const health = { status, readyState: dbStatus, host: mongoose.connection.host, name: mongoose.connection.name, collections: Object.keys(mongoose.connection.collections) }; res.json({ success: true, status, health, timestamp: new Date().toISOString() }); } catch (error) { res.status(500).json({ success: false, error: error.message, timestamp: new Date().toISOString() }); }
}); // Native MongoDB driver status endpoint
app.get('/api/mongodb/status', async (req, res) => { try { const { getConnectionStatus, testConnection } = require('./config/mongodb'); const connectionStatus = getConnectionStatus(); const isHealthy = await testConnection(); res.json({ success: true, nativeDriver: { isConnected: connectionStatus.isConnected, isHealthy, hasClient: connectionStatus.hasClient, isClientConnected: connectionStatus.isClientConnected, connectionState: connectionStatus.connectionState }, timestamp: new Date().toISOString() }); } catch (error) { res.status(500).json({ success: false, error: error.message, timestamp: new Date().toISOString() }); }
}); // API information endpoint
app.get('/api', (req, res) => { res.json({ message: 'Trainer Platform API', version: '1.0.0', endpoints: { health: '/health', healthDetailed: '/health/detailed', databaseStatus: '/api/database/status', mongodbStatus: '/api/mongodb/status', api: '/api', auth: '/api/auth', users: '/api/users', tenants: '/api/tenants', polls: '/api/polls'}, documentation: '/api/docs', timestamp: new Date().toISOString() });
}); // Apply request logging and performance monitoring BEFORE routes
app.use(requestLogger);
app.use(performanceMonitor); // Import and mount centralized API routes
const apiRoutes = require('./routes/index');
app.use('/', apiRoutes); // Apply comprehensive error handling middleware chain AFTER routes
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
app.use(genericErrorHandler); // 404 handler - must be last
app.use('*', (req, res) => { res.status(404).json({ success: false, error: { message: 'Route not found', statusCode: 404, path: req.originalUrl, method: req.method, timestamp: new Date().toISOString(), requestId: req.requestId } });
}); // Initialize database and start server
async function startServer() {
  try {
    console.log('Starting Trainer Platform Backend...');
    console.log('='.repeat(60));

    // Initialize cache
    await cacheManager.connect();

    // Initialize AI service
    await aiService.initialize();

    // Initialize database connection
    // Simple database connection
    console.log('🔧 Database Configuration:');
    console.log(`   - USE_LOCAL_DB: ${process.env.USE_LOCAL_DB}`);
    console.log(`   - Connection: ${process.env.USE_LOCAL_DB === 'true' ? 'Local MongoDB' : 'Atlas MongoDB'}`);
    
    // Connect to MongoDB
      await connectToMongoDB();
    console.log('✅ Database connection established');

    // Initialize API routes
    console.log('🚀 Initializing API Routes...');
    setupAPIRoutes(app);
    console.log('✅ API routes initialized');

    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log('TRAINER PLATFORM BACKEND STARTED SUCCESSFULLY');
      console.log('='.repeat(60));
      console.log(` Server running on port ${PORT}`);
      console.log(` Health check: http://localhost:${PORT}/health`);
      console.log(` Detailed health: http://localhost:${PORT}/health/detailed`);
      console.log(` Database status: http://localhost:${PORT}/api/database/status`);
      console.log(`🔗 API base: http://localhost:${PORT}/api`);
      console.log(` Auth API: http://localhost:${PORT}/api/v1/auth/register`);
      console.log(` Jobs API: http://localhost:${PORT}/api/v1/jobs`);
      console.log(` External access: http://192.168.1.9:${PORT}`);
      console.log(`🌍 Environment: ${environmentConfig.get('NODE_ENV', 'development')}`);
      console.log(` Started at: ${new Date().toISOString()}`);
      console.log('='.repeat(60));
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal) => {
      console.log(`\n Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        try {
          // Stop cache
          await cacheManager.disconnect();
          // Close database connection
          await mongoose.connection.close();
          console.log('Server closed gracefully');
          process.exit(0);
        } catch (error) {
          console.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('\n Failed to start server:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
} // Handle uncaught exceptions
process.on('uncaughtException', (error) => { console.error('Uncaught Exception:', error); console.error('Stack trace:', error.stack); process.exit(1);
}); // Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => { console.error('Unhandled Rejection at:', promise, 'reason:', reason); process.exit(1);
}); // Start the server
startServer(); module.exports = app;
