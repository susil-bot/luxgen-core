/**
 * Complete Database Seeding Script for LuxGen Platform
 * 
 * This script seeds MongoDB Atlas with test data for all schema models
 * Following LuxGen rules: Multi-tenant architecture, max 5 records per model
 * 
 * Usage: node src/scripts/seedLuxgenDatabaseComplete.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { 
  User, 
  Tenant, 
  Session, 
  Group, 
  Poll, 
  Notification, 
  AuditLog, 
  TenantSchema, 
  TrainingSession, 
  TrainingCourse, 
  TrainingModule, 
  TrainingAssessment, 
  Presentation,
  Activity
} = require('../models');

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/luxgen';

// Logging function
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '📝';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

// Test data configuration
const TEST_DATA_CONFIG = {
  tenants: 2,
  usersPerTenant: 5,
  maxRecordsPerModel: 5
};

// Test tenant data
const testTenants = [
  {
    name: 'Acme Corporation',
    slug: 'acme-corporation',
    contactEmail: 'admin@acme.com',
    status: 'active',
    settings: {
      theme: 'corporate',
      features: ['training', 'assessment', 'analytics'],
      branding: {
        primaryColor: '#2563eb',
        secondaryColor: '#1e40af',
        logo: 'https://example.com/logo.png'
      }
    }
  },
  {
    name: 'TechStart Inc',
    slug: 'techstart-inc',
    contactEmail: 'admin@techstart.com',
    status: 'active',
    settings: {
      theme: 'modern',
      features: ['training', 'assessment', 'analytics', 'messaging'],
      branding: {
        primaryColor: '#7c3aed',
        secondaryColor: '#5b21b6',
        logo: 'https://example.com/techstart-logo.png'
      }
    }
  }
];

// Test user data
const testUsers = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    role: 'admin',
    isActive: true,
    isVerified: true,
    phone: '+1234567890',
    department: 'IT',
    position: 'System Administrator'
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: 'password123',
    role: 'trainer',
    isActive: true,
    isVerified: true,
    phone: '+1234567891',
    department: 'HR',
    position: 'Training Manager'
  },
  {
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@example.com',
    password: 'password123',
    role: 'user',
    isActive: true,
    isVerified: true,
    phone: '+1234567892',
    department: 'Sales',
    position: 'Sales Representative'
  },
  {
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah.wilson@example.com',
    password: 'password123',
    role: 'user',
    isActive: true,
    isVerified: true,
    phone: '+1234567893',
    department: 'Marketing',
    position: 'Marketing Specialist'
  },
  {
    firstName: 'David',
    lastName: 'Brown',
    email: 'david.brown@example.com',
    password: 'password123',
    role: 'user',
    isActive: true,
    isVerified: true,
    phone: '+1234567894',
    department: 'Operations',
    position: 'Operations Manager'
  }
];

// Test activity data
const testActivities = [
  {
    type: 'user_joined',
    title: 'New User Registration',
    description: 'A new user has joined the platform',
    metadata: {
      userRole: 'user',
      department: 'Sales'
    }
  },
  {
    type: 'program_created',
    title: 'Training Program Created',
    description: 'A new training program has been created',
    metadata: {
      programName: 'Sales Training 101',
      category: 'Sales'
    }
  },
  {
    type: 'session_completed',
    title: 'Training Session Completed',
    description: 'A training session has been completed',
    metadata: {
      sessionName: 'Customer Service Training',
      duration: 120
    }
  },
  {
    type: 'assessment_taken',
    title: 'Assessment Completed',
    description: 'An assessment has been completed',
    metadata: {
      assessmentName: 'Product Knowledge Test',
      score: 85
    }
  },
  {
    type: 'certificate_earned',
    title: 'Certificate Earned',
    description: 'A certificate has been earned',
    metadata: {
      certificateName: 'Sales Excellence Certificate',
      level: 'Advanced'
    }
  }
];

// Test training course data
const testTrainingCourses = [
  {
    title: 'Sales Fundamentals',
    code: 'SF001',
    category: 'Sales',
    level: 'beginner',
    duration: 480,
    description: 'Learn the fundamentals of sales',
    objectives: ['Understand sales process', 'Learn communication skills'],
    prerequisites: [],
    status: 'active'
  },
  {
    title: 'Customer Service Excellence',
    code: 'CSE001',
    category: 'Customer Service',
    level: 'intermediate',
    duration: 360,
    description: 'Master customer service skills',
    objectives: ['Handle difficult customers', 'Improve satisfaction'],
    prerequisites: ['Sales Fundamentals'],
    status: 'active'
  },
  {
    title: 'Leadership Development',
    code: 'LD001',
    category: 'Leadership',
    level: 'advanced',
    duration: 600,
    description: 'Develop leadership capabilities',
    objectives: ['Lead teams effectively', 'Strategic thinking'],
    prerequisites: ['Customer Service Excellence'],
    status: 'active'
  },
  {
    title: 'Digital Marketing',
    code: 'DM001',
    category: 'Marketing',
    level: 'intermediate',
    duration: 420,
    description: 'Learn digital marketing strategies',
    objectives: ['SEO optimization', 'Social media marketing'],
    prerequisites: [],
    status: 'active'
  },
  {
    title: 'Project Management',
    code: 'PM001',
    category: 'Management',
    level: 'intermediate',
    duration: 540,
    description: 'Master project management skills',
    objectives: ['Project planning', 'Risk management'],
    prerequisites: ['Leadership Development'],
    status: 'active'
  }
];

// Test training session data
const testTrainingSessions = [
  {
    title: 'Sales Techniques Workshop',
    sessionType: 'workshop',
    scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
    duration: 120,
    status: 'scheduled',
    capacity: 20,
    description: 'Interactive workshop on sales techniques',
    objectives: ['Practice sales scenarios', 'Role-playing exercises']
  },
  {
    title: 'Customer Service Training',
    sessionType: 'lecture',
    scheduledAt: new Date(Date.now() + 172800000), // Day after tomorrow
    duration: 90,
    status: 'scheduled',
    capacity: 15,
    description: 'Comprehensive customer service training',
    objectives: ['Service standards', 'Communication skills']
  },
  {
    title: 'Leadership Seminar',
    sessionType: 'seminar',
    scheduledAt: new Date(Date.now() - 86400000), // Yesterday
    duration: 180,
    status: 'completed',
    capacity: 25,
    description: 'Leadership development seminar',
    objectives: ['Leadership principles', 'Team management']
  },
  {
    title: 'Marketing Strategy Session',
    sessionType: 'workshop',
    scheduledAt: new Date(Date.now() - 172800000), // 2 days ago
    duration: 150,
    status: 'completed',
    capacity: 12,
    description: 'Marketing strategy development',
    objectives: ['Strategy planning', 'Market analysis']
  },
  {
    title: 'Project Planning Workshop',
    sessionType: 'workshop',
    scheduledAt: new Date(Date.now() + 259200000), // 3 days from now
    duration: 200,
    status: 'scheduled',
    capacity: 18,
    description: 'Project planning and management',
    objectives: ['Project planning', 'Resource allocation']
  }
];

// Test training module data
const testTrainingModules = [
  {
    title: 'Introduction to Sales',
    description: 'Basic concepts of sales',
    content: 'This module covers the fundamental concepts of sales...',
    duration: 60,
    order: 1,
    type: 'video',
    status: 'active'
  },
  {
    title: 'Customer Communication',
    description: 'Effective communication with customers',
    content: 'Learn how to communicate effectively with customers...',
    duration: 45,
    order: 2,
    type: 'interactive',
    status: 'active'
  },
  {
    title: 'Closing Techniques',
    description: 'Advanced closing techniques',
    content: 'Master the art of closing sales...',
    duration: 90,
    order: 3,
    type: 'video',
    status: 'active'
  },
  {
    title: 'Handling Objections',
    description: 'Dealing with customer objections',
    content: 'Learn to handle customer objections professionally...',
    duration: 75,
    order: 4,
    type: 'interactive',
    status: 'active'
  },
  {
    title: 'Sales Follow-up',
    description: 'Effective follow-up strategies',
    content: 'Develop effective follow-up strategies...',
    duration: 30,
    order: 5,
    type: 'reading',
    status: 'active'
  }
];

// Test training assessment data
const testTrainingAssessments = [
  {
    title: 'Sales Knowledge Test',
    description: 'Test your sales knowledge',
    questions: [
      {
        question: 'What is the first step in the sales process?',
        type: 'multiple-choice',
        options: ['Prospecting', 'Qualifying', 'Presenting', 'Closing'],
        correctAnswer: 0,
        points: 10
      },
      {
        question: 'What is the most important skill for a salesperson?',
        type: 'multiple-choice',
        options: ['Listening', 'Talking', 'Writing', 'Reading'],
        correctAnswer: 0,
        points: 10
      }
    ],
    passingScore: 70,
    timeLimit: 30,
    attempts: 3,
    status: 'active'
  },
  {
    title: 'Customer Service Assessment',
    description: 'Assess your customer service skills',
    questions: [
      {
        question: 'How should you handle an angry customer?',
        type: 'multiple-choice',
        options: ['Ignore them', 'Listen actively', 'Argue back', 'Transfer immediately'],
        correctAnswer: 1,
        points: 15
      }
    ],
    passingScore: 80,
    timeLimit: 45,
    attempts: 2,
    status: 'active'
  },
  {
    title: 'Leadership Skills Test',
    description: 'Test your leadership capabilities',
    questions: [
      {
        question: 'What is the most important trait of a good leader?',
        type: 'multiple-choice',
        options: ['Charisma', 'Empathy', 'Intelligence', 'Experience'],
        correctAnswer: 1,
        points: 20
      }
    ],
    passingScore: 75,
    timeLimit: 60,
    attempts: 1,
    status: 'active'
  },
  {
    title: 'Marketing Knowledge Quiz',
    description: 'Test your marketing knowledge',
    questions: [
      {
        question: 'What does SEO stand for?',
        type: 'multiple-choice',
        options: ['Search Engine Optimization', 'Sales Engine Optimization', 'Social Engine Optimization', 'Service Engine Optimization'],
        correctAnswer: 0,
        points: 10
      }
    ],
    passingScore: 70,
    timeLimit: 30,
    attempts: 3,
    status: 'active'
  },
  {
    title: 'Project Management Assessment',
    description: 'Assess your project management skills',
    questions: [
      {
        question: 'What is the first phase of project management?',
        type: 'multiple-choice',
        options: ['Planning', 'Execution', 'Initiation', 'Monitoring'],
        correctAnswer: 2,
        points: 15
      }
    ],
    passingScore: 80,
    timeLimit: 40,
    attempts: 2,
    status: 'active'
  }
];

// Test presentation data
const testPresentations = [
  {
    title: 'Sales Presentation Template',
    description: 'Template for sales presentations',
    slides: [
      {
        title: 'Introduction',
        content: 'Welcome to our sales presentation',
        order: 1
      },
      {
        title: 'Problem Statement',
        content: 'The challenges we face in sales',
        order: 2
      },
      {
        title: 'Solution',
        content: 'Our proposed solution',
        order: 3
      }
    ],
    duration: 30,
    status: 'active'
  },
  {
    title: 'Customer Service Training',
    description: 'Training presentation for customer service',
    slides: [
      {
        title: 'Service Standards',
        content: 'Our service standards and expectations',
        order: 1
      },
      {
        title: 'Communication Skills',
        content: 'Effective communication techniques',
        order: 2
      }
    ],
    duration: 45,
    status: 'active'
  },
  {
    title: 'Leadership Workshop',
    description: 'Leadership development presentation',
    slides: [
      {
        title: 'Leadership Principles',
        content: 'Core principles of leadership',
        order: 1
      },
      {
        title: 'Team Building',
        content: 'Building effective teams',
        order: 2
      }
    ],
    duration: 60,
    status: 'active'
  },
  {
    title: 'Marketing Strategy',
    description: 'Marketing strategy presentation',
    slides: [
      {
        title: 'Market Analysis',
        content: 'Current market analysis',
        order: 1
      },
      {
        title: 'Strategy Development',
        content: 'Developing marketing strategies',
        order: 2
      }
    ],
    duration: 50,
    status: 'active'
  },
  {
    title: 'Project Planning',
    description: 'Project planning presentation',
    slides: [
      {
        title: 'Project Initiation',
        content: 'Starting a new project',
        order: 1
      },
      {
        title: 'Planning Process',
        content: 'The planning process',
        order: 2
      }
    ],
    duration: 40,
    status: 'active'
  }
];

// Test group data
const testGroups = [
  {
    name: 'Sales Team',
    description: 'Sales department team',
    type: 'department',
    status: 'active'
  },
  {
    name: 'Customer Service',
    description: 'Customer service team',
    type: 'department',
    status: 'active'
  },
  {
    name: 'Leadership Development',
    description: 'Leadership development group',
    type: 'training',
    status: 'active'
  },
  {
    name: 'Marketing Team',
    description: 'Marketing department team',
    type: 'department',
    status: 'active'
  },
  {
    name: 'Project Managers',
    description: 'Project management group',
    type: 'role',
    status: 'active'
  }
];

// Test poll data
const testPolls = [
  {
    question: 'How satisfied are you with the current training program?',
    options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'],
    type: 'rating',
    status: 'active',
    allowMultiple: false,
    anonymous: true
  },
  {
    question: 'Which training topics would you like to see more of?',
    options: ['Sales Techniques', 'Customer Service', 'Leadership', 'Marketing', 'Project Management'],
    type: 'multiple-choice',
    status: 'active',
    allowMultiple: true,
    anonymous: false
  },
  {
    question: 'How often do you use the learning platform?',
    options: ['Daily', 'Weekly', 'Monthly', 'Rarely', 'Never'],
    type: 'frequency',
    status: 'active',
    allowMultiple: false,
    anonymous: true
  },
  {
    question: 'What is your preferred learning method?',
    options: ['Video', 'Interactive', 'Reading', 'Hands-on', 'Group Discussion'],
    type: 'preference',
    status: 'active',
    allowMultiple: false,
    anonymous: false
  },
  {
    question: 'Rate the quality of our training materials',
    options: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'],
    type: 'rating',
    status: 'active',
    allowMultiple: false,
    anonymous: true
  }
];

// Test notification data
const testNotifications = [
  {
    title: 'New Training Available',
    message: 'A new training program is now available for you',
    type: 'info',
    priority: 'medium',
    status: 'unread'
  },
  {
    title: 'Assessment Due',
    message: 'You have an assessment due in 3 days',
    type: 'reminder',
    priority: 'high',
    status: 'unread'
  },
  {
    title: 'Certificate Earned',
    message: 'Congratulations! You have earned a new certificate',
    type: 'success',
    priority: 'low',
    status: 'read'
  },
  {
    title: 'System Maintenance',
    message: 'System maintenance scheduled for tonight',
    type: 'warning',
    priority: 'medium',
    status: 'unread'
  },
  {
    title: 'Welcome to the Platform',
    message: 'Welcome to the LuxGen learning platform',
    type: 'info',
    priority: 'low',
    status: 'read'
  }
];

// Test audit log data
const testAuditLogs = [
  {
    action: 'user_login',
    description: 'User logged into the system',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'success'
  },
  {
    action: 'training_created',
    description: 'New training program created',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    status: 'success'
  },
  {
    action: 'assessment_completed',
    description: 'Assessment completed by user',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    status: 'success'
  },
  {
    action: 'user_logout',
    description: 'User logged out of the system',
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'success'
  },
  {
    action: 'data_export',
    description: 'User exported training data',
    ipAddress: '192.168.1.104',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    status: 'success'
  }
];

// Test session data
const testSessions = [
  {
    sessionId: 'session_001',
    userId: null, // Will be set during seeding
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    isActive: true,
    expiresAt: new Date(Date.now() + 86400000) // 24 hours from now
  },
  {
    sessionId: 'session_002',
    userId: null, // Will be set during seeding
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    isActive: true,
    expiresAt: new Date(Date.now() + 86400000)
  },
  {
    sessionId: 'session_003',
    userId: null, // Will be set during seeding
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    isActive: false,
    expiresAt: new Date(Date.now() - 86400000) // Expired
  },
  {
    sessionId: 'session_004',
    userId: null, // Will be set during seeding
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    isActive: true,
    expiresAt: new Date(Date.now() + 86400000)
  },
  {
    sessionId: 'session_005',
    userId: null, // Will be set during seeding
    ipAddress: '192.168.1.104',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    isActive: false,
    expiresAt: new Date(Date.now() - 172800000) // Expired 2 days ago
  }
];

// Test tenant schema data
const testTenantSchemas = [
  {
    name: 'Corporate Training Schema',
    description: 'Schema for corporate training programs',
    fields: [
      {
        name: 'department',
        type: 'string',
        required: true,
        label: 'Department'
      },
      {
        name: 'role',
        type: 'string',
        required: true,
        label: 'Role'
      },
      {
        name: 'experience',
        type: 'number',
        required: false,
        label: 'Years of Experience'
      }
    ],
    status: 'active'
  },
  {
    name: 'Assessment Schema',
    description: 'Schema for assessment data',
    fields: [
      {
        name: 'score',
        type: 'number',
        required: true,
        label: 'Score'
      },
      {
        name: 'attempts',
        type: 'number',
        required: true,
        label: 'Number of Attempts'
      },
      {
        name: 'timeSpent',
        type: 'number',
        required: false,
        label: 'Time Spent (minutes)'
      }
    ],
    status: 'active'
  },
  {
    name: 'User Profile Schema',
    description: 'Schema for user profile data',
    fields: [
      {
        name: 'bio',
        type: 'text',
        required: false,
        label: 'Biography'
      },
      {
        name: 'skills',
        type: 'array',
        required: false,
        label: 'Skills'
      },
      {
        name: 'interests',
        type: 'array',
        required: false,
        label: 'Interests'
      }
    ],
    status: 'active'
  },
  {
    name: 'Training Progress Schema',
    description: 'Schema for tracking training progress',
    fields: [
      {
        name: 'completionPercentage',
        type: 'number',
        required: true,
        label: 'Completion Percentage'
      },
      {
        name: 'lastAccessed',
        type: 'date',
        required: true,
        label: 'Last Accessed'
      },
      {
        name: 'timeSpent',
        type: 'number',
        required: true,
        label: 'Total Time Spent'
      }
    ],
    status: 'active'
  },
  {
    name: 'Feedback Schema',
    description: 'Schema for feedback data',
    fields: [
      {
        name: 'rating',
        type: 'number',
        required: true,
        label: 'Rating (1-5)'
      },
      {
        name: 'comments',
        type: 'text',
        required: false,
        label: 'Comments'
      },
      {
        name: 'category',
        type: 'string',
        required: true,
        label: 'Feedback Category'
      }
    ],
    status: 'active'
  }
];

/**
 * Main seeding function
 */
async function seedDatabase() {
  try {
    log('🌱 Starting LuxGen Database Seeding...', 'info');
    log(`MongoDB URI: ${MONGODB_URI}`, 'info');
    
    // Connect to MongoDB
    log('Connecting to MongoDB...', 'info');
    await mongoose.connect(MONGODB_URI);
    log('✅ Connected to MongoDB Atlas', 'success');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await clearDatabase();

    // Create tenants
    console.log('🏢 Creating tenants...');
    const tenants = await createTenants();

    // Create users for each tenant
    console.log('👥 Creating users...');
    const allUsers = await createUsers(tenants);

    // Create activities
    console.log('📊 Creating activities...');
    await createActivities(tenants, allUsers);

    // Create training courses
    console.log('📚 Creating training courses...');
    const trainingCourses = await createTrainingCourses(tenants);

    // Create training sessions
    console.log('🎯 Creating training sessions...');
    await createTrainingSessions(tenants, allUsers, trainingCourses);

    // Create training modules
    console.log('📖 Creating training modules...');
    await createTrainingModules(tenants, trainingCourses);

    // Create training assessments
    console.log('📝 Creating training assessments...');
    await createTrainingAssessments(tenants);

    // Create presentations
    console.log('🎨 Creating presentations...');
    await createPresentations(tenants);

    // Create groups
    console.log('👥 Creating groups...');
    await createGroups(tenants, allUsers);

    // Create polls
    console.log('📊 Creating polls...');
    await createPolls(tenants, allUsers);

    // Create notifications
    console.log('🔔 Creating notifications...');
    await createNotifications(tenants, allUsers);

    // Create audit logs
    console.log('📋 Creating audit logs...');
    await createAuditLogs(tenants, allUsers);

    // Create sessions
    console.log('🔐 Creating sessions...');
    await createSessions(allUsers);

    // Create tenant schemas
    console.log('📋 Creating tenant schemas...');
    await createTenantSchemas(tenants);

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Tenants: ${tenants.length}`);
    console.log(`   - Users: ${allUsers.length}`);
    console.log(`   - Activities: ${testActivities.length * tenants.length}`);
    console.log(`   - Training Courses: ${trainingCourses.length}`);
    console.log(`   - Training Sessions: ${testTrainingSessions.length * tenants.length}`);
    console.log(`   - Training Modules: ${testTrainingModules.length * tenants.length}`);
    console.log(`   - Training Assessments: ${testTrainingAssessments.length * tenants.length}`);
    console.log(`   - Presentations: ${testPresentations.length * tenants.length}`);
    console.log(`   - Groups: ${testGroups.length * tenants.length}`);
    console.log(`   - Polls: ${testPolls.length * tenants.length}`);
    console.log(`   - Notifications: ${testNotifications.length * tenants.length}`);
    console.log(`   - Audit Logs: ${testAuditLogs.length * tenants.length}`);
    console.log(`   - Sessions: ${testSessions.length * tenants.length}`);
    console.log(`   - Tenant Schemas: ${testTenantSchemas.length * tenants.length}`);

  } catch (error) {
    log(`❌ Error seeding database: ${error.message}`, 'error');
    log(`Stack trace: ${error.stack}`, 'error');
    throw error;
  } finally {
    await mongoose.disconnect();
    log('🔌 Disconnected from MongoDB', 'info');
  }
}

/**
 * Clear all existing data
 */
async function clearDatabase() {
  const collections = [
    'users', 'tenants', 'activities', 'trainingcourses', 'trainingsessions',
    'trainingmodules', 'trainingassessments', 'presentations', 'groups',
    'polls', 'notifications', 'auditlogs', 'sessions', 'tenantschemas'
  ];

  for (const collection of collections) {
    try {
      await mongoose.connection.db.collection(collection).deleteMany({});
    } catch (error) {
      console.warn(`⚠️  Warning: Could not clear collection ${collection}:`, error.message);
    }
  }
}

/**
 * Create tenants
 */
async function createTenants() {
  const tenants = [];
  for (const tenantData of testTenants) {
    const tenant = new Tenant(tenantData);
    await tenant.save();
    tenants.push(tenant);
    console.log(`   ✅ Created tenant: ${tenant.name}`);
  }
  return tenants;
}

/**
 * Create users for each tenant
 */
async function createUsers(tenants) {
  const allUsers = [];
  
  for (const tenant of tenants) {
    const tenantUsers = [];
    
    for (let i = 0; i < testUsers.length; i++) {
      const userData = {
        ...testUsers[i],
        tenantId: tenant._id,
        email: `${testUsers[i].email.split('@')[0]}+${tenant.slug}@example.com`
      };
      
      // Hash password
      userData.password = await bcrypt.hash(userData.password, 10);
      
      const user = new User(userData);
      await user.save();
      tenantUsers.push(user);
      allUsers.push(user);
    }
    
    console.log(`   ✅ Created ${tenantUsers.length} users for tenant: ${tenant.name}`);
  }
  
  return allUsers;
}

/**
 * Create activities
 */
async function createActivities(tenants, users) {
  for (const tenant of tenants) {
    const tenantUsers = users.filter(user => user.tenantId.toString() === tenant._id.toString());
    
    for (let i = 0; i < testActivities.length; i++) {
      const activityData = {
        ...testActivities[i],
        tenantId: tenant._id,
        userId: tenantUsers[i % tenantUsers.length]._id,
        timestamp: new Date(Date.now() - (i * 3600000)), // Spread over time
        likes: Math.floor(Math.random() * 10),
        comments: Math.floor(Math.random() * 5),
        shares: Math.floor(Math.random() * 3),
        views: Math.floor(Math.random() * 50) + 10
      };
      
      const activity = new Activity(activityData);
      await activity.save();
    }
    
    console.log(`   ✅ Created ${testActivities.length} activities for tenant: ${tenant.name}`);
  }
}

/**
 * Create training courses
 */
async function createTrainingCourses(tenants) {
  const allCourses = [];
  
  for (const tenant of tenants) {
    for (let i = 0; i < testTrainingCourses.length; i++) {
      const courseData = {
        ...testTrainingCourses[i],
        tenantId: tenant._id,
        instructorId: null, // Will be set later
        enrollmentCount: Math.floor(Math.random() * 20) + 5,
        createdAt: new Date(Date.now() - (i * 86400000)) // Spread over time
      };
      
      const course = new TrainingCourse(courseData);
      await course.save();
      allCourses.push(course);
    }
    
    console.log(`   ✅ Created ${testTrainingCourses.length} training courses for tenant: ${tenant.name}`);
  }
  
  return allCourses;
}

/**
 * Create training sessions
 */
async function createTrainingSessions(tenants, users, courses) {
  for (const tenant of tenants) {
    const tenantUsers = users.filter(user => user.tenantId.toString() === tenant._id.toString());
    const tenantCourses = courses.filter(course => course.tenantId.toString() === tenant._id.toString());
    
    for (let i = 0; i < testTrainingSessions.length; i++) {
      const sessionData = {
        ...testTrainingSessions[i],
        tenantId: tenant._id,
        trainerId: tenantUsers.find(user => user.role === 'trainer')?._id || tenantUsers[0]._id,
        courseId: tenantCourses[i % tenantCourses.length]._id,
        participants: tenantUsers.slice(0, Math.floor(Math.random() * 5) + 1).map(user => user._id),
        attendance: []
      };
      
      // Add attendance data for completed sessions
      if (sessionData.status === 'completed') {
        sessionData.attendance = sessionData.participants.map(participantId => ({
          participantId,
          attended: Math.random() > 0.2 // 80% attendance rate
        }));
      }
      
      const session = new TrainingSession(sessionData);
      await session.save();
    }
    
    console.log(`   ✅ Created ${testTrainingSessions.length} training sessions for tenant: ${tenant.name}`);
  }
}

/**
 * Create training modules
 */
async function createTrainingModules(tenants, courses) {
  for (const tenant of tenants) {
    const tenantCourses = courses.filter(course => course.tenantId.toString() === tenant._id.toString());
    
    for (let i = 0; i < testTrainingModules.length; i++) {
      const moduleData = {
        ...testTrainingModules[i],
        tenantId: tenant._id,
        courseId: tenantCourses[i % tenantCourses.length]._id,
        createdAt: new Date(Date.now() - (i * 86400000))
      };
      
      const module = new TrainingModule(moduleData);
      await module.save();
    }
    
    console.log(`   ✅ Created ${testTrainingModules.length} training modules for tenant: ${tenant.name}`);
  }
}

/**
 * Create training assessments
 */
async function createTrainingAssessments(tenants) {
  for (const tenant of tenants) {
    for (let i = 0; i < testTrainingAssessments.length; i++) {
      const assessmentData = {
        ...testTrainingAssessments[i],
        tenantId: tenant._id,
        createdAt: new Date(Date.now() - (i * 86400000))
      };
      
      const assessment = new TrainingAssessment(assessmentData);
      await assessment.save();
    }
    
    console.log(`   ✅ Created ${testTrainingAssessments.length} training assessments for tenant: ${tenant.name}`);
  }
}

/**
 * Create presentations
 */
async function createPresentations(tenants) {
  for (const tenant of tenants) {
    for (let i = 0; i < testPresentations.length; i++) {
      const presentationData = {
        ...testPresentations[i],
        tenantId: tenant._id,
        createdAt: new Date(Date.now() - (i * 86400000))
      };
      
      const presentation = new Presentation(presentationData);
      await presentation.save();
    }
    
    console.log(`   ✅ Created ${testPresentations.length} presentations for tenant: ${tenant.name}`);
  }
}

/**
 * Create groups
 */
async function createGroups(tenants, users) {
  for (const tenant of tenants) {
    const tenantUsers = users.filter(user => user.tenantId.toString() === tenant._id.toString());
    
    for (let i = 0; i < testGroups.length; i++) {
      const groupData = {
        ...testGroups[i],
        tenantId: tenant._id,
        members: tenantUsers.slice(0, Math.floor(Math.random() * 3) + 2).map(user => user._id),
        createdBy: tenantUsers[0]._id,
        createdAt: new Date(Date.now() - (i * 86400000))
      };
      
      const group = new Group(groupData);
      await group.save();
    }
    
    console.log(`   ✅ Created ${testGroups.length} groups for tenant: ${tenant.name}`);
  }
}

/**
 * Create polls
 */
async function createPolls(tenants, users) {
  for (const tenant of tenants) {
    const tenantUsers = users.filter(user => user.tenantId.toString() === tenant._id.toString());
    
    for (let i = 0; i < testPolls.length; i++) {
      const pollData = {
        ...testPolls[i],
        tenantId: tenant._id,
        createdBy: tenantUsers[0]._id,
        responses: [],
        createdAt: new Date(Date.now() - (i * 86400000))
      };
      
      const poll = new Poll(pollData);
      await poll.save();
    }
    
    console.log(`   ✅ Created ${testPolls.length} polls for tenant: ${tenant.name}`);
  }
}

/**
 * Create notifications
 */
async function createNotifications(tenants, users) {
  for (const tenant of tenants) {
    const tenantUsers = users.filter(user => user.tenantId.toString() === tenant._id.toString());
    
    for (let i = 0; i < testNotifications.length; i++) {
      const notificationData = {
        ...testNotifications[i],
        tenantId: tenant._id,
        userId: tenantUsers[i % tenantUsers.length]._id,
        createdAt: new Date(Date.now() - (i * 3600000))
      };
      
      const notification = new Notification(notificationData);
      await notification.save();
    }
    
    console.log(`   ✅ Created ${testNotifications.length} notifications for tenant: ${tenant.name}`);
  }
}

/**
 * Create audit logs
 */
async function createAuditLogs(tenants, users) {
  for (const tenant of tenants) {
    const tenantUsers = users.filter(user => user.tenantId.toString() === tenant._id.toString());
    
    for (let i = 0; i < testAuditLogs.length; i++) {
      const auditLogData = {
        ...testAuditLogs[i],
        tenantId: tenant._id,
        userId: tenantUsers[i % tenantUsers.length]._id,
        timestamp: new Date(Date.now() - (i * 3600000))
      };
      
      const auditLog = new AuditLog(auditLogData);
      await auditLog.save();
    }
    
    console.log(`   ✅ Created ${testAuditLogs.length} audit logs for tenant: ${tenant.name}`);
  }
}

/**
 * Create sessions
 */
async function createSessions(users) {
  for (let i = 0; i < testSessions.length; i++) {
    const sessionData = {
      ...testSessions[i],
      userId: users[i % users.length]._id,
      createdAt: new Date(Date.now() - (i * 3600000))
    };
    
    const session = new Session(sessionData);
    await session.save();
  }
  
  console.log(`   ✅ Created ${testSessions.length} sessions`);
}

/**
 * Create tenant schemas
 */
async function createTenantSchemas(tenants) {
  for (const tenant of tenants) {
    for (let i = 0; i < testTenantSchemas.length; i++) {
      const schemaData = {
        ...testTenantSchemas[i],
        tenantId: tenant._id,
        createdAt: new Date(Date.now() - (i * 86400000))
      };
      
      const schema = new TenantSchema(schemaData);
      await schema.save();
    }
    
    console.log(`   ✅ Created ${testTenantSchemas.length} tenant schemas for tenant: ${tenant.name}`);
  }
}

// Run the seeding script
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Database seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
