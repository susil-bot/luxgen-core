const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo');
// Removed express-validator due to security vulnerabilities
// Using custom validation instead

// Import routes
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/authRoutes');

// Import tenant detection middleware
const { tenantDetection, validateTenant, getTenantInfo } = require('./middleware/tenantDetection');

// Custom validation utilities to replace vulnerable express-validator
const customValidators = {
  isEmail: (value) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(value);
  },
  
  isStrongPassword: (value) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(value);
  },
  
  isURL: (value) => {
    try {
      // Enhanced URL validation to prevent bypass vulnerabilities
      if (typeof value !== 'string' || value.length === 0) return false;
      
      // Check for dangerous patterns that could bypass validation
      const dangerousPatterns = [
        /javascript:/i,
        /data:/i,
        /vbscript:/i,
        /file:/i,
        /ftp:/i,
        /<script/i,
        /onload=/i,
        /onerror=/i
      ];
      
      if (dangerousPatterns.some(pattern => pattern.test(value))) {
        return false;
      }
      
      const url = new URL(value);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        return false;
      }
      
      // Additional security checks
      if (url.hostname.includes('localhost') && process.env.NODE_ENV === 'production') {
        return false;
      }
      
      // Check for suspicious characters
      if (url.href.includes('<') || url.href.includes('>') || url.href.includes('"')) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  },
  
  isMongoId: (value) => {
    const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
    return mongoIdRegex.test(value);
  },
  
  sanitizeString: (value) => {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/[<>]/g, '');
  },
  
  validateInput: (req, res, next) => {
    const errors = [];
    
    // Validate email if present
    if (req.body.email && !customValidators.isEmail(req.body.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
    
    // Validate password if present
    if (req.body.password && !customValidators.isStrongPassword(req.body.password)) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' });
    }
    
    // Validate URL if present
    if (req.body.url && !customValidators.isURL(req.body.url)) {
      errors.push({ field: 'url', message: 'Invalid URL format' });
    }
    
    // Validate tenantId if present (allow both MongoDB ObjectId and slug formats)
    if (req.body.tenantId) {
      // Allow MongoDB ObjectId format or slug format
      const isMongoId = customValidators.isMongoId(req.body.tenantId);
      const isSlug = /^[a-z0-9-]+$/.test(req.body.tenantId);
      
      if (!isMongoId && !isSlug) {
        errors.push({ field: 'tenantId', message: 'Invalid tenant ID format. Must be a valid MongoDB ObjectId or slug' });
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }
    
    // Sanitize string inputs
    if (req.body.firstName) req.body.firstName = customValidators.sanitizeString(req.body.firstName);
    if (req.body.lastName) req.body.lastName = customValidators.sanitizeString(req.body.lastName);
    if (req.body.company) req.body.company = customValidators.sanitizeString(req.body.company);
    
    next();
  }
};

const app = express();

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Compression middleware
app.use(compression({
  level: 6,
  threshold: 1024
}));

// Enhanced rate limiting with tenant awareness
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and internal services
    return req.path === '/health' || req.path === '/metrics';
  }
});
app.use(limiter);

// Enhanced CORS configuration
const corsOptions = {
  origin: true, // Temporarily allow all origins for testing
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tenant-ID', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-Response-Time', 'X-Rate-Limit-Remaining'],
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Body parsing middleware with enhanced security
app.use(express.json({ 
  limit: process.env.UPLOAD_MAX_SIZE || '10mb',
  verify: (req, res, buf) => {
    // Additional body verification if needed
    try {
      JSON.parse(buf);
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.UPLOAD_MAX_SIZE || '10mb' 
}));

// Session management
if (process.env.MONGODB_URI) {
  app.use(session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'your-session-secret',
    name: 'luxgen.sid',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      touchAfter: 24 * 3600 // lazy session update
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict'
    }
  }));
}

// Multi-tenancy middleware
app.use((req, res, next) => {
  let tenantId = null;
  let tenantSlug = null;
  let identificationMethod = null;

  // 1. Subdomain identification (tenant.luxgen.com)
  const hostname = req.get('host') || req.hostname;
  if (hostname && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
    const subdomain = hostname.split('.')[0];
    if (subdomain && !['www', 'app', 'api', 'admin'].includes(subdomain)) {
      tenantSlug = subdomain;
      identificationMethod = 'subdomain';
    }
  }

  // 2. Header identification (X-Tenant-ID)
  if (!tenantSlug && !tenantId) {
    const headerTenant = req.get('X-Tenant-ID');
    if (headerTenant) {
      tenantSlug = headerTenant;
      identificationMethod = 'header';
    }
  }

  // 3. Query parameter identification (?tenant=slug)
  if (!tenantSlug && !tenantId) {
    const queryTenant = req.query.tenant;
    if (queryTenant) {
      tenantSlug = queryTenant;
      identificationMethod = 'query';
    }
  }

  // 4. JWT token tenant claim
  if (!tenantSlug && !tenantId && req.user?.tenantId) {
    tenantId = req.user.tenantId;
    identificationMethod = 'jwt';
  }

  // Use default tenant if none identified
  if (!tenantSlug && !tenantId) {
    tenantSlug = process.env.DEFAULT_TENANT || 'luxgen';
    identificationMethod = 'default';
  }

  // Attach tenant information to request
  req.tenantSlug = tenantSlug;
  req.tenantId = tenantId;
  req.tenantIdentificationMethod = identificationMethod;

  // Add tenant filter to all queries
  req.tenantFilter = { tenantId: tenantId || tenantSlug };

  next();
});

// Additional security middleware to protect against vulnerabilities
app.use((req, res, next) => {
  // XSS Protection
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi
  ];
  
  const checkForXSS = (obj) => {
    if (typeof obj === 'string') {
      return xssPatterns.some(pattern => pattern.test(obj));
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(value => checkForXSS(value));
    }
    return false;
  };
  
  if (checkForXSS(req.body) || checkForXSS(req.query) || checkForXSS(req.params)) {
    return res.status(400).json({
      success: false,
      error: 'XSS attempt detected',
      message: 'Request contains potentially malicious scripts'
    });
  }
  
  // SQL Injection Protection
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(\bUNION\s+SELECT\b)/gi,
    /(\bDROP\s+TABLE\b)/gi
  ];
  
  const checkForSQLInjection = (obj) => {
    if (typeof obj === 'string') {
      return sqlPatterns.some(pattern => pattern.test(obj));
    }
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(value => checkForSQLInjection(value));
    }
    return false;
  };
  
  if (checkForSQLInjection(req.body) || checkForSQLInjection(req.query) || checkForSQLInjection(req.params)) {
    return res.status(400).json({
      success: false,
      error: 'SQL injection attempt detected',
      message: 'Request contains potentially malicious SQL patterns'
    });
  }
  
  next();
});

// Custom validation middleware (replaces vulnerable express-validator)
// Note: Auth routes have their own validation, so we skip global validation for them
app.use((req, res, next) => {
  // Skip validation for auth routes as they have their own validation
  if (req.path.startsWith('/api/auth')) {
    return next();
  }
  return customValidators.validateInput(req, res, next);
});

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Add request ID to request object
  req.requestId = requestId;
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    // Add request ID to response headers
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    return originalJson.call(this, data);
  };
  
  next();
});

// Routes
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// Tenant detection for auth routes
app.use('/api/auth', tenantDetection, authRoutes);

// Tenant info endpoint
app.get('/api/tenant', tenantDetection, getTenantInfo);

// Mount all API routes for frontend support
try {
  // Import and mount comprehensive routes
  const tenantRoutes = require('./routes/tenantRoutes');
  const activityRoutes = require('./routes/activityRoutes');
  const contentRoutes = require('./routes/contentRoutes');
  const trainingRoutes = require('./routes/trainingRoutes');
  const jobRoutes = require('./routes/jobRoutes');
  const userRoutes = require('./routes/userRoutes');
  const notificationRoutes = require('./routes/notificationRoutes');
  
  // Mount routes with proper prefixes
  app.use('/api/v1/tenants', tenantRoutes);
  app.use('/api/v1/activities', activityRoutes);
  app.use('/api/v1/content', contentRoutes);
  app.use('/api/v1/training', trainingRoutes);
  app.use('/api/v1/jobs', jobRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  
  console.log('✅ All API routes mounted successfully');
} catch (error) {
  console.warn('⚠️ Some API routes could not be loaded:', error.message);
  console.log('📝 Error details:', error.stack);
}

// Mount new tenant-aware routes
try {
  const tenantAwareRoutes = require('./routes/tenantAwareRoutes');
  app.use('/api', tenantAwareRoutes);
  console.log('✅ Tenant-aware routes mounted successfully');
} catch (error) {
  console.warn('⚠️ Tenant-aware routes could not be loaded:', error.message);
}

// Basic API endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'LuxGen Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'LuxGen Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api',
      documentation: '/docs'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Enhanced error handler
app.use((err, req, res, next) => {
  // Log error with context
  const errorLog = {
    name: err.name,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    userId: req.user?.id,
    tenantId: req.tenantId,
    requestId: req.requestId
  };

  // Log error with appropriate level
  if (err.status >= 500) {
    console.error('Server Error:', errorLog);
  } else if (err.status >= 400) {
    console.warn('Client Error:', errorLog);
  } else {
    console.info('Info Error:', errorLog);
  }

  // Handle specific error types
  let statusCode = err.status || 500;
  let message = err.message || 'Internal server error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    message = 'Resource already exists';
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource ID';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Rate limit errors
  if (err.name === 'RateLimitError') {
    statusCode = 429;
    message = 'Too many requests';
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    statusCode = 503;
    message = 'Database connection failed';
  }

  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    statusCode = 403;
    message = 'CORS policy violation';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message: process.env.NODE_ENV === 'production' && statusCode >= 500 ? 'Internal server error' : message,
      statusCode,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    }
  });
});

module.exports = app;
