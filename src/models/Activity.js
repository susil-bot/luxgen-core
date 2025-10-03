const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Activity Schema
 * Represents user activities and events in the system
 * Supports multi-tenancy with tenantId isolation
 */
const activitySchema = new Schema({
  // Multi-tenant support
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },

  // Activity identification
  id: {
    type: String,
    unique: true,
    required: true,
    index: true
  },

  // Activity content
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },

  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },

  // Activity type classification
  type: {
    type: String,
    required: true,
    enum: [
      'user_joined',
      'program_created',
      'session_completed',
      'assessment_taken',
      'training_started',
      'certificate_earned',
      'feedback_submitted',
      'poll_created',
      'announcement',
      'milestone_reached',
      'general'
    ],
    index: true
  },

  // User information
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  userName: {
    type: String,
    required: true,
    trim: true
  },

  userEmail: {
    type: String,
    trim: true,
    lowercase: true
  },

  // Activity metadata
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },

  // Engagement metrics
  engagement: {
    likes: {
      type: Number,
      default: 0,
      min: 0
    },
    comments: {
      type: Number,
      default: 0,
      min: 0
    },
    shares: {
      type: Number,
      default: 0,
      min: 0
    },
    views: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // Activity status
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active',
    index: true
  },

  // Priority for sorting
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },

  // Visibility settings
  visibility: {
    type: String,
    enum: ['public', 'private', 'tenant_only'],
    default: 'tenant_only'
  },

  // Tags for categorization
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  // Related entities
  relatedEntities: {
    programId: Schema.Types.ObjectId,
    sessionId: Schema.Types.ObjectId,
    assessmentId: Schema.Types.ObjectId,
    courseId: Schema.Types.ObjectId,
    pollId: Schema.Types.ObjectId
  },

  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Activity expiration (for temporary activities)
  expiresAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for performance
activitySchema.index({ tenantId: 1, timestamp: -1 });
activitySchema.index({ tenantId: 1, type: 1, timestamp: -1 });
activitySchema.index({ tenantId: 1, userId: 1, timestamp: -1 });
activitySchema.index({ tenantId: 1, status: 1, timestamp: -1 });
activitySchema.index({ tenantId: 1, visibility: 1, timestamp: -1 });
activitySchema.index({ tenantId: 1, tags: 1, timestamp: -1 });

// Text search index
activitySchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
});

// Virtual for formatted timestamp
activitySchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toISOString();
});

// Virtual for engagement score
activitySchema.virtual('engagementScore').get(function() {
  const { likes, comments, shares, views } = this.engagement;
  return (likes * 2) + (comments * 3) + (shares * 5) + (views * 0.1);
});

// Pre-save middleware
activitySchema.pre('save', function(next) {
  // Generate unique ID if not provided
  if (!this.id) {
    this.id = `activity_${this.tenantId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set priority based on type
  const priorityMap = {
    'announcement': 10,
    'milestone_reached': 9,
    'certificate_earned': 8,
    'assessment_taken': 7,
    'session_completed': 6,
    'training_started': 5,
    'program_created': 4,
    'feedback_submitted': 3,
    'poll_created': 2,
    'user_joined': 1,
    'general': 0
  };
  
  this.priority = priorityMap[this.type] || 0;

  next();
});

// Static methods
activitySchema.statics.findByTenant = function(tenantId, options = {}) {
  const query = { tenantId, status: 'active' };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.userId) {
    query.userId = options.userId;
  }
  
  if (options.visibility) {
    query.visibility = options.visibility;
  }
  
  if (options.tags && options.tags.length > 0) {
    query.tags = { $in: options.tags };
  }
  
  if (options.dateFrom || options.dateTo) {
    query.timestamp = {};
    if (options.dateFrom) {
      query.timestamp.$gte = new Date(options.dateFrom);
    }
    if (options.dateTo) {
      query.timestamp.$lte = new Date(options.dateTo);
    }
  }
  
  return this.find(query)
    .sort({ priority: -1, timestamp: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0)
    .populate('userId', 'name email avatar')
    .lean();
};

activitySchema.statics.getActivityStats = function(tenantId, options = {}) {
  const matchStage = { tenantId, status: 'active' };
  
  if (options.dateFrom || options.dateTo) {
    matchStage.timestamp = {};
    if (options.dateFrom) {
      matchStage.timestamp.$gte = new Date(options.dateFrom);
    }
    if (options.dateTo) {
      matchStage.timestamp.$lte = new Date(options.dateTo);
    }
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalActivities: { $sum: 1 },
        totalLikes: { $sum: '$engagement.likes' },
        totalComments: { $sum: '$engagement.comments' },
        totalShares: { $sum: '$engagement.shares' },
        totalViews: { $sum: '$engagement.views' },
        uniqueUsers: { $addToSet: '$userId' },
        activityTypes: { $addToSet: '$type' }
      }
    },
    {
      $project: {
        _id: 0,
        totalActivities: 1,
        totalLikes: 1,
        totalComments: 1,
        totalShares: 1,
        totalViews: 1,
        uniqueUsers: { $size: '$uniqueUsers' },
        activityTypes: 1,
        engagementRate: {
          $cond: {
            if: { $gt: ['$totalViews', 0] },
            then: { $divide: [{ $add: ['$totalLikes', '$totalComments', '$totalShares'] }, '$totalViews'] },
            else: 0
          }
        }
      }
    }
  ]);
};

activitySchema.statics.searchActivities = function(tenantId, searchTerm, options = {}) {
  const query = {
    tenantId,
    status: 'active',
    $text: { $search: searchTerm }
  };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.userId) {
    query.userId = options.userId;
  }
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, timestamp: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0)
    .populate('userId', 'name email avatar')
    .lean();
};

// Instance methods
activitySchema.methods.incrementEngagement = function(type, amount = 1) {
  if (this.engagement[type] !== undefined) {
    this.engagement[type] += amount;
    return this.save();
  }
  throw new Error(`Invalid engagement type: ${type}`);
};

activitySchema.methods.decrementEngagement = function(type, amount = 1) {
  if (this.engagement[type] !== undefined) {
    this.engagement[type] = Math.max(0, this.engagement[type] - amount);
    return this.save();
  }
  throw new Error(`Invalid engagement type: ${type}`);
};

activitySchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

activitySchema.methods.softDelete = function() {
  this.status = 'deleted';
  return this.save();
};

module.exports = mongoose.model('Activity', activitySchema);
