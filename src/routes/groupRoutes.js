const express = require('express');
const { body, param, query } = require('express-validator');
const groupController = require('../controllers/groupController');
const { authenticateToken, requireAdmin, requireTrainer } = require('../middleware/auth');
// const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const createGroupValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('trainerId')
    .isMongoId()
    .withMessage('Valid trainer ID is required'),
  body('maxSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max size must be between 1 and 100'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category must be less than 50 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Each tag must be less than 30 characters')
];

const updateGroupValidation = [
  param('groupId')
    .isMongoId()
    .withMessage('Valid group ID is required'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('trainerId')
    .optional()
    .isMongoId()
    .withMessage('Valid trainer ID is required'),
  body('maxSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max size must be between 1 and 100'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category must be less than 50 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Each tag must be less than 30 characters')
];

const addMemberValidation = [
  param('groupId')
    .isMongoId()
    .withMessage('Valid group ID is required'),
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  body('role')
    .optional()
    .isIn(['member', 'leader', 'assistant'])
    .withMessage('Role must be one of: member, leader, assistant')
];

const updateMemberRoleValidation = [
  param('groupId')
    .isMongoId()
    .withMessage('Valid group ID is required'),
  param('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  body('role')
    .isIn(['member', 'leader', 'assistant'])
    .withMessage('Role must be one of: member, leader, assistant')
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
  query('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category must be less than 50 characters'),
  query('trainerId')
    .optional()
    .isMongoId()
    .withMessage('Valid trainer ID is required'),
  query('isActive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isActive must be true or false'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term must be less than 100 characters')
];

// Group CRUD operations
router.get('/', groupController.getAllGroups);
router.get('/:groupId', groupController.getGroupById);
router.post('/', groupController.createGroup);
router.put('/:groupId', groupController.updateGroup);
router.delete('/:groupId', groupController.deleteGroup);

// Group member management
router.get('/:groupId/members', groupController.getGroupMembers);
router.post('/:groupId/members', groupController.addMemberToGroup);
router.delete('/:groupId/members/:userId', groupController.removeMemberFromGroup);
router.put('/:groupId/members/:userId', groupController.updateMemberRole);

// Group performance and analytics
router.get('/:groupId/performance', groupController.getGroupPerformance);

module.exports = router; 