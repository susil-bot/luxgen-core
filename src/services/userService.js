const { getCollection } = require('../config/mongodb');
const logger = require('../utils/logger');

/**
 * User Management Service
 * Handles user CRUD operations, tenant management, and user roles
 */
class UserService {
  constructor() {
    this.usersCollection = null;
    this.tenantsCollection = null;
  }

  /**
   * Initialize collections
   */
  async init() {
    this.usersCollection = getCollection('users');
    this.tenantsCollection = getCollection('tenants');
  }

  /**
   * Get all users with pagination and filtering
   */
  async getUsers(options = {}) {
    try {
      await this.init();
      
      const {
        page = 1,
        limit = 10,
        tenantId = null,
        role = null,
        status = null,
        search = null,
        sortBy = 'createdAt',
        sortOrder = -1
      } = options;

      // Build query
      const query = {};
      if (tenantId) query.tenantId = tenantId;
      if (role) query.role = role;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } }
        ];
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get users
      const users = await this.usersCollection
        .find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .toArray();

      // Get total count
      const total = await this.usersCollection.countDocuments(query);

      // Remove passwords
      const sanitizedUsers = users.map(user => {
        delete user.password;
        return user;
      });

      return {
        success: true,
        users: sanitizedUsers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Failed to get users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      await this.init();
      
      const user = await this.usersCollection.findOne({ _id: userId });
      if (!user) {
        throw new Error('User not found');
      }
      
      delete user.password;
      return { success: true, user };
    } catch (error) {
      logger.error('Failed to get user:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(userId, updateData) {
    try {
      await this.init();
      
      // Remove sensitive fields
      delete updateData.password;
      delete updateData._id;
      delete updateData.createdAt;
      updateData.updatedAt = new Date();

      const result = await this.usersCollection.updateOne(
        { _id: userId },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        throw new Error('User not found');
      }

      const user = await this.usersCollection.findOne({ _id: userId });
      delete user.password;
      
      logger.info(`User updated: ${userId}`);
      return { success: true, user };
    } catch (error) {
      logger.error('Failed to update user:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId) {
    try {
      await this.init();
      
      const result = await this.usersCollection.deleteOne({ _id: userId });
      if (result.deletedCount === 0) {
        throw new Error('User not found');
      }

      // Also delete user sessions
      const sessionsCollection = getCollection('sessions');
      await sessionsCollection.deleteMany({ userId: userId });
      
      logger.info(`User deleted: ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Failed to delete user:', error);
      throw error;
    }
  }

  /**
   * Change user status
   */
  async changeUserStatus(userId, status) {
    try {
      await this.init();
      
      const validStatuses = ['active', 'inactive', 'suspended', 'pending'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status');
      }

      const result = await this.usersCollection.updateOne(
        { _id: userId },
        { $set: { status: status, updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        throw new Error('User not found');
      }

      logger.info(`User status changed to ${status}: ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Failed to change user status:', error);
      throw error;
    }
  }

  /**
   * Assign user to tenant
   */
  async assignUserToTenant(userId, tenantId) {
    try {
      await this.init();
      
      // Check if tenant exists
      const tenant = await this.tenantsCollection.findOne({ _id: tenantId });
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const result = await this.usersCollection.updateOne(
        { _id: userId },
        { $set: { tenantId: tenantId, updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        throw new Error('User not found');
      }

      logger.info(`User assigned to tenant: ${userId} -> ${tenantId}`);
      return { success: true };
    } catch (error) {
      logger.error('Failed to assign user to tenant:', error);
      throw error;
    }
  }

  /**
   * Change user role
   */
  async changeUserRole(userId, role) {
    try {
      await this.init();
      
      const validRoles = ['admin', 'user', 'trainer', 'moderator'];
      if (!validRoles.includes(role)) {
        throw new Error('Invalid role');
      }

      const result = await this.usersCollection.updateOne(
        { _id: userId },
        { $set: { role: role, updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        throw new Error('User not found');
      }

      logger.info(`User role changed to ${role}: ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Failed to change user role:', error);
      throw error;
    }
  }

  /**
   * Get users by tenant
   */
  async getUsersByTenant(tenantId, options = {}) {
    try {
      const userOptions = { ...options, tenantId };
      return await this.getUsers(userOptions);
    } catch (error) {
      logger.error('Failed to get users by tenant:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(tenantId = null) {
    try {
      await this.init();
      
      const query = tenantId ? { tenantId } : {};
      
      const stats = await this.usersCollection.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
            suspended: { $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } },
            admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
            trainers: { $sum: { $cond: [{ $eq: ['$role', 'trainer'] }, 1, 0] } },
            users: { $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] } }
          }
        }
      ]).toArray();

      return {
        success: true,
        stats: stats[0] || { total: 0, active: 0, inactive: 0, suspended: 0, admins: 0, trainers: 0, users: 0 }
      };
    } catch (error) {
      logger.error('Failed to get user stats:', error);
      throw error;
    }
  }

  /**
   * Search users
   */
  async searchUsers(searchTerm, options = {}) {
    try {
      const searchOptions = { ...options, search: searchTerm };
      return await this.getUsers(searchOptions);
    } catch (error) {
      logger.error('Failed to search users:', error);
      throw error;
    }
  }

  /**
   * Bulk update users
   */
  async bulkUpdateUsers(userIds, updateData) {
    try {
      await this.init();
      
      const result = await this.usersCollection.updateMany(
        { _id: { $in: userIds } },
        { $set: { ...updateData, updatedAt: new Date() } }
      );

      logger.info(`Bulk updated ${result.modifiedCount} users`);
      return { success: true, modifiedCount: result.modifiedCount };
    } catch (error) {
      logger.error('Failed to bulk update users:', error);
      throw error;
    }
  }

  /**
   * Export users data
   */
  async exportUsers(tenantId = null, format = 'json') {
    try {
      await this.init();
      
      const query = tenantId ? { tenantId } : {};
      const users = await this.usersCollection.find(query).toArray();

      // Remove sensitive data
      const sanitizedUsers = users.map(user => {
        delete user.password;
        return user;
      });

      if (format === 'csv') {
        // Convert to CSV format
        const csv = this.convertToCSV(sanitizedUsers);
        return { success: true, data: csv, format: 'csv' };
      }

      return { success: true, data: sanitizedUsers, format: 'json' };
    } catch (error) {
      logger.error('Failed to export users:', error);
      throw error;
    }
  }

  /**
   * Convert data to CSV format
   */
  convertToCSV(data) {
    if (!data.length) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row =>
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
  }
}

// Create and export singleton instance
const userService = new UserService();

module.exports = userService;