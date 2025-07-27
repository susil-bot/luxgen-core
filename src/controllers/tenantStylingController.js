const tenantStylingService = require('../services/TenantStylingService');

/**
 * Get tenant styling configuration
 */
exports.getTenantStyling = async (req, res) => {
  try {
    const { tenantId } = req.params;

    // Check if user has access to this tenant
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this tenant'
      });
    }
    const styling = await tenantStylingService.getTenantStyling(tenantId);
    res.json({ success: true, data: styling });
  } catch (error) {
    console.error('Error getting tenant styling:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant styling',
      error: error.message
    });
  }
};

/**
 * Update tenant styling configuration
 */
exports.updateTenantStyling = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const stylingUpdates = req.body;
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this tenant'
      });
    }
    const updatedStyling = await tenantStylingService.updateTenantStyling(tenantId, stylingUpdates);
    res.json({
      success: true, message: 'Tenant styling updated successfully', data: updatedStyling
    });
  } catch (error) {
    console.error('Error updating tenant styling:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant styling',
      error: error.message
    });
  }
};

/**
 * Get tenant CSS
 */
exports.getTenantCSS = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const css = await tenantStylingService.generateTenantCSS(tenantId);
    res.setHeader('Content-Type', 'text/css');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(css);
  } catch (error) {
    console.error('Error generating tenant CSS:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate tenant CSS',
      error: error.message
    });
  }
};

/**
 * Get tenant Tailwind config
 */
exports.getTenantTailwindConfig = async (req, res) => {
  try {
    const { tenantId } = req.params;
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this tenant'
      });
    }
    const styling = await tenantStylingService.getTenantStyling(tenantId);
    const tailwindConfig = tenantStylingService.generateTailwindConfig(styling);
    res.json({ success: true, data: tailwindConfig });
  } catch (error) {
    console.error('Error generating Tailwind config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate Tailwind config',
      error: error.message
    });
  }
};

/**
 * Get multiple tenants styling (admin only)
 */
exports.getMultipleTenantStyling = async (req, res) => {
  try {
    const { tenantIds } = req.body;
    if (!tenantIds || !Array.isArray(tenantIds)) {
      return res.status(400).json({
        success: false,
        message: 'Tenant IDs array is required'
      });
    }
    const stylingMap = await tenantStylingService.getMultipleTenantStyling(tenantIds);
    res.json({ success: true, data: stylingMap });
  } catch (error) {
    console.error('Error getting multiple tenants styling:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get multiple tenants styling',
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
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this tenant'
      });
    }
    const defaultStyling = tenantStylingService.getDefaultStyling();
    const updatedStyling = await tenantStylingService.updateTenantStyling(tenantId, defaultStyling);
    res.json({
      success: true, message: 'Tenant styling reset to defaults', data: updatedStyling
    });
  } catch (error) {
    console.error('Error resetting tenant styling:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset tenant styling',
      error: error.message
    });
  }
};

/**
 * Preview styling changes (doesn't save)
 */
exports.previewTenantStyling = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const stylingUpdates = req.body;
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this tenant'
      });
    }
    const currentStyling = await tenantStylingService.getTenantStyling(tenantId);
    const previewStyling = tenantStylingService.deepMerge(currentStyling, stylingUpdates);
    const previewCSS = tenantStylingService.generateCSSVariables(previewStyling);
    res.json({ success: true, data: { styling: previewStyling, css: previewCSS } });
  } catch (error) {
    console.error('Error previewing styling changes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview styling changes',
      error: error.message
    });
  }
};

/**
 * Export tenant styling as JSON
 */
exports.exportTenantStyling = async (req, res) => {
  try {
    const { tenantId } = req.params;
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this tenant'
      });
    }
    const styling = await tenantStylingService.getTenantStyling(tenantId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="tenant-${tenantId}-styling.json"`);
    res.json(styling);
  } catch (error) {
    console.error('Error exporting tenant styling:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export tenant styling',
      error: error.message
    });
  }
};

/**
 * Import tenant styling from JSON
 */
exports.importTenantStyling = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const importedStyling = req.body;
    if (req.user.role !== 'super_admin' && req.user.tenant_id !== tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this tenant'
      });
    }
    if (!importedStyling.branding || !importedStyling.typography) {
      return res.status(400).json({
        success: false,
        message: 'Invalid styling structure'
      });
    }
    const updatedStyling = await tenantStylingService.updateTenantStyling(tenantId, importedStyling);
    res.json({
      success: true, message: 'Tenant styling imported successfully', data: updatedStyling
    });
  } catch (error) {
    console.error('Error importing tenant styling:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import tenant styling',
      error: error.message
    });
  }
};
