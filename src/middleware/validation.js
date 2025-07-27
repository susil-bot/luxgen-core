const { body, query, param, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');


// Enhanced validation middleware for express-validator
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
      type: error.type
    }));

    throw new ValidationError('Validation failed', errorDetails);
  }
  next();
}
// Custom validation middleware for AI routes
const validateRequestCustom = (validationRules) => {
  return (req, res, next) => {
    try {
      const errors = [];

      for (const rule of validationRules) {
        const { field, type, required, minLength, maxLength, min, max, enum: enumValues } = rule;
        const value = req.body[field];


        // Check if required
        if (required && (value === undefined || value === null || value === '')) {
          errors.push({
            field,
            message: `${field} is required`,
            type: 'required'
          });
          continue;
        }
        // Skip validation if value is not provided and not required
        if (value === undefined || value === null || value === '') {
          continue;
        }
        // Type validation
        if (type === 'string' && typeof value !== 'string') {
          errors.push({
            field,
            message: `${field} must be a string`,
            type: 'type'
          });
        } else if (type === 'number' && typeof value !== 'number') {
          errors.push({
            field,
            message: `${field} must be a number`,
            type: 'type'
          });
        } else if (type === 'boolean' && typeof value !== 'boolean') {
          errors.push({
            field,
            message: `${field} must be a boolean`,
            type: 'type'
          });
        } else if (type === 'object' && typeof value !== 'object') {
          errors.push({
            field,
            message: `${field} must be an object`,
            type: 'type'
          });
        } else if (type === 'array' && !Array.isArray(value)) {
          errors.push({
            field,
            message: `${field} must be an array`,
            type: 'type'
          });
        }
        // String-specific validations
        if (type === 'string' && typeof value === 'string') {
          if (minLength && value.length < minLength) {
            errors.push({
              field,
              message: `${field} must be at least ${minLength} characters long`,
              type: 'minLength'
            });
          }
          if (maxLength && value.length > maxLength) {
            errors.push({
              field,
              message: `${field} cannot exceed ${maxLength} characters`,
              type: 'maxLength'
            });
          } }
        // Number-specific validations
        if (type === 'number' && typeof value === 'number') {
          if (min !== undefined && value < min) {
            errors.push({
              field,
              message: `${field} must be at least ${min}`,
              type: 'min'
            });
          }
          if (max !== undefined && value > max) {
            errors.push({
              field,
              message: `${field} cannot exceed ${max}`,
              type: 'max'
            });
          } }
        // Enum validation
        if (enumValues && !enumValues.includes(value)) {
          errors.push({
            field,
            message: `${field} must be one of: ${enumValues.join(', ')}`,
            type: 'enum'
          });
        } }
      if (errors.length > 0) {
        throw new ValidationError('Validation failed', errors);
      }
      next();
    } catch (error) {
      next(error);
    } }
}
// Enhanced password validation with strong requirements
const strongPasswordValidation = [
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)')
    .custom((value) => {
      // Check for common weak passwords
      const weakPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
      if (weakPasswords.includes(value.toLowerCase())) {
        throw new Error('Password is too common. Please choose a stronger password.');
      }
      return true;
    })
];


// Enhanced email validation with additional checks
const enhancedEmailValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .custom(async (value) => {
      // Check for disposable email domains
      const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
      const domain = value.split('@')[1];
      if (disposableDomains.includes(domain)) {
        throw new Error('Disposable email addresses are not allowed');
      }
      return true;
    })
];


// Common validation rules
const commonValidations = {
  id: param('id').isMongoId().withMessage('Invalid ID format'),
  email: body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  password: body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  name: body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  description: body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isString().withMessage('SortBy must be a string'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('SortOrder must be asc or desc')
  ]
}
// User validation schemas
const userValidations = {
  register: [
    ...enhancedEmailValidation,
    ...strongPasswordValidation,
    body('firstName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
    body('lastName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
    body('role')
      .optional()
      .isIn(['admin', 'trainer', 'participant'])
      .withMessage('Role must be admin, trainer, or participant'),
    validateRequest
  ],
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    validateRequest
  ],
  update: [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s'-]+$/)
      .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
    body('role')
      .optional()
      .isIn(['admin', 'trainer', 'participant'])
      .withMessage('Role must be admin, trainer, or participant'),
    validateRequest
  ],
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    ...strongPasswordValidation,
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Password confirmation does not match password');
        }
        return true;
      }),
    validateRequest
  ]
}
// Group validation schemas
const groupValidations = {
  create: [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Group name must be between 2 and 100 characters'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('type').optional().isIn(['department', 'project', 'team', 'custom']).withMessage('Invalid group type'),
    validateRequest
  ],

  update: [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Group name must be between 2 and 100 characters'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('type').optional().isIn(['department', 'project', 'team', 'custom']).withMessage('Invalid group type'),
    validateRequest
  ],

  addMember: [
    body('userId').isMongoId().withMessage('Invalid user ID'),
    body('role').optional().isIn(['member', 'leader', 'admin']).withMessage('Invalid member role'),
    validateRequest
  ]
}
// Poll validation schemas
const pollValidations = {
  create: [
    body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    body('questions').isArray({ min: 1 }).withMessage('At least one question is required'),
    body('questions.*.question').trim().isLength({ min: 3, max: 500 }).withMessage('Question must be between 3 and 500 characters'),
    body('questions.*.type').isIn(['multiple-choice', 'single-choice', 'text', 'rating']).withMessage('Invalid question type'),
    body('questions.*.options').optional().isArray().withMessage('Options must be an array'),
    body('settings.allowMultipleResponses').optional().isBoolean().withMessage('Allow multiple responses must be boolean'),
    body('settings.anonymous').optional().isBoolean().withMessage('Anonymous must be boolean'),
    validateRequest
  ],

  update: [
    body('title').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    body('questions').optional().isArray({ min: 1 }).withMessage('At least one question is required'),
    validateRequest
  ],

  submitResponse: [
    body('responses').isArray({ min: 1 }).withMessage('At least one response is required'),
    body('responses.*.questionId').isMongoId().withMessage('Invalid question ID'),
    body('responses.*.answer').notEmpty().withMessage('Answer is required'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('name').optional().trim().isLength({ max: 100 }).withMessage('Name must be less than 100 characters'),
    validateRequest
  ]
}
// Training validation schemas
const trainingValidations = {
  session: {
    create: [
      body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
      body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
      body('sessionType').isIn(['workshop', 'seminar', 'webinar', 'hands-on', 'lecture', 'assessment']).withMessage('Invalid session type'),
      body('duration').isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),
      body('scheduledAt').isISO8601().withMessage('Invalid scheduled date'),
      body('endAt').isISO8601().withMessage('Invalid end date'),
      body('location').optional().trim().isLength({ max: 200 }).withMessage('Location must be less than 200 characters'),
      body('maxParticipants').optional().isInt({ min: 1 }).withMessage('Max participants must be a positive integer'),
      validateRequest
    ],

    update: [
      body('title').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
      body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
      body('sessionType').optional().isIn(['workshop', 'seminar', 'webinar', 'hands-on', 'lecture', 'assessment']).withMessage('Invalid session type'),
      body('duration').optional().isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),
      body('scheduledAt').optional().isISO8601().withMessage('Invalid scheduled date'),
      body('endAt').optional().isISO8601().withMessage('Invalid end date'),
      validateRequest
    ],

    addParticipant: [
      body('userId').isMongoId().withMessage('Invalid user ID'),
      validateRequest
    ],

    markAttendance: [
      body('userId').isMongoId().withMessage('Invalid user ID'),
      body('status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Invalid attendance status'),
      body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters'),
      validateRequest
    ]
  },

  course: {
    create: [
      body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
      body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description must be less than 2000 characters'),
      body('courseCode').trim().isLength({ min: 3, max: 50 }).withMessage('Course code must be between 3 and 50 characters'),
      body('level').isIn(['beginner', 'intermediate', 'advanced', 'expert']).withMessage('Invalid level'),
      body('estimatedDuration').isInt({ min: 30, max: 1440 }).withMessage('Estimated duration must be between 30 and 1440 minutes'),
      body('maxEnrollment').optional().isInt({ min: 1 }).withMessage('Max enrollment must be a positive integer'),
      validateRequest
    ],

    enroll: [
      body('userId').optional().isMongoId().withMessage('Invalid user ID'),
      validateRequest
    ]
  },

  module: {
    create: [
      body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
      body('moduleCode').trim().isLength({ min: 3, max: 50 }).withMessage('Module code must be between 3 and 50 characters'),
      body('estimatedDuration').isInt({ min: 5, max: 480 }).withMessage('Estimated duration must be between 5 and 480 minutes'),
      body('content').isArray({ min: 1 }).withMessage('At least one content item is required'),
      validateRequest
    ]
  },

  assessment: {
    create: [
      body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
      body('assessmentCode').trim().isLength({ min: 3, max: 50 }).withMessage('Assessment code must be between 3 and 50 characters'),
      body('type').isIn(['quiz', 'exam', 'project', 'presentation', 'survey', 'evaluation']).withMessage('Invalid assessment type'),
      body('questions').isArray({ min: 1 }).withMessage('At least one question is required'),
      validateRequest
    ],

    submit: [
      body('answers').isArray({ min: 1 }).withMessage('At least one answer is required'),
      body('answers.*.questionId').isString().withMessage('Question ID is required'),
      body('answers.*.answer').notEmpty().withMessage('Answer is required'),
      validateRequest
    ]
  } }
// Presentation validation schemas
const presentationValidations = {
  create: [
    body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
    body('presentationCode').trim().isLength({ min: 3, max: 50 }).withMessage('Presentation code must be between 3 and 50 characters'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    body('estimatedDuration').optional().isInt({ min: 5, max: 480 }).withMessage('Estimated duration must be between 5 and 480 minutes'),
    validateRequest
  ],

  update: [
    body('title').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    body('estimatedDuration').optional().isInt({ min: 5, max: 480 }).withMessage('Estimated duration must be between 5 and 480 minutes'),
    validateRequest
  ],

  startSession: [
    body('sessionTitle').optional().trim().isLength({ max: 200 }).withMessage('Session title must be less than 200 characters'),
    body('scheduledAt').optional().isISO8601().withMessage('Invalid scheduled date'),
    validateRequest
  ],

  addSlide: [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Slide title must be between 1 and 200 characters'),
    body('type').isIn(['content', 'poll', 'question', 'break', 'video', 'interactive']).withMessage('Invalid slide type'),
    body('content').optional().isObject().withMessage('Content must be an object'),
    validateRequest
  ],

  activatePoll: [
    body('duration').optional().isInt({ min: 30, max: 300 }).withMessage('Poll duration must be between 30 and 300 seconds'),
    validateRequest
  ],

  submitPollResponse: [
    body('response').notEmpty().withMessage('Poll response is required'),
    validateRequest
  ]
}
// AI validation schemas
const aiValidations = {
  generate: [
    body('prompt').trim().isLength({ min: 1, max: 5000 }).withMessage('Prompt must be between 1 and 5000 characters'),
    body('model').optional().isString().withMessage('Model must be a string'),
    body('maxTokens').optional().isInt({ min: 1, max: 4000 }).withMessage('Max tokens must be between 1 and 4000'),
    body('temperature').optional().isFloat({ min: 0, max: 2 }).withMessage('Temperature must be between 0 and 2'),
    body('useRAG').optional().isBoolean().withMessage('Use RAG must be boolean'),
    validateRequest
  ],

  specialized: [
    body('type').isIn(['training_material', 'assessment_questions', 'feedback_template', 'presentation_outline', 'email_template']).withMessage('Invalid type'),
    body('prompt').trim().isLength({ min: 1, max: 5000 }).withMessage('Prompt must be between 1 and 5000 characters'),
    body('context').optional().trim().isLength({ max: 10000 }).withMessage('Context must be less than 10000 characters'),
    validateRequest
  ],

  enhancedContent: [
    body('prompt').trim().isLength({ min: 1, max: 10000 }).withMessage('Prompt must be between 1 and 10000 characters'),
    body('contentType').optional().isIn(['article', 'blog', 'email', 'report', 'presentation', 'training']).withMessage('Invalid content type'),
    body('targetAudience').optional().trim().isLength({ max: 200 }).withMessage('Target audience must be less than 200 characters'),
    body('tone').optional().isIn(['professional', 'casual', 'formal', 'friendly', 'technical']).withMessage('Invalid tone'),
    body('length').optional().isIn(['short', 'medium', 'long']).withMessage('Invalid length'),
    validateRequest
  ],

  trainingMaterial: [
    body('topic').trim().isLength({ min: 1, max: 200 }).withMessage('Topic must be between 1 and 200 characters'),
    body('level').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid level'),
    body('duration').isIn(['15min', '30min', '1hour', '2hours', '4hours']).withMessage('Invalid duration'),
    body('format').isIn(['slides', 'document', 'video-script', 'interactive']).withMessage('Invalid format'),
    body('learningObjectives').optional().isArray().withMessage('Learning objectives must be an array'),
    validateRequest
  ],

  assessmentQuestions: [
    body('topic').trim().isLength({ min: 1, max: 200 }).withMessage('Topic must be between 1 and 200 characters'),
    body('questionType').isIn(['multiple-choice', 'true-false', 'short-answer', 'essay']).withMessage('Invalid question type'),
    body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),
    body('count').isInt({ min: 1, max: 50 }).withMessage('Question count must be between 1 and 50'),
    validateRequest
  ],

  presentationOutline: [
    body('topic').trim().isLength({ min: 1, max: 200 }).withMessage('Topic must be between 1 and 200 characters'),
    body('audience').trim().isLength({ min: 1, max: 100 }).withMessage('Audience must be between 1 and 100 characters'),
    body('duration').isIn(['5min', '10min', '15min', '30min', '45min', '60min']).withMessage('Invalid duration'),
    body('style').isIn(['formal', 'casual', 'technical', 'storytelling']).withMessage('Invalid style'),
    validateRequest
  ],

  improveContent: [
    body('content').trim().isLength({ min: 1, max: 10000 }).withMessage('Content must be between 1 and 10000 characters'),
    body('improvementType').isIn(['grammar', 'clarity', 'tone', 'structure', 'completeness']).withMessage('Invalid improvement type'),
    body('targetAudience').optional().trim().isLength({ max: 200 }).withMessage('Target audience must be less than 200 characters'),
    validateRequest
  ],

  translateContent: [
    body('content').trim().isLength({ min: 1, max: 10000 }).withMessage('Content must be between 1 and 10000 characters'),
    body('targetLanguage').isLength({ min: 2, max: 10 }).withMessage('Target language must be between 2 and 10 characters'),
    body('sourceLanguage').optional().isLength({ min: 2, max: 10 }).withMessage('Source language must be between 2 and 10 characters'),
    body('preserveFormatting').optional().isBoolean().withMessage('Preserve formatting must be boolean'),
    validateRequest
  ]
}
// Tenant validation schemas
const tenantValidations = {
  create: [
    body('name').trim().isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),
    body('contactEmail').isEmail().normalizeEmail().withMessage('Invalid contact email'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    body('industry').optional().trim().isLength({ max: 100 }).withMessage('Industry must be less than 100 characters'),
    body('companySize').optional().isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).withMessage('Invalid company size'),
    validateRequest
  ],

  update: [
    body('name').optional().trim().isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),
    body('contactEmail').optional().isEmail().normalizeEmail().withMessage('Invalid contact email'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    body('industry').optional().trim().isLength({ max: 100 }).withMessage('Industry must be less than 100 characters'),
    body('companySize').optional().isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).withMessage('Invalid company size'),
    validateRequest
  ],

  updateSettings: [
    body('name').optional().trim().isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    body('contact').optional().isObject().withMessage('Contact must be an object'),
    body('address').optional().isObject().withMessage('Address must be an object'),
    body('business').optional().isObject().withMessage('Business must be an object'),
    body('features').optional().isObject().withMessage('Features must be an object'),
    body('branding').optional().isObject().withMessage('Branding must be an object'),
    body('security').optional().isObject().withMessage('Security must be an object'),
    body('notifications').optional().isObject().withMessage('Notifications must be an object'),
    body('integrations').optional().isObject().withMessage('Integrations must be an object'),
    body('customizations').optional().isObject().withMessage('Customizations must be an object'),
    validateRequest
  ],

  analytics: [
    query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period'),
    validateRequest
  ],

  users: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('role').optional().isIn(['user', 'trainer', 'admin']).withMessage('Invalid role'),
    query('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
    query('search').optional().trim().isLength({ max: 100 }).withMessage('Search must be less than 100 characters'),
    validateRequest
  ]
}
// Knowledge base validation schemas
const knowledgeBaseValidations = {
  add: [
    body('content').trim().isLength({ min: 1, max: 10000 }).withMessage('Content must be between 1 and 10000 characters'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    validateRequest
  ],

  search: [
    body('query').trim().isLength({ min: 1, max: 500 }).withMessage('Query must be between 1 and 500 characters'),
    body('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    body('filters').optional().isObject().withMessage('Filters must be an object'),
    validateRequest
  ]
}
module.exports = {
  validateRequest,
  validateRequestCustom,
  commonValidations,
  userValidations,
  groupValidations,
  pollValidations,
  trainingValidations,
  presentationValidations,
  aiValidations,
  tenantValidations,
  knowledgeBaseValidations
}