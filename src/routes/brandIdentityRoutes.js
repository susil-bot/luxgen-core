/**
 * Brand Identity Routes
 * API endpoints for managing brand identity configurations
 */

const express = require('express');
const router = express.Router();
const brandIdentityService = require('../services/BrandIdentityService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const TenantMiddleware = require('../middleware/tenantMiddleware');
const { 
  brandIdentityMiddleware, 
  validateBrandRequest, 
  requireBrandIdentity 
} = require('../middleware/brandIdentityMiddleware');
const logger = require('../utils/logger');

// Apply middleware to all routes
router.use(TenantMiddleware.identifyTenant());
router.use(brandIdentityMiddleware);

/**
 * @route GET /api/v1/brand-identity
 * @desc Get current brand identity for tenant
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const brandId = req.brandId;
    
    const brandIdentity = await brandIdentityService.getBrandIdentity(tenantId, brandId);
    
    res.json({
      success: true,
      data: {
        tenantId,
        brandId,
        brandIdentity
      }
    });
  } catch (error) {
    logger.error('Failed to get brand identity', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get brand identity',
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/brand-identity/available
 * @desc Get available brand identities for tenant
 * @access Private
 */
router.get('/available', async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const availableBrands = await brandIdentityService.getAvailableBrands(tenantId);
    
    res.json({
      success: true,
      data: {
        tenantId,
        availableBrands
      }
    });
  } catch (error) {
    logger.error('Failed to get available brands', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available brands',
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/brand-identity/:brandId
 * @desc Get specific brand identity
 * @access Private
 */
router.get('/:brandId', validateBrandRequest, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { brandId } = req.params;
    
    const brandIdentity = await brandIdentityService.getBrandIdentity(tenantId, brandId);
    
    res.json({
      success: true,
      data: {
        tenantId,
        brandId,
        brandIdentity
      }
    });
  } catch (error) {
    logger.error(`Failed to get brand identity: ${req.params.brandId}`, error);
    res.status(404).json({
      success: false,
      message: 'Brand identity not found',
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/brand-identity/:brandId
 * @desc Create new brand identity
 * @access Private (Admin only)
 */
router.post('/:brandId', authenticateToken, requireAdmin, validateBrandRequest, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { brandId } = req.params;
    const brandIdentity = req.body;
    
    const createdBrand = await brandIdentityService.createBrandIdentity(tenantId, brandId, brandIdentity);
    
    res.status(201).json({
      success: true,
      message: 'Brand identity created successfully',
      data: {
        tenantId,
        brandId,
        brandIdentity: createdBrand
      }
    });
  } catch (error) {
    logger.error(`Failed to create brand identity: ${req.params.brandId}`, error);
    res.status(400).json({
      success: false,
      message: 'Failed to create brand identity',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/v1/brand-identity/:brandId
 * @desc Update brand identity
 * @access Private (Admin only)
 */
router.put('/:brandId', authenticateToken, requireAdmin, validateBrandRequest, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { brandId } = req.params;
    const brandIdentity = req.body;
    
    const updatedBrand = await brandIdentityService.updateBrandIdentity(tenantId, brandId, brandIdentity);
    
    res.json({
      success: true,
      message: 'Brand identity updated successfully',
      data: {
        tenantId,
        brandId,
        brandIdentity: updatedBrand
      }
    });
  } catch (error) {
    logger.error(`Failed to update brand identity: ${req.params.brandId}`, error);
    res.status(400).json({
      success: false,
      message: 'Failed to update brand identity',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/v1/brand-identity/:brandId
 * @desc Delete brand identity
 * @access Private (Admin only)
 */
router.delete('/:brandId', authenticateToken, requireAdmin, validateBrandRequest, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { brandId } = req.params;
    
    await brandIdentityService.deleteBrandIdentity(tenantId, brandId);
    
    res.json({
      success: true,
      message: 'Brand identity deleted successfully',
      data: {
        tenantId,
        brandId
      }
    });
  } catch (error) {
    logger.error(`Failed to delete brand identity: ${req.params.brandId}`, error);
    res.status(400).json({
      success: false,
      message: 'Failed to delete brand identity',
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/brand-identity/:brandId/assets
 * @desc Get brand assets
 * @access Private
 */
router.get('/:brandId/assets', validateBrandRequest, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { brandId } = req.params;
    
    const assets = await brandIdentityService.getBrandAssets(tenantId, brandId);
    
    res.json({
      success: true,
      data: {
        tenantId,
        brandId,
        assets
      }
    });
  } catch (error) {
    logger.error(`Failed to get brand assets: ${req.params.brandId}`, error);
    res.status(404).json({
      success: false,
      message: 'Brand assets not found',
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/brand-identity/:brandId/css
 * @desc Get brand CSS variables
 * @access Public
 */
router.get('/:brandId/css', validateBrandRequest, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { brandId } = req.params;
    
    const brandIdentity = await brandIdentityService.getBrandIdentity(tenantId, brandId);
    const cssVariables = brandIdentityService.generateCSSVariables(brandIdentity);
    
    res.set('Content-Type', 'text/css');
    res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(cssVariables);
  } catch (error) {
    logger.error(`Failed to generate brand CSS: ${req.params.brandId}`, error);
    res.status(404).json({
      success: false,
      message: 'Brand CSS not found',
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/brand-identity/:brandId/health
 * @desc Get brand identity health status
 * @access Private
 */
router.get('/:brandId/health', validateBrandRequest, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { brandId } = req.params;
    
    const health = await brandIdentityService.getBrandHealth(tenantId, brandId);
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error(`Failed to get brand health: ${req.params.brandId}`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get brand health',
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/brand-identity/:brandId/clear-cache
 * @desc Clear brand identity cache
 * @access Private (Admin only)
 */
router.post('/:brandId/clear-cache', authenticateToken, requireAdmin, validateBrandRequest, async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { brandId } = req.params;
    
    brandIdentityService.clearCache(tenantId, brandId);
    
    res.json({
      success: true,
      message: 'Brand identity cache cleared successfully',
      data: {
        tenantId,
        brandId
      }
    });
  } catch (error) {
    logger.error(`Failed to clear brand cache: ${req.params.brandId}`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear brand cache',
      error: error.message
    });
  }
});

module.exports = router;
