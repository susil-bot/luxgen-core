const mongoose = require('mongoose');

const trainingModuleSchema = new mongoose.Schema({
  // Core module information
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Module details
  moduleCode: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  type: {
    type: String,
    enum: ['content', 'video', 'interactive', 'assessment', 'project', 'discussion'],
    default: 'content'
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  
  // Duration and scheduling
  estimatedDuration: {
    type: Number, // in minutes
    required: true,
    min: 5,
    max: 480 // 8 hours max
  },
  isRequired: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  
  // Content structure
  content: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['text', 'video', 'audio', 'document', 'link', 'interactive', 'quiz'],
      required: true
    },
    content: {
      type: String,
      trim: true
    },
    url: {
      type: String,
      trim: true
    },
    filePath: {
      type: String,
      trim: true
    },
    duration: {
      type: Number, // in minutes
      default: 0
    },
    isRequired: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  
  // Learning objectives
  learningObjectives: [{
    type: String,
    trim: true,
    maxlength: 200
  }],
  
  // Prerequisites
  prerequisites: [{
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingModule'
    },
    type: {
      type: String,
      enum: ['module', 'assessment', 'skill'],
      required: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200
    }
  }],
  
  // Assessments within module
  assessments: [{
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingAssessment'
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['quiz', 'exam', 'project', 'presentation'],
      required: true
    },
    weight: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    },
    passingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 70
    },
    isRequired: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    },
    timeLimit: {
      type: Number, // in minutes
      default: 0 // 0 means no time limit
    }
  }],
  
  // Module settings
  settings: {
    allowRetakes: {
      type: Boolean,
      default: true
    },
    maxRetakes: {
      type: Number,
      default: 3
    },
    requireSequential: {
      type: Boolean,
      default: false
    },
    showProgress: {
      type: Boolean,
      default: true
    },
    enableDiscussions: {
      type: Boolean,
      default: true
    },
    enableNotes: {
      type: Boolean,
      default: true
    },
    autoProgress: {
      type: Boolean,
      default: false
    }
  },
  
  // Module statistics
  statistics: {
    totalCompletions: {
      type: Number,
      default: 0
    },
    averageCompletionTime: {
      type: Number, // in minutes
      default: 0
    },
    averageScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    passRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    difficultyRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    }
  },
  
  // Module metadata
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  category: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  // Module status
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  
  // Version control
  version: {
    type: String,
    default: '1.0.0'
  },
  changelog: [{
    version: {
      type: String,
      required: true
    },
    changes: [{
      type: String,
      trim: true
    }],
    date: {
      type: Date,
      default: Date.now
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Audit fields
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

// Indexes
trainingModuleSchema.index({ tenantId: 1, isActive: 1 });
trainingModuleSchema.index({ tenantId: 1, category: 1 });
trainingModuleSchema.index({ moduleCode: 1 });
trainingModuleSchema.index({ 'assessments.assessmentId': 1 });

// Virtual for total content duration
trainingModuleSchema.virtual('totalContentDuration').get(function() {
  return this.content.reduce((total, item) => total + (item.duration || 0), 0);
});

// Virtual for completion rate
trainingModuleSchema.virtual('completionRate').get(function() {
  // This would be calculated based on enrollments in courses that include this module
  return this.statistics.passRate;
});

// Pre-save middleware
trainingModuleSchema.pre('save', function(next) {
  // Update estimated duration if not set
  if (!this.estimatedDuration || this.estimatedDuration === 0) {
    this.estimatedDuration = this.totalContentDuration;
  }
  
  // Update version if this is a new version
  if (this.isModified('content') || this.isModified('assessments')) {
    const currentVersion = this.version.split('.');
    const newPatch = parseInt(currentVersion[2]) + 1;
    this.version = `${currentVersion[0]}.${currentVersion[1]}.${newPatch}`;
  }
  
  next();
});

// Static methods
trainingModuleSchema.statics.findByTenant = function(tenantId, options = {}) {
  return this.find({ tenantId, ...options });
};

trainingModuleSchema.statics.findActive = function(tenantId) {
  return this.find({
    tenantId,
    isActive: true,
    isPublished: true
  });
};

trainingModuleSchema.statics.findByCategory = function(tenantId, category) {
  return this.find({
    tenantId,
    category,
    isActive: true,
    isPublished: true
  });
};

// Instance methods
trainingModuleSchema.methods.publish = function() {
  this.isPublished = true;
  this.publishedAt = new Date();
  return this.save();
};

trainingModuleSchema.methods.unpublish = function() {
  this.isPublished = false;
  this.publishedAt = null;
  return this.save();
};

trainingModuleSchema.methods.addContent = function(contentItem) {
  if (!contentItem.order) {
    contentItem.order = this.content.length;
  }
  this.content.push(contentItem);
  return this.save();
};

trainingModuleSchema.methods.updateContent = function(contentIndex, updates) {
  if (contentIndex >= 0 && contentIndex < this.content.length) {
    this.content[contentIndex] = { ...this.content[contentIndex], ...updates };
    return this.save();
  }
  throw new Error('Invalid content index');
};

trainingModuleSchema.methods.removeContent = function(contentIndex) {
  if (contentIndex >= 0 && contentIndex < this.content.length) {
    this.content.splice(contentIndex, 1);
    // Reorder remaining content
    this.content.forEach((item, index) => {
      item.order = index;
    });
    return this.save();
  }
  throw new Error('Invalid content index');
};

trainingModuleSchema.methods.addAssessment = function(assessment) {
  if (!assessment.order) {
    assessment.order = this.assessments.length;
  }
  this.assessments.push(assessment);
  return this.save();
};

trainingModuleSchema.methods.updateAssessment = function(assessmentIndex, updates) {
  if (assessmentIndex >= 0 && assessmentIndex < this.assessments.length) {
    this.assessments[assessmentIndex] = { ...this.assessments[assessmentIndex], ...updates };
    return this.save();
  }
  throw new Error('Invalid assessment index');
};

trainingModuleSchema.methods.removeAssessment = function(assessmentIndex) {
  if (assessmentIndex >= 0 && assessmentIndex < this.assessments.length) {
    this.assessments.splice(assessmentIndex, 1);
    // Reorder remaining assessments
    this.assessments.forEach((assessment, index) => {
      assessment.order = index;
    });
    return this.save();
  }
  throw new Error('Invalid assessment index');
};

trainingModuleSchema.methods.updateStatistics = function(completionData) {
  // Update completion statistics
  this.statistics.totalCompletions += 1;
  
  if (completionData.completionTime) {
    const currentTotal = this.statistics.averageCompletionTime * (this.statistics.totalCompletions - 1);
    this.statistics.averageCompletionTime = (currentTotal + completionData.completionTime) / this.statistics.totalCompletions;
  }
  
  if (completionData.score !== undefined) {
    const currentTotal = this.statistics.averageScore * (this.statistics.totalCompletions - 1);
    this.statistics.averageScore = (currentTotal + completionData.score) / this.statistics.totalCompletions;
  }
  
  if (completionData.passed) {
    const passedCount = Math.round((this.statistics.passRate / 100) * (this.statistics.totalCompletions - 1)) + 1;
    this.statistics.passRate = (passedCount / this.statistics.totalCompletions) * 100;
  }
  
  return this.save();
};

module.exports = mongoose.model('TrainingModule', trainingModuleSchema); 