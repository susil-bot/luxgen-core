/**
 * LUXGEN TENANT MANAGEMENT ROUTES
 * Advanced tenant management and administration
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const tenantManagementService = require('../services/TenantManagementService');
const { validateRequest } = require('../middleware/validation');

/**
 * GET /api/v1/tenants/dashboard
 * Get tenant management dashboard data
 */
router.get('/dashboard',
  authenticateToken,
  authorizeRoles(['superadmin']),
  async (req, res) => {
    try {
      const dashboard = await tenantManagementService.getDashboardData();
      res.json({
        success: true,
        data: dashboard,
        message: 'Dashboard data retrieved successfully'
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
 * GET /api/v1/tenants/statistics
 * Get tenant statistics
 */
router.get('/statistics',
  authenticateToken,
  authorizeRoles(['superadmin']),
  async (req, res) => {
    try {
      const statistics = await tenantManagementService.getTenantStatistics();
      res.json({
        success: true,
        data: statistics,
        message: 'Tenant statistics retrieved successfully'
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
 * POST /api/v1/tenants/:tenantId/suspend
 * Suspend tenant
 */
router.post('/:tenantId/suspend',
  authenticateToken,
  authorizeRoles(['superadmin']),
  async (req, res) => {
    try {
      const result = await tenantManagementService.suspendTenant(req.params.tenantId, req.body.reason);
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
 * POST /api/v1/tenants/:tenantId/activate
 * Activate tenant
 */
router.post('/:tenantId/activate',
  authenticateToken,
  authorizeRoles(['superadmin']),
  async (req, res) => {
    try {
      const result = await tenantManagementService.activateTenant(req.params.tenantId);
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
 * POST /api/v1/tenants/:tenantId/upgrade
 * Upgrade tenant plan
 */
router.post('/:tenantId/upgrade',
  [
    body('newPlan').isIn(['starter', 'professional', 'enterprise']).withMessage('Invalid plan'),
    body('reason').optional().isString()
  ],
  validateRequest,
  authenticateToken,
  authorizeRoles(['superadmin']),
  async (req, res) => {
    try {
      const result = await tenantManagementService.upgradeTenantPlan(
        req.params.tenantId,
        req.body.newPlan,
        req.body.reason
      );
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
 * POST /api/v1/tenants/:tenantId/downgrade
 * Downgrade tenant plan
 */
router.post('/:tenantId/downgrade',
  [
    body('newPlan').isIn(['starter', 'professional', 'enterprise']).withMessage('Invalid plan'),
    body('reason').optional().isString()
  ],
  validateRequest,
  authenticateToken,
  authorizeRoles(['superadmin']),
  async (req, res) => {
    try {
      const result = await tenantManagementService.downgradeTenantPlan(
        req.params.tenantId,
        req.body.newPlan,
        req.body.reason
      );
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
 * GET /api/v1/tenants/:tenantId/usage
 * Get tenant usage details
 */
router.get('/:tenantId/usage',
  authenticateToken,
  authorizeRoles(['superadmin', 'admin']),
  async (req, res) => {
    try {
      const usage = await tenantManagementService.getTenantUsage(req.params.tenantId);
      res.json({
        success: true,
        data: usage,
        message: 'Tenant usage retrieved successfully'
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
 * POST /api/v1/tenants/:tenantId/reset-usage
 * Reset tenant usage counters
 */
router.post('/:tenantId/reset-usage',
  authenticateToken,
  authorizeRoles(['superadmin']),
  async (req, res) => {
    try {
      const result = await tenantManagementService.resetTenantUsage(req.params.tenantId);
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
 * GET /api/v1/tenants/:tenantId/health
 * Get tenant health status
 */
router.get('/:tenantId/health',
  authenticateToken,
  async (req, res) => {
    try {
      const health = await tenantManagementService.getTenantHealth(req.params.tenantId);
      res.json({
        success: true,
        data: health,
        message: 'Tenant health retrieved successfully'
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
 * POST /api/v1/tenants/:tenantId/backup
 * Create tenant backup
 */
router.post('/:tenantId/backup',
  authenticateToken,
  authorizeRoles(['superadmin']),
  async (req, res) => {
    try {
      const result = await tenantManagementService.createTenantBackup(req.params.tenantId);
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
 * POST /api/v1/tenants/:tenantId/restore
 * Restore tenant from backup
 */
router.post('/:tenantId/restore',
  [
    body('backupId').notEmpty().withMessage('Backup ID is required')
  ],
  validateRequest,
  authenticateToken,
  authorizeRoles(['superadmin']),
  async (req, res) => {
    try {
      const result = await tenantManagementService.restoreTenantFromBackup(
        req.params.tenantId,
        req.body.backupId
      );
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
 * GET /api/v1/tenants/:tenantId/backups
 * Get tenant backups
 */
router.get('/:tenantId/backups',
  authenticateToken,
  authorizeRoles(['superadmin']),
  async (req, res) => {
    try {
      const backups = await tenantManagementService.getTenantBackups(req.params.tenantId);
      res.json({
        success: true,
        data: backups,
        message: 'Tenant backups retrieved successfully'
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
 * POST /api/v1/tenants/:tenantId/migrate
 * Migrate tenant data
 */
router.post('/:tenantId/migrate',
  [
    body('targetTenantId').notEmpty().withMessage('Target tenant ID is required'),
    body('migrationOptions').optional().isObject()
  ],
  validateRequest,
  authenticateToken,
  authorizeRoles(['superadmin']),
  async (req, res) => {
    try {
      const result = await tenantManagementService.migrateTenantData(
        req.params.tenantId,
        req.body.targetTenantId,
        req.body.migrationOptions
      );
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
 * GET /api/v1/tenants/:tenantId/audit-log
 * Get tenant audit log
 */
router.get('/:tenantId/audit-log',
  authenticateToken,
  authorizeRoles(['superadmin', 'admin']),
  async (req, res) => {
    try {
      const auditLog = await tenantManagementService.getTenantAuditLog(
        req.params.tenantId,
        req.query
      );
      res.json({
        success: true,
        data: auditLog,
        message: 'Tenant audit log retrieved successfully'
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
 * POST /api/v1/tenants/:tenantId/notify
 * Send notification to tenant
 */
router.post('/:tenantId/notify',
  [
    body('type').isIn(['email', 'in-app', 'sms']).withMessage('Invalid notification type'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('recipients').optional().isArray()
  ],
  validateRequest,
  authenticateToken,
  authorizeRoles(['superadmin']),
  async (req, res) => {
    try {
      const result = await tenantManagementService.sendTenantNotification(
        req.params.tenantId,
        req.body
      );
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
 * GET /api/v1/tenants/export
 * Export tenant data
 */
router.get('/export',
  authenticateToken,
  authorizeRoles(['superadmin']),
  async (req, res) => {
    try {
      const exportData = await tenantManagementService.exportTenantData(req.query);
      res.json({
        success: true,
        data: exportData,
        message: 'Tenant data exported successfully'
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
 * POST /api/v1/tenants/import
 * Import tenant data
 */
router.post('/import',
  authenticateToken,
  authorizeRoles(['superadmin']),
  async (req, res) => {
    try {
      const result = await tenantManagementService.importTenantData(req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

module.exports = router;