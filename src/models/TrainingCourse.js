const mongoose = require('mongoose');

const trainingCourseSchema = new mongoose.Schema({

  // Core course information
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
    maxlength: 2000
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: 500
  },


  // Course details
  courseCode: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    unique: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  category: {
    type: String,
    trim: true,
    maxlength: 100
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],


  // Course structure
  modules: [{
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingModule',
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    isRequired: {
      type: Boolean,
      default: true
    },
    estimatedDuration: {
      type: Number,
      // in minutes
      default: 60
    } }],


  // Duration and scheduling
  totalDuration: {
    type: Number,
    // in minutes
    default: 0
  },
  estimatedWeeks: {
    type: Number,
    default: 1,
    min: 1
  },
  maxEnrollment: {
    type: Number,
    default: 100,
    min: 1
  },


  // Enrollment and access
  isActive: {
    type: Boolean,
    default: true
  },
  enrollmentStartDate: { type: Date },
  enrollmentEndDate: { type: Date },
  courseStartDate: { type: Date },
  courseEndDate: { type: Date },


  // Pricing and access
  isFree: {
    type: Boolean,
    default: true
  },
  price: {
    type: Number,
    min: 0,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD',
    maxlength: 3
  },


  // Prerequisites
  prerequisites: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingCourse'
    },
    type: {
      type: String,
      enum: ['course', 'assessment', 'skill'],
      required: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200
    } }],


  // Learning objectives
  learningObjectives: [{
    type: String,
    trim: true,
    maxlength: 200
  }],


  // Course materials
  materials: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['document', 'video', 'presentation', 'link', 'file', 'assessment'],
      required: true
    },
    url: {
      type: String,
      trim: true
    },
    filePath: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    isRequired: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    } }],


  // Assessments
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
    } }],


  // Instructors
  instructors: [{
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['primary', 'secondary', 'assistant'],
      default: 'primary'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    } }],


  // Enrollment tracking
  enrollments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['enrolled', 'in-progress', 'completed', 'dropped', 'certified'],
      default: 'enrolled'
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    completedModules: [{
      moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TrainingModule'
      },
      completedAt: {
        type: Date,
        default: Date.now
      },
      score: {
        type: Number,
        min: 0,
        max: 100
      } }],
    completedAssessments: [{
      assessmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TrainingAssessment'
      },
      completedAt: {
        type: Date,
        default: Date.now
      },
      score: {
        type: Number,
        min: 0,
        max: 100
      },
      passed: {
        type: Boolean,
        default: false
      } }],
    startDate: { type: Date },
    completionDate: { type: Date },
    certificateIssuedAt: { type: Date },
    certificateId: {
      type: String,
      trim: true
    } }],


  // Course statistics
  statistics: {
    totalEnrollments: {
      type: Number,
      default: 0
    },
    activeEnrollments: {
      type: Number,
      default: 0
    },
    completedEnrollments: {
      type: Number,
      default: 0
    },
    averageCompletionTime: {
      type: Number,
      // in days
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
    } },


  // Course settings
  settings: {
    allowSelfEnrollment: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    allowRetakes: {
      type: Boolean,
      default: true
    },
    maxRetakes: {
      type: Number,
      default: 3
    },
    autoProgress: {
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
    enableNotifications: {
      type: Boolean,
      default: true
    } },


  // Course metadata
  thumbnail: {
    type: String,
    trim: true
  },
  banner: {
    type: String,
    trim: true
  },


  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  } }, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true } });


// Indexes
trainingCourseSchema.index({ tenantId: 1, isActive: 1 });
trainingCourseSchema.index({ tenantId: 1, category: 1 });
trainingCourseSchema.index({ courseCode: 1 });
trainingCourseSchema.index({ 'instructors.instructorId': 1 });
trainingCourseSchema.index({ 'enrollments.userId': 1 });


// Virtual for current enrollment count
trainingCourseSchema.virtual('currentEnrollmentCount').get(function () {
  return this.enrollments.filter(e => ['enrolled', 'in-progress'].includes(e.status)).length;
});


// Virtual for completion rate
trainingCourseSchema.virtual('completionRate').get(function () {
  if (this.statistics.totalEnrollments === 0) {
    return 0;
  }
  return (this.statistics.completedEnrollments / this.statistics.totalEnrollments) * 100;
});


// Pre-save middleware
trainingCourseSchema.pre('save', function (next) {
// Calculate total duration from modules
  if (this.modules && this.modules.length > 0) {
    this.totalDuration = this.modules.reduce((total, module) => total + module.estimatedDuration, 0);
  }
  // Update statistics
  this.statistics.totalEnrollments = this.enrollments.length;
  this.statistics.activeEnrollments = this.enrollments.filter(e => ['enrolled', 'in-progress'].includes(e.status)).length;
  this.statistics.completedEnrollments = this.enrollments.filter(e => e.status === 'completed').length;


  // Calculate average score
  const completedEnrollments = this.enrollments.filter(e => e.status === 'completed');
  if (completedEnrollments.length > 0) {
    const totalScore = completedEnrollments.reduce((sum, enrollment) => {
      const scores = enrollment.completedAssessments.map(a => a.score).filter(score => score !== undefined);
      return sum + (scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0);
    }, 0);
    this.statistics.averageScore = totalScore / completedEnrollments.length;
  }
  next();
});


// Static methods
trainingCourseSchema.statics.findByTenant = function (tenantId, options = {}) {
  return this.find({ tenantId, ...options });
}
trainingCourseSchema.statics.findActive = function (tenantId) {
  return this.find({
    tenantId,
    isActive: true,
    $or: [
      { enrollmentEndDate: { $exists: false } },
      { enrollmentEndDate: { $gte: new Date() } } ]
  });
}
// Instance methods
trainingCourseSchema.methods.enrollUser = function (userId) {
  if (!this.settings.allowSelfEnrollment) {
    throw new Error('Self-enrollment is not allowed for this course');
  }
  if (this.currentEnrollmentCount >= this.maxEnrollment) {
    throw new Error('Course is at maximum enrollment capacity');
  }
  const existingEnrollment = this.enrollments.find(e => e.userId.toString() === userId.toString());
  if (existingEnrollment) {
    throw new Error('User is already enrolled in this course');
  }
  this.enrollments.push({
    userId,
    status: this.settings.requireApproval ? 'enrolled' : 'in-progress',
    startDate: this.settings.requireApproval ? null : new Date()
  });

  return this.save();
}
trainingCourseSchema.methods.unenrollUser = function (userId) {
  this.enrollments = this.enrollments.filter(e => e.userId.toString() !== userId.toString());
  return this.save();
}
trainingCourseSchema.methods.updateUserProgress = function (userId, moduleId, score) {
  const enrollment = this.enrollments.find(e => e.userId.toString() === userId.toString());
  if (!enrollment) {
    throw new Error('User is not enrolled in this course');
  }
  // Update completed modules
  const existingModule = enrollment.completedModules.find(m => m.moduleId.toString() === moduleId.toString());
  if (existingModule) {
    existingModule.score = score;
    existingModule.completedAt = new Date();
  } else {
    enrollment.completedModules.push({
      moduleId,
      score,
      completedAt: new Date()
    });
  }
  // Calculate progress
  const totalModules = this.modules.length;
  const completedModules = enrollment.completedModules.length;
  enrollment.progress = Math.round((completedModules / totalModules) * 100);


  // Update status if all modules completed
  if (enrollment.progress === 100) {
    enrollment.status = 'completed';
    enrollment.completionDate = new Date();
  }
  return this.save();
}
trainingCourseSchema.methods.completeAssessment = function (userId, assessmentId, score) {
  const enrollment = this.enrollments.find(e => e.userId.toString() === userId.toString());
  if (!enrollment) {
    throw new Error('User is not enrolled in this course');
  }
  const assessment = this.assessments.find(a => a.assessmentId.toString() === assessmentId.toString());
  if (!assessment) {
    throw new Error('Assessment not found in this course');
  }
  // Update completed assessments
  const existingAssessment = enrollment.completedAssessments.find(a => a.assessmentId.toString() === assessmentId.toString());
  if (existingAssessment) {
    existingAssessment.score = score;
    existingAssessment.passed = score >= assessment.passingScore;
    existingAssessment.completedAt = new Date();
  } else {
    enrollment.completedAssessments.push({
      assessmentId,
      score,
      passed: score >= assessment.passingScore,
      completedAt: new Date()
    });
  }
  return this.save();
}
module.exports = mongoose.model('TrainingCourse', trainingCourseSchema);
