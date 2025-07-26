const Tenant = require('../models/Tenant');
const { getTenantConfig, isTenantActive, getActiveTenantConfigs } = require('../config/tenants');

/**
 * Enhanced Tenant Identification Middleware
 * Identifies tenant from subdomain, path, header, or query parameter
 * Uses tenant configuration file for validation
 */
const identifyTenant = async (req, res, next) => {
  try {
    let tenant = null;
    let tenantSlug = null;
    let identificationMethod = null;

    // Method 1: Subdomain-based identification
    const hostname = req.hostname;
    if (hostname.includes('.')) {
      const subdomain = hostname.split('.')[0];
      if (subdomain !== 'www' && subdomain !== 'api' && subdomain !== 'localhost') {
        tenantSlug = subdomain;
        identificationMethod = 'subdomain';
      }
    }

    // Method 2: Path-based identification
    if (!tenantSlug && req.path.startsWith('/tenant/')) {
      const pathParts = req.path.split('/');
      tenantSlug = pathParts[2]; // /tenant/acme/...
      identificationMethod = 'path';
      // Remove tenant from path for route matching
      req.url = req.url.replace(`/tenant/${tenantSlug}`, '');
    }

    // Method 3: Header-based identification
    if (!tenantSlug) {
      const headerTenantId = req.headers['x-tenant-id'];
      const headerTenantSlug = req.headers['x-tenant-slug'];
      
      if (headerTenantId) {
        // Find tenant by ID in database
        const dbTenant = await Tenant.findById(headerTenantId);
        if (dbTenant) {
          tenantSlug = dbTenant.slug;
          identificationMethod = 'header-id';
        }
      } else if (headerTenantSlug) {
        tenantSlug = headerTenantSlug;
        identificationMethod = 'header-slug';
      }
    }

    // Method 4: Query parameter identification
    if (!tenantSlug) {
      const queryTenantSlug = req.query.tenant;
      if (queryTenantSlug) {
        tenantSlug = queryTenantSlug;
        identificationMethod = 'query';
      }
    }

    // Method 5: JWT token identification (for authenticated requests)
    if (!tenantSlug && req.user && req.user.tenantSlug) {
      tenantSlug = req.user.tenantSlug;
      identificationMethod = 'jwt';
    }

    // Validate tenant using configuration file
    if (tenantSlug) {
      // Check if tenant is active in configuration
      if (!isTenantActive(tenantSlug)) {
        return res.status(400).json({
          success: false,
          message: 'Tenant is not active or not configured',
          tenantSlug,
          availableTenants: Object.keys(getActiveTenantConfigs())
        });
      }

      // Get tenant configuration
      const tenantConfig = getTenantConfig(tenantSlug);
      
      // Get tenant from database (for additional data)
      const dbTenant = await Tenant.findOne({ 
        slug: tenantSlug, 
        status: 'active', 
        isDeleted: false 
      });

      // Create tenant object with config + database data
      tenant = {
        ...tenantConfig,
        _id: dbTenant?._id,
        dbData: dbTenant || null
      };
    }

    // Store tenant information in request
    req.tenant = tenant;
    req.tenantSlug = tenantSlug;
    req.tenantIdentificationMethod = identificationMethod;

    // Add tenant info to response headers for debugging
    if (tenant) {
      res.setHeader('X-Tenant-ID', tenant._id?.toString() || 'config-only');
      res.setHeader('X-Tenant-Slug', tenant.slug);
      res.setHeader('X-Tenant-Name', tenant.name);
      res.setHeader('X-Tenant-Status', tenant.status);
    }

    next();
  } catch (error) {
    console.error('Tenant identification error:', error);
    next(error);
  }
};

/**
 * Require tenant identification
 * Ensures a tenant is identified before proceeding
 */
const requireTenant = (req, res, next) => {
  if (!req.tenant) {
    return res.status(400).json({
      success: false,
      message: 'Tenant not identified. Please provide tenant information via subdomain, path, header, or query parameter.',
      availableMethods: [
        'Subdomain: https://tenant-slug.luxgen.com',
        'Path: https://luxgen.com/tenant/tenant-slug',
        'Header: X-Tenant-Slug: tenant-slug',
        'Query: ?tenant=tenant-slug'
      ],
      availableTenants: Object.keys(getActiveTenantConfigs())
    });
  }
  next();
};

/**
 * Optional tenant identification
 * Allows requests to proceed with or without tenant identification
 */
const optionalTenant = (req, res, next) => {
  // Always proceed, tenant may or may not be identified
  next();
};

/**
 * Feature gate middleware
 * Checks if tenant has specific feature enabled
 */
const requireFeature = (featureName) => {
  return (req, res, next) => {
    if (!req.tenant) {
      return res.status(400).json({
        success: false,
        message: 'Tenant not identified'
      });
    }

    if (!req.tenant.features || !req.tenant.features[featureName] || !req.tenant.features[featureName].enabled) {
      return res.status(403).json({
        success: false,
        message: `Feature '${featureName}' is not enabled for this tenant`,
        tenant: req.tenant.slug,
        availableFeatures: req.tenant.features ? Object.keys(req.tenant.features).filter(f => req.tenant.features[f].enabled) : []
      });
    }

    next();
  };
};

/**
 * Rate limiting middleware based on tenant configuration
 */
const tenantRateLimit = (req, res, next) => {
  if (!req.tenant) {
    return next();
  }

  const apiConfig = req.tenant.features?.apiAccess;
  if (!apiConfig || !apiConfig.enabled) {
    return res.status(403).json({
      success: false,
      message: 'API access is not enabled for this tenant'
    });
  }

  // TODO: Implement rate limiting logic based on apiConfig.rateLimit
  // For now, just proceed
  next();
};

module.exports = {
  identifyTenant,
  requireTenant,
  optionalTenant,
  requireFeature,
  tenantRateLimit
}; 