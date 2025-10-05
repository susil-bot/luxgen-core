const tenantDatabaseManager = require('./TenantDatabaseManager');

/**
 * TENANT CONTEXT MIDDLEWARE
 * Automatic tenant context switching and database selection
 */

class TenantContextMiddleware {
  /**
   * Middleware to automatically switch to tenant-specific database
   */
  static async switchToTenantDatabase(req, res, next) {
    try {
      // Get tenant from request (set by tenant identification middleware)
      const tenantId = req.tenantId || req.tenant?.id;
      
      if (!tenantId) {
        return next(new Error('Tenant context required for database access'));
      }

      // Initialize tenant database if not already connected
      if (!tenantDatabaseManager.getTenantConnection(tenantId)) {
        await tenantDatabaseManager.initializeTenantDatabase(tenantId);
      }

      // Get tenant-specific models
      const tenantModels = tenantDatabaseManager.getTenantModels(tenantId);
      
      // Attach tenant models to request
      req.tenantModels = tenantModels;
      req.tenantConnection = tenantDatabaseManager.getTenantConnection(tenantId);
      
      // Add tenant context to request
      req.tenantContext = {
        tenantId,
        databaseName: tenantDatabaseManager.getTenantDatabaseName(tenantId),
        models: tenantModels,
        connection: req.tenantConnection
      };

      console.log(`🔄 Switched to tenant database: ${tenantId}`);
      next();
    } catch (error) {
      console.error('❌ Failed to switch to tenant database:', error);
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
        return next(new Error('Tenant context required'));
      }

      // Check if tenant database is healthy
      const healthCheck = await tenantDatabaseManager.healthCheck(tenantId);
      
      if (!healthCheck.healthy) {
        // Try to reconnect
        await tenantDatabaseManager.initializeTenantDatabase(tenantId);
      }

      next();
    } catch (error) {
      console.error('❌ Tenant database health check failed:', error);
      next(error);
    }
  }

  /**
   * Middleware to inject tenant context into all database operations
   */
  static injectTenantContext(req, res, next) {
    const tenantId = req.tenantId || req.tenant?.id;
    
    if (!tenantId) {
      return next(new Error('Tenant context required'));
    }

    // Override common database operations to include tenant context
    const originalQuery = req.query;
    req.query = {
      ...originalQuery,
      tenantId: tenantId
    };

    // Add tenant filter to all database operations
    req.tenantFilter = { tenantId: tenantId };
    
    next();
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
}

module.exports = TenantContextMiddleware;
