/**
 * Validation System
 * Provides comprehensive validation using Joi schemas
 */

const Joi = require('joi');
const { ValidationError } = require('./errors');

// Common validation patterns
const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  SLUG: /^[a-z0-9-]+$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  OBJECT_ID: /^[0-9a-fA-F]{24}$/
};

// Common validation messages
const MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  WEAK_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  INVALID_SLUG: 'Slug can only contain lowercase letters, numbers, and hyphens',
  INVALID_URL: 'Please enter a valid URL',
  INVALID_UUID: 'Please enter a valid UUID',
  INVALID_OBJECT_ID: 'Please enter a valid ID',
  MIN_LENGTH: 'This field must be at least {#limit} characters long',
  MAX_LENGTH: 'This field cannot exceed {#limit} characters',
  MIN_VALUE: 'This field must be at least {#limit}',
  MAX_VALUE: 'This field cannot exceed {#limit}',
  INVALID_ENUM: 'This field must be one of: {#valids}',
  INVALID_DATE: 'Please enter a valid date',
  FUTURE_DATE: 'Date must be in the future',
  PAST_DATE: 'Date must be in the past'
};

// Base schemas
const baseSchemas = {
  id: Joi.string().pattern(PATTERNS.OBJECT_ID).messages({
    'string.pattern.base': MESSAGES.INVALID_OBJECT_ID
  }),
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().messages({
    'string.email': MESSAGES.INVALID_EMAIL,
    'string.empty': MESSAGES.REQUIRED
  }),
  password: Joi.string().min(6).messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.empty': MESSAGES.REQUIRED
  }),
  strongPassword: Joi.string().pattern(PATTERNS.PASSWORD).messages({
    'string.pattern.base': MESSAGES.WEAK_PASSWORD,
    'string.empty': MESSAGES.REQUIRED
  }),
  phone: Joi.string().pattern(PATTERNS.PHONE).messages({
    'string.pattern.base': MESSAGES.INVALID_PHONE
  }),
  slug: Joi.string().pattern(PATTERNS.SLUG).lowercase().trim().messages({
    'string.pattern.base': MESSAGES.INVALID_SLUG
  }),
  url: Joi.string().uri().messages({
    'string.uri': MESSAGES.INVALID_URL
  }),
  date: Joi.date().iso().messages({
    'date.base': MESSAGES.INVALID_DATE
  }),
  futureDate: Joi.date().iso().greater('now').messages({
    'date.base': MESSAGES.INVALID_DATE,
    'date.greater': MESSAGES.FUTURE_DATE
  }),
  pastDate: Joi.date().iso().less('now').messages({
    'date.base': MESSAGES.INVALID_DATE,
    'date.less': MESSAGES.PAST_DATE
  }),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};

// User validation schemas
const userSchemas = {
  register: Joi.object({
    email: baseSchemas.email.required(),
    password: baseSchemas.password.required(),
    firstName: Joi.string().min(2).max(50).trim().required().messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'string.empty': MESSAGES.REQUIRED
    }),
    lastName: Joi.string().min(2).max(50).trim().required().messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'string.empty': MESSAGES.REQUIRED
    }),
    phone: baseSchemas.phone.optional(),
    company: Joi.string().max(100).trim().optional(),
    role: Joi.string().valid('user', 'trainer', 'admin', 'super_admin').default('user'),
    marketingConsent: Joi.boolean().default(false),
    tenantSlug: baseSchemas.slug.optional(),
    tenantId: baseSchemas.id.optional()
  }),
  login: Joi.object({
    email: baseSchemas.email.required(),
    password: Joi.string().required().messages({
      'string.empty': MESSAGES.REQUIRED
    })
  }),
  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50).trim().optional(),
    lastName: Joi.string().min(2).max(50).trim().optional(),
    phone: baseSchemas.phone.optional(),
    company: Joi.string().max(100).trim().optional(),
    jobTitle: Joi.string().max(100).trim().optional(),
    department: Joi.string().max(100).trim().optional(),
    bio: Joi.string().max(500).trim().optional(),
    addresses: Joi.array().items(Joi.object({
      type: Joi.string().valid('home', 'work', 'billing', 'shipping').default('home'),
      street: Joi.string().trim().optional(),
      city: Joi.string().trim().optional(),
      state: Joi.string().trim().optional(),
      country: Joi.string().trim().optional(),
      zipCode: Joi.string().trim().optional(),
      isDefault: Joi.boolean().default(false)
    })).optional(),
    preferences: Joi.object({
      notifications: Joi.object({
        email: Joi.object({
          marketing: Joi.boolean().default(false),
          updates: Joi.boolean().default(true),
          security: Joi.boolean().default(true),
          training: Joi.boolean().default(true)
        }).optional(),
        push: Joi.boolean().default(true).optional(),
        sms: Joi.boolean().default(false).optional()
      }).optional(),
      theme: Joi.string().valid('light', 'dark', 'auto').default('auto').optional(),
      language: Joi.string().default('en').optional(),
      timezone: Joi.string().default('UTC').optional()
    }).optional()
  }),
  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'string.empty': 'Current password is required'
    }),
    newPassword: baseSchemas.strongPassword.required()
  }),
  forgotPassword: Joi.object({
    email: baseSchemas.email.required()
  }),
  resetPassword: Joi.object({
    newPassword: baseSchemas.strongPassword.required()
  })
};

// Tenant validation schemas
const tenantSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).trim().required().messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters',
      'string.empty': MESSAGES.REQUIRED
    }),
    slug: baseSchemas.slug.optional(),
    description: Joi.string().max(500).trim().optional(),
    contactEmail: baseSchemas.email.required(),
    contactPhone: baseSchemas.phone.optional(),
    website: baseSchemas.url.optional(),
    address: Joi.object({
      street: Joi.string().trim().optional(),
      city: Joi.string().trim().optional(),
      state: Joi.string().trim().optional(),
      country: Joi.string().trim().optional(),
      zipCode: Joi.string().trim().optional()
    }).optional(),
    industry: Joi.string().trim().optional(),
    companySize: Joi.string().valid('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+').optional(),
    timezone: Joi.string().default('UTC'),
    language: Joi.string().default('en'),
    subscription: Joi.object({
      plan: Joi.string().valid('free', 'basic', 'professional', 'enterprise').default('free'),
      billingCycle: Joi.string().valid('monthly', 'yearly').default('monthly'),
      amount: Joi.number().min(0).default(0)
    }).optional()
  }),
  update: Joi.object({
    name: Joi.string().min(2).max(100).trim().optional(),
    description: Joi.string().max(500).trim().optional(),
    contactEmail: baseSchemas.email.optional(),
    contactPhone: baseSchemas.phone.optional(),
    website: baseSchemas.url.optional(),
    address: Joi.object({
      street: Joi.string().trim().optional(),
      city: Joi.string().trim().optional(),
      state: Joi.string().trim().optional(),
      country: Joi.string().trim().optional(),
      zipCode: Joi.string().trim().optional()
    }).optional(),
    industry: Joi.string().trim().optional(),
    companySize: Joi.string().valid('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+').optional(),
    timezone: Joi.string().optional(),
    language: Joi.string().optional(),
    status: Joi.string().valid('active', 'inactive', 'suspended', 'pending').optional(),
    features: Joi.object({
      polls: Joi.object({
        enabled: Joi.boolean().default(true),
        maxPolls: Joi.number().integer().min(1).default(10),
        maxRecipients: Joi.number().integer().min(1).default(100)
      }).optional(),
      analytics: Joi.object({
        enabled: Joi.boolean().default(true),
        retention: Joi.number().integer().min(1).default(90)
      }).optional(),
      branding: Joi.object({
        enabled: Joi.boolean().default(false),
        logo: Joi.string().optional(),
        colors: Joi.object({
          primary: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#3B82F6'),
          secondary: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#6B7280')
        }).optional()
      }).optional()
    }).optional()
  }),
  list: Joi.object({
    ...baseSchemas.pagination,
    status: Joi.string().valid('active', 'inactive', 'suspended', 'pending').optional(),
    industry: Joi.string().optional(),
    companySize: Joi.string().valid('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+').optional(),
    search: Joi.string().trim().optional()
  })
};

// Poll validation schemas
const pollSchemas = {
  create: Joi.object({
    title: Joi.string().min(3).max(200).trim().required().messages({
      'string.min': 'Title must be at least 3 characters long',
      'string.max': 'Title cannot exceed 200 characters',
      'string.empty': MESSAGES.REQUIRED
    }),
    description: Joi.string().max(1000).trim().optional(),
    questions: Joi.array().items(Joi.object({
      text: Joi.string().min(1).max(500).trim().required(),
      type: Joi.string().valid('multiple_choice', 'single_choice', 'text', 'rating', 'boolean').required(),
      options: Joi.array().items(Joi.string().trim()).when('type', {
        is: Joi.string().valid('multiple_choice', 'single_choice'),
        then: Joi.required(),
        otherwise: Joi.forbidden()
      }),
      required: Joi.boolean().default(false),
      order: Joi.number().integer().min(0).optional()
    })).min(1).required(),
    settings: Joi.object({
      allowAnonymous: Joi.boolean().default(false),
      requireEmail: Joi.boolean().default(false),
      allowMultipleResponses: Joi.boolean().default(false),
      showResults: Joi.boolean().default(true),
      endDate: baseSchemas.futureDate.optional(),
      maxResponses: Joi.number().integer().min(1).optional()
    }).optional(),
    recipients: Joi.array().items(baseSchemas.email).optional(),
    tags: Joi.array().items(Joi.string().trim()).optional()
  }),
  update: Joi.object({
    title: Joi.string().min(3).max(200).trim().optional(),
    description: Joi.string().max(1000).trim().optional(),
    questions: Joi.array().items(Joi.object({
      id: baseSchemas.id.optional(),
      text: Joi.string().min(1).max(500).trim().required(),
      type: Joi.string().valid('multiple_choice', 'single_choice', 'text', 'rating', 'boolean').required(),
      options: Joi.array().items(Joi.string().trim()).when('type', {
        is: Joi.string().valid('multiple_choice', 'single_choice'),
        then: Joi.required(),
        otherwise: Joi.forbidden()
      }),
      required: Joi.boolean().default(false),
      order: Joi.number().integer().min(0).optional()
    })).optional(),
    settings: Joi.object({
      allowAnonymous: Joi.boolean().optional(),
      requireEmail: Joi.boolean().optional(),
      allowMultipleResponses: Joi.boolean().optional(),
      showResults: Joi.boolean().optional(),
      endDate: baseSchemas.futureDate.optional(),
      maxResponses: Joi.number().integer().min(1).optional()
    }).optional(),
    recipients: Joi.array().items(baseSchemas.email).optional(),
    tags: Joi.array().items(Joi.string().trim()).optional(),
    status: Joi.string().valid('draft', 'active', 'paused', 'closed').optional()
  }),
  list: Joi.object({
    ...baseSchemas.pagination,
    status: Joi.string().valid('draft', 'active', 'paused', 'closed').optional(),
    tags: Joi.array().items(Joi.string().trim()).optional(),
    search: Joi.string().trim().optional(),
    startDate: baseSchemas.date.optional(),
    endDate: baseSchemas.date.optional()
  }),
  submitResponse: Joi.object({
    responses: Joi.array().items(Joi.object({
      questionId: baseSchemas.id.required(),
      answer: Joi.alternatives().try(
        Joi.string().trim(),
        Joi.number(),
        Joi.boolean(),
        Joi.array().items(Joi.string().trim())
      ).required()
    })).min(1).required(),
    email: baseSchemas.email.when('$requireEmail', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    name: Joi.string().trim().optional()
  })
};

// Validation middleware
const validate = (schema, options = {}) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        allowUnknown: options.allowUnknown || false,
        stripUnknown: options.stripUnknown || true,
        context: {
          requireEmail: req.body?.settings?.requireEmail || false
        }
      });

      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }));
        throw new ValidationError('Validation failed', details);
      }

      // Replace request body with validated data
      req.body = value;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Query validation middleware
const validateQuery = (schema, options = {}) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        allowUnknown: options.allowUnknown || false,
        stripUnknown: options.stripUnknown || true
      });

      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }));
        throw new ValidationError('Query validation failed', details);
      }

      // Replace request query with validated data
      req.query = value;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Params validation middleware
const validateParams = (schema, options = {}) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.params, {
        abortEarly: false,
        allowUnknown: options.allowUnknown || false,
        stripUnknown: options.stripUnknown || true
      });

      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }));
        throw new ValidationError('Parameter validation failed', details);
      }

      // Replace request params with validated data
      req.params = value;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  PATTERNS,
  MESSAGES,
  baseSchemas,
  userSchemas,
  tenantSchemas,
  pollSchemas,
  validate,
  validateQuery,
  validateParams
};