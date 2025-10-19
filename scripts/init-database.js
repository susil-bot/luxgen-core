const mongoose = require('mongoose');
require('dotenv').config();

// Import models to ensure they're registered
const User = require('../src/models/User');
const Tenant = require('../src/models/Tenant');

async function initializeDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGODB_ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB Atlas successfully!');
    
    // Create a default tenant
    console.log('🏢 Creating default tenant...');
    const defaultTenant = new Tenant({
      name: 'Default Tenant',
      slug: 'default',
      domain: 'localhost',
      description: 'Default tenant for LuxGen platform',
      contact: {
        email: 'admin@luxgen.com'
      },
      subscription: {
        plan: 'free',
        status: 'active'
      },
      isActive: true
    });
    
    await defaultTenant.save();
    console.log('✅ Default tenant created successfully!');
    
    // Create indexes for better performance
    console.log('📊 Creating database indexes...');
    await User.createIndexes();
    await Tenant.createIndexes();
    console.log('✅ Database indexes created successfully!');
    
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB Atlas');
  }
}

// Run the initialization
initializeDatabase()
  .then(() => {
    console.log('✅ Database setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  });
