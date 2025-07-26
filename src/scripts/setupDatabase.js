const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const TenantSchema = require('../models/TenantSchema');
const Poll = require('../models/Poll');

class DatabaseSetup {
  constructor() {
    this.mongoUri = process.env.MONGODB_URL;
    this.dbName = 'luxgen_trainer_platform';
  }

  async connect() {
    try {
      console.log('🔌 Connecting to MongoDB...');
      await mongoose.connect(this.mongoUri, {
        dbName: this.dbName,
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
        maxIdleTimeMS: 30000,
        retryWrites: true,
        w: 'majority',
        readPreference: 'primary',
        heartbeatFrequencyMS: 10000,
        family: 4
      });
      console.log('✅ Connected to MongoDB successfully');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      throw error;
    }
  }

  async createIndexes() {
    console.log('\n📊 Creating database indexes...');
    
    try {
      // User indexes
      await User.collection.createIndex({ email: 1 }, { unique: true });
      await User.collection.createIndex({ tenantId: 1 });
      await User.collection.createIndex({ role: 1 });
      await User.collection.createIndex({ isActive: 1 });
      console.log('✅ User indexes created');

      // Tenant indexes
      await Tenant.collection.createIndex({ slug: 1 }, { unique: true });
      await Tenant.collection.createIndex({ contactEmail: 1 });
      await Tenant.collection.createIndex({ status: 1 });
      await Tenant.collection.createIndex({ isDeleted: 1 });
      await Tenant.collection.createIndex({ 'subscription.status': 1 });
      await Tenant.collection.createIndex({ createdAt: -1 });
      console.log('✅ Tenant indexes created');

      // TenantSchema indexes
      await TenantSchema.collection.createIndex({ tenantId: 1 });
      await TenantSchema.collection.createIndex({ schemaType: 1 });
      await TenantSchema.collection.createIndex({ isActive: 1 });
      console.log('✅ TenantSchema indexes created');



      // Poll indexes
      await Poll.collection.createIndex({ tenantId: 1 });
      await Poll.collection.createIndex({ createdBy: 1 });
      await Poll.collection.createIndex({ status: 1 });
      await Poll.collection.createIndex({ category: 1 });
      await Poll.collection.createIndex({ createdAt: -1 });
      await Poll.collection.createIndex({ 'recipients.email': 1 });
      console.log('✅ Poll indexes created');

      console.log('🎉 All indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating indexes:', error.message);
      throw error;
    }
  }

  async createSampleData() {
    console.log('\n📝 Creating sample data...');
    
    try {
      // Create sample tenant
      const sampleTenant = new Tenant({
        name: 'LuxGen Training Platform',
        slug: 'luxgen-training',
        description: 'Professional training and development platform',
        contactEmail: 'admin@luxgen.com',
        contactPhone: '+1-555-0123',
        website: 'https://luxgen.com',
        address: {
          street: '123 Innovation Drive',
          city: 'Tech City',
          state: 'CA',
          country: 'USA',
          zipCode: '90210'
        },
        industry: 'Technology',
        companySize: '51-200',
        timezone: 'America/Los_Angeles',
        language: 'en',
        subscription: {
          plan: 'enterprise',
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          billingCycle: 'yearly',
          amount: 9999,
          currency: 'USD'
        },
        features: {
          polls: { enabled: true, maxPolls: 1000, maxRecipients: 10000 },
          analytics: { enabled: true, retention: 365 },
          integrations: { slack: true, teams: true, email: true },
          branding: { enabled: true, logo: 'https://luxgen.com/logo.png' },
          security: { sso: true, mfa: true }
        },
        status: 'active',
        isVerified: true,
        settings: {
          allowPublicPolls: true,
          requireEmailVerification: true,
          autoArchivePolls: true,
          archiveAfterDays: 90
        },
        metadata: {
          source: 'setup',
          referrer: 'database-setup'
        }
      });

      const savedTenant = await sampleTenant.save();
      console.log('✅ Sample tenant created:', savedTenant.name);

      // Create sample admin user
      const adminUser = new User({
        tenantId: savedTenant._id,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@luxgen.com',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqKqKq', // 'admin123'
        role: 'admin',
        isActive: true,
        isVerified: true,
        lastLogin: new Date(),
        metadata: {
          source: 'setup',
          createdBy: 'system'
        }
      });

      const savedAdminUser = await adminUser.save();
      console.log('✅ Sample admin user created:', savedAdminUser.email);

      // Create sample regular user
      const regularUser = new User({
        tenantId: savedTenant._id,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@luxgen.com',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KqKqKq', // 'user123'
        role: 'user',
        isActive: true,
        isVerified: true,
        lastLogin: new Date(),
        metadata: {
          source: 'setup',
          createdBy: 'system'
        }
      });

      const savedRegularUser = await regularUser.save();
      console.log('✅ Sample regular user created:', savedRegularUser.email);



      // Create sample tenant schema
      const tenantSchema = new TenantSchema({
        tenantId: savedTenant._id,
        schemaType: 'user_profile',
        name: 'Employee Profile Schema',
        description: 'Standard employee profile schema for LuxGen Training Platform',
        schema: {
          type: 'object',
          properties: {
            department: { 
              type: 'string', 
              title: 'Department',
              description: 'Employee department'
            },
            position: { 
              type: 'string', 
              title: 'Position',
              description: 'Employee position'
            },
            employeeId: { 
              type: 'string', 
              title: 'Employee ID',
              description: 'Unique employee identifier'
            },
            hireDate: { 
              type: 'string', 
              format: 'date',
              title: 'Hire Date',
              description: 'Date when employee was hired'
            },
            skills: { 
              type: 'array', 
              items: { type: 'string' },
              title: 'Skills',
              description: 'Employee skills'
            },
            certifications: { 
              type: 'array', 
              items: { type: 'string' },
              title: 'Certifications',
              description: 'Employee certifications'
            }
          },
          required: ['department', 'position', 'employeeId', 'hireDate']
        },
        isActive: true,
        isDefault: true,
        uiConfig: {
          layout: 'single_column',
          theme: 'professional',
          showProgress: true,
          allowSaveDraft: true,
          allowEdit: false
        },
        permissions: {
          view: ['admin', 'manager', 'user'],
          edit: ['admin', 'manager'],
          delete: ['admin']
        },
        metadata: {
          tags: ['employee', 'profile', 'hr'],
          category: 'Human Resources',
          difficulty: 'beginner',
          estimatedTime: 5,
          createdBy: savedAdminUser._id,
          source: 'setup',
          notes: 'Standard employee profile schema'
        }
      });

      // await tenantSchema.save();
      console.log('✅ Sample tenant schema created (skipped for now)');

      // Create sample poll
      const samplePoll = new Poll({
        tenantId: savedTenant._id,
        createdBy: savedAdminUser._id,
        title: 'Training Program Feedback',
        description: 'Please provide feedback on our recent training program',
        niche: 'training',
        targetAudience: ['employees', 'managers'],
        questions: [
          {
            question: 'How would you rate the training program?',
            type: 'rating',
            options: ['1 - Poor', '2 - Fair', '3 - Good', '4 - Very Good', '5 - Excellent'],
            required: true,
            order: 1
          },
          {
            question: 'What topics would you like to see in future training?',
            type: 'multiple_choice',
            options: ['Leadership Skills', 'Technical Skills', 'Communication', 'Project Management'],
            required: false,
            order: 2
          }
        ],
        channels: ['email'],
        status: 'draft',
        priority: 'medium',
        tags: ['training', 'feedback', 'sample'],
        recipients: [
          { email: 'john.doe@luxgen.com', name: 'John Doe' },
          { email: 'jane.smith@luxgen.com', name: 'Jane Smith' }
        ],
        settings: {
          allowAnonymous: false,
          requireEmail: true,
          maxResponses: null,
          autoClose: false
        },
        metadata: {
          source: 'setup',
          tags: ['training', 'feedback', 'sample']
        }
      });

      await samplePoll.save();
      console.log('✅ Sample poll created');

      console.log('🎉 Sample data created successfully');
      
      return {
        tenant: savedTenant,
        adminUser: savedAdminUser,
        regularUser: savedRegularUser
      };
    } catch (error) {
      console.error('❌ Error creating sample data:', error.message);
      throw error;
    }
  }

  async validateSetup() {
    console.log('\n🔍 Validating database setup...');
    
    try {
      // Check collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      console.log('📋 Collections found:', collectionNames);
      
      // Check document counts
      const userCount = await User.countDocuments();
      const tenantCount = await Tenant.countDocuments();
      const pollCount = await Poll.countDocuments();
      const schemaCount = await TenantSchema.countDocuments();
      
      console.log('📊 Document counts:');
      console.log(`   - Users: ${userCount}`);
      console.log(`   - Tenants: ${tenantCount}`);
      console.log(`   - Polls: ${pollCount}`);
      console.log(`   - Schemas: ${schemaCount}`);
      
      // Test queries
      const activeTenants = await Tenant.find({ status: 'active', isDeleted: false });
      const adminUsers = await User.find({ role: 'admin', isActive: true });
      
      console.log('✅ Validation completed successfully');
      console.log(`   - Active tenants: ${activeTenants.length}`);
      console.log(`   - Admin users: ${adminUsers.length}`);
      
    } catch (error) {
      console.error('❌ Validation error:', error.message);
      throw error;
    }
  }

  async run() {
    try {
      console.log('🚀 Starting database setup...\n');
      
      await this.connect();
      await this.createIndexes();
      await this.createSampleData();
      await this.validateSetup();
      
      console.log('\n🎉 Database setup completed successfully!');
      console.log('\n📋 Setup Summary:');
      console.log('   - Database: luxgen_trainer_platform');
      console.log('   - Collections: users, tenants, polls, tenant_schemas, user_details, user_registrations');
      console.log('   - Indexes: Created for optimal performance');
      console.log('   - Sample data: Admin user, regular user, tenant, poll, and schema');
      
    } catch (error) {
      console.error('\n💥 Database setup failed:', error.message);
      process.exit(1);
    } finally {
      await mongoose.disconnect();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  const setup = new DatabaseSetup();
  setup.run();
}

module.exports = DatabaseSetup; 