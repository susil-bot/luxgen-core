/**
 * Tenant Configuration System
 * Dynamic configuration loading from src/tenants directory structure
 */

const { loadAllTenants, loadTenant, getTenantAsset, getAvailableTenants } = require('./tenantLoader');


// Default tenant configuration template
const defaultConfig = {
  name: 'Default Tenant',
  slug: 'default',
  status: 'active',
  features: {
    polls: { enabled: true, maxPolls: 100 },
    analytics: { enabled: true },
    branding: { enabled: true },
    customFields: { enabled: false },
    apiAccess: { enabled: true, rateLimit: 1000 },
    fileUpload: { enabled: true, maxSize: '10MB' },
    notifications: { enabled: true, channels: ['email', 'in-app'] }
  },
  settings: {
    allowPublicPolls: true,
    requireEmailVerification: true,
    autoArchivePolls: true,
    maxUsers: 50,
    sessionTimeout: 24, 
// hours
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false
    }
  },
  branding: {
    logo: null,
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    customCss: null,
    favicon: null
  },
  integrations: {
    email: { provider: 'smtp', config: {} },
    storage: { provider: 'local', config: {} },
    analytics: { provider: 'internal', config: {} }
  },
  limits: {
    maxPollsPerUser: 50,
    maxResponsesPerPoll: 1000,
    maxFileSize: 10485760, 
// 10MB
    maxStoragePerUser: 1073741824 
// 1GB
  }
};


// Load all tenant configurations dynamically
let tenantConfigs = null;

const getTenantConfigs = () => {
  if (!tenantConfigs) {
    tenantConfigs = loadAllTenants();
  }
  return tenantConfigs;
};

/**
 * Get tenant configuration by slug
 * @param {string} slug - Tenant slug
 * @returns {Object} Tenant configuration
 */
const getTenantConfig = (slug) => {
  const configs = getTenantConfigs();
  const config = configs[slug];
  if (!config) {
    
// Return default config if tenant not found
    return { ...defaultConfig, slug };
  }
  return config;
}

/**
 * Get all active tenant configurations
 * @returns {Object} All active tenant configs
 */
const getActiveTenantConfigs = () {
  const configs = getTenantConfigs();
  const activeConfigs = {};
  Object.keys(configs).forEach(slug => {
    if (slug !== 'default' && configs[slug].status === 'active') {
      activeConfigs[slug] = configs[slug];
    }
  });
  return activeConfigs;
}

/**
 * Check if tenant exists and is active
 * @param {string} slug - Tenant slug
 * @returns {boolean} True if tenant is active
 */
const isTenantActive = (slug) {
  const config = getTenantConfig(slug);
  return config && config.status === 'active';
}

/**
 * Get tenant feature configuration
 * @param {string} slug - Tenant slug
 * @param {string} feature - Feature name
 * @returns {Object} Feature configuration
 */
const getTenantFeature = (slug, feature) {
  const config = getTenantConfig(slug);
  return config.features[feature] || null;
}

/**
 * Check if tenant has feature enabled
 * @param {string} slug - Tenant slug
 * @param {string} feature - Feature name
 * @returns {boolean} True if feature is enabled
 */
const isFeatureEnabled = (slug, feature) {
  const featureConfig = getTenantFeature(slug, feature);
  return featureConfig && featureConfig.enabled;
}

/**
 * Get tenant limits
 * @param {string} slug - Tenant slug
 * @returns {Object} Tenant limits
 */
const getTenantLimits = (slug) {
  const config = getTenantConfig(slug);
  return config.limits || defaultConfig.limits;
}

/**
 * Validate tenant configuration
 * @param {Object} config - Tenant configuration
 * @returns {Object} Validation result
 */
const validateTenantConfig = (config) {
  const errors = [];

  if (!config.slug) {
    errors.push('Slug is required');
  }
  if (!config.name) {
    errors.push('Name is required');
  }
  if (!config.status) {
    errors.push('Status is required');
  }

  if (config.features) {
    Object.keys(config.features).forEach(feature => {
      if (typeof config.features[feature].enabled !== 'boolean') {
        errors.push(`Feature ${feature} must have enabled property`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  getTenantConfigs,
  getTenantConfig,
  getActiveTenantConfigs,
  isTenantActive,
  getTenantFeature,
  isFeatureEnabled,
  getTenantLimits,
  validateTenantConfig,
  getTenantAsset,
  getAvailableTenants
};
