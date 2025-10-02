/**
 * Global Tenant Configuration Manager
 * Manages tenant configurations, transformations, and global settings
 */

const cache = require('../utils/cache');
const logger = require('../utils/logger');

class TenantConfigurationManager {
  constructor () {
    this.tenantConfigs = new Map();
    this.globalSettings = new Map();
    this.transformationRules = new Map();
    this.cacheTimeout = 300000; // 5 minutes
  }

  /**
   * Initialize tenant configuration system
   */
  async initialize () {
    try {
      logger.info('Initializing Tenant Configuration Manager...');

      // Load global settings
      await this.loadGlobalSettings();

      // Load tenant configurations
      await this.loadTenantConfigurations();

      // Load transformation rules
      await this.loadTransformationRules();

      logger.info('Tenant Configuration Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Tenant Configuration Manager:', error);
      throw error;
    }
  }

  /**
   * Load global settings from database
   */
  async loadGlobalSettings () {
    try {
      const Tenant = require('../models/Tenant');
      const globalSettings = await Tenant.find({ isGlobal: true }).lean();

      globalSettings.forEach(setting => {
        this.globalSettings.set(setting.key, setting.value);
      });

      logger.info(`Loaded ${globalSettings.length} global settings`);
    } catch (error) {
      logger.error('Failed to load global settings:', error);
      throw error;
    }
  }

  /**
   * Load tenant configurations
   */
  async loadTenantConfigurations () {
    try {
      const Tenant = require('../models/Tenant');
      const tenants = await Tenant.find({ isActive: true }).lean();

      tenants.forEach(tenant => {
        this.tenantConfigs.set(tenant.slug, {
          id: tenant._id,
          slug: tenant.slug,
          name: tenant.name,
          domain: tenant.domain,
          settings: tenant.settings || {},
          features: tenant.features || [],
          limits: tenant.limits || {},
          branding: tenant.branding || {},
          security: tenant.security || {},
          integrations: tenant.integrations || {},
          customFields: tenant.customFields || {},
          lastUpdated: new Date()
        });
      });

      logger.info(`Loaded ${tenants.length} tenant configurations`);
    } catch (error) {
      logger.error('Failed to load tenant configurations:', error);
      throw error;
    }
  }

  /**
   * Load transformation rules for components
   */
  async loadTransformationRules () {
    try {
      // Default transformation rules
      const defaultRules = {
        'component.theme': {
          transform: (component, tenantConfig) => {
            return {
              ...component,
              theme: tenantConfig.branding.theme || 'default',
              colors: tenantConfig.branding.colors || {},
              fonts: tenantConfig.branding.fonts || {}
            };
          }
        },
        'component.features': {
          transform: (component, tenantConfig) => {
            return {
              ...component,
              enabledFeatures: tenantConfig.features || [],
              disabledFeatures: this.getDisabledFeatures(tenantConfig)
            };
          }
        },
        'component.limits': {
          transform: (component, tenantConfig) => {
            return {
              ...component,
              limits: tenantConfig.limits || {},
              usage: this.getCurrentUsage(tenantConfig)
            };
          }
        },
        'component.security': {
          transform: (component, tenantConfig) => {
            return {
              ...component,
              security: tenantConfig.security || {},
              permissions: this.getUserPermissions(tenantConfig)
            };
          }
        }
      };

      this.transformationRules = new Map(Object.entries(defaultRules));
      logger.info(`Loaded ${this.transformationRules.size} transformation rules`);
    } catch (error) {
      logger.error('Failed to load transformation rules:', error);
      throw error;
    }
  }

  /**
   * Get tenant configuration by slug
   */
  async getTenantConfig (tenantSlug) {
    try {
      // Check cache first
      const cacheKey = `tenant_config_${tenantSlug}`;
      const cached = await cache.get(cacheKey);

      if (cached) {
        return cached;
      }

      // Get from memory or database
      let config = this.tenantConfigs.get(tenantSlug);

      if (!config) {
        const Tenant = require('../models/Tenant');
        const tenant = await Tenant.findOne({ slug: tenantSlug, isActive: true }).lean();

        if (!tenant) {
          throw new Error(`Tenant not found: ${tenantSlug}`);
        }

        config = {
          id: tenant._id,
          slug: tenant.slug,
          name: tenant.name,
          domain: tenant.domain,
          settings: tenant.settings || {},
          features: tenant.features || [],
          limits: tenant.limits || {},
          branding: tenant.branding || {},
          security: tenant.security || {},
          integrations: tenant.integrations || {},
          customFields: tenant.customFields || {},
          lastUpdated: new Date()
        };

        this.tenantConfigs.set(tenantSlug, config);
      }

      // Cache the result
      await cache.set(cacheKey, config, this.cacheTimeout);

      return config;
    } catch (error) {
      logger.error(`Failed to get tenant config for ${tenantSlug}:`, error);
      throw error;
    }
  }

  /**
   * Transform component based on tenant configuration
   */
  transformComponent (component, tenantConfig, transformationType = 'all') {
    try {
      let transformedComponent = { ...component };

      if (transformationType === 'all') {
        // Apply all transformations
        for (const [ruleName, rule] of this.transformationRules) {
          transformedComponent = rule.transform(transformedComponent, tenantConfig);
        }
      } else {
        // Apply specific transformation
        const rule = this.transformationRules.get(transformationType);
        if (rule) {
          transformedComponent = rule.transform(transformedComponent, tenantConfig);
        }
      }

      return transformedComponent;
    } catch (error) {
      logger.error('Failed to transform component:', error);
      return component; // Return original component on error
    }
  }

  /**
   * Get global setting
   */
  getGlobalSetting (key, defaultValue = null) {
    return this.globalSettings.get(key) || defaultValue;
  }

  /**
   * Update tenant configuration
   */
  async updateTenantConfig (tenantSlug, updates) {
    try {
      const Tenant = require('../models/Tenant');

      const updatedTenant = await Tenant.findOneAndUpdate(
        { slug: tenantSlug },
        {
          $set: {
            ...updates,
            lastUpdated: new Date()
          }
        },
        { new: true, lean: true }
      );

      if (!updatedTenant) {
        throw new Error(`Tenant not found: ${tenantSlug}`);
      }

      // Update in-memory cache
      const config = {
        id: updatedTenant._id,
        slug: updatedTenant.slug,
        name: updatedTenant.name,
        domain: updatedTenant.domain,
        settings: updatedTenant.settings || {},
        features: updatedTenant.features || [],
        limits: updatedTenant.limits || {},
        branding: updatedTenant.branding || {},
        security: updatedTenant.security || {},
        integrations: updatedTenant.integrations || {},
        customFields: updatedTenant.customFields || {},
        lastUpdated: new Date()
      };

      this.tenantConfigs.set(tenantSlug, config);

      // Clear cache
      const cacheKey = `tenant_config_${tenantSlug}`;
      await cache.del(cacheKey);

      logger.info(`Updated tenant configuration for ${tenantSlug}`);
      return config;
    } catch (error) {
      logger.error(`Failed to update tenant config for ${tenantSlug}:`, error);
      throw error;
    }
  }

  /**
   * Get all tenant configurations
   */
  getAllTenantConfigs () {
    return Array.from(this.tenantConfigs.values());
  }

  /**
   * Get tenant health status
   */
  async getTenantHealth (tenantSlug) {
    try {
      const config = await this.getTenantConfig(tenantSlug);

      return {
        tenant: tenantSlug,
        status: 'healthy',
        lastUpdated: config.lastUpdated,
        features: config.features.length,
        settings: Object.keys(config.settings).length,
        integrations: Object.keys(config.integrations).length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Failed to get tenant health for ${tenantSlug}:`, error);
      return {
        tenant: tenantSlug,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Helper methods
   */
  getDisabledFeatures (tenantConfig) {
    const allFeatures = ['ai', 'analytics', 'integrations', 'custom_domain', 'sso', 'audit_logs'];
    return allFeatures.filter(feature => !tenantConfig.features.includes(feature));
  }

  getCurrentUsage (tenantConfig) {
    // This would typically query actual usage from database
    return {
      users: 0,
      storage: 0,
      apiCalls: 0,
      lastActivity: new Date()
    };
  }

  getUserPermissions (tenantConfig) {
    return tenantConfig.security.permissions || ['read', 'write'];
  }

  /**
   * Clear all caches
   */
  async clearCache () {
    try {
      await cache.clear();
      this.tenantConfigs.clear();
      this.globalSettings.clear();
      logger.info('Cleared all tenant configuration caches');
    } catch (error) {
      logger.error('Failed to clear cache:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new TenantConfigurationManager();
