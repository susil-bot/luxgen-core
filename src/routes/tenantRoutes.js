const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
// const { validateTenantData } = require('../utils/validation');

// Public routes (no authentication required)
router.post('/create', tenantController.createTenant);
router.get('/verify/:token', tenantController.verifyTenant);

// Protected routes (authentication required)
router.use(authenticateToken);

// Tenant management routes
router.get('/', requireAdmin, tenantController.getTenants);
router.get('/stats', requireAdmin, tenantController.getAllTenantStats);
router.get('/deleted', requireAdmin, tenantController.getDeletedTenants);
router.get('/:id', requireAdmin, tenantController.getTenantById);
router.get('/slug/:slug', requireAdmin, tenantController.getTenantBySlug);
router.put('/:id', requireAdmin, tenantController.updateTenant);
router.delete('/:id', requireAdmin, tenantController.deleteTenant);
router.post('/:id/restore', requireAdmin, tenantController.restoreTenant);

// Tenant verification routes
router.post('/:id/resend-verification', requireAdmin, tenantController.resendVerification);

// Subscription management routes
router.put('/:id/subscription', requireAdmin, tenantController.updateSubscription);

// Feature management routes
router.put('/:id/features', requireAdmin, tenantController.updateFeatures);

// Tenant statistics routes
router.get('/:id/stats', requireAdmin, tenantController.getTenantStats);

// Tenant analytics routes
router.get('/:id/analytics', requireAdmin, tenantController.getTenantAnalytics);
router.get('/:id/users', requireAdmin, tenantController.getTenantUsers);
router.get('/:id/settings', requireAdmin, tenantController.getTenantSettings);
router.put('/:id/settings', requireAdmin, tenantController.updateTenantSettings);

// Bulk operations (admin only)
router.post('/bulk/restore', requireAdmin, async (req, res) => {
  try {
    const { tenantIds } = req.body;
    
    if (!tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tenant IDs array is required'
      });
    }

    const result = await Tenant.updateMany(
      { _id: { $in: tenantIds }, isDeleted: true },
      { 
        isDeleted: false, 
        deletedAt: null,
        deletedBy: null
      }
    );

    res.json({
      success: true,
      message: `Restored ${result.modifiedCount} tenants`,
      data: {
        restored: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Error in bulk restore:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk restore',
      error: error.message
    });
  }
});

router.post('/bulk/update', requireAdmin, async (req, res) => {
  try {
    const { tenantIds, updates } = req.body;
    
    if (!tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tenant IDs array is required'
      });
    }

    const result = await Tenant.updateMany(
      { _id: { $in: tenantIds }, isDeleted: false },
      updates,
      { runValidators: true }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} tenants`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk update',
      error: error.message
    });
  }
});

router.post('/bulk/delete', requireAdmin, async (req, res) => {
  try {
    const { tenantIds, permanent = false } = req.body;
    
    if (!tenantIds || !Array.isArray(tenantIds) || tenantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tenant IDs array is required'
      });
    }

    if (permanent) {
      // Permanent deletion
      const result = await Tenant.deleteMany({ _id: { $in: tenantIds } });
      
      res.json({
        success: true,
        message: `Permanently deleted ${result.deletedCount} tenants`,
        data: {
          deleted: result.deletedCount
        }
      });
    } else {
      // Soft deletion
      const result = await Tenant.updateMany(
        { _id: { $in: tenantIds }, isDeleted: false },
        { 
          isDeleted: true, 
          deletedAt: new Date(),
          deletedBy: req.user.id
        }
      );

      res.json({
        success: true,
        message: `Soft deleted ${result.modifiedCount} tenants`,
        data: {
          deleted: result.modifiedCount
        }
      });
    }

  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk delete',
      error: error.message
    });
  }
});

// Export tenants (admin only)
router.get('/export/csv', requireAdmin, async (req, res) => {
  try {
    const { status, subscriptionStatus, industry, includeDeleted = false } = req.query;
    
    // Build filter
    const filter = {};
    if (includeDeleted !== 'true') {
      filter.isDeleted = false;
    }
    if (status) filter.status = status;
    if (subscriptionStatus) filter['subscription.status'] = subscriptionStatus;
    if (industry) filter.industry = industry;

    const tenants = await Tenant.find(filter)
      .select('-verificationToken -verificationExpires')
      .lean();

    // Convert to CSV
    const csvHeader = [
      'ID',
      'Name',
      'Slug',
      'Contact Email',
      'Status',
      'Verified',
      'Is Deleted',
      'Deleted At',
      'Industry',
      'Company Size',
      'Subscription Plan',
      'Subscription Status',
      'Created At',
      'Last Activity'
    ].join(',');

    const csvRows = tenants.map(tenant => [
      tenant._id,
      `"${tenant.name}"`,
      tenant.slug,
      tenant.contactEmail,
      tenant.status,
      tenant.isVerified,
      tenant.isDeleted || false,
      tenant.deletedAt || '',
      `"${tenant.industry || ''}"`,
      tenant.companySize || '',
      tenant.subscription?.plan || '',
      tenant.subscription?.status || '',
      tenant.createdAt,
      tenant.usage?.lastActivity || ''
    ].join(','));

    const csv = [csvHeader, ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=tenants.csv');
    res.send(csv);

  } catch (error) {
    console.error('Error exporting tenants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export tenants',
      error: error.message
    });
  }
});

// Tenant search (admin only)
router.get('/search/advanced', requireAdmin, async (req, res) => {
  try {
    const {
      query,
      status,
      subscriptionStatus,
      industry,
      companySize,
      dateFrom,
      dateTo,
      verified,
      includeDeleted = false,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Build filter
    const filter = {};
    
    // By default, exclude deleted tenants unless explicitly requested
    if (includeDeleted !== 'true') {
      filter.isDeleted = false;
    }
    
    if (status) filter.status = status;
    if (subscriptionStatus) filter['subscription.status'] = subscriptionStatus;
    if (industry) filter.industry = industry;
    if (companySize) filter.companySize = companySize;
    if (verified !== undefined) filter.isVerified = verified === 'true';
    
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { contactEmail: { $regex: query, $options: 'i' } },
        { slug: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [tenants, total] = await Promise.all([
      Tenant.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-verificationToken -verificationExpires'),
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
      },
      filters: {
        query,
        status,
        subscriptionStatus,
        industry,
        companySize,
        dateFrom,
        dateTo,
        verified
      }
    });

  } catch (error) {
    console.error('Error in advanced search:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform search',
      error: error.message
    });
  }
});

// Tenant analytics (admin only)
router.get('/analytics/overview', requireAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '7d':
        dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case '30d':
        dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case '90d':
        dateFilter = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
        break;
      case '1y':
        dateFilter = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
        break;
    }

    const analytics = await Tenant.aggregate([
      {
        $match: dateFilter
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
          trialTenants: {
            $sum: { $cond: [{ $eq: ['$subscription.status', 'trial'] }, 1, 0] }
          },
          totalPolls: { $sum: '$usage.pollsCreated' },
          totalRecipients: { $sum: '$usage.totalRecipients' },
          totalResponses: { $sum: '$usage.totalResponses' }
        }
      }
    ]);

    // Get daily signups for the period
    const dailySignups = await Tenant.aggregate([
      {
        $match: dateFilter
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get subscription distribution
    const subscriptionDistribution = await Tenant.aggregate([
      {
        $group: {
          _id: '$subscription.plan',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: analytics[0] || {},
        dailySignups,
        subscriptionDistribution,
        period
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

module.exports = router; 