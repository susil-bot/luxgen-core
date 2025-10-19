/**
 * Tenant Resolution from Subdomain
 * Extracts tenant information from request hostname
 */

const clientPromise = require('./mongodb');

/**
 * Extract subdomain from hostname
 * @param {string} hostname - The hostname from request
 * @returns {string|null} - The subdomain or null
 */
function extractSubdomain(hostname) {
  if (!hostname) return null;
  
  // Remove port if present (localhost:3000 -> localhost)
  const cleanHostname = hostname.split(':')[0];
  
  // Split by dots
  const parts = cleanHostname.split('.');
  
  // For localhost development
  if (cleanHostname === 'localhost') {
    return 'luxgen'; // Default tenant for localhost
  }
  
  // For production domains with subdomains
  if (parts.length > 2) {
    // demo.luxgen.com -> demo
    return parts[0];
  }
  
  // For main domain (luxgen.com)
  if (parts.length === 2) {
    return 'luxgen'; // Default tenant for main domain
  }
  
  return null;
}

/**
 * Resolve tenant from request hostname
 * @param {Object} req - Express request object
 * @returns {Promise<string>} - The tenant ID
 */
async function resolveTenantFromHost(req) {
  try {
    const host = req.get('host') || req.hostname || '';
    console.log('🔍 Resolving tenant from host:', host);
    
    // Extract subdomain from hostname
    const subdomain = extractSubdomain(host);
    console.log('🔍 Extracted subdomain:', subdomain);
    
    // Optional: ignore 'www' or main app
    if (subdomain === 'www' || subdomain === 'luxgen') {
      return 'luxgen'; // fallback tenant
    }
    
    // Get MongoDB client
    const client = await clientPromise;
    const db = client.db('luxgen'); // shared DB for all tenants
    
    // Find tenant in database by subdomain
    const tenant = await db.collection('tenants').findOne({ subdomain });
    
    if (!tenant) {
      console.warn(`⚠️ Unknown tenant subdomain: ${subdomain}, using default`);
      // Return default tenant
      const defaultTenant = await db.collection('tenants').findOne({ subdomain: 'luxgen' });
      if (defaultTenant) {
        return defaultTenant.tenantId;
      }
      throw new Error(`Unknown tenant: ${subdomain}`);
    }
    
    console.log(`✅ Tenant resolved: ${tenant.name} (${tenant.tenantId})`);
    return tenant.tenantId;
    
  } catch (error) {
    console.error('❌ Tenant resolution error:', error);
    throw error;
  }
}

/**
 * Get tenant information by tenant ID
 * @param {string} tenantId - The tenant ID
 * @returns {Promise<Object>} - The tenant object
 */
async function getTenantById(tenantId) {
  try {
    const client = await clientPromise;
    const db = client.db('luxgen');
    
    const tenant = await db.collection('tenants').findOne({ tenantId });
    
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }
    
    return tenant;
  } catch (error) {
    console.error('❌ Get tenant error:', error);
    throw error;
  }
}

/**
 * Get all tenants (admin only)
 * @returns {Promise<Array>} - Array of all tenants
 */
async function getAllTenants() {
  try {
    const client = await clientPromise;
    const db = client.db('luxgen');
    
    const tenants = await db.collection('tenants').find({}).toArray();
    return tenants;
  } catch (error) {
    console.error('❌ Get all tenants error:', error);
    throw error;
  }
}

/**
 * Create a new tenant
 * @param {Object} tenantData - The tenant data
 * @returns {Promise<Object>} - The created tenant
 */
async function createTenant(tenantData) {
  try {
    const client = await clientPromise;
    const db = client.db('luxgen');
    
    const tenant = {
      tenantId: tenantData.tenantId || generateTenantId(),
      name: tenantData.name,
      subdomain: tenantData.subdomain,
      plan: tenantData.plan || 'free',
      status: tenantData.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('tenants').insertOne(tenant);
    
    if (result.insertedId) {
      console.log(`✅ Tenant created: ${tenant.name} (${tenant.tenantId})`);
      return tenant;
    } else {
      throw new Error('Failed to create tenant');
    }
  } catch (error) {
    console.error('❌ Create tenant error:', error);
    throw error;
  }
}

/**
 * Generate a unique tenant ID
 * @returns {string} - A unique tenant ID
 */
function generateTenantId() {
  return 'tenant_' + Math.random().toString(36).substr(2, 9);
}

module.exports = {
  resolveTenantFromHost,
  getTenantById,
  getAllTenants,
  createTenant,
  extractSubdomain
};
