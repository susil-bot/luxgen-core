const Tenant = require('../models/Tenant');

class TenantStylingService {
  constructor() {
    // No database connection needed - uses Mongoose models
  }

  /**
   * Get tenant styling configuration by tenant ID
   */
  async getTenantStyling(tenantId) {
    try {
      const tenant = await Tenant.findById(tenantId);
      
      if (!tenant) {
        return this.getDefaultStyling();
      }

      const settings = tenant.branding || {};
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
      animations: {
        duration: {
          fast: '150ms',
          normal: '300ms',
          slow: '500ms'
        },
        easing: {
          linear: 'linear',
          easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
          easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
          easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
        }
      },
      components: {
        button: {
          primary: {
            backgroundColor: '#3B82F6',
            textColor: '#FFFFFF',
            borderColor: '#3B82F6',
            hoverBackgroundColor: '#2563EB',
            hoverBorderColor: '#2563EB'
          },
          secondary: {
            backgroundColor: '#6B7280',
            textColor: '#FFFFFF',
            borderColor: '#6B7280',
            hoverBackgroundColor: '#4B5563',
            hoverBorderColor: '#4B5563'
          }
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
    return this.deepMerge(defaults, tenantSettings);
  }

  /**
   * Generate CSS variables from styling configuration
   */
  generateCSSVariables(styling) {
    const variables = [];
    
    // Branding colors
    if (styling.branding) {
      Object.entries(styling.branding).forEach(([key, value]) => {
        if (typeof value === 'string' && value.startsWith('#')) {
          variables.push(`--color-${key}: ${value};`);
        }
      });
    }

    // Typography
    if (styling.typography) {
      if (styling.typography.fontFamily) {
        variables.push(`--font-family: ${styling.typography.fontFamily};`);
      }
      
      if (styling.typography.fontSize) {
        Object.entries(styling.typography.fontSize).forEach(([key, value]) => {
          variables.push(`--font-size-${key}: ${value};`);
        });
      }
      
      if (styling.typography.fontWeight) {
        Object.entries(styling.typography.fontWeight).forEach(([key, value]) => {
          variables.push(`--font-weight-${key}: ${value};`);
        });
      }
    }

    // Spacing
    if (styling.spacing) {
      Object.entries(styling.spacing).forEach(([key, value]) => {
        variables.push(`--spacing-${key}: ${value};`);
      });
    }

    // Border radius
    if (styling.borderRadius) {
      Object.entries(styling.borderRadius).forEach(([key, value]) => {
        variables.push(`--border-radius-${key}: ${value};`);
      });
    }

    // Shadows
    if (styling.shadows) {
      Object.entries(styling.shadows).forEach(([key, value]) => {
        variables.push(`--shadow-${key}: ${value};`);
      });
    }

    return `:root {\n  ${variables.join('\n  ')}\n}`;
  }

  /**
   * Generate Tailwind config from styling
   */
  generateTailwindConfig(styling) {
    return {
      theme: {
        extend: {
          colors: styling.branding ? {
            primary: {
              50: this.generateColorShades(styling.branding.primaryColor, 50),
              100: this.generateColorShades(styling.branding.primaryColor, 100),
              500: styling.branding.primaryColor,
              600: this.generateColorShades(styling.branding.primaryColor, 600),
              700: this.generateColorShades(styling.branding.primaryColor, 700),
              900: this.generateColorShades(styling.branding.primaryColor, 900)
            },
            secondary: {
              50: this.generateColorShades(styling.branding.secondaryColor, 50),
              100: this.generateColorShades(styling.branding.secondaryColor, 100),
              500: styling.branding.secondaryColor,
              600: this.generateColorShades(styling.branding.secondaryColor, 600),
              700: this.generateColorShades(styling.branding.secondaryColor, 700),
              900: this.generateColorShades(styling.branding.secondaryColor, 900)
            }
          } : {},
          fontFamily: styling.typography?.fontFamily ? {
            sans: styling.typography.fontFamily.split(', ').map(font => font.replace(/['"]/g, ''))
          } : {},
          fontSize: styling.typography?.fontSize || {},
          fontWeight: styling.typography?.fontWeight || {},
          spacing: styling.spacing || {},
          borderRadius: styling.borderRadius || {},
          boxShadow: styling.shadows || {}
        }
      }
    };
  }

  /**
   * Generate color shades
   */
  generateColorShades(baseColor, shade) {
    // Simple color shade generation - in production, use a proper color library
    return baseColor;
  }

  /**
   * Generate tenant CSS
   */
  async generateTenantCSS(tenantId) {
    try {
      const styling = await this.getTenantStyling(tenantId);
      const cssVariables = this.generateCSSVariables(styling);
      
      // Add component-specific styles
      const componentStyles = this.generateComponentStyles(styling);
      
      return `${cssVariables}\n\n${componentStyles}`;
    } catch (error) {
      console.error('Error generating tenant CSS:', error);
      return this.generateCSSVariables(this.getDefaultStyling());
    }
  }

  /**
   * Generate component-specific styles
   */
  generateComponentStyles(styling) {
    let styles = '';
    
    if (styling.components?.button) {
      Object.entries(styling.components.button).forEach(([variant, config]) => {
        styles += `
.btn-${variant} {
  background-color: ${config.backgroundColor};
  color: ${config.textColor};
  border: 1px solid ${config.borderColor};
  transition: all 0.2s ease-in-out;
}

.btn-${variant}:hover {
  background-color: ${config.hoverBackgroundColor};
  border-color: ${config.hoverBorderColor};
}
`;
      });
    }

    if (styling.components?.card) {
      const card = styling.components.card;
      styles += `
.card {
  background-color: ${card.backgroundColor};
  border: 1px solid ${card.borderColor};
  box-shadow: ${card.shadow};
  border-radius: var(--border-radius-base);
  padding: var(--spacing-md);
}
`;
    }

    return styles;
  }

  /**
   * Update tenant styling
   */
  async updateTenantStyling(tenantId, stylingUpdates) {
    try {
      const tenant = await Tenant.findById(tenantId);
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      // Merge existing branding with updates
      const currentBranding = tenant.branding || {};
      const updatedBranding = this.deepMerge(currentBranding, stylingUpdates);
      
      // Update tenant
      tenant.branding = updatedBranding;
      await tenant.save();

      return this.mergeWithDefaults(updatedBranding);
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
   * Get multiple tenant styling
   */
  async getMultipleTenantStyling(tenantIds) {
    try {
      const tenants = await Tenant.find({ _id: { $in: tenantIds } });
      const stylingMap = {};
      
      tenants.forEach(tenant => {
        stylingMap[tenant._id.toString()] = this.mergeWithDefaults(tenant.branding || {});
      });
      
      return stylingMap;
    } catch (error) {
      console.error('Error getting multiple tenant styling:', error);
      return {};
    }
  }
}

module.exports = new TenantStylingService(); 