const express = require('express');
const router = express.Router();

// Tenant Management Routes for Frontend Support
// =============================================

// Get all tenants
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'tenant-1',
        name: 'Acme Corporation',
        slug: 'acme-corp',
        domain: 'acme.luxgen.com',
        status: 'active',
        plan: 'enterprise',
        users: 150,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        settings: {
          branding: {
            logo: '/media/tenants/acme/logo.png',
            primaryColor: '#3B82F6',
            secondaryColor: '#1E40AF'
          },
          features: {
            training: true,
            jobs: true,
            analytics: true,
            customDomain: true
          }
        }
      },
      {
        id: 'tenant-2',
        name: 'Tech Startup',
        slug: 'tech-startup',
        domain: 'tech.luxgen.com',
        status: 'active',
        plan: 'professional',
        users: 25,
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        settings: {
          branding: {
            logo: '/media/tenants/tech/logo.png',
            primaryColor: '#10B981',
            secondaryColor: '#059669'
          },
          features: {
            training: true,
            jobs: false,
            analytics: true,
            customDomain: false
          }
        }
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 2,
      pages: 1
    }
  });
});

// Get tenant by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      id,
      name: 'Acme Corporation',
      slug: 'acme-corp',
      domain: 'acme.luxgen.com',
      status: 'active',
      plan: 'enterprise',
      users: 150,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      settings: {
        branding: {
          logo: '/media/tenants/acme/logo.png',
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF'
        },
        features: {
          training: true,
          jobs: true,
          analytics: true,
          customDomain: true
        },
        limits: {
          maxUsers: 1000,
          maxStorage: '100GB',
          maxCourses: 500
        }
      },
      stats: {
        activeUsers: 120,
        totalCourses: 45,
        completedCourses: 380,
        totalHours: 2500
      }
    }
  });
});

// Create new tenant
router.post('/', (req, res) => {
  const tenantData = req.body;
  
  res.json({
    success: true,
    message: 'Tenant created successfully',
    data: {
      id: 'tenant-new-' + Date.now(),
      ...tenantData,
      status: 'active',
      createdAt: new Date().toISOString(),
      settings: {
        branding: {
          logo: null,
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF'
        },
        features: {
          training: true,
          jobs: false,
          analytics: true,
          customDomain: false
        }
      }
    }
  });
});

// Update tenant
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  res.json({
    success: true,
    message: 'Tenant updated successfully',
    data: {
      id,
      ...updates,
      updatedAt: new Date().toISOString()
    }
  });
});

// Delete tenant
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: 'Tenant deleted successfully',
    data: { id }
  });
});

// Get tenant statistics
router.get('/:id/stats', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      tenantId: id,
      users: {
        total: 150,
        active: 120,
        newThisMonth: 15
      },
      training: {
        totalCourses: 45,
        completedCourses: 380,
        totalHours: 2500,
        averageScore: 87
      },
      engagement: {
        dailyActiveUsers: 85,
        weeklyActiveUsers: 110,
        monthlyActiveUsers: 120
      },
      revenue: {
        monthly: 15000,
        yearly: 180000,
        growth: 15.5
      }
    }
  });
});

// Get tenant health
router.get('/:id/health', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      tenantId: id,
      status: 'healthy',
      services: {
        database: 'connected',
        storage: 'available',
        email: 'operational',
        notifications: 'operational'
      },
      uptime: 99.9,
      lastChecked: new Date().toISOString()
    }
  });
});

module.exports = router;