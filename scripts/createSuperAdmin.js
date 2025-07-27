#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load environment configuration
require('dotenv').config();

// Import models
const User = require('../src/models/User');
const Tenant = require('../src/models/Tenant');

async function createSuperAdmin() {
  try {
    console.log('🚀 Creating Super Admin User...');
    console.log('='.repeat(50));

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URL || 'mongodb://localhost:27017/luxgen_trainer_platform';
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri, {
      dbName: 'luxgen_trainer_platform',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    });

    console.log('✅ MongoDB connected successfully');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ 
      email: 'susil@luxgen.com',
      role: 'super_admin'
    });

    if (existingSuperAdmin) {
      console.log('⚠️  Super admin user already exists');
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log(`   Role: ${existingSuperAdmin.role}`);
      console.log(`   Created: ${existingSuperAdmin.createdAt}`);
      return;
    }

    // Create system tenant if it doesn't exist
    let systemTenant = await Tenant.findOne({ slug: 'system' });
    if (!systemTenant) {
      console.log('🏢 Creating system tenant...');
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
        }
      });
      await systemTenant.save();
      console.log('✅ System tenant created successfully');
    } else {
      console.log('ℹ️  System tenant already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('Password@123', saltRounds);

    // Create super admin user
    const superAdmin = new User({
      email: 'susil@luxgen.com',
      password: hashedPassword,
      firstName: 'Susil',
      lastName: 'Admin',
      role: 'super_admin',
      isActive: true,
      isEmailVerified: true,
      tenantId: systemTenant._id,
      phone: '+1234567890',
      jobTitle: 'Super Administrator',
      department: 'System Administration',
      preferences: {
        theme: 'dark',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      },
      address: {
        street: 'System Address',
        city: 'System City',
        state: 'System State',
        country: 'System Country',
        postalCode: '00000'
      }
    });

    await superAdmin.save();

    console.log('✅ Super Admin User Created Successfully!');
    console.log('='.repeat(50));
    console.log('📧 Email: susil@luxgen.com');
    console.log('🔑 Password: Password@123');
    console.log('👤 Role: super_admin');
    console.log('🏢 Tenant: System');
    console.log('📅 Created: ' + new Date().toISOString());
    console.log('='.repeat(50));
    console.log('🔐 This user has full system access and can:');
    console.log('   • Create and manage all tenants');
    console.log('   • Create admin, trainer, and user accounts');
    console.log('   • Access all system features');
    console.log('   • Manage platform settings');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
createSuperAdmin(); 