/**
 * LUXGEN TENANT SYSTEM CREATION SCRIPT
 * Creates comprehensive tenant management system
 */

const mongoose = require('mongoose');
const tenantManagementService = require('../services/TenantManagementService');
const brandIdentityService = require('../services/BrandIdentityService');

async function createTenantSystem() {
  try {
    console.log('🏢 LUXGEN TENANT MANAGEMENT SYSTEM CREATION');
    console.log('==========================================');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/luxgen');
    console.log('✅ Connected to MongoDB');

    // Create LuxGen tenant (main tenant)
    console.log('\\n📋 Creating LuxGen main tenant...');
    const luxgenTenant = await tenantManagementService.createTenant({
      name: 'LuxGen Technologies',
      contactEmail: 'admin@luxgen.com',
      plan: 'enterprise',
      industry: 'Technology',
      companySize: '1000+',
      adminFirstName: 'LuxGen',
      adminLastName: 'Admin',
      adminPassword: 'luxgen123',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      accentColor: '#10B981',
      description: 'Main LuxGen tenant for platform management',
      tags: ['main', 'enterprise', 'technology']
    });

    console.log('✅ LuxGen tenant created:', luxgenTenant.tenant._id);

    // Create demo tenant
    console.log('\\n📋 Creating demo tenant...');
    const demoTenant = await tenantManagementService.createTenant({
      name: 'Demo Company',
      contactEmail: 'admin@democompany.com',
      plan: 'professional',
      industry: 'Education',
      companySize: '51-200',
      adminFirstName: 'Demo',
      adminLastName: 'Admin',
      adminPassword: 'demo123',
      primaryColor: '#8B5CF6',
      secondaryColor: '#7C3AED',
      accentColor: '#F59E0B',
      description: 'Demo tenant for showcasing LuxGen features',
      tags: ['demo', 'education', 'showcase']
    });

    console.log('✅ Demo tenant created:', demoTenant.tenant._id);

    // Create test tenant
    console.log('\\n📋 Creating test tenant...');
    const testTenant = await tenantManagementService.createTenant({
      name: 'Test Corporation',
      contactEmail: 'admin@testcorp.com',
      plan: 'starter',
      industry: 'Healthcare',
      companySize: '11-50',
      adminFirstName: 'Test',
      adminLastName: 'Admin',
      adminPassword: 'test123',
      primaryColor: '#EF4444',
      secondaryColor: '#DC2626',
      accentColor: '#F97316',
      description: 'Test tenant for development and testing',
      tags: ['test', 'healthcare', 'development']
    });

    console.log('✅ Test tenant created:', testTenant.tenant._id);

    // Initialize brand identities
    console.log('\\n🎨 Initializing brand identities...');
    
    // LuxGen brand identity
    await brandIdentityService.updateTenantBrandIdentity(luxgenTenant.tenant._id, {
      name: 'LuxGen Technologies',
      colors: {
        primary: '#3B82F6',
        secondary: '#1E40AF',
        accent: '#10B981',
        background: {
          primary: '#FFFFFF',
          secondary: '#F8FAFC',
          accent: '#EFF6FF'
        },
        text: {
          primary: '#1F2937',
          secondary: '#6B7280',
          accent: '#3B82F6'
        }
      },
      typography: {
        primary: {
          fontFamily: 'Inter',
          fallback: 'system-ui, sans-serif'
        },
        secondary: {
          fontFamily: 'Inter',
          fallback: 'system-ui, sans-serif'
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem'
      },
      decorations: {
        borderRadius: {
          sm: '0.25rem',
          md: '0.5rem',
          lg: '1rem'
        }
      }
    });

    // Demo brand identity
    await brandIdentityService.updateTenantBrandIdentity(demoTenant.tenant._id, {
      name: 'Demo Company',
      colors: {
        primary: '#8B5CF6',
        secondary: '#7C3AED',
        accent: '#F59E0B',
        background: {
          primary: '#FFFFFF',
          secondary: '#F8FAFC',
          accent: '#F3E8FF'
        },
        text: {
          primary: '#1F2937',
          secondary: '#6B7280',
          accent: '#8B5CF6'
        }
      },
      typography: {
        primary: {
          fontFamily: 'Poppins',
          fallback: 'system-ui, sans-serif'
        },
        secondary: {
          fontFamily: 'Poppins',
          fallback: 'system-ui, sans-serif'
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem'
      },
      decorations: {
        borderRadius: {
          sm: '0.375rem',
          md: '0.5rem',
          lg: '0.75rem'
        }
      }
    });

    // Test brand identity
    await brandIdentityService.updateTenantBrandIdentity(testTenant.tenant._id, {
      name: 'Test Corporation',
      colors: {
        primary: '#EF4444',
        secondary: '#DC2626',
        accent: '#F97316',
        background: {
          primary: '#FFFFFF',
          secondary: '#F8FAFC',
          accent: '#FEF2F2'
        },
        text: {
          primary: '#1F2937',
          secondary: '#6B7280',
          accent: '#EF4444'
        }
      },
      typography: {
        primary: {
          fontFamily: 'Roboto',
          fallback: 'system-ui, sans-serif'
        },
        secondary: {
          fontFamily: 'Roboto',
          fallback: 'system-ui, sans-serif'
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem'
      },
      decorations: {
        borderRadius: {
          sm: '0.125rem',
          md: '0.25rem',
          lg: '0.5rem'
        }
      }
    });

    console.log('✅ Brand identities initialized');

    // Create sample data for each tenant
    console.log('\\n📊 Creating sample data...');
    
    // Create sample users for each tenant
    const User = require('../models/User');
    const Job = require('../models/Job');

    // LuxGen users
    const luxgenUsers = [
      {
        _id: new mongoose.Types.ObjectId(),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@luxgen.com',
        password: '$2a$10$OP0oywVaQWwT45Pz7g7fue6cwpg5twiEeKge3pEWiiPZEbD2sDcrG',
        role: 'admin',
        tenantId: luxgenTenant.tenant._id,
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@luxgen.com',
        password: '$2a$10$OP0oywVaQWwT45Pz7g7fue6cwpg5twiEeKge3pEWiiPZEbD2sDcrG',
        role: 'trainer',
        tenantId: luxgenTenant.tenant._id,
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date()
      }
    ];

    // Demo users
    const demoUsers = [
      {
        _id: new mongoose.Types.ObjectId(),
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo.user@democompany.com',
        password: '$2a$10$OP0oywVaQWwT45Pz7g7fue6cwpg5twiEeKge3pEWiiPZEbD2sDcrG',
        role: 'user',
        tenantId: demoTenant.tenant._id,
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date()
      }
    ];

    // Test users
    const testUsers = [
      {
        _id: new mongoose.Types.ObjectId(),
        firstName: 'Test',
        lastName: 'User',
        email: 'test.user@testcorp.com',
        password: '$2a$10$OP0oywVaQWwT45Pz7g7fue6cwpg5twiEeKge3pEWiiPZEbD2sDcrG',
        role: 'user',
        tenantId: testTenant.tenant._id,
        isActive: true,
        isEmailVerified: true,
        createdAt: new Date()
      }
    ];

    // Save users
    await User.insertMany([...luxgenUsers, ...demoUsers, ...testUsers]);
    console.log('✅ Sample users created');

    // Create sample jobs for each tenant
    const luxgenJobs = [
      {
        _id: new mongoose.Types.ObjectId(),
        title: 'Senior Software Engineer',
        description: 'We are looking for a senior software engineer to join our team.',
        company: {
          name: 'LuxGen Technologies',
          industry: 'Technology'
        },
        jobType: 'full-time',
        experienceLevel: 'senior',
        location: {
          city: 'San Francisco',
          country: 'US',
          remote: true
        },
        requirements: {
          skills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
          education: {
            level: 'bachelor',
            field: 'Computer Science'
          },
          experience: {
            years: 5,
            description: '5+ years of software development experience'
          }
        },
        benefits: ['Health Insurance', 'Remote Work', 'Stock Options'],
        status: 'active',
        visibility: 'public',
        tenantId: luxgenTenant.tenant._id,
        createdAt: new Date()
      }
    ];

    const demoJobs = [
      {
        _id: new mongoose.Types.ObjectId(),
        title: 'Training Coordinator',
        description: 'Coordinate training programs for our organization.',
        company: {
          name: 'Demo Company',
          industry: 'Education'
        },
        jobType: 'full-time',
        experienceLevel: 'mid',
        location: {
          city: 'New York',
          country: 'US',
          remote: false
        },
        requirements: {
          skills: ['Training', 'Communication', 'Organization'],
          education: {
            level: 'bachelor',
            field: 'Education'
          },
          experience: {
            years: 3,
            description: '3+ years of training coordination experience'
          }
        },
        benefits: ['Health Insurance', 'Professional Development'],
        status: 'active',
        visibility: 'public',
        tenantId: demoTenant.tenant._id,
        createdAt: new Date()
      }
    ];

    const testJobs = [
      {
        _id: new mongoose.Types.ObjectId(),
        title: 'Healthcare Administrator',
        description: 'Manage healthcare operations and administration.',
        company: {
          name: 'Test Corporation',
          industry: 'Healthcare'
        },
        jobType: 'full-time',
        experienceLevel: 'senior',
        location: {
          city: 'Chicago',
          country: 'US',
          remote: false
        },
        requirements: {
          skills: ['Healthcare', 'Administration', 'Management'],
          education: {
            level: 'master',
            field: 'Healthcare Administration'
          },
          experience: {
            years: 7,
            description: '7+ years of healthcare administration experience'
          }
        },
        benefits: ['Health Insurance', 'Retirement Plan', 'Paid Time Off'],
        status: 'active',
        visibility: 'public',
        tenantId: testTenant.tenant._id,
        createdAt: new Date()
      }
    ];

    // Save jobs
    await Job.insertMany([...luxgenJobs, ...demoJobs, ...testJobs]);
    console.log('✅ Sample jobs created');

    // Display system summary
    console.log('\\n🎉 TENANT MANAGEMENT SYSTEM CREATED SUCCESSFULLY!');
    console.log('================================================');
    console.log('\\n📊 System Summary:');
    console.log('   - Total Tenants: 3');
    console.log('   - Total Users: 4');
    console.log('   - Total Jobs: 3');
    console.log('   - Brand Identities: 3');
    
    console.log('\\n🏢 Created Tenants:');
    console.log('   1. LuxGen Technologies (Enterprise)');
    console.log('   2. Demo Company (Professional)');
    console.log('   3. Test Corporation (Starter)');
    
    console.log('\\n🔑 Admin Credentials:');
    console.log('   LuxGen: admin@luxgen.com / luxgen123');
    console.log('   Demo: admin@democompany.com / demo123');
    console.log('   Test: admin@testcorp.com / test123');
    
    console.log('\\n🌐 Access URLs:');
    console.log('   Main: http://localhost:3000');
    console.log('   Demo: http://demo.localhost:3000');
    console.log('   Test: http://test.localhost:3000');
    
    console.log('\\n✅ Tenant Management System is ready!');

  } catch (error) {
    console.error('❌ Error creating tenant system:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
if (require.main === module) {
  createTenantSystem()
    .then(() => {
      console.log('\\n🎯 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = createTenantSystem;
