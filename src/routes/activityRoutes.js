const express = require('express');
const { body, param, query } = require('express-validator');
const activityController = require('../controllers/activityController');
const { authenticateToken } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { validateRequest } = require('../middleware/validation');

const router = express.Router();

// Validation rules
const activityValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title must be less than 200 characters'),
  
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn([
      'user_joined',
      'program_created',
      'session_completed',
      'assessment_taken',
      'training_started',
      'certificate_earned',
      'feedback_submitted',
      'poll_created',
      'announcement',
      'milestone_reached',
      'general'
    ])
    .withMessage('Invalid activity type'),
  
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'tenant_only'])
    .withMessage('Invalid visibility setting'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

const actionValidation = [
  body('action')
    .notEmpty()
    .withMessage('Action is required')
    .isIn(['likes', 'comments', 'shares', 'views'])
    .withMessage('Invalid action type'),
  
  body('amount')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Amount must be a positive integer')
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
  
  query('type')
    .optional()
    .isIn([
      'user_joined',
      'program_created',
      'session_completed',
      'assessment_taken',
      'training_started',
      'certificate_earned',
      'feedback_submitted',
      'poll_created',
      'announcement',
      'milestone_reached',
      'general'
    ])
    .withMessage('Invalid activity type'),
  
  query('visibility')
    .optional()
    .isIn(['public', 'private', 'tenant_only'])
    .withMessage('Invalid visibility setting'),
  
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('DateFrom must be a valid ISO 8601 date'),
  
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('DateTo must be a valid ISO 8601 date')
];

const idValidation = [
  param('id')
    .notEmpty()
    .withMessage('Activity ID is required')
    .isLength({ min: 1 })
    .withMessage('Activity ID cannot be empty')
];

const userIdValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format')
];

const typeValidation = [
  param('type')
    .notEmpty()
    .withMessage('Activity type is required')
    .isIn([
      'user_joined',
      'program_created',
      'session_completed',
      'assessment_taken',
      'training_started',
      'certificate_earned',
      'feedback_submitted',
      'poll_created',
      'announcement',
      'milestone_reached',
      'general'
    ])
    .withMessage('Invalid activity type')
];

// Apply middleware to all routes
router.use(authenticateToken);
router.use(tenantMiddleware);

/**
 * @route   GET /api/activities
 * @desc    Get activities for a tenant with filtering and pagination
 * @access  Private
 */
router.get('/', queryValidation, validateRequest, activityController.getActivities);

/**
 * @route   GET /api/activities/stats
 * @desc    Get activity statistics for a tenant
 * @access  Private
 */
router.get('/stats', activityController.getActivityStats);

/**
 * @route   GET /api/activities/search
 * @desc    Search activities by text
 * @access  Private
 */
router.get('/search', [
  query('q')
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
], validateRequest, activityController.searchActivities);

/**
 * @route   GET /api/activities/user/:userId
 * @desc    Get activities by user
 * @access  Private
 */
router.get('/user/:userId', userIdValidation, queryValidation, validateRequest, activityController.getActivitiesByUser);

/**
 * @route   GET /api/activities/type/:type
 * @desc    Get activities by type
 * @access  Private
 */
router.get('/type/:type', typeValidation, queryValidation, validateRequest, activityController.getActivitiesByType);

/**
 * @route   GET /api/activities/:id
 * @desc    Get a specific activity by ID
 * @access  Private
 */
router.get('/:id', idValidation, validateRequest, activityController.getActivityById);

/**
 * @route   GET /api/activities/:id/engagement
 * @desc    Get activity engagement metrics
 * @access  Private
 */
router.get('/:id/engagement', idValidation, validateRequest, activityController.getActivityEngagement);

/**
 * @route   POST /api/activities
 * @desc    Create a new activity
 * @access  Private
 */
router.post('/', activityValidation, validateRequest, activityController.createActivity);

/**
 * @route   POST /api/activities/:id/actions
 * @desc    Perform an action on an activity (like, comment, share)
 * @access  Private
 */
router.post('/:id/actions', idValidation, actionValidation, validateRequest, activityController.performActivityAction);

/**
 * @route   PUT /api/activities/:id
 * @desc    Update an activity
 * @access  Private
 */
router.put('/:id', idValidation, activityValidation, validateRequest, activityController.updateActivity);

/**
 * @route   DELETE /api/activities/:id
 * @desc    Delete an activity (soft delete)
 * @access  Private
 */
router.delete('/:id', idValidation, validateRequest, activityController.deleteActivity);

module.exports = router;
