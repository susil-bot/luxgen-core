const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');


// Import models
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Poll = require('../models/Poll');
const Session = require('../models/Session');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');


// Import database manager
const _databaseManager = require('../config/database');

class DatabaseSetup {
  constructor () {
    this.connection = null;
  }
  async initialize () {
    try {
      console.log('🚀 Initializing comprehensive database setup...');

      
// Connect to MongoDB
      await this.connectToDatabase();

      
// Create indexes
      await this.createIndexes();

      
// Create seed data
      await this.createSeedData();

      
// Create system tenant and super admin
      await this.createSystemTenant();

      console.log('✅ Database setup completed successfully!');
    } catch (error) {
      console.error('❌ Database setup failed:', error);
      throw error;
    } }
  async connectToDatabase () {
    try {
      
// Check if already connected
      if (mongoose.connection.readyState === 1) {
        console.log('ℹ️ MongoDB already connected, skipping connection');
        return;
      }
      console.log('🔌 Connecting to MongoDB...');

      const mongoUri = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/luxgen_trainer_platform';
      console.log(`🔗 MongoDB URI: ${mongoUri}`);

      this.connection = await mongoose.connect(mongoUri, {
        dbName: 'luxgen_trainer_platform',
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false
      });

      console.log('✅ MongoDB connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      throw error;
    } }
  async createIndexes () {
    
    // TODO: Add await statements
    try {
      console.log('📊 Creating database indexes...');

      
// Skip index creation for now to avoid conflicts
      console.log('⏭️ Skipping index creation to avoid conflicts');
      console.log('ℹ️ Indexes will be created automatically by Mongoose schemas');

      console.log('✅ Database indexes setup completed');
    } catch (error) {
      console.error('❌ Failed to create indexes:', error.message);
      throw error;
    } }
  async createSystemTenant () {
    try {
      console.log('🏢 Creating system tenant...');

      
// Check if system tenant already exists
      let systemTenant = await Tenant.findOne({ slug: 'system' });

      if (!systemTenant) {
        systemTenant = new Tenant({
          name: 'System',
          slug: 'system',
          domain: 'system',
          description: 'System-level tenant for platform administration',
          isActive: true,
          subscription: {
            plan: 'enterprise',
            status: 'active'
          },
          limits: {
            maxUsers: 1000,
            maxStorageGB: 100,
            maxPolls: 10000,
            maxApiCalls: 100000
          },
          features: {
            polls: true,
            analytics: true,
            api: true,
            sso: true,
            advancedReporting: true,
            customBranding: true,
            whiteLabel: true
          },
          settings: {
            timezone: 'UTC',
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '24h',
            language: 'en',
            defaultUserRole: 'super_admin',
            requireEmailVerification: false,
            allowUserRegistration: false,
            sessionTimeout: 24
          } });

        await systemTenant.save();
        console.log('✅ System tenant created successfully');
      } else {
        console.log('ℹ️ System tenant already exists');
      }
      return systemTenant;
    } catch (error) {
      console.error('❌ Failed to create system tenant:', error.message);
      throw error;
    } }
  async createSuperAdmin (systemTenant) {
    try {
      console.log('👑 Creating super admin user...');

      
// Check if super admin already exists
      let superAdmin = await User.findOne({
        email: 'superadmin@trainer.com',
        tenantId: systemTenant._id
      });

      if (!superAdmin) {
        
// Hash password
        const hashedPassword = await bcrypt.hash('SuperAdmin123!', 12);

        superAdmin = new User({
          tenantId: systemTenant._id,
          email: 'superadmin@trainer.com',
          password: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          role: 'super_admin',
          isActive: true,
          isEmailVerified: true,
          phone: '+1234567890',
          company: 'Trainer Platform',
          jobTitle: 'System Administrator',
          department: 'IT',
          address: {
            street: '123 Admin Street',
            city: 'Admin City',
            state: 'AS',
            country: 'US',
            postalCode: '12345'
          },
          preferences: {
            theme: 'dark',
            language: 'en',
            timezone: 'UTC'
          },
          notificationPreferences: {
            email: true,
            push: true,
            sms: false
          } });

        await superAdmin.save();
        console.log('✅ Super admin user created successfully');
      } else {
        console.log('ℹ️ Super admin user already exists');
      }
      return superAdmin;
    } catch (error) {
      console.error('❌ Failed to create super admin:', error.message);
      throw error;
    } }
  async createDemoTenant () {
    try {
      console.log('🎭 Creating demo tenant...');

      
// Check if demo tenant already exists
      let demoTenant = await Tenant.findOne({ slug: 'demo-tenant' });

      if (!demoTenant) {
        demoTenant = new Tenant({
          name: 'Demo Corporation',
          slug: 'demo-tenant',
          domain: 'demo.trainer.com',
          description: 'Demo tenant for showcasing platform features',
          contact: {
            email: 'demo@demo-corp.com',
            phone: '+1987654321',
            website: 'https://demo-corp.com'
          },
          address: {
            street: '456 Demo Avenue',
            city: 'Demo City',
            state: 'DC',
            country: 'US',
            postalCode: '54321'
          },
          business: {
            industry: 'Technology',
            companySize: '51-200',
            foundedYear: 2020
          },
          isActive: true,
          subscription: {
            plan: 'professional',
            status: 'active',
            trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
// 30 days trial
          },
          limits: {
            maxUsers: 50,
            maxStorageGB: 10,
            maxPolls: 500,
            maxApiCalls: 10000
          },
          features: {
            polls: true,
            analytics: true,
            api: true,
            sso: false,
            advancedReporting: true,
            customBranding: true,
            whiteLabel: false
          },
          branding: {
            primaryColor: '#3B82F6',
            secondaryColor: '#1E40AF',
            accentColor: '#10B981',
            logo: '/uploads/(demo-tenant/logo).png'
          },
          settings: {
            timezone: 'America/New_York',
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '12h',
            language: 'en',
            defaultUserRole: 'user',
            requireEmailVerification: true,
            allowUserRegistration: true,
            sessionTimeout: 8
          } });

        await demoTenant.save();
        console.log('✅ Demo tenant created successfully');
      } else {
        console.log('ℹ️ Demo tenant already exists');
      }
      return demoTenant;
    } catch (error) {
      console.error('❌ Failed to create demo tenant:', error.message);
      throw error;
    } }
  async createDemoUsers (demoTenant) {
    
    // TODO: Add await statements
    try {
      console.log('👥 Creating demo users...');

      const demoUsers = [
        {
          email: 'admin@demo-corp.com',
          password: 'Admin123!',
          firstName: 'Demo',
          lastName: 'Admin',
          role: 'admin',
          phone: '+1555123456',
          jobTitle: 'Administrator',
          department: 'Management'
        },
        {
          email: 'trainer@demo-corp.com',
          password: 'Trainer123!',
          firstName: 'Demo',
          lastName: 'Trainer',
          role: 'trainer',
          phone: '+1555123457',
          jobTitle: 'Senior Trainer',
          department: 'Training'
        },
        {
          email: 'user@demo-corp.com',
          password: 'User123!',
          firstName: 'Demo',
          lastName: 'User',
          role: 'user',
          phone: '+1555123458',
          jobTitle: 'Employee',
          department: 'Operations'
        } ];

      for (const userData of demoUsers) {
        const existingUser = await User.findOne({
          email: userData.email,
          tenantId: demoTenant._id
        });

        if (!existingUser) {
          const hashedPassword = await bcrypt.hash(userData.password, 12);

          const user = new User({
            tenantId: demoTenant._id,
            email: userData.email,
            password: hashedPassword,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            isActive: true,
            isEmailVerified: true,
            phone: userData.phone,
            company: 'Demo Corporation',
            jobTitle: userData.jobTitle,
            department: userData.department,
            preferences: {
              theme: 'light',
              language: 'en',
              timezone: 'America/New_York'
            } });

          await user.save();
          console.log(`✅ Created demo user: ${userData.email}`);
        } else {
          console.log(`ℹ️ Demo user already exists: ${userData.email}`);
        } }
    } catch (error) {
      console.error('❌ Failed to create demo users:', error.message);
      throw error;
    } }
  async createDemoPolls (demoTenant) {
    
    // TODO: Add await statements
    try {
      console.log('📊 Creating demo polls...');

      const demoPolls = [
        {
          title: 'Employee Satisfaction Survey',
          description: 'Help us understand how we can improve your work experience',
          question: 'How satisfied are you with your current work environment?',
          pollType: 'rating',
          options: [
            {
              id: '1', text: 'Very Dissatisfied', value: 1
            },
            {
              id: '2', text: 'Dissatisfied', value: 2
            },
            {
              id: '3', text: 'Neutral', value: 3
            },
            {
              id: '4', text: 'Satisfied', value: 4
            },
            {
              id: '5', text: 'Very Satisfied', value: 5
            } ],
          status: 'active',
          isAnonymous: true,
          settings: {
            showResults: true,
            showResultsAfterVote: true,
            allowComments: true
          },
          tags: ['employee', 'satisfaction', 'workplace'],
          category: 'HR'
        },
        {
          title: 'Training Program Feedback',
          description: 'Share your thoughts on our recent training programs',
          question: 'Which training program would you like to see next?',
          pollType: 'multiple_choice',
          options: [
            {
              id: '1', text: 'Leadership Development', value: 'leadership'
            },
            {
              id: '2', text: 'Technical Skills', value: 'technical'
            },
            {
              id: '3', text: 'Communication Skills', value: 'communication'
            },
            {
              id: '4', text: 'Project Management', value: 'project_management'
            },
            {
              id: '5', text: 'Customer Service', value: 'customer_service'
            } ],
          status: 'active',
          allowMultipleResponses: true,
          settings: {
            showResults: true,
            showResultsAfterVote: true,
            maxSelections: 3
          },
          tags: ['training', 'development', 'skills'],
          category: 'Training'
        },
        {
          title: 'Office Environment Preferences',
          description: 'Help us design the perfect office environment',
          question: 'What would improve your productivity at work?',
          pollType: 'multiple_choice',
          options: [
            {
              id: '1', text: 'Quiet zones', value: 'quiet_zones'
            },
            {
              id: '2', text: 'Collaborative spaces', value: 'collaborative_spaces'
            },
            {
              id: '3', text: 'Natural lighting', value: 'natural_lighting'
            },
            {
              id: '4', text: 'Ergonomic furniture', value: 'ergonomic_furniture'
            },
            {
              id: '5', text: 'Breakout areas', value: 'breakout_areas'
            },
            {
              id: '6', text: 'Technology upgrades', value: 'technology_upgrades'
            } ],
          status: 'draft',
          settings: {
            showResults: true,
            showResultsAfterVote: true,
            allowComments: true
          },
          tags: ['office', 'environment', 'productivity'],
          category: 'Facilities'
        } ];

      for (const pollData of demoPolls) {
        const existingPoll = await Poll.findOne({
          title: pollData.title,
          tenantId: demoTenant._id
        });

        if (!existingPoll) {
          
// Get a demo user as creator
          const demoUser = await User.findOne({
            tenantId: demoTenant._id,
            role: 'admin'
          });

          const poll = new Poll({
            tenantId: demoTenant._id,
            createdBy: demoUser._id,
            ...pollData
          });

          await poll.save();
          console.log(`✅ Created demo poll: ${pollData.title}`);
        } else {
          console.log(`ℹ️ Demo poll already exists: ${pollData.title}`);
        } }
    } catch (error) {
      console.error('❌ Failed to create demo polls:', error.message);
      throw error;
    } }
  async createSeedData () {
    try {
      console.log('🌱 Creating seed data...');

      
// Create system tenant and super admin
      const systemTenant = await this.createSystemTenant();
      const superAdmin = await this.createSuperAdmin(systemTenant);

      
// Create demo tenant and users
      const demoTenant = await this.createDemoTenant();
      await this.createDemoUsers(demoTenant);
      await this.createDemoPolls(demoTenant);

      console.log('✅ Seed data created successfully');
    } catch (error) {
      console.error('❌ Failed to create seed data:', error.message);
      throw error;
    } }
  async cleanup () {
    try {
      if (this.connection) {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
      } } catch (error) {
      console.error('❌ Error closing database connection:', error.message);
    } }
}
// Run setup if called directly
if (require.main === module) {
  const setup = new DatabaseSetup();

  setup.initialize()
    .then(() => {
      console.log('🎉 Database setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database setup failed:', error);
      process.exit(1);
    })
    .finally(() => {
      setup.cleanup();
    });
}
module.exports = DatabaseSetup;
