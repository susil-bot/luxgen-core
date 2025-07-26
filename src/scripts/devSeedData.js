const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Simple console logger for development
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  success: (msg) => console.log(`[SUCCESS] ${msg}`)
};

// Development database configuration
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'trainer_platform',
  user: process.env.DB_USER || 'trainer_user',
  password: process.env.DB_PASSWORD || 'trainer_password_2024',
  // Add connection timeout and retry settings
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
};

const pool = new Pool(dbConfig);

// Demo tenant data
const demoTenant = {
  id: 'demo-tenant-001',
  name: 'Demo Training Organization',
  domain: 'demo.trainer.com',
  subdomain: 'demo',
  status: 'active',
  plan: 'premium',
  settings: {
    branding: {
      logo: 'https://via.placeholder.com/200x60/3B82F6/FFFFFF?text=Demo+Org',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      accentColor: '#10B981',
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F9FAFB',
      textColor: '#111827',
      textSecondaryColor: '#6B7280',
      borderColor: '#E5E7EB',
      successColor: '#10B981',
      warningColor: '#F59E0B',
      errorColor: '#EF4444',
      infoColor: '#3B82F6'
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem'
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700'
      }
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem'
    },
    borderRadius: {
      none: '0',
      sm: '0.125rem',
      base: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    },
    components: {
      button: {
        primary: {
          backgroundColor: '#3B82F6',
          textColor: '#FFFFFF',
          borderColor: '#3B82F6',
          hoverBackgroundColor: '#2563EB',
          hoverTextColor: '#FFFFFF'
        },
        secondary: {
          backgroundColor: '#F3F4F6',
          textColor: '#374151',
          borderColor: '#D1D5DB',
          hoverBackgroundColor: '#E5E7EB',
          hoverTextColor: '#374151'
        }
      },
      input: {
        backgroundColor: '#FFFFFF',
        borderColor: '#D1D5DB',
        textColor: '#111827',
        placeholderColor: '#9CA3AF',
        focusBorderColor: '#3B82F6',
        focusRingColor: '#DBEAFE'
      },
      card: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E5E7EB',
        shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }
    },
    features: {
      aiChatbot: true,
      advancedAnalytics: true,
      customBranding: true,
      apiAccess: true
    }
  },
  limits: {
    users: 1000,
    polls: 500,
    storage: '10GB'
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

// Demo users with different roles
const demoUsers = [
  {
    id: 'user-superadmin-001',
    tenantId: demoTenant.id,
    firstName: 'Super',
    lastName: 'Admin',
    email: 'superadmin@trainer.com',
    password: 'password123',
    role: 'super_admin',
    status: 'active',
    department: 'IT',
    position: 'System Administrator',
    permissions: ['*'],
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'user-admin-001',
    tenantId: demoTenant.id,
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@trainer.com',
    password: 'password123',
    role: 'admin',
    status: 'active',
    department: 'Management',
    position: 'Training Manager',
    permissions: ['manage_users', 'manage_polls', 'view_analytics'],
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'user-trainer-001',
    tenantId: demoTenant.id,
    firstName: 'Trainer',
    lastName: 'User',
    email: 'trainer@trainer.com',
    password: 'password123',
    role: 'trainer',
    status: 'active',
    department: 'Training',
    position: 'Senior Trainer',
    permissions: ['create_polls', 'view_own_polls', 'manage_own_polls'],
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'user-participant-001',
    tenantId: demoTenant.id,
    firstName: 'Participant',
    lastName: 'User',
    email: 'user@trainer.com',
    password: 'password123',
    role: 'user',
    status: 'active',
    department: 'Sales',
    position: 'Sales Representative',
    permissions: ['respond_polls', 'view_own_responses'],
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Demo polls
const demoPolls = [
  {
    id: 'poll-leadership-001',
    tenantId: demoTenant.id,
    createdBy: 'user-trainer-001',
    title: 'Leadership Training Effectiveness',
    description: 'Gather feedback on leadership training program effectiveness',
    niche: 'Leadership Development',
    targetAudience: ['Managers', 'Team Leads', 'Executives'],
    questions: [
      {
        id: 'q1',
        question: 'How would you rate the overall effectiveness of the leadership training?',
        type: 'rating',
        required: true,
        order: 1,
        options: null
      },
      {
        id: 'q2',
        question: 'Which leadership skills did you find most valuable?',
        type: 'multiple_choice',
        required: true,
        order: 2,
        options: ['Communication', 'Decision Making', 'Team Building', 'Strategic Thinking']
      },
      {
        id: 'q3',
        question: 'What additional topics would you like to see covered in future training?',
        type: 'text',
        required: false,
        order: 3,
        options: null
      }
    ],
    channels: ['email', 'slack'],
    status: 'active',
    priority: 'high',
    tags: ['leadership', 'training', 'feedback'],
    scheduledDate: new Date('2024-01-15'),
    sentDate: new Date('2024-01-15'),
    settings: {
      allowAnonymous: false,
      requireEmail: true,
      maxResponses: null,
      autoClose: false,
      allowMultipleResponses: false
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'poll-sales-001',
    tenantId: demoTenant.id,
    createdBy: 'user-trainer-001',
    title: 'Sales Team Performance Survey',
    description: 'Assess sales team performance and identify improvement areas',
    niche: 'Sales Training',
    targetAudience: ['Sales Representatives', 'Account Managers'],
    questions: [
      {
        id: 'q1',
        question: 'How confident are you in your sales techniques?',
        type: 'rating',
        required: true,
        order: 1,
        options: null
      },
      {
        id: 'q2',
        question: 'Which sales tools do you use most frequently?',
        type: 'multiple_choice',
        required: true,
        order: 2,
        options: ['CRM System', 'Email Templates', 'Social Media', 'Cold Calling Scripts']
      },
      {
        id: 'q3',
        question: 'What challenges do you face in your sales process?',
        type: 'text',
        required: false,
        order: 3,
        options: null
      }
    ],
    channels: ['whatsapp', 'email'],
    status: 'scheduled',
    priority: 'medium',
    tags: ['sales', 'performance', 'assessment'],
    scheduledDate: new Date('2024-01-25'),
    settings: {
      allowAnonymous: false,
      requireEmail: true,
      maxResponses: null,
      autoClose: false,
      allowMultipleResponses: false
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Demo poll responses
const demoResponses = [
  {
    id: 'response-001',
    pollId: 'poll-leadership-001',
    tenantId: demoTenant.id,
    userId: 'user-participant-001',
    userName: 'Participant User',
    userEmail: 'user@trainer.com',
    answers: [
      {
        questionId: 'q1',
        answer: 5,
        questionText: 'How would you rate the overall effectiveness of the leadership training?'
      },
      {
        questionId: 'q2',
        answer: ['Communication', 'Team Building'],
        questionText: 'Which leadership skills did you find most valuable?'
      },
      {
        questionId: 'q3',
        answer: 'More focus on conflict resolution would be helpful.',
        questionText: 'What additional topics would you like to see covered in future training?'
      }
    ],
    completedAt: new Date('2024-01-16'),
    createdAt: new Date('2024-01-16')
  }
];

// Demo feedback
const demoFeedback = [
  {
    id: 'feedback-001',
    pollId: 'poll-leadership-001',
    tenantId: demoTenant.id,
    userId: 'user-participant-001',
    userName: 'Participant User',
    userEmail: 'user@trainer.com',
    rating: 5,
    comment: 'Excellent training program! The practical exercises were very helpful.',
    helpful: 8,
    createdAt: new Date('2024-01-16')
  }
];

async function createTables() {
  logger.info('Connecting to database...');
  logger.info(`Database config: ${JSON.stringify({...dbConfig, password: '***'})}`);
  
  const client = await pool.connect();
  try {
    // Create tenants table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255) UNIQUE,
        subdomain VARCHAR(100) UNIQUE,
        status VARCHAR(50) DEFAULT 'active',
        plan VARCHAR(50) DEFAULT 'basic',
        settings JSONB,
        limits JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        tenant_id VARCHAR(50) REFERENCES tenants(id),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        status VARCHAR(50) DEFAULT 'active',
        department VARCHAR(100),
        position VARCHAR(100),
        permissions TEXT[],
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create polls table
    await client.query(`
      CREATE TABLE IF NOT EXISTS polls (
        id VARCHAR(50) PRIMARY KEY,
        tenant_id VARCHAR(50) REFERENCES tenants(id),
        created_by VARCHAR(50) REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        niche VARCHAR(100),
        target_audience TEXT[],
        questions JSONB NOT NULL,
        channels TEXT[],
        status VARCHAR(50) DEFAULT 'draft',
        priority VARCHAR(50) DEFAULT 'medium',
        tags TEXT[],
        scheduled_date TIMESTAMP,
        sent_date TIMESTAMP,
        settings JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create poll_responses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS poll_responses (
        id VARCHAR(50) PRIMARY KEY,
        poll_id VARCHAR(50) REFERENCES polls(id) ON DELETE CASCADE,
        tenant_id VARCHAR(50) REFERENCES tenants(id),
        user_id VARCHAR(50) REFERENCES users(id),
        user_name VARCHAR(255),
        user_email VARCHAR(255),
        answers JSONB NOT NULL,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create feedback table
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id VARCHAR(50) PRIMARY KEY,
        poll_id VARCHAR(50) REFERENCES polls(id) ON DELETE CASCADE,
        tenant_id VARCHAR(50) REFERENCES tenants(id),
        user_id VARCHAR(50) REFERENCES users(id),
        user_name VARCHAR(255),
        user_email VARCHAR(255),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        helpful INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create audit_log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(50) REFERENCES tenants(id),
        user_id VARCHAR(50) REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50),
        resource_id VARCHAR(50),
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(50) REFERENCES users(id),
        tenant_id VARCHAR(50) REFERENCES tenants(id),
        data JSONB,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    logger.info('✅ Database tables created successfully');
  } catch (error) {
    logger.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function seedDemoData() {
  const client = await pool.connect();
  try {
    // Clear existing data
    logger.info('🗑️ Clearing existing data...');
    await client.query('DELETE FROM audit_log');
    await client.query('DELETE FROM feedback');
    await client.query('DELETE FROM poll_responses');
    await client.query('DELETE FROM polls');
    await client.query('DELETE FROM sessions');
    await client.query('DELETE FROM users');
    await client.query('DELETE FROM tenants');

    // Insert demo tenant
    logger.info('🏢 Creating demo tenant...');
    await client.query(`
      INSERT INTO tenants (id, name, domain, subdomain, status, plan, settings, limits, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      demoTenant.id, demoTenant.name, demoTenant.domain, demoTenant.subdomain,
      demoTenant.status, demoTenant.plan, JSON.stringify(demoTenant.settings),
      JSON.stringify(demoTenant.limits), demoTenant.createdAt, demoTenant.updatedAt
    ]);

    // Insert demo users
    logger.info('👥 Creating demo users...');
    for (const user of demoUsers) {
      const passwordHash = await bcrypt.hash(user.password, 12);
      await client.query(`
        INSERT INTO users (id, tenant_id, first_name, last_name, email, password_hash, role, status, department, position, permissions, last_login_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        user.id, user.tenantId, user.firstName, user.lastName, user.email,
        passwordHash, user.role, user.status, user.department, user.position,
        user.permissions, user.lastLoginAt, user.createdAt, user.updatedAt
      ]);
      logger.info(`✅ Created user: ${user.email} (${user.role})`);
    }

    // Insert demo polls
    logger.info('📊 Creating demo polls...');
    for (const poll of demoPolls) {
      await client.query(`
        INSERT INTO polls (id, tenant_id, created_by, title, description, niche, target_audience, questions, channels, status, priority, tags, scheduled_date, sent_date, settings, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
        poll.id, poll.tenantId, poll.createdBy, poll.title, poll.description,
        poll.niche, poll.targetAudience, JSON.stringify(poll.questions),
        poll.channels, poll.status, poll.priority, poll.tags,
        poll.scheduledDate, poll.sentDate, JSON.stringify(poll.settings),
        poll.createdAt, poll.updatedAt
      ]);
      logger.info(`✅ Created poll: ${poll.title}`);
    }

    // Insert demo responses
    logger.info('📝 Creating demo responses...');
    for (const response of demoResponses) {
      await client.query(`
        INSERT INTO poll_responses (id, poll_id, tenant_id, user_id, user_name, user_email, answers, completed_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        response.id, response.pollId, response.tenantId, response.userId,
        response.userName, response.userEmail, JSON.stringify(response.answers),
        response.completedAt, response.createdAt
      ]);
    }

    // Insert demo feedback
    logger.info('💬 Creating demo feedback...');
    for (const feedback of demoFeedback) {
      await client.query(`
        INSERT INTO feedback (id, poll_id, tenant_id, user_id, user_name, user_email, rating, comment, helpful, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        feedback.id, feedback.pollId, feedback.tenantId, feedback.userId,
        feedback.userName, feedback.userEmail, feedback.rating, feedback.comment,
        feedback.helpful, feedback.createdAt
      ]);
    }

    logger.info('🎉 Demo data seeded successfully!');
    logger.info('📋 Demo Credentials:');
    logger.info('   Super Admin: superadmin@trainer.com / password123');
    logger.info('   Admin: admin@trainer.com / password123');
    logger.info('   Trainer: trainer@trainer.com / password123');
    logger.info('   User: user@trainer.com / password123');

  } catch (error) {
    logger.error('❌ Error seeding demo data:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function runDevSeed() {
  try {
    logger.info('🌱 Starting development database seeding...');
    
    await createTables();
    await seedDemoData();
    
    logger.info('✅ Development seeding completed successfully!');
  } catch (error) {
    logger.error('❌ Development seeding failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runDevSeed();
}

module.exports = { runDevSeed, createTables, seedDemoData }; 