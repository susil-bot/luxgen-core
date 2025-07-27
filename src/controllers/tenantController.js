// const { validateTenantData } = require('../utils/validation');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Poll = require('../models/Poll');
const TrainingSession = require('../models/TrainingSession');
const Presentation = require('../models/Presentation');
const { emailService } = require('../services/emailService');
const { generateSlug } = require('../utils/helpers');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');

// Create a new tenant
const createTenant = async (req, res) => {
  try {
    const tenantData = req.body;
    
    // Validate tenant data
    const validation = validateTenantData(tenantData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Check if tenant with same email or slug already exists
    const existingTenant = await Tenant.findOne({
      $or: [
        { contactEmail: tenantData.contactEmail },
        { slug: tenantData.slug || generateSlug(tenantData.name) }
      ]
    });

    if (existingTenant) {
      return res.status(409).json({
        success: false,
        message: 'Tenant with this email or slug already exists'
      });
    }

    // Generate slug if not provided
    if (!tenantData.slug) {
      tenantData.slug = generateSlug(tenantData.name);
    }

    // Set default values
    tenantData.status = 'pending';
    tenantData.isVerified = false;
    tenantData.metadata = {
      ...tenantData.metadata,
      source: req.body.source || 'api'
    };

    // Create tenant
    const tenant = new Tenant(tenantData);
    await tenant.save();

    // Generate verification token and send email
    await tenant.generateVerificationToken();
    // Temporarily disabled email sending for testing
    // await emailService.sendVerificationEmail(tenant.contactEmail, tenant.verificationToken);

    res.status(201).json({
      success: true,
      message: 'Tenant created successfully',
      data: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        contactEmail: tenant.contactEmail,
        status: tenant.status,
        isVerified: tenant.isVerified,
        subscription: tenant.subscription
      }
    });

  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tenant',
      error: error.message
    });
  }
};

// Get all tenants (with pagination and filtering)
const getTenants = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      subscriptionStatus,
      industry,
      companySize,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = false
    } = req.query;

    // Build filter object
    const filter = {};
    
    // By default, exclude deleted tenants unless explicitly requested
    if (includeDeleted !== 'true') {
      filter.isDeleted = false;
    }
    
    if (status) filter.status = status;
    if (subscriptionStatus) filter['subscription.status'] = subscriptionStatus;
    if (industry) filter.industry = industry;
    if (companySize) filter.companySize = companySize;
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactEmail: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [tenants, total] = await Promise.all([
      Tenant.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-verificationToken -verificationExpires')
        .populate('deletedBy', 'name email'),
      Tenant.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: tenants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenants',
      error: error.message
    });
  }
};

// Get tenant by ID
const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeDeleted = false } = req.query;
    
    const filter = { _id: id };
    if (includeDeleted !== 'true') {
      filter.isDeleted = false;
    }
    
    const tenant = await Tenant.findOne(filter)
      .select('-verificationToken -verificationExpires')
      .populate('deletedBy', 'name email');

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: tenant
    });

  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant',
      error: error.message
    });
  }
};

// Get tenant by slug
const getTenantBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const tenant = await Tenant.findOne({ slug })
      .select('-verificationToken -verificationExpires');

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: tenant
    });

  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant',
      error: error.message
    });
  }
};

// Update tenant
const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate update data
    const validation = validateTenantData(updateData, true);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Check if slug is being updated and if it's unique
    if (updateData.slug) {
      const existingTenant = await Tenant.findOne({ 
        slug: updateData.slug, 
        _id: { $ne: id } 
      });
      
      if (existingTenant) {
        return res.status(409).json({
          success: false,
          message: 'Tenant with this slug already exists'
        });
      }
    }

    const tenant = await Tenant.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-verificationToken -verificationExpires');

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      message: 'Tenant updated successfully',
      data: tenant
    });

  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant',
      error: error.message
    });
  }
};

// Soft delete tenant
const deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;
    
    const tenant = await Tenant.findById(id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    if (tenant.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Tenant is already deleted'
      });
    }

    if (permanent === 'true') {
      // Permanent deletion
      await tenant.permanentDelete();
      res.json({
        success: true,
        message: 'Tenant permanently deleted successfully'
      });
    } else {
      // Soft deletion
      await tenant.softDelete(req.user?.id);
      res.json({
        success: true,
        message: 'Tenant soft deleted successfully',
        data: {
          id: tenant._id,
          name: tenant.name,
          deletedAt: tenant.deletedAt
        }
      });
    }

  } catch (error) {
    console.error('Error deleting tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tenant',
      error: error.message
    });
  }
};

// Verify tenant
const verifyTenant = async (req, res) => {
  try {
    const { token } = req.params;
    
    const tenant = await Tenant.findOne({
      verificationToken: token,
      verificationExpires: { $gt: new Date() }
    });

    if (!tenant) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    await tenant.verify();

    res.json({
      success: true,
      message: 'Tenant verified successfully',
      data: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        isVerified: tenant.isVerified
      }
    });

  } catch (error) {
    console.error('Error verifying tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify tenant',
      error: error.message
    });
  }
};

// Resend verification email
const resendVerification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tenant = await Tenant.findById(id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    if (tenant.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Tenant is already verified'
      });
    }

    await tenant.generateVerificationToken();
    // Temporarily disabled email sending for testing
    // await emailService.sendVerificationEmail(tenant.contactEmail, tenant.verificationToken);

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Error resending verification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
      error: error.message
    });
  }
};

// Update subscription
const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const subscriptionData = req.body;
    
    const tenant = await Tenant.findById(id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Update subscription data
    tenant.subscription = {
      ...tenant.subscription,
      ...subscriptionData
    };

    // If changing to active plan, set end date
    if (subscriptionData.status === 'active' && subscriptionData.billingCycle) {
      const endDate = new Date();
      if (subscriptionData.billingCycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (subscriptionData.billingCycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      tenant.subscription.endDate = endDate;
    }

    await tenant.save();

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: {
        id: tenant._id,
        subscription: tenant.subscription
      }
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription',
      error: error.message
    });
  }
};

// Update features
const updateFeatures = async (req, res) => {
  try {
    const { id } = req.params;
    const featuresData = req.body;
    
    const tenant = await Tenant.findById(id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Update features
    tenant.features = {
      ...tenant.features,
      ...featuresData
    };

    await tenant.save();

    res.json({
      success: true,
      message: 'Features updated successfully',
      data: {
        id: tenant._id,
        features: tenant.features
      }
    });

  } catch (error) {
    console.error('Error updating features:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update features',
      error: error.message
    });
  }
};

// Get tenant statistics
const getTenantStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tenant = await Tenant.findById(id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Calculate additional statistics
    const stats = {
      basic: {
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        isVerified: tenant.isVerified,
        createdAt: tenant.createdAt,
        lastActivity: tenant.usage.lastActivity
      },
      subscription: {
        plan: tenant.subscription.plan,
        status: tenant.subscription.status,
        isActive: tenant.isSubscriptionActive,
        isInTrial: tenant.isInTrial,
        trialDaysRemaining: tenant.trialDaysRemaining,
        startDate: tenant.subscription.startDate,
        endDate: tenant.subscription.endDate
      },
      usage: tenant.usage,
      features: {
        polls: tenant.features.polls,
        analytics: tenant.features.analytics,
        integrations: tenant.features.integrations,
        branding: tenant.features.branding
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching tenant stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant statistics',
      error: error.message
    });
  }
};

// Get all tenant statistics (admin)
const getAllTenantStats = async (req, res) => {
  try {
    const stats = await Tenant.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $group: {
          _id: null,
          totalTenants: { $sum: 1 },
          activeTenants: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          verifiedTenants: {
            $sum: { $cond: ['$isVerified', 1, 0] }
          },
          totalPolls: { $sum: '$usage.pollsCreated' },
          totalRecipients: { $sum: '$usage.totalRecipients' },
          totalResponses: { $sum: '$usage.totalResponses' },
          avgResponseRate: {
            $avg: {
              $cond: [
                { $gt: ['$usage.totalRecipients', 0] },
                { $divide: ['$usage.totalResponses', '$usage.totalRecipients'] },
                0
              ]
            }
          }
        }
      }
    ]);

    const subscriptionStats = await Tenant.aggregate([
      {
        $match: { isDeleted: false }
      },
      {
        $group: {
          _id: '$subscription.plan',
          count: { $sum: 1 }
        }
      }
    ]);

    const industryStats = await Tenant.aggregate([
      {
        $match: { 
          industry: { $exists: true, $ne: '' },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: '$industry',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get deleted tenants count
    const deletedStats = await Tenant.aggregate([
      {
        $match: { isDeleted: true }
      },
      {
        $group: {
          _id: null,
          deletedTenants: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: { ...stats[0], deletedTenants: deletedStats[0]?.deletedTenants || 0 } || {},
        subscriptions: subscriptionStats,
        industries: industryStats
      }
    });

  } catch (error) {
    console.error('Error fetching all tenant stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant statistics',
      error: error.message
    });
  }
};

// Get deleted tenants
const getDeletedTenants = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'deletedAt',
      sortOrder = 'desc'
    } = req.query;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [tenants, total] = await Promise.all([
      Tenant.find({ isDeleted: true })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-verificationToken -verificationExpires')
        .populate('deletedBy', 'name email'),
      Tenant.countDocuments({ isDeleted: true })
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: tenants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching deleted tenants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deleted tenants',
      error: error.message
    });
  }
};

// Restore deleted tenant
const restoreTenant = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tenant = await Tenant.findById(id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    if (!tenant.isDeleted) {
      return res.status(400).json({
        success: false,
        message: 'Tenant is not deleted'
      });
    }

    await tenant.restore();

    res.json({
      success: true,
      message: 'Tenant restored successfully',
      data: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        isDeleted: tenant.isDeleted
      }
    });

  } catch (error) {
    console.error('Error restoring tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore tenant',
      error: error.message
    });
  }
};

// Get tenant analytics
const getTenantAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '30d' } = req.query; // 7d, 30d, 90d, 1y
    
    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get analytics data from various collections
    const [
      userStats,
      pollStats,
      trainingStats,
      presentationStats,
      aiUsageStats
    ] = await Promise.all([
      // User analytics
      User.aggregate([
        { $match: { tenantId: tenant._id, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            newUsers: { $sum: 1 },
            activeUsers: {
              $sum: {
                $cond: [
                  { $gte: ["$lastLogin", startDate] },
                  1,
                  0
                ]
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Poll analytics
      Poll.aggregate([
        { $match: { tenantId: tenant._id, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            pollsCreated: { $sum: 1 },
            totalResponses: { $sum: "$responseCount" },
            avgResponseRate: { $avg: "$responseRate" }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Training analytics
      TrainingSession.aggregate([
        { $match: { tenantId: tenant._id, scheduledAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$scheduledAt" }
            },
            sessionsScheduled: { $sum: 1 },
            sessionsCompleted: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "completed"] },
                  1,
                  0
                ]
              }
            },
            avgAttendance: { $avg: "$attendanceRate" }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Presentation analytics
      Presentation.aggregate([
        { $match: { tenantId: tenant._id, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            presentationsCreated: { $sum: 1 },
            sessionsHeld: { $sum: { $size: "$sessions" } },
            avgSessionDuration: { $avg: "$estimatedDuration" }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // AI usage analytics
      // Note: This would require an AI usage tracking collection
      // For now, returning empty array
      Promise.resolve([])
    ]);

    // Calculate summary statistics
    const summary = {
      totalUsers: await User.countDocuments({ tenantId: tenant._id }),
      activeUsers: await User.countDocuments({ 
        tenantId: tenant._id, 
        lastLogin: { $gte: startDate } 
      }),
      totalPolls: await Poll.countDocuments({ tenantId: tenant._id }),
      totalTrainingSessions: await TrainingSession.countDocuments({ tenantId: tenant._id }),
      totalPresentations: await Presentation.countDocuments({ tenantId: tenant._id }),
      period: period,
      startDate: startDate,
      endDate: now
    };

    res.json({
      success: true,
      data: {
        tenant: {
          id: tenant._id,
          name: tenant.name,
          slug: tenant.slug
        },
        summary,
        analytics: {
          users: userStats,
          polls: pollStats,
          training: trainingStats,
          presentations: presentationStats,
          aiUsage: aiUsageStats
        }
      }
    });

  } catch (error) {
    console.error('Error fetching tenant analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant analytics',
      error: error.message
    });
  }
};

// Get tenant users
const getTenantUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 10,
      role,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Build filter object
    const filter = { tenantId: tenant._id };
    
    if (role) filter.role = role;
    if (status) filter.status = status;
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-password -verificationToken'),
      User.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    // Calculate user statistics
    const userStats = await User.aggregate([
      { $match: { tenantId: tenant._id } },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: {
              $cond: [
                { $eq: ["$status", "active"] },
                1,
                0
              ]
            }
          },
          verifiedUsers: {
            $sum: {
              $cond: [
                { $eq: ["$isVerified", true] },
                1,
                0
              ]
            }
          },
          adminUsers: {
            $sum: {
              $cond: [
                { $eq: ["$role", "admin"] },
                1,
                0
              ]
            }
          },
          trainerUsers: {
            $sum: {
              $cond: [
                { $eq: ["$role", "trainer"] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        tenant: {
          id: tenant._id,
          name: tenant.name,
          slug: tenant.slug
        },
        users,
        statistics: userStats[0] || {
          totalUsers: 0,
          activeUsers: 0,
          verifiedUsers: 0,
          adminUsers: 0,
          trainerUsers: 0
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching tenant users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant users',
      error: error.message
    });
  }
};

// Get tenant settings
const getTenantSettings = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Extract settings from tenant document
    const settings = {
      general: {
        name: tenant.name,
        description: tenant.description,
        contact: tenant.contact,
        address: tenant.address,
        business: tenant.business
      },
      subscription: tenant.subscription,
      features: tenant.features,
      branding: tenant.branding,
      security: tenant.security,
      notifications: tenant.notifications,
      integrations: tenant.integrations,
      customizations: tenant.customizations
    };

    res.json({
      success: true,
      data: {
        tenant: {
          id: tenant._id,
          name: tenant.name,
          slug: tenant.slug
        },
        settings
      }
    });

  } catch (error) {
    console.error('Error fetching tenant settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tenant settings',
      error: error.message
    });
  }
};

// Update tenant settings
const updateTenantSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Validate update data
    const allowedSettings = [
      'name', 'description', 'contact', 'address', 'business',
      'features', 'branding', 'security', 'notifications',
      'integrations', 'customizations'
    ];

    const validUpdates = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedSettings.includes(key)) {
        validUpdates[key] = value;
      }
    }

    if (Object.keys(validUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid settings provided for update'
      });
    }

    // Update tenant with new settings
    const updatedTenant = await Tenant.findByIdAndUpdate(
      id,
      validUpdates,
      { new: true, runValidators: true }
    ).select('-verificationToken -verificationExpires');

    res.json({
      success: true,
      message: 'Tenant settings updated successfully',
      data: {
        tenant: {
          id: updatedTenant._id,
          name: updatedTenant.name,
          slug: updatedTenant.slug
        },
        updatedSettings: validUpdates
      }
    });

  } catch (error) {
    console.error('Error updating tenant settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant settings',
      error: error.message
    });
  }
};

module.exports = {
  createTenant,
  getTenants,
  getTenantById,
  getTenantBySlug,
  updateTenant,
  deleteTenant,
  verifyTenant,
  resendVerification,
  updateSubscription,
  updateFeatures,
  getTenantStats,
  getAllTenantStats,
  getDeletedTenants,
  restoreTenant,
  getTenantAnalytics,
  getTenantUsers,
  getTenantSettings,
  updateTenantSettings
}; 