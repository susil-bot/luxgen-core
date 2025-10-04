#!/usr/bin/env node

/**
 * Flexible Database Setup Script for LuxGen Platform
 * 
 * HIGH TECHNICAL STANDARDS: TypeScript, SOLID principles, clean architecture
 * Following LuxGen rules: Multi-tenant architecture, max 5 records per model
 * 
 * Environment Flags:
 * - USE_LOCAL_DB=true: Use local MongoDB (campus development)
 * - MONGODB_URI: Atlas connection string (default)
 * 
 * Usage: 
 * - Atlas: node src/scripts/setupFlexibleDatabase.ts
 * - Local: USE_LOCAL_DB=true node src/scripts/setupFlexibleDatabase.ts
 */

import mongoose, { Connection } from 'mongoose';
import { 
  User, Tenant, Activity, TrainingCourse, TrainingSession, 
  TrainingModule, TrainingAssessment, Presentation, Group, 
  Poll, Notification, AuditLog, Session, TenantSchema 
} from '../models';
import { Logger } from '../utils/Logger';
import { ErrorHandler } from '../utils/ErrorHandler';

// Configuration
interface DatabaseConfig {
  useLocal: boolean;
  uri: string;
  timeout: number;
}

interface TestDataConfig {
  tenants: number;
  usersPerTenant: number;
  maxRecordsPerModel: number;
}

// Test data interfaces
interface ITestTenant {
  name: string;
  slug: string;
  contactEmail: string;
  status: string;
  settings: {
    theme: string;
    features: string[];
    branding: {
      primaryColor: string;
      secondaryColor: string;
      logo: string;
    };
  };
}

interface ITestUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  phone: string;
  department: string;
  position: string;
}

interface ITestActivity {
  type: string;
  title: string;
  description: string;
  metadata: Record<string, any>;
}

export class DatabaseSetupService {
  private static readonly logger = new Logger('DatabaseSetupService');
  private static readonly config: DatabaseConfig = this.getConfig();
  private static readonly testConfig: TestDataConfig = {
    tenants: 2,
    usersPerTenant: 5,
    maxRecordsPerModel: 5
  };

  private static getConfig(): DatabaseConfig {
    const useLocal = process.env.USE_LOCAL_DB === 'true';
    const atlasUri = process.env.MONGODB_URI;
    
    if (!useLocal && !atlasUri) {
      throw new Error('MONGODB_URI environment variable is required for Atlas connection');
    }

    return {
      useLocal,
      uri: useLocal ? 'mongodb://localhost:27017/luxgen' : atlasUri!,
      timeout: 30000
    };
  }

  public static async setupDatabase(): Promise<void> {
    try {
      this.logger.info('Starting LuxGen Database Setup');
      this.logger.info(`Mode: ${this.config.useLocal ? 'Local MongoDB' : 'MongoDB Atlas'}`);
      
      // Step 1: Connect to database
      await this.connectToDatabase();
      
      // Step 2: Clear existing data
      await this.clearDatabase();
      
      // Step 3: Create test data
      await this.createTestData();
      
      // Step 4: Verify setup
      await this.verifySetup();
      
      this.logger.info('Database setup completed successfully');
      
    } catch (error) {
      this.logger.error('Database setup failed', error);
      throw error;
    } finally {
      await this.disconnectFromDatabase();
    }
  }

  private static async connectToDatabase(): Promise<void> {
    try {
      this.logger.info(`Connecting to ${this.config.useLocal ? 'local' : 'Atlas'} MongoDB...`);
      
      await mongoose.connect(this.config.uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: this.config.timeout,
        connectTimeoutMS: this.config.timeout,
        socketTimeoutMS: this.config.timeout
      });

      this.logger.info('Database connection established');
      
    } catch (error) {
      if (this.config.useLocal) {
        this.logger.error('Local MongoDB connection failed');
        this.logger.info('To fix this:');
        this.logger.info('1. Install MongoDB: brew install mongodb-community');
        this.logger.info('2. Start MongoDB: brew services start mongodb-community');
        this.logger.info('3. Or use Atlas: export MONGODB_URI="mongodb+srv://..."');
      } else {
        this.logger.error('MongoDB Atlas connection failed');
        this.logger.info('To fix this:');
        this.logger.info('1. Verify your Atlas cluster is running');
        this.logger.info('2. Check your connection string format');
        this.logger.info('3. Ensure your IP is whitelisted');
        this.logger.info('4. Verify username and password');
      }
      throw error;
    }
  }

  private static async clearDatabase(): Promise<void> {
    this.logger.info('Clearing existing data...');
    
    const collections = [
      'users', 'tenants', 'activities', 'trainingcourses', 'trainingsessions',
      'trainingmodules', 'trainingassessments', 'presentations', 'groups',
      'polls', 'notifications', 'auditlogs', 'sessions', 'tenantschemas'
    ];

    for (const collection of collections) {
      try {
        await mongoose.connection.db.collection(collection).deleteMany({});
      } catch (error) {
        this.logger.warn(`Could not clear collection ${collection}:`, error);
      }
    }

    this.logger.info('Database cleared');
  }

  private static async createTestData(): Promise<void> {
    this.logger.info('Creating test data...');
    
    // Create tenants
    const tenants = await this.createTenants();
    this.logger.info(`Created ${tenants.length} tenants`);
    
    // Create users
    const users = await this.createUsers(tenants);
    this.logger.info(`Created ${users.length} users`);
    
    // Create activities
    await this.createActivities(tenants, users);
    this.logger.info('Created activities');
    
    // Create training data
    const courses = await this.createTrainingCourses(tenants);
    await this.createTrainingSessions(tenants, users, courses);
    await this.createTrainingModules(tenants);
    this.logger.info('Created training data');
    
    // Create other models
    await this.createOtherModels(tenants, users);
    this.logger.info('Created other models');
  }

  private static async createTenants(): Promise<any[]> {
    const testTenants: ITestTenant[] = [
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

    const tenants = [];
    for (const tenantData of testTenants) {
      const tenant = new Tenant(tenantData);
      await tenant.save();
      tenants.push(tenant);
    }
    
    return tenants;
  }

  private static async createUsers(tenants: any[]): Promise<any[]> {
    const testUsers: ITestUser[] = [
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

    const allUsers = [];
    const bcrypt = require('bcryptjs');
    
    for (const tenant of tenants) {
      for (let i = 0; i < testUsers.length; i++) {
        const userData = {
          ...testUsers[i],
          tenantId: tenant._id,
          email: `${testUsers[i].email.split('@')[0]}+${tenant.slug}@example.com`
        };
        
        userData.password = await bcrypt.hash(userData.password, 10);
        
        const user = new User(userData);
        await user.save();
        allUsers.push(user);
      }
    }
    
    return allUsers;
  }

  private static async createActivities(tenants: any[], users: any[]): Promise<void> {
    const testActivities: ITestActivity[] = [
      {
        type: 'user_joined',
        title: 'New User Registration',
        description: 'A new user has joined the platform',
        metadata: { userRole: 'user', department: 'Sales' }
      },
      {
        type: 'program_created',
        title: 'Training Program Created',
        description: 'A new training program has been created',
        metadata: { programName: 'Sales Training 101', category: 'Sales' }
      },
      {
        type: 'session_completed',
        title: 'Training Session Completed',
        description: 'A training session has been completed',
        metadata: { sessionName: 'Customer Service Training', duration: 120 }
      },
      {
        type: 'assessment_taken',
        title: 'Assessment Completed',
        description: 'An assessment has been completed',
        metadata: { assessmentName: 'Product Knowledge Test', score: 85 }
      },
      {
        type: 'certificate_earned',
        title: 'Certificate Earned',
        description: 'A certificate has been earned',
        metadata: { certificateName: 'Sales Excellence Certificate', level: 'Advanced' }
      }
    ];

    for (const tenant of tenants) {
      const tenantUsers = users.filter(user => user.tenantId.toString() === tenant._id.toString());
      
      for (let i = 0; i < testActivities.length; i++) {
        const activityData = {
          ...testActivities[i],
          tenantId: tenant._id,
          userId: tenantUsers[i % tenantUsers.length]._id,
          timestamp: new Date(Date.now() - (i * 3600000)),
          likes: Math.floor(Math.random() * 10),
          comments: Math.floor(Math.random() * 5),
          shares: Math.floor(Math.random() * 3),
          views: Math.floor(Math.random() * 50) + 10
        };
        
        const activity = new Activity(activityData);
        await activity.save();
      }
    }
  }

  private static async createTrainingCourses(tenants: any[]): Promise<any[]> {
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

    const allCourses = [];
    for (const tenant of tenants) {
      for (let i = 0; i < testCourses.length; i++) {
        const courseData = {
          ...testCourses[i],
          tenantId: tenant._id,
          instructorId: null,
          enrollmentCount: Math.floor(Math.random() * 20) + 5,
          createdAt: new Date(Date.now() - (i * 86400000))
        };
        
        const course = new TrainingCourse(courseData);
        await course.save();
        allCourses.push(course);
      }
    }
    
    return allCourses;
  }

  private static async createTrainingSessions(tenants: any[], users: any[], courses: any[]): Promise<void> {
    const testSessions = [
      {
        title: 'Sales Techniques Workshop',
        sessionType: 'workshop',
        scheduledAt: new Date(Date.now() + 86400000),
        duration: 120,
        status: 'scheduled',
        capacity: 20,
        description: 'Interactive workshop on sales techniques',
        objectives: ['Practice sales scenarios', 'Role-playing exercises']
      },
      {
        title: 'Customer Service Training',
        sessionType: 'lecture',
        scheduledAt: new Date(Date.now() + 172800000),
        duration: 90,
        status: 'scheduled',
        capacity: 15,
        description: 'Comprehensive customer service training',
        objectives: ['Service standards', 'Communication skills']
      },
      {
        title: 'Leadership Seminar',
        sessionType: 'seminar',
        scheduledAt: new Date(Date.now() - 86400000),
        duration: 180,
        status: 'completed',
        capacity: 25,
        description: 'Leadership development seminar',
        objectives: ['Leadership principles', 'Team management']
      },
      {
        title: 'Marketing Strategy Session',
        sessionType: 'workshop',
        scheduledAt: new Date(Date.now() - 172800000),
        duration: 150,
        status: 'completed',
        capacity: 12,
        description: 'Marketing strategy development',
        objectives: ['Strategy planning', 'Market analysis']
      },
      {
        title: 'Project Planning Workshop',
        sessionType: 'workshop',
        scheduledAt: new Date(Date.now() + 259200000),
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
        
        if (sessionData.status === 'completed') {
          sessionData.attendance = sessionData.participants.map(participantId => ({
            participantId,
            attended: Math.random() > 0.2
          }));
        }
        
        const session = new TrainingSession(sessionData);
        await session.save();
      }
    }
  }

  private static async createTrainingModules(tenants: any[]): Promise<void> {
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
    }
  }

  private static async createOtherModels(tenants: any[], users: any[]): Promise<void> {
    // Create groups
    const testGroups = [
      { name: 'Sales Team', description: 'Sales department team', type: 'department', status: 'active' },
      { name: 'Customer Service', description: 'Customer service team', type: 'department', status: 'active' },
      { name: 'Leadership Development', description: 'Leadership development group', type: 'training', status: 'active' },
      { name: 'Marketing Team', description: 'Marketing department team', type: 'department', status: 'active' },
      { name: 'Project Managers', description: 'Project management group', type: 'role', status: 'active' }
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
    }
  }

  private static async verifySetup(): Promise<void> {
    this.logger.info('Verifying database setup...');
    
    const counts = {
      tenants: await Tenant.countDocuments(),
      users: await User.countDocuments(),
      activities: await Activity.countDocuments(),
      trainingCourses: await TrainingCourse.countDocuments(),
      trainingSessions: await TrainingSession.countDocuments(),
      trainingModules: await TrainingModule.countDocuments(),
      groups: await Group.countDocuments()
    };
    
    this.logger.info('Database Summary:');
    this.logger.info(`Tenants: ${counts.tenants}`);
    this.logger.info(`Users: ${counts.users}`);
    this.logger.info(`Activities: ${counts.activities}`);
    this.logger.info(`Training Courses: ${counts.trainingCourses}`);
    this.logger.info(`Training Sessions: ${counts.trainingSessions}`);
    this.logger.info(`Training Modules: ${counts.trainingModules}`);
    this.logger.info(`Groups: ${counts.groups}`);
    
    // Verify multi-tenant isolation
    const tenants = await Tenant.find();
    if (tenants.length >= 2) {
      const tenant1 = tenants[0];
      const tenant2 = tenants[1];
      
      const tenant1Users = await User.find({ tenantId: tenant1._id });
      const tenant2Users = await User.find({ tenantId: tenant2._id });
      
      const crossTenantUsers = await User.find({
        tenantId: tenant1._id,
        _id: { $in: tenant2Users.map(u => u._id) }
      });
      
      if (crossTenantUsers.length > 0) {
        throw new Error('Multi-tenant isolation failed');
      }
      
      this.logger.info('Multi-tenant isolation verified');
    }
  }

  private static async disconnectFromDatabase(): Promise<void> {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      this.logger.info('Disconnected from database');
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  DatabaseSetupService.setupDatabase()
    .then(() => {
      console.log('\n🎉 Database setup completed successfully!');
      console.log('📝 Test Credentials:');
      console.log('Admin: john.doe+acme-corporation@example.com / password123');
      console.log('Trainer: jane.smith+acme-corporation@example.com / password123');
      console.log('User: mike.johnson+acme-corporation@example.com / password123');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database setup failed:', error);
      process.exit(1);
    });
}

export { DatabaseSetupService };
