const mongoose = require('mongoose');

const userDetailsSchema = new mongoose.Schema({
  // Reference to User
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Extended Personal Information
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  nationality: {
    type: String,
    trim: true
  },
  profilePicture: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  
  // Extended Contact Information
  alternateEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  emergencyContact: {
    name: {
      type: String,
      trim: true
    },
    relationship: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  
  // Address Information
  addresses: [{
    type: {
      type: String,
      enum: ['home', 'work', 'billing', 'shipping'],
      default: 'home'
    },
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  
  // Extended Professional Information
  skills: [{
    name: {
      type: String,
      trim: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert']
    },
    yearsOfExperience: {
      type: Number,
      min: 0
    }
  }],
  
  certifications: [{
    name: {
      type: String,
      trim: true
    },
    issuingOrganization: {
      type: String,
      trim: true
    },
    issueDate: {
      type: Date
    },
    expiryDate: {
      type: Date
    },
    credentialId: {
      type: String,
      trim: true
    },
    credentialUrl: {
      type: String,
      trim: true
    }
  }],
  
  education: [{
    institution: {
      type: String,
      trim: true
    },
    degree: {
      type: String,
      trim: true
    },
    fieldOfStudy: {
      type: String,
      trim: true
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    grade: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    }
  }],
  
  workExperience: [{
    company: {
      type: String,
      trim: true
    },
    position: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    isCurrent: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      trim: true
    },
    achievements: [{
      type: String,
      trim: true
    }]
  }],
  
  // Social Media and Online Presence
  socialMedia: {
    linkedin: {
      type: String,
      trim: true
    },
    twitter: {
      type: String,
      trim: true
    },
    github: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    portfolio: {
      type: String,
      trim: true
    }
  },
  
  // Preferences and Settings
  preferences: {
    // Communication Preferences
    communication: {
      preferredMethod: {
        type: String,
        enum: ['email', 'phone', 'sms', 'in_app'],
        default: 'email'
      },
      frequency: {
        type: String,
        enum: ['immediate', 'daily', 'weekly', 'monthly'],
        default: 'daily'
      },
      timezone: {
        type: String,
        default: 'UTC'
      },
      language: {
        type: String,
        default: 'en'
      }
    },
    
    // Privacy Settings
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private', 'contacts_only'],
        default: 'private'
      },
      showEmail: {
        type: Boolean,
        default: false
      },
      showPhone: {
        type: Boolean,
        default: false
      },
      allowContact: {
        type: Boolean,
        default: true
      }
    },
    
    // Notification Preferences
    notifications: {
      email: {
        marketing: { type: Boolean, default: false },
        updates: { type: Boolean, default: true },
        security: { type: Boolean, default: true },
        polls: { type: Boolean, default: true }
      },
      push: {
        marketing: { type: Boolean, default: false },
        updates: { type: Boolean, default: true },
        security: { type: Boolean, default: true },
        polls: { type: Boolean, default: true }
      },
      sms: {
        marketing: { type: Boolean, default: false },
        security: { type: Boolean, default: true }
      }
    },
    
    // UI/UX Preferences
    interface: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'auto'
      },
      fontSize: {
        type: String,
        enum: ['small', 'medium', 'large'],
        default: 'medium'
      },
      colorScheme: {
        type: String,
        enum: ['default', 'high_contrast', 'colorblind_friendly'],
        default: 'default'
      },
      animations: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Activity and Engagement
  activity: {
    lastActive: {
      type: Date,
      default: Date.now
    },
    loginCount: {
      type: Number,
      default: 0
    },
    totalSessionTime: {
      type: Number,
      default: 0 // in minutes
    },
    pollsCreated: {
      type: Number,
      default: 0
    },
    pollsResponded: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0 // in minutes
    }
  },
  
  // Health and Wellness (for training platforms)
  wellness: {
    fitnessGoals: [{
      type: String,
      trim: true
    }],
    dietaryRestrictions: [{
      type: String,
      trim: true
    }],
    medicalConditions: [{
      type: String,
      trim: true
    }],
    allergies: [{
      type: String,
      trim: true
    }],
    medications: [{
      name: {
        type: String,
        trim: true
      },
      dosage: {
        type: String,
        trim: true
      },
      frequency: {
        type: String,
        trim: true
      }
    }]
  },
  
  // Custom Fields (for tenant-specific data)
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Metadata
  metadata: {
    type: Map,
    of: String,
    default: {}
  },
  
  // Status
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  profileCompletionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userDetailsSchema.index({ userId: 1 });
userDetailsSchema.index({ 'activity.lastActive': -1 });
userDetailsSchema.index({ isProfileComplete: 1 });
userDetailsSchema.index({ 'preferences.communication.timezone': 1 });

// Virtual for age
userDetailsSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtual for primary address
userDetailsSchema.virtual('primaryAddress').get(function() {
  return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
});

// Virtual for current work experience
userDetailsSchema.virtual('currentWork').get(function() {
  return this.workExperience.find(work => work.isCurrent);
});

// Pre-save middleware to calculate profile completion
userDetailsSchema.pre('save', function(next) {
  let completionScore = 0;
  const totalFields = 20; // Adjust based on important fields
  
  // Basic information
  if (this.firstName) completionScore += 5;
  if (this.lastName) completionScore += 5;
  if (this.email) completionScore += 5;
  if (this.phone) completionScore += 5;
  if (this.profilePicture) completionScore += 5;
  if (this.bio) completionScore += 5;
  if (this.addresses && this.addresses.length > 0) completionScore += 5;
  if (this.skills && this.skills.length > 0) completionScore += 5;
  if (this.workExperience && this.workExperience.length > 0) completionScore += 5;
  if (this.education && this.education.length > 0) completionScore += 5;
  if (this.certifications && this.certifications.length > 0) completionScore += 5;
  if (this.socialMedia && Object.values(this.socialMedia).some(val => val)) completionScore += 5;
  if (this.dateOfBirth) completionScore += 5;
  if (this.gender) completionScore += 5;
  if (this.nationality) completionScore += 5;
  if (this.emergencyContact && this.emergencyContact.name) completionScore += 5;
  if (this.industry) completionScore += 5;
  if (this.companySize) completionScore += 5;
  if (this.timezone) completionScore += 5;
  if (this.language) completionScore += 5;
  
  this.profileCompletionPercentage = Math.min(100, Math.round((completionScore / totalFields) * 100));
  this.isProfileComplete = this.profileCompletionPercentage >= 80;
  
  next();
});

// Instance method to update last activity
userDetailsSchema.methods.updateLastActivity = function() {
  this.activity.lastActive = new Date();
  this.activity.loginCount += 1;
  return this.save();
};

// Instance method to add skill
userDetailsSchema.methods.addSkill = function(skill) {
  const existingSkillIndex = this.skills.findIndex(s => s.name === skill.name);
  
  if (existingSkillIndex >= 0) {
    this.skills[existingSkillIndex] = skill;
  } else {
    this.skills.push(skill);
  }
  
  return this.save();
};

// Instance method to add certification
userDetailsSchema.methods.addCertification = function(certification) {
  this.certifications.push(certification);
  return this.save();
};

// Instance method to add work experience
userDetailsSchema.methods.addWorkExperience = function(experience) {
  this.workExperience.push(experience);
  return this.save();
};

// Instance method to add education
userDetailsSchema.methods.addEducation = function(education) {
  this.education.push(education);
  return this.save();
};

// Instance method to get public profile
userDetailsSchema.methods.getPublicProfile = function() {
  return {
    id: this.userId,
    firstName: this.firstName,
    lastName: this.lastName,
    profilePicture: this.profilePicture,
    bio: this.bio,
    skills: this.skills,
    currentWork: this.currentWork,
    socialMedia: this.socialMedia,
    isProfileComplete: this.isProfileComplete,
    profileCompletionPercentage: this.profileCompletionPercentage
  };
};

// Static method to find by user ID
userDetailsSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

// Static method to find complete profiles
userDetailsSchema.statics.findCompleteProfiles = function() {
  return this.find({ isProfileComplete: true });
};

// Static method to find by skills
userDetailsSchema.statics.findBySkills = function(skills) {
  return this.find({
    'skills.name': { $in: skills }
  });
};

module.exports = mongoose.model('UserDetails', userDetailsSchema); 