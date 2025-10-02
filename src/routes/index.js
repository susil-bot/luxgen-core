const express = require('express');
const router = express.Router();

// Import essential route modules only
const tenantRoutes = require('./tenantRoutes');
const authRoutes = require('./authRoutes');

// Import middleware
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// API versioning
const API_VERSION = 'v1';
const API_PREFIX = `/api/${API_VERSION}`;

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'luxgen-trainer-platform-api',
    version: '1.0.0',
    apiVersion: API_VERSION,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
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