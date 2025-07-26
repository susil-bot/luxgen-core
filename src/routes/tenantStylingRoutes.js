const express = require('express');
const router = express.Router();
const tenantStylingController = require('../controllers/tenantStylingController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get tenant styling configuration
router.get('/:tenantId', authenticateToken, tenantStylingController.getTenantStyling);

// Update tenant styling configuration
router.put('/:tenantId', authenticateToken, tenantStylingController.updateTenantStyling);

// Get tenant CSS
router.get('/:tenantId/css', tenantStylingController.getTenantCSS);

// Get tenant Tailwind config
router.get('/:tenantId/tailwind-config', authenticateToken, tenantStylingController.getTenantTailwindConfig);

// Get multiple tenants styling (admin only)
router.post('/bulk', requireAdmin, tenantStylingController.getMultipleTenantStyling);

// Reset tenant styling to defaults
router.post('/:tenantId/reset', authenticateToken, tenantStylingController.resetTenantStyling);

// Preview styling changes (doesn't save)
router.post('/:tenantId/preview', authenticateToken, tenantStylingController.previewTenantStyling);

// Export tenant styling as JSON
router.get('/:tenantId/export', authenticateToken, tenantStylingController.exportTenantStyling);

// Import tenant styling from JSON
router.post('/:tenantId/import', authenticateToken, tenantStylingController.importTenantStyling);

module.exports = router; 