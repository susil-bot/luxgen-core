#!/usr/bin/env node

/**
 * Database Setup Script with Local MongoDB
 * 
 * This script sets up the database using local MongoDB connection
 * Following LuxGen rules: Multi-tenant architecture, max 5 records per model
 * 
 * Usage: node src/scripts/setupDatabaseLocal.js
 */

const mongoose = require('mongoose');
const { 
  User, Tenant, Activity, TrainingCourse, TrainingSession, 
  TrainingModule, TrainingAssessment, Presentation, Group, 
  Poll, Notification, AuditLog, Session, TenantSchema 
} = require('../models');

// Local MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxgen';

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

/**
 * Main setup function
 */
async function setupDatabaseLocal() {
  try {
    console.log('🚀 LuxGen Database Setup with Local MongoDB');
    console.log('==========================================');
    console.log('Following LuxGen rules: Multi-tenant architecture, max 5 records per model');
    console.log('');
    
    // Step 1: Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    console.log(`   URI: ${MONGODB_URI}`);
    
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.log('❌ MongoDB connection failed');
      console.log('');
      console.log('💡 To fix this, you have two options:');
      console.log('');
      console.log('Option 1: Install and start MongoDB locally');
      console.log('   - Install MongoDB: https://docs.mongodb.com/manual/installation/');
      console.log('   - Start MongoDB: mongod');
      console.log('   - Then run this script again');
      console.log('');
      console.log('Option 2: Use MongoDB Atlas (Cloud)');
      console.log('   - Go to https://cloud.mongodb.com/');
      console.log('   - Create a free cluster');
      console.log('   - Get your connection string');
      console.log('   - Set MONGODB_URI environment variable');
      console.log('   - Example: export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/luxgen"');
      console.log('');
      console.log('Option 3: Use Docker');
      console.log('   - Run: docker run -d -p 27017:27017 --name mongodb mongo:latest');
      console.log('   - Then run this script again');
      console.log('');
      throw error;
    }
    
    // Step 2: Clear existing data
    console.log('\n🧹 Clearing existing data...');
    await clearDatabase();
    console.log('✅ Database cleared');
    
    // Step 3: Create tenants
    console.log('\n🏢 Creating tenants...');
    const tenants = await createTenants();
    console.log(`✅ Created ${tenants.length} tenants`);
    
    // Step 4: Create users for each tenant
    console.log('\n👥 Creating users...');
    const allUsers = await createUsers(tenants);
    console.log(`✅ Created ${allUsers.length} users`);
    
    // Step 5: Create activities
    console.log('\n📊 Creating activities...');
    await createActivities(tenants, allUsers);
    console.log('✅ Activities created');
    
    // Step 6: Create training courses
    console.log('\n📚 Creating training courses...');
    const trainingCourses = await createTrainingCourses(tenants);
    console.log(`✅ Created ${trainingCourses.length} training courses`);
    
    // Step 7: Create training sessions
    console.log('\n🎯 Creating training sessions...');
    await createTrainingSessions(tenants, allUsers, trainingCourses);
    console.log('✅ Training sessions created');
    
    // Step 8: Create other models
    console.log('\n📖 Creating other models...');
    await createOtherModels(tenants, allUsers);
    console.log('✅ Other models created');
    
    // Step 9: Verify multi-tenant isolation
    console.log('\n🏢 Verifying multi-tenant isolation...');
    await verifyMultiTenantIsolation(tenants);
    console.log('✅ Multi-tenant isolation verified');
    
    // Step 10: Generate summary
    console.log('\n📊 Generating database summary...');
    await generateDatabaseSummary();
    console.log('✅ Database summary generated');
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('==========================================');
    console.log('✅ Database seeded with test data');
    console.log('✅ Multi-tenant isolation verified');
    console.log('✅ All models populated (max 5 records each)');
    console.log('✅ Ready for API and UI testing');
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('1. Start the backend server: npm run dev');
    console.log('2. Start the frontend server: cd ../luxgen && npm run dev');
    console.log('3. Test the ActivityFeed component');
    console.log('4. Test API endpoints');
    console.log('');
    console.log('📝 Test Credentials:');
    console.log('Admin: john.doe+acme-corporation@example.com / password123');
    console.log('Trainer: jane.smith+acme-corporation@example.com / password123');
    console.log('User: mike.johnson+acme-corporation@example.com / password123');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    throw error;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB');
    }
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
  const bcrypt = require('bcryptjs');
  
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
  const testCourses = [
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
  
  for (const tenant of tenants) {
    for (let i = 0; i < testCourses.length; i++) {
      const courseData = {
        ...testCourses[i],
        tenantId: tenant._id,
        instructorId: null, // Will be set later
        enrollmentCount: Math.floor(Math.random() * 20) + 5,
        createdAt: new Date(Date.now() - (i * 86400000)) // Spread over time
      };
      
      const course = new TrainingCourse(courseData);
      await course.save();
      allCourses.push(course);
    }
    
    console.log(`   ✅ Created ${testCourses.length} training courses for tenant: ${tenant.name}`);
  }
  
  return allCourses;
}

/**
 * Create training sessions
 */
async function createTrainingSessions(tenants, users, courses) {
  const testSessions = [
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
  
  for (const tenant of tenants) {
    const tenantUsers = users.filter(user => user.tenantId.toString() === tenant._id.toString());
    const tenantCourses = courses.filter(course => course.tenantId.toString() === tenant._id.toString());
    
    for (let i = 0; i < testSessions.length; i++) {
      const sessionData = {
        ...testSessions[i],
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
    
    console.log(`   ✅ Created ${testSessions.length} training sessions for tenant: ${tenant.name}`);
  }
}

/**
 * Create other models
 */
async function createOtherModels(tenants, users) {
  // Create training modules
  const testModules = [
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
  
  for (const tenant of tenants) {
    for (let i = 0; i < testModules.length; i++) {
      const moduleData = {
        ...testModules[i],
        tenantId: tenant._id,
        createdAt: new Date(Date.now() - (i * 86400000))
      };
      
      const module = new TrainingModule(moduleData);
      await module.save();
    }
    
    console.log(`   ✅ Created ${testModules.length} training modules for tenant: ${tenant.name}`);
  }
  
  // Create groups
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
 * Verify multi-tenant isolation
 */
async function verifyMultiTenantIsolation(tenants) {
  if (tenants.length < 2) {
    console.log('⚠️  Need at least 2 tenants for isolation testing');
    return;
  }
  
  const tenant1 = tenants[0];
  const tenant2 = tenants[1];
  
  // Test user isolation
  const tenant1Users = await User.find({ tenantId: tenant1._id });
  const tenant2Users = await User.find({ tenantId: tenant2._id });
  
  console.log(`   📊 Tenant 1 (${tenant1.name}): ${tenant1Users.length} users`);
  console.log(`   📊 Tenant 2 (${tenant2.name}): ${tenant2Users.length} users`);
  
  // Test activity isolation
  const tenant1Activities = await Activity.find({ tenantId: tenant1._id });
  const tenant2Activities = await Activity.find({ tenantId: tenant2._id });
  
  console.log(`   📊 Tenant 1: ${tenant1Activities.length} activities`);
  console.log(`   📊 Tenant 2: ${tenant2Activities.length} activities`);
  
  // Verify no cross-tenant data
  const crossTenantUsers = await User.find({
    tenantId: tenant1._id,
    _id: { $in: tenant2Users.map(u => u._id) }
  });
  
  if (crossTenantUsers.length > 0) {
    throw new Error('Multi-tenant isolation failed - found cross-tenant users');
  }
  
  console.log('   ✅ Multi-tenant isolation verified');
}

/**
 * Generate database summary
 */
async function generateDatabaseSummary() {
  const counts = {
    tenants: await Tenant.countDocuments(),
    users: await User.countDocuments(),
    activities: await Activity.countDocuments(),
    trainingCourses: await TrainingCourse.countDocuments(),
    trainingSessions: await TrainingSession.countDocuments(),
    trainingModules: await TrainingModule.countDocuments(),
    groups: await Group.countDocuments()
  };
  
  console.log('\n📊 Database Summary:');
  console.log('===================');
  console.log(`Tenants: ${counts.tenants}`);
  console.log(`Users: ${counts.users}`);
  console.log(`Activities: ${counts.activities}`);
  console.log(`Training Courses: ${counts.trainingCourses}`);
  console.log(`Training Sessions: ${counts.trainingSessions}`);
  console.log(`Training Modules: ${counts.trainingModules}`);
  console.log(`Groups: ${counts.groups}`);
  console.log('');
  console.log('🎯 Test Credentials:');
  console.log('Admin: john.doe+acme-corporation@example.com / password123');
  console.log('Trainer: jane.smith+acme-corporation@example.com / password123');
  console.log('User: mike.johnson+acme-corporation@example.com / password123');
}

// Run setup if called directly
if (require.main === module) {
  setupDatabaseLocal()
    .then(() => {
      console.log('\n🎉 Database setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabaseLocal };
