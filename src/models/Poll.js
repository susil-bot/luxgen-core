const mongoose = require('mongoose');

// Question Schema
const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['multiple_choice', 'rating', 'text', 'yes_no'],
    required: true
  },
  options: [{
    type: String,
    trim: true
  }],
  required: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: {
    type: String,
    trim: true
  },
  helpful: {
    type: Number,
    default: 0
  },
  helpfulUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

// Notification Schema
const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['poll_response', 'feedback_received', 'schedule_reminder', 'completion_alert'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String,
    trim: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Poll Response Schema
const pollResponseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  userEmail: {
    type: String,
    required: true,
    trim: true
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    answer: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    questionText: {
      type: String,
      required: true
    }
  }],
  completedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Main Poll Schema
const pollSchema = new mongoose.Schema({
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  niche: {
    type: String,
    required: true,
    trim: true
  },
  targetAudience: [{
    type: String,
    trim: true
  }],
  questions: [questionSchema],
  channels: [{
    type: String,
    enum: ['email', 'whatsapp', 'slack', 'sms'],
    required: true
  }],
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'completed'],
    default: 'draft'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  scheduledDate: {
    type: Date
  },
  sentDate: {
    type: Date
  },
  recipients: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    sentAt: {
      type: Date
    },
    respondedAt: {
      type: Date
    }
  }],
  responses: [pollResponseSchema],
  feedback: [feedbackSchema],
  notifications: [notificationSchema],
  settings: {
    allowAnonymous: {
      type: Boolean,
      default: false
    },
    requireEmail: {
      type: Boolean,
      default: true
    },
    maxResponses: {
      type: Number,
      default: null
    },
    autoClose: {
      type: Boolean,
      default: false
    },
    closeDate: {
      type: Date
    }
  },
  analytics: {
    totalRecipients: {
      type: Number,
      default: 0
    },
    totalResponses: {
      type: Number,
      default: 0
    },
    responseRate: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    },
    completionTime: {
      type: Number, // in minutes
      default: 0
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for response rate
pollSchema.virtual('responseRatePercentage').get(function() {
  if (this.analytics.totalRecipients === 0) return 0;
  return Math.round((this.analytics.totalResponses / this.analytics.totalRecipients) * 100);
});

// Indexes for better performance
pollSchema.index({ tenantId: 1, status: 1 });
pollSchema.index({ tenantId: 1, niche: 1 });
pollSchema.index({ tenantId: 1, createdBy: 1 });
pollSchema.index({ scheduledDate: 1, status: 'scheduled' });
pollSchema.index({ 'recipients.email': 1 });

// Pre-save middleware to update analytics
pollSchema.pre('save', function(next) {
  // Update total recipients
  this.analytics.totalRecipients = this.recipients.length;
  
  // Update total responses
  this.analytics.totalResponses = this.responses.length;
  
  // Update response rate
  if (this.analytics.totalRecipients > 0) {
    this.analytics.responseRate = (this.analytics.totalResponses / this.analytics.totalRecipients) * 100;
  }
  
  // Update average rating from feedback
  if (this.feedback.length > 0) {
    const totalRating = this.feedback.reduce((sum, f) => sum + f.rating, 0);
    this.analytics.averageRating = totalRating / this.feedback.length;
  }
  
  next();
});

// Static method to get polls by tenant
pollSchema.statics.findByTenant = function(tenantId, filters = {}) {
  const query = { tenantId, ...filters };
  return this.find(query).populate('createdBy', 'firstName lastName email');
};

// Instance method to add recipient
pollSchema.methods.addRecipient = function(userId, email, name) {
  const existingRecipient = this.recipients.find(r => r.email === email);
  if (!existingRecipient) {
    this.recipients.push({ userId, email, name });
  }
  return this.save();
};

// Instance method to add response
pollSchema.methods.addResponse = function(userId, userName, userEmail, answers) {
  const response = {
    userId,
    userName,
    userEmail,
    answers
  };
  
  this.responses.push(response);
  
  // Update recipient response status
  const recipient = this.recipients.find(r => r.email === userEmail);
  if (recipient) {
    recipient.respondedAt = new Date();
  }
  
  return this.save();
};

// Instance method to add feedback
pollSchema.methods.addFeedback = function(userId, userName, userEmail, rating, comment) {
  const feedback = {
    userId,
    userName,
    userEmail,
    rating,
    comment
  };
  
  this.feedback.push(feedback);
  return this.save();
};

// Instance method to add notification
pollSchema.methods.addNotification = function(type, title, message, recipientId = null, actionUrl = null) {
  const notification = {
    type,
    title,
    message,
    recipientId,
    actionUrl
  };
  
  this.notifications.push(notification);
  return this.save();
};

module.exports = mongoose.model('Poll', pollSchema); 