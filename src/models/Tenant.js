const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  // Core tenant information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  domain: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  description: {
    type: String,
    trim: true
  },
  
  // Contact information
  contact: {
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  
  // Address information
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  
  // Business information
  business: {
    industry: {
      type: String,
      trim: true
    },
    companySize: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
    },
    foundedYear: Number,
    taxId: String
  },
  
  // Subscription and billing
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'professional', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'trial', 'expired', 'cancelled', 'suspended'],
      default: 'active'
    },
    expiresAt: Date,
    trialEndsAt: Date,
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  
  // Usage limits
  limits: {
    maxUsers: {
      type: Number,
      default: 10,
      min: 1
    },
    maxStorageGB: {
      type: Number,
      default: 1,
      min: 0
    },
    maxPolls: {
      type: Number,
      default: 100,
      min: 0
    },
    maxApiCalls: {
      type: Number,
      default: 1000,
      min: 0
    }
  },
  
  // Current usage
  usage: {
    currentUsers: {
      type: Number,
      default: 0,
      min: 0
    },
    currentStorageGB: {
      type: Number,
      default: 0,
      min: 0
    },
    currentPolls: {
      type: Number,
      default: 0,
      min: 0
    },
    apiCallsThisMonth: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Status and settings
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  
  // Branding and customization
  branding: {
    logo: String,
    favicon: String,
    primaryColor: {
      type: String,
      default: '#3B82F6'
    },
    secondaryColor: {
      type: String,
      default: '#1E40AF'
    },
    accentColor: {
      type: String,
      default: '#10B981'
    },
    customCSS: String,
    customJS: String
  },
  
  // Feature flags
  features: {
    polls: {
      type: Boolean,
      default: true
    },
    analytics: {
      type: Boolean,
      default: true
    },
    api: {
      type: Boolean,
      default: true
    },
    sso: {
      type: Boolean,
      default: false
    },
    advancedReporting: {
      type: Boolean,
      default: false
    },
    customBranding: {
      type: Boolean,
      default: false
    },
    whiteLabel: {
      type: Boolean,
      default: false
    }
  },
  
  // Settings and configuration
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY'
    },
    timeFormat: {
      type: String,
      enum: ['12h', '24h'],
      default: '12h'
    },
    language: {
      type: String,
      default: 'en'
    },
    defaultUserRole: {
      type: String,
      enum: ['user', 'trainer', 'admin', 'super_admin'],
      default: 'user'
    },
    requireEmailVerification: {
      type: Boolean,
      default: true
    },
    allowUserRegistration: {
      type: Boolean,
      default: true
    },
    sessionTimeout: {
      type: Number,
      default: 24, // hours
      min: 1,
      max: 168
    }
  },
  
  // Security settings
  security: {
    passwordPolicy: {
      minLength: {
        type: Number,
        default: 8,
        min: 6
      },
      requireUppercase: {
        type: Boolean,
        default: true
      },
      requireLowercase: {
        type: Boolean,
        default: true
      },
      requireNumbers: {
        type: Boolean,
        default: true
      },
      requireSpecialChars: {
        type: Boolean,
        default: false
      }
    },
    loginPolicy: {
      maxFailedAttempts: {
        type: Number,
        default: 5,
        min: 1
      },
      lockoutDuration: {
        type: Number,
        default: 15, // minutes
        min: 1
      },
      requireMFA: {
        type: Boolean,
        default: false
      }
    },
    ipWhitelist: [String],
    ipBlacklist: [String]
  },
  
  // Integration settings
  integrations: {
    sso: {
      provider: {
        type: String,
        enum: ['saml', 'oidc', 'oauth2'],
        default: null
      },
      config: mongoose.Schema.Types.Mixed
    },
    email: {
      provider: {
        type: String,
        enum: ['smtp', 'sendgrid', 'mailgun', 'ses'],
        default: 'smtp'
      },
      config: mongoose.Schema.Types.Mixed
    },
    storage: {
      provider: {
        type: String,
        enum: ['local', 's3', 'gcs', 'azure'],
        default: 'local'
      },
      config: mongoose.Schema.Types.Mixed
    }
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for display name
tenantSchema.virtual('displayName').get(function() {
  return this.name || this.slug;
});

// Virtual for is trial
tenantSchema.virtual('isTrial').get(function() {
  return this.subscription.status === 'trial' && 
         this.subscription.trialEndsAt && 
         this.subscription.trialEndsAt > new Date();
});

// Virtual for is expired
tenantSchema.virtual('isExpired').get(function() {
  return this.subscription.expiresAt && 
         this.subscription.expiresAt < new Date();
});

// Virtual for usage percentage
tenantSchema.virtual('usagePercentage').get(function() {
  const userPercentage = (this.usage.currentUsers / this.limits.maxUsers) * 100;
  const storagePercentage = (this.usage.currentStorageGB / this.limits.maxStorageGB) * 100;
  const pollPercentage = (this.usage.currentPolls / this.limits.maxPolls) * 100;
  
  return {
    users: Math.min(userPercentage, 100),
    storage: Math.min(storagePercentage, 100),
    polls: Math.min(pollPercentage, 100)
  };
});

// Indexes for performance
tenantSchema.index({ slug: 1 });
tenantSchema.index({ domain: 1 });
tenantSchema.index({ isActive: 1 });
tenantSchema.index({ isDeleted: 1 });
tenantSchema.index({ 'subscription.status': 1 });
tenantSchema.index({ 'subscription.expiresAt': 1 });
tenantSchema.index({ createdAt: -1 });

// Pre-save middleware
tenantSchema.pre('save', function(next) {
  // Ensure slug is URL-friendly
  if (this.isModified('slug')) {
    this.slug = this.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }
  
  // Set deletedAt when isDeleted is true
  if (this.isDeleted && !this.deletedAt) {
    this.deletedAt = new Date();
  }
  
  next();
});

// Instance methods
tenantSchema.methods.isWithinLimits = function() {
  return {
    users: this.usage.currentUsers < this.limits.maxUsers,
    storage: this.usage.currentStorageGB < this.limits.maxStorageGB,
    polls: this.usage.currentPolls < this.limits.maxPolls
  };
};

tenantSchema.methods.canAddUser = function() {
  return this.usage.currentUsers < this.limits.maxUsers;
};

tenantSchema.methods.canCreatePoll = function() {
  return this.usage.currentPolls < this.limits.maxPolls;
};

tenantSchema.methods.incrementUserCount = async function() {
  if (this.canAddUser()) {
    this.usage.currentUsers += 1;
    return this.save();
  }
  throw new Error('User limit exceeded');
};

tenantSchema.methods.decrementUserCount = async function() {
  if (this.usage.currentUsers > 0) {
    this.usage.currentUsers -= 1;
    return this.save();
  }
};

tenantSchema.methods.incrementPollCount = async function() {
  if (this.canCreatePoll()) {
    this.usage.currentPolls += 1;
    return this.save();
  }
  throw new Error('Poll limit exceeded');
};

tenantSchema.methods.decrementPollCount = async function() {
  if (this.usage.currentPolls > 0) {
    this.usage.currentPolls -= 1;
    return this.save();
  }
};

// Static methods
tenantSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug: slug.toLowerCase(), isActive: true, isDeleted: false });
};

tenantSchema.statics.findByDomain = function(domain) {
  return this.findOne({ domain: domain.toLowerCase(), isActive: true, isDeleted: false });
};

tenantSchema.statics.findActive = function() {
  return this.find({ isActive: true, isDeleted: false });
};

tenantSchema.statics.findExpired = function() {
  return this.find({
    'subscription.expiresAt': { $lt: new Date() },
    'subscription.status': { $in: ['active', 'trial'] }
  });
};

tenantSchema.statics.getTenantStatistics = function() {
  return this.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: null,
        totalTenants: { $sum: 1 },
        activeTenants: { $sum: { $cond: ['$isActive', 1, 0] } },
        trialTenants: {
          $sum: {
            $cond: [
              { $and: [
                { $eq: ['$subscription.status', 'trial'] },
                { $gt: ['$subscription.trialEndsAt', new Date()] }
              ]},
              1,
              0
            ]
          }
        },
        expiredTenants: {
          $sum: {
            $cond: [
              { $lt: ['$subscription.expiresAt', new Date()] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Tenant', tenantSchema); 