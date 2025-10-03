/**
 * Job Model
 * Represents job postings in the platform
 */

const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  // Basic Job Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  shortDescription: {
    type: String,
    maxlength: 500
  },
  
  // Company Information
  company: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    logo: String,
    website: String,
    size: {
      type: String,
      enum: ['startup', 'small', 'medium', 'large', 'enterprise']
    },
    industry: String,
    location: {
      city: String,
      state: String,
      country: String,
      remote: {
        type: Boolean,
        default: false
      }
    }
  },

  // Job Details
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance'],
    required: true
  },
  experienceLevel: {
    type: String,
    enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'],
    required: true
  },
  salary: {
    min: Number,
    max: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    period: {
      type: String,
      enum: ['hourly', 'monthly', 'yearly'],
      default: 'yearly'
    }
  },
  location: {
    city: String,
    state: String,
    country: String,
    remote: {
      type: Boolean,
      default: false
    },
    hybrid: {
      type: Boolean,
      default: false
    }
  },

  // Requirements
  requirements: {
    skills: [String],
    education: {
      level: {
        type: String,
        enum: ['high-school', 'associate', 'bachelor', 'master', 'phd', 'any']
      },
      field: String
    },
    experience: {
      years: Number,
      description: String
    },
    certifications: [String],
    languages: [{
      name: String,
      proficiency: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'native']
      }
    }]
  },

  // Benefits and Perks
  benefits: [String],
  perks: [String],

  // Application Process
  applicationProcess: {
    deadline: Date,
    startDate: Date,
    process: {
      type: String,
      enum: ['direct', 'screening', 'interview', 'assessment', 'multi-stage']
    },
    stages: [{
      name: String,
      description: String,
      order: Number
    }]
  },

  // Status and Visibility
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'closed', 'filled'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'internal', 'private'],
    default: 'public'
  },

  // Analytics
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    applications: {
      type: Number,
      default: 0
    },
    shortlisted: {
      type: Number,
      default: 0
    },
    hired: {
      type: Number,
      default: 0
    }
  },

  // Metadata
  tags: [String],
  keywords: [String],
  featured: {
    type: Boolean,
    default: false
  },
  urgent: {
    type: Boolean,
    default: false
  },

  // Relationships
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenantId: {
    type: String,
    required: true
  },

  // Timestamps
  publishedAt: Date,
  expiresAt: Date
}, {
  timestamps: true
});

// Indexes
jobSchema.index({ title: 'text', description: 'text', 'company.name': 'text' });
jobSchema.index({ status: 1, visibility: 1 });
jobSchema.index({ 'company.location.city': 1, 'company.location.country': 1 });
jobSchema.index({ jobType: 1, experienceLevel: 1 });
jobSchema.index({ postedBy: 1, tenantId: 1 });
jobSchema.index({ expiresAt: 1 });
jobSchema.index({ featured: 1, status: 1 });

module.exports = mongoose.model('Job', jobSchema);
