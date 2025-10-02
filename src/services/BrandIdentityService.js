/**
 * Brand Identity Service
 * Manages brand identity configurations for multi-tenant architecture
 */

const fs = require('fs').promises;
const path = require('path');
const Joi = require('joi');
const brandIdentitySchema = require('../brand-identity/schema');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

class BrandIdentityService {
  constructor() {
    this.brandIdentityPath = path.join(__dirname, '../brand-identity');
    this.cache = cache;
    this.cacheTTL = 10 * 60 * 1000; // 10 minutes
  }

  /**
   * Get brand identity configuration for a tenant
   * @param {string} tenantId - The tenant identifier
   * @param {string} brandId - The brand identifier (defaults to 'default')
   * @returns {Promise<Object>} Brand identity configuration
   */
  async getBrandIdentity(tenantId, brandId = 'default') {
    const cacheKey = `brand-identity:${tenantId}:${brandId}`;
    
    try {
      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (cached) {
        logger.debug(`Brand identity cache hit for tenant: ${tenantId}, brand: ${brandId}`);
        return cached;
      }

      // Load brand identity from file system
      const brandPath = path.join(this.brandIdentityPath, 'brand', brandId);
      const brandIdentityFile = path.join(brandPath, 'brand-identity.json');
      
      let brandIdentity;
      try {
        const brandData = await fs.readFile(brandIdentityFile, 'utf8');
        brandIdentity = JSON.parse(brandData);
      } catch (error) {
        logger.warn(`Brand identity file not found for brand: ${brandId}, using default`);
        // Fallback to default brand
        const defaultBrandFile = path.join(this.brandIdentityPath, 'brand', 'default', 'brand-identity.json');
        const defaultBrandData = await fs.readFile(defaultBrandFile, 'utf8');
        brandIdentity = JSON.parse(defaultBrandData);
      }

      // Validate brand identity against schema
      const { error, value } = brandIdentitySchema.validate(brandIdentity);
      if (error) {
        logger.error(`Brand identity validation failed for tenant: ${tenantId}, brand: ${brandId}`, error.details);
        throw new Error(`Invalid brand identity configuration: ${error.details.map(d => d.message).join(', ')}`);
      }

      // Cache the validated brand identity
      this.cache.set(cacheKey, value, this.cacheTTL);
      
      logger.info(`Brand identity loaded for tenant: ${tenantId}, brand: ${brandId}`);
      return value;
    } catch (error) {
      logger.error(`Failed to load brand identity for tenant: ${tenantId}, brand: ${brandId}`, error);
      throw error;
    }
  }

  /**
   * Get available brand identities for a tenant
   * @param {string} tenantId - The tenant identifier
   * @returns {Promise<Array>} List of available brand identities
   */
  async getAvailableBrands(tenantId) {
    const cacheKey = `available-brands:${tenantId}`;
    
    try {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const brandPath = path.join(this.brandIdentityPath, 'brand');
      const brands = await fs.readdir(brandPath);
      
      const availableBrands = brands.filter(async (brand) => {
        const brandDir = path.join(brandPath, brand);
        const stat = await fs.stat(brandDir);
        return stat.isDirectory();
      });

      this.cache.set(cacheKey, availableBrands, this.cacheTTL);
      return availableBrands;
    } catch (error) {
      logger.error(`Failed to get available brands for tenant: ${tenantId}`, error);
      return ['default'];
    }
  }

  /**
   * Create a new brand identity for a tenant
   * @param {string} tenantId - The tenant identifier
   * @param {string} brandId - The brand identifier
   * @param {Object} brandIdentity - The brand identity configuration
   * @returns {Promise<Object>} Created brand identity
   */
  async createBrandIdentity(tenantId, brandId, brandIdentity) {
    try {
      // Validate brand identity against schema
      const { error, value } = brandIdentitySchema.validate(brandIdentity);
      if (error) {
        throw new Error(`Invalid brand identity configuration: ${error.details.map(d => d.message).join(', ')}`);
      }

      // Create brand directory
      const brandPath = path.join(this.brandIdentityPath, 'brand', brandId);
      await fs.mkdir(brandPath, { recursive: true });

      // Save brand identity file
      const brandIdentityFile = path.join(brandPath, 'brand-identity.json');
      await fs.writeFile(brandIdentityFile, JSON.stringify(value, null, 2));

      // Clear cache
      this.cache.delete(`brand-identity:${tenantId}:${brandId}`);
      this.cache.delete(`available-brands:${tenantId}`);

      logger.info(`Brand identity created for tenant: ${tenantId}, brand: ${brandId}`);
      return value;
    } catch (error) {
      logger.error(`Failed to create brand identity for tenant: ${tenantId}, brand: ${brandId}`, error);
      throw error;
    }
  }

  /**
   * Update brand identity for a tenant
   * @param {string} tenantId - The tenant identifier
   * @param {string} brandId - The brand identifier
   * @param {Object} brandIdentity - The updated brand identity configuration
   * @returns {Promise<Object>} Updated brand identity
   */
  async updateBrandIdentity(tenantId, brandId, brandIdentity) {
    try {
      // Validate brand identity against schema
      const { error, value } = brandIdentitySchema.validate(brandIdentity);
      if (error) {
        throw new Error(`Invalid brand identity configuration: ${error.details.map(d => d.message).join(', ')}`);
      }

      // Update brand identity file
      const brandPath = path.join(this.brandIdentityPath, 'brand', brandId);
      const brandIdentityFile = path.join(brandPath, 'brand-identity.json');
      await fs.writeFile(brandIdentityFile, JSON.stringify(value, null, 2));

      // Clear cache
      this.cache.delete(`brand-identity:${tenantId}:${brandId}`);

      logger.info(`Brand identity updated for tenant: ${tenantId}, brand: ${brandId}`);
      return value;
    } catch (error) {
      logger.error(`Failed to update brand identity for tenant: ${tenantId}, brand: ${brandId}`, error);
      throw error;
    }
  }

  /**
   * Delete brand identity for a tenant
   * @param {string} tenantId - The tenant identifier
   * @param {string} brandId - The brand identifier
   * @returns {Promise<boolean>} Success status
   */
  async deleteBrandIdentity(tenantId, brandId) {
    try {
      if (brandId === 'default') {
        throw new Error('Cannot delete default brand identity');
      }

      const brandPath = path.join(this.brandIdentityPath, 'brand', brandId);
      await fs.rmdir(brandPath, { recursive: true });

      // Clear cache
      this.cache.delete(`brand-identity:${tenantId}:${brandId}`);
      this.cache.delete(`available-brands:${tenantId}`);

      logger.info(`Brand identity deleted for tenant: ${tenantId}, brand: ${brandId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete brand identity for tenant: ${tenantId}, brand: ${brandId}`, error);
      throw error;
    }
  }

  /**
   * Get brand assets (logos, icons, etc.) for a tenant
   * @param {string} tenantId - The tenant identifier
   * @param {string} brandId - The brand identifier
   * @returns {Promise<Object>} Brand assets
   */
  async getBrandAssets(tenantId, brandId = 'default') {
    try {
      const brandPath = path.join(this.brandIdentityPath, 'brand', brandId, 'assets');
      const assets = {};

      // Get all asset directories
      const assetDirs = await fs.readdir(brandPath);
      
      for (const dir of assetDirs) {
        const dirPath = path.join(brandPath, dir);
        const stat = await fs.stat(dirPath);
        
        if (stat.isDirectory()) {
          const files = await fs.readdir(dirPath);
          assets[dir] = files.map(file => ({
            name: file,
            path: `/brand-identity/brand/${brandId}/assets/${dir}/${file}`,
            type: path.extname(file).substring(1)
          }));
        }
      }

      return assets;
    } catch (error) {
      logger.error(`Failed to get brand assets for tenant: ${tenantId}, brand: ${brandId}`, error);
      return {};
    }
  }

  /**
   * Generate CSS variables from brand identity
   * @param {Object} brandIdentity - The brand identity configuration
   * @returns {string} CSS variables string
   */
  generateCSSVariables(brandIdentity) {
    const variables = [];
    
    // Generate color variables
    if (brandIdentity.colors && brandIdentity.colors.palette) {
      Object.entries(brandIdentity.colors.palette).forEach(([key, value]) => {
        variables.push(`--color-${key}: ${value};`);
      });
    }

    // Generate spacing variables
    if (brandIdentity.spacing) {
      Object.entries(brandIdentity.spacing).forEach(([key, value]) => {
        if (typeof value === 'string' && value.startsWith('spacing-')) {
          variables.push(`--spacing-${key}: ${value};`);
        } else if (typeof value === 'string') {
          variables.push(`--spacing-${key}: ${value};`);
        }
      });
    }

    // Generate typography variables
    if (brandIdentity.typography && brandIdentity.typography.definitions) {
      Object.entries(brandIdentity.typography.definitions).forEach(([category, styles]) => {
        Object.entries(styles).forEach(([styleName, style]) => {
          if (style.family) {
            variables.push(`--font-family-${category}-${styleName}: ${style.family};`);
          }
          if (style.weight) {
            variables.push(`--font-weight-${category}-${styleName}: ${style.weight};`);
          }
          if (style['mobile-size']) {
            variables.push(`--font-size-${category}-${styleName}: ${style['mobile-size']}px;`);
          }
        });
      });
    }

    return `:root {\n  ${variables.join('\n  ')}\n}`;
  }

  /**
   * Get brand identity health status
   * @param {string} tenantId - The tenant identifier
   * @param {string} brandId - The brand identifier
   * @returns {Promise<Object>} Health status
   */
  async getBrandHealth(tenantId, brandId = 'default') {
    try {
      const brandIdentity = await this.getBrandIdentity(tenantId, brandId);
      
      return {
        status: 'healthy',
        tenantId,
        brandId,
        lastUpdated: new Date().toISOString(),
        hasColors: !!(brandIdentity.colors && brandIdentity.colors.palette),
        hasTypography: !!(brandIdentity.typography && brandIdentity.typography.definitions),
        hasSpacing: !!(brandIdentity.spacing),
        hasMotion: !!(brandIdentity.motion),
        hasInteractive: !!(brandIdentity.interactive),
        hasNavigation: !!(brandIdentity.navigation),
        hasDecorations: !!(brandIdentity.decorations)
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        tenantId,
        brandId,
        error: error.message,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Clear brand identity cache
   * @param {string} tenantId - The tenant identifier
   * @param {string} brandId - The brand identifier (optional)
   */
  clearCache(tenantId, brandId = null) {
    if (brandId) {
      this.cache.delete(`brand-identity:${tenantId}:${brandId}`);
    } else {
      // Clear all brand-related cache for tenant
      const keys = this.cache.keys();
      keys.forEach(key => {
        if (key.startsWith(`brand-identity:${tenantId}:`) || key.startsWith(`available-brands:${tenantId}`)) {
          this.cache.delete(key);
        }
      });
    }
  }
}

module.exports = new BrandIdentityService();
