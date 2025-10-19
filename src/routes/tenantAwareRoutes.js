/**
 * Tenant-Aware API Routes
 * Demonstrates how to use tenant resolution in API endpoints
 */

const express = require('express');
const { resolveTenantFromHost, getTenantById } = require('../lib/tenant');
const clientPromise = require('../lib/mongodb');

const router = express.Router();

/**
 * GET /api/users - Get users for current tenant
 */
router.get('/users', async (req, res) => {
  try {
    // Resolve tenant from hostname
    const tenantId = await resolveTenantFromHost(req);
    
    // Get MongoDB client
    const client = await clientPromise;
    const db = client.db('luxgen');
    
    // Query users for this tenant only
    const users = await db.collection('users').find({ tenantId }).toArray();
    
    res.json({
      success: true,
      data: users,
      tenantId,
      count: users.length
    });
    
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users',
      message: error.message
    });
  }
});

/**
 * POST /api/users - Create user for current tenant
 */
router.post('/users', async (req, res) => {
  try {
    const { name, email, role = 'user' } = req.body;
    
    // Resolve tenant from hostname
    const tenantId = await resolveTenantFromHost(req);
    
    // Get MongoDB client
    const client = await clientPromise;
    const db = client.db('luxgen');
    
    // Create user with tenant context
    const user = {
      tenantId,
      name,
      email,
      role,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(user);
    
    if (result.insertedId) {
      res.status(201).json({
        success: true,
        data: { ...user, _id: result.insertedId },
        message: 'User created successfully'
      });
    } else {
      throw new Error('Failed to create user');
    }
    
  } catch (error) {
    console.error('❌ Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      message: error.message
    });
  }
});

/**
 * GET /api/tenant - Get current tenant information
 */
router.get('/tenant', async (req, res) => {
  try {
    // Resolve tenant from hostname
    const tenantId = await resolveTenantFromHost(req);
    
    // Get tenant information
    const tenant = await getTenantById(tenantId);
    
    res.json({
      success: true,
      data: {
        tenantId: tenant.tenantId,
        name: tenant.name,
        subdomain: tenant.subdomain,
        plan: tenant.plan,
        status: tenant.status
      }
    });
    
  } catch (error) {
    console.error('❌ Get tenant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tenant information',
      message: error.message
    });
  }
});

/**
 * GET /api/training-programs - Get training programs for current tenant
 */
router.get('/training-programs', async (req, res) => {
  try {
    // Resolve tenant from hostname
    const tenantId = await resolveTenantFromHost(req);
    
    // Get MongoDB client
    const client = await clientPromise;
    const db = client.db('luxgen');
    
    // Query training programs for this tenant only
    const programs = await db.collection('training_programs').find({ tenantId }).toArray();
    
    res.json({
      success: true,
      data: programs,
      tenantId,
      count: programs.length
    });
    
  } catch (error) {
    console.error('❌ Get training programs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get training programs',
      message: error.message
    });
  }
});

/**
 * POST /api/training-programs - Create training program for current tenant
 */
router.post('/training-programs', async (req, res) => {
  try {
    const { title, description, duration, level } = req.body;
    
    // Resolve tenant from hostname
    const tenantId = await resolveTenantFromHost(req);
    
    // Get MongoDB client
    const client = await clientPromise;
    const db = client.db('luxgen');
    
    // Create training program with tenant context
    const program = {
      tenantId,
      title,
      description,
      duration,
      level,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('training_programs').insertOne(program);
    
    if (result.insertedId) {
      res.status(201).json({
        success: true,
        data: { ...program, _id: result.insertedId },
        message: 'Training program created successfully'
      });
    } else {
      throw new Error('Failed to create training program');
    }
    
  } catch (error) {
    console.error('❌ Create training program error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create training program',
      message: error.message
    });
  }
});

/**
 * GET /api/jobs - Get job postings for current tenant
 */
router.get('/jobs', async (req, res) => {
  try {
    // Resolve tenant from hostname
    const tenantId = await resolveTenantFromHost(req);
    
    // Get MongoDB client
    const client = await clientPromise;
    const db = client.db('luxgen');
    
    // Query job postings for this tenant only
    const jobs = await db.collection('job_postings').find({ tenantId }).toArray();
    
    res.json({
      success: true,
      data: jobs,
      tenantId,
      count: jobs.length
    });
    
  } catch (error) {
    console.error('❌ Get jobs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get job postings',
      message: error.message
    });
  }
});

/**
 * POST /api/jobs - Create job posting for current tenant
 */
router.post('/jobs', async (req, res) => {
  try {
    const { title, description, location, salary, type } = req.body;
    
    // Resolve tenant from hostname
    const tenantId = await resolveTenantFromHost(req);
    
    // Get MongoDB client
    const client = await clientPromise;
    const db = client.db('luxgen');
    
    // Create job posting with tenant context
    const job = {
      tenantId,
      title,
      description,
      location,
      salary,
      type,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('job_postings').insertOne(job);
    
    if (result.insertedId) {
      res.status(201).json({
        success: true,
        data: { ...job, _id: result.insertedId },
        message: 'Job posting created successfully'
      });
    } else {
      throw new Error('Failed to create job posting');
    }
    
  } catch (error) {
    console.error('❌ Create job posting error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create job posting',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/tenants - Get all tenants (admin only)
 */
router.get('/admin/tenants', async (req, res) => {
  try {
    // This would typically check for admin role
    // For now, we'll allow it for demonstration
    
    // Get MongoDB client
    const client = await clientPromise;
    const db = client.db('luxgen');
    
    // Get all tenants
    const tenants = await db.collection('tenants').find({}).toArray();
    
    res.json({
      success: true,
      data: tenants,
      count: tenants.length
    });
    
  } catch (error) {
    console.error('❌ Get all tenants error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tenants',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/users - Get all users across all tenants (admin only)
 */
router.get('/admin/users', async (req, res) => {
  try {
    // This would typically check for admin role
    // For now, we'll allow it for demonstration
    
    // Get MongoDB client
    const client = await clientPromise;
    const db = client.db('luxgen');
    
    // Get all users with tenant information
    const users = await db.collection('users').aggregate([
      {
        $lookup: {
          from: 'tenants',
          localField: 'tenantId',
          foreignField: 'tenantId',
          as: 'tenant'
        }
      },
      {
        $unwind: '$tenant'
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          tenantId: 1,
          tenantName: '$tenant.name',
          tenantSubdomain: '$tenant.subdomain',
          createdAt: 1
        }
      }
    ]).toArray();
    
    res.json({
      success: true,
      data: users,
      count: users.length
    });
    
  } catch (error) {
    console.error('❌ Get all users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get all users',
      message: error.message
    });
  }
});

module.exports = router;
