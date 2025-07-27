const User = require('../models/User');
const Tenant = require('../models/Tenant');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { ValidationError, AuthorizationError, NotFoundError } = require('../utils/errors');

/**
 * Get all users for the current tenant
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const {
      page = 1,
      limit = 10,
      role,
      isActive,
      isVerified,
      search
    } = req.query;

    const options = {}
    if (role) {
      options.role = role;
    }
    if (isActive !== undefined) {
      options.isActive = isActive === 'true';
    }
    if (isVerified !== undefined) {
      options.isVerified = isVerified === 'true';
    }
    const query = { tenantId }
    // Add search functionality
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } } ];
    }
    // Add filter options
    Object.assign(query, options);

    const users = await User.find(query)
      .select('-password')
      .populate('tenantId', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await User.countDocuments(query);

    logger.info(`Users retrieved for tenant ${tenantId}`, {
      tenantId,
      count: users.length,
      total,
      page,
      limit
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        } },
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error.message
    });
  } }
/**
 * Get user by ID
 */
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const { tenantId } = req.user;

    const user = await User.findOne({
      _id: userId,
      tenantId
    })
      .select('-password')
      .populate('tenantId', 'name slug');

    if (!user) {
      throw new NotFoundError('User not found');
    }
    logger.info(`User retrieved: ${userId}`, { userId, tenantId });

    res.json({
      success: true,
      data: user,
      message: 'User retrieved successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      logger.error('Error retrieving user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user',
        error: error.message
      });
    } }
}
/**
 * Create new user
 */
exports.createUser = async (req, res) => {
  try {
    const { tenantId, userId: createdBy } = req.user;
    const {
      firstName,
      lastName,
      email,
      password,
      role = 'user',
      phone,
      company,
      isActive = true
    } = req.body;


    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      throw new ValidationError('First name, last name, email, and password are required');
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }
    // Validate password strength
    if (password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long');
    }
    // Check if user already exists
    const existingUser = await User.findOne({ email, tenantId });
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);


    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      phone,
      company,
      isActive,
      tenantId,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      // 24 hours
      createdBy
    });

    await user.save();


    // Populate references
    await user.populate('tenantId', 'name slug');

    logger.info(`User created: ${user._id}`, {
      userId: user._id,
      tenantId,
      createdBy
    });

    res.status(201).json({
      success: true,
      data: {
        ...user.toObject(),
        password: undefined
      },
      message: 'User created successfully'
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    } else {
      logger.error('Error creating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: error.message
      });
    } }
}
/**
 * Update user
 */
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { tenantId, userId: updatedBy } = req.user;
    const updateData = req.body;

    const user = await User.findOne({
      _id: userId,
      tenantId
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }
    // Check if user has permission to update this user
    const isAdmin = req.user.role === 'admin';
    const isSelf = userId === req.user.userId;

    if (!isAdmin && !isSelf) {
      throw new AuthorizationError('You do not have permission to update this user');
    }
    // If email is being changed, check for duplicates
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findOne({
        email: updateData.email,
        tenantId,
        _id: { $ne: userId } });

      if (existingUser) {
        throw new ValidationError('Email is already in use');
      } }
    // If password is being changed, hash it
    if (updateData.password) {
      if (updateData.password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters long');
      }
      updateData.password = await bcrypt.hash(updateData.password, 12);
      updateData.passwordChangedAt = new Date();
    }
    // Update user
    Object.assign(user, updateData, { updatedBy });
    await user.save();


    // Populate references
    await user.populate('tenantId', 'name slug');

    logger.info(`User updated: ${userId}`, {
      userId,
      tenantId,
      updatedBy
    });

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        password: undefined
      },
      message: 'User updated successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof AuthorizationError) {
      res.status(error instanceof NotFoundError ? 404 : 400).json({
        success: false,
        message: error.message
      });
    } else {
      logger.error('Error updating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: error.message
      });
    } }
}
/**
 * Delete user (soft delete)
 */
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { tenantId, userId: deletedBy } = req.user;

    const user = await User.findOne({
      _id: userId,
      tenantId
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }
    // Check if user has permission to delete this user
    const isAdmin = req.user.role === 'admin';
    const isSelf = userId === req.user.userId;

    if (!isAdmin) {
      throw new AuthorizationError('You do not have permission to delete users');
    }
    if (isSelf) {
      throw new ValidationError('You cannot delete your own account');
    }
    // Soft delete
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = deletedBy;
    await user.save();

    logger.info(`User deleted: ${userId}`, {
      userId,
      tenantId,
      deletedBy
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof AuthorizationError) {
      res.status(error instanceof NotFoundError ? 404 : 400).json({
        success: false,
        message: error.message
      });
    } else {
      logger.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message
      });
    } }
}
/**
 * Bulk user operations
 */
exports.bulkUserAction = async (req, res) => {
  try {
    const { tenantId, userId: actionBy } = req.user;
    const { userIds, action, data = {} } = req.body;


    // Validate required fields
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new ValidationError('User IDs array is required');
    }
    if (!action) {
      throw new ValidationError('Action is required');
    }
    // Check if user has permission for bulk operations
    if (req.user.role !== 'admin') {
      throw new AuthorizationError('Only admins can perform bulk operations');
    }
    const users = await User.find({
      _id: { $in: userIds },
      tenantId
    });

    if (users.length !== userIds.length) {
      throw new ValidationError('Some users not found');
    }
    let updateData = {}
    let message = '';

    switch (action) {
      case 'activate':
        updateData = { isActive: true }
        message = 'Users activated successfully';
        break;
      case 'deactivate':
        updateData = { isActive: false }
        message = 'Users deactivated successfully';
        break;
      case 'delete':
        updateData = {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: actionBy
        }
        message = 'Users deleted successfully';
        break;
      case 'changeRole':
        if (!data.role) {
          throw new ValidationError('Role is required for changeRole action');
        }
        updateData = { role: data.role }
        message = 'User roles updated successfully';
        break;
      default:
        throw new ValidationError('Invalid action');
    }
    // Perform bulk update
    const result = await User.updateMany(
      { _id: { $in: userIds }, tenantId },
      { ...updateData, updatedBy: actionBy } );

    logger.info(`Bulk user action performed: ${action}`, {
      tenantId,
      action,
      userIds,
      affectedCount: result.modifiedCount,
      actionBy
    });

    res.json({
      success: true,
      data: {
        action,
        affectedCount: result.modifiedCount,
        totalUsers: userIds.length
      },
      message
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof AuthorizationError) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    } else {
      logger.error('Error performing bulk user action:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk action',
        error: error.message
      });
    } }
}
/**
 * Get user health
 */
exports.getUserHealth = async (req, res) => {
  try {
    const { userId } = req.params;
    const { tenantId } = req.user;

    const user = await User.findOne({
      _id: userId,
      tenantId
    }).select('-password');

    if (!user) {
      throw new NotFoundError('User not found');
    }
    // Calculate user health metrics
    const healthMetrics = {
      isActive: user.isActive,
      isVerified: user.isVerified,
      lastLogin: user.lastLogin,
      daysSinceLastLogin: user.lastLogin
        ? Math.floor((Date.now() - user.lastLogin.getTime()) / (1000 * 60 * 60 * 24)) : null,
      accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      passwordAge: user.passwordChangedAt
        ? Math.floor((Date.now() - user.passwordChangedAt.getTime()) / (1000 * 60 * 60 * 24)) : null,
      loginCount: user.loginCount || 0,
      status: 'healthy'
    }
    // Determine health status
    if (!user.isActive) {
      healthMetrics.status = 'inactive';
    } else if (!user.isVerified) {
      healthMetrics.status = 'unverified';
    } else if (healthMetrics.daysSinceLastLogin > 30) {
      healthMetrics.status = 'inactive_user';
    } else if (healthMetrics.passwordAge > 90) {
      healthMetrics.status = 'password_expired';
    }
    logger.info(`User health retrieved: ${userId}`, { userId, tenantId });

    res.json({
      success: true,
      data: {
        userId,
        user: {
          ...user.toObject(),
          password: undefined
        },
        health: healthMetrics
      },
      message: 'User health retrieved successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      logger.error('Error retrieving user health:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user health',
        error: error.message
      });
    } }
}
/**
 * Reset user password
 */
exports.resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { tenantId, userId: resetBy } = req.user;
    const { password } = req.body;


    // Check if user has permission
    if (req.user.role !== 'admin') {
      throw new AuthorizationError('Only admins can reset user passwords');
    }
    if (!password || password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters long');
    }
    const user = await User.findOne({
      _id: userId,
      tenantId
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.updatedBy = resetBy;
    await user.save();

    logger.info(`User password reset: ${userId}`, {
      userId,
      tenantId,
      resetBy
    });

    res.json({
      success: true,
      message: 'User password reset successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof AuthorizationError) {
      res.status(error instanceof NotFoundError ? 404 : 400).json({
        success: false,
        message: error.message
      });
    } else {
      logger.error('Error resetting user password:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reset user password',
        error: error.message
      });
    } }
}
/**
 * Suspend user
 */
exports.suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { tenantId, userId: suspendedBy } = req.user;
    const { reason } = req.body;


    // Check if user has permission
    if (req.user.role !== 'admin') {
      throw new AuthorizationError('Only admins can suspend users');
    }
    const user = await User.findOne({
      _id: userId,
      tenantId
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }
    if (userId === req.user.userId) {
      throw new ValidationError('You cannot suspend your own account');
    }
    // Suspend user
    user.isActive = false;
    user.suspendedAt = new Date();
    user.suspendedBy = suspendedBy;
    user.suspensionReason = reason;
    user.updatedBy = suspendedBy;
    await user.save();

    logger.info(`User suspended: ${userId}`, {
      userId,
      tenantId,
      suspendedBy,
      reason
    });

    res.json({
      success: true,
      message: 'User suspended successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof AuthorizationError) {
      res.status(error instanceof NotFoundError ? 404 : 400).json({
        success: false,
        message: error.message
      });
    } else {
      logger.error('Error suspending user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to suspend user',
        error: error.message
      });
    } }
}
/**
 * Activate user
 */
exports.activateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { tenantId, userId: activatedBy } = req.user;


    // Check if user has permission
    if (req.user.role !== 'admin') {
      throw new AuthorizationError('Only admins can activate users');
    }
    const user = await User.findOne({
      _id: userId,
      tenantId
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }
    // Activate user
    user.isActive = true;
    user.suspendedAt = undefined;
    user.suspendedBy = undefined;
    user.suspensionReason = undefined;
    user.updatedBy = activatedBy;
    await user.save();

    logger.info(`User activated: ${userId}`, {
      userId,
      tenantId,
      activatedBy
    });

    res.json({
      success: true,
      message: 'User activated successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      res.status(error instanceof NotFoundError ? 404 : 403).json({
        success: false,
        message: error.message
      });
    } else {
      logger.error('Error activating user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to activate user',
        error: error.message
      });
    } }
}