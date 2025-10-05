/**
 * LUXGEN TENANT MIDDLEWARE
 * Comprehensive tenant identification and context management
 */

const tenantManagementService = require('../services/TenantManagementService');
const { AuthenticationError, AuthorizationError } = require('../utils/errors');

class TenantMiddleware {
  /**
   * IDENTIFY TENANT FROM REQUEST
   * Supports multiple identification methods:
   * 1. Subdomain (tenant.luxgen.com)
   * 2. Custom domain (company.com)
   * 3. Header (x-tenant-id)
   * 4. Query parameter (?tenant=slug)
   */
  static identifyTenant() {
    return async (req, res, next) => {
      try {
        let tenantId = null;
        let tenantSlug = null;

        // 1. Check subdomain
        const hostname = req.get('host') || req.hostname;
        if (hostname && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
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
          tenantSlug = req.query.tenant;
        }

        // 4. Check custom domain
        if (!tenantSlug && hostname) {
          // Look up tenant by custom domain
          const tenant = await tenantManagementService.getTenantByDomain(hostname);
          if (tenant) {
            tenantId = tenant._id;
            tenantSlug = tenant.slug;
          }
        }

        // If no tenant identified, use default
        if (!tenantSlug && !tenantId) {
          tenantSlug = 'luxgen'; // Use luxgen as default tenant
        }

        // Get tenant information
        if (tenantSlug) {
          try {
            const tenant = await tenantManagementService.getTenant(tenantSlug);
            if (tenant) {
              tenantId = tenant._id;
              req.tenantId = tenantId;
              req.tenantSlug = tenantSlug;
              req.tenant = tenant;
            }
          } catch (error) {
            console.log('⚠️ Tenant not found, using default configuration');
            // Use default tenant configuration
            req.tenantId = 'default';
            req.tenantSlug = 'luxgen';
            req.tenant = {
              _id: 'default',
              slug: 'luxgen',
              name: 'LuxGen Technologies'
            };
          }
        } else {
          // Use default tenant configuration
          req.tenantId = 'default';
          req.tenantSlug = 'luxgen';
          req.tenant = {
            _id: 'default',
            slug: 'luxgen',
            name: 'LuxGen Technologies'
          };
        }

        // Validate tenant access if user is authenticated
        if (req.user && tenantId) {
          const accessValidation = await tenantManagementService.validateTenantAccess(tenantId, req.user.id);
          if (!accessValidation.success) {
            throw new AuthorizationError('User does not have access to this tenant');
          }
        }

        next();
      } catch (error) {
        console.error('❌ Tenant identification error:', error);
        return next(new AuthenticationError('Tenant identification failed'));
      }
    };
  }

  /**
   * ENSURE TENANT CONTEXT
   * Ensures tenant context is available for all requests
   */
  static ensureTenantContext() {
    return (req, res, next) => {
      if (!req.tenantId) {
        return next(new AuthenticationError('Tenant context required'));
      }
      next();
    };
  }

  /**
   * TENANT ISOLATION MIDDLEWARE
   * Ensures all database queries are tenant-scoped
   */
  static enforceTenantIsolation() {
    return (req, res, next) => {
      if (!req.tenantId) {
        return next(new AuthenticationError('Tenant context required for data access'));
      }

      // Add tenant filter to all database queries
      req.tenantFilter = { tenantId: req.tenantId };
      
      // Override common query methods to include tenant filter
      const originalQuery = req.query;
      req.query = {
        ...originalQuery,
        tenantId: req.tenantId
      };

      next();
    };
  }

  /**
   * TENANT FEATURE ACCESS CONTROL
   * Controls access to tenant-specific features
   */
  static checkFeatureAccess(feature) {
    return (req, res, next) => {
      if (!req.tenant) {
        return next(new AuthenticationError('Tenant context required'));
      }

      const tenantFeatures = req.tenant.features;
      if (!tenantFeatures[feature] || !tenantFeatures[feature].enabled) {
        return next(new AuthorizationError(`Feature '${feature}' is not available for this tenant`));
      }

      next();
    };
  }

  /**
   * TENANT USAGE LIMITS
   * Enforces tenant usage limits
   */
  static enforceUsageLimits(resource) {
    return async (req, res, next) => {
      try {
        if (!req.tenant) {
          return next(new AuthenticationError('Tenant context required'));
        }

        const tenant = req.tenant;
        const limits = tenant.limits;
        const usage = tenant.usage;

        // Check specific resource limits
        switch (resource) {
          case 'users':
            if (usage.currentUsers >= limits.maxUsers) {
              return next(new AuthorizationError('User limit exceeded for this tenant'));
            }
            break;

          case 'storage':
            if (usage.currentStorageGB >= limits.maxStorageGB) {
              return next(new AuthorizationError('Storage limit exceeded for this tenant'));
            }
            break;

          case 'polls':
            if (usage.currentPolls >= limits.maxPolls) {
              return next(new AuthorizationError('Poll limit exceeded for this tenant'));
            }
            break;

          case 'apiCalls':
            if (usage.apiCallsThisMonth >= limits.maxApiCalls) {
              return next(new AuthorizationError('API call limit exceeded for this tenant'));
            }
            break;

          default:
            break;
        }

        next();
      } catch (error) {
        console.error('❌ Usage limits enforcement error:', error);
        return next(new AuthorizationError('Usage limits validation failed'));
      }
    };
  }

  /**
   * TENANT BRANDING MIDDLEWARE
   * Injects tenant branding into response
   */
  static injectTenantBranding() {
    return async (req, res, next) => {
      try {
        if (!req.tenantId) {
          return next();
        }

        const branding = await tenantManagementService.getTenantBranding(req.tenantId);
        
        // Add branding to response locals
        res.locals.tenantBranding = branding;
        
        // Add branding headers
        res.set('X-Tenant-Branding', JSON.stringify(branding));
        
        next();
      } catch (error) {
        console.error('❌ Tenant branding injection error:', error);
        // Don't fail the request for branding issues
        next();
      }
    };
  }

  /**
   * TENANT ANALYTICS MIDDLEWARE
   * Tracks tenant usage and analytics
   */
  static trackTenantUsage() {
    return async (req, res, next) => {
      try {
        if (!req.tenantId) {
          return next();
        }

        // Track API calls
        await tenantManagementService.incrementApiCalls(req.tenantId);

        // Track user activity
        if (req.user) {
          await tenantManagementService.trackUserActivity(req.tenantId, req.user.id, {
            endpoint: req.path,
            method: req.method,
            timestamp: new Date()
          });
        }

        next();
      } catch (error) {
        console.error('❌ Tenant analytics tracking error:', error);
        // Don't fail the request for analytics issues
        next();
      }
    };
  }

  /**
   * TENANT SECURITY MIDDLEWARE
   * Enforces tenant-specific security policies
   */
  static enforceTenantSecurity() {
    return (req, res, next) => {
      if (!req.tenant) {
        return next(new AuthenticationError('Tenant context required'));
      }

      const security = req.tenant.security;

      // Check IP whitelist if configured
      if (security.ipWhitelist && security.ipWhitelist.length > 0) {
        const clientIP = req.ip || req.connection.remoteAddress;
        if (!security.ipWhitelist.includes(clientIP)) {
          return next(new AuthorizationError('IP address not allowed for this tenant'));
        }
      }

      // Check IP blacklist if configured
      if (security.ipBlacklist && security.ipBlacklist.length > 0) {
        const clientIP = req.ip || req.connection.remoteAddress;
        if (security.ipBlacklist.includes(clientIP)) {
          return next(new AuthorizationError('IP address blocked for this tenant'));
        }
      }

      next();
    };
  }

  /**
   * TENANT RATE LIMITING
   * Implements tenant-specific rate limiting
   */
  static tenantRateLimit() {
    return (req, res, next) => {
      if (!req.tenant) {
        return next(new AuthenticationError('Tenant context required'));
      }

      const limits = req.tenant.limits;
      const usage = req.tenant.usage;

      // Check API call limits
      if (usage.apiCallsThisMonth >= limits.maxApiCalls) {
        return next(new AuthorizationError('API rate limit exceeded for this tenant'));
      }

      next();
    };
  }

  /**
   * TENANT HEALTH CHECK
   * Checks tenant health and status
   */
  static checkTenantHealth() {
    return async (req, res, next) => {
      try {
        if (!req.tenant) {
          return next(new AuthenticationError('Tenant context required'));
        }

        const tenant = req.tenant;

        // Check if tenant is active
        if (!tenant.isActive) {
          return next(new AuthorizationError('Tenant is not active'));
        }

        // Check if tenant is deleted
        if (tenant.isDeleted) {
          return next(new AuthorizationError('Tenant has been deleted'));
        }

        // Check subscription status
        if (tenant.subscription.status === 'expired') {
          return next(new AuthorizationError('Tenant subscription has expired'));
        }

        // Check if tenant is suspended
        if (tenant.subscription.status === 'suspended') {
          return next(new AuthorizationError('Tenant has been suspended'));
        }

        next();
      } catch (error) {
        console.error('❌ Tenant health check error:', error);
        return next(new AuthenticationError('Tenant health check failed'));
      }
    };
  }
}

module.exports = TenantMiddleware;