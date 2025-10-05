const express = require('express');
const router = express.Router();
const TenantDatabaseMiddleware = require('../middleware/tenantDatabaseMiddleware');
const tenantDatabaseManager = require('../config/tenant/TenantDatabaseManager');
const tenantConfigSwitcher = require('../config/tenant/TenantConfigSwitcher');

/**
 * TENANT DATABASE ROUTES
 * API endpoints for tenant database management
 */

// Get tenant database statistics
router.get('/stats/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const stats = await tenantDatabaseManager.getTenantDatabaseStats(tenantId);
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('❌ Failed to get tenant stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List all tenant databases
router.get('/databases', async (req, res) => {
  try {
    const databases = await tenantDatabaseManager.listTenantDatabases();
    
    res.json({
      success: true,
      databases: databases
    });
  } catch (error) {
    console.error('❌ Failed to list tenant databases:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check for all tenant databases
router.get('/health', async (req, res) => {
  try {
    const activeConnections = tenantDatabaseManager.getActiveConnections();
    const healthChecks = [];
    
    for (const connection of activeConnections) {
      const health = await tenantDatabaseManager.healthCheck(connection.tenantId);
      healthChecks.push({
        tenantId: connection.tenantId,
        databaseName: connection.databaseName,
        ...health
      });
    }
    
    res.json({
      success: true,
      healthChecks: healthChecks,
      totalConnections: activeConnections.length
    });
  } catch (error) {
    console.error('❌ Failed to perform health checks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get tenant statistics
router.get('/statistics', async (req, res) => {
  try {
    const statistics = await tenantConfigSwitcher.getTenantStatistics();
    
    res.json({
      success: true,
      statistics: statistics
    });
  } catch (error) {
    console.error('❌ Failed to get tenant statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Initialize tenant database
router.post('/initialize/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { connection, models } = await tenantDatabaseManager.initializeTenantDatabase(tenantId);
    
    res.json({
      success: true,
      message: `Tenant database initialized for ${tenantId}`,
      databaseName: tenantDatabaseManager.getTenantDatabaseName(tenantId)
    });
  } catch (error) {
    console.error('❌ Failed to initialize tenant database:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Close tenant database connection
router.delete('/close/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    await tenantDatabaseManager.closeTenantConnection(tenantId);
    
    res.json({
      success: true,
      message: `Tenant database connection closed for ${tenantId}`
    });
  } catch (error) {
    console.error('❌ Failed to close tenant database:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Drop tenant database (for cleanup)
router.delete('/drop/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    await tenantDatabaseManager.dropTenantDatabase(tenantId);
    
    res.json({
      success: true,
      message: `Tenant database dropped for ${tenantId}`
    });
  } catch (error) {
    console.error('❌ Failed to drop tenant database:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get tenant configuration
router.get('/config/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const config = tenantConfigSwitcher.getTenantConfig(tenantId);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Tenant configuration not found'
      });
    }
    
    res.json({
      success: true,
      config: config
    });
  } catch (error) {
    console.error('❌ Failed to get tenant config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Check tenant limits
router.get('/limits/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const limits = await tenantConfigSwitcher.checkTenantLimits(tenantId);
    
    res.json({
      success: true,
      limits: limits
    });
  } catch (error) {
    console.error('❌ Failed to check tenant limits:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all available tenants
router.get('/tenants', async (req, res) => {
  try {
    const tenants = tenantConfigSwitcher.getAllTenants();
    
    res.json({
      success: true,
      tenants: tenants
    });
  } catch (error) {
    console.error('❌ Failed to get tenants:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cleanup tenant resources
router.delete('/cleanup/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    await tenantConfigSwitcher.cleanupTenant(tenantId);
    
    res.json({
      success: true,
      message: `Tenant resources cleaned up for ${tenantId}`
    });
  } catch (error) {
    console.error('❌ Failed to cleanup tenant:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cleanup all tenant resources
router.delete('/cleanup', async (req, res) => {
  try {
    await tenantConfigSwitcher.cleanupAll();
    
    res.json({
      success: true,
      message: 'All tenant resources cleaned up'
    });
  } catch (error) {
    console.error('❌ Failed to cleanup all tenants:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
