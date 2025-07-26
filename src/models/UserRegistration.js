const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userRegistrationSchema = new mongoose.Schema({
  // Registration Information
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: [8, 'Password must be at least 8 characters long']
  },
  confirmPassword: {
    type: String,
    required: true
  },
  
  // Personal Information
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, 'First name must be at least 2 characters long'],
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters long'],
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  
  // Contact Information
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  country: {
    type: String,
    trim: true
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  
  // Professional Information
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  jobTitle: {
    type: String,
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  department: {
    type: String,
    trim: true,
    maxlength: [100, 'Department cannot exceed 100 characters']
  },
  industry: {
    type: String,
    trim: true,
    enum: [
      'Technology', 'Healthcare', 'Education', 'Finance', 'Manufacturing',
      'Retail', 'Consulting', 'Government', 'Non-profit', 'Other'
    ]
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
  },
  
  // Role and Permissions
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'trainer', 'user'],
    default: 'user'
  },
  permissions: [{
    type: String,
    enum: [
      'manage_users', 'manage_polls', 'view_analytics', 'create_polls',
      'respond_polls', 'manage_own_polls', 'view_own_responses',
      'manage_tenants', 'system_admin'
    ]
  }],
  
  // Tenant Information
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  tenantDomain: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // Registration Status
  status: {
    type: String,
    enum: ['pending', 'verified', 'active', 'rejected', 'suspended'],
    default: 'pending'
  },
  
  // Email Verification
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Phone Verification
  phoneVerified: {
    type: Boolean,
    default: false
  },
  phoneVerificationCode: String,
  phoneVerificationExpires: Date,
  
  // Registration Source
  registrationSource: {
    type: String,
    enum: ['web', 'mobile', 'invitation', 'admin', 'api'],
    default: 'web'
  },
  invitationCode: String,
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Marketing and Analytics
  marketingConsent: {
    type: Boolean,
    default: false
  },
  termsAccepted: {
    type: Boolean,
    default: false
  },
  privacyPolicyAccepted: {
    type: Boolean,
    default: false
  },
  
  // UTM Parameters
  utmSource: String,
  utmMedium: String,
  utmCampaign: String,
  utmTerm: String,
  utmContent: String,
  
  // Device and Browser Information
  userAgent: String,
  ipAddress: String,
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet']
  },
  
  // Registration Flow
  registrationStep: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  registrationCompleted: {
    type: Boolean,
    default: false
  },
  
  // Preferences
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  
  // Security
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lastFailedLogin: Date,
  accountLocked: {
    type: Boolean,
    default: false
  },
  accountLockedUntil: Date,
  
  // Metadata
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userRegistrationSchema.index({ email: 1 });
userRegistrationSchema.index({ tenantId: 1 });
userRegistrationSchema.index({ status: 1 });
userRegistrationSchema.index({ emailVerificationToken: 1 });
userRegistrationSchema.index({ phoneVerificationCode: 1 });
userRegistrationSchema.index({ createdAt: -1 });

// Virtual for full name
userRegistrationSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for display name
userRegistrationSchema.virtual('displayName').get(function() {
  return this.fullName;
});

// Virtual for registration completion status
userRegistrationSchema.virtual('isRegistrationComplete').get(function() {
  return this.registrationCompleted && this.emailVerified && this.status === 'active';
});

// Pre-save middleware to hash password
userRegistrationSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to validate password confirmation
userRegistrationSchema.pre('save', function(next) {
  if (this.isModified('password') && this.password !== this.confirmPassword) {
    return next(new Error('Password confirmation does not match'));
  }
  next();
});

// Instance method to compare password
userRegistrationSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to verify email
userRegistrationSchema.methods.verifyEmail = function() {
  this.emailVerified = true;
  this.emailVerificationToken = undefined;
  this.emailVerificationExpires = undefined;
  this.status = 'active';
  return this.save();
};

// Instance method to verify phone
userRegistrationSchema.methods.verifyPhone = function() {
  this.phoneVerified = true;
  this.phoneVerificationCode = undefined;
  this.phoneVerificationExpires = undefined;
  return this.save();
};

// Instance method to generate email verification token
userRegistrationSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  this.emailVerificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return this.save();
};

// Instance method to generate phone verification code
userRegistrationSchema.methods.generatePhoneVerificationCode = function() {
  const crypto = require('crypto');
  this.phoneVerificationCode = crypto.randomInt(100000, 999999).toString();
  this.phoneVerificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return this.save();
};

// Instance method to handle failed login
userRegistrationSchema.methods.handleFailedLogin = function() {
  this.failedLoginAttempts += 1;
  this.lastFailedLogin = new Date();
  
  if (this.failedLoginAttempts >= 5) {
    this.accountLocked = true;
    this.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }
  
  return this.save();
};

// Instance method to reset failed login attempts
userRegistrationSchema.methods.resetFailedLoginAttempts = function() {
  this.failedLoginAttempts = 0;
  this.accountLocked = false;
  this.accountLockedUntil = undefined;
  return this.save();
};

// Instance method to complete registration
userRegistrationSchema.methods.completeRegistration = function() {
  this.registrationCompleted = true;
  this.registrationStep = 5;
  this.status = 'active';
  return this.save();
};

// Static method to find pending registrations
userRegistrationSchema.statics.findPending = function() {
  return this.find({ status: 'pending' });
};

// Static method to find by email
userRegistrationSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find by verification token
userRegistrationSchema.statics.findByEmailVerificationToken = function(token) {
  return this.findOne({ 
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() }
  });
};

// Static method to find by phone verification code
userRegistrationSchema.statics.findByPhoneVerificationCode = function(code) {
  return this.findOne({ 
    phoneVerificationCode: code,
    phoneVerificationExpires: { $gt: new Date() }
  });
};

// Static method to find by tenant
userRegistrationSchema.statics.findByTenant = function(tenantId) {
  return this.find({ tenantId });
};

module.exports = mongoose.model('UserRegistration', userRegistrationSchema); 