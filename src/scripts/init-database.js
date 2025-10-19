/**
 * Database Initialization Script
 * Creates tenants and sample data for multi-tenant setup
 */

require('dotenv').config();
const clientPromise = require('../lib/mongodb');
const { createTenant } = require('../lib/tenant');

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing LuxGen Database...');
    
    // Get MongoDB client
    const client = await clientPromise;
    const db = client.db('luxgen');
    
    // Create collections with indexes
    await createCollections(db);
    
    // Create tenants
    await createTenants(db);
    
    // Create sample data
    await createSampleData(db);
    
    console.log('✅ Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    // Close connection
    const client = await clientPromise;
    await client.close();
  }
}

async function createCollections(db) {
  console.log('📁 Creating collections and indexes...');
  
  // Create tenants collection
  await db.collection('tenants').createIndex({ tenantId: 1 }, { unique: true });
  await db.collection('tenants').createIndex({ subdomain: 1 }, { unique: true });
  
  // Create users collection
  await db.collection('users').createIndex({ tenantId: 1, email: 1 }, { unique: true });
  await db.collection('users').createIndex({ tenantId: 1 });
  
  // Create training_programs collection
  await db.collection('training_programs').createIndex({ tenantId: 1 });
  await db.collection('training_programs').createIndex({ tenantId: 1, title: 1 });
  
  // Create job_postings collection
  await db.collection('job_postings').createIndex({ tenantId: 1 });
  await db.collection('job_postings').createIndex({ tenantId: 1, title: 1 });
  
  console.log('✅ Collections and indexes created');
}

async function createTenants(db) {
  console.log('🏢 Creating tenants...');
  
  const tenants = [
    {
      tenantId: 'luxgen_corp',
      name: 'LuxGen Corporation',
      subdomain: 'luxgen',
      plan: 'enterprise',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      tenantId: 'demo_company',
      name: 'Demo Company',
      subdomain: 'demo',
      plan: 'free',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  for (const tenantData of tenants) {
    // Check if tenant already exists
    const existingTenant = await db.collection('tenants').findOne({ tenantId: tenantData.tenantId });
    
    if (!existingTenant) {
      await db.collection('tenants').insertOne(tenantData);
      console.log(`✅ Created tenant: ${tenantData.name} (${tenantData.tenantId})`);
    } else {
      console.log(`🔄 Tenant already exists: ${tenantData.name}`);
    }
  }
}

async function createSampleData(db) {
  console.log('📊 Creating sample data...');
  
  // Get tenant IDs
  const luxgenTenant = await db.collection('tenants').findOne({ tenantId: 'luxgen_corp' });
  const demoTenant = await db.collection('tenants').findOne({ tenantId: 'demo_company' });
  
  if (!luxgenTenant || !demoTenant) {
    throw new Error('Tenants not found');
  }
  
  // Create sample users
  const users = [
    // LuxGen users
    {
      tenantId: luxgenTenant.tenantId,
      name: 'John Admin',
      email: 'admin@luxgen.com',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      tenantId: luxgenTenant.tenantId,
      name: 'Jane Trainer',
      email: 'trainer@luxgen.com',
      role: 'trainer',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      tenantId: luxgenTenant.tenantId,
      name: 'Bob User',
      email: 'user@luxgen.com',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    // Demo users
    {
      tenantId: demoTenant.tenantId,
      name: 'Demo Admin',
      email: 'admin@demo.com',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      tenantId: demoTenant.tenantId,
      name: 'Demo User',
      email: 'user@demo.com',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  for (const user of users) {
    const existingUser = await db.collection('users').findOne({ 
      tenantId: user.tenantId, 
      email: user.email 
    });
    
    if (!existingUser) {
      await db.collection('users').insertOne(user);
      console.log(`✅ Created user: ${user.name} (${user.email})`);
    } else {
      console.log(`🔄 User already exists: ${user.email}`);
    }
  }
  
  // Create sample training programs
  const trainingPrograms = [
    // LuxGen programs
    {
      tenantId: luxgenTenant.tenantId,
      title: 'Advanced JavaScript Training',
      description: 'Comprehensive JavaScript course for developers',
      duration: '40 hours',
      level: 'intermediate',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      tenantId: luxgenTenant.tenantId,
      title: 'React Masterclass',
      description: 'Complete React development course',
      duration: '30 hours',
      level: 'advanced',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    // Demo programs
    {
      tenantId: demoTenant.tenantId,
      title: 'Demo Training Program',
      description: 'This is a demo training program',
      duration: '10 hours',
      level: 'beginner',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  for (const program of trainingPrograms) {
    const existingProgram = await db.collection('training_programs').findOne({ 
      tenantId: program.tenantId, 
      title: program.title 
    });
    
    if (!existingProgram) {
      await db.collection('training_programs').insertOne(program);
      console.log(`✅ Created training program: ${program.title}`);
    } else {
      console.log(`🔄 Training program already exists: ${program.title}`);
    }
  }
  
  // Create sample job postings
  const jobPostings = [
    // LuxGen jobs
    {
      tenantId: luxgenTenant.tenantId,
      title: 'Senior JavaScript Developer',
      description: 'Looking for an experienced JavaScript developer',
      location: 'San Francisco, CA',
      salary: '$120,000 - $150,000',
      type: 'full-time',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      tenantId: luxgenTenant.tenantId,
      title: 'React Developer',
      description: 'React developer position at LuxGen',
      location: 'Remote',
      salary: '$100,000 - $130,000',
      type: 'full-time',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    // Demo jobs
    {
      tenantId: demoTenant.tenantId,
      title: 'Demo Job Position',
      description: 'This is a demo job posting',
      location: 'Demo City',
      salary: '$50,000 - $70,000',
      type: 'part-time',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  for (const job of jobPostings) {
    const existingJob = await db.collection('job_postings').findOne({ 
      tenantId: job.tenantId, 
      title: job.title 
    });
    
    if (!existingJob) {
      await db.collection('job_postings').insertOne(job);
      console.log(`✅ Created job posting: ${job.title}`);
    } else {
      console.log(`🔄 Job posting already exists: ${job.title}`);
    }
  }
  
  console.log('✅ Sample data created');
}

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };