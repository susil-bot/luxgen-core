/**
 * Job Application Model
 * Represents job applications and candidate profiles
 */

const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  // Application Details
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Application Status
  status: {
    type: String,
    enum: [
      'applied',           // Initial application
      'under-review',      // Being reviewed
      'shortlisted',       // Passed initial screening
      'interview-scheduled', // Interview scheduled
      'interviewed',       // Interview completed
      'assessment',        // Assessment phase
      'reference-check',   // Reference check
      'offer-extended',    // Offer made
      'offer-accepted',    // Offer accepted
      'offer-declined',    // Offer declined
      'rejected',          // Application rejected
      'withdrawn'          // Candidate withdrew
    ],
    default: 'applied'
  },

  // Candidate Information (for ATS)
  candidateProfile: {
    // Personal Information
    personalInfo: {
      fullName: String,
      email: String,
      phone: String,
      location: {
        city: String,
        state: String,
        country: String
      },
      dateOfBirth: Date,
      nationality: String,
      visaStatus: String
    },

    // Professional Information
    professionalInfo: {
      currentPosition: String,
      currentCompany: String,
      totalExperience: Number,
      relevantExperience: Number,
      currentSalary: {
        amount: Number,
        currency: String
      },
      expectedSalary: {
        min: Number,
        max: Number,
        currency: String
      },
      noticePeriod: String,
      availability: Date
    },

    // Education
    education: [{
      institution: String,
      degree: String,
      field: String,
      startDate: Date,
      endDate: Date,
      gpa: Number,
      isCurrent: Boolean
    }],

    // Work Experience
    experience: [{
      company: String,
      position: String,
      startDate: Date,
      endDate: Date,
      isCurrent: Boolean,
      description: String,
      achievements: [String],
      skills: [String]
    }],

    // Skills and Certifications
    skills: [{
      name: String,
      level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert']
      },
      years: Number
    }],
    certifications: [{
      name: String,
      issuer: String,
      date: Date,
      expiryDate: Date,
      credentialId: String
    }],

    // Portfolio and Projects
    portfolio: [{
      title: String,
      description: String,
      url: String,
      technologies: [String],
      startDate: Date,
      endDate: Date
    }],

    // References
    references: [{
      name: String,
      position: String,
      company: String,
      email: String,
      phone: String,
      relationship: String
    }]
  },

  // Application Documents
  documents: {
    resume: {
      url: String,
      filename: String,
      uploadedAt: Date
    },
    coverLetter: {
      content: String,
      uploadedAt: Date
    },
    portfolio: [{
      name: String,
      url: String,
      type: String
    }],
    additionalDocuments: [{
      name: String,
      url: String,
      type: String
    }]
  },

  // Application Process Tracking
  process: {
    appliedAt: {
      type: Date,
      default: Date.now
    },
    reviewedAt: Date,
    shortlistedAt: Date,
    interviewScheduledAt: Date,
    interviewedAt: Date,
    assessedAt: Date,
    referenceCheckedAt: Date,
    offerExtendedAt: Date,
    offerAcceptedAt: Date,
    rejectedAt: Date,
    withdrawnAt: Date
  },

  // Interview and Assessment Data
  interviews: [{
    scheduledAt: Date,
    conductedAt: Date,
    interviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['phone', 'video', 'in-person', 'technical', 'hr', 'final']
    },
    notes: String,
    rating: Number,
    feedback: String,
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'rescheduled']
    }
  }],

  assessments: [{
    name: String,
    type: String,
    score: Number,
    maxScore: Number,
    completedAt: Date,
    results: mongoose.Schema.Types.Mixed
  }],

  // Communication History
  communications: [{
    type: {
      type: String,
      enum: ['email', 'phone', 'message', 'note']
    },
    subject: String,
    content: String,
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound']
    }
  }],

  // ATS Features
  atsData: {
    // Scoring and Ranking
    score: {
      type: Number,
      default: 0
    },
    ranking: Number,
    
    // Screening Results
    screening: {
      passed: Boolean,
      score: Number,
      notes: String,
      screenedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      screenedAt: Date
    },

    // AI Analysis
    aiAnalysis: {
      skillsMatch: Number,
      experienceMatch: Number,
      educationMatch: Number,
      overallFit: Number,
      recommendations: [String],
      redFlags: [String],
      strengths: [String],
      weaknesses: [String]
    },

    // Tags and Categories
    tags: [String],
    categories: [String],
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    }
  },

  // Permissions and Access Control
  permissions: {
    // Who can view sensitive information
    canViewSensitiveInfo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    // Super admin approval for sensitive data access
    sensitiveDataAccess: {
      requested: Boolean,
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      requestedAt: Date,
      approved: Boolean,
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      approvedAt: Date,
      reason: String
    }
  },

  // Metadata
  source: {
    type: String,
    enum: ['direct', 'referral', 'job-board', 'recruiter', 'internal'],
    default: 'direct'
  },
  referral: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Tenant Information
  tenantId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
jobApplicationSchema.index({ jobId: 1, candidateId: 1 });
jobApplicationSchema.index({ status: 1 });
jobApplicationSchema.index({ 'candidateProfile.personalInfo.email': 1 });
jobApplicationSchema.index({ 'process.appliedAt': -1 });
jobApplicationSchema.index({ 'atsData.score': -1 });
jobApplicationSchema.index({ tenantId: 1 });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
