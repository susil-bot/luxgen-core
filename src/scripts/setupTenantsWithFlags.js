#!/usr/bin/env node

/**
 * Quick Tenant Setup with Database Flags for LuxGen Platform
 * 
 * Uses the new database flagging system for flexible configuration
 * Usage: 
 * - Local: USE_LOCAL_DB=true node src/scripts/setupTenantsWithFlags.js
 * - Atlas: MONGODB_URI="..." node src/scripts/setupTenantsWithFlags.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const DatabaseFlags = require('../config/databaseFlags');

// Import models
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Activity = require('../models/Activity');

class TenantSetupWithFlags {
  constructor() {
    this.flags = new DatabaseFlags();
    this.logger = console;
  }

  async setupTenants() {
    try {
      this.logger.info('🚀 Tenant Setup with Database Flags');
      this.logger.info('====================================');
      
      // Display configuration
      this.flags.displayConfiguration();
      
      // Test connection
      const connectionTest = await this.flags.testConnection();
      if (!connectionTest) {
        throw new Error('Database connection test failed');
      }
      
      // Connect to database
      await this.connectToDatabase();
      
      // Clear database
      await this.clearDatabase();
      
      // Create tenants
      const tenants = await this.createTenants();
      
      // Create users
      const users = await this.createUsers(tenants);
      
      // Create activities
      await this.createActivities(tenants, users);
      
      // Verify setup
      await this.verifySetup(tenants);
      
      this.logger.info('✅ Tenant setup completed successfully!');
      
    } catch (error) {
      this.logger.error('❌ Setup failed:', error.message);
      throw error;
    } finally {
      await this.disconnectFromDatabase();
    }
  }

  async connectToDatabase() {
    this.logger.info('🔌 Connecting to database...');
    
    const connectionString = this.flags.getConnectionString();
    const options = this.flags.getConnectionOptions();
    
    await mongoose.connect(connectionString, options);
    this.logger.info('✅ Connected to database');
  }

  async clearDatabase() {
    this.logger.info('🧹 Clearing database...');
    
    const collections = ['users', 'tenants', 'activities'];
    for (const collection of collections) {
      try {
        await mongoose.connection.db.collection(collection).deleteMany({});
      } catch (error) {
        // Ignore errors
      }
    }
    
    this.logger.info('✅ Database cleared');
  }

  async createTenants() {
    this.logger.info('🏢 Creating tenants...');
    
    const tenants = [];
    
    // Test Tenant
    const testTenant = new Tenant({
      name: 'Test Organization',
      slug: 'test',
      contactEmail: 'admin@test.com',
      status: 'active',
      settings: {
        theme: 'modern',
        features: ['training', 'assessment'],
        branding: {
          primaryColor: '#3b82f6',
          secondaryColor: '#1e40af',
          logo: 'https://example.com/test-logo.png'
        },
        limits: {
          maxUsers: 100,
          maxCourses: 50
        }
      },
      metadata: {
        industry: 'Technology',
        size: 'medium',
        region: 'US',
        timezone: 'America/New_York',
        language: 'en',
        currency: 'USD'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await testTenant.save();
    tenants.push(testTenant);
    this.logger.info('✅ Test tenant created');
    
    // LuxGen Tenant
    const luxgenTenant = new Tenant({
      name: 'LuxGen Corporation',
      slug: 'luxgen',
      contactEmail: 'admin@luxgen.com',
      status: 'active',
      settings: {
        theme: 'corporate',
        features: ['training', 'assessment', 'analytics', 'messaging'],
        branding: {
          primaryColor: '#7c3aed',
          secondaryColor: '#5b21b6',
          logo: 'https://example.com/luxgen-logo.png'
        },
        limits: {
          maxUsers: 1000,
          maxCourses: 200
        }
      },
      metadata: {
        industry: 'Education',
        size: 'enterprise',
        region: 'Global',
        timezone: 'UTC',
        language: 'en',
        currency: 'USD'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await luxgenTenant.save();
    tenants.push(luxgenTenant);
    this.logger.info('✅ LuxGen tenant created');
    
    return tenants;
  }

  async createUsers(tenants) {
    this.logger.info('👥 Creating users...');
    
    const allUsers = [];
    
    for (const tenant of tenants) {
      const roles = ['admin', 'trainer', 'user'];
      
      for (let i = 0; i < 3; i++) {
        const user = new User({
          firstName: `User${i + 1}`,
          lastName: tenant.slug === 'test' ? 'Test' : 'LuxGen',
          email: `user${i + 1}@${tenant.slug}.com`,
          password: await bcrypt.hash('password123', 10),
          role: roles[i],
          isActive: true,
          isVerified: true,
          phone: `+123456789${i}`,
          department: 'IT',
          position: roles[i],
          tenantId: tenant._id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await user.save();
        allUsers.push(user);
      }
    }
    
    this.logger.info('✅ Users created');
    return allUsers;
  }

  async createActivities(tenants, users) {
    this.logger.info('📊 Creating activities...');
    
    for (const tenant of tenants) {
      const tenantUsers = users.filter(user => user.tenantId.toString() === tenant._id.toString());
      
      const activities = [
        {
          type: 'user_joined',
          title: `Welcome to ${tenant.name}`,
          description: `New user joined ${tenant.name}`,
          tenantId: tenant._id,
          userId: tenantUsers[0]._id,
          timestamp: new Date(),
          likes: 5,
          comments: 2,
          shares: 1,
          views: 25
        },
        {
          type: 'program_created',
          title: `${tenant.name} Training Program`,
          description: `Training program created for ${tenant.name}`,
          tenantId: tenant._id,
          userId: tenantUsers[1]._id,
          timestamp: new Date(Date.now() - 3600000),
          likes: 8,
          comments: 3,
          shares: 2,
          views: 40
        }
      ];
      
      for (const activityData of activities) {
        const activity = new Activity(activityData);
        await activity.save();
      }
    }
    
    this.logger.info('✅ Activities created');
  }

  async verifySetup(tenants) {
    this.logger.info('🔍 Verifying setup...');
    
    const tenant1 = tenants[0];
    const tenant2 = tenants[1];
    
    const tenant1Users = await User.find({ tenantId: tenant1._id });
    const tenant2Users = await User.find({ tenantId: tenant2._id });
    
    const tenant1Activities = await Activity.find({ tenantId: tenant1._id });
    const tenant2Activities = await Activity.find({ tenantId: tenant2._id });
    
    this.logger.info(`✅ Tenant 1 (${tenant1.name}): ${tenant1Users.length} users, ${tenant1Activities.length} activities`);
    this.logger.info(`✅ Tenant 2 (${tenant2.name}): ${tenant2Users.length} users, ${tenant2Activities.length} activities`);
    
    // Verify isolation
    const crossTenantUsers = await User.find({
      tenantId: tenant1._id,
      _id: { $in: tenant2Users.map(u => u._id) }
    });
    
    if (crossTenantUsers.length > 0) {
      throw new Error('❌ Multi-tenant isolation failed');
    }
    
    this.logger.info('✅ Multi-tenant isolation verified');
  }

  async disconnectFromDatabase() {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      this.logger.info('🔌 Disconnected from database');
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new TenantSetupWithFlags();
  setup.setupTenants()
    .then(() => {
      console.log('\n🎉 Tenant setup with flags completed!');
      console.log('\n📝 Test Credentials:');
      console.log('Test Tenant:');
      console.log('  Admin: user1@test.com / password123');
      console.log('  Trainer: user2@test.com / password123');
      console.log('  User: user3@test.com / password123');
      console.log('\nLuxGen Tenant:');
      console.log('  Admin: user1@luxgen.com / password123');
      console.log('  Trainer: user2@luxgen.com / password123');
      console.log('  User: user3@luxgen.com / password123');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = TenantSetupWithFlags;
