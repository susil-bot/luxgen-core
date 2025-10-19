const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Import routes
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/authRoutes');

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
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : 
      ['http://localhost:3000', 'http://localhost:3001'];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
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
app.use('/api/auth', authRoutes);

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
