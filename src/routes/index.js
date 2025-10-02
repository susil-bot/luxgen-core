const express = require('express');
const router = express.Router();

// Import essential route modules only
const tenantRoutes = require('./tenantRoutes');
const authRoutes = require('./authRoutes');

// Robust Multi-Tenant Architecture Routes
const tenantManagementRoutes = require('./tenantManagementRoutes');

// Brand Identity Routes
const brandIdentityRoutes = require('./brandIdentityRoutes');

// Import middleware
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// API versioning
const API_VERSION = 'v1';
const API_PREFIX = `/api/${API_VERSION}`;

// Enhanced health check endpoint
router.get('/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'luxgen-trainer-platform-api',
    version: '1.0.0',
    apiVersion: API_VERSION,
    uptime: Math.floor(uptime),
    uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
    environment: process.env.NODE_ENV || 'development',
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
      },
      cpuUsage: process.cpuUsage()
    }
  });
});

// Database health check
router.get('/health/db', async (req, res) => {
  try {
    const databaseManager = require('../config/database');
    const health = await databaseManager.healthCheck();
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: health
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// System metrics endpoint
router.get('/health/metrics', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  const cpuUsage = process.cpuUsage();
  
  res.status(200).json({
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptime),
      formatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`
    },
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid
    }
  });
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    message: 'LuxGen Trainer Platform API Documentation',
    version: API_VERSION,
    endpoints: {
      health: {
        GET: `${API_PREFIX}/health - Service health check`,
        GET: `${API_PREFIX}/health/db - Database health check`
      },
      tenants: {
        base: `${API_PREFIX}/tenants`,
        endpoints: [
          'POST /create - Create new tenant',
          'GET / - List all tenants',
          'GET /:id - Get tenant by ID',
          'PUT /:id - Update tenant',
          'DELETE /:id - Soft delete tenant'
        ]
      },
      auth: {
        base: `${API_PREFIX}/auth`,
        endpoints: [
          'POST /register - Register new user',
          'POST /login - User login',
          'POST /logout - User logout'
        ]
      }
    }
  });
});

// Mount essential route modules with proper prefixes
router.use(`${API_PREFIX}/tenants`, tenantRoutes);
router.use(`${API_PREFIX}/auth`, authRoutes);

// Robust Multi-Tenant Architecture Routes
router.use(`${API_PREFIX}/tenants`, tenantManagementRoutes);

// Brand Identity Routes
router.use(`${API_PREFIX}/brand-identity`, brandIdentityRoutes);

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
router.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

module.exports = router;