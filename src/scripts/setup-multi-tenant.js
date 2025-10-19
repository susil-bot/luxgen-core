/**
 * Multi-Tenant Database Setup Script
 * Sets up demo and luxgen tenants with subdomain mapping
 */

const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const User = require('../models/User');

// Demo Tenant Configuration
const DEMO_TENANT = {
  name: 'LuxGen Demo',
  slug: 'demo',
  domain: 'demo.luxgen.com',
  status: 'active',
  plan: 'free',
  settings: {
    branding: {
      logo: '/media/tenants/demo/logo.png',
      primaryColor: '#10B981',
      secondaryColor: '#059669',
      favicon: '/media/tenants/demo/favicon.ico'
    },
    features: {
      training: true,
      jobs: true,
      analytics: true,
      customDomain: false,
      apiAccess: true
    },
    limits: {
      maxUsers: 100,
      maxStorage: '1GB',
      maxTrainingPrograms: 10,
      maxJobPostings: 20
    }
  },
  stats: {
    totalUsers: 0,
    activeUsers: 0,
    totalTrainingPrograms: 0,
    totalJobPostings: 0
  }
};

// LuxGen Tenant Configuration
const LUXGEN_TENANT = {
  name: 'LuxGen Production',
  slug: 'luxgen',
  domain: 'luxgen.com',
  status: 'active',
  plan: 'enterprise',
  settings: {
    branding: {
      logo: '/media/tenants/luxgen/logo.png',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      favicon: '/media/tenants/luxgen/favicon.ico'
    },
    features: {
      training: true,
      jobs: true,
      analytics: true,
      customDomain: true,
      apiAccess: true
    },
    limits: {
      maxUsers: 10000,
      maxStorage: '100GB',
      maxTrainingPrograms: 500,
      maxJobPostings: 1000
    }
  },
  stats: {
    totalUsers: 0,
    activeUsers: 0,
    totalTrainingPrograms: 0,
    totalJobPostings: 0
  }
};

// Demo Admin User
const DEMO_ADMIN = {
  firstName: 'Demo',
  lastName: 'Admin',
  email: 'admin@demo.luxgen.com',
  password: 'DemoPassword123!',
  role: 'admin',
  isActive: true,
  isVerified: true
};

// LuxGen Admin User
const LUXGEN_ADMIN = {
  firstName: 'LuxGen',
  lastName: 'Admin',
  email: 'admin@luxgen.com',
  password: 'LuxGenPassword123!',
  role: 'admin',
  isActive: true,
  isVerified: true
};

// Demo Test User
const DEMO_TEST_USER = {
  firstName: 'Demo',
  lastName: 'User',
  email: 'user@demo.luxgen.com',
  password: 'DemoUser123!',
  role: 'user',
  isActive: true,
  isVerified: true
};

// LuxGen Test User
const LUXGEN_TEST_USER = {
  firstName: 'LuxGen',
  lastName: 'User',
  email: 'user@luxgen.com',
  password: 'LuxGenUser123!',
  role: 'user',
  isActive: true,
  isVerified: true
};

async function setupMultiTenant() {
  try {
    console.log('🚀 Setting up Multi-Tenant LuxGen System...');
    
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
    
    // Create Demo Tenant
    console.log('🏢 Creating Demo Tenant...');
    let demoTenant = await Tenant.findOne({ slug: 'demo' });
    
    if (!demoTenant) {
      demoTenant = new Tenant(DEMO_TENANT);
      await demoTenant.save();
      console.log('✅ Demo tenant created:', demoTenant.slug);
    } else {
      console.log('ℹ️ Demo tenant already exists:', demoTenant.slug);
    }
    
    // Create LuxGen Tenant
    console.log('🏢 Creating LuxGen Tenant...');
    let luxgenTenant = await Tenant.findOne({ slug: 'luxgen' });
    
    if (!luxgenTenant) {
      luxgenTenant = new Tenant(LUXGEN_TENANT);
      await luxgenTenant.save();
      console.log('✅ LuxGen tenant created:', luxgenTenant.slug);
    } else {
      console.log('ℹ️ LuxGen tenant already exists:', luxgenTenant.slug);
    }
    
    // Create Demo Admin User
    console.log('👤 Creating Demo Admin User...');
    let demoAdmin = await User.findOne({ email: 'admin@demo.luxgen.com' });
    
    if (!demoAdmin) {
      demoAdmin = new User({
        ...DEMO_ADMIN,
        tenantId: demoTenant._id.toString()
      });
      await demoAdmin.save();
      console.log('✅ Demo admin created:', demoAdmin.email);
    } else {
      console.log('ℹ️ Demo admin already exists:', demoAdmin.email);
    }
    
    // Create LuxGen Admin User
    console.log('👤 Creating LuxGen Admin User...');
    let luxgenAdmin = await User.findOne({ email: 'admin@luxgen.com' });
    
    if (!luxgenAdmin) {
      luxgenAdmin = new User({
        ...LUXGEN_ADMIN,
        tenantId: luxgenTenant._id.toString()
      });
      await luxgenAdmin.save();
      console.log('✅ LuxGen admin created:', luxgenAdmin.email);
    } else {
      console.log('ℹ️ LuxGen admin already exists:', luxgenAdmin.email);
    }
    
    // Create Demo Test User
    console.log('👤 Creating Demo Test User...');
    let demoUser = await User.findOne({ email: 'user@demo.luxgen.com' });
    
    if (!demoUser) {
      demoUser = new User({
        ...DEMO_TEST_USER,
        tenantId: demoTenant._id.toString()
      });
      await demoUser.save();
      console.log('✅ Demo test user created:', demoUser.email);
    } else {
      console.log('ℹ️ Demo test user already exists:', demoUser.email);
    }
    
    // Create LuxGen Test User
    console.log('👤 Creating LuxGen Test User...');
    let luxgenUser = await User.findOne({ email: 'user@luxgen.com' });
    
    if (!luxgenUser) {
      luxgenUser = new User({
        ...LUXGEN_TEST_USER,
        tenantId: luxgenTenant._id.toString()
      });
      await luxgenUser.save();
      console.log('✅ LuxGen test user created:', luxgenUser.email);
    } else {
      console.log('ℹ️ LuxGen test user already exists:', luxgenUser.email);
    }
    
    // Update tenant stats
    const demoUserCount = await User.countDocuments({ tenantId: demoTenant._id.toString() });
    const luxgenUserCount = await User.countDocuments({ tenantId: luxgenTenant._id.toString() });
    
    await Tenant.findByIdAndUpdate(demoTenant._id, {
      $set: {
        'stats.totalUsers': demoUserCount,
        'stats.activeUsers': demoUserCount
      }
    });
    
    await Tenant.findByIdAndUpdate(luxgenTenant._id, {
      $set: {
        'stats.totalUsers': luxgenUserCount,
        'stats.activeUsers': luxgenUserCount
      }
    });
    
    console.log('✅ Tenant stats updated');
    
    console.log('\n📊 Multi-Tenant Setup Complete:');
    console.log('===============================');
    console.log(`Demo Tenant ID: ${demoTenant._id}`);
    console.log(`Demo Tenant Slug: ${demoTenant.slug}`);
    console.log(`Demo Domain: ${demoTenant.domain}`);
    console.log(`Demo Admin: ${demoAdmin.email} / ${DEMO_ADMIN.password}`);
    console.log(`Demo User: ${demoUser.email} / ${DEMO_TEST_USER.password}`);
    console.log(`Demo Users: ${demoUserCount}`);
    
    console.log(`\nLuxGen Tenant ID: ${luxgenTenant._id}`);
    console.log(`LuxGen Tenant Slug: ${luxgenTenant.slug}`);
    console.log(`LuxGen Domain: ${luxgenTenant.domain}`);
    console.log(`LuxGen Admin: ${luxgenAdmin.email} / ${LUXGEN_ADMIN.password}`);
    console.log(`LuxGen User: ${luxgenUser.email} / ${LUXGEN_TEST_USER.password}`);
    console.log(`LuxGen Users: ${luxgenUserCount}`);
    
    console.log('\n🌐 Subdomain Mapping:');
    console.log('====================');
    console.log('Demo: https://demo.luxgen.com → demo tenant');
    console.log('LuxGen: https://luxgen.com → luxgen tenant');
    console.log('API: https://luxgen-backend.netlify.app/api/auth/*');
    
    console.log('\n🔗 Test URLs:');
    console.log('=============');
    console.log('Demo Frontend: https://demo.luxgen.com');
    console.log('LuxGen Frontend: https://luxgen.com');
    console.log('Backend API: https://luxgen-backend.netlify.app');
    
    return {
      success: true,
      demoTenant,
      luxgenTenant,
      demoAdmin,
      luxgenAdmin,
      demoUser,
      luxgenUser,
      demoUserCount,
      luxgenUserCount
    };
    
  } catch (error) {
    console.error('❌ Multi-tenant setup failed:', error);
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
  setupMultiTenant()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 Multi-tenant setup complete!');
        console.log('You can now use the following credentials:');
        console.log(`Demo Admin: ${result.demoAdmin.email} / ${DEMO_ADMIN.password}`);
        console.log(`LuxGen Admin: ${result.luxgenAdmin.email} / ${LUXGEN_ADMIN.password}`);
        process.exit(0);
      } else {
        console.log('\n❌ Multi-tenant setup failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { setupMultiTenant };
