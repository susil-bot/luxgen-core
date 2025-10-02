const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const TenantConfiguration = require('../models/TenantSchema');
const BrandIdentity = require('../models/BrandIdentity');
const TrainingCourse = require('../models/TrainingCourse');
const TrainingModule = require('../models/TrainingModule');
const TrainingSession = require('../models/TrainingSession');
const TrainingAssessment = require('../models/TrainingAssessment');
const Presentation = require('../models/Presentation');
const Poll = require('../models/Poll');
const Group = require('../models/Group');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const CandidateProfile = require('../models/CandidateProfile');

class LuxgenDatabaseSeeder {
  constructor() {
    this.tenantId = 'luxgen-main';
    this.seedData = {
      users: [],
      tenants: [],
      posts: [],
      jobs: [],
      conversations: []
    };
  }

  async connect() {
    try {
      const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/luxgen';
      await mongoose.connect(MONGODB_URL);
      console.log('✅ Connected to luxgen database');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from database');
    } catch (error) {
      console.error('❌ Error disconnecting:', error.message);
    }
  }

  async clearDatabase() {
    console.log('🧹 Clearing existing data...');
    
    const collections = [
      'users', 'tenants', 'tenantconfigurations', 'brandidentities',
      'trainingcourses', 'trainingmodules', 'trainingsessions', 'trainingassessments',
      'presentations', 'polls', 'groups', 'notifications', 'auditlogs',
      'posts', 'comments', 'likes', 'messages', 'conversations',
      'jobs', 'jobapplications', 'candidateprofiles', 'sessions'
    ];

    for (const collectionName of collections) {
      try {
        await mongoose.connection.db.collection(collectionName).deleteMany({});
        console.log(`✅ Cleared ${collectionName}`);
      } catch (error) {
        console.log(`⚠️  Could not clear ${collectionName}:`, error.message);
      }
    }
  }

  async createTenants() {
    console.log('🏢 Creating tenants...');
    
    const tenants = [
      {
        tenantId: this.tenantId,
        slug: 'luxgen',
        name: 'LuxGen Platform',
        domain: 'luxgen.com',
        description: 'Main LuxGen training platform',
        settings: {
          features: {
            training: true,
            jobBoard: true,
            socialFeed: true,
            messaging: true,
            analytics: true
          },
          limits: {
            maxUsers: 1000,
            maxCourses: 100,
            maxStorage: '10GB'
          },
          branding: {
            primaryColor: '#3B82F6',
            secondaryColor: '#1E40AF',
            logo: '/assets/logo.png'
          }
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tenantId: 'demo-tenant',
        slug: 'demo',
        name: 'Demo Company',
        domain: 'demo.luxgen.com',
        description: 'Demo tenant for testing',
        settings: {
          features: {
            training: true,
            jobBoard: false,
            socialFeed: true,
            messaging: true,
            analytics: false
          },
          limits: {
            maxUsers: 100,
            maxCourses: 20,
            maxStorage: '2GB'
          },
          branding: {
            primaryColor: '#10B981',
            secondaryColor: '#059669',
            logo: '/assets/demo-logo.png'
          }
        },
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const tenantData of tenants) {
      const tenant = new Tenant(tenantData);
      await tenant.save();
      this.seedData.tenants.push(tenant);
      console.log(`✅ Created tenant: ${tenant.name}`);
    }
  }

  async createUsers() {
    console.log('👥 Creating users...');
    
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const users = [
      {
        tenantId: this.tenantId,
        firstName: 'John',
        lastName: 'Admin',
        email: 'admin@luxgen.com',
        password: hashedPassword,
        roles: ['super_admin'],
        status: 'active',
        avatar: '/api/placeholder/100/100',
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'en'
        },
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tenantId: this.tenantId,
        firstName: 'Sarah',
        lastName: 'Trainer',
        email: 'sarah@luxgen.com',
        password: hashedPassword,
        roles: ['trainer'],
        status: 'active',
        avatar: '/api/placeholder/100/100',
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'en'
        },
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tenantId: this.tenantId,
        firstName: 'Mike',
        lastName: 'User',
        email: 'mike@luxgen.com',
        password: hashedPassword,
        roles: ['user'],
        status: 'active',
        avatar: '/api/placeholder/100/100',
        preferences: {
          theme: 'dark',
          notifications: false,
          language: 'en'
        },
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tenantId: 'demo-tenant',
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@demo.com',
        password: hashedPassword,
        roles: ['user'],
        status: 'active',
        avatar: '/api/placeholder/100/100',
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'en'
        },
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      this.seedData.users.push(user);
      console.log(`✅ Created user: ${user.firstName} ${user.lastName}`);
    }
  }

  async createTrainingCourses() {
    console.log('📚 Creating training courses...');
    
    const courses = [
      {
        tenantId: this.tenantId,
        title: 'React Fundamentals',
        description: 'Learn the basics of React development',
        instructorId: this.seedData.users[1]._id, // Sarah Trainer
        category: 'Web Development',
        difficulty: 'beginner',
        duration: 120,
        status: 'published',
        thumbnail: '/api/placeholder/300/200',
        tags: ['react', 'javascript', 'frontend'],
        learningObjectives: [
          'Understand React components',
          'Learn JSX syntax',
          'Handle state and props'
        ],
        prerequisites: ['Basic JavaScript knowledge'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tenantId: this.tenantId,
        title: 'Node.js Backend Development',
        description: 'Build robust backend applications with Node.js',
        instructorId: this.seedData.users[1]._id,
        category: 'Backend Development',
        difficulty: 'intermediate',
        duration: 180,
        status: 'published',
        thumbnail: '/api/placeholder/300/200',
        tags: ['nodejs', 'backend', 'javascript'],
        learningObjectives: [
          'Set up Node.js environment',
          'Create RESTful APIs',
          'Handle database operations'
        ],
        prerequisites: ['JavaScript fundamentals', 'Basic HTTP knowledge'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const courseData of courses) {
      const course = new TrainingCourse(courseData);
      await course.save();
      console.log(`✅ Created course: ${course.title}`);
    }
  }

  async createFeedPosts() {
    console.log('📱 Creating feed posts...');
    
    const posts = [
      {
        tenantId: this.tenantId,
        author: {
          userId: this.seedData.users[1]._id,
          name: `${this.seedData.users[1].firstName} ${this.seedData.users[1].lastName}`,
          title: 'Senior Trainer at LuxGen',
          avatar: this.seedData.users[1].avatar,
          verified: true
        },
        content: {
          text: 'Just finished an amazing React training session! The students were so engaged and asked great questions. Love seeing the "aha!" moments when concepts click! 🚀\n\n#React #Training #WebDevelopment',
          images: [],
          videos: [],
          links: []
        },
        engagement: {
          likes: 12,
          comments: 3,
          shares: 1,
          views: 45
        },
        visibility: {
          type: 'public',
          audience: []
        },
        hashtags: ['React', 'Training', 'WebDevelopment'],
        mentions: [],
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tenantId: this.tenantId,
        author: {
          userId: this.seedData.users[2]._id,
          name: `${this.seedData.users[2].firstName} ${this.seedData.users[2].lastName}`,
          title: 'Software Developer',
          avatar: this.seedData.users[2].avatar,
          verified: false
        },
        content: {
          text: 'Excited to start my learning journey with LuxGen! The platform looks amazing and I can\'t wait to dive into the React course. 🎓\n\n#Learning #React #NewBeginnings',
          images: [],
          videos: [],
          links: []
        },
        engagement: {
          likes: 8,
          comments: 2,
          shares: 1,
          views: 32
        },
        visibility: {
          type: 'public',
          audience: []
        },
        hashtags: ['Learning', 'React', 'NewBeginnings'],
        mentions: [],
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const postData of posts) {
      const post = new Post(postData);
      await post.save();
      this.seedData.posts.push(post);
      console.log(`✅ Created post by ${post.author.name}`);
    }
  }

  async createJobPostings() {
    console.log('💼 Creating job postings...');
    
    const jobs = [
      {
        tenantId: this.tenantId,
        title: 'Senior React Developer',
        company: 'TechCorp Inc.',
        location: 'San Francisco, CA',
        description: 'We are looking for a senior React developer to join our team. You will be responsible for building and maintaining our web applications.',
        requirements: [
          '5+ years of React experience',
          'Strong JavaScript skills',
          'Experience with Redux',
          'Knowledge of testing frameworks'
        ],
        responsibilities: [
          'Develop and maintain React applications',
          'Collaborate with design team',
          'Write clean, maintainable code',
          'Mentor junior developers'
        ],
        benefits: [
          'Competitive salary',
          'Health insurance',
          '401k matching',
          'Flexible work hours'
        ],
        salary: {
          min: 120000,
          max: 160000,
          currency: 'USD',
          isNegotiable: true
        },
        employmentType: 'full-time',
        experienceLevel: 'senior',
        industry: 'Technology',
        skillsRequired: ['React', 'JavaScript', 'Redux', 'Testing'],
        status: 'open',
        postedBy: this.seedData.users[0]._id, // Admin
        applicants: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tenantId: this.tenantId,
        title: 'Frontend Developer',
        company: 'StartupXYZ',
        location: 'Remote',
        description: 'Join our fast-growing startup as a frontend developer. Work on cutting-edge projects and make a real impact.',
        requirements: [
          '3+ years of frontend experience',
          'React or Vue.js experience',
          'CSS/SCSS expertise',
          'Git workflow knowledge'
        ],
        responsibilities: [
          'Build responsive web applications',
          'Optimize for performance',
          'Collaborate with backend team',
          'Participate in code reviews'
        ],
        benefits: [
          'Remote work',
          'Stock options',
          'Learning budget',
          'Flexible schedule'
        ],
        salary: {
          min: 80000,
          max: 120000,
          currency: 'USD',
          isNegotiable: true
        },
        employmentType: 'full-time',
        experienceLevel: 'mid-level',
        industry: 'Technology',
        skillsRequired: ['React', 'Vue.js', 'CSS', 'JavaScript'],
        status: 'open',
        postedBy: this.seedData.users[0]._id,
        applicants: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const jobData of jobs) {
      const job = new Job(jobData);
      await job.save();
      this.seedData.jobs.push(job);
      console.log(`✅ Created job: ${job.title} at ${job.company}`);
    }
  }

  async createConversations() {
    console.log('💬 Creating conversations...');
    
    const conversations = [
      {
        tenantId: this.tenantId,
        participants: [
          {
            userId: this.seedData.users[1]._id,
            name: `${this.seedData.users[1].firstName} ${this.seedData.users[1].lastName}`,
            avatar: this.seedData.users[1].avatar,
            role: 'admin',
            joinedAt: new Date(),
            lastReadAt: new Date()
          },
          {
            userId: this.seedData.users[2]._id,
            name: `${this.seedData.users[2].firstName} ${this.seedData.users[2].lastName}`,
            avatar: this.seedData.users[2].avatar,
            role: 'member',
            joinedAt: new Date(),
            lastReadAt: new Date()
          }
        ],
        title: 'Training Discussion',
        type: 'direct',
        lastMessage: {
          content: 'Thanks for the great training session!',
          sender: `${this.seedData.users[2].firstName} ${this.seedData.users[2].lastName}`,
          timestamp: new Date()
        },
        settings: {
          notifications: true,
          archive: false
        },
        metadata: {
          createdBy: this.seedData.users[1]._id,
          source: 'training'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const conversationData of conversations) {
      const conversation = new Conversation(conversationData);
      await conversation.save();
      this.seedData.conversations.push(conversation);
      console.log(`✅ Created conversation: ${conversation.title}`);
    }
  }

  async createMessages() {
    console.log('📨 Creating messages...');
    
    if (this.seedData.conversations.length === 0) {
      console.log('⚠️  No conversations found, skipping message creation');
      return;
    }

    const messages = [
      {
        tenantId: this.tenantId,
        conversationId: this.seedData.conversations[0]._id,
        sender: {
          userId: this.seedData.users[1]._id,
          name: `${this.seedData.users[1].firstName} ${this.seedData.users[1].lastName}`,
          avatar: this.seedData.users[1].avatar
        },
        content: {
          text: 'Welcome to the React training! I\'m excited to help you learn.'
        },
        recipients: [
          {
            userId: this.seedData.users[2]._id,
            readAt: new Date(),
            deliveredAt: new Date()
          }
        ],
        status: 'read',
        messageType: 'text',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        tenantId: this.tenantId,
        conversationId: this.seedData.conversations[0]._id,
        sender: {
          userId: this.seedData.users[2]._id,
          name: `${this.seedData.users[2].firstName} ${this.seedData.users[2].lastName}`,
          avatar: this.seedData.users[2].avatar
        },
        content: {
          text: 'Thanks for the great training session!'
        },
        recipients: [
          {
            userId: this.seedData.users[1]._id,
            readAt: new Date(),
            deliveredAt: new Date()
          }
        ],
        status: 'read',
        messageType: 'text',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const messageData of messages) {
      const message = new Message(messageData);
      await message.save();
      console.log(`✅ Created message from ${message.sender.name}`);
    }
  }

  async createIndexes() {
    console.log('🔧 Creating database indexes...');
    
    const indexConfigurations = {
      users: [
        { email: 1, tenantId: 1 },
        { tenantId: 1, role: 1 },
        { tenantId: 1, status: 1 },
        { createdAt: -1 }
      ],
      tenants: [
        { slug: 1 },
        { domain: 1 },
        { status: 1 },
        { createdAt: -1 }
      ],
      posts: [
        { tenantId: 1, createdAt: -1 },
        { tenantId: 1, 'author.userId': 1 },
        { tenantId: 1, status: 1 },
        { hashtags: 1 },
        { content: 'text' }
      ],
      jobs: [
        { tenantId: 1, status: 1 },
        { tenantId: 1, postedBy: 1 },
        { title: 'text', description: 'text' },
        { skillsRequired: 1 }
      ],
      conversations: [
        { tenantId: 1, 'participants.userId': 1 },
        { tenantId: 1, updatedAt: -1 }
      ],
      messages: [
        { tenantId: 1, conversationId: 1, createdAt: -1 },
        { tenantId: 1, 'sender.userId': 1 }
      ]
    };
    
    for (const [collectionName, indexes] of Object.entries(indexConfigurations)) {
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        
        for (const index of indexes) {
          try {
            await collection.createIndex(index);
            console.log(`✅ Created index for ${collectionName}:`, index);
          } catch (error) {
            console.log(`⚠️  Index creation failed for ${collectionName}:`, error.message);
          }
        }
      } catch (error) {
        console.log(`⚠️  Collection ${collectionName} not found for indexing`);
      }
    }
  }

  async runSeeding() {
    try {
      console.log('🌱 Starting LuxGen database seeding...\n');
      
      // Connect to database
      await this.connect();
      
      // Clear existing data
      await this.clearDatabase();
      
      // Create data
      await this.createTenants();
      await this.createUsers();
      await this.createTrainingCourses();
      await this.createFeedPosts();
      await this.createJobPostings();
      await this.createConversations();
      await this.createMessages();
      
      // Create indexes
      await this.createIndexes();
      
      console.log('\n🎉 Database seeding completed successfully!');
      console.log('\n📊 Summary:');
      console.log(`- Tenants: ${this.seedData.tenants.length}`);
      console.log(`- Users: ${this.seedData.users.length}`);
      console.log(`- Posts: ${this.seedData.posts.length}`);
      console.log(`- Jobs: ${this.seedData.jobs.length}`);
      console.log(`- Conversations: ${this.seedData.conversations.length}`);
      
    } catch (error) {
      console.error('\n❌ Seeding failed:', error.message);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Run seeding if called directly
if (require.main === module) {
  const seeder = new LuxgenDatabaseSeeder();
  seeder.runSeeding()
    .then(() => {
      console.log('✅ Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding process failed:', error);
      process.exit(1);
    });
}

module.exports = LuxgenDatabaseSeeder;
