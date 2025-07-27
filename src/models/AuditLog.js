const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Core audit information
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true,
    index: true
  },
  
  // Action details
  action: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['authentication', 'user_management', 'tenant_management', 'poll_management', 'system', 'security', 'data_access'],
    required: true,
    index: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  
  // Resource information
  resourceType: {
    type: String,
    trim: true,
    index: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    sparse: true,
    index: true
  },
  resourceName: {
    type: String,
    trim: true
  },
  
  // Action details
  details: {
    description: {
      type: String,
      trim: true
    },
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed
    },
    metadata: mongoose.Schema.Types.Mixed
  },
  
  // Request information
  request: {
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      uppercase: true
    },
    url: String,
    userAgent: String,
    ipAddress: String,
    sessionId: String,
    requestId: String
  },
  
  // Response information
  response: {
    statusCode: Number,
    responseTime: Number, // in milliseconds
    error: {
      message: String,
      code: String,
      stack: String
    }
  },
  
  // Security context
  security: {
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low'
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    flags: [{
      type: String,
      enum: ['suspicious_ip', 'unusual_activity', 'failed_authentication', 'data_access', 'privilege_escalation']
    }]
  },
  
  // Location and device
  location: {
    country: String,
    region: String,
    city: String,
    timezone: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  device: {
    type: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown'
    },
    browser: String,
    os: String,
    version: String
  },
  
  // Performance metrics
  performance: {
    databaseQueries: Number,
    databaseTime: Number, // in milliseconds
    externalApiCalls: Number,
    externalApiTime: Number, // in milliseconds
    memoryUsage: Number, // in MB
    cpuUsage: Number // percentage
  },
  
  // Compliance and retention
  compliance: {
    dataRetention: {
      type: String,
      enum: ['30_days', '90_days', '1_year', '7_years', 'permanent'],
      default: '90_days'
    },
    isSensitive: {
      type: Boolean,
      default: false
    },
    requiresReview: {
      type: Boolean,
      default: false
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

// Virtual for severity level
auditLogSchema.virtual('severity').get(function() {
  const severityMap = {
    'low': 1,
    'medium': 2,
    'high': 3,
    'critical': 4
  };
  return severityMap[this.security.riskLevel] || 1;
});

// Virtual for is recent
auditLogSchema.virtual('isRecent').get(function() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return this.createdAt > oneHourAgo;
});

// Indexes for performance
auditLogSchema.index({ tenantId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ 'security.riskLevel': 1, createdAt: -1 });
auditLogSchema.index({ 'security.flags': 1 });
auditLogSchema.index({ createdAt: -1 });

// TTL index for automatic cleanup based on compliance retention
auditLogSchema.index({ createdAt: 1 }, { 
  expireAfterSeconds: 90 * 24 * 60 * 60, // 90 days default
  partialFilterExpression: { 'compliance.dataRetention': '90_days' }
});

// Pre-save middleware
auditLogSchema.pre('save', function(next) {
  // Auto-calculate risk score based on various factors
  let riskScore = 0;
  
  // High-risk actions
  if (['DELETE', 'PATCH'].includes(this.request.method)) {
    riskScore += 20;
  }
  
  // Authentication failures
  if (this.action.includes('failed') || this.action.includes('invalid')) {
    riskScore += 30;
  }
  
  // Data access patterns
  if (this.category === 'data_access' && this.resourceType === 'user') {
    riskScore += 15;
  }
  
  // Unusual activity patterns
  if (this.security.flags && this.security.flags.length > 0) {
    riskScore += 25;
  }
  
  // Set risk level based on score
  if (riskScore >= 80) {
    this.security.riskLevel = 'critical';
  } else if (riskScore >= 60) {
    this.security.riskLevel = 'high';
  } else if (riskScore >= 30) {
    this.security.riskLevel = 'medium';
  } else {
    this.security.riskLevel = 'low';
  }
  
  this.security.riskScore = Math.min(riskScore, 100);
  
  next();
});

// Instance methods
auditLogSchema.methods.addFlag = async function(flag) {
  if (!this.security.flags.includes(flag)) {
    this.security.flags.push(flag);
  }
  return this.save();
};

auditLogSchema.methods.updateRiskLevel = async function(level) {
  this.security.riskLevel = level;
  return this.save();
};

// Static methods
auditLogSchema.statics.logAction = async function(data) {
  const AuditLog = mongoose.model('AuditLog');
  const auditLog = new AuditLog(data);
  return auditLog.save();
};

auditLogSchema.statics.findByTenant = function(tenantId, options = {}) {
  const query = { tenantId };
  
  if (options.action) {
    query.action = options.action;
  }
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.userId) {
    query.userId = options.userId;
  }
  
  if (options.riskLevel) {
    query['security.riskLevel'] = options.riskLevel;
  }
  
  if (options.startDate && options.endDate) {
    query.createdAt = {
      $gte: new Date(options.startDate),
      $lte: new Date(options.endDate)
    };
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

auditLogSchema.statics.findSuspiciousActivity = function(tenantId, hours = 24) {
  const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.find({
    tenantId,
    createdAt: { $gte: cutoffDate },
    $or: [
      { 'security.riskLevel': { $in: ['high', 'critical'] } },
      { 'security.flags': { $exists: true, $ne: [] } }
    ]
  }).sort({ createdAt: -1 });
};

auditLogSchema.statics.getAuditStatistics = function(tenantId, options = {}) {
  const matchStage = { tenantId: new mongoose.Types.ObjectId(tenantId) };
  
  if (options.startDate && options.endDate) {
    matchStage.createdAt = {
      $gte: new Date(options.startDate),
      $lte: new Date(options.endDate)
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalActions: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        highRiskActions: {
          $sum: {
            $cond: [
              { $in: ['$security.riskLevel', ['high', 'critical']] },
              1,
              0
            ]
          }
        },
        averageResponseTime: { $avg: '$response.responseTime' },
        actionsByCategory: {
          $push: '$category'
        }
      }
    },
    {
      $project: {
        totalActions: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        highRiskActions: 1,
        averageResponseTime: 1,
        categoryBreakdown: {
          $reduce: {
            input: '$actionsByCategory',
            initialValue: {},
            in: {
              $mergeObjects: [
                '$$value',
                { $literal: { '$$this': { $add: [{ $ifNull: ['$$value.$$this', 0] }, 1] } } }
              ]
            }
          }
        }
      }
    }
  ]);
};

auditLogSchema.statics.cleanupOldLogs = async function(retentionDays = 90) {
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    'compliance.dataRetention': { $ne: 'permanent' }
  });
};

module.exports = mongoose.model('AuditLog', auditLogSchema); 