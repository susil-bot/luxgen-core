/**
 * Candidate Profile Model
 * Comprehensive candidate profiles for the ATS system
 */

const mongoose = require('mongoose');

const candidateProfileSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Profile Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'deleted'],
    default: 'active'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'recruiters-only'],
    default: 'public'
  },

  // Personal Information
  personalInfo: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    phone: String,
    alternateEmail: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say']
    },
    nationality: String,
    visaStatus: String,
    location: {
      address: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
      timezone: String
    },
    socialProfiles: {
      linkedin: String,
      github: String,
      portfolio: String,
      website: String,
      twitter: String
    }
  },

  // Professional Summary
  professionalSummary: {
    headline: String,
    summary: String,
    objective: String,
    currentStatus: {
      type: String,
      enum: ['employed', 'unemployed', 'freelancing', 'student', 'retired']
    },
    openToWork: {
      type: Boolean,
      default: true
    },
    jobPreferences: {
      jobTypes: [String],
      locations: [String],
      remoteWork: Boolean,
      salaryExpectation: {
        min: Number,
        max: Number,
        currency: String
      }
    }
  },

  // Work Experience
  experience: [{
    company: {
      name: String,
      website: String,
      industry: String,
      size: String
    },
    position: String,
    department: String,
    startDate: Date,
    endDate: Date,
    isCurrent: Boolean,
    description: String,
    achievements: [String],
    skills: [String],
    technologies: [String],
    teamSize: Number,
    reportingTo: String,
    salary: {
      amount: Number,
      currency: String,
      period: String
    }
  }],

  // Education
  education: [{
    institution: {
      name: String,
      type: {
        type: String,
        enum: ['university', 'college', 'school', 'bootcamp', 'online']
      },
      location: String
    },
    degree: String,
    field: String,
    startDate: Date,
    endDate: Date,
    isCurrent: Boolean,
    gpa: Number,
    honors: [String],
    activities: [String],
    description: String
  }],

  // Skills and Competencies
  skills: {
    technical: [{
      name: String,
      level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert']
      },
      years: Number,
      lastUsed: Date,
      verified: Boolean
    }],
    soft: [{
      name: String,
      level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert']
      }
    }],
    languages: [{
      name: String,
      proficiency: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'native']
      },
      certifications: [String]
    }]
  },

  // Certifications and Licenses
  certifications: [{
    name: String,
    issuer: String,
    credentialId: String,
    issueDate: Date,
    expiryDate: Date,
    verificationUrl: String,
    skills: [String]
  }],

  // Projects and Portfolio
  projects: [{
    title: String,
    description: String,
    technologies: [String],
    startDate: Date,
    endDate: Date,
    url: String,
    github: String,
    images: [String],
    teamSize: Number,
    role: String,
    achievements: [String]
  }],

  // References
  references: [{
    name: String,
    position: String,
    company: String,
    email: String,
    phone: String,
    relationship: String,
    yearsKnown: Number,
    canContact: Boolean
  }],

  // Job Applications History
  applications: [{
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    },
    status: String,
    appliedAt: Date,
    outcome: String
  }],

  // Preferences
  preferences: {
    jobAlerts: {
      enabled: Boolean,
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly']
      },
      criteria: {
        keywords: [String],
        locations: [String],
        jobTypes: [String],
        salaryRange: {
          min: Number,
          max: Number
        }
      }
    },
    privacy: {
      showProfile: Boolean,
      showContact: Boolean,
      showSalary: Boolean,
      allowRecruiters: Boolean
    },
    notifications: {
      email: Boolean,
      sms: Boolean,
      push: Boolean
    }
  },

  // Analytics and Insights
  analytics: {
    profileViews: {
      type: Number,
      default: 0
    },
    searchAppearances: {
      type: Number,
      default: 0
    },
    applicationRate: {
      type: Number,
      default: 0
    },
    lastActive: Date,
    profileCompleteness: {
      type: Number,
      default: 0
    }
  },

  // ATS Data (for recruiters)
  atsData: {
    // Scoring
    overallScore: {
      type: Number,
      default: 0
    },
    skillsScore: {
      type: Number,
      default: 0
    },
    experienceScore: {
      type: Number,
      default: 0
    },
    educationScore: {
      type: Number,
      default: 0
    },

    // AI Analysis
    aiInsights: {
      strengths: [String],
      weaknesses: [String],
      recommendations: [String],
      riskFactors: [String],
      potential: String,
      culturalFit: String
    },

    // Tags and Categories
    tags: [String],
    categories: [String],
    source: String,
    quality: {
      type: String,
      enum: ['low', 'medium', 'high', 'excellent']
    }
  },

  // Permissions and Access Control
  permissions: {
    // Who can view this profile
    viewers: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: String,
      grantedAt: Date,
      expiresAt: Date
    }],
    // Sensitive data access requests
    accessRequests: [{
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      requestedAt: Date,
      reason: String,
      status: {
        type: String,
        enum: ['pending', 'approved', 'denied']
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      approvedAt: Date
    }]
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
candidateProfileSchema.index({ userId: 1 });
candidateProfileSchema.index({ 'personalInfo.email': 1 });
candidateProfileSchema.index({ status: 1, visibility: 1 });
candidateProfileSchema.index({ 'skills.technical.name': 1 });
candidateProfileSchema.index({ 'experience.company.name': 1 });
candidateProfileSchema.index({ 'atsData.overallScore': -1 });
candidateProfileSchema.index({ tenantId: 1 });

// Text search index
candidateProfileSchema.index({
  'personalInfo.firstName': 'text',
  'personalInfo.lastName': 'text',
  'professionalSummary.headline': 'text',
  'professionalSummary.summary': 'text',
  'skills.technical.name': 'text',
  'experience.position': 'text',
  'experience.company.name': 'text'
});

module.exports = mongoose.model('CandidateProfile', candidateProfileSchema);
