const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { getTenantConfig, getTenantLimits } = require('../config/tenants');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Add a user to a specific tenant
 */
exports.addUserToTenant = async (req, res) => {
  try {
    // Check if user has admin privileges
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    // Get tenant ID from JWT (for tenant admins) or from request (for super admins)
    let { tenantId } = req.user;
    if (req.user.role === 'super_admin' && req.body.tenantId) {
      tenantId = req.body.tenantId;
    }
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'User not associated with any tenant'
      });
    }
    // Get tenant configuration
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }
    const tenantConfig = getTenantConfig(tenant.slug);
    if (!tenantConfig) {
      return res.status(404).json({
        success: false,
        message: 'Tenant configuration not found'
      });
    }
    // Check user limits
    const limits = getTenantLimits(tenant.slug);
    const currentUserCount = await User.countDocuments({
      tenantId,
      isActive: true,
      isDeleted: false
    });

    if (currentUserCount >= limits.maxUsers) {
      return res.status(403).json({
        success: false,
        message: `Maximum user limit reached (${limits.maxUsers})`
      });
    }
    const { email, firstName, lastName, role = 'user', phone, department } = req.body;


    // Validate required fields
    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, firstName, and lastName are required'
      });
    }
    // Check if user already exists in this tenant
    const existingUser = await User.findOne({
      email,
      tenantId,
      isDeleted: false
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists in this tenant'
      });
    }
    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);


    // Create new user
    const user = new User({
      email,
      firstName,
      lastName,
      password: hashedPassword,
      role,
      tenantId,
      phone,
      department,
      isActive: true,
      isEmailVerified: true,
      // Auto-verified since admin is adding
      createdBy: req.user._id,
      profile: {
        company: tenant.name,
        position: role
      } });

    await user.save();


    // Generate password setup token
    const setupToken = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        type: 'password_setup',
        tenantId: user.tenantId
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } );

    res.status(201).json({
      success: true,
      message: 'User added successfully',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive
        },
        setupToken,
        tempPassword,
        tenant: {
          name: tenant.name,
          slug: tenant.slug
        } }
    });
  } catch (error) {
    console.error('Error adding user to tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add user to tenant',
      error: error.message
    });
  } }
/**
 * Get all users for a specific tenant
 */
exports.getTenantUsers = async (req, res) => {
  try {
    // Check if user has admin privileges
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    // Get tenant ID from JWT (for tenant admins) or from request (for super admins)
    let { tenantId } = req.user;
    if (req.user.role === 'super_admin' && req.query.tenantId) {
      tenantId = req.query.tenantId;
    }
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'User not associated with any tenant'
      });
    }
    // Get tenant configuration
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }
    const { page = 1, limit = 10, search, role, status } = req.query;
    const skip = (page - 1) * limit;


    // Build query
    const query = {
      tenantId,
      isDeleted: false
    }
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } } ];
    }
    if (role) {
      query.role = role;
    }
    if (status) {
      query.isActive = status === 'active';
    }
    // Get users with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalUsers,
          pages: Math.ceil(totalUsers / limit)
        },
        tenant: {
          name: tenant.name,
          slug: tenant.slug
        } }
    });
  } catch (error) {
    console.error('Error getting tenant users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant users',
      error: error.message
    });
  } }
/**
 * Update a user in a specific tenant
 */
exports.updateTenantUser = async (req, res) => {
  try {
    // Check if user has admin privileges
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    const { userId } = req.params;
    const { firstName, lastName, role, phone, department, isActive } = req.body;


    // Get tenant ID from JWT (for tenant admins) or from request (for super admins)
    let { tenantId } = req.user;
    if (req.user.role === 'super_admin' && req.body.tenantId) {
      tenantId = req.body.tenantId;
    }
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'User not associated with any tenant'
      });
    }
    // Find user in the specific tenant
    const user = await User.findOne({
      _id: userId,
      tenantId,
      isDeleted: false
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in this tenant'
      });
    }
    // Prevent admin from modifying super_admin users
    if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify super admin users'
      });
    }
    // Update user fields
    if (firstName) {
      user.firstName = firstName;
    }
    if (lastName) {
      user.lastName = lastName;
    }
    if (role) {
      user.role = role;
    }
    if (phone) {
      user.phone = phone;
    }
    if (department) {
      user.department = department;
    }
    if (typeof isActive === 'boolean') {
      user.isActive = isActive;
    }
    user.updatedBy = req.user._id;
    user.updatedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          phone: user.phone,
          department: user.department
        } }
    });
  } catch (error) {
    console.error('Error updating tenant user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant user',
      error: error.message
    });
  } }
/**
 * Remove a user from a specific tenant (soft delete)
 */
exports.removeUserFromTenant = async (req, res) => {
  try {
    // Check if user has admin privileges
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    const { userId } = req.params;


    // Get tenant ID from JWT (for tenant admins) or from request (for super admins)
    let { tenantId } = req.user;
    if (req.user.role === 'super_admin' && req.body.tenantId) {
      tenantId = req.body.tenantId;
    }
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'User not associated with any tenant'
      });
    }
    // Find user in the specific tenant
    const user = await User.findOne({
      _id: userId,
      tenantId,
      isDeleted: false
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in this tenant'
      });
    }
    // Prevent admin from removing super_admin users
    if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot remove super admin users'
      });
    }
    // Prevent admin from removing themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove yourself from the tenant'
      });
    }
    // Soft delete the user
    user.isActive = false;
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = req.user._id;

    await user.save();

    res.json({
      success: true,
      message: 'User removed from tenant successfully',
      data: {
        userId: user._id,
        email: user.email
      } });
  } catch (error) {
    console.error('Error removing user from tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove user from tenant',
      error: error.message
    });
  } }
module.exports = exports;
