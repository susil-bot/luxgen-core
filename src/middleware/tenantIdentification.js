const { getCollection } = require('../config/mongodb');
const logger = require('../utils/logger');

/**
 * Require tenant identification
 * Ensures a tenant is identified before proceeding
 */
const requireTenantIdentification = async (req, res, next) => {
  try {
    // Check if tenant is already identified
    if (req.tenantId) {
      return next();
    }

    // Get tenant from subdomain
    const subdomain = req.get('host').split('.')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
      const tenantsCollection = getCollection('tenants');
      const tenant = await tenantsCollection.findOne({ subdomain });
      
      if (tenant) {
        req.tenantId = tenant._id;
        req.tenant = tenant;
        return next();
      }
    }

    // Get tenant from header
    const tenantHeader = req.get('X-Tenant-ID');
    if (tenantHeader) {
      const tenantsCollection = getCollection('tenants');
      const tenant = await tenantsCollection.findOne({ _id: tenantHeader });
      
      if (tenant) {
        req.tenantId = tenant._id;
        req.tenant = tenant;
        return next();
      }
    }

    // Get tenant from user's JWT token
    if (req.user && req.user.tenantId) {
      const tenantsCollection = getCollection('tenants');
      const tenant = await tenantsCollection.findOne({ _id: req.user.tenantId });
      
      if (tenant) {
        req.tenantId = tenant._id;
        req.tenant = tenant;
        return next();
      }
    }

    // No tenant identified
    return res.status(400).json({
      success: false,
      message: 'Tenant identification required'
    });
  } catch (error) {
    logger.error('Error in tenant identification middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Optional tenant identification
 * Identifies tenant if available, but doesn't require it
 */
const optionalTenantIdentification = async (req, res, next) => {
  try {
    // Check if tenant is already identified
    if (req.tenantId) {
      return next();
    }

    // Get tenant from subdomain
    const subdomain = req.get('host').split('.')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
      const tenantsCollection = getCollection('tenants');
      const tenant = await tenantsCollection.findOne({ subdomain });
      
      if (tenant) {
        req.tenantId = tenant._id;
        req.tenant = tenant;
        return next();
      }
    }

    // Get tenant from header
    const tenantHeader = req.get('X-Tenant-ID');
    if (tenantHeader) {
      const tenantsCollection = getCollection('tenants');
      const tenant = await tenantsCollection.findOne({ _id: tenantHeader });
      
      if (tenant) {
        req.tenantId = tenant._id;
        req.tenant = tenant;
        return next();
      }
    }

    // Get tenant from user's JWT token
    if (req.user && req.user.tenantId) {
      const tenantsCollection = getCollection('tenants');
      const tenant = await tenantsCollection.findOne({ _id: req.user.tenantId });
      
      if (tenant) {
        req.tenantId = tenant._id;
        req.tenant = tenant;
        return next();
      }
    }

    // No tenant identified, but that's okay
    next();
  } catch (error) {
    logger.error('Error in optional tenant identification middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  requireTenantIdentification,
  optionalTenantIdentification
};