const Group = require('../models/Group');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const logger = require('../utils/logger');
const { ValidationError, AuthorizationError, NotFoundError } = require('../utils/errors');

/**
 * Get all groups for the current tenant
 */
exports.getAllGroups = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const {
      page = 1,
      limit = 10,
      category,
      trainerId,
      isActive,
      search
    } = req.query;

    const options = {}
    if (category) {
      options.category = category;
    }
    if (trainerId) {
      options.trainerId = trainerId;
    }
    if (isActive !== undefined) {
      options.isActive = isActive === 'true';
    }
    const query = { tenantId, isDeleted: false }
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } } ];
    }
    // Add filter options
    Object.assign(query, options);

    const groups = await Group.find(query)
      .populate('trainerId', 'firstName lastName email')
      .populate('members.userId', 'firstName lastName email role')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Group.countDocuments(query);

    logger.info(`Groups retrieved for tenant ${tenantId}`, {
      tenantId,
      count: groups.length,
      total,
      page,
      limit
    });

    res.json({
      success: true,
      data: {
        groups,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        } },
      message: 'Groups retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve groups',
      error: error.message
    });
  } }
/**
 * Get group by ID
 */
exports.getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { tenantId } = req.user;

    const group = await Group.findOne({
      _id: groupId,
      tenantId,
      isDeleted: false
    })
      .populate('trainerId', 'firstName lastName email role')
      .populate('members.userId', 'firstName lastName email role')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!group) {
      throw new NotFoundError('Group not found');
    }
    logger.info(`Group retrieved: ${groupId}`, { groupId, tenantId });

    res.json({
      success: true,
      data: group,
      message: 'Group retrieved successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      logger.error('Error retrieving group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve group',
        error: error.message
      });
    } }
}
/**
 * Create new group
 */
exports.createGroup = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const {
      name,
      description,
      trainerId,
      maxSize = 20,
      category,
      tags = []
    } = req.body;


    // Validate required fields
    if (!name || !trainerId) {
      throw new ValidationError('Name and trainer are required');
    }
    // Verify trainer exists and belongs to tenant
    const trainer = await User.findOne({
      _id: trainerId,
      tenantId,
      isActive: true
    });

    if (!trainer) {
      throw new ValidationError('Invalid trainer selected');
    }
    // Check if trainer has appropriate role
    if (!['admin', 'trainer'].includes(trainer.role)) {
      throw new ValidationError('Selected user is not a trainer');
    }
    const group = new Group({
      name,
      description,
      trainerId,
      tenantId,
      maxSize,
      category,
      tags,
      createdBy: userId
    });

    await group.save();


    // Populate references
    await group.populate('trainerId', 'firstName lastName email');
    await group.populate('createdBy', 'firstName lastName email');

    logger.info(`Group created: ${group._id}`, {
      groupId: group._id,
      tenantId,
      trainerId,
      createdBy: userId
    });

    res.status(201).json({
      success: true,
      data: group,
      message: 'Group created successfully'
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    } else {
      logger.error('Error creating group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create group',
        error: error.message
      });
    } }
}
/**
 * Update group
 */
exports.updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { tenantId, userId } = req.user;
    const updateData = req.body;

    const group = await Group.findOne({
      _id: groupId,
      tenantId,
      isDeleted: false
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }
    // Check if user has permission to update this group
    const isTrainer = group.trainerId.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isTrainer && !isAdmin) {
      throw new AuthorizationError('You do not have permission to update this group');
    }
    // If trainer is being changed, verify new trainer
    if (updateData.trainerId && updateData.trainerId !== group.trainerId.toString()) {
      const newTrainer = await User.findOne({
        _id: updateData.trainerId,
        tenantId,
        isActive: true
      });

      if (!newTrainer || !['admin', 'trainer'].includes(newTrainer.role)) {
        throw new ValidationError('Invalid trainer selected');
      } }
    // Update group
    Object.assign(group, updateData, { updatedBy: userId });
    await group.save();


    // Populate references
    await group.populate('trainerId', 'firstName lastName email');
    await group.populate('updatedBy', 'firstName lastName email');

    logger.info(`Group updated: ${groupId}`, {
      groupId,
      tenantId,
      updatedBy: userId
    });

    res.json({
      success: true,
      data: group,
      message: 'Group updated successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof AuthorizationError) {
      res.status(error instanceof NotFoundError ? 404 : 400).json({
        success: false,
        message: error.message
      });
    } else {
      logger.error('Error updating group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update group',
        error: error.message
      });
    } }
}
/**
 * Delete group (soft delete)
 */
exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { tenantId, userId } = req.user;

    const group = await Group.findOne({
      _id: groupId,
      tenantId,
      isDeleted: false
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }
    // Check if user has permission to delete this group
    const isTrainer = group.trainerId.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isTrainer && !isAdmin) {
      throw new AuthorizationError('You do not have permission to delete this group');
    }
    // Soft delete
    group.isDeleted = true;
    group.deletedAt = new Date();
    group.deletedBy = userId;
    await group.save();

    logger.info(`Group deleted: ${groupId}`, {
      groupId,
      tenantId,
      deletedBy: userId
    });

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      res.status(error instanceof NotFoundError ? 404 : 403).json({
        success: false,
        message: error.message
      });
    } else {
      logger.error('Error deleting group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete group',
        error: error.message
      });
    } }
}
/**
 * Add member to group
 */
exports.addMemberToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { tenantId, userId } = req.user;
    const { userId: memberUserId, role = 'member' } = req.body;

    const group = await Group.findOne({
      _id: groupId,
      tenantId,
      isDeleted: false
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }
    // Check if user has permission to add members
    const isTrainer = group.trainerId.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isTrainer && !isAdmin) {
      throw new AuthorizationError('You do not have permission to add members to this group');
    }
    // Verify user exists and belongs to tenant
    const user = await User.findOne({
      _id: memberUserId,
      tenantId,
      isActive: true
    });

    if (!user) {
      throw new ValidationError('Invalid user selected');
    }
    await group.addMember(memberUserId, role);


    // Populate references
    await group.populate('members.userId', 'firstName lastName email role');

    logger.info(`Member added to group: ${groupId}`, {
      groupId,
      memberUserId,
      role,
      addedBy: userId
    });

    res.json({
      success: true,
      data: group,
      message: 'Member added to group successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof AuthorizationError) {
      res.status(error instanceof NotFoundError ? 404 : 400).json({
        success: false,
        message: error.message
      });
    } else {
      logger.error('Error adding member to group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add member to group',
        error: error.message
      });
    } }
}
/**
 * Remove member from group
 */
exports.removeMemberFromGroup = async (req, res) => {
  try {
    const { groupId, userId: memberUserId } = req.params;
    const { tenantId, userId } = req.user;

    const group = await Group.findOne({
      _id: groupId,
      tenantId,
      isDeleted: false
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }
    // Check if user has permission to remove members
    const isTrainer = group.trainerId.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isTrainer && !isAdmin) {
      throw new AuthorizationError('You do not have permission to remove members from this group');
    }
    await group.removeMember(memberUserId);

    logger.info(`Member removed from group: ${groupId}`, {
      groupId,
      memberUserId,
      removedBy: userId
    });

    res.json({
      success: true,
      message: 'Member removed from group successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      res.status(error instanceof NotFoundError ? 404 : 403).json({
        success: false,
        message: error.message
      });
    } else {
      logger.error('Error removing member from group:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove member from group',
        error: error.message
      });
    } }
}
/**
 * Get group members
 */
exports.getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { tenantId } = req.user;

    const group = await Group.findOne({
      _id: groupId,
      tenantId,
      isDeleted: false
    })
      .populate('members.userId', 'firstName lastName email role isActive');

    if (!group) {
      throw new NotFoundError('Group not found');
    }
    logger.info(`Group members retrieved: ${groupId}`, { groupId, tenantId });

    res.json({
      success: true,
      data: {
        groupId,
        groupName: group.name,
        members: group.members,
        totalMembers: group.members.length,
        activeMembers: group.members.filter(m => m.status === 'active').length
      },
      message: 'Group members retrieved successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      logger.error('Error retrieving group members:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve group members',
        error: error.message
      });
    } }
}
/**
 * Update member role
 */
exports.updateMemberRole = async (req, res) => {
  try {
    const { groupId, userId: memberUserId } = req.params;
    const { tenantId, userId } = req.user;
    const { role } = req.body;

    const group = await Group.findOne({
      _id: groupId,
      tenantId,
      isDeleted: false
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }
    // Check if user has permission to update member roles
    const isTrainer = group.trainerId.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isTrainer && !isAdmin) {
      throw new AuthorizationError('You do not have permission to update member roles in this group');
    }
    await group.updateMemberRole(memberUserId, role);

    logger.info(`Member role updated: ${groupId}`, {
      groupId,
      memberUserId,
      newRole: role,
      updatedBy: userId
    });

    res.json({
      success: true,
      message: 'Member role updated successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      res.status(error instanceof NotFoundError ? 404 : 403).json({
        success: false,
        message: error.message
      });
    } else {
      logger.error('Error updating member role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update member role',
        error: error.message
      });
    } }
}
/**
 * Get group performance
 */
exports.getGroupPerformance = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { tenantId } = req.user;

    const group = await Group.findOne({
      _id: groupId,
      tenantId,
      isDeleted: false
    });

    if (!group) {
      throw new NotFoundError('Group not found');
    }
    // Get group statistics
    const stats = await Group.getGroupStats(groupId);

    logger.info(`Group performance retrieved: ${groupId}`, { groupId, tenantId });

    res.json({
      success: true,
      data: {
        groupId,
        groupName: group.name,
        stats: stats[0] || {},
        performance: {
          memberUtilization: group.currentSize / group.maxSize * 100,
          activeMemberRate: group.members.filter(m => m.status === 'active').length / group.members.length * 100,
          averageMemberRole: stats[0]?.averageMemberRole || 0
        } },
      message: 'Group performance retrieved successfully'
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      logger.error('Error retrieving group performance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve group performance',
        error: error.message
      });
    } }
}