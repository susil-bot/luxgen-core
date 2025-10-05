const tenantDatabaseManager = require('./TenantDatabaseManager');
const tenantConfig = require('../tenantConfig');

/**
 * TENANT CONFIGURATION SWITCHER
 * Configuration-based database switching and tenant routing
 */

class TenantConfigSwitcher {
  constructor() {
    this.tenantConfigs = tenantConfig;
    this.initializedTenants = new Set();
  }

  /**
   * Get tenant configuration by ID or slug
   */
  getTenantConfig(tenantIdentifier) {
    // Try by ID first
    if (this.tenantConfigs[tenantIdentifier]) {
      return this.tenantConfigs[tenantIdentifier];
    }

    // Try by slug
    for (const [id, config] of Object.entries(this.tenantConfigs)) {
      if (config.slug === tenantIdentifier) {
        return config;
      }
    }

    return null;
  }

  /**
   * Initialize tenant based on configuration
   */
  async initializeTenantFromConfig(tenantIdentifier) {
    try {
      const config = this.getTenantConfig(tenantIdentifier);
      
      if (!config) {
        throw new Error(`Tenant configuration not found: ${tenantIdentifier}`);
      }

      const tenantId = config.id;
      
      // Check if already initialized
      if (this.initializedTenants.has(tenantId)) {
        return { config, models: tenantDatabaseManager.getTenantModels(tenantId) };
      }

      // Initialize tenant database
      const { connection, models } = await tenantDatabaseManager.initializeTenantDatabase(tenantId);
      
      // Mark as initialized
      this.initializedTenants.add(tenantId);
      
      console.log(`✅ Initialized tenant from config: ${tenantId}`);
      return { config, connection, models };
    } catch (error) {
      console.error(`❌ Failed to initialize tenant from config ${tenantIdentifier}:`, error);
      throw error;
    }
  }

  /**
   * Switch to tenant based on configuration
   */
  async switchToTenant(tenantIdentifier, req) {
    try {
      const { config, models } = await this.initializeTenantFromConfig(tenantIdentifier);
      
      // Update request with tenant context
      req.tenantId = config.id;
      req.tenantSlug = config.slug;
      req.tenant = config;
      req.tenantModels = models;
      req.tenantContext = {
        tenantId: config.id,
        tenantSlug: config.slug,
        config: config,
        models: models,
        databaseName: tenantDatabaseManager.getTenantDatabaseName(config.id)
      };

      console.log(`🔄 Switched to tenant: ${config.name} (${config.id})`);
      return { config, models };
    } catch (error) {
      console.error(`❌ Failed to switch to tenant ${tenantIdentifier}:`, error);
      throw error;
    }
  }

  /**
   * Get tenant by domain
   */
  async getTenantByDomain(domain) {
    for (const [id, config] of Object.entries(this.tenantConfigs)) {
      if (config.domain === domain) {
        return await this.initializeTenantFromConfig(id);
      }
    }
    return null;
  }

  /**
   * Get tenant by subdomain
   */
  async getTenantBySubdomain(subdomain) {
    for (const [id, config] of Object.entries(this.tenantConfigs)) {
      if (config.slug === subdomain) {
        return await this.initializeTenantFromConfig(id);
      }
    }
    return null;
  }

  /**
   * Check if tenant has specific feature
   */
  hasFeature(tenantId, feature) {
    const config = this.getTenantConfig(tenantId);
    if (!config) return false;
    
    return config.features && config.features.includes(feature);
  }

  /**
   * Check if tenant is within limits
   */
  async checkTenantLimits(tenantId) {
    try {
      const config = this.getTenantConfig(tenantId);
      if (!config) return { withinLimits: false, error: 'Tenant not found' };

      const models = tenantDatabaseManager.getTenantModels(tenantId);
      
      // Check user limits
      const userCount = await models.User.countDocuments({ tenantId });
      const maxUsers = config.limits?.maxUsers || 1000;
      
      // Check storage limits (simplified)
      const storageStats = await tenantDatabaseManager.getTenantDatabaseStats(tenantId);
      const maxStorage = config.limits?.maxStorage || 1000000; // 1GB in MB
      
      return {
        withinLimits: userCount < maxUsers && storageStats.dataSize < maxStorage,
        limits: {
          users: { current: userCount, max: maxUsers },
          storage: { current: storageStats.dataSize, max: maxStorage }
        }
      };
    } catch (error) {
      console.error(`❌ Failed to check tenant limits for ${tenantId}:`, error);
      return { withinLimits: false, error: error.message };
    }
  }

  /**
   * Get all available tenants
   */
  getAllTenants() {
    return Object.keys(this.tenantConfigs).map(id => ({
      id,
      ...this.tenantConfigs[id]
    }));
  }

  /**
   * Get tenant statistics
   */
  async getTenantStatistics() {
    try {
      const tenants = this.getAllTenants();
      const statistics = [];

      for (const tenant of tenants) {
        try {
          const stats = await tenantDatabaseManager.getTenantDatabaseStats(tenant.id);
          const limits = await this.checkTenantLimits(tenant.id);
          
          statistics.push({
            tenantId: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            domain: tenant.domain,
            databaseStats: stats,
            limits: limits,
            isInitialized: this.initializedTenants.has(tenant.id)
          });
        } catch (error) {
          console.error(`❌ Failed to get stats for tenant ${tenant.id}:`, error);
          statistics.push({
            tenantId: tenant.id,
            name: tenant.name,
            error: error.message
          });
        }
      }

      return statistics;
    } catch (error) {
      console.error('❌ Failed to get tenant statistics:', error);
      throw error;
    }
  }

  /**
   * Cleanup tenant resources
   */
  async cleanupTenant(tenantId) {
    try {
      await tenantDatabaseManager.closeTenantConnection(tenantId);
      this.initializedTenants.delete(tenantId);
      console.log(`✅ Cleaned up tenant: ${tenantId}`);
    } catch (error) {
      console.error(`❌ Failed to cleanup tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Cleanup all tenant resources
   */
  async cleanupAll() {
    try {
      await tenantDatabaseManager.closeAllConnections();
      this.initializedTenants.clear();
      console.log('✅ Cleaned up all tenants');
    } catch (error) {
      console.error('❌ Failed to cleanup all tenants:', error);
      throw error;
    }
  }
}

// Create singleton instance
const tenantConfigSwitcher = new TenantConfigSwitcher();

module.exports = tenantConfigSwitcher;
