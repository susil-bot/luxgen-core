/**
 * LUXGEN BRAND IDENTITY SERVICE
 * Comprehensive brand identity management for tenants
 * 
 * Features:
 * - Dynamic branding per tenant
 * - Asset management
 * - Theme customization
 * - Brand consistency enforcement
 */

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const mongoose = require('mongoose');

class BrandIdentityService {
  constructor() {
    this.brandCache = new Map();
    this.assetCache = new Map();
    this.basePath = path.join(__dirname, '../brand-identity');
  }

  /**
   * GET TENANT BRAND IDENTITY
   * Retrieves complete brand identity for a tenant
   */
  async getTenantBrandIdentity(tenantId) {
    try {
      // Check cache first
      if (this.brandCache.has(tenantId)) {
        return this.brandCache.get(tenantId);
      }

      // Load tenant-specific brand identity
      const brandIdentity = await this.loadTenantBrandIdentity(tenantId);
      
      // Cache the result
      this.brandCache.set(tenantId, brandIdentity);

      return brandIdentity;

    } catch (error) {
      console.error('❌ Error getting tenant brand identity:', error);
      throw new Error(`Failed to get brand identity: ${error.message}`);
    }
  }

  /**
   * UPDATE TENANT BRAND IDENTITY
   * Updates brand identity for a tenant
   */
  async updateTenantBrandIdentity(tenantId, brandData) {
    try {
      console.log('🎨 Updating brand identity for tenant:', tenantId);

      // Validate brand data
      const validatedBrand = await this.validateBrandData(brandData);

      // Process and save assets
      const processedAssets = await this.processBrandAssets(tenantId, validatedBrand);

      // Update brand identity file
      await this.saveTenantBrandIdentity(tenantId, {
        ...validatedBrand,
        assets: processedAssets,
        updatedAt: new Date().toISOString()
      });

      // Clear cache
      this.brandCache.delete(tenantId);

      console.log('✅ Brand identity updated successfully');
      return {
        success: true,
        brandIdentity: validatedBrand,
        message: 'Brand identity updated successfully'
      };

    } catch (error) {
      console.error('❌ Error updating brand identity:', error);
      throw new Error(`Failed to update brand identity: ${error.message}`);
    }
  }

  /**
   * GENERATE TENANT CSS
   * Generates CSS with tenant-specific branding
   */
  async generateTenantCSS(tenantId) {
    try {
      const brandIdentity = await this.getTenantBrandIdentity(tenantId);
      
      const css = `
/* LUXGEN TENANT CSS - ${tenantId} */
:root {
  /* Primary Colors */
  --primary-color: ${brandIdentity.colors.primary};
  --secondary-color: ${brandIdentity.colors.secondary};
  --accent-color: ${brandIdentity.colors.accent};
  
  /* Background Colors */
  --bg-primary: ${brandIdentity.colors.background.primary};
  --bg-secondary: ${brandIdentity.colors.background.secondary};
  --bg-accent: ${brandIdentity.colors.background.accent};
  
  /* Text Colors */
  --text-primary: ${brandIdentity.colors.text.primary};
  --text-secondary: ${brandIdentity.colors.text.secondary};
  --text-accent: ${brandIdentity.colors.text.accent};
  
  /* Typography */
  --font-primary: '${brandIdentity.typography.primary.fontFamily}', ${brandIdentity.typography.primary.fallback};
  --font-secondary: '${brandIdentity.typography.secondary.fontFamily}', ${brandIdentity.typography.secondary.fallback};
  
  /* Spacing */
  --spacing-xs: ${brandIdentity.spacing.xs};
  --spacing-sm: ${brandIdentity.spacing.sm};
  --spacing-md: ${brandIdentity.spacing.md};
  --spacing-lg: ${brandIdentity.spacing.lg};
  --spacing-xl: ${brandIdentity.spacing.xl};
  
  /* Border Radius */
  --border-radius-sm: ${brandIdentity.decorations.borderRadius.sm};
  --border-radius-md: ${brandIdentity.decorations.borderRadius.md};
  --border-radius-lg: ${brandIdentity.decorations.borderRadius.lg};
}

/* Brand-specific styles */
.tenant-brand {
  color: var(--primary-color);
}

.tenant-bg {
  background-color: var(--bg-primary);
}

.tenant-text {
  color: var(--text-primary);
  font-family: var(--font-primary);
}

/* Custom tenant styles */
${brandIdentity.customCSS || ''}
      `;

      return css;

    } catch (error) {
      console.error('❌ Error generating tenant CSS:', error);
      throw new Error(`Failed to generate tenant CSS: ${error.message}`);
    }
  }

  /**
   * GENERATE TENANT JAVASCRIPT
   * Generates JavaScript with tenant-specific functionality
   */
  async generateTenantJS(tenantId) {
    try {
      const brandIdentity = await this.getTenantBrandIdentity(tenantId);
      
      const js = `
// LUXGEN TENANT JS - ${tenantId}
(function() {
  'use strict';
  
  // Tenant configuration
  window.LuxGenTenant = {
    id: '${tenantId}',
    name: '${brandIdentity.name}',
    branding: ${JSON.stringify(brandIdentity, null, 2)},
    
    // Initialize tenant-specific functionality
    init: function() {
      this.applyBranding();
      this.setupAnalytics();
      this.setupNotifications();
    },
    
    // Apply branding to page
    applyBranding: function() {
      // Update page title
      document.title = '${brandIdentity.name} - LuxGen';
      
      // Update favicon
      const favicon = document.querySelector('link[rel="icon"]');
      if (favicon) {
        favicon.href = '${brandIdentity.assets.favicon}';
      }
      
      // Apply custom styles
      this.injectCustomStyles();
    },
    
    // Setup analytics
    setupAnalytics: function() {
      // Track tenant-specific events
      if (typeof gtag !== 'undefined') {
        gtag('config', '${brandIdentity.analytics.trackingId}', {
          custom_map: {
            'tenant_id': '${tenantId}',
            'tenant_name': '${brandIdentity.name}'
          }
        });
      }
    },
    
    // Setup notifications
    setupNotifications: function() {
      // Configure notification settings
      if ('Notification' in window) {
        Notification.requestPermission();
      }
    },
    
    // Inject custom styles
    injectCustomStyles: function() {
      const style = document.createElement('style');
      style.textContent = \`${brandIdentity.customCSS || ''}\`;
      document.head.appendChild(style);
    }
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.LuxGenTenant.init();
    });
  } else {
    window.LuxGenTenant.init();
  }
})();

${brandIdentity.customJS || ''}
      `;

      return js;

    } catch (error) {
      console.error('❌ Error generating tenant JS:', error);
      throw new Error(`Failed to generate tenant JS: ${error.message}`);
    }
  }

  /**
   * UPLOAD BRAND ASSET
   * Handles brand asset uploads (logos, images, etc.)
   */
  async uploadBrandAsset(tenantId, assetType, file) {
    try {
      console.log('📁 Uploading brand asset:', assetType, 'for tenant:', tenantId);

      // Create tenant-specific directory
      const tenantDir = path.join(this.basePath, 'brand', tenantId);
      await fs.mkdir(tenantDir, { recursive: true });

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${assetType}-${new mongoose.Types.ObjectId()}${fileExtension}`;
      const filePath = path.join(tenantDir, fileName);

      // Process and save file
      let processedFile;
      switch (assetType) {
        case 'logo':
          processedFile = await this.processLogo(file.buffer, filePath);
          break;
        case 'favicon':
          processedFile = await this.processFavicon(file.buffer, filePath);
          break;
        case 'background':
          processedFile = await this.processBackground(file.buffer, filePath);
          break;
        default:
          processedFile = await this.processGenericAsset(file.buffer, filePath);
      }

      // Update brand identity with new asset
      const brandIdentity = await this.getTenantBrandIdentity(tenantId);
      brandIdentity.assets[assetType] = `/brand-identity/brand/${tenantId}/${fileName}`;
      
      await this.saveTenantBrandIdentity(tenantId, brandIdentity);

      console.log('✅ Brand asset uploaded successfully');
      return {
        success: true,
        asset: {
          type: assetType,
          url: brandIdentity.assets[assetType],
          filename: fileName
        },
        message: 'Brand asset uploaded successfully'
      };

    } catch (error) {
      console.error('❌ Error uploading brand asset:', error);
      throw new Error(`Failed to upload brand asset: ${error.message}`);
    }
  }

  /**
   * HELPER METHODS
   */

  async loadTenantBrandIdentity(tenantId) {
    try {
      const tenantPath = path.join(this.basePath, 'brand', tenantId, 'brand-identity.json');
      
      try {
        const data = await fs.readFile(tenantPath, 'utf8');
        return JSON.parse(data);
      } catch (error) {
        // If tenant-specific brand doesn't exist, load default
        return await this.loadDefaultBrandIdentity();
      }
    } catch (error) {
      console.error('❌ Error loading tenant brand identity:', error);
      throw error;
    }
  }

  async loadDefaultBrandIdentity() {
    try {
      const defaultPath = path.join(this.basePath, 'brand', 'default', 'brand-identity.json');
      const data = await fs.readFile(defaultPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Error loading default brand identity:', error);
      throw error;
    }
  }

  async saveTenantBrandIdentity(tenantId, brandIdentity) {
    try {
      const tenantDir = path.join(this.basePath, 'brand', tenantId);
      await fs.mkdir(tenantDir, { recursive: true });
      
      const filePath = path.join(tenantDir, 'brand-identity.json');
      await fs.writeFile(filePath, JSON.stringify(brandIdentity, null, 2));
    } catch (error) {
      console.error('❌ Error saving tenant brand identity:', error);
      throw error;
    }
  }

  async validateBrandData(brandData) {
    // Validate colors
    if (brandData.colors) {
      if (brandData.colors.primary && !this.isValidHexColor(brandData.colors.primary)) {
        throw new Error('Invalid primary color format');
      }
      if (brandData.colors.secondary && !this.isValidHexColor(brandData.colors.secondary)) {
        throw new Error('Invalid secondary color format');
      }
    }

    // Validate typography
    if (brandData.typography) {
      if (brandData.typography.primary && !brandData.typography.primary.fontFamily) {
        throw new Error('Primary font family is required');
      }
    }

    return brandData;
  }

  async processBrandAssets(tenantId, brandData) {
    const assets = {};

    // Process logo if provided
    if (brandData.assets && brandData.assets.logo) {
      assets.logo = brandData.assets.logo;
    }

    // Process favicon if provided
    if (brandData.assets && brandData.assets.favicon) {
      assets.favicon = brandData.assets.favicon;
    }

    return assets;
  }

  async processLogo(buffer, outputPath) {
    return await sharp(buffer)
      .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toFile(outputPath);
  }

  async processFavicon(buffer, outputPath) {
    return await sharp(buffer)
      .resize(32, 32)
      .png()
      .toFile(outputPath);
  }

  async processBackground(buffer, outputPath) {
    return await sharp(buffer)
      .resize(1920, 1080, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(outputPath);
  }

  async processGenericAsset(buffer, outputPath) {
    return await fs.writeFile(outputPath, buffer);
  }

  isValidHexColor(color) {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }
}

module.exports = new BrandIdentityService();