/**
 * LUXGEN TENANT MANAGEMENT ROUTES
 * Comprehensive tenant management API endpoints
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const tenantManagementService = require('../services/TenantManagementService');
const { validateRequest } = require('../middleware/validation');

/**
 * GET /api/v1/tenants
 * Get all tenants (admin only)
 */
router.get('/', 
  authenticateToken,
  authorizeRoles(['superadmin']),
  async (req, res) => {
    try {
      const tenants = await tenantManagementService.getAllTenants();
      res.json({
        success: true,
        data: tenants,
        message: 'Tenants retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * GET /api/v1/tenants/:tenantId
 * Get specific tenant
 */
router.get('/:tenantId',
  authenticateToken,
  async (req, res) => {
    try {
      const tenant = await tenantManagementService.getTenant(req.params.tenantId);
      res.json({
        success: true,
        data: tenant,
        message: 'Tenant retrieved successfully'
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * POST /api/v1/tenants
 * Create new tenant
 */
router.post('/',
  [
    body('name').notEmpty().withMessage('Tenant name is required'),
    body('contactEmail').isEmail().withMessage('Valid contact email is required'),
    body('plan').isIn(['starter', 'professional', 'enterprise']).withMessage('Invalid plan'),
    body('industry').optional().isString(),
    body('companySize').optional().isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']),
    body('adminFirstName').optional().isString(),
    body('adminLastName').optional().isString(),
    body('adminPassword').optional().isLength({ min: 8 })
  ],
  validateRequest,
  authenticateToken,
  authorizeRoles(['superadmin']),
  async (req, res) => {
    try {
      const result = await tenantManagementService.createTenant(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * PUT /api/v1/tenants/:tenantId
 * Update tenant
 */
router.put('/:tenantId',
  [
    body('name').optional().isString(),
    body('description').optional().isString(),
    body('industry').optional().isString(),
    body('companySize').optional().isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']),
    body('status').optional().isIn(['active', 'trial', 'expired', 'cancelled', 'suspended'])
  ],
  validateRequest,
  authenticateToken,
  authorizeRoles(['superadmin', 'admin']),
  async (req, res) => {
    try {
      const result = await tenantManagementService.updateTenant(req.params.tenantId, req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * DELETE /api/v1/tenants/:tenantId
 * Delete tenant (soft delete)
 */
router.delete('/:tenantId',
  authenticateToken,
  authorizeRoles(['superadmin']),
  async (req, res) => {
    try {
      const result = await tenantManagementService.deleteTenant(req.params.tenantId);
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * GET /api/v1/tenants/:tenantId/analytics
 * Get tenant analytics
 */
router.get('/:tenantId/analytics',
  authenticateToken,
  async (req, res) => {
    try {
      const result = await tenantManagementService.getTenantAnalytics(req.params.tenantId);
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * PUT /api/v1/tenants/:tenantId/branding
 * Update tenant branding
 */
router.put('/:tenantId/branding',
  [
    body('logo').optional().isString(),
    body('primaryColor').optional().isHexColor(),
    body('secondaryColor').optional().isHexColor(),
    body('accentColor').optional().isHexColor(),
    body('customCSS').optional().isString(),
    body('customJS').optional().isString(),
    body('theme').optional().isIn(['light', 'dark'])
  ],
  validateRequest,
  authenticateToken,
  authorizeRoles(['admin', 'superadmin']),
  async (req, res) => {
    try {
      const result = await tenantManagementService.updateTenantBranding(req.params.tenantId, req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * GET /api/v1/tenants/:tenantId/branding
 * Get tenant branding
 */
router.get('/:tenantId/branding',
  async (req, res) => {
    try {
      const branding = await tenantManagementService.getTenantBranding(req.params.tenantId);
      res.json({
        success: true,
        data: branding,
        message: 'Tenant branding retrieved successfully'
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * GET /api/v1/tenants/:tenantId/config
 * Get tenant configuration
 */
router.get('/:tenantId/config',
  async (req, res) => {
    try {
      const tenant = await tenantManagementService.getTenant(req.params.tenantId);
      const config = {
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        branding: tenant.branding,
        features: tenant.features,
        limits: tenant.limits,
        settings: tenant.settings
      };

      res.json({
        success: true,
        data: config,
        message: 'Tenant configuration retrieved successfully'
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * POST /api/v1/tenants/:tenantId/validate-access
 * Validate tenant access for user
 */
router.post('/:tenantId/validate-access',
  authenticateToken,
  async (req, res) => {
    try {
      const result = await tenantManagementService.validateTenantAccess(
        req.params.tenantId,
        req.user.id
      );
      res.json(result);
    } catch (error) {
      res.status(403).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * GET /api/v1/tenants/health/status
 * Get tenant system health
 */
router.get('/health/status',
  async (req, res) => {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          cache: 'active',
          storage: 'available'
        },
        metrics: {
          totalTenants: await tenantManagementService.getTotalTenants(),
          activeTenants: await tenantManagementService.getActiveTenants(),
          systemLoad: 'normal'
        }
      };

      res.json({
        success: true,
        data: health,
        message: 'System health retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;