const TenantSchema = require('../models/TenantSchema');
const User = require('../models/User');

/**
 * Get tenant schema
 */
exports.getTenantSchema = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Check if user has access to this tenant
    if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this tenant'
      });
    }

    const tenant = await TenantSchema.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: tenant
    });

  } catch (error) {
    console.error('Get tenant schema error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant schema',
      error: error.message
    });
  }
};

/**
 * Create tenant schema
 */
exports.createTenantSchema = async (req, res) => {
  try {
    const tenantData = req.body;

    // Check if tenant with same slug already exists
    const existingTenant = await TenantSchema.findOne({ slug: tenantData.slug });
    if (existingTenant) {
      return res.status(400).json({
        success: false,
        message: 'Tenant with this slug already exists'
      });
    }

    const tenant = new TenantSchema({
      ...tenantData,
      metadata: {
        ...tenantData.metadata,
        createdBy: req.user.userId
      }
    });

    await tenant.save();

    res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
      data: tenant
    });

  } catch (error) {
    console.error('Create tenant schema error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tenant',
      error: error.message
    });
  }
};

/**
 * Update tenant schema
 */
exports.updateTenantSchema = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const updateData = req.body;

    // Check if user has access to this tenant
    if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this tenant'
      });
    }

    const tenant = await TenantSchema.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    Object.assign(tenant, updateData);
    await tenant.save();

    res.json({
      success: true,
      message: 'Tenant updated successfully',
      data: tenant
    });

  } catch (error) {
    console.error('Update tenant schema error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant',
      error: error.message
    });
  }
};

/**
 * Update tenant styling
 */
exports.updateTenantStyling = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const stylingUpdates = req.body;

    // Check if user has access to this tenant
    if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this tenant'
      });
    }

    const tenant = await TenantSchema.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    await tenant.updateStyling(stylingUpdates);

    res.json({
      success: true,
      message: 'Tenant styling updated successfully',
      data: tenant.styling
    });

  } catch (error) {
    console.error('Update tenant styling error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant styling',
      error: error.message
    });
  }
};

/**
 * Get tenant CSS variables
 */
exports.getTenantCSS = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const tenant = await TenantSchema.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    const css = tenant.generateCSSVariables();

    res.setHeader('Content-Type', 'text/css');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(css);

  } catch (error) {
    console.error('Get tenant CSS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate tenant CSS',
      error: error.message
    });
  }
};

/**
 * Get tenant styling configuration
 */
exports.getTenantStyling = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Check if user has access to this tenant
    if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this tenant'
      });
    }

    const tenant = await TenantSchema.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: tenant.stylingConfig
    });

  } catch (error) {
    console.error('Get tenant styling error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant styling',
      error: error.message
    });
  }
};

/**
 * Reset tenant styling to defaults
 */
exports.resetTenantStyling = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Check if user has access to this tenant
    if (req.user.role !== 'super_admin' && req.user.tenantId !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this tenant'
      });
    }

    const tenant = await TenantSchema.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Reset styling to defaults
    tenant.styling = {
      branding: {
        logo: '',
        favicon: '',
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

    await tenant.save();

    res.json({
      success: true,
      message: 'Tenant styling reset to defaults',
      data: tenant.styling
    });

  } catch (error) {
    console.error('Reset tenant styling error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset tenant styling',
      error: error.message
    });
  }
};

/**
 * Get all tenants (admin only)
 */
exports.getAllTenants = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, subscriptionStatus } = req.query;

    const query = {};
    if (status) query.status = status;
    if (subscriptionStatus) query['subscription.status'] = subscriptionStatus;

    const tenants = await TenantSchema.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TenantSchema.countDocuments(query);

    res.json({
      success: true,
      data: {
        tenants,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });

  } catch (error) {
    console.error('Get all tenants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenants',
      error: error.message
    });
  }
};

/**
 * Get tenant by slug
 */
exports.getTenantBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const tenant = await TenantSchema.findOne({ slug });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: tenant
    });

  } catch (error) {
    console.error('Get tenant by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant',
      error: error.message
    });
  }
};

/**
 * Update tenant usage statistics
 */
exports.updateTenantUsage = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { type, count = 1 } = req.body;

    const tenant = await TenantSchema.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    await tenant.updateUsage(type, count);

    res.json({
      success: true,
      message: 'Usage statistics updated successfully',
      data: tenant.usage
    });

  } catch (error) {
    console.error('Update tenant usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update usage statistics',
      error: error.message
    });
  }
};

/**
 * Get tenants expiring soon
 */
exports.getExpiringTenants = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const tenants = await TenantSchema.findExpiringSoon(parseInt(days));

    res.json({
      success: true,
      data: tenants
    });

  } catch (error) {
    console.error('Get expiring tenants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expiring tenants',
      error: error.message
    });
  }
};

/**
 * Get tenants by primary color
 */
exports.getTenantsByColor = async (req, res) => {
  try {
    const { color } = req.params;

    const tenants = await TenantSchema.findByPrimaryColor(color);

    res.json({
      success: true,
      data: tenants
    });

  } catch (error) {
    console.error('Get tenants by color error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenants by color',
      error: error.message
    });
  }
};

module.exports = exports; 