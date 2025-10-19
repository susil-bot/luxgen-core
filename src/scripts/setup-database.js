/**
 * Database Setup Script
 * Sets up the database with default tenant and admin user
 */

const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const User = require('../models/User');

// Default tenant configuration
const DEFAULT_TENANT = {
  name: 'LuxGen Default',
  slug: 'luxgen-default',
  domain: 'luxgen.com',
  status: 'active',
  plan: 'free',
  settings: {
    branding: {
      logo: null,
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      favicon: null
    },
    features: {
      training: true,
      jobs: true,
      analytics: true,
      customDomain: false,
      apiAccess: true
    },
    limits: {
      maxUsers: 1000,
      maxStorage: '10GB',
      maxTrainingPrograms: 50,
      maxJobPostings: 100
    }
  },
  stats: {
    totalUsers: 0,
    activeUsers: 0,
    totalTrainingPrograms: 0,
    totalJobPostings: 0
  }
};

// Default admin user
const DEFAULT_ADMIN = {
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@luxgen.com',
  password: 'AdminPassword123!',
  role: 'admin',
  isActive: true,
  isVerified: true
};

async function setupDatabase() {
  try {
    console.log('🚀 Setting up LuxGen Database...');
    
    // Connect to MongoDB Atlas
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI;
    
    if (!mongoUri || mongoUri.includes('<db_password>') || mongoUri.trim() === '') {
      console.log('❌ MongoDB URI not configured. Please set MONGODB_URI environment variable.');
      console.log('Example: mongodb+srv://username:password@cluster.mongodb.net/luxgen');
      return { success: false, error: 'MongoDB URI not configured' };
    }
    
    console.log('📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority',
      readPreference: 'primary'
    });
    
    console.log('✅ Connected to MongoDB Atlas');
    
    // Create default tenant
    console.log('🏢 Creating default tenant...');
    let tenant = await Tenant.findOne({ slug: 'luxgen-default' });
    
    if (!tenant) {
      tenant = new Tenant(DEFAULT_TENANT);
      await tenant.save();
      console.log('✅ Default tenant created:', tenant.slug);
    } else {
      console.log('ℹ️ Default tenant already exists:', tenant.slug);
    }
    
    // Create admin user
    console.log('👤 Creating admin user...');
    let adminUser = await User.findOne({ email: 'admin@luxgen.com' });
    
    if (!adminUser) {
      adminUser = new User({
        ...DEFAULT_ADMIN,
        tenantId: tenant._id.toString()
      });
      await adminUser.save();
      console.log('✅ Admin user created:', adminUser.email);
    } else {
      console.log('ℹ️ Admin user already exists:', adminUser.email);
    }
    
    // Update tenant stats
    const userCount = await User.countDocuments({ tenantId: tenant._id.toString() });
    await Tenant.findByIdAndUpdate(tenant._id, {
      $set: {
        'stats.totalUsers': userCount,
        'stats.activeUsers': userCount
      }
    });
    
    console.log('✅ Tenant stats updated');
    
    // Create additional test tenants
    console.log('🏢 Creating additional test tenants...');
    const testTenants = [
      {
        name: 'Acme Corporation',
        slug: 'acme-corp',
        domain: 'acme.luxgen.com',
        status: 'active',
        plan: 'enterprise',
        settings: {
          branding: {
            logo: '/media/tenants/acme/logo.png',
            primaryColor: '#3B82F6',
            secondaryColor: '#1E40AF'
          },
          features: {
            training: true,
            jobs: true,
            analytics: true,
            customDomain: true
          }
        }
      },
      {
        name: 'Tech Startup',
        slug: 'tech-startup',
        domain: 'tech.luxgen.com',
        status: 'active',
        plan: 'professional',
        settings: {
          branding: {
            logo: '/media/tenants/tech/logo.png',
            primaryColor: '#10B981',
            secondaryColor: '#059669'
          },
          features: {
            training: true,
            jobs: false,
            analytics: true,
            customDomain: false
          }
        }
      }
    ];
    
    for (const tenantData of testTenants) {
      let existingTenant = await Tenant.findOne({ slug: tenantData.slug });
      if (!existingTenant) {
        const newTenant = new Tenant({
          ...tenantData,
          stats: {
            totalUsers: 0,
            activeUsers: 0,
            totalTrainingPrograms: 0,
            totalJobPostings: 0
          }
        });
        await newTenant.save();
        console.log('✅ Test tenant created:', newTenant.slug);
      } else {
        console.log('ℹ️ Test tenant already exists:', existingTenant.slug);
      }
    }
    
    console.log('\n📊 Database Setup Complete:');
    console.log('============================');
    console.log(`Default Tenant ID: ${tenant._id}`);
    console.log(`Default Tenant Slug: ${tenant.slug}`);
    console.log(`Admin Email: ${adminUser.email}`);
    console.log(`Admin Password: ${DEFAULT_ADMIN.password}`);
    console.log(`Total Users: ${userCount}`);
    
    console.log('\n🔗 Available Tenants:');
    const allTenants = await Tenant.find({}, 'name slug domain plan status');
    allTenants.forEach(t => {
      console.log(`  - ${t.name} (${t.slug}) - ${t.plan} - ${t.status}`);
    });
    
    return {
      success: true,
      tenant,
      adminUser,
      totalUsers: userCount,
      allTenants
    };
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run if this file is executed directly
if (require.main === module) {
  setupDatabase()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Database setup complete!');
        console.log('You can now use the following credentials:');
        console.log(`Admin: ${result.adminUser.email} / ${DEFAULT_ADMIN.password}`);
        console.log(`Default Tenant: ${result.tenant.slug}`);
        process.exit(0);
      } else {
        console.log('\n❌ Database setup failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabase };
