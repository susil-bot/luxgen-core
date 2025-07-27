const express = require('express');
const { body, param, query } = require('express-validator');
const userManagementController = require('../controllers/userManagementController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
// const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const createUserValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['user', 'trainer', 'admin'])
    .withMessage('Role must be one of: user, trainer, admin'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone must be less than 20 characters'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company must be less than 100 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const updateUserValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['user', 'trainer', 'admin'])
    .withMessage('Role must be one of: user, trainer, admin'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone must be less than 20 characters'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company must be less than 100 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

const bulkActionValidation = [
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('User IDs array is required with at least one user'),
  body('userIds.*')
    .isMongoId()
    .withMessage('Each user ID must be a valid MongoDB ID'),
  body('action')
    .isIn(['activate', 'deactivate', 'delete', 'changeRole'])
    .withMessage('Action must be one of: activate, deactivate, delete, changeRole'),
  body('data.role')
    .optional()
    .isIn(['user', 'trainer', 'admin'])
    .withMessage('Role must be one of: user, trainer, admin')
];

const resetPasswordValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

const suspendUserValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('role')
    .optional()
    .isIn(['user', 'trainer', 'admin'])
    .withMessage('Role must be one of: user, trainer, admin'),
  query('isActive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isActive must be true or false'),
  query('isVerified')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isVerified must be true or false'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must be less than 100 characters')
];

// User CRUD operations
router.get('/', userManagementController.getAllUsers);
router.get('/:userId', userManagementController.getUserById);
router.post('/', userManagementController.createUser);
router.put('/:userId', userManagementController.updateUser);
router.delete('/:userId', userManagementController.deleteUser);

// Bulk operations (admin only)
router.post('/bulk-action', requireAdmin, userManagementController.bulkUserAction);

// User health and monitoring
router.get('/:userId/health', userManagementController.getUserHealth);

// User management actions (admin only)
router.post('/:userId/reset-password', requireAdmin, userManagementController.resetUserPassword);
router.post('/:userId/suspend', requireAdmin, userManagementController.suspendUser);
router.post('/:userId/activate', requireAdmin, userManagementController.activateUser);

module.exports = router; 