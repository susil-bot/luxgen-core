const mongoose = require('mongoose');

const presentationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  slides: [{
    slideNumber: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 200
    },
    content: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'poll', 'quiz'],
      default: 'text'
    },
    mediaUrl: String,
    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Poll'
    },
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingAssessment'
    },
    notes: String,
    duration: {
      type: Number,
      default: 5 // minutes
    }
  }],
  duration: {
    type: Number,
    default: 30 // minutes
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
presentationSchema.index({ title: 1, tenantId: 1 });
presentationSchema.index({ isActive: 1, isPublished: 1, tenantId: 1 });
presentationSchema.index({ createdBy: 1, tenantId: 1 });

module.exports = mongoose.model('Presentation', presentationSchema);