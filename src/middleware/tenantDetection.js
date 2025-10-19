/**
 * Tenant Detection Middleware
 * Automatically detects tenant based on subdomain and sets it in request
 */

const Tenant = require('../models/Tenant');

// Subdomain to tenant mapping
const SUBDOMAIN_MAPPING = {
  'demo': 'demo',
  'demo.luxgen.com': 'demo',
  'www.demo.luxgen.com': 'demo',
  'luxgen.com': 'luxgen',
  'www.luxgen.com': 'luxgen',
  'luxgen': 'luxgen'
};

// Default tenant fallback
const DEFAULT_TENANT = 'luxgen';

/**
 * Extract subdomain from hostname
 */
function extractSubdomain(hostname) {
  if (!hostname) return null;
  
  // Remove port if present
  const cleanHostname = hostname.split(':')[0];
  
  // Split by dots
  const parts = cleanHostname.split('.');
  
  // If we have more than 2 parts, the first part is likely the subdomain
  if (parts.length > 2) {
    return parts[0];
  }
  
  // If we have exactly 2 parts, check if it's a known domain
  if (parts.length === 2) {
    const domain = cleanHostname;
    if (SUBDOMAIN_MAPPING[domain]) {
      return SUBDOMAIN_MAPPING[domain];
    }
  }
  
  return null;
}

/**
 * Detect tenant from request
 */
function detectTenantFromRequest(req) {
  const hostname = req.get('host') || req.hostname;
  const origin = req.get('origin');
  const referer = req.get('referer');
  
  console.log('🔍 Tenant Detection Debug:');
  console.log('  Hostname:', hostname);
  console.log('  Origin:', origin);
  console.log('  Referer:', referer);
  
  // Try to extract from hostname first
  let subdomain = extractSubdomain(hostname);
  
  // If no subdomain from hostname, try origin
  if (!subdomain && origin) {
    try {
      const originUrl = new URL(origin);
      subdomain = extractSubdomain(originUrl.hostname);
    } catch (error) {
      console.log('  Origin parsing error:', error.message);
    }
  }
  
  // If still no subdomain, try referer
  if (!subdomain && referer) {
    try {
      const refererUrl = new URL(referer);
      subdomain = extractSubdomain(refererUrl.hostname);
    } catch (error) {
      console.log('  Referer parsing error:', error.message);
    }
  }
  
  // Map subdomain to tenant
  const tenantSlug = subdomain ? SUBDOMAIN_MAPPING[subdomain] : null;
  
  console.log('  Detected subdomain:', subdomain);
  console.log('  Mapped tenant:', tenantSlug);
  
  return tenantSlug || DEFAULT_TENANT;
}

/**
 * Tenant detection middleware
 */
const tenantDetection = async (req, res, next) => {
  try {
    // Detect tenant from request
    const tenantSlug = detectTenantFromRequest(req);
    
    // Find tenant in database
    let tenant = null;
    if (tenantSlug) {
      tenant = await Tenant.findOne({ slug: tenantSlug });
    }
    
    // If tenant not found, use default
    if (!tenant) {
      tenant = await Tenant.findOne({ slug: DEFAULT_TENANT });
      console.log('⚠️ Tenant not found, using default:', DEFAULT_TENANT);
    }
    
    // Set tenant in request
    req.tenant = tenant;
    req.tenantSlug = tenantSlug;
    req.tenantId = tenant ? tenant._id.toString() : null;
    
    console.log('✅ Tenant detected:', {
      slug: tenantSlug,
      tenantId: req.tenantId,
      name: tenant ? tenant.name : 'Unknown'
    });
    
    // Add tenant info to response headers for debugging
    res.set('X-Tenant-Slug', tenantSlug);
    res.set('X-Tenant-ID', req.tenantId);
    
    next();
  } catch (error) {
    console.error('❌ Tenant detection error:', error);
    
    // Fallback to default tenant
    try {
      const defaultTenant = await Tenant.findOne({ slug: DEFAULT_TENANT });
      req.tenant = defaultTenant;
      req.tenantSlug = DEFAULT_TENANT;
      req.tenantId = defaultTenant ? defaultTenant._id.toString() : null;
      
      console.log('🔄 Using fallback tenant:', DEFAULT_TENANT);
      next();
    } catch (fallbackError) {
      console.error('❌ Fallback tenant error:', fallbackError);
      res.status(500).json({
        success: false,
        error: 'Tenant detection failed',
        message: 'Unable to determine tenant'
      });
    }
  }
};

/**
 * Tenant validation middleware
 */
const validateTenant = (req, res, next) => {
  if (!req.tenant) {
    return res.status(400).json({
      success: false,
      error: 'Invalid tenant',
      message: 'Tenant not found or invalid'
    });
  }
  
  if (!req.tenant.isActive) {
    return res.status(403).json({
      success: false,
      error: 'Tenant inactive',
      message: 'This tenant is currently inactive'
    });
  }
  
  next();
};

/**
 * Get tenant info endpoint
 */
const getTenantInfo = (req, res) => {
  res.json({
    success: true,
    data: {
      tenant: {
        id: req.tenant._id,
        slug: req.tenant.slug,
        name: req.tenant.name,
        domain: req.tenant.domain,
        plan: req.tenant.plan,
        status: req.tenant.status,
        settings: req.tenant.settings
      },
      detected: {
        slug: req.tenantSlug,
        id: req.tenantId
      }
    }
  });
};

module.exports = {
  tenantDetection,
  validateTenant,
  getTenantInfo,
  detectTenantFromRequest,
  SUBDOMAIN_MAPPING,
  DEFAULT_TENANT
};
