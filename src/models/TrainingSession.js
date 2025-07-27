const mongoose = require('mongoose');

const trainingSessionSchema = new mongoose.Schema({

  // Core session information
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


  // Session details
  sessionType: {
    type: String,
    enum: ['workshop', 'seminar', 'webinar', 'hands-on', 'lecture', 'assessment'],
    default: 'workshop'
  },
  duration: {
    type: Number,
    // in minutes
    required: true,
    min: 15,
    max: 480
    // 8 hours max
  },


  // Scheduling
  scheduledAt: {
    type: Date,
    required: true
  },
  endAt: {
    type: Date,
    required: true
  },
  timezone: {
    type: String,
    default: 'UTC'
  },


  // Location/Virtual settings
  location: {
    type: String,
    trim: true,
    maxlength: 255
  },
  isVirtual: {
    type: Boolean,
    default: false
  },
  meetingUrl: {
    type: String,
    trim: true
  },
  meetingId: {
    type: String,
    trim: true
  },


  // Capacity and enrollment
  maxParticipants: {
    type: Number,
    default: 50,
    min: 1
  },
  currentParticipants: {
    type: Number,
    default: 0
  },


  // Trainers
  trainers: [{
    trainerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['primary', 'assistant', 'observer'],
      default: 'primary'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],


  // Participants
  participants: [{
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
      enum: ['enrolled', 'attended', 'completed', 'dropped'],
      default: 'enrolled'
    },
    attendanceAt: { type: Date },
    completionAt: { type: Date },
    score: {
      type: Number,
      min: 0,
      max: 100
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  }],


  // Course association
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingCourse'
  },


  // Materials and resources
  materials: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['document', 'video', 'presentation', 'link', 'file'],
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
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],


  // Session status
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled'
  },


  // Session notes and feedback
  trainerNotes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  participantFeedback: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],


  // Tags and categories
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


  // Reminders and notifications
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push'],
      required: true
    },
    scheduledAt: {
      type: Date,
      required: true
    },
    sentAt: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
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
trainingSessionSchema.index({ tenantId: 1, scheduledAt: 1 });
trainingSessionSchema.index({ tenantId: 1, status: 1 });
trainingSessionSchema.index({ 'trainers.trainerId': 1 });
trainingSessionSchema.index({ 'participants.userId': 1 });
trainingSessionSchema.index({ courseId: 1 });


// Virtual for session duration in hours
trainingSessionSchema.virtual('durationHours').get(function () {
  return this.duration / 60;
});


// Virtual for attendance rate
trainingSessionSchema.virtual('attendanceRate').get(function () {
  if (this.currentParticipants === 0) {
    return 0;
  }
  const attended = this.participants.filter(p => p.status === 'attended' || p.status === 'completed').length;
  return (attended / this.currentParticipants) * 100;
});


// Virtual for average feedback rating
trainingSessionSchema.virtual('averageRating').get(function () {
  if (this.participantFeedback.length === 0) {
    return 0;
  }
  const totalRating = this.participantFeedback.reduce((sum, feedback) => sum + feedback.rating, 0);
  return totalRating / this.participantFeedback.length;
});


// Pre-save middleware
trainingSessionSchema.pre('save', function (next) {
// Auto-calculate end time if not provided
  if (this.scheduledAt && this.duration && !this.endAt) {
    this.endAt = new Date(this.scheduledAt.getTime() + (this.duration * 60 * 1000));
  }


  // Update current participants count
  this.currentParticipants = this.participants.length;

  next();
});


// Static methods
trainingSessionSchema.statics.findByTenant = function (tenantId, options = {}) {
  return this.find({ tenantId, ...options });
};

trainingSessionSchema.statics.findUpcoming = function (tenantId, limit = 10) {
  return this.find({
    tenantId,
    scheduledAt: { $gte: new Date() },
    status: { $in: ['scheduled', 'in-progress'] }
  })
    .sort({ scheduledAt: 1 })
    .limit(limit);
};


// Instance methods
trainingSessionSchema.methods.addParticipant = function (userId) {
  if (this.currentParticipants >= this.maxParticipants) {
    throw new Error('Session is at maximum capacity');
  }

  const existingParticipant = this.participants.find(p => p.userId.toString() === userId.toString());
  if (existingParticipant) {
    throw new Error('User is already enrolled in this session');
  }

  this.participants.push({ userId });
  this.currentParticipants = this.participants.length;
  return this.save();
};

trainingSessionSchema.methods.removeParticipant = function (userId) {
  this.participants = this.participants.filter(p => p.userId.toString() !== userId.toString());
  this.currentParticipants = this.participants.length;
  return this.save();
};

trainingSessionSchema.methods.markAttendance = function (userId) {
  const participant = this.participants.find(p => p.userId.toString() === userId.toString());
  if (!participant) {
    throw new Error('User is not enrolled in this session');
  }

  participant.status = 'attended';
  participant.attendanceAt = new Date();
  return this.save();
};

trainingSessionSchema.methods.completeSession = function () {
  this.status = 'completed';
  this.participants.forEach(participant => {
    if (participant.status === 'attended') {
      participant.status = 'completed';
      participant.completionAt = new Date();
    }
  });
  return this.save();
};

module.exports = mongoose.model('TrainingSession', trainingSessionSchema);
