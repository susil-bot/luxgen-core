/**
 * LUXGEN BACKEND - DEVELOPMENT MODE
 * Simple development server without MongoDB dependency
 */

// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Import tenant configuration
const { getTenantConfig, getTenantContext, validateTenantAccess } = require('./tenantConfig');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'luxgen-trainer-platform-api-dev',
    version: '1.0.0',
    mode: 'development-no-database'
  });
});

// API Routes Setup
function setupAPIRoutes(app) {
  // Authentication Endpoints
  app.post('/api/v1/auth/register', (req, res) => {
    const { firstName, lastName, email, password, role, department } = req.body;
    const tenantId = req.headers['x-tenant-id'] || 'luxgen';
    
    // Validate tenant access
    const access = validateTenantAccess(tenantId, null, 'user-management');
    if (!access.valid) {
      return res.status(403).json({
        success: false,
        message: access.reason
      });
    }
    
    // Get tenant context
    const tenantContext = getTenantContext(tenantId, null, role);
    
    // Simulate user registration
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId,
        email,
        firstName,
        lastName,
        role: role || 'user',
        department,
        tenantId: tenantContext.tenantId,
        tenantName: tenantContext.tenantName,
        token,
        createdAt: new Date().toISOString()
      },
      tenantConfig: {
        features: tenantContext.features,
        limits: tenantContext.limits,
        branding: tenantContext.branding
      }
    });
  });

  app.post('/api/v1/auth/login', (req, res) => {
    const { email, password } = req.body;
    const tenantId = req.headers['x-tenant-id'] || 'luxgen';
    
    // Validate tenant access
    const access = validateTenantAccess(tenantId, null, 'user-management');
    if (!access.valid) {
      return res.status(403).json({
        success: false,
        message: access.reason
      });
    }
    
    // Get tenant context
    const tenantContext = getTenantContext(tenantId, null, 'user');
    
    // Simulate user login
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        userId,
        email,
        token,
        tenantId: tenantContext.tenantId,
        tenantName: tenantContext.tenantName,
        role: 'user',
        lastLogin: new Date().toISOString()
      },
      tenantConfig: {
        features: tenantContext.features,
        limits: tenantContext.limits,
        branding: tenantContext.branding
      }
    });
  });

  app.get('/api/v1/auth/me', (req, res) => {
    const tenantId = req.headers['x-tenant-id'] || 'luxgen';
    const userId = req.headers['x-user-id'] || 'user-123';
    
    // Get tenant context
    const tenantContext = getTenantContext(tenantId, userId, 'user');
    
    res.json({
      success: true,
      data: {
        userId,
        email: 'user@luxgen.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        tenantId: tenantContext.tenantId,
        tenantName: tenantContext.tenantName,
        lastLogin: new Date().toISOString()
      },
      tenantConfig: {
        features: tenantContext.features,
        limits: tenantContext.limits,
        branding: tenantContext.branding
      }
    });
  });

  // Job Post Endpoints
  app.post('/api/v1/jobs', (req, res) => {
    const { title, description, company, location, salary, requirements } = req.body;
    const tenantId = req.headers['x-tenant-id'] || 'luxgen';
    
    // Validate tenant access
    const access = validateTenantAccess(tenantId, req.headers['x-user-id'], 'job-posting');
    if (!access.valid) {
      return res.status(403).json({
        success: false,
        message: access.reason
      });
    }
    
    // Get tenant context
    const tenantContext = getTenantContext(tenantId, req.headers['x-user-id'], req.headers['x-user-role']);
    
    // Simulate job creation
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.status(201).json({
      success: true,
      message: 'Job post created successfully',
      data: {
        jobId,
        title,
        company: company?.name,
        location: location?.city,
        salary,
        tenantId: tenantContext.tenantId,
        tenantName: tenantContext.tenantName,
        createdAt: new Date().toISOString()
      },
      tenantConfig: {
        features: tenantContext.features,
        limits: tenantContext.limits,
        branding: tenantContext.branding
      }
    });
  });

  app.get('/api/v1/jobs', (req, res) => {
    res.json({
      success: true,
      data: {
        jobPosts: [
          {
            _id: 'mock-job-1',
            title: 'Senior Software Engineer',
            description: 'We are looking for a senior software engineer...',
            company: {
              name: 'LuxGen Technologies',
              location: { city: 'San Francisco', country: 'USA' }
            },
            jobType: 'full-time',
            experienceLevel: 'senior',
            location: { city: 'San Francisco', country: 'USA' },
            salary: { min: 120000, max: 160000, currency: 'USD' },
            createdAt: new Date().toISOString()
          }
        ],
        total: 1,
        currentPage: 1,
        totalPages: 1
      },
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1
      }
    });
  });

  // Feed Endpoints
  app.get('/api/v1/feed/posts', (req, res) => {
    res.json({
      success: true,
      data: {
        posts: [
          {
            _id: 'mock-post-1',
            content: 'Welcome to LuxGen! We are excited to have you here.',
            type: 'announcement',
            visibility: 'public',
            createdBy: 'admin-user-123',
            createdAt: new Date().toISOString(),
            engagement: {
              likes: 5,
              comments: 2,
              shares: 1,
              views: 25
            }
          }
        ],
        total: 1,
        currentPage: 1,
        totalPages: 1
      }
    });
  });

  // Tenant Configuration Endpoints
  app.get('/api/v1/tenants/:tenantId/config', (req, res) => {
    const { tenantId } = req.params;
    const config = getTenantConfig(tenantId);
    
    res.json({
      success: true,
      data: {
        tenantId: config.id,
        tenantSlug: config.slug,
        tenantName: config.name,
        features: config.features,
        limits: config.limits,
        branding: config.branding,
        security: config.security
      }
    });
  });

  app.get('/api/v1/tenants', (req, res) => {
    const { getAllTenants } = require('./tenantConfig');
    const tenants = getAllTenants();
    
    res.json({
      success: true,
      data: {
        tenants: tenants.map(tenant => ({
          id: tenant.id,
          slug: tenant.slug,
          name: tenant.name,
          domain: tenant.domain,
          features: tenant.features,
          limits: tenant.limits
        }))
      }
    });
  });
}

// Initialize API routes
console.log('🚀 Initializing API Routes...');
setupAPIRoutes(app);
console.log('✅ API routes initialized');

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log('LUXGEN BACKEND STARTED SUCCESSFULLY (DEVELOPMENT MODE)');
  console.log('='.repeat(60));
  console.log(` Server running on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` Auth API: http://localhost:${PORT}/api/v1/auth/register`);
  console.log(` Jobs API: http://localhost:${PORT}/api/v1/jobs`);
  console.log(` Feed API: http://localhost:${PORT}/api/v1/feed/posts`);
  console.log(` Tenants API: http://localhost:${PORT}/api/v1/tenants`);
  console.log(`🌍 Mode: Development (No Database)`);
  console.log(` Started at: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});
