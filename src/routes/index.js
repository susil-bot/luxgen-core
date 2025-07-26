const express = require('express');
const router = express.Router();

// Import all route modules
const tenantRoutes = require('./tenantRoutes');
const tenantSchemaRoutes = require('./tenantSchemaRoutes');
const tenantStylingRoutes = require('./tenantStylingRoutes');
const tenantAdminRoutes = require('./tenantAdminRoutes');
const tenantConfigRoutes = require('./tenantConfigRoutes');
// const userDetailsRoutes = require('./userDetailsRoutes'); // Removed - consolidated into User model
const userRegistrationRoutes = require('./userRegistrationRoutes');
const pollsRoutes = require('./polls');

// Import middleware
const { authenticateToken, requireAdmin } = require('../middleware/auth');
// const { validateRequest } = require('../middleware/validation');

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
          'GET /deleted - List deleted tenants',
          'GET /:id - Get tenant by ID',
          'GET /slug/:slug - Get tenant by slug',
          'PUT /:id - Update tenant',
          'DELETE /:id - Soft delete tenant',
          'POST /:id/restore - Restore deleted tenant',
          'GET /stats - Get tenant statistics',
          'POST /bulk/update - Bulk update tenants',
          'POST /bulk/delete - Bulk delete tenants',
          'POST /bulk/restore - Bulk restore tenants'
        ]
      },
      users: {
        base: `${API_PREFIX}/users`,
        endpoints: [
          'POST /register - Register new user',
          'GET / - List users',
          'GET /:id - Get user by ID',
          'PUT /:id - Update user',
          'DELETE /:id - Delete user',
          'POST /login - User login',
          'POST /logout - User logout'
        ]
      },
      polls: {
        base: `${API_PREFIX}/polls`,
        endpoints: [
          'POST / - Create new poll',
          'GET / - List polls',
          'GET /:id - Get poll by ID',
          'PUT /:id - Update poll',
          'DELETE /:id - Delete poll',
          'POST /:id/responses - Submit poll response',
          'GET /:id/results - Get poll results'
        ]
      },
      schemas: {
        base: `${API_PREFIX}/schemas`,
        endpoints: [
          'POST / - Create schema',
          'GET / - List schemas',
          'GET /:id - Get schema by ID',
          'PUT /:id - Update schema',
          'DELETE /:id - Delete schema'
        ]
      }
    }
  });
});

// Mount all route modules with proper prefixes
router.use(`${API_PREFIX}/tenants`, tenantRoutes);
router.use(`${API_PREFIX}/schemas`, tenantSchemaRoutes);
router.use(`${API_PREFIX}/styling`, tenantStylingRoutes);
router.use(`${API_PREFIX}/admin`, tenantAdminRoutes);
router.use(`${API_PREFIX}/config`, tenantConfigRoutes);
// router.use(`${API_PREFIX}/users`, userDetailsRoutes); // Removed - consolidated into User model
router.use(`${API_PREFIX}/registration`, userRegistrationRoutes);
router.use(`${API_PREFIX}/polls`, pollsRoutes);

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