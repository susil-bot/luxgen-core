#!/usr/bin/env node

/**
 * Simple Database Setup Script
 * 
 * Uses the flagging system properly
 * - Local: USE_LOCAL_DB=true
 * - Atlas: MONGODB_URI=...
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const DatabaseConfig = require('../config/database');

// Import models
const User = require('../models/User');
const Tenant = require('../models/Tenant');

class SimpleSetup {
  constructor() {
    this.dbConfig = new DatabaseConfig();
  }

  async setup() {
    try {
      console.log('🚀 Simple Database Setup');
      this.dbConfig.logConfiguration();
      
      // Connect
      await this.connect();
      
      // Clear
      await this.clear();
      
      // Create tenants
      await this.createTenants();
      
      // Create users
      await this.createUsers();
      
      console.log('✅ Setup completed!');
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async connect() {
    console.log('🔌 Connecting...');
    
    const uri = this.dbConfig.getConnectionString();
    const options = this.dbConfig.getConnectionOptions();
    
    await mongoose.connect(uri, options);
    console.log(`✅ Connected to ${this.dbConfig.isLocal() ? 'Local' : 'Atlas'}`);
  }

  async clear() {
    console.log('🧹 Clearing...');
    
    const collections = ['users', 'tenants'];
    for (const collection of collections) {
      try {
        await mongoose.connection.db.collection(collection).deleteMany({});
      } catch (error) {
        // Ignore
      }
    }
    console.log('✅ Cleared');
  }

  async createTenants() {
    console.log('🏢 Creating tenants...');
    
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
          secondaryColor: '#1e40af'
        }
      },
      metadata: {
        industry: 'Technology',
        size: 'medium',
        region: 'US',
        timezone: 'America/New_York',
        language: 'en',
        currency: 'USD'
      }
    });
    
    await testTenant.save();
    console.log('✅ Test tenant created');
    
    // LuxGen Tenant
    const luxgenTenant = new Tenant({
      name: 'LuxGen Corporation',
      slug: 'luxgen',
      contactEmail: 'admin@luxgen.com',
      status: 'active',
      settings: {
        theme: 'corporate',
        features: ['training', 'assessment', 'analytics'],
        branding: {
          primaryColor: '#7c3aed',
          secondaryColor: '#5b21b6'
        }
      },
      metadata: {
        industry: 'Education',
        size: 'enterprise',
        region: 'Global',
        timezone: 'UTC',
        language: 'en',
        currency: 'USD'
      }
    });
    
    await luxgenTenant.save();
    console.log('✅ LuxGen tenant created');
    
    this.tenants = [testTenant, luxgenTenant];
  }

  async createUsers() {
    console.log('👥 Creating users...');
    
    for (const tenant of this.tenants) {
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
          tenantId: tenant._id
        });
        
        await user.save();
        console.log(`✅ User ${user.email} created`);
      }
    }
  }

  async disconnect() {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected');
    }
  }
}

// Run if called directly
if (require.main === module) {
  const setup = new SimpleSetup();
  setup.setup()
    .then(() => {
      console.log('\n🎉 Setup completed!');
      console.log('\n📝 Test Credentials:');
      console.log('Test: user1@test.com / password123');
      console.log('LuxGen: user1@luxgen.com / password123');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = SimpleSetup;
