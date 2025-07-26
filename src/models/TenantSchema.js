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
  
  // Styling and Branding Configuration
  styling: {
    branding: {
      logo: {
        type: String,
        trim: true
      },
      favicon: {
        type: String,
        trim: true
      },
      primaryColor: {
        type: String,
        default: '#3B82F6',
        match: /^#[0-9A-Fa-f]{6}$/
      },
      secondaryColor: {
        type: String,
        default: '#1E40AF',
        match: /^#[0-9A-Fa-f]{6}$/
      },
      accentColor: {
        type: String,
        default: '#10B981',
        match: /^#[0-9A-Fa-f]{6}$/
      },
      backgroundColor: {
        type: String,
        default: '#FFFFFF',
        match: /^#[0-9A-Fa-f]{6}$/
      },
      surfaceColor: {
        type: String,
        default: '#F9FAFB',
        match: /^#[0-9A-Fa-f]{6}$/
      },
      textColor: {
        type: String,
        default: '#111827',
        match: /^#[0-9A-Fa-f]{6}$/
      },
      textSecondaryColor: {
        type: String,
        default: '#6B7280',
        match: /^#[0-9A-Fa-f]{6}$/
      },
      borderColor: {
        type: String,
        default: '#E5E7EB',
        match: /^#[0-9A-Fa-f]{6}$/
      },
      successColor: {
        type: String,
        default: '#10B981',
        match: /^#[0-9A-Fa-f]{6}$/
      },
      warningColor: {
        type: String,
        default: '#F59E0B',
        match: /^#[0-9A-Fa-f]{6}$/
      },
      errorColor: {
        type: String,
        default: '#EF4444',
        match: /^#[0-9A-Fa-f]{6}$/
      },
      infoColor: {
        type: String,
        default: '#3B82F6',
        match: /^#[0-9A-Fa-f]{6}$/
      }
    },
    
    typography: {
      fontFamily: {
        type: String,
        default: 'Inter, system-ui, sans-serif'
      },
      fontSize: {
        xs: { type: String, default: '0.75rem' },
        sm: { type: String, default: '0.875rem' },
        base: { type: String, default: '1rem' },
        lg: { type: String, default: '1.125rem' },
        xl: { type: String, default: '1.25rem' },
        '2xl': { type: String, default: '1.5rem' },
        '3xl': { type: String, default: '1.875rem' },
        '4xl': { type: String, default: '2.25rem' }
      },
      fontWeight: {
        light: { type: String, default: '300' },
        normal: { type: String, default: '400' },
        medium: { type: String, default: '500' },
        semibold: { type: String, default: '600' },
        bold: { type: String, default: '700' }
      }
    },
    
    spacing: {
      xs: { type: String, default: '0.25rem' },
      sm: { type: String, default: '0.5rem' },
      md: { type: String, default: '1rem' },
      lg: { type: String, default: '1.5rem' },
      xl: { type: String, default: '2rem' },
      '2xl': { type: String, default: '3rem' }
    },
    
    borderRadius: {
      none: { type: String, default: '0' },
      sm: { type: String, default: '0.125rem' },
      base: { type: String, default: '0.25rem' },
      md: { type: String, default: '0.375rem' },
      lg: { type: String, default: '0.5rem' },
      xl: { type: String, default: '0.75rem' },
      full: { type: String, default: '9999px' }
    },
    
    shadows: {
      sm: { type: String, default: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
      base: { type: String, default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' },
      md: { type: String, default: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' },
      lg: { type: String, default: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' },
      xl: { type: String, default: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }
    },
    
    components: {
      button: {
        primary: {
          backgroundColor: { type: String, default: '#3B82F6' },
          textColor: { type: String, default: '#FFFFFF' },
          borderColor: { type: String, default: '#3B82F6' },
          hoverBackgroundColor: { type: String, default: '#2563EB' },
          hoverTextColor: { type: String, default: '#FFFFFF' }
        },
        secondary: {
          backgroundColor: { type: String, default: '#F3F4F6' },
          textColor: { type: String, default: '#374151' },
          borderColor: { type: String, default: '#D1D5DB' },
          hoverBackgroundColor: { type: String, default: '#E5E7EB' },
          hoverTextColor: { type: String, default: '#374151' }
        }
      },
      input: {
        backgroundColor: { type: String, default: '#FFFFFF' },
        borderColor: { type: String, default: '#D1D5DB' },
        textColor: { type: String, default: '#111827' },
        placeholderColor: { type: String, default: '#9CA3AF' },
        focusBorderColor: { type: String, default: '#3B82F6' },
        focusRingColor: { type: String, default: '#DBEAFE' }
      },
      card: {
        backgroundColor: { type: String, default: '#FFFFFF' },
        borderColor: { type: String, default: '#E5E7EB' },
        shadow: { type: String, default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }
      }
    }
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
      enabled: { type: Boolean, default: true },
      customColors: { type: Boolean, default: true },
      customLogo: { type: Boolean, default: true },
      customFonts: { type: Boolean, default: true }
    },
    security: {
      sso: { type: Boolean, default: false },
      mfa: { type: Boolean, default: false },
      ipWhitelist: [String]
    },
    ai: {
      enabled: { type: Boolean, default: true },
      chatbot: { type: Boolean, default: true },
      contentGeneration: { type: Boolean, default: true }
    }
  },
  
  // Usage Statistics
  usage: {
    pollsCreated: { type: Number, default: 0 },
    totalRecipients: { type: Number, default: 0 },
    totalResponses: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    totalUsers: { type: Number, default: 0 },
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
    },
    userRegistration: {
      enabled: { type: Boolean, default: true },
      requireApproval: { type: Boolean, default: false },
      allowInvitations: { type: Boolean, default: true }
    }
  },
  
  // Custom Fields and Configuration
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Metadata
  metadata: {
    source: String, // How the tenant was created (signup, admin, etc.)
    referrer: String,
    utmSource: String,
    utmMedium: String,
    utmCampaign: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
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
tenantSchema.index({ 'styling.branding.primaryColor': 1 });

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

// Virtual for styling configuration
tenantSchema.virtual('stylingConfig').get(function() {
  return {
    branding: this.styling.branding,
    typography: this.styling.typography,
    spacing: this.styling.spacing,
    borderRadius: this.styling.borderRadius,
    shadows: this.styling.shadows,
    components: this.styling.components
  };
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

// Static method to find tenants by styling color
tenantSchema.statics.findByPrimaryColor = function(color) {
  return this.find({ 'styling.branding.primaryColor': color });
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
  } else if (type === 'users') {
    this.usage.totalUsers += count;
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

// Instance method to update styling
tenantSchema.methods.updateStyling = function(stylingUpdates) {
  // Deep merge styling updates
  const deepMerge = (target, source) => {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = target[key] || {};
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  };
  
  this.styling = deepMerge(this.styling, stylingUpdates);
  return this.save();
};

// Instance method to get CSS variables
tenantSchema.methods.generateCSSVariables = function() {
  const cssVars = [];
  
  // Branding colors
  Object.entries(this.styling.branding).forEach(([key, value]) => {
    if (typeof value === 'string' && value.startsWith('#')) {
      cssVars.push(`--color-${key}: ${value};`);
    }
  });
  
  // Typography
  cssVars.push(`--font-family: ${this.styling.typography.fontFamily};`);
  
  Object.entries(this.styling.typography.fontSize).forEach(([key, value]) => {
    cssVars.push(`--font-size-${key}: ${value};`);
  });
  
  Object.entries(this.styling.typography.fontWeight).forEach(([key, value]) => {
    cssVars.push(`--font-weight-${key}: ${value};`);
  });
  
  // Spacing
  Object.entries(this.styling.spacing).forEach(([key, value]) => {
    cssVars.push(`--spacing-${key}: ${value};`);
  });
  
  // Border radius
  Object.entries(this.styling.borderRadius).forEach(([key, value]) => {
    cssVars.push(`--border-radius-${key}: ${value};`);
  });
  
  // Shadows
  Object.entries(this.styling.shadows).forEach(([key, value]) => {
    cssVars.push(`--shadow-${key}: ${value};`);
  });
  
  // Component styles
  Object.entries(this.styling.components).forEach(([component, styles]) => {
    Object.entries(styles).forEach(([variant, variantStyles]) => {
      Object.entries(variantStyles).forEach(([property, value]) => {
        cssVars.push(`--${component}-${variant}-${property}: ${value};`);
      });
    });
  });
  
  return `:root {\n  ${cssVars.join('\n  ')}\n}`;
};

module.exports = mongoose.model('TenantSchema', tenantSchema); 