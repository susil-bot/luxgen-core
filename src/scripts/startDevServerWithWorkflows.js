/**
 * LUXGEN DEVELOPMENT SERVER WITH WORKFLOWS
 * Development server with business workflow integration
 */

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'luxgen-trainer-platform-api-dev',
    version: '1.0.0',
    mode: 'development-fallback-with-workflows'
  });
});

// Import tenant configuration
const { getTenantConfig, getTenantContext, validateTenantAccess } = require('../tenantConfig');

// Mock tenant configuration (fallback)
const getDefaultTenantConfig = () => getTenantConfig('luxgen');

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
      security: config.security,
      workflows: config.workflows
    }
  });
});

app.get('/api/v1/tenants', (req, res) => {
  const { getAllTenants } = require('../tenantConfig');
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

// Workflow Health Endpoint
app.get('/api/v1/workflows/health', (req, res) => {
  res.json({
    success: true,
    data: {
      totalWorkflows: 3,
      registeredWorkflows: [
        'job-post-management',
        'user-management', 
        'feed-management'
      ],
      timestamp: new Date().toISOString(),
      status: 'healthy'
    }
  });
});

// Workflow Statistics Endpoint
app.get('/api/v1/workflows/statistics', (req, res) => {
  res.json({
    success: true,
    data: {
      total: 0,
      completed: 0,
      failed: 0,
      running: 0,
      cancelled: 0,
      successRate: 100
    }
  });
});

// Available Workflows Endpoint
app.get('/api/v1/workflows', (req, res) => {
  res.json({
    success: true,
    data: {
      workflows: [
        {
          id: 'job-post-management',
          name: 'JobPostWorkflow',
          tenantSpecific: true,
          available: true
        },
        {
          id: 'user-management',
          name: 'UserManagementWorkflow',
          tenantSpecific: true,
          available: true
        },
        {
          id: 'feed-management',
          name: 'FeedManagementWorkflow',
          tenantSpecific: true,
          available: true
        }
      ]
    }
  });
});

// Tenant Workflows Endpoint
app.get('/api/v1/workflows/tenant/:tenantId', (req, res) => {
  const { tenantId } = req.params;
  res.json({
    success: true,
    data: {
      workflows: [
        `${tenantId}_job-post-management`,
        `${tenantId}_user-management`,
        `${tenantId}_feed-management`
      ]
    }
  });
});

// Workflow Documentation Endpoint
app.get('/api/v1/workflows/:workflowId/documentation', (req, res) => {
  const { workflowId } = req.params;
  res.json({
    success: true,
    data: {
      id: workflowId,
      name: `${workflowId} Workflow`,
      description: 'Business logic workflow',
      steps: [],
      triggers: [],
      conditions: [],
      errorHandling: {
        strategy: 'retry',
        maxRetries: 3,
        retryDelay: 1000,
        notifications: []
      },
      tenantSpecific: true,
      crossTenantAllowed: false
    }
  });
});

// Job Post Workflow Endpoints
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
  
  // Simulate workflow execution
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
    workflowId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tenantConfig: {
      features: tenantContext.features,
      limits: tenantContext.limits,
      branding: tenantContext.branding
    }
  });
});

app.put('/api/v1/jobs/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, company, location, salary } = req.body;
  
  res.json({
    success: true,
    message: 'Job post updated successfully',
    data: {
      jobId: id,
      title,
      company: company?.name,
      location: location?.city,
      salary,
      updatedAt: new Date().toISOString()
    },
    workflowId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  });
});

// User Management Workflow Endpoints
app.post('/api/v1/users', (req, res) => {
  const { firstName, lastName, email, role, department } = req.body;
  
  // Simulate workflow execution
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const temporaryPassword = `temp_${Math.random().toString(36).substr(2, 8)}`;
  
  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      userId,
      email,
      firstName,
      lastName,
      role,
      department,
      temporaryPassword,
      createdAt: new Date().toISOString()
    },
    workflowId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  });
});

app.put('/api/v1/users/:id', (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, email, role, department } = req.body;
  
  res.json({
    success: true,
    message: 'User updated successfully',
    data: {
      userId: id,
      email,
      firstName,
      lastName,
      role,
      department,
      updatedAt: new Date().toISOString()
    },
    workflowId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  });
});

// Feed Management Workflow Endpoints
app.post('/api/v1/feed', (req, res) => {
  const { content, type, visibility, attachments } = req.body;
  
  // Simulate workflow execution
  const feedId = `feed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  res.status(201).json({
    success: true,
    message: 'Feed content created successfully',
    data: {
      feedId,
      content,
      type,
      visibility,
      attachments: attachments || [],
      createdAt: new Date().toISOString()
    },
    workflowId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  });
});

app.put('/api/v1/feed/:id', (req, res) => {
  const { id } = req.params;
  const { content, type, visibility, attachments } = req.body;
  
  res.json({
    success: true,
    message: 'Feed content updated successfully',
    data: {
      feedId: id,
      content,
      type,
      visibility,
      attachments: attachments || [],
      updatedAt: new Date().toISOString()
    },
    workflowId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  });
});

// Workflow Execution Status Endpoint
app.get('/api/v1/workflows/:executionId/status', (req, res) => {
  const { executionId } = req.params;
  
  res.json({
    success: true,
    data: {
      id: executionId,
      workflowId: 'job-post-management',
      tenantId: 'luxgen',
      userId: 'admin-user-123',
      status: 'completed',
      startTime: new Date(Date.now() - 5000).toISOString(),
      endTime: new Date().toISOString(),
      results: [],
      errors: [],
      metadata: {}
    }
  });
});

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

app.post('/api/v1/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
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

// Mock API endpoints for development (existing)
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
  console.log('🚀 LUXGEN DEVELOPMENT SERVER WITH WORKFLOWS STARTED');
  console.log('==================================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ Workflow health: http://localhost:${PORT}/api/v1/workflows/health`);
  console.log(`✅ Workflow stats: http://localhost:${PORT}/api/v1/workflows/statistics`);
  console.log(`✅ Available workflows: http://localhost:${PORT}/api/v1/workflows`);
  console.log(`✅ Jobs API: http://localhost:${PORT}/api/v1/jobs`);
  console.log(`✅ Feed API: http://localhost:${PORT}/api/v1/feed/posts`);
  console.log(`🌍 Mode: Development Fallback with Workflows`);
  console.log('==================================================');
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
