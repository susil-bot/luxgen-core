const mongoose = require('mongoose');

const presentationSchema = new mongoose.Schema({
  // Core presentation information
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
  
  // Presentation details
  presentationCode: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
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
  
  // Presentation settings
  settings: {
    allowComments: {
      type: Boolean,
      default: true
    },
    allowQuestions: {
      type: Boolean,
      default: true
    },
    allowPolls: {
      type: Boolean,
      default: true
    },
    allowRecording: {
      type: Boolean,
      default: false
    },
    requireRegistration: {
      type: Boolean,
      default: false
    },
    maxParticipants: {
      type: Number,
      default: 100,
      min: 1
    },
    showProgress: {
      type: Boolean,
      default: true
    },
    autoAdvance: {
      type: Boolean,
      default: false
    },
    autoAdvanceDelay: {
      type: Number, // in seconds
      default: 30
    }
  },
  
  // Slides structure
  slides: [{
    slideId: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['content', 'poll', 'question', 'break', 'video', 'interactive'],
      default: 'content'
    },
    content: {
      type: String,
      trim: true
    },
    media: [{
      type: {
        type: String,
        enum: ['image', 'video', 'audio', 'document', 'link'],
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
      title: {
        type: String,
        trim: true
      },
      description: {
        type: String,
        trim: true,
        maxlength: 500
      },
      order: {
        type: Number,
        default: 0
      }
    }],
    
    // Poll integration
    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Poll'
    },
    pollSettings: {
      autoActivate: {
        type: Boolean,
        default: false
      },
      timeLimit: {
        type: Number, // in seconds
        default: 0
      },
      showResults: {
        type: Boolean,
        default: true
      }
    },
    
    // Slide metadata
    notes: {
      type: String,
      trim: true,
      maxlength: 2000
    },
    duration: {
      type: Number, // in seconds
      default: 0
    },
    order: {
      type: Number,
      required: true
    },
    isRequired: {
      type: Boolean,
      default: true
    }
  }],
  
  // Presentation sessions
  sessions: [{
    sessionId: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    scheduledAt: {
      type: Date,
      required: true
    },
    endAt: {
      type: Date
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    
    // Session participants
    participants: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      role: {
        type: String,
        enum: ['presenter', 'co-presenter', 'attendee', 'moderator'],
        default: 'attendee'
      },
      joinedAt: {
        type: Date,
        default: Date.now
      },
      leftAt: {
        type: Date
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    
    // Session progress
    currentSlide: {
      type: Number,
      default: 0
    },
    startTime: {
      type: Date
    },
    endTime: {
      type: Date
    },
    
    // Session interactions
    comments: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      slideId: {
        type: String,
        trim: true
      },
      comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      isPrivate: {
        type: Boolean,
        default: false
      }
    }],
    
    // Session polls
    activePolls: [{
      pollId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Poll'
      },
      slideId: {
        type: String,
        trim: true
      },
      activatedAt: {
        type: Date,
        default: Date.now
      },
      deactivatedAt: {
        type: Date
      },
      responses: [{
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        response: {
          type: mongoose.Schema.Types.Mixed
        },
        submittedAt: {
          type: Date,
          default: Date.now
        }
      }]
    }],
    
    // Session recording
    recording: {
      isEnabled: {
        type: Boolean,
        default: false
      },
      startTime: {
        type: Date
      },
      endTime: {
        type: Date
      },
      filePath: {
        type: String,
        trim: true
      },
      duration: {
        type: Number // in seconds
      }
    }
  }],
  
  // Presentation statistics
  statistics: {
    totalSessions: {
      type: Number,
      default: 0
    },
    totalParticipants: {
      type: Number,
      default: 0
    },
    averageSessionDuration: {
      type: Number, // in minutes
      default: 0
    },
    averageRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    }
  },
  
  // Presentation status
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
presentationSchema.index({ tenantId: 1, isActive: 1 });
presentationSchema.index({ tenantId: 1, category: 1 });
presentationSchema.index({ presentationCode: 1 });
presentationSchema.index({ 'sessions.sessionId': 1 });

// Virtual for slide count
presentationSchema.virtual('slideCount').get(function() {
  return this.slides.length;
});

// Virtual for estimated duration
presentationSchema.virtual('estimatedDuration').get(function() {
  return this.slides.reduce((total, slide) => total + (slide.duration || 0), 0);
});

// Virtual for current active session
presentationSchema.virtual('activeSession').get(function() {
  return this.sessions.find(session => session.status === 'in-progress');
});

// Pre-save middleware
presentationSchema.pre('save', function(next) {
  // Ensure slides have proper order
  this.slides.forEach((slide, index) => {
    if (!slide.order) {
      slide.order = index;
    }
  });
  
  // Update version if slides are modified
  if (this.isModified('slides')) {
    const currentVersion = this.version.split('.');
    const newPatch = parseInt(currentVersion[2]) + 1;
    this.version = `${currentVersion[0]}.${currentVersion[1]}.${newPatch}`;
  }
  
  next();
});

// Static methods
presentationSchema.statics.findByTenant = function(tenantId, options = {}) {
  return this.find({ tenantId, ...options });
};

presentationSchema.statics.findActive = function(tenantId) {
  return this.find({
    tenantId,
    isActive: true,
    isPublished: true
  });
};

presentationSchema.statics.findByCategory = function(tenantId, category) {
  return this.find({
    tenantId,
    category,
    isActive: true,
    isPublished: true
  });
};

// Instance methods
presentationSchema.methods.publish = function() {
  this.isPublished = true;
  this.publishedAt = new Date();
  return this.save();
};

presentationSchema.methods.unpublish = function() {
  this.isPublished = false;
  this.publishedAt = null;
  return this.save();
};

presentationSchema.methods.addSlide = function(slide) {
  if (!slide.order) {
    slide.order = this.slides.length;
  }
  if (!slide.slideId) {
    slide.slideId = `slide_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  this.slides.push(slide);
  return this.save();
};

presentationSchema.methods.updateSlide = function(slideIndex, updates) {
  if (slideIndex >= 0 && slideIndex < this.slides.length) {
    this.slides[slideIndex] = { ...this.slides[slideIndex], ...updates };
    return this.save();
  }
  throw new Error('Invalid slide index');
};

presentationSchema.methods.removeSlide = function(slideIndex) {
  if (slideIndex >= 0 && slideIndex < this.slides.length) {
    this.slides.splice(slideIndex, 1);
    // Reorder remaining slides
    this.slides.forEach((slide, index) => {
      slide.order = index;
    });
    return this.save();
  }
  throw new Error('Invalid slide index');
};

presentationSchema.methods.createSession = function(sessionData) {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const session = {
    sessionId,
    title: sessionData.title || this.title,
    scheduledAt: sessionData.scheduledAt || new Date(),
    participants: sessionData.participants || [],
    status: 'scheduled'
  };
  
  this.sessions.push(session);
  return this.save();
};

presentationSchema.methods.startSession = function(sessionId) {
  const session = this.sessions.find(s => s.sessionId === sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  session.status = 'in-progress';
  session.startTime = new Date();
  session.currentSlide = 0;
  
  return this.save();
};

presentationSchema.methods.endSession = function(sessionId) {
  const session = this.sessions.find(s => s.sessionId === sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  session.status = 'completed';
  session.endTime = new Date();
  
  // Update statistics
  this.statistics.totalSessions += 1;
  if (session.startTime && session.endTime) {
    const duration = (session.endTime - session.startTime) / (1000 * 60); // in minutes
    const currentTotal = this.statistics.averageSessionDuration * (this.statistics.totalSessions - 1);
    this.statistics.averageSessionDuration = (currentTotal + duration) / this.statistics.totalSessions;
  }
  
  return this.save();
};

presentationSchema.methods.addParticipant = function(sessionId, userId, role = 'attendee') {
  const session = this.sessions.find(s => s.sessionId === sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  const existingParticipant = session.participants.find(p => p.userId.toString() === userId.toString());
  if (existingParticipant) {
    existingParticipant.isActive = true;
    existingParticipant.leftAt = null;
  } else {
    session.participants.push({
      userId,
      role,
      joinedAt: new Date(),
      isActive: true
    });
  }
  
  return this.save();
};

presentationSchema.methods.removeParticipant = function(sessionId, userId) {
  const session = this.sessions.find(s => s.sessionId === sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  const participant = session.participants.find(p => p.userId.toString() === userId.toString());
  if (participant) {
    participant.isActive = false;
    participant.leftAt = new Date();
  }
  
  return this.save();
};

presentationSchema.methods.advanceSlide = function(sessionId, slideIndex) {
  const session = this.sessions.find(s => s.sessionId === sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  if (slideIndex >= 0 && slideIndex < this.slides.length) {
    session.currentSlide = slideIndex;
    return this.save();
  }
  throw new Error('Invalid slide index');
};

presentationSchema.methods.activatePoll = function(sessionId, pollId, slideId) {
  const session = this.sessions.find(s => s.sessionId === sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  // Deactivate any currently active polls
  session.activePolls.forEach(poll => {
    if (!poll.deactivatedAt) {
      poll.deactivatedAt = new Date();
    }
  });
  
  // Activate new poll
  session.activePolls.push({
    pollId,
    slideId,
    activatedAt: new Date(),
    responses: []
  });
  
  return this.save();
};

presentationSchema.methods.deactivatePoll = function(sessionId, pollId) {
  const session = this.sessions.find(s => s.sessionId === sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  const poll = session.activePolls.find(p => p.pollId.toString() === pollId.toString() && !p.deactivatedAt);
  if (poll) {
    poll.deactivatedAt = new Date();
  }
  
  return this.save();
};

presentationSchema.methods.submitPollResponse = function(sessionId, pollId, userId, response) {
  const session = this.sessions.find(s => s.sessionId === sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  const poll = session.activePolls.find(p => p.pollId.toString() === pollId.toString() && !p.deactivatedAt);
  if (!poll) {
    throw new Error('Poll not active');
  }
  
  // Check if user already responded
  const existingResponse = poll.responses.find(r => r.userId.toString() === userId.toString());
  if (existingResponse) {
    existingResponse.response = response;
    existingResponse.submittedAt = new Date();
  } else {
    poll.responses.push({
      userId,
      response,
      submittedAt: new Date()
    });
  }
  
  return this.save();
};

module.exports = mongoose.model('Presentation', presentationSchema); 