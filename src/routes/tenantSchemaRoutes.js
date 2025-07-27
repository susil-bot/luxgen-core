const express = require('express');
const router = express.Router();
const tenantSchemaController = require('../controllers/tenantSchemaController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');


// All routes require authentication
router.use(authenticateToken);


// Tenant schema management
router.get('/:tenantId', tenantSchemaController.getTenantSchema);
router.post('/', requireAdmin, tenantSchemaController.createTenantSchema);
router.put('/:tenantId', tenantSchemaController.updateTenantSchema);


// Styling management
router.get('/:tenantId/styling', tenantSchemaController.getTenantStyling);
router.put('/:tenantId/styling', tenantSchemaController.updateTenantStyling);
router.post('/:tenantId/styling/reset', tenantSchemaController.resetTenantStyling);


// CSS generation (public access for styling)
router.get('/:tenantId/css', tenantSchemaController.getTenantCSS);


// Usage statistics
router.post('/:tenantId/usage', tenantSchemaController.updateTenantUsage);


// Admin routes
router.get('/', requireAdmin, tenantSchemaController.getAllTenants);
router.get('/slug/:slug', tenantSchemaController.getTenantBySlug);
router.get('/expiring', requireAdmin, tenantSchemaController.getExpiringTenants);
router.get('/color/:color', requireAdmin, tenantSchemaController.getTenantsByColor);

module.exports = router;
