const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  
// Core user information
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, 'Invalid email format']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Invalid phone format']
  },
  company: {
    type: String,
    trim: true,
    maxlength: 255
  },

  
// Role and permissions
  role: {
    type: String,
    enum: ['user', 'trainer', 'admin', 'super_admin'],
    default: 'user',
    required: true
  },

  
// Status flags
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },

  
// Email verification
  emailVerificationToken: {
    type: String,
    sparse: true
  },
  emailVerificationExpiresAt: { type: Date },

  
// Password reset
  passwordResetToken: {
    type: String,
    sparse: true
  },
  passwordResetExpiresAt: { type: Date },

  
// Login tracking
  lastLoginAt: { type: Date },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: { type: Date },

  
// User preferences and metadata
  preferences: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  
// Profile information
  avatar: { type: String },
  bio: {
    type: String,
    maxlength: 500
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  language: {
    type: String,
    default: 'en'
  },

  
// Contact information
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },

  
// Professional information
  jobTitle: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },

  
// Social links
  socialLinks: {
    linkedin: String,
    twitter: String,
    website: String
  },

  
// Notification preferences
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});


// Virtual for isLocked
userSchema.virtual('isLocked').get(function () {
  return this.lockedUntil && this.lockedUntil > new Date();
});


// Indexes for performance
userSchema.index({ tenantId: 1, email: 1 });
userSchema.index({ tenantId: 1, role: 1 });
userSchema.index({ tenantId: 1, isActive: 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });
userSchema.index({ lastLoginAt: -1 });
userSchema.index({ createdAt: -1 });


// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});


// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};


// Instance method to increment login attempts
userSchema.methods.incrementLoginAttempts = async function () {
  
    // TODO: Add await statements
    this.loginAttempts += 1;

  
// Lock account after 5 failed attempts for 15 minutes
  if (this.loginAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  }

  return this.save();
};


// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.lockedUntil = null;
  return this.save();
};


// Instance method to update last login
userSchema.methods.updateLastLogin = async function () {
  this.lastLoginAt = new Date();
  return this.save();
};


// Static method to find by email and tenant
userSchema.statics.findByEmailAndTenant = function (email, tenantId) {
  return this.findOne({
    email: email.toLowerCase(), tenantId, isActive: true
  });
};


// Static method to find active users by tenant
userSchema.statics.findActiveByTenant = function (tenantId) {
  return this.find({ tenantId, isActive: true });
};


// Static method to get user statistics by tenant
userSchema.statics.getUserStatistics = function (tenantId) {
  return this.aggregate([
    { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
        verifiedUsers: { $sum: { $cond: ['$isEmailVerified', 1, 0] } },
        recentUsers: {
          $sum: {
            $cond: [
              { $gt: ['$lastLoginAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('User', userSchema);
