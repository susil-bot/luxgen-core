const mongoose = require('mongoose');

const trainingAssessmentSchema = new mongoose.Schema({

  // Core assessment information
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


  // Assessment details
  assessmentCode: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  type: {
    type: String,
    enum: ['quiz', 'exam', 'project', 'presentation', 'survey', 'evaluation'],
    default: 'quiz'
  },
  category: {
    type: String,
    trim: true,
    maxlength: 100
  },


  // Assessment settings
  settings: {
    timeLimit: {
      type: Number,
      // in minutes, 0 means no limit
      default: 0
    },
    passingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 70
    },
    maxAttempts: {
      type: Number,
      default: 3,
      min: 1
    },
    allowRetakes: {
      type: Boolean,
      default: true
    },
    shuffleQuestions: {
      type: Boolean,
      default: false
    },
    showResults: {
      type: Boolean,
      default: true
    },
    showCorrectAnswers: {
      type: Boolean,
      default: false
    },
    requireAllQuestions: {
      type: Boolean,
      default: true
    },
    allowPartialCredit: {
      type: Boolean,
      default: false
    } },


  // Questions structure
  questions: [{
    questionId: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['multiple-choice', 'single-choice', 'true-false', 'fill-blank', 'essay', 'matching', 'ordering', 'file-upload'],
      required: true
    },
    question: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    points: {
      type: Number,
      default: 1,
      min: 0
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
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


    // Multiple choice options
    options: [{
      optionId: {
        type: String,
        required: true,
        trim: true
      },
      text: {
        type: String,
        required: true,
        trim: true
      },
      isCorrect: {
        type: Boolean,
        default: false
      },
      explanation: {
        type: String,
        trim: true,
        maxlength: 500
      } }],


    // Correct answers for various question types
    correctAnswers: [{
      type: String,
      trim: true
    }],


    // For fill-in-the-blank questions
    blanks: [{
      blankId: {
        type: String,
        required: true,
        trim: true
      },
      correctAnswer: {
        type: String,
        required: true,
        trim: true
      },
      alternatives: [{
        type: String,
        trim: true
      }],
      caseSensitive: {
        type: Boolean,
        default: false
      } }],


    // For essay questions
    essaySettings: {
      minWords: {
        type: Number,
        default: 50,
        min: 0
      },
      maxWords: {
        type: Number,
        default: 500,
        min: 0
      },
      rubric: [{
        criterion: {
          type: String,
          required: true,
          trim: true
        },
        maxPoints: {
          type: Number,
          required: true,
          min: 0
        },
        description: {
          type: String,
          trim: true,
          maxlength: 200
        } }]
    },


    // For file upload questions
    fileUploadSettings: {
      allowedTypes: [{
        type: String,
        trim: true
      }],
      maxSize: {
        type: Number,
        // in MB
        default: 10
      },
      maxFiles: {
        type: Number,
        default: 1
      } },


    // Question metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {} },
    order: {
      type: Number,
      default: 0
    } }],


  // Assessment sections
  sections: [{
    sectionId: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    timeLimit: {
      type: Number,
      // in minutes
      default: 0
    },
    questions: [{
      type: String,
      // questionId references
      trim: true
    }],
    order: {
      type: Number,
      default: 0
    } }],


  // Assessment statistics
  statistics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    totalCompletions: {
      type: Number,
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
    },
    averageCompletionTime: {
      type: Number,
      // in minutes
      default: 0
    },
    difficultyRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    } },


  // Assessment status
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: { type: Date },


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
  } }, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true } });


// Indexes
trainingAssessmentSchema.index({ tenantId: 1, isActive: 1 });
trainingAssessmentSchema.index({ tenantId: 1, type: 1 });
trainingAssessmentSchema.index({ assessmentCode: 1 });


// Virtual for total points
trainingAssessmentSchema.virtual('totalPoints').get(function () {
  return this.questions.reduce((total, question) => total + question.points, 0);
});


// Virtual for question count
trainingAssessmentSchema.virtual('questionCount').get(function () {
  return this.questions.length;
});


// Virtual for estimated duration
trainingAssessmentSchema.virtual('estimatedDuration').get(function () {
  if (this.settings.timeLimit > 0) {
    return this.settings.timeLimit;
  }
  // Estimate based on question count and type
  return this.questions.reduce((total, question) => {
    const baseTime = question.type === 'essay' ? 10 : 2;
    // minutes per question
    return total + baseTime;
  }, 0);
});


// Pre-save middleware
trainingAssessmentSchema.pre('save', function (next) {
// Update version if questions are modified
  if (this.isModified('questions')) {
    const currentVersion = this.version.split('.');
    const newPatch = parseInt(currentVersion[2]) + 1;
    this.version = `${currentVersion[0]}.${currentVersion[1]}.${newPatch}`;
  }
  // Ensure questions have proper order
  this.questions.forEach((question, index) => {
    if (!question.order) {
      question.order = index;
    } });

  next();
});


// Static methods
trainingAssessmentSchema.statics.findByTenant = function (tenantId, options = {}) {
  return this.find({ tenantId, ...options });
}
trainingAssessmentSchema.statics.findActive = function (tenantId) {
  return this.find({
    tenantId,
    isActive: true,
    isPublished: true
  });
}
trainingAssessmentSchema.statics.findByType = function (tenantId, type) {
  return this.find({
    tenantId,
    type,
    isActive: true,
    isPublished: true
  });
}
// Instance methods
trainingAssessmentSchema.methods.publish = function () {
  this.isPublished = true;
  this.publishedAt = new Date();
  return this.save();
}
trainingAssessmentSchema.methods.unpublish = function () {
  this.isPublished = false;
  this.publishedAt = null;
  return this.save();
}
trainingAssessmentSchema.methods.addQuestion = function (question) {
  if (!question.order) {
    question.order = this.questions.length;
  }
  if (!question.questionId) {
    question.questionId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  this.questions.push(question);
  return this.save();
}
trainingAssessmentSchema.methods.updateQuestion = function (questionIndex, updates) {
  if (questionIndex >= 0 && questionIndex < this.questions.length) {
    this.questions[questionIndex] = { ...this.questions[questionIndex], ...updates }
    return this.save();
  }
  throw new Error('Invalid question index');
}
trainingAssessmentSchema.methods.removeQuestion = function (questionIndex) {
  if (questionIndex >= 0 && questionIndex < this.questions.length) {
    this.questions.splice(questionIndex, 1);

    // Reorder remaining questions
    this.questions.forEach((question, index) => {
      question.order = index;
    });
    return this.save();
  }
  throw new Error('Invalid question index');
}
trainingAssessmentSchema.methods.calculateScore = function (answers) {
  let totalScore = 0;
  let maxPossibleScore = 0;

  this.questions.forEach(question => {
    maxPossibleScore += question.points;
    const answer = answers[question.questionId];

    if (answer) {
      let questionScore = 0;

      switch (question.type) {
        case 'multiple-choice':

          // For multiple choice, check if all correct options are selected
          const correctOptions = question.options.filter(opt => opt.isCorrect).map(opt => opt.optionId);
          const selectedOptions = Array.isArray(answer) ? answer : [answer];
          const allCorrect = correctOptions.length === selectedOptions.length &&
            correctOptions.every(opt => selectedOptions.includes(opt));
          questionScore = allCorrect ? question.points : 0;
          break;

        case 'single-choice':
        case 'true-false':
          const correctOption = question.options.find(opt => opt.isCorrect);
          questionScore = (answer === correctOption.optionId) ? question.points : 0;
          break;

        case 'fill-blank':

          // Check each blank
          const blankAnswers = Array.isArray(answer) ? answer : [answer];
          let blankScore = 0;
          question.blanks.forEach((blank, index) => {
            const userAnswer = blankAnswers[index] || '';
            const isCorrect = blank.caseSensitive
              ? userAnswer === blank.correctAnswer
              : userAnswer.toLowerCase() === blank.correctAnswer.toLowerCase();
            if (isCorrect || blank.alternatives.some(alt =>
              blank.caseSensitive ? userAnswer === alt : userAnswer.toLowerCase() === alt.toLowerCase()
            )) {
              blankScore += question.points / question.blanks.length;
            } });
          questionScore = blankScore;
          break;

        case 'essay':

          // For essay questions, return partial credit based on word count
          const wordCount = answer.split(/\s+/).length;
          const minWords = question.essaySettings?.minWords || 50;
          questionScore = Math.min(question.points, (wordCount / minWords) * question.points);
          break;

        default:
          questionScore = 0;
      }
      totalScore += questionScore;
    } });

  return {
    score: totalScore,
    maxScore: maxPossibleScore,
    percentage: maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0,
    passed: maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 >= this.settings.passingScore : false
  } }
trainingAssessmentSchema.methods.updateStatistics = function (attemptData) {
// Update attempt statistics
  this.statistics.totalAttempts += 1;

  if (attemptData.completed) {
    this.statistics.totalCompletions += 1;
  }
  if (attemptData.score !== undefined) {
    const currentTotal = this.statistics.averageScore * (this.statistics.totalAttempts - 1);
    this.statistics.averageScore = (currentTotal + attemptData.score) / this.statistics.totalAttempts;
  }
  if (attemptData.passed) {
    const passedCount = Math.round((this.statistics.passRate / 100) * (this.statistics.totalAttempts - 1)) + 1;
    this.statistics.passRate = (passedCount / this.statistics.totalAttempts) * 100;
  }
  if (attemptData.completionTime) {
    const currentTotal = this.statistics.averageCompletionTime * (this.statistics.totalCompletions - 1);
    this.statistics.averageCompletionTime = (currentTotal + attemptData.completionTime) / this.statistics.totalCompletions;
  }
  return this.save();
}
module.exports = mongoose.model('TrainingAssessment', trainingAssessmentSchema);
