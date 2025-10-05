const tenantDatabaseManager = require('../config/tenant/TenantDatabaseManager');
const tenantConfigSwitcher = require('../config/tenant/TenantConfigSwitcher');
const { AuthenticationError, AuthorizationError } = require('../utils/errors');

/**
 * TENANT DATABASE MIDDLEWARE
 * Automatic tenant database selection and context switching
 */

class TenantDatabaseMiddleware {
  /**
   * Middleware to automatically select tenant database
   */
  static async selectTenantDatabase(req, res, next) {
    try {
      // Get tenant from request (set by tenant identification middleware)
      const tenantId = req.tenantId || req.tenant?.id;
      
      if (!tenantId) {
        return next(new AuthenticationError('Tenant context required for database access'));
      }

      // Switch to tenant database
      await tenantConfigSwitcher.switchToTenant(tenantId, req);
      
      next();
    } catch (error) {
      console.error('❌ Failed to select tenant database:', error);
      next(error);
    }
  }

  /**
   * Middleware to ensure tenant database is available
   */
  static async ensureTenantDatabase(req, res, next) {
    try {
      const tenantId = req.tenantId || req.tenant?.id;
      
      if (!tenantId) {
        return next(new AuthenticationError('Tenant context required'));
      }

      // Check if tenant database is healthy
      const healthCheck = await tenantDatabaseManager.healthCheck(tenantId);
      
      if (!healthCheck.healthy) {
        // Try to reconnect
        await tenantConfigSwitcher.switchToTenant(tenantId, req);
      }

      next();
    } catch (error) {
      console.error('❌ Tenant database health check failed:', error);
      next(error);
    }
  }

  /**
   * Middleware to check tenant limits
   */
  static async checkTenantLimits(req, res, next) {
    try {
      const tenantId = req.tenantId || req.tenant?.id;
      
      if (!tenantId) {
        return next(new AuthenticationError('Tenant context required'));
      }

      const limits = await tenantConfigSwitcher.checkTenantLimits(tenantId);
      
      if (!limits.withinLimits) {
        return next(new AuthorizationError('Tenant limits exceeded'));
      }

      req.tenantLimits = limits;
      next();
    } catch (error) {
      console.error('❌ Failed to check tenant limits:', error);
      next(error);
    }
  }

  /**
   * Middleware to check tenant feature access
   */
  static checkFeatureAccess(feature) {
    return (req, res, next) => {
      try {
        const tenantId = req.tenantId || req.tenant?.id;
        
        if (!tenantId) {
          return next(new AuthenticationError('Tenant context required'));
        }

        const hasFeature = tenantConfigSwitcher.hasFeature(tenantId, feature);
        
        if (!hasFeature) {
          return next(new AuthorizationError(`Feature '${feature}' is not available for this tenant`));
        }

        next();
      } catch (error) {
        console.error(`❌ Failed to check feature access for ${feature}:`, error);
        next(error);
      }
    };
  }

  /**
   * Middleware to handle tenant database errors
   */
  static handleTenantDatabaseErrors(error, req, res, next) {
    if (error.message.includes('tenant') || error.message.includes('database')) {
      console.error('Tenant database error:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Tenant database error',
        message: 'Failed to access tenant-specific data',
        tenantId: req.tenantId
      });
    }
    
    next(error);
  }

  /**
   * Get tenant database statistics
   */
  static async getTenantStats(req, res) {
    try {
      const tenantId = req.tenantId || req.tenant?.id;
      
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant context required'
        });
      }

      const stats = await tenantDatabaseManager.getTenantDatabaseStats(tenantId);
      
      res.json({
        success: true,
        stats: stats
      });
    } catch (error) {
      console.error('❌ Failed to get tenant stats:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * List all tenant databases
   */
  static async listTenantDatabases(req, res) {
    try {
      const databases = await tenantDatabaseManager.listTenantDatabases();
      
      res.json({
        success: true,
        databases: databases
      });
    } catch (error) {
      console.error('❌ Failed to list tenant databases:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Health check for all tenant databases
   */
  static async healthCheckAll(req, res) {
    try {
      const activeConnections = tenantDatabaseManager.getActiveConnections();
      const healthChecks = [];
      
      for (const connection of activeConnections) {
        const health = await tenantDatabaseManager.healthCheck(connection.tenantId);
        healthChecks.push({
          tenantId: connection.tenantId,
          databaseName: connection.databaseName,
          ...health
        });
      }
      
      res.json({
        success: true,
        healthChecks: healthChecks,
        totalConnections: activeConnections.length
      });
    } catch (error) {
      console.error('❌ Failed to perform health checks:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get tenant statistics
   */
  static async getTenantStatistics(req, res) {
    try {
      const statistics = await tenantConfigSwitcher.getTenantStatistics();
      
      res.json({
        success: true,
        statistics: statistics
      });
    } catch (error) {
      console.error('❌ Failed to get tenant statistics:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = TenantDatabaseMiddleware;
