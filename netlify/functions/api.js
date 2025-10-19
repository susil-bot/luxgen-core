const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import your existing app
const app = require('../../src/app');

// Create a new Express app for Netlify
const netlifyApp = express();

// Apply middleware
netlifyApp.use(helmet());
netlifyApp.use(compression());
netlifyApp.use(cors({
  origin: process.env.CORS_ORIGINS ? 
    process.env.CORS_ORIGINS.split(',').map(o => o.trim()) : 
    ['http://localhost:3000', 'http://localhost:3001'],
  credentials: process.env.CORS_CREDENTIALS === 'true'
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.'
  }
});
netlifyApp.use(limiter);

// Body parsing
netlifyApp.use(express.json({ limit: '10mb' }));
netlifyApp.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount your existing app routes
netlifyApp.use('/', app);

// Health check endpoint
netlifyApp.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'luxgen-backend-netlify',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    netlify: {
      region: process.env.AWS_REGION || 'us-east-1',
      requestId: req.headers['x-amzn-requestid'] || 'unknown',
      functionName: 'api'
    }
  });
});

// Root endpoint
netlifyApp.get('/', (req, res) => {
  res.json({
    message: 'LuxGen Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
      documentation: '/docs'
    }
  });
});

// 404 handler
netlifyApp.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Error handler
netlifyApp.use((err, req, res, next) => {
  console.error('Netlify Function Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: process.env.NODE_ENV === 'production' && err.status >= 500 ? 'Internal server error' : err.message,
      statusCode: err.status || 500,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    }
  });
});

// Export for Netlify
module.exports.handler = serverless(netlifyApp);
