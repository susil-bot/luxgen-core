/**
 * LUXGEN BRAND IDENTITY ROUTES
 * Comprehensive brand identity management API endpoints
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const brandIdentityService = require('../services/BrandIdentityService');
const { validateRequest } = require('../middleware/validation');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
  },
  fileFilter: (req, file, cb) => {
    // Allow images and certain file types
    const allowedTypes = /jpeg|jpg|png|gif|svg|ico|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * GET /api/v1/brand-identity/:tenantId
 * Get tenant brand identity
 */
router.get('/:tenantId',
  async (req, res) => {
    try {
      const brandIdentity = await brandIdentityService.getTenantBrandIdentity(req.params.tenantId);
      res.json({
        success: true,
        data: brandIdentity,
        message: 'Brand identity retrieved successfully'
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
 * PUT /api/v1/brand-identity/:tenantId
 * Update tenant brand identity
 */
router.put('/:tenantId',
  [
    body('name').optional().isString().isLength({ min: 1, max: 255 }),
    body('colors.primary').optional().isHexColor(),
    body('colors.secondary').optional().isHexColor(),
    body('colors.accent').optional().isHexColor(),
    body('typography.primary.fontFamily').optional().isString(),
    body('typography.secondary.fontFamily').optional().isString(),
    body('spacing.xs').optional().isString(),
    body('spacing.sm').optional().isString(),
    body('spacing.md').optional().isString(),
    body('spacing.lg').optional().isString(),
    body('spacing.xl').optional().isString(),
    body('decorations.borderRadius.sm').optional().isString(),
    body('decorations.borderRadius.md').optional().isString(),
    body('decorations.borderRadius.lg').optional().isString(),
    body('customCSS').optional().isString(),
    body('customJS').optional().isString()
  ],
  validateRequest,
  authenticateToken,
  authorizeRoles(['admin', 'superadmin']),
  async (req, res) => {
    try {
      const result = await brandIdentityService.updateTenantBrandIdentity(req.params.tenantId, req.body);
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
 * GET /api/v1/brand-identity/:tenantId/css
 * Get tenant CSS
 */
router.get('/:tenantId/css',
  async (req, res) => {
    try {
      const css = await brandIdentityService.generateTenantCSS(req.params.tenantId);
      res.set('Content-Type', 'text/css');
      res.send(css);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * GET /api/v1/brand-identity/:tenantId/js
 * Get tenant JavaScript
 */
router.get('/:tenantId/js',
  async (req, res) => {
    try {
      const js = await brandIdentityService.generateTenantJS(req.params.tenantId);
      res.set('Content-Type', 'application/javascript');
      res.send(js);
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * POST /api/v1/brand-identity/:tenantId/assets/:assetType
 * Upload brand asset
 */
router.post('/:tenantId/assets/:assetType',
  upload.single('asset'),
  authenticateToken,
  authorizeRoles(['admin', 'superadmin']),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const result = await brandIdentityService.uploadBrandAsset(
        req.params.tenantId,
        req.params.assetType,
        req.file
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
 * DELETE /api/v1/brand-identity/:tenantId/assets/:assetType
 * Delete brand asset
 */
router.delete('/:tenantId/assets/:assetType',
  authenticateToken,
  authorizeRoles(['admin', 'superadmin']),
  async (req, res) => {
    try {
      const result = await brandIdentityService.deleteBrandAsset(
        req.params.tenantId,
        req.params.assetType
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
 * GET /api/v1/brand-identity/:tenantId/assets
 * Get all brand assets
 */
router.get('/:tenantId/assets',
  async (req, res) => {
    try {
      const assets = await brandIdentityService.getTenantAssets(req.params.tenantId);
      res.json({
        success: true,
        data: assets,
        message: 'Brand assets retrieved successfully'
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
 * POST /api/v1/brand-identity/:tenantId/reset
 * Reset brand identity to default
 */
router.post('/:tenantId/reset',
  authenticateToken,
  authorizeRoles(['admin', 'superadmin']),
  async (req, res) => {
    try {
      const result = await brandIdentityService.resetToDefault(req.params.tenantId);
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
 * GET /api/v1/brand-identity/:tenantId/preview
 * Get brand identity preview
 */
router.get('/:tenantId/preview',
  async (req, res) => {
    try {
      const preview = await brandIdentityService.generatePreview(req.params.tenantId);
      res.json({
        success: true,
        data: preview,
        message: 'Brand identity preview generated successfully'
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
 * POST /api/v1/brand-identity/:tenantId/validate
 * Validate brand identity configuration
 */
router.post('/:tenantId/validate',
  [
    body('colors').optional().isObject(),
    body('typography').optional().isObject(),
    body('spacing').optional().isObject(),
    body('decorations').optional().isObject()
  ],
  validateRequest,
  async (req, res) => {
    try {
      const validation = await brandIdentityService.validateBrandIdentity(
        req.params.tenantId,
        req.body
      );

      res.json({
        success: true,
        data: validation,
        message: 'Brand identity validation completed'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * GET /api/v1/brand-identity/templates
 * Get available brand templates
 */
router.get('/templates',
  async (req, res) => {
    try {
      const templates = await brandIdentityService.getAvailableTemplates();
      res.json({
        success: true,
        data: templates,
        message: 'Brand templates retrieved successfully'
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
 * POST /api/v1/brand-identity/:tenantId/apply-template
 * Apply brand template
 */
router.post('/:tenantId/apply-template',
  [
    body('templateId').notEmpty().withMessage('Template ID is required')
  ],
  validateRequest,
  authenticateToken,
  authorizeRoles(['admin', 'superadmin']),
  async (req, res) => {
    try {
      const result = await brandIdentityService.applyTemplate(
        req.params.tenantId,
        req.body.templateId
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

module.exports = router;