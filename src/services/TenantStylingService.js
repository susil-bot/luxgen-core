const { Pool } = require('pg');

class TenantStylingService {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'trainer_platform',
      user: process.env.DB_USER || 'trainer_user',
      password: process.env.DB_PASSWORD || 'trainer_password_2024',
    });
  }

  /**
   * Get tenant styling configuration by tenant ID
   */
  async getTenantStyling(tenantId) {
    try {
      const client = await this.pool.connect();
      const result = await client.query(
        'SELECT settings FROM tenants WHERE id = $1',
        [tenantId]
      );
      client.release();

      if (result.rows.length === 0) {
        return this.getDefaultStyling();
      }

      const settings = result.rows[0].settings;
      return this.mergeWithDefaults(settings);
    } catch (error) {
      console.error('Error getting tenant styling:', error);
      return this.getDefaultStyling();
    }
  }

  /**
   * Get default styling configuration
   */
  getDefaultStyling() {
    return {
      branding: {
        logo: '',
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        accentColor: '#10B981',
        backgroundColor: '#FFFFFF',
        surfaceColor: '#F9FAFB',
        textColor: '#111827',
        textSecondaryColor: '#6B7280',
        borderColor: '#E5E7EB',
        successColor: '#10B981',
        warningColor: '#F59E0B',
        errorColor: '#EF4444',
        infoColor: '#3B82F6'
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem'
        },
        fontWeight: {
          light: '300',
          normal: '400',
          medium: '500',
          semibold: '600',
          bold: '700'
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem'
      },
      borderRadius: {
        none: '0',
        sm: '0.125rem',
        base: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      },
      components: {
        button: {
          primary: {
            backgroundColor: '#3B82F6',
            textColor: '#FFFFFF',
            borderColor: '#3B82F6',
            hoverBackgroundColor: '#2563EB',
            hoverTextColor: '#FFFFFF'
          },
          secondary: {
            backgroundColor: '#F3F4F6',
            textColor: '#374151',
            borderColor: '#D1D5DB',
            hoverBackgroundColor: '#E5E7EB',
            hoverTextColor: '#374151'
          }
        },
        input: {
          backgroundColor: '#FFFFFF',
          borderColor: '#D1D5DB',
          textColor: '#111827',
          placeholderColor: '#9CA3AF',
          focusBorderColor: '#3B82F6',
          focusRingColor: '#DBEAFE'
        },
        card: {
          backgroundColor: '#FFFFFF',
          borderColor: '#E5E7EB',
          shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
        }
      }
    };
  }

  /**
   * Merge tenant settings with defaults
   */
  mergeWithDefaults(tenantSettings) {
    const defaults = this.getDefaultStyling();
    
    return {
      branding: { ...defaults.branding, ...tenantSettings.branding },
      typography: { ...defaults.typography, ...tenantSettings.typography },
      spacing: { ...defaults.spacing, ...tenantSettings.spacing },
      borderRadius: { ...defaults.borderRadius, ...tenantSettings.borderRadius },
      shadows: { ...defaults.shadows, ...tenantSettings.shadows },
      components: { ...defaults.components, ...tenantSettings.components }
    };
  }

  /**
   * Generate CSS variables for tenant styling
   */
  generateCSSVariables(styling) {
    const cssVars = [];

    // Branding colors
    Object.entries(styling.branding).forEach(([key, value]) => {
      if (typeof value === 'string' && value.startsWith('#')) {
        cssVars.push(`--color-${key}: ${value};`);
      }
    });

    // Typography
    cssVars.push(`--font-family: ${styling.typography.fontFamily};`);
    
    Object.entries(styling.typography.fontSize).forEach(([key, value]) => {
      cssVars.push(`--font-size-${key}: ${value};`);
    });

    Object.entries(styling.typography.fontWeight).forEach(([key, value]) => {
      cssVars.push(`--font-weight-${key}: ${value};`);
    });

    // Spacing
    Object.entries(styling.spacing).forEach(([key, value]) => {
      cssVars.push(`--spacing-${key}: ${value};`);
    });

    // Border radius
    Object.entries(styling.borderRadius).forEach(([key, value]) => {
      cssVars.push(`--border-radius-${key}: ${value};`);
    });

    // Shadows
    Object.entries(styling.shadows).forEach(([key, value]) => {
      cssVars.push(`--shadow-${key}: ${value};`);
    });

    // Component styles
    Object.entries(styling.components).forEach(([component, styles]) => {
      Object.entries(styles).forEach(([variant, variantStyles]) => {
        Object.entries(variantStyles).forEach(([property, value]) => {
          cssVars.push(`--${component}-${variant}-${property}: ${value};`);
        });
      });
    });

    return `:root {\n  ${cssVars.join('\n  ')}\n}`;
  }

  /**
   * Generate Tailwind CSS configuration for tenant
   */
  generateTailwindConfig(styling) {
    return {
      theme: {
        extend: {
          colors: {
            primary: {
              50: this.generateColorShades(styling.branding.primaryColor, 50),
              100: this.generateColorShades(styling.branding.primaryColor, 100),
              200: this.generateColorShades(styling.branding.primaryColor, 200),
              300: this.generateColorShades(styling.branding.primaryColor, 300),
              400: this.generateColorShades(styling.branding.primaryColor, 400),
              500: styling.branding.primaryColor,
              600: this.generateColorShades(styling.branding.primaryColor, 600),
              700: this.generateColorShades(styling.branding.primaryColor, 700),
              800: this.generateColorShades(styling.branding.primaryColor, 800),
              900: this.generateColorShades(styling.branding.primaryColor, 900),
            },
            secondary: {
              50: this.generateColorShades(styling.branding.secondaryColor, 50),
              100: this.generateColorShades(styling.branding.secondaryColor, 100),
              200: this.generateColorShades(styling.branding.secondaryColor, 200),
              300: this.generateColorShades(styling.branding.secondaryColor, 300),
              400: this.generateColorShades(styling.branding.secondaryColor, 400),
              500: styling.branding.secondaryColor,
              600: this.generateColorShades(styling.branding.secondaryColor, 600),
              700: this.generateColorShades(styling.branding.secondaryColor, 700),
              800: this.generateColorShades(styling.branding.secondaryColor, 800),
              900: this.generateColorShades(styling.branding.secondaryColor, 900),
            },
            accent: styling.branding.accentColor,
            success: styling.branding.successColor,
            warning: styling.branding.warningColor,
            error: styling.branding.errorColor,
            info: styling.branding.infoColor,
          },
          fontFamily: {
            sans: styling.typography.fontFamily.split(', '),
          },
          fontSize: styling.typography.fontSize,
          fontWeight: styling.typography.fontWeight,
          spacing: styling.spacing,
          borderRadius: styling.borderRadius,
          boxShadow: styling.shadows,
        },
      },
    };
  }

  /**
   * Generate color shades for a given color
   */
  generateColorShades(baseColor, shade) {
    // Simple color shade generation - in production, use a proper color library
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const factor = shade / 500;
    const newR = Math.round(r * factor);
    const newG = Math.round(g * factor);
    const newB = Math.round(b * factor);

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  /**
   * Generate complete CSS for tenant
   */
  async generateTenantCSS(tenantId) {
    const styling = await this.getTenantStyling(tenantId);
    const cssVars = this.generateCSSVariables(styling);
    
    return `
${cssVars}

/* Component styles using CSS variables */
.btn-primary {
  background-color: var(--button-primary-backgroundColor);
  color: var(--button-primary-textColor);
  border-color: var(--button-primary-borderColor);
}

.btn-primary:hover {
  background-color: var(--button-primary-hoverBackgroundColor);
  color: var(--button-primary-hoverTextColor);
}

.btn-secondary {
  background-color: var(--button-secondary-backgroundColor);
  color: var(--button-secondary-textColor);
  border-color: var(--button-secondary-borderColor);
}

.btn-secondary:hover {
  background-color: var(--button-secondary-hoverBackgroundColor);
  color: var(--button-secondary-hoverTextColor);
}

.input-field {
  background-color: var(--input-backgroundColor);
  border-color: var(--input-borderColor);
  color: var(--input-textColor);
}

.input-field::placeholder {
  color: var(--input-placeholderColor);
}

.input-field:focus {
  border-color: var(--input-focusBorderColor);
  box-shadow: 0 0 0 3px var(--input-focusRingColor);
}

.card {
  background-color: var(--card-backgroundColor);
  border-color: var(--card-borderColor);
  box-shadow: var(--card-shadow);
}

/* Utility classes */
.text-primary { color: var(--color-primaryColor); }
.text-secondary { color: var(--color-secondaryColor); }
.text-accent { color: var(--color-accentColor); }
.text-success { color: var(--color-successColor); }
.text-warning { color: var(--color-warningColor); }
.text-error { color: var(--color-errorColor); }
.text-info { color: var(--color-infoColor); }

.bg-primary { background-color: var(--color-primaryColor); }
.bg-secondary { background-color: var(--color-secondaryColor); }
.bg-accent { background-color: var(--color-accentColor); }
.bg-success { background-color: var(--color-successColor); }
.bg-warning { background-color: var(--color-warningColor); }
.bg-error { background-color: var(--color-errorColor); }
.bg-info { background-color: var(--color-infoColor); }

.border-primary { border-color: var(--color-primaryColor); }
.border-secondary { border-color: var(--color-secondaryColor); }
.border-accent { border-color: var(--color-accentColor); }
.border-success { border-color: var(--color-successColor); }
.border-warning { border-color: var(--color-warningColor); }
.border-error { border-color: var(--color-errorColor); }
.border-info { border-color: var(--color-infoColor); }
`;
  }

  /**
   * Update tenant styling
   */
  async updateTenantStyling(tenantId, stylingUpdates) {
    try {
      const client = await this.pool.connect();
      
      // Get current settings
      const currentResult = await client.query(
        'SELECT settings FROM tenants WHERE id = $1',
        [tenantId]
      );

      if (currentResult.rows.length === 0) {
        throw new Error('Tenant not found');
      }

      const currentSettings = currentResult.rows[0].settings || {};
      
      // Deep merge the styling updates
      const updatedSettings = this.deepMerge(currentSettings, stylingUpdates);

      // Update tenant settings
      await client.query(
        'UPDATE tenants SET settings = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [updatedSettings, tenantId]
      );

      client.release();
      return updatedSettings;
    } catch (error) {
      console.error('Error updating tenant styling:', error);
      throw error;
    }
  }

  /**
   * Deep merge objects
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  /**
   * Get styling for multiple tenants
   */
  async getMultipleTenantStyling(tenantIds) {
    try {
      const client = await this.pool.connect();
      const result = await client.query(
        'SELECT id, settings FROM tenants WHERE id = ANY($1)',
        [tenantIds]
      );
      client.release();

      const stylingMap = {};
      result.rows.forEach(row => {
        stylingMap[row.id] = this.mergeWithDefaults(row.settings);
      });

      return stylingMap;
    } catch (error) {
      console.error('Error getting multiple tenant styling:', error);
      return {};
    }
  }
}

module.exports = new TenantStylingService(); 