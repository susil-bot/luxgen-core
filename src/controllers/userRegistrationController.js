const UserRegistration = require('../models/UserRegistration');
const User = require('../models/User');
const UserDetails = require('../models/UserDetails');
const TenantSchema = require('../models/TenantSchema');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Register a new user
 */
exports.registerUser = async (req, res) => {
  try {
    const {
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
      phone,
      company,
      jobTitle,
      department,
      industry,
      companySize,
      tenantId,
      tenantDomain,
      marketingConsent,
      termsAccepted,
      privacyPolicyAccepted,
      utmSource,
      utmMedium,
      utmCampaign,
      userAgent,
      ipAddress,
      deviceType
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation does not match'
      });
    }

    // Check if user already exists
    const existingUser = await UserRegistration.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Verify tenant exists
    const tenant = await TenantSchema.findOne({ _id: tenantId });
    if (!tenant) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tenant'
      });
    }

    // Create registration record
    const registration = new UserRegistration({
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
      phone,
      company,
      jobTitle,
      department,
      industry,
      companySize,
      tenantId,
      tenantDomain,
      marketingConsent,
      termsAccepted,
      privacyPolicyAccepted,
      utmSource,
      utmMedium,
      utmCampaign,
      userAgent,
      ipAddress,
      deviceType,
      registrationSource: req.headers['user-agent'] ? 'web' : 'api'
    });

    // Generate email verification token
    await registration.generateEmailVerificationToken();

    // Save registration
    await registration.save();

    // Send verification email (implement email service)
    // await sendVerificationEmail(registration.email, registration.emailVerificationToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        registrationId: registration._id,
        email: registration.email,
        status: registration.status
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

/**
 * Verify email
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const registration = await UserRegistration.findByEmailVerificationToken(token);
    if (!registration) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Verify email
    await registration.verifyEmail();

    // Create user account
    const user = new User({
      tenantId: registration.tenantId,
      firstName: registration.firstName,
      lastName: registration.lastName,
      email: registration.email,
      password: registration.password,
      role: registration.role,
      phone: registration.phone,
      department: registration.department,
      position: registration.jobTitle,
      isActive: true
    });

    await user.save();

    // Create user details
    const userDetails = new UserDetails({
      userId: user._id,
      // Copy relevant data from registration
      phone: registration.phone,
      company: registration.company,
      jobTitle: registration.jobTitle,
      department: registration.department,
      industry: registration.industry,
      companySize: registration.companySize
    });

    await userDetails.save();

    // Generate JWT token
    const jwtToken = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role, 
        tenantId: user.tenantId 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: user.getPublicProfile(),
        token: jwtToken
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed',
      error: error.message
    });
  }
};

/**
 * Resend verification email
 */
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const registration = await UserRegistration.findByEmail(email);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    if (registration.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    await registration.generateEmailVerificationToken();

    // Send verification email
    // await sendVerificationEmail(registration.email, registration.emailVerificationToken);

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email',
      error: error.message
    });
  }
};

/**
 * Get registration status
 */
exports.getRegistrationStatus = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await UserRegistration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    res.json({
      success: true,
      data: {
        status: registration.status,
        emailVerified: registration.emailVerified,
        phoneVerified: registration.phoneVerified,
        registrationStep: registration.registrationStep,
        registrationCompleted: registration.registrationCompleted
      }
    });

  } catch (error) {
    console.error('Get registration status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get registration status',
      error: error.message
    });
  }
};

/**
 * Update registration step
 */
exports.updateRegistrationStep = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { step, data } = req.body;

    const registration = await UserRegistration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Update registration with step data
    Object.assign(registration, data);
    registration.registrationStep = step;

    if (step === 5) {
      registration.registrationCompleted = true;
    }

    await registration.save();

    res.json({
      success: true,
      message: 'Registration step updated successfully',
      data: {
        registrationStep: registration.registrationStep,
        registrationCompleted: registration.registrationCompleted
      }
    });

  } catch (error) {
    console.error('Update registration step error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update registration step',
      error: error.message
    });
  }
};

/**
 * Get pending registrations (admin only)
 */
exports.getPendingRegistrations = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const query = { tenantId };
    if (status) {
      query.status = status;
    }

    const registrations = await UserRegistration.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password -confirmPassword');

    const total = await UserRegistration.countDocuments(query);

    res.json({
      success: true,
      data: {
        registrations,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });

  } catch (error) {
    console.error('Get pending registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending registrations',
      error: error.message
    });
  }
};

/**
 * Approve registration (admin only)
 */
exports.approveRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;

    const registration = await UserRegistration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    registration.status = 'active';
    await registration.save();

    // Create user account
    const user = new User({
      tenantId: registration.tenantId,
      firstName: registration.firstName,
      lastName: registration.lastName,
      email: registration.email,
      password: registration.password,
      role: registration.role,
      phone: registration.phone,
      department: registration.department,
      position: registration.jobTitle,
      isActive: true
    });

    await user.save();

    res.json({
      success: true,
      message: 'Registration approved successfully',
      data: {
        userId: user._id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Approve registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve registration',
      error: error.message
    });
  }
};

/**
 * Reject registration (admin only)
 */
exports.rejectRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { reason } = req.body;

    const registration = await UserRegistration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    registration.status = 'rejected';
    registration.metadata.set('rejectionReason', reason);
    await registration.save();

    res.json({
      success: true,
      message: 'Registration rejected successfully'
    });

  } catch (error) {
    console.error('Reject registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject registration',
      error: error.message
    });
  }
};

module.exports = exports; 