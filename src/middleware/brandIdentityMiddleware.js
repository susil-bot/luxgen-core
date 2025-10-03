/**
 * Brand Identity Middleware
 * Applies brand identity configuration to requests
 */

const brandIdentityService = require('../services/BrandIdentityService');
const logger = require('../utils/logger');

/**
 * Middleware to load and apply brand identity to requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const brandIdentityMiddleware = async (req, res, next) => {
  try {
    // Get tenant ID from request (set by tenantMiddleware)
    const tenantId = req.tenantId || req.tenant?.slug || 'default';
    const brandId = req.query.brand || req.headers['x-brand-id'] || 'default';

    // Load brand identity
    const brandIdentity = await brandIdentityService.getBrandIdentity(tenantId, brandId);

    // Attach brand identity to request
    req.brandIdentity = brandIdentity;
    req.brandId = brandId;

    // Set response headers for brand identity
    res.set('X-Brand-ID', brandId);
    res.set('X-Tenant-ID', tenantId);

    // Add brand identity to response locals for template rendering
    res.locals.brandIdentity = brandIdentity;
    res.locals.brandId = brandId;
    res.locals.tenantId = tenantId;

    logger.debug(`Brand identity applied for tenant: ${tenantId}, brand: ${brandId}`);
    next();
  } catch (error) {
    logger.error('Failed to apply brand identity middleware', error);
    
    // Continue without brand identity if loading fails
    req.brandIdentity = null;
    req.brandId = 'default';
    res.locals.brandIdentity = null;
    res.locals.brandId = 'default';
    
    next();
  }
};

/**
 * Middleware to generate and serve CSS variables
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const brandCSSMiddleware = async (req, res, next) => {
  try {
    if (req.path === '/brand-identity.css' || req.path.endsWith('/brand-identity.css')) {
      const tenantId = req.tenantId || req.tenant?.slug || 'default';
      const brandId = req.query.brand || req.headers['x-brand-id'] || 'default';

      const brandIdentity = await brandIdentityService.getBrandIdentity(tenantId, brandId);
      const cssVariables = brandIdentityService.generateCSSVariables(brandIdentity);

      res.set('Content-Type', 'text/css');
      res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(cssVariables);
      return;
    }
    
    next();
  } catch (error) {
    logger.error('Failed to generate brand CSS', error);
    next();
  }
};

/**
 * Middleware to serve brand assets
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const brandAssetsMiddleware = async (req, res, next) => {
  try {
    if (req.path.startsWith('/brand-identity/')) {
      const pathParts = req.path.split('/').filter(Boolean);
      
      if (pathParts.length >= 4 && pathParts[0] === 'brand-identity' && pathParts[1] === 'brand') {
        const brandId = pathParts[2];
        const assetPath = pathParts.slice(3).join('/');
        
        const tenantId = req.tenantId || req.tenant?.slug || 'default';
        const brandIdentityPath = require('path').join(__dirname, '../brand-identity/brand', brandId, 'assets', assetPath);
        
        // Check if file exists
        const fs = require('fs');
        if (fs.existsSync(brandIdentityPath)) {
          res.sendFile(brandIdentityPath);
          return;
        }
      }
    }
    
    next();
  } catch (error) {
    logger.error('Failed to serve brand asset', error);
    next();
  }
};

/**
 * Middleware to validate brand identity requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const validateBrandRequest = (req, res, next) => {
  const { brandId } = req.params;
  
  if (brandId && !/^[a-zA-Z0-9-_]+$/.test(brandId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid brand ID format. Only alphanumeric characters, hyphens, and underscores are allowed.'
    });
  }
  
  next();
};

/**
 * Middleware to require brand identity
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireBrandIdentity = (req, res, next) => {
  if (!req.brandIdentity) {
    return res.status(404).json({
      success: false,
      message: 'Brand identity not found'
    });
  }
  
  next();
};

module.exports = {
  brandIdentityMiddleware,
  brandCSSMiddleware,
  brandAssetsMiddleware,
  validateBrandRequest,
  requireBrandIdentity
};
