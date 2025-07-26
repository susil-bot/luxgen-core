const Joi = require('joi');

// Tenant validation schema
const tenantSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Tenant name is required',
      'string.min': 'Tenant name must be at least 2 characters long',
      'string.max': 'Tenant name cannot exceed 100 characters'
    }),
  
  slug: Joi.string()
    .pattern(/^[a-z0-9-]+$/)
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens',
      'string.min': 'Slug must be at least 2 characters long',
      'string.max': 'Slug cannot exceed 50 characters'
    }),
  
  description: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  
  contactEmail: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Contact email is required'
    }),
  
  contactPhone: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  
  website: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'Please provide a valid website URL'
    }),
  
  address: Joi.object({
    street: Joi.string().max(200).optional(),
    city: Joi.string().max(100).optional(),
    state: Joi.string().max(100).optional(),
    country: Joi.string().max(100).optional(),
    zipCode: Joi.string().max(20).optional()
  }).optional(),
  
  industry: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Industry cannot exceed 100 characters'
    }),
  
  companySize: Joi.string()
    .valid('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')
    .optional()
    .messages({
      'any.only': 'Please select a valid company size'
    }),
  
  timezone: Joi.string()
    .default('UTC')
    .optional(),
  
  language: Joi.string()
    .valid('en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh')
    .default('en')
    .optional()
    .messages({
      'any.only': 'Please select a valid language'
    }),
  
  subscription: Joi.object({
    plan: Joi.string()
      .valid('free', 'basic', 'professional', 'enterprise')
      .default('free')
      .optional(),
    status: Joi.string()
      .valid('active', 'trial', 'expired', 'cancelled', 'suspended')
      .default('trial')
      .optional(),
    billingCycle: Joi.string()
      .valid('monthly', 'yearly')
      .default('monthly')
      .optional(),
    amount: Joi.number()
      .min(0)
      .default(0)
      .optional(),
    currency: Joi.string()
      .valid('USD', 'EUR', 'GBP', 'CAD', 'AUD')
      .default('USD')
      .optional()
  }).optional(),
  
  features: Joi.object({
    polls: Joi.object({
      enabled: Joi.boolean().default(true).optional(),
      maxPolls: Joi.number().min(1).default(10).optional(),
      maxRecipients: Joi.number().min(1).default(100).optional()
    }).optional(),
    analytics: Joi.object({
      enabled: Joi.boolean().default(true).optional(),
      retention: Joi.number().min(1).max(365).default(90).optional()
    }).optional(),
    integrations: Joi.object({
      slack: Joi.boolean().default(false).optional(),
      teams: Joi.boolean().default(false).optional(),
      email: Joi.boolean().default(true).optional()
    }).optional(),
    branding: Joi.object({
      enabled: Joi.boolean().default(false).optional(),
      logo: Joi.string().uri().optional(),
      colors: Joi.object({
        primary: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#3B82F6').optional(),
        secondary: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#6B7280').optional()
      }).optional()
    }).optional(),
    security: Joi.object({
      sso: Joi.boolean().default(false).optional(),
      mfa: Joi.boolean().default(false).optional(),
      ipWhitelist: Joi.array().items(Joi.string().ip()).optional()
    }).optional()
  }).optional(),
  
  settings: Joi.object({
    allowPublicPolls: Joi.boolean().default(false).optional(),
    requireEmailVerification: Joi.boolean().default(true).optional(),
    autoArchivePolls: Joi.boolean().default(true).optional(),
    archiveAfterDays: Joi.number().min(1).max(365).default(90).optional(),
    notificationPreferences: Joi.object({
      email: Joi.boolean().default(true).optional(),
      inApp: Joi.boolean().default(true).optional(),
      slack: Joi.boolean().default(false).optional()
    }).optional()
  }).optional(),
  
  metadata: Joi.object({
    source: Joi.string().optional(),
    referrer: Joi.string().optional(),
    utmSource: Joi.string().optional(),
    utmMedium: Joi.string().optional(),
    utmCampaign: Joi.string().optional()
  }).optional()
});

// Poll validation schema
const pollSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Poll title is required',
      'string.min': 'Poll title must be at least 3 characters long',
      'string.max': 'Poll title cannot exceed 200 characters'
    }),
  
  description: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Description cannot exceed 1000 characters'
    }),
  
  niche: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Niche is required',
      'string.min': 'Niche must be at least 2 characters long',
      'string.max': 'Niche cannot exceed 100 characters'
    }),
  
  targetAudience: Joi.array()
    .items(Joi.string().min(2).max(50))
    .min(1)
    .max(10)
    .required()
    .messages({
      'array.min': 'At least one target audience is required',
      'array.max': 'Cannot exceed 10 target audiences',
      'array.base': 'Target audience must be an array'
    }),
  
  questions: Joi.array()
    .items(Joi.object({
      question: Joi.string()
        .min(5)
        .max(500)
        .required(),
      type: Joi.string()
        .valid('multiple_choice', 'rating', 'text', 'yes_no')
        .required(),
      options: Joi.array()
        .items(Joi.string().min(1).max(200))
        .min(2)
        .max(10)
        .when('type', {
          is: 'multiple_choice',
          then: Joi.required(),
          otherwise: Joi.optional()
        }),
      required: Joi.boolean().default(true)
    }))
    .min(1)
    .max(20)
    .required()
    .messages({
      'array.min': 'At least one question is required',
      'array.max': 'Cannot exceed 20 questions',
      'array.base': 'Questions must be an array'
    }),
  
  channels: Joi.array()
    .items(Joi.string().valid('email', 'slack', 'web', 'whatsapp', 'teams'))
    .min(1)
    .max(5)
    .required()
    .messages({
      'array.min': 'At least one channel is required',
      'array.max': 'Cannot exceed 5 channels',
      'array.base': 'Channels must be an array'
    }),
  
  status: Joi.string()
    .valid('draft', 'scheduled', 'sent', 'completed', 'archived')
    .default('draft')
    .optional(),
  
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .default('medium')
    .optional(),
  
  tags: Joi.array()
    .items(Joi.string().min(1).max(50))
    .max(10)
    .optional()
    .messages({
      'array.max': 'Cannot exceed 10 tags'
    }),
  
  scheduledDate: Joi.date()
    .greater('now')
    .optional()
    .messages({
      'date.greater': 'Scheduled date must be in the future'
    }),
  
  settings: Joi.object({
    allowAnonymous: Joi.boolean().default(false).optional(),
    requireEmail: Joi.boolean().default(true).optional(),
    maxResponses: Joi.number().min(1).max(10000).optional(),
    autoClose: Joi.boolean().default(false).optional(),
    closeDate: Joi.date().greater('now').optional()
  }).optional()
});

// User validation schema
const userSchema = Joi.object({
  firstName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters'
    }),
  
  lastName: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'Last name is required',
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters'
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required'
    }),
  
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),
  
  role: Joi.string()
    .valid('trainer', 'participant', 'admin')
    .default('participant')
    .optional(),
  
  tenantId: Joi.string()
    .required()
    .messages({
      'string.empty': 'Tenant ID is required'
    })
});

// Validation functions
const validateTenantData = (data, isUpdate = false) => {
  const schema = isUpdate ? tenantSchema.fork(['name', 'contactEmail'], (schema) => schema.optional()) : tenantSchema;
  
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return {
      isValid: false,
      errors,
      value: null
    };
  }

  return {
    isValid: true,
    errors: [],
    value
  };
};

const validatePollData = (data, isUpdate = false) => {
  const schema = isUpdate ? pollSchema.fork(['title', 'questions'], (schema) => schema.optional()) : pollSchema;
  
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return {
      isValid: false,
      errors,
      value: null
    };
  }

  return {
    isValid: true,
    errors: [],
    value
  };
};

const validateUserData = (data, isUpdate = false) => {
  const schema = isUpdate ? userSchema.fork(['password'], (schema) => schema.optional()) : userSchema;
  
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return {
      isValid: false,
      errors,
      value: null
    };
  }

  return {
    isValid: true,
    errors: [],
    value
  };
};

// Generic validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    req.validatedData = value;
    next();
  };
};

// Query parameter validation
const validateQueryParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors
      });
    }

    req.validatedQuery = value;
    next();
  };
};

// Common query parameter schemas
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'status').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

const searchSchema = Joi.object({
  search: Joi.string().min(1).max(100).optional(),
  status: Joi.string().optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional()
});

module.exports = {
  validateTenantData,
  validatePollData,
  validateUserData,
  validateRequest,
  validateQueryParams,
  paginationSchema,
  searchSchema,
  tenantSchema,
  pollSchema,
  userSchema
}; 