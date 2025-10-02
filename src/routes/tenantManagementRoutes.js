/**
 * Comprehensive Tenant Management Routes
 * Handles all tenant-related operations with robust architecture
 */

const express = require('express');
const router = express.Router();
const TenantMiddleware = require('../middleware/tenantMiddleware');
const tenantConfigurationManager = require('../services/TenantConfigurationManager');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

// Apply tenant middleware to all routes
router.use(TenantMiddleware.identifyTenant());
router.use(TenantMiddleware.validateTenantAccess());
router.use(TenantMiddleware.applyTenantConfig());
router.use(TenantMiddleware.transformResponse());
router.use(TenantMiddleware.auditTenantActions());

/**
 * Tenant Health and Status Routes
 */
router.get('/health', TenantMiddleware.getTenantHealth);
router.get('/health/all', TenantMiddleware.getAllTenantConfigs);

/**
 * Get current tenant configuration
 */
router.get('/config', async (req, res) => {
  try {
    const tenantConfig = req.tenant.config;

    res.json({
      success: true,
      data: {
        tenant: req.tenant.slug,
        config: tenantConfig,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to get tenant config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant configuration',
      error: error.message
    });
  }
});

/**
 * Update tenant configuration
 */
router.put('/config', requireAuth, async (req, res) => {
  try {
    const { updates } = req.body;

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid updates provided'
      });
    }

    const updatedConfig = await tenantConfigurationManager.updateTenantConfig(
      req.tenant.slug,
      updates
    );

    res.json({
      success: true,
      data: updatedConfig,
      message: 'Tenant configuration updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update tenant config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant configuration',
      error: error.message
    });
  }
});

/**
 * Get tenant features
 */
router.get('/features', async (req, res) => {
  try {
    const features = req.tenant.config.features || [];

    res.json({
      success: true,
      data: {
        features,
        enabled: features,
        disabled: tenantConfigurationManager.getDisabledFeatures(req.tenant.config)
      }
    });
  } catch (error) {
    logger.error('Failed to get tenant features:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant features',
      error: error.message
    });
  }
});

/**
 * Update tenant features
 */
router.put('/features', requireAuth, async (req, res) => {
  try {
    const { features } = req.body;

    if (!Array.isArray(features)) {
      return res.status(400).json({
        success: false,
        message: 'Features must be an array'
      });
    }

    const updatedConfig = await tenantConfigurationManager.updateTenantConfig(
      req.tenant.slug,
      { features }
    );

    res.json({
      success: true,
      data: updatedConfig,
      message: 'Tenant features updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update tenant features:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant features',
      error: error.message
    });
  }
});

/**
 * Get tenant branding
 */
router.get('/branding', async (req, res) => {
  try {
    const branding = req.tenant.config.branding || {};

    res.json({
      success: true,
      data: branding
    });
  } catch (error) {
    logger.error('Failed to get tenant branding:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant branding',
      error: error.message
    });
  }
});

/**
 * Update tenant branding
 */
router.put('/branding', requireAuth, async (req, res) => {
  try {
    const { branding } = req.body;

    if (!branding || typeof branding !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid branding data provided'
      });
    }

    const updatedConfig = await tenantConfigurationManager.updateTenantConfig(
      req.tenant.slug,
      { branding }
    );

    res.json({
      success: true,
      data: updatedConfig,
      message: 'Tenant branding updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update tenant branding:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant branding',
      error: error.message
    });
  }
});

/**
 * Get tenant limits
 */
router.get('/limits', async (req, res) => {
  try {
    const limits = req.tenant.config.limits || {};
    const usage = tenantConfigurationManager.getCurrentUsage(req.tenant.config);

    res.json({
      success: true,
      data: {
        limits,
        usage,
        remaining: this.calculateRemainingLimits(limits, usage)
      }
    });
  } catch (error) {
    logger.error('Failed to get tenant limits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant limits',
      error: error.message
    });
  }
});

/**
 * Get tenant security settings
 */
router.get('/security', async (req, res) => {
  try {
    const security = req.tenant.config.security || {};

    res.json({
      success: true,
      data: security
    });
  } catch (error) {
    logger.error('Failed to get tenant security:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant security settings',
      error: error.message
    });
  }
});

/**
 * Update tenant security settings
 */
router.put('/security', requireAuth, async (req, res) => {
  try {
    const { security } = req.body;

    if (!security || typeof security !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid security data provided'
      });
    }

    const updatedConfig = await tenantConfigurationManager.updateTenantConfig(
      req.tenant.slug,
      { security }
    );

    res.json({
      success: true,
      data: updatedConfig,
      message: 'Tenant security settings updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update tenant security:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant security settings',
      error: error.message
    });
  }
});

/**
 * Get tenant integrations
 */
router.get('/integrations', async (req, res) => {
  try {
    const integrations = req.tenant.config.integrations || {};

    res.json({
      success: true,
      data: integrations
    });
  } catch (error) {
    logger.error('Failed to get tenant integrations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant integrations',
      error: error.message
    });
  }
});

/**
 * Update tenant integrations
 */
router.put('/integrations', requireAuth, async (req, res) => {
  try {
    const { integrations } = req.body;

    if (!integrations || typeof integrations !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid integrations data provided'
      });
    }

    const updatedConfig = await tenantConfigurationManager.updateTenantConfig(
      req.tenant.slug,
      { integrations }
    );

    res.json({
      success: true,
      data: updatedConfig,
      message: 'Tenant integrations updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update tenant integrations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant integrations',
      error: error.message
    });
  }
});

/**
 * Transform component based on tenant configuration
 */
router.post('/transform', async (req, res) => {
  try {
    const { component, transformationType = 'all' } = req.body;

    if (!component) {
      return res.status(400).json({
        success: false,
        message: 'Component data required'
      });
    }

    const transformedComponent = tenantConfigurationManager.transformComponent(
      component,
      req.tenant.config,
      transformationType
    );

    res.json({
      success: true,
      data: transformedComponent,
      message: 'Component transformed successfully'
    });
  } catch (error) {
    logger.error('Failed to transform component:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to transform component',
      error: error.message
    });
  }
});

/**
 * Get tenant analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const analytics = {
      tenant: req.tenant.slug,
      features: req.tenant.config.features.length,
      settings: Object.keys(req.tenant.config.settings).length,
      integrations: Object.keys(req.tenant.config.integrations).length,
      lastUpdated: req.tenant.config.lastUpdated,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Failed to get tenant analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant analytics',
      error: error.message
    });
  }
});

/**
 * Clear tenant cache
 */
router.post('/cache/clear', requireAuth, async (req, res) => {
  try {
    await tenantConfigurationManager.clearCache();

    res.json({
      success: true,
      message: 'Tenant cache cleared successfully'
    });
  } catch (error) {
    logger.error('Failed to clear tenant cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear tenant cache',
      error: error.message
    });
  }
});

/**
 * Helper function to calculate remaining limits
 */
function calculateRemainingLimits (limits, usage) {
  const remaining = {};

  for (const [key, limit] of Object.entries(limits)) {
    if (typeof limit === 'number' && typeof usage[key] === 'number') {
      remaining[key] = Math.max(0, limit - usage[key]);
    }
  }

  return remaining;
}

// Apply error handling middleware
router.use(TenantMiddleware.handleTenantErrors());

module.exports = router;
