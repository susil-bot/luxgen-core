const express = require('express');
const router = express.Router();
const tenantConfigController = require('../controllers/tenantConfigController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/configs', tenantConfigController.getAllTenantConfigs);
router.get('/config/:slug', tenantConfigController.getTenantConfig);
router.get('/config/:slug/branding', tenantConfigController.getTenantBranding);
router.get('/config/:slug/settings', tenantConfigController.getTenantSettings);
router.get('/config/:slug/limits', tenantConfigController.getTenantLimits);
router.get('/config/:slug/feature/:feature', tenantConfigController.checkFeature);

// Protected routes (authentication required)
router.use(authenticateToken);
router.use(requireAdmin);

// Admin-only routes
router.post('/validate', tenantConfigController.validateConfig);

module.exports = router; 