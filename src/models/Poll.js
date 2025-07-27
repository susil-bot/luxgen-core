const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({

  // Core poll information
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  description: {
    type: String,
    trim: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },


  // Poll options and configuration
  options: {
    type: [{
      id: {
        type: String,
        required: true
      },
      text: {
        type: String,
        required: true,
        trim: true
      },
      value: { type: mongoose.Schema.Types.Mixed },
      isCorrect: {
        type: Boolean,
        default: false
      } }],
    validate: {
      validator (options) {
        return options && options.length >= 2;
      },
      message: 'Poll must have at least 2 options'
    } },


  // Poll type and settings
  pollType: {
    type: String,
    enum: ['multiple_choice', 'rating', 'text', 'yes_no', 'ranking', 'matrix'],
    default: 'multiple_choice'
  },

  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'archived'],
    default: 'draft'
  },


  // Privacy and access settings
  isAnonymous: {
    type: Boolean,
    default: false
  },
  allowMultipleResponses: {
    type: Boolean,
    default: false
  },
  requireAuthentication: {
    type: Boolean,
    default: true
  },
  allowGuestResponses: {
    type: Boolean,
    default: false
  },


  // Timing settings
  expiresAt: { type: Date },
  scheduledAt: { type: Date },
  autoArchive: {
    type: Boolean,
    default: true
  },
  archiveAfterDays: {
    type: Number,
    default: 90,
    min: 1
  },


  // Display settings
  settings: {
    showResults: {
      type: Boolean,
      default: true
    },
    showResultsAfterVote: {
      type: Boolean,
      default: true
    },
    showResultsImmediately: {
      type: Boolean,
      default: false
    },
    showProgressBar: {
      type: Boolean,
      default: true
    },
    showResponseCount: {
      type: Boolean,
      default: true
    },
    randomizeOptions: {
      type: Boolean,
      default: false
    },
    allowComments: {
      type: Boolean,
      default: false
    },
    maxSelections: {
      type: Number,
      default: 1,
      min: 1
    },
    minSelections: {
      type: Number,
      default: 1,
      min: 1
    } },


  // Targeting and distribution
  targetAudience: {
    roles: [{
      type: String,
      enum: ['user', 'trainer', 'admin', 'super_admin']
    }],
    departments: [String],
    locations: [String],
    customFilters: mongoose.Schema.Types.Mixed
  },


  // Notification settings
  notifications: {
    onResponse: {
      type: Boolean,
      default: false
    },
    onCompletion: {
      type: Boolean,
      default: true
    },
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },


  // Analytics and tracking
  analytics: {
    totalResponses: {
      type: Number,
      default: 0,
      min: 0
    },
    uniqueRespondents: {
      type: Number,
      default: 0,
      min: 0
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageTimeToComplete: {
      type: Number,
      default: 0,
      min: 0
    },
    lastResponseAt: Date
  },


  // Response data
  responses: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true
    },
    sessionId: String,
    responseData: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    selectedOptions: [String],
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    textResponse: String,
    comment: String,
    ipAddress: String,
    userAgent: String,
    timeSpent: Number,
    // in seconds
    createdAt: {
      type: Date,
      default: Date.now
    } }],


  // Feedback and ratings
  feedback: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    } }],


  // Tags and categories
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    trim: true
  },


  // Sharing and embedding
  sharing: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowEmbedding: {
      type: Boolean,
      default: false
    },
    embedCode: String,
    shareUrl: String,
    qrCode: String
  },


  // Version control
  version: {
    type: Number,
    default: 1
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll'
  },


  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {} }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true } });


// Virtual for is expired
pollSchema.virtual('isExpired').get(function () {
  return this.expiresAt && this.expiresAt < new Date();
});


// Virtual for is active
pollSchema.virtual('isActive').get(function () {
  return this.status === 'active' && !this.isExpired;
});


// Virtual for response rate
pollSchema.virtual('responseRate').get(function () {
  if (!this.analytics.totalResponses) {
    return 0;
  }
  return (this.analytics.uniqueRespondents / this.analytics.totalResponses) * 100;
});


// Virtual for average rating
pollSchema.virtual('averageRating').get(function () {
  if (!this.feedback.length) {
    return 0;
  }
  const totalRating = this.feedback.reduce((sum, item) => sum + item.rating, 0);
  return totalRating / this.feedback.length;
});


// Indexes for performance
pollSchema.index({ tenantId: 1, status: 1 });
pollSchema.index({ tenantId: 1, createdBy: 1 });
pollSchema.index({ tenantId: 1, expiresAt: 1 });
pollSchema.index({ tenantId: 1, createdAt: -1 });
pollSchema.index({ status: 1, expiresAt: 1 });
pollSchema.index({ 'responses.userId': 1 });
pollSchema.index({ tags: 1 });
pollSchema.index({ category: 1 });


// Pre-save middleware
pollSchema.pre('save', function (next) {
// Auto-archive expired polls
  if (this.autoArchive && this.expiresAt && this.expiresAt < new Date()) {
    this.status = 'archived';
  }
  // Update analytics
  if (this.responses && this.responses.length > 0) {
    this.analytics.totalResponses = this.responses.length;
    this.analytics.uniqueRespondents = new Set(this.responses.map(r => r.userId || r.sessionId)).size;
    this.analytics.lastResponseAt = this.responses[this.responses.length - 1].createdAt;
  }
  next();
});


// Instance methods
pollSchema.methods.addResponse = async function (responseData) {
  this.responses.push(responseData);
  this.analytics.totalResponses += 1;


  // Update unique respondents count
  const uniqueRespondents = new Set(
    this.responses.map(r => r.userId || r.sessionId)
  );
  this.analytics.uniqueRespondents = uniqueRespondents.size;

  return this.save();
}
pollSchema.methods.getResponseSummary = function () {
  const summary = {
    totalResponses: this.responses.length,
    uniqueRespondents: this.analytics.uniqueRespondents,
    optionCounts: {},
    averageRating: this.averageRating,
    feedbackCount: this.feedback.length
  }
  // Count responses by option
  this.responses.forEach(response => {
    if (response.selectedOptions) {
      response.selectedOptions.forEach(optionId => {
        summary.optionCounts[optionId] = (summary.optionCounts[optionId] || 0) + 1;
      });
    } });

  return summary;
}
pollSchema.methods.activate = async function () {
  this.status = 'active';
  return this.save();
}
pollSchema.methods.pause = async function () {
  this.status = 'paused';
  return this.save();
}
pollSchema.methods.archive = async function () {
  this.status = 'archived';
  return this.save();
}
pollSchema.methods.duplicate = async function (newCreatedBy) {
  // TODO: Add await statements
  const Poll = mongoose.model('Poll');
  const duplicatedPoll = new Poll({
    ...this.toObject(),
    _id: undefined,
    createdBy: newCreatedBy,
    status: 'draft',
    responses: [],
    feedback: [],
    analytics: {
      totalResponses: 0,
      uniqueRespondents: 0,
      completionRate: 0,
      averageTimeToComplete: 0
    },
    version: 1,
    templateId: this._id
  });

  return duplicatedPoll.save();
}
// Static methods
pollSchema.statics.findByTenant = function (tenantId, options = {}) {
  const query = { tenantId }
  if (options.status) {
    query.status = options.status;
  }
  if (options.createdBy) {
    query.createdBy = options.createdBy;
  }
  return this.find(query).sort({ createdAt: -1 });
}
pollSchema.statics.findActiveByTenant = function (tenantId) {
  return this.find({
    tenantId,
    status: 'active',
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } } ]
  }).sort({ createdAt: -1 });
}
pollSchema.statics.findExpired = function () {
  return this.find({
    status: 'active',
    expiresAt: { $lt: new Date() } });
}
pollSchema.statics.getPollStatistics = function (tenantId) {
  return this.aggregate([
    { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
    {
      $group: {
        _id: null,
        totalPolls: { $sum: 1 },
        activePolls: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'active'] },
              1,
              0
            ]
          } },
        totalResponses: { $sum: '$analytics.totalResponses' },
        averageResponseRate: { $avg: '$analytics.completionRate' } }
    } ]);
}
module.exports = mongoose.model('Poll', pollSchema);
