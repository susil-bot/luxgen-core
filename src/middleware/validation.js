const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

// Generic validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    throw new ValidationError('Validation failed', formattedErrors);
  }
  next();
};

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
};

// User validation schemas
const userValidations = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('firstName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
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
  ]
};

// Custom validation middleware for complex rules
const validateRequestCustom = (validationRules) => {
  return (req, res, next) => {
    try {
      const errors = [];
      
      for (const rule of validationRules) {
        const { field, type, required, minLength, maxLength, min, max, enum: enumValues } = rule;
        const value = req.body[field];
        
        // Check if required
        if (required && (value === undefined || value === null || value === '')) {
          errors.push({ field, message: `${field} is required`, type: 'required' });
          continue;
        }
        
        // Skip validation if value is not provided and not required
        if (value === undefined || value === null || value === '') {
          continue;
        }
        
        // Type validation
        if (type === 'string' && typeof value !== 'string') {
          errors.push({ field, message: `${field} must be a string`, type: 'type' });
        } else if (type === 'number' && typeof value !== 'number') {
          errors.push({ field, message: `${field} must be a number`, type: 'type' });
        } else if (type === 'boolean' && typeof value !== 'boolean') {
          errors.push({ field, message: `${field} must be a boolean`, type: 'type' });
        } else if (type === 'object' && typeof value !== 'object') {
          errors.push({ field, message: `${field} must be an object`, type: 'type' });
        } else if (type === 'array' && !Array.isArray(value)) {
          errors.push({ field, message: `${field} must be an array`, type: 'type' });
        }
        
        // String-specific validations
        if (type === 'string' && typeof value === 'string') {
          if (minLength && value.length < minLength) {
            errors.push({ field, message: `${field} must be at least ${minLength} characters long`, type: 'minLength' });
          }
          if (maxLength && value.length > maxLength) {
            errors.push({ field, message: `${field} cannot exceed ${maxLength} characters`, type: 'maxLength' });
          }
        }
        
        // Number-specific validations
        if (type === 'number' && typeof value === 'number') {
          if (min !== undefined && value < min) {
            errors.push({ field, message: `${field} must be at least ${min}`, type: 'min' });
          }
          if (max !== undefined && value > max) {
            errors.push({ field, message: `${field} cannot exceed ${max}`, type: 'max' });
          }
        }
        
        // Enum validation
        if (enumValues && !enumValues.includes(value)) {
          errors.push({ field, message: `${field} must be one of: ${enumValues.join(', ')}`, type: 'enum' });
        }
      }
      
      if (errors.length > 0) {
        throw new ValidationError('Validation failed', errors);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Export all validation schemas
module.exports = {
  validateRequest,
  validateRequestCustom,
  commonValidations,
  userValidations
};
