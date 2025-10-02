/**
 * Robust Tenant Middleware
 * Handles tenant identification, validation, and context injection
 */

const tenantConfigurationManager = require('../services/TenantConfigurationManager');
const logger = require('../utils/logger');

class TenantMiddleware {
  /**
   * Identify tenant from request
   */
  static identifyTenant () {
    return async (req, res, next) => {
      try {
        let tenantSlug = null;

        // 1. Check subdomain
        const hostname = req.get('host') || req.hostname;
        if (hostname) {
          const subdomain = hostname.split('.')[0];
          if (subdomain && subdomain !== 'www' && subdomain !== 'app' && subdomain !== 'localhost') {
            tenantSlug = subdomain;
          }
        }

        // 2. Check custom header
        if (!tenantSlug) {
          tenantSlug = req.get('x-tenant-id') || req.get('x-tenant-slug');
        }

        // 3. Check query parameter
        if (!tenantSlug) {
          tenantSlug = req.query.tenant || req.query.tenantId;
        }

        // 4. Check JWT token
        if (!tenantSlug && req.user) {
          tenantSlug = req.user.tenantId || req.user.tenantSlug;
        }

        // 5. Default tenant fallback
        if (!tenantSlug) {
          tenantSlug = 'default';
        }

        // Validate tenant exists
        const tenantConfig = await tenantConfigurationManager.getTenantConfig(tenantSlug);

        // Inject tenant context into request
        req.tenant = {
          slug: tenantSlug,
          config: tenantConfig,
          id: tenantConfig.id,
          name: tenantConfig.name,
          domain: tenantConfig.domain
        };

        logger.debug(`Tenant identified: ${tenantSlug}`);
        next();
      } catch (error) {
        logger.error('Tenant identification failed:', error);
        res.status(400).json({
          success: false,
          message: 'Invalid tenant',
          error: error.message
        });
      }
    };
  }

  /**
   * Validate tenant access
   */
  static validateTenantAccess () {
    return async (req, res, next) => {
      try {
        if (!req.tenant) {
          return res.status(400).json({
            success: false,
            message: 'Tenant context not found'
          });
        }

        // Check if tenant is active
        if (req.tenant.config.status !== 'active') {
          return res.status(403).json({
            success: false,
            message: 'Tenant is not active',
            tenant: req.tenant.slug
          });
        }

        // Check tenant limits
        const { limits } = req.tenant.config;
        if (limits) {
          // This would typically check against actual usage
          // For now, we'll just log the check
          logger.debug(`Checking limits for tenant: ${req.tenant.slug}`);
        }

        next();
      } catch (error) {
        logger.error('Tenant access validation failed:', error);
        res.status(500).json({
          success: false,
          message: 'Tenant validation error',
          error: error.message
        });
      }
    };
  }

  /**
   * Apply tenant-specific configurations
   */
  static applyTenantConfig () {
    return async (req, res, next) => {
      try {
        if (!req.tenant) {
          return next();
        }

        // Apply tenant-specific settings
        const tenantConfig = req.tenant.config;

        // Set response headers
        res.set('X-Tenant-ID', req.tenant.slug);
        res.set('X-Tenant-Name', req.tenant.name);

        // Apply tenant branding to response
        if (tenantConfig.branding) {
          res.locals.tenantBranding = tenantConfig.branding;
        }

        // Apply tenant features
        if (tenantConfig.features) {
          res.locals.tenantFeatures = tenantConfig.features;
        }

        // Apply tenant security settings
        if (tenantConfig.security) {
          res.locals.tenantSecurity = tenantConfig.security;
        }

        // Apply tenant limits
        if (tenantConfig.limits) {
          res.locals.tenantLimits = tenantConfig.limits;
        }

        next();
      } catch (error) {
        logger.error('Failed to apply tenant configuration:', error);
        next(); // Continue even if config application fails
      }
    };
  }

  /**
   * Transform response based on tenant configuration
   */
  static transformResponse () {
    return async (req, res, next) => {
      try {
        if (!req.tenant) {
          return next();
        }

        // Store original json method
        const originalJson = res.json;

        // Override json method to transform response
        res.json = function (data) {
          try {
            // Transform data based on tenant configuration
            const transformedData = tenantConfigurationManager.transformComponent(
              data,
              req.tenant.config,
              'component.features'
            );

            // Apply tenant branding
            if (req.tenant.config.branding && transformedData) {
              transformedData.tenantBranding = req.tenant.config.branding;
            }

            return originalJson.call(this, transformedData);
          } catch (error) {
            logger.error('Response transformation failed:', error);
            return originalJson.call(this, data);
          }
        };

        next();
      } catch (error) {
        logger.error('Response transformation setup failed:', error);
        next();
      }
    };
  }

  /**
   * Audit tenant actions
   */
  static auditTenantActions () {
    return async (req, res, next) => {
      try {
        if (!req.tenant) {
          return next();
        }

        // Store original end method
        const originalEnd = res.end;

        // Override end method to log audit
        res.end = function (chunk, encoding) {
          try {
            // Log audit information
            const auditData = {
              tenant: req.tenant.slug,
              method: req.method,
              url: req.originalUrl,
              user: req.user?.id || 'anonymous',
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              statusCode: res.statusCode,
              timestamp: new Date().toISOString()
            };

            logger.info('Tenant action audit:', auditData);

            // This would typically save to audit log database
            // await auditService.logAction(auditData);
          } catch (error) {
            logger.error('Audit logging failed:', error);
          }

          return originalEnd.call(this, chunk, encoding);
        };

        next();
      } catch (error) {
        logger.error('Audit setup failed:', error);
        next();
      }
    };
  }

  /**
   * Handle tenant-specific errors
   */
  static handleTenantErrors () {
    return (error, req, res, next) => {
      try {
        if (req.tenant) {
          // Apply tenant-specific error handling
          const tenantConfig = req.tenant.config;

          // Check if tenant has custom error handling
          if (tenantConfig.settings?.errorHandling) {
            const errorConfig = tenantConfig.settings.errorHandling;

            // Apply tenant-specific error messages
            if (errorConfig.customMessages) {
              error.message = errorConfig.customMessages[error.name] || error.message;
            }

            // Apply tenant-specific error codes
            if (errorConfig.customCodes) {
              error.statusCode = errorConfig.customCodes[error.name] || error.statusCode;
            }
          }

          // Add tenant context to error
          error.tenant = req.tenant.slug;
        }

        next(error);
      } catch (err) {
        logger.error('Tenant error handling failed:', err);
        next(error);
      }
    };
  }

  /**
   * Get tenant health status
   */
  static async getTenantHealth (req, res) {
    try {
      const tenantSlug = req.params.tenantSlug || req.tenant?.slug;

      if (!tenantSlug) {
        return res.status(400).json({
          success: false,
          message: 'Tenant slug required'
        });
      }

      const health = await tenantConfigurationManager.getTenantHealth(tenantSlug);

      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      logger.error('Failed to get tenant health:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get tenant health',
        error: error.message
      });
    }
  }

  /**
   * Get all tenant configurations
   */
  static async getAllTenantConfigs (req, res) {
    try {
      const configs = tenantConfigurationManager.getAllTenantConfigs();

      res.json({
        success: true,
        data: configs,
        count: configs.length
      });
    } catch (error) {
      logger.error('Failed to get tenant configurations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get tenant configurations',
        error: error.message
      });
    }
  }
}

module.exports = TenantMiddleware;
