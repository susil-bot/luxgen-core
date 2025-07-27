const express = require('express');
const router = express.Router();

// Import all route modules
const tenantRoutes = require('./tenantRoutes');
const tenantSchemaRoutes = require('./tenantSchemaRoutes');
const tenantStylingRoutes = require('./tenantStylingRoutes');
const aiRoutes = require('./aiRoutes');
const groupRoutes = require('./groupRoutes');
const userManagementRoutes = require('./userManagementRoutes');
const tenantAdminRoutes = require('./tenantAdminRoutes');
const tenantConfigRoutes = require('./tenantConfigRoutes');
const userRegistrationRoutes = require('./userRegistrationRoutes');
const authRoutes = require('./authRoutes');
const pollsRoutes = require('./polls');

// New route modules
const trainingRoutes = require('./trainingRoutes');
const presentationRoutes = require('./presentationRoutes');

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
          'GET /:id/analytics - Get tenant analytics',
          'GET /:id/users - Get tenant users',
          'GET /:id/settings - Get tenant settings',
          'PUT /:id/settings - Update tenant settings',
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
      training: {
        base: `${API_PREFIX}/training`,
        endpoints: [
          'GET /sessions - List training sessions',
          'GET /sessions/:id - Get session by ID',
          'POST /sessions - Create training session',
          'PUT /sessions/:id - Update session',
          'DELETE /sessions/:id - Delete session',
          'POST /sessions/:id/participants - Add participant',
          'DELETE /sessions/:id/participants/:userId - Remove participant',
          'POST /sessions/:id/attendance/:userId - Mark attendance',
          'POST /sessions/:id/complete - Complete session',
          'GET /courses - List training courses',
          'GET /courses/:id - Get course by ID',
          'POST /courses - Create course',
          'PUT /courses/:id - Update course',
          'DELETE /courses/:id - Delete course',
          'POST /courses/:id/enroll - Enroll in course',
          'GET /courses/:id/participants/:participantId/progress - Get progress',
          'POST /courses/:id/modules/:moduleId/complete - Complete module',
          'GET /modules - List training modules',
          'GET /modules/:id - Get module by ID',
          'POST /modules - Create module',
          'PUT /modules/:id - Update module',
          'DELETE /modules/:id - Delete module',
          'GET /assessments - List assessments',
          'GET /assessments/:id - Get assessment by ID',
          'POST /assessments - Create assessment',
          'PUT /assessments/:id - Update assessment',
          'DELETE /assessments/:id - Delete assessment',
          'POST /assessments/:id/submit - Submit assessment',
          'GET /trainers/:trainerId/stats - Get trainer stats',
          'GET /participants/:participantId/stats - Get participant stats'
        ]
      },
      presentations: {
        base: `${API_PREFIX}/presentations`,
        endpoints: [
          'GET / - List presentations',
          'GET /:id - Get presentation by ID',
          'POST / - Create presentation',
          'PUT /:id - Update presentation',
          'DELETE /:id - Delete presentation',
          'POST /:id/start - Start presentation',
          'POST /:id/end/:sessionId - End presentation',
          'POST /:id/sessions/:sessionId/participants - Add participant',
          'DELETE /:id/sessions/:sessionId/participants/:userId - Remove participant',
          'POST /:id/sessions/:sessionId/advance - Advance slide',
          'POST /:id/polls - Add poll to presentation',
          'POST /:id/sessions/:sessionId/polls/:pollId/activate - Activate poll',
          'POST /:id/sessions/:sessionId/polls/:pollId/deactivate - Deactivate poll',
          'POST /:id/sessions/:sessionId/polls/:pollId/responses - Submit poll response',
          'GET /:id/sessions/:sessionId/polls/:pollId/results - Get poll results',
          'POST /:id/slides - Add slide',
          'PUT /:id/slides/:slideIndex - Update slide',
          'DELETE /:id/slides/:slideIndex - Remove slide',
          'GET /:id/stats - Get presentation stats',
          'GET /:id/sessions/:sessionId/stats - Get session stats'
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
router.use(`${API_PREFIX}/registration`, userRegistrationRoutes);
router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/polls`, pollsRoutes);
router.use(`${API_PREFIX}/ai`, aiRoutes);
router.use(`${API_PREFIX}/groups`, groupRoutes);
router.use(`${API_PREFIX}/users`, userManagementRoutes);

// New route modules
router.use(`${API_PREFIX}/training`, trainingRoutes);
router.use(`${API_PREFIX}/presentations`, presentationRoutes);

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