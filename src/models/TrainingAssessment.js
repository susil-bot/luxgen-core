const mongoose = require('mongoose');

const trainingAssessmentSchema = new mongoose.Schema({
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
  questions: [{
    question: {
      type: String,
      required: true,
      maxlength: 1000
    },
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false', 'short-answer', 'essay'],
      required: true
    },
    options: [{
      text: String,
      isCorrect: Boolean
    }],
    correctAnswer: String,
    points: {
      type: Number,
      default: 1,
      min: 0
    },
    explanation: String
  }],
  timeLimit: {
    type: Number,
    default: 30 // minutes
  },
  passingScore: {
    type: Number,
    default: 70,
    min: 0,
    max: 100
  },
  attempts: {
    type: Number,
    default: 1,
    min: 1
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
trainingAssessmentSchema.index({ title: 1, tenantId: 1 });
trainingAssessmentSchema.index({ isActive: 1, isPublished: 1, tenantId: 1 });
trainingAssessmentSchema.index({ createdBy: 1, tenantId: 1 });

module.exports = mongoose.model('TrainingAssessment', trainingAssessmentSchema);