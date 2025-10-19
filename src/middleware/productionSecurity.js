/**
 * PRODUCTION SECURITY MIDDLEWARE
 * Comprehensive security middleware for production deployment
 * Includes advanced security headers, rate limiting, and threat protection
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const productionConfig = require('../config/production');

class ProductionSecurity {
  /**
   * Advanced rate limiting with tenant-aware limits
   */
  static createRateLimit(options = {}) {
    const config = productionConfig.getConfig();
    const defaultOptions = {
      windowMs: config.security.rateLimit.windowMs,
      max: config.security.rateLimit.max,
      message: {
        error: 'Too many requests',
        message: config.security.rateLimit.message,
        retryAfter: Math.ceil(config.security.rateLimit.windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: config.security.rateLimit.skipSuccessfulRequests,
      keyGenerator: (req) => {
        // Include tenant ID in rate limit key for tenant-specific limits
        const tenantId = req.tenantId || req.tenant?.id || 'default';
        return `${req.ip}-${tenantId}`;
      },
      skip: (req) => {
        // Skip rate limiting for health checks and internal services
        return req.path === '/health' || req.path === '/metrics';
      }
    };

    return rateLimit({ ...defaultOptions, ...options });
  }

  /**
   * Tenant-specific rate limiting
   */
  static createTenantRateLimit() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: (req) => {
        // Different limits based on tenant tier
        const tenant = req.tenant;
        if (tenant?.tier === 'premium') return 1000;
        if (tenant?.tier === 'standard') return 500;
        return 100; // free tier
      },
      keyGenerator: (req) => {
        const tenantId = req.tenantId || req.tenant?.id || 'default';
        return `tenant-${tenantId}-${req.ip}`;
      },
      message: {
        error: 'Tenant rate limit exceeded',
        message: 'Your tenant has exceeded the rate limit. Please try again later.',
        retryAfter: 900
      }
    });
  }

  /**
   * Advanced CORS configuration
   */
  static createCorsMiddleware() {
    const config = productionConfig.getConfig();
    
    return cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = config.security.cors.origin;
        
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        // Check for wildcard subdomains
        const wildcardOrigins = allowedOrigins.filter(o => o.includes('*'));
        for (const wildcard of wildcardOrigins) {
          const pattern = wildcard.replace('*', '.*');
          const regex = new RegExp(`^${pattern}$`);
          if (regex.test(origin)) {
            return callback(null, true);
          }
        }
        
        callback(new Error('Not allowed by CORS'));
      },
      credentials: config.security.cors.credentials,
      methods: config.security.cors.methods,
      allowedHeaders: config.security.cors.allowedHeaders,
      exposedHeaders: config.security.cors.exposedHeaders,
      maxAge: 86400 // 24 hours
    });
  }

  /**
   * Advanced security headers with Helmet
   */
  static createSecurityHeaders() {
    const config = productionConfig.getConfig();
    
    return helmet({
      contentSecurityPolicy: config.security.helmet.contentSecurityPolicy,
      crossOriginEmbedderPolicy: false,
      hsts: config.security.helmet.hsts,
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      ieNoOpen: true,
      dnsPrefetchControl: true,
      permittedCrossDomainPolicies: false
    });
  }

  /**
   * Request sanitization middleware
   */
  static sanitizeRequest() {
    return (req, res, next) => {
      // Remove potentially dangerous characters from request body
      if (req.body && typeof req.body === 'object') {
        req.body = this.sanitizeObject(req.body);
      }
      
      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = this.sanitizeObject(req.query);
      }
      
      next();
    };
  }

  /**
   * Recursively sanitize object properties
   */
  static sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Remove potentially dangerous keys
      if (key.includes('<script') || key.includes('javascript:') || key.includes('onload=')) {
        continue;
      }
      
      sanitized[key] = this.sanitizeObject(value);
    }
    
    return sanitized;
  }

  /**
   * Input validation middleware
   */
  static validateInput(rules) {
    return [
      ...rules,
      (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors.array()
          });
        }
        next();
      }
    ];
  }

  /**
   * Common validation rules
   */
  static getValidationRules() {
    return {
      email: body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Invalid email format'),
      
      password: body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character'),
      
      firstName: body('firstName')
        .trim()
        .isLength({ min: 1, max: 100 })
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('First name must be 1-100 characters, letters only'),
      
      lastName: body('lastName')
        .trim()
        .isLength({ min: 1, max: 100 })
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Last name must be 1-100 characters, letters only'),
      
      phone: body('phone')
        .optional()
        .matches(/^\+?[1-9]\d{1,14}$/)
        .withMessage('Invalid phone number format'),
      
      tenantId: body('tenantId')
        .optional()
        .isMongoId()
        .withMessage('Invalid tenant ID format')
    };
  }

  /**
   * SQL injection protection
   */
  static preventSQLInjection() {
    return (req, res, next) => {
      const dangerousPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
        /(\b(OR|AND)\s+['"]\s*=\s*['"])/gi,
        /(\bUNION\s+SELECT\b)/gi,
        /(\bDROP\s+TABLE\b)/gi,
        /(\bINSERT\s+INTO\b)/gi,
        /(\bDELETE\s+FROM\b)/gi
      ];
      
      const checkString = (str) => {
        if (typeof str !== 'string') return false;
        return dangerousPatterns.some(pattern => pattern.test(str));
      };
      
      const checkObject = (obj) => {
        if (typeof obj !== 'object' || obj === null) return false;
        
        for (const [key, value] of Object.entries(obj)) {
          if (checkString(key) || checkString(value)) return true;
          if (typeof value === 'object' && checkObject(value)) return true;
        }
        return false;
      };
      
      if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
        return res.status(400).json({
          success: false,
          error: 'Potentially malicious input detected',
          message: 'Request contains potentially dangerous content'
        });
      }
      
      next();
    };
  }

  /**
   * XSS protection middleware
   */
  static preventXSS() {
    return (req, res, next) => {
      const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
        /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
        /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
        /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /onload\s*=/gi,
        /onerror\s*=/gi,
        /onclick\s*=/gi
      ];
      
      const checkForXSS = (str) => {
        if (typeof str !== 'string') return false;
        return xssPatterns.some(pattern => pattern.test(str));
      };
      
      const checkObject = (obj) => {
        if (typeof obj !== 'object' || obj === null) return false;
        
        for (const [key, value] of Object.entries(obj)) {
          if (checkForXSS(key) || checkForXSS(value)) return true;
          if (typeof value === 'object' && checkObject(value)) return true;
        }
        return false;
      };
      
      if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
        return res.status(400).json({
          success: false,
          error: 'XSS attempt detected',
          message: 'Request contains potentially malicious scripts'
        });
      }
      
      next();
    };
  }

  /**
   * Request size limiting
   */
  static limitRequestSize() {
    const config = productionConfig.getConfig();
    
    return (req, res, next) => {
      const contentLength = parseInt(req.get('content-length') || '0');
      const maxSize = config.fileUpload.maxSize;
      
      if (contentLength > maxSize) {
        return res.status(413).json({
          success: false,
          error: 'Request too large',
          message: `Request size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`
        });
      }
      
      next();
    };
  }

  /**
   * IP whitelist middleware
   */
  static createIPWhitelist(allowedIPs = []) {
    return (req, res, next) => {
      const clientIP = req.ip || req.connection.remoteAddress;
      
      if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Your IP address is not authorized to access this resource'
        });
      }
      
      next();
    };
  }

  /**
   * Security audit logging
   */
  static auditSecurityEvents() {
    return (req, res, next) => {
      const originalSend = res.send;
      
      res.send = function(data) {
        // Log security events
        if (res.statusCode >= 400) {
          const securityEvent = {
            timestamp: new Date().toISOString(),
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            tenantId: req.tenantId,
            userId: req.user?.id,
            requestId: req.requestId
          };
          
          // Log to security monitoring system
          console.warn('Security Event:', securityEvent);
        }
        
        return originalSend.call(this, data);
      };
      
      next();
    };
  }
}

module.exports = ProductionSecurity;
