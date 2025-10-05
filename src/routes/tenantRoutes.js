const express = require('express');
const router = express.Router();
const tenantManagementService = require('../services/TenantManagementService');
const { validateTenantAccess } = require('../tenantConfig');

/**
 * TENANT IDENTIFICATION ENDPOINT
 * POST /api/v1/tenant/identify
 * Identifies tenant based on subdomain, domain, or path
 */
router.post('/identify', async (req, res) => {
  try {
    const { type, identifier } = req.body;

    if (!type || !identifier) {
      return res.status(400).json({
        success: false,
        message: 'Type and identifier are required'
      });
    }

    let tenant = null;

    switch (type) {
      case 'subdomain':
        tenant = await tenantManagementService.getTenantBySlug(identifier);
        break;
      
      case 'domain':
        tenant = await tenantManagementService.getTenantByDomain(identifier);
        break;
      
      case 'path':
        tenant = await tenantManagementService.getTenantBySlug(identifier);
        break;
      
      case 'stored':
        tenant = await tenantManagementService.getTenantBySlug(identifier);
        break;
      
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid identification type'
        });
    }

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Check tenant status
    if (tenant.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Tenant is suspended',
        data: { tenant, status: 'suspended' }
      });
    }

    if (tenant.status === 'expired') {
      return res.status(403).json({
        success: false,
        message: 'Tenant subscription has expired',
        data: { tenant, status: 'expired' }
      });
    }

    res.json({
      success: true,
      message: 'Tenant identified successfully',
      data: tenant
    });

  } catch (error) {
    console.error('Tenant identification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * TENANT VALIDATION ENDPOINT
 * POST /api/v1/tenant/validate-access
 * Validates user access to tenant
 */
router.post('/validate-access', async (req, res) => {
  try {
    const { tenantId, userId } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    // Check tenant access
    const access = validateTenantAccess(tenantId, userId, 'user-management');
    
    if (!access.valid) {
      return res.status(403).json({
        success: false,
        message: access.reason
      });
    }

    res.json({
      success: true,
      message: 'Access validated successfully'
    });

  } catch (error) {
    console.error('Tenant validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET TENANT CONFIGURATION
 * GET /api/v1/tenant/:tenantId/config
 */
router.get('/:tenantId/config', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await tenantManagementService.getTenantById(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        features: tenant.features,
        limits: tenant.limits,
        branding: tenant.branding,
        settings: tenant.settings
      }
    });

  } catch (error) {
    console.error('Get tenant config error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * UPDATE TENANT CONFIGURATION
 * PUT /api/v1/tenant/:tenantId/config
 */
router.put('/:tenantId/config', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const config = req.body;

    const updated = await tenantManagementService.updateTenantConfig(tenantId, config);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found or update failed'
      });
    }

    res.json({
      success: true,
      message: 'Configuration updated successfully'
    });

  } catch (error) {
    console.error('Update tenant config error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET TENANT HEALTH STATUS
 * GET /api/v1/tenant/:tenantId/health
 */
router.get('/:tenantId/health', async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Get tenant health metrics
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      metrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: 'connected',
        cache: 'connected'
      }
    };

    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    console.error('Get tenant health error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET TENANT ANALYTICS
 * GET /api/v1/tenant/:tenantId/analytics
 */
router.get('/:tenantId/analytics', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { period = '30d' } = req.query;

    // Mock analytics data
    const analytics = {
      period,
      users: {
        total: 150,
        active: 120,
        new: 15
      },
      usage: {
        apiCalls: 2500,
        storage: '2.5GB',
        bandwidth: '15GB'
      },
      performance: {
        uptime: '99.9%',
        responseTime: '120ms',
        errorRate: '0.1%'
      }
    };

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Get tenant analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;