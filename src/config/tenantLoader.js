/**
 * Dynamic Tenant Loader
 * Loads tenant configurations from the src/tenants directory structure
 */

const fs = require('fs');
const path = require('path');

/**
 * Load all tenant configurations from the tenants directory
 * @returns {Object} Object containing all tenant configurations
 */
function loadAllTenants() {
  const tenantsDir = path.join(__dirname, '..', 'tenants');
  const tenants = {};

  try {
    // Check if tenants directory exists
    if (!fs.existsSync(tenantsDir)) {
      console.warn('Tenants directory not found:', tenantsDir);
      return tenants;
    }

    // Read all tenant directories
    const tenantDirs = fs.readdirSync(tenantsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    // Load each tenant configuration
    tenantDirs.forEach(tenantDir => {
      try {
        const configPath = path.join(tenantsDir, tenantDir, 'config.js');
        
        if (fs.existsSync(configPath)) {
          const tenantConfig = require(configPath);
          
          // Validate the configuration
          if (validateTenantConfig(tenantConfig)) {
            tenants[tenantConfig.slug] = tenantConfig;
            console.log(`✅ Loaded tenant: ${tenantConfig.name} (${tenantConfig.slug})`);
          } else {
            console.error(`❌ Invalid configuration for tenant: ${tenantDir}`);
          }
        } else {
          console.warn(`⚠️  No config.js found for tenant: ${tenantDir}`);
        }
      } catch (error) {
        console.error(`❌ Error loading tenant ${tenantDir}:`, error.message);
      }
    });

    console.log(`📊 Loaded ${Object.keys(tenants).length} tenant(s)`);
    return tenants;

  } catch (error) {
    console.error('❌ Error loading tenants:', error.message);
    return tenants;
  }
}

/**
 * Load a specific tenant configuration
 * @param {string} tenantSlug - The tenant slug to load
 * @returns {Object|null} Tenant configuration or null if not found
 */
function loadTenant(tenantSlug) {
  const tenantsDir = path.join(__dirname, '..', 'tenants');
  const tenantDir = path.join(tenantsDir, tenantSlug);
  const configPath = path.join(tenantDir, 'config.js');

  try {
    if (fs.existsSync(configPath)) {
      const tenantConfig = require(configPath);
      
      if (validateTenantConfig(tenantConfig)) {
        return tenantConfig;
      } else {
        console.error(`❌ Invalid configuration for tenant: ${tenantSlug}`);
        return null;
      }
    } else {
      console.warn(`⚠️  Tenant not found: ${tenantSlug}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error loading tenant ${tenantSlug}:`, error.message);
    return null;
  }
}

/**
 * Get tenant branding assets
 * @param {string} tenantSlug - The tenant slug
 * @param {string} assetType - Type of asset (logo, css, favicon)
 * @returns {string|null} Path to the asset or null if not found
 */
function getTenantAsset(tenantSlug, assetType) {
  const tenantsDir = path.join(__dirname, '..', 'tenants');
  const brandingDir = path.join(tenantsDir, tenantSlug, 'branding');
  
  const assetMap = {
    logo: 'logo.png',
    favicon: 'favicon.ico',
    css: 'custom.css'
  };

  const assetFile = assetMap[assetType];
  if (!assetFile) {
    console.warn(`⚠️  Unknown asset type: ${assetType}`);
    return null;
  }

  const assetPath = path.join(brandingDir, assetFile);
  
  if (fs.existsSync(assetPath)) {
    return assetPath;
  } else {
    console.warn(`⚠️  Asset not found: ${assetPath}`);
    return null;
  }
}

/**
 * Get all available tenant slugs
 * @returns {Array} Array of tenant slugs
 */
function getAvailableTenants() {
  const tenantsDir = path.join(__dirname, '..', 'tenants');
  
  try {
    if (!fs.existsSync(tenantsDir)) {
      return [];
    }

    return fs.readdirSync(tenantsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
  } catch (error) {
    console.error('❌ Error getting available tenants:', error.message);
    return [];
  }
}

/**
 * Validate tenant configuration
 * @param {Object} config - Tenant configuration to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateTenantConfig(config) {
  const requiredFields = ['name', 'slug', 'status'];
  
  for (const field of requiredFields) {
    if (!config[field]) {
      console.error(`❌ Missing required field: ${field}`);
      return false;
    }
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(config.slug)) {
    console.error(`❌ Invalid slug format: ${config.slug}`);
    return false;
  }

  // Validate status
  const validStatuses = ['active', 'inactive', 'pending', 'suspended'];
  if (!validStatuses.includes(config.status)) {
    console.error(`❌ Invalid status: ${config.status}`);
    return false;
  }

  return true;
}

/**
 * Watch for tenant configuration changes
 * @param {Function} callback - Callback function to execute when changes detected
 */
function watchTenants(callback) {
  const tenantsDir = path.join(__dirname, '..', 'tenants');
  
  if (!fs.existsSync(tenantsDir)) {
    console.warn('Tenants directory not found for watching');
    return;
  }

  console.log('👀 Watching for tenant configuration changes...');
  
  fs.watch(tenantsDir, { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith('config.js')) {
      console.log(`🔄 Tenant configuration changed: ${filename}`);
      if (typeof callback === 'function') {
        callback();
      }
    }
  });
}

/**
 * Get tenant directory structure
 * @param {string} tenantSlug - The tenant slug
 * @returns {Object} Directory structure information
 */
function getTenantStructure(tenantSlug) {
  const tenantsDir = path.join(__dirname, '..', 'tenants');
  const tenantDir = path.join(tenantsDir, tenantSlug);
  
  if (!fs.existsSync(tenantDir)) {
    return null;
  }

  const structure = {
    slug: tenantSlug,
    path: tenantDir,
    exists: true,
    files: {},
    directories: {}
  };

  try {
    const items = fs.readdirSync(tenantDir, { withFileTypes: true });
    
    items.forEach(item => {
      const itemPath = path.join(tenantDir, item.name);
      
      if (item.isDirectory()) {
        structure.directories[item.name] = {
          path: itemPath,
          files: fs.readdirSync(itemPath).filter(file => 
            fs.statSync(path.join(itemPath, file)).isFile()
          )
        };
      } else {
        structure.files[item.name] = {
          path: itemPath,
          size: fs.statSync(itemPath).size
        };
      }
    });

    return structure;
  } catch (error) {
    console.error(`❌ Error reading tenant structure for ${tenantSlug}:`, error.message);
    return null;
  }
}

module.exports = {
  loadAllTenants,
  loadTenant,
  getTenantAsset,
  getAvailableTenants,
  validateTenantConfig,
  watchTenants,
  getTenantStructure
}; 