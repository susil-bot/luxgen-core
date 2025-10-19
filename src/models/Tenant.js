const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  domain: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  plan: {
    type: String,
    enum: ['free', 'professional', 'enterprise'],
    default: 'free'
  },
  settings: {
    branding: {
      logo: { type: String, default: null },
      primaryColor: { type: String, default: '#3B82F6' },
      secondaryColor: { type: String, default: '#1E40AF' },
      favicon: { type: String, default: null }
    },
    features: {
      training: { type: Boolean, default: true },
      jobs: { type: Boolean, default: false },
      analytics: { type: Boolean, default: true },
      customDomain: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false }
    },
    limits: {
      maxUsers: { type: Number, default: 100 },
      maxStorage: { type: String, default: '1GB' },
      maxCourses: { type: Number, default: 10 },
      maxApiCalls: { type: Number, default: 1000 }
    }
  },
  stats: {
    totalUsers: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    totalCourses: { type: Number, default: 0 },
    totalHours: { type: Number, default: 0 }
  },
  subscription: {
    status: { type: String, enum: ['active', 'inactive', 'cancelled'], default: 'active' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
tenantSchema.index({ slug: 1 }, { unique: true });
tenantSchema.index({ domain: 1 }, { unique: true });
tenantSchema.index({ status: 1 });
tenantSchema.index({ plan: 1 });
tenantSchema.index({ isActive: 1 });

// Virtual for tenant URL
tenantSchema.virtual('url').get(function() {
  return `https://${this.domain}`;
});

// Method to check if tenant is within limits
tenantSchema.methods.isWithinLimits = function(currentUsage) {
  const limits = this.settings.limits;
  
  return {
    users: currentUsage.users <= limits.maxUsers,
    storage: this.parseStorage(currentUsage.storage) <= this.parseStorage(limits.maxStorage),
    courses: currentUsage.courses <= limits.maxCourses,
    apiCalls: currentUsage.apiCalls <= limits.maxApiCalls
  };
};

// Helper method to parse storage string
tenantSchema.methods.parseStorage = function(storage) {
  if (typeof storage === 'number') return storage;
  if (typeof storage === 'string') {
    const match = storage.match(/^(\d+(?:\.\d+)?)\s*(GB|MB|KB)?$/i);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = (match[2] || 'MB').toUpperCase();
      const multipliers = { KB: 1, MB: 1024, GB: 1024 * 1024 };
      return value * (multipliers[unit] || 1);
    }
  }
  return 0;
};

module.exports = mongoose.model('Tenant', tenantSchema);