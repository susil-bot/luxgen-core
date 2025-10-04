const mongoose = require('mongoose');
const TenantManagementService = require('../services/TenantManagementService');

async function setupDefaultTenant() {
  try {
    console.log('🏢 Setting up default LuxGen tenant...');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/luxgen');
    console.log('✅ Connected to MongoDB');

    const tenantService = new TenantManagementService();

    // Check if LuxGen tenant already exists
    try {
      const existingTenant = await tenantService.getTenant('luxgen');
      if (existingTenant) {
        console.log('✅ LuxGen tenant already exists:', existingTenant._id);
        return existingTenant;
      }
    } catch (error) {
      // Tenant doesn't exist, create it
    }

    // Create LuxGen tenant
    const luxgenTenant = await tenantService.createTenant({
      name: 'LuxGen Technologies',
      slug: 'luxgen',
      domain: 'localhost:3000',
      contactEmail: 'admin@luxgen.com',
      plan: 'enterprise',
      createAdminUser: false // Don't create admin user for now
    });

    console.log('✅ LuxGen tenant created:', luxgenTenant._id);
    return luxgenTenant;

  } catch (error) {
    console.error('❌ Error setting up default tenant:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  setupDefaultTenant()
    .then(() => {
      console.log('🎉 Default tenant setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupDefaultTenant;
