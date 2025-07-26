const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]+$/
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Contact Information
  contactEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  contactPhone: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  
  // Address Information
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  
  // Business Information
  industry: {
    type: String,
    trim: true
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  language: {
    type: String,
    default: 'en'
  },
  
  // Subscription & Billing
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'professional', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'trial', 'expired', 'cancelled', 'suspended'],
      default: 'trial'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    trialEndDate: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  
  // Feature Flags & Settings
  features: {
    polls: {
      enabled: { type: Boolean, default: true },
      maxPolls: { type: Number, default: 10 },
      maxRecipients: { type: Number, default: 100 }
    },
    analytics: {
      enabled: { type: Boolean, default: true },
      retention: { type: Number, default: 90 } // days
    },
    integrations: {
      slack: { type: Boolean, default: false },
      teams: { type: Boolean, default: false },
      email: { type: Boolean, default: true }
    },
    branding: {
      enabled: { type: Boolean, default: false },
      logo: String,
      colors: {
        primary: { type: String, default: '#3B82F6' },
        secondary: { type: String, default: '#6B7280' }
      }
    },
    security: {
      sso: { type: Boolean, default: false },
      mfa: { type: Boolean, default: false },
      ipWhitelist: [String]
    }
  },
  
  // Usage Statistics
  usage: {
    pollsCreated: { type: Number, default: 0 },
    totalRecipients: { type: Number, default: 0 },
    totalResponses: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now }
  },
  
  // Status & Configuration
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'active'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationExpires: Date,
  
  // Admin Settings
  settings: {
    allowPublicPolls: { type: Boolean, default: false },
    requireEmailVerification: { type: Boolean, default: true },
    autoArchivePolls: { type: Boolean, default: true },
    archiveAfterDays: { type: Number, default: 90 },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
      slack: { type: Boolean, default: false }
    }
  },
  
  // Metadata
  metadata: {
    source: String, // How the tenant was created (signup, admin, etc.)
    referrer: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
tenantSchema.index({ slug: 1 });
tenantSchema.index({ contactEmail: 1 });
tenantSchema.index({ 'subscription.status': 1 });
tenantSchema.index({ status: 1 });
tenantSchema.index({ createdAt: -1 });
tenantSchema.index({ 'usage.lastActivity': -1 });

// Virtual for subscription status
tenantSchema.virtual('isSubscriptionActive').get(function() {
  if (!this.subscription) return false;
  
  const now = new Date();
  const { status, endDate, trialEndDate } = this.subscription;
  
  if (status === 'active') {
    return !endDate || endDate > now;
  }
  
  if (status === 'trial') {
    return trialEndDate && trialEndDate > now;
  }
  
  return false;
});

// Virtual for trial status
tenantSchema.virtual('isInTrial').get(function() {
  if (!this.subscription) return false;
  
  const now = new Date();
  const { status, trialEndDate } = this.subscription;
  
  return status === 'trial' && trialEndDate && trialEndDate > now;
});

// Virtual for trial days remaining
tenantSchema.virtual('trialDaysRemaining').get(function() {
  if (!this.isInTrial) return 0;
  
  const now = new Date();
  const trialEnd = this.subscription.trialEndDate;
  const diffTime = trialEnd - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
});

// Pre-save middleware to generate slug if not provided
tenantSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Pre-save middleware to update last activity
tenantSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.usage.lastActivity = new Date();
  }
  next();
});

// Static method to find active tenants
tenantSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Static method to find tenants by subscription status
tenantSchema.statics.findBySubscriptionStatus = function(status) {
  return this.find({ 'subscription.status': status });
};

// Static method to find tenants expiring soon
tenantSchema.statics.findExpiringSoon = function(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + days);
  
  return this.find({
    'subscription.status': 'active',
    'subscription.endDate': { $lte: cutoffDate }
  });
};

// Instance method to check feature access
tenantSchema.methods.hasFeature = function(feature) {
  if (!this.features || !this.features[feature]) {
    return false;
  }
  return this.features[feature].enabled;
};

// Instance method to check usage limits
tenantSchema.methods.checkUsageLimit = function(feature, currentUsage) {
  if (!this.features || !this.features[feature]) {
    return false;
  }
  
  const limit = this.features[feature].maxPolls || this.features[feature].maxRecipients;
  return currentUsage < limit;
};

// Instance method to update usage statistics
tenantSchema.methods.updateUsage = function(type, count = 1) {
  if (type === 'polls') {
    this.usage.pollsCreated += count;
  } else if (type === 'recipients') {
    this.usage.totalRecipients += count;
  } else if (type === 'responses') {
    this.usage.totalResponses += count;
  }
  
  this.usage.lastActivity = new Date();
  return this.save();
};

// Instance method to verify tenant
tenantSchema.methods.verify = function() {
  this.isVerified = true;
  this.verificationToken = undefined;
  this.verificationExpires = undefined;
  return this.save();
};

// Instance method to generate verification token
tenantSchema.methods.generateVerificationToken = function() {
  const crypto = require('crypto');
  this.verificationToken = crypto.randomBytes(32).toString('hex');
  this.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return this.save();
};

module.exports = mongoose.model('Tenant', tenantSchema); 