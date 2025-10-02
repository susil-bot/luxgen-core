const mongoose = require('mongoose');

const trainingModuleSchema = new mongoose.Schema({
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
  content: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingModule'
  }],
  objectives: [{
    type: String,
    trim: true
  }],
  resources: [{
    name: String,
    type: {
      type: String,
      enum: ['document', 'video', 'audio', 'link', 'file']
    },
    url: String,
    description: String
  }],
  assessments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingAssessment'
  }],
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
trainingModuleSchema.index({ title: 1, tenantId: 1 });
trainingModuleSchema.index({ category: 1, tenantId: 1 });
trainingModuleSchema.index({ difficulty: 1, tenantId: 1 });
trainingModuleSchema.index({ isActive: 1, isPublished: 1, tenantId: 1 });
trainingModuleSchema.index({ createdBy: 1, tenantId: 1 });

module.exports = mongoose.model('TrainingModule', trainingModuleSchema);