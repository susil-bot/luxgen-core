const {
  getTenantConfig,
  getActiveTenantConfigs,
  isTenantActive,
  getTenantFeature,
  isFeatureEnabled,
  getTenantLimits,
  validateTenantConfig
} = require('../config/tenants');

/**
 * Get tenant configuration
 */
exports.getTenantConfig = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Tenant slug is required'
      });
    }
    const config = getTenantConfig(slug);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Tenant configuration not found'
      });
    }
    // Remove sensitive information
    const safeConfig = {
      ...config,
      integrations: {
        email: { provider: config.integrations.email.provider },
        storage: { provider: config.integrations.storage.provider },
        analytics: { provider: config.integrations.analytics.provider } }
    }
    res.json({
      success: true,
      data: safeConfig
    });
  } catch (error) {
    console.error('Error getting tenant config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant configuration',
      error: error.message
    });
  } }
/**
 * Get all active tenant configurations
 */
exports.getAllTenantConfigs = async (req, res) => {
  try {
    const activeConfigs = getActiveTenantConfigs();


    // Remove sensitive information from all configs
    const safeConfigs = {}
    Object.keys(activeConfigs).forEach(slug => {
      const config = activeConfigs[slug];
      safeConfigs[slug] = {
        ...config,
        integrations: {
          email: { provider: config.integrations.email.provider },
          storage: { provider: config.integrations.storage.provider },
          analytics: { provider: config.integrations.analytics.provider } }
      } });

    res.json({
      success: true,
      data: safeConfigs
    });
  } catch (error) {
    console.error('Error getting all tenant configs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant configurations',
      error: error.message
    });
  } }
/**
 * Check if tenant feature is enabled
 */
exports.checkFeature = async (req, res) => {
  try {
    const { slug, feature } = req.params;

    if (!slug || !feature) {
      return res.status(400).json({
        success: false,
        message: 'Tenant slug and feature name are required'
      });
    }
    const isEnabled = isFeatureEnabled(slug, feature);
    const featureConfig = getTenantFeature(slug, feature);

    res.json({
      success: true,
      data: {
        tenant: slug,
        feature,
        enabled: isEnabled,
        config: featureConfig
      } });
  } catch (error) {
    console.error('Error checking feature:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check feature',
      error: error.message
    });
  } }
/**
 * Get tenant limits
 */
exports.getTenantLimits = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Tenant slug is required'
      });
    }
    const limits = getTenantLimits(slug);

    res.json({
      success: true,
      data: {
        tenant: slug,
        limits
      } });
  } catch (error) {
    console.error('Error getting tenant limits:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant limits',
      error: error.message
    });
  } }
/**
 * Validate tenant configuration
 */
exports.validateConfig = async (req, res) => {
  try {
    const config = req.body;

    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'Configuration data is required'
      });
    }
    const validation = validateTenantConfig(config);

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate configuration',
      error: error.message
    });
  } }
/**
 * Get tenant branding information
 */
exports.getTenantBranding = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Tenant slug is required'
      });
    }
    const config = getTenantConfig(slug);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Tenant configuration not found'
      });
    }
    const branding = config.branding || {}
    res.json({
      success: true,
      data: {
        tenant: slug,
        branding
      } });
  } catch (error) {
    console.error('Error getting tenant branding:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant branding',
      error: error.message
    });
  } }
/**
 * Get tenant settings
 */
exports.getTenantSettings = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Tenant slug is required'
      });
    }
    const config = getTenantConfig(slug);

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Tenant configuration not found'
      });
    }
    const settings = config.settings || {}
    res.json({
      success: true,
      data: {
        tenant: slug,
        settings
      } });
  } catch (error) {
    console.error('Error getting tenant settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant settings',
      error: error.message
    });
  } }
module.exports = exports;
