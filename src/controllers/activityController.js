const Activity = require('../models/Activity');
const { validationResult } = require('express-validator');
const { ApiResponse } = require('../utils/errors');

/**
 * Activity Controller
 * Handles all activity-related API endpoints
 * Supports multi-tenancy with proper tenant isolation
 */

/**
 * Get activities for a tenant with filtering and pagination
 * GET /api/activities
 */
const getActivities = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse.error('Validation failed', errors.array()));
    }

    const { tenantId } = req.tenant;
    const {
      page = 1,
      limit = 10,
      type,
      userId,
      visibility = 'tenant_only',
      tags,
      dateFrom,
      dateTo,
      search
    } = req.query;

    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      type,
      userId,
      visibility,
      tags: tags ? tags.split(',') : undefined,
      dateFrom,
      dateTo
    };

    let activities;
    let totalCount;

    if (search) {
      // Text search
      activities = await Activity.searchActivities(tenantId, search, options);
      totalCount = await Activity.countDocuments({
        tenantId,
        status: 'active',
        $text: { $search: search }
      });
    } else {
      // Regular query
      activities = await Activity.findByTenant(tenantId, options);
      totalCount = await Activity.countDocuments({
        tenantId,
        status: 'active',
        ...(type && { type }),
        ...(userId && { userId }),
        ...(visibility && { visibility }),
        ...(tags && { tags: { $in: tags.split(',') } }),
        ...(dateFrom || dateTo ? {
          timestamp: {
            ...(dateFrom && { $gte: new Date(dateFrom) }),
            ...(dateTo && { $lte: new Date(dateTo) })
          }
        } : {})
      });
    }

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json(ApiResponse.success({
      activities,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    }));

  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json(ApiResponse.error('Failed to fetch activities', error.message));
  }
};

/**
 * Get activity statistics for a tenant
 * GET /api/activities/stats
 */
const getActivityStats = async (req, res) => {
  try {
    const { tenantId } = req.tenant;
    const { dateFrom, dateTo } = req.query;

    const options = { dateFrom, dateTo };
    const stats = await Activity.getActivityStats(tenantId, options);

    if (stats.length === 0) {
      return res.json(ApiResponse.success({
        totalActivities: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalViews: 0,
        uniqueUsers: 0,
        activityTypes: [],
        engagementRate: 0
      }));
    }

    res.json(ApiResponse.success(stats[0]));

  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json(ApiResponse.error('Failed to fetch activity statistics', error.message));
  }
};

/**
 * Get a specific activity by ID
 * GET /api/activities/:id
 */
const getActivityById = async (req, res) => {
  try {
    const { tenantId } = req.tenant;
    const { id } = req.params;

    const activity = await Activity.findOne({
      id,
      tenantId,
      status: 'active'
    }).populate('userId', 'name email avatar').lean();

    if (!activity) {
      return res.status(404).json(ApiResponse.error('Activity not found'));
    }

    res.json(ApiResponse.success(activity));

  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json(ApiResponse.error('Failed to fetch activity', error.message));
  }
};

/**
 * Create a new activity
 * POST /api/activities
 */
const createActivity = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse.error('Validation failed', errors.array()));
    }

    const { tenantId } = req.tenant;
    const { userId } = req.user;
    const {
      title,
      description,
      type,
      metadata = {},
      visibility = 'tenant_only',
      tags = [],
      relatedEntities = {}
    } = req.body;

    // Get user information
    const user = await req.app.locals.db.collection('users').findOne({
      _id: userId,
      tenantId
    });

    if (!user) {
      return res.status(404).json(ApiResponse.error('User not found'));
    }

    const activityData = {
      tenantId,
      userId,
      userName: user.name || user.email,
      userEmail: user.email,
      title,
      description,
      type,
      metadata,
      visibility,
      tags,
      relatedEntities
    };

    const activity = new Activity(activityData);
    await activity.save();

    // Populate user data
    const populatedActivity = await Activity.findById(activity._id)
      .populate('userId', 'name email avatar')
      .lean();

    res.status(201).json(ApiResponse.success(populatedActivity, 'Activity created successfully'));

  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json(ApiResponse.error('Failed to create activity', error.message));
  }
};

/**
 * Update an activity
 * PUT /api/activities/:id
 */
const updateActivity = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse.error('Validation failed', errors.array()));
    }

    const { tenantId } = req.tenant;
    const { id } = req.params;
    const { userId } = req.user;
    const updateData = req.body;

    const activity = await Activity.findOne({
      id,
      tenantId,
      status: 'active'
    });

    if (!activity) {
      return res.status(404).json(ApiResponse.error('Activity not found'));
    }

    // Check if user can update this activity
    if (activity.userId.toString() !== userId.toString()) {
      return res.status(403).json(ApiResponse.error('Not authorized to update this activity'));
    }

    // Update allowed fields
    const allowedFields = ['title', 'description', 'metadata', 'visibility', 'tags'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        activity[field] = updateData[field];
      }
    });

    await activity.save();

    const updatedActivity = await Activity.findById(activity._id)
      .populate('userId', 'name email avatar')
      .lean();

    res.json(ApiResponse.success(updatedActivity, 'Activity updated successfully'));

  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json(ApiResponse.error('Failed to update activity', error.message));
  }
};

/**
 * Delete an activity (soft delete)
 * DELETE /api/activities/:id
 */
const deleteActivity = async (req, res) => {
  try {
    const { tenantId } = req.tenant;
    const { id } = req.params;
    const { userId } = req.user;

    const activity = await Activity.findOne({
      id,
      tenantId,
      status: 'active'
    });

    if (!activity) {
      return res.status(404).json(ApiResponse.error('Activity not found'));
    }

    // Check if user can delete this activity
    if (activity.userId.toString() !== userId.toString()) {
      return res.status(403).json(ApiResponse.error('Not authorized to delete this activity'));
    }

    await activity.softDelete();

    res.json(ApiResponse.success(null, 'Activity deleted successfully'));

  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json(ApiResponse.error('Failed to delete activity', error.message));
  }
};

/**
 * Perform an action on an activity (like, comment, share)
 * POST /api/activities/:id/actions
 */
const performActivityAction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(ApiResponse.error('Validation failed', errors.array()));
    }

    const { tenantId } = req.tenant;
    const { id } = req.params;
    const { action, amount = 1 } = req.body;

    const activity = await Activity.findOne({
      id,
      tenantId,
      status: 'active'
    });

    if (!activity) {
      return res.status(404).json(ApiResponse.error('Activity not found'));
    }

    const validActions = ['likes', 'comments', 'shares', 'views'];
    if (!validActions.includes(action)) {
      return res.status(400).json(ApiResponse.error('Invalid action type'));
    }

    await activity.incrementEngagement(action, amount);

    const updatedActivity = await Activity.findById(activity._id)
      .populate('userId', 'name email avatar')
      .lean();

    res.json(ApiResponse.success(updatedActivity, 'Action performed successfully'));

  } catch (error) {
    console.error('Error performing activity action:', error);
    res.status(500).json(ApiResponse.error('Failed to perform action', error.message));
  }
};

/**
 * Get activities by user
 * GET /api/activities/user/:userId
 */
const getActivitiesByUser = async (req, res) => {
  try {
    const { tenantId } = req.tenant;
    const { userId } = req.params;
    const {
      page = 1,
      limit = 10,
      type,
      dateFrom,
      dateTo
    } = req.query;

    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      type,
      dateFrom,
      dateTo
    };

    const activities = await Activity.findByTenant(tenantId, {
      ...options,
      userId
    });

    const totalCount = await Activity.countDocuments({
      tenantId,
      userId,
      status: 'active',
      ...(type && { type }),
      ...(dateFrom || dateTo ? {
        timestamp: {
          ...(dateFrom && { $gte: new Date(dateFrom) }),
          ...(dateTo && { $lte: new Date(dateTo) })
        }
      } : {})
    });

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json(ApiResponse.success({
      activities,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    }));

  } catch (error) {
    console.error('Error fetching user activities:', error);
    res.status(500).json(ApiResponse.error('Failed to fetch user activities', error.message));
  }
};

/**
 * Get activities by type
 * GET /api/activities/type/:type
 */
const getActivitiesByType = async (req, res) => {
  try {
    const { tenantId } = req.tenant;
    const { type } = req.params;
    const {
      page = 1,
      limit = 10,
      dateFrom,
      dateTo
    } = req.query;

    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      type,
      dateFrom,
      dateTo
    };

    const activities = await Activity.findByTenant(tenantId, options);

    const totalCount = await Activity.countDocuments({
      tenantId,
      type,
      status: 'active',
      ...(dateFrom || dateTo ? {
        timestamp: {
          ...(dateFrom && { $gte: new Date(dateFrom) }),
          ...(dateTo && { $lte: new Date(dateTo) })
        }
      } : {})
    });

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json(ApiResponse.success({
      activities,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    }));

  } catch (error) {
    console.error('Error fetching activities by type:', error);
    res.status(500).json(ApiResponse.error('Failed to fetch activities by type', error.message));
  }
};

/**
 * Search activities
 * GET /api/activities/search
 */
const searchActivities = async (req, res) => {
  try {
    const { tenantId } = req.tenant;
    const {
      q: searchTerm,
      page = 1,
      limit = 10,
      type,
      userId
    } = req.query;

    if (!searchTerm) {
      return res.status(400).json(ApiResponse.error('Search term is required'));
    }

    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      type,
      userId
    };

    const activities = await Activity.searchActivities(tenantId, searchTerm, options);

    const totalCount = await Activity.countDocuments({
      tenantId,
      status: 'active',
      $text: { $search: searchTerm },
      ...(type && { type }),
      ...(userId && { userId })
    });

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json(ApiResponse.success({
      activities,
      searchTerm,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    }));

  } catch (error) {
    console.error('Error searching activities:', error);
    res.status(500).json(ApiResponse.error('Failed to search activities', error.message));
  }
};

/**
 * Get activity engagement metrics
 * GET /api/activities/:id/engagement
 */
const getActivityEngagement = async (req, res) => {
  try {
    const { tenantId } = req.tenant;
    const { id } = req.params;

    const activity = await Activity.findOne({
      id,
      tenantId,
      status: 'active'
    }).select('engagement').lean();

    if (!activity) {
      return res.status(404).json(ApiResponse.error('Activity not found'));
    }

    res.json(ApiResponse.success(activity.engagement));

  } catch (error) {
    console.error('Error fetching activity engagement:', error);
    res.status(500).json(ApiResponse.error('Failed to fetch activity engagement', error.message));
  }
};

module.exports = {
  getActivities,
  getActivityStats,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  performActivityAction,
  getActivitiesByUser,
  getActivitiesByType,
  searchActivities,
  getActivityEngagement
};
