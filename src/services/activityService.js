const Activity = require('../models/Activity');
const logger = require('../utils/logger');

/**
 * Activity Service
 * Business logic for activity management
 * Handles complex operations and data processing
 */

class ActivityService {
  /**
   * Create a system-generated activity
   * @param {Object} activityData - Activity data
   * @returns {Promise<Object>} Created activity
   */
  static async createSystemActivity(activityData) {
    try {
      const {
        tenantId,
        userId,
        title,
        description,
        type,
        metadata = {},
        visibility = 'tenant_only',
        tags = [],
        relatedEntities = {}
      } = activityData;

      // Get user information
      const User = require('../models/User');
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      const activity = new Activity({
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
      });

      await activity.save();
      return activity;
    } catch (error) {
      logger.error('Error creating system activity:', error);
      throw error;
    }
  }

  /**
   * Create user activity (user-generated)
   * @param {Object} activityData - Activity data
   * @returns {Promise<Object>} Created activity
   */
  static async createUserActivity(activityData) {
    try {
      const {
        tenantId,
        userId,
        title,
        description,
        type,
        metadata = {},
        visibility = 'tenant_only',
        tags = [],
        relatedEntities = {}
      } = activityData;

      // Validate user can create this type of activity
      const allowedTypes = ['feedback_submitted', 'general'];
      if (!allowedTypes.includes(type)) {
        throw new Error('User cannot create this type of activity');
      }

      const User = require('../models/User');
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      const activity = new Activity({
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
      });

      await activity.save();
      return activity;
    } catch (error) {
      logger.error('Error creating user activity:', error);
      throw error;
    }
  }

  /**
   * Get activity feed for a user
   * @param {string} tenantId - Tenant ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Activity feed data
   */
  static async getUserActivityFeed(tenantId, userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        dateFrom,
        dateTo,
        search
      } = options;

      const queryOptions = {
        limit: parseInt(limit, 10),
        skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
        type,
        dateFrom,
        dateTo
      };

      let activities;
      let totalCount;

      if (search) {
        activities = await Activity.searchActivities(tenantId, search, queryOptions);
        totalCount = await Activity.countDocuments({
          tenantId,
          status: 'active',
          $text: { $search: search }
        });
      } else {
        activities = await Activity.findByTenant(tenantId, queryOptions);
        totalCount = await Activity.countDocuments({
          tenantId,
          status: 'active',
          ...(type && { type }),
          ...(dateFrom || dateTo ? {
            timestamp: {
              ...(dateFrom && { $gte: new Date(dateFrom) }),
              ...(dateTo && { $lte: new Date(dateTo) })
            }
          } : {})
        });
      }

      return {
        activities,
        pagination: {
          currentPage: parseInt(page, 10),
          totalPages: Math.ceil(totalCount / parseInt(limit, 10)),
          totalCount,
          hasNextPage: parseInt(page, 10) < Math.ceil(totalCount / parseInt(limit, 10)),
          hasPrevPage: parseInt(page, 10) > 1
        }
      };
    } catch (error) {
      logger.error('Error getting user activity feed:', error);
      throw error;
    }
  }

  /**
   * Get activity analytics for a tenant
   * @param {string} tenantId - Tenant ID
   * @param {Object} options - Analytics options
   * @returns {Promise<Object>} Analytics data
   */
  static async getActivityAnalytics(tenantId, options = {}) {
    try {
      const { dateFrom, dateTo, groupBy = 'day' } = options;

      const matchStage = { tenantId, status: 'active' };
      
      if (dateFrom || dateTo) {
        matchStage.timestamp = {};
        if (dateFrom) {
          matchStage.timestamp.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          matchStage.timestamp.$lte = new Date(dateTo);
        }
      }

      const groupByFormat = {
        day: '%Y-%m-%d',
        week: '%Y-%U',
        month: '%Y-%m',
        year: '%Y'
      };

      const analytics = await Activity.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: groupByFormat[groupBy] || groupByFormat.day,
                  date: '$timestamp'
                }
              },
              type: '$type'
            },
            count: { $sum: 1 },
            totalLikes: { $sum: '$engagement.likes' },
            totalComments: { $sum: '$engagement.comments' },
            totalShares: { $sum: '$engagement.shares' },
            totalViews: { $sum: '$engagement.views' }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            activities: {
              $push: {
                type: '$_id.type',
                count: '$count',
                likes: '$totalLikes',
                comments: '$totalComments',
                shares: '$totalShares',
                views: '$totalViews'
              }
            },
            totalActivities: { $sum: '$count' },
            totalEngagement: {
              $sum: { $add: ['$totalLikes', '$totalComments', '$totalShares'] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return analytics;
    } catch (error) {
      logger.error('Error getting activity analytics:', error);
      throw error;
    }
  }

  /**
   * Get trending activities
   * @param {string} tenantId - Tenant ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Trending activities
   */
  static async getTrendingActivities(tenantId, options = {}) {
    try {
      const { limit = 10, timeRange = '7d' } = options;

      const timeRanges = {
        '1d': 1,
        '7d': 7,
        '30d': 30,
        '90d': 90
      };

      const days = timeRanges[timeRange] || 7;
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      const activities = await Activity.aggregate([
        {
          $match: {
            tenantId,
            status: 'active',
            timestamp: { $gte: dateFrom }
          }
        },
        {
          $addFields: {
            engagementScore: {
              $add: [
                { $multiply: ['$engagement.likes', 2] },
                { $multiply: ['$engagement.comments', 3] },
                { $multiply: ['$engagement.shares', 5] },
                { $multiply: ['$engagement.views', 0.1] }
              ]
            }
          }
        },
        { $sort: { engagementScore: -1, timestamp: -1 } },
        { $limit: parseInt(limit, 10) },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
            pipeline: [
              { $project: { name: 1, email: 1, avatar: 1 } }
            ]
          }
        },
        { $unwind: '$user' }
      ]);

      return activities;
    } catch (error) {
      logger.error('Error getting trending activities:', error);
      throw error;
    }
  }

  /**
   * Get activity recommendations for a user
   * @param {string} tenantId - Tenant ID
   * @param {string} userId - User ID
   * @param {Object} options - Recommendation options
   * @returns {Promise<Array>} Recommended activities
   */
  static async getActivityRecommendations(tenantId, userId, options = {}) {
    try {
      const { limit = 10 } = options;

      // Get user's activity history to understand preferences
      const userActivities = await Activity.find({
        tenantId,
        userId,
        status: 'active'
      }).select('type tags').lean();

      // Extract user preferences
      const userTypes = [...new Set(userActivities.map(a => a.type))];
      const userTags = [...new Set(userActivities.flatMap(a => a.tags))];

      // Find similar activities
      const recommendations = await Activity.find({
        tenantId,
        status: 'active',
        userId: { $ne: userId }, // Exclude user's own activities
        $or: [
          { type: { $in: userTypes } },
          { tags: { $in: userTags } }
        ]
      })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10))
      .populate('userId', 'name email avatar')
      .lean();

      return recommendations;
    } catch (error) {
      logger.error('Error getting activity recommendations:', error);
      throw error;
    }
  }

  /**
   * Archive old activities
   * @param {string} tenantId - Tenant ID
   * @param {number} daysOld - Number of days old to archive
   * @returns {Promise<number>} Number of activities archived
   */
  static async archiveOldActivities(tenantId, daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Activity.updateMany(
        {
          tenantId,
          status: 'active',
          timestamp: { $lt: cutoffDate },
          type: { $nin: ['announcement', 'milestone_reached'] } // Keep important activities
        },
        { status: 'archived' }
      );

      logger.info(`Archived ${result.modifiedCount} old activities for tenant ${tenantId}`);
      return result.modifiedCount;
    } catch (error) {
      logger.error('Error archiving old activities:', error);
      throw error;
    }
  }

  /**
   * Clean up expired activities
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<number>} Number of activities cleaned up
   */
  static async cleanupExpiredActivities(tenantId) {
    try {
      const result = await Activity.updateMany(
        {
          tenantId,
          status: 'active',
          expiresAt: { $lt: new Date() }
        },
        { status: 'deleted' }
      );

      logger.info(`Cleaned up ${result.modifiedCount} expired activities for tenant ${tenantId}`);
      return result.modifiedCount;
    } catch (error) {
      logger.error('Error cleaning up expired activities:', error);
      throw error;
    }
  }

  /**
   * Get activity engagement trends
   * @param {string} tenantId - Tenant ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Engagement trends
   */
  static async getEngagementTrends(tenantId, options = {}) {
    try {
      const { dateFrom, dateTo, groupBy = 'day' } = options;

      const matchStage = { tenantId, status: 'active' };
      
      if (dateFrom || dateTo) {
        matchStage.timestamp = {};
        if (dateFrom) {
          matchStage.timestamp.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          matchStage.timestamp.$lte = new Date(dateTo);
        }
      }

      const groupByFormat = {
        day: '%Y-%m-%d',
        week: '%Y-%U',
        month: '%Y-%m'
      };

      const trends = await Activity.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: groupByFormat[groupBy] || groupByFormat.day,
                  date: '$timestamp'
                }
              }
            },
            totalLikes: { $sum: '$engagement.likes' },
            totalComments: { $sum: '$engagement.comments' },
            totalShares: { $sum: '$engagement.shares' },
            totalViews: { $sum: '$engagement.views' },
            activityCount: { $sum: 1 }
          }
        },
        {
          $addFields: {
            engagementRate: {
              $cond: {
                if: { $gt: ['$totalViews', 0] },
                then: { $divide: [{ $add: ['$totalLikes', '$totalComments', '$totalShares'] }, '$totalViews'] },
                else: 0
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return trends;
    } catch (error) {
      logger.error('Error getting engagement trends:', error);
      throw error;
    }
  }
}

module.exports = ActivityService;
