/**
 * Database Seeding Script for Job Board and ATS Data
 * Creates sample jobs, candidates, and applications
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const CandidateProfile = require('../models/CandidateProfile');
const User = require('../models/User');

// Sample data
const sampleJobs = [
  {
    title: 'Senior Full Stack Developer',
    description: 'We are looking for a Senior Full Stack Developer to join our dynamic team. You will be responsible for developing and maintaining web applications using modern technologies including React, Node.js, and MongoDB. The ideal candidate should have 5+ years of experience in full-stack development and a strong understanding of cloud technologies.',
    shortDescription: 'Join our team as a Senior Full Stack Developer and work on cutting-edge web applications.',
    company: {
      name: 'TechCorp Solutions',
      logo: 'https://via.placeholder.com/100x100/4F46E5/FFFFFF?text=TC',
      website: 'https://techcorp.com',
      size: 'medium',
      industry: 'Technology',
      location: {
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        remote: true
      }
    },
    jobType: 'full-time',
    experienceLevel: 'senior',
    salary: {
      min: 120000,
      max: 180000,
      currency: 'USD',
      period: 'yearly'
    },
    location: {
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      remote: true,
      hybrid: false
    },
    requirements: {
      skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS', 'Docker'],
      education: {
        level: 'bachelor',
        field: 'Computer Science'
      },
      experience: {
        years: 5,
        description: '5+ years of full-stack development experience'
      },
      certifications: ['AWS Certified Developer'],
      languages: [
        { name: 'English', proficiency: 'native' }
      ]
    },
    benefits: [
      'Health Insurance',
      'Dental Insurance',
      '401k Matching',
      'Flexible Work Hours',
      'Remote Work Options',
      'Professional Development Budget'
    ],
    perks: [
      'Free Gym Membership',
      'Catered Meals',
      'Stock Options',
      'Unlimited PTO'
    ],
    applicationProcess: {
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      startDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      process: 'multi-stage',
      stages: [
        { name: 'Application Review', description: 'Initial application screening', order: 1 },
        { name: 'Technical Interview', description: 'Coding challenge and technical discussion', order: 2 },
        { name: 'Final Interview', description: 'Cultural fit and final assessment', order: 3 }
      ]
    },
    status: 'active',
    visibility: 'public',
    analytics: {
      views: 245,
      applications: 18,
      shortlisted: 5,
      hired: 0
    },
    tags: ['react', 'nodejs', 'fullstack', 'senior', 'remote'],
    keywords: ['javascript', 'typescript', 'mongodb', 'aws', 'docker'],
    featured: true,
    urgent: false,
    tenantId: 'default'
  },
  {
    title: 'Frontend Developer (React)',
    description: 'Join our frontend team to build beautiful and responsive user interfaces. You will work with React, TypeScript, and modern CSS frameworks to create exceptional user experiences. We are looking for someone passionate about clean code and user-centered design.',
    shortDescription: 'Frontend Developer position focusing on React and modern web technologies.',
    company: {
      name: 'DesignStudio Inc',
      logo: 'https://via.placeholder.com/100x100/10B981/FFFFFF?text=DS',
      website: 'https://designstudio.com',
      size: 'small',
      industry: 'Design',
      location: {
        city: 'New York',
        state: 'NY',
        country: 'USA',
        remote: true
      }
    },
    jobType: 'full-time',
    experienceLevel: 'mid',
    salary: {
      min: 80000,
      max: 120000,
      currency: 'USD',
      period: 'yearly'
    },
    location: {
      city: 'New York',
      state: 'NY',
      country: 'USA',
      remote: true,
      hybrid: true
    },
    requirements: {
      skills: ['React', 'TypeScript', 'CSS', 'HTML', 'JavaScript', 'Figma'],
      education: {
        level: 'bachelor',
        field: 'Computer Science or Design'
      },
      experience: {
        years: 3,
        description: '3+ years of frontend development experience'
      },
      certifications: [],
      languages: [
        { name: 'English', proficiency: 'native' }
      ]
    },
    benefits: [
      'Health Insurance',
      'Dental Insurance',
      'Vision Insurance',
      'Flexible Schedule',
      'Remote Work'
    ],
    perks: [
      'Design Budget',
      'Learning Stipend',
      'Team Retreats'
    ],
    applicationProcess: {
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      process: 'interview',
      stages: [
        { name: 'Portfolio Review', description: 'Review of previous work and projects', order: 1 },
        { name: 'Technical Interview', description: 'React and JavaScript assessment', order: 2 },
        { name: 'Design Challenge', description: 'UI/UX design task', order: 3 }
      ]
    },
    status: 'active',
    visibility: 'public',
    analytics: {
      views: 189,
      applications: 12,
      shortlisted: 3,
      hired: 0
    },
    tags: ['react', 'frontend', 'typescript', 'design', 'remote'],
    keywords: ['javascript', 'css', 'html', 'figma', 'ui'],
    featured: false,
    urgent: false,
    tenantId: 'default'
  },
  {
    title: 'DevOps Engineer',
    description: 'We are seeking a DevOps Engineer to help us scale our infrastructure and improve our deployment processes. You will work with AWS, Docker, Kubernetes, and CI/CD pipelines to ensure our applications run smoothly and efficiently.',
    shortDescription: 'DevOps Engineer position focusing on infrastructure and deployment automation.',
    company: {
      name: 'CloudTech Systems',
      logo: 'https://via.placeholder.com/100x100/F59E0B/FFFFFF?text=CT',
      website: 'https://cloudtech.com',
      size: 'large',
      industry: 'Cloud Computing',
      location: {
        city: 'Seattle',
        state: 'WA',
        country: 'USA',
        remote: true
      }
    },
    jobType: 'full-time',
    experienceLevel: 'senior',
    salary: {
      min: 130000,
      max: 200000,
      currency: 'USD',
      period: 'yearly'
    },
    location: {
      city: 'Seattle',
      state: 'WA',
      country: 'USA',
      remote: true,
      hybrid: false
    },
    requirements: {
      skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'Linux'],
      education: {
        level: 'bachelor',
        field: 'Computer Science or Engineering'
      },
      experience: {
        years: 4,
        description: '4+ years of DevOps or infrastructure experience'
      },
      certifications: ['AWS Certified Solutions Architect', 'Kubernetes Certified Administrator'],
      languages: [
        { name: 'English', proficiency: 'native' }
      ]
    },
    benefits: [
      'Health Insurance',
      'Dental Insurance',
      '401k Matching',
      'Stock Options',
      'Flexible Work Hours',
      'Remote Work'
    ],
    perks: [
      'Home Office Budget',
      'Learning and Development',
      'Conference Attendance',
      'Gym Membership'
    ],
    applicationProcess: {
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      startDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      process: 'assessment',
      stages: [
        { name: 'Initial Screening', description: 'Resume and experience review', order: 1 },
        { name: 'Technical Assessment', description: 'Infrastructure and automation challenge', order: 2 },
        { name: 'System Design Interview', description: 'Architecture and scaling discussion', order: 3 },
        { name: 'Final Interview', description: 'Cultural fit and team collaboration', order: 4 }
      ]
    },
    status: 'active',
    visibility: 'public',
    analytics: {
      views: 156,
      applications: 8,
      shortlisted: 2,
      hired: 0
    },
    tags: ['devops', 'aws', 'kubernetes', 'docker', 'infrastructure'],
    keywords: ['cloud', 'automation', 'ci-cd', 'terraform', 'linux'],
    featured: false,
    urgent: true,
    tenantId: 'default'
  },
  {
    title: 'Data Scientist',
    description: 'Join our data science team to extract insights from large datasets and build machine learning models. You will work with Python, R, SQL, and various ML frameworks to solve complex business problems and drive data-driven decisions.',
    shortDescription: 'Data Scientist position focusing on machine learning and data analysis.',
    company: {
      name: 'DataInsights Corp',
      logo: 'https://via.placeholder.com/100x100/8B5CF6/FFFFFF?text=DI',
      website: 'https://datainsights.com',
      size: 'medium',
      industry: 'Data Analytics',
      location: {
        city: 'Boston',
        state: 'MA',
        country: 'USA',
        remote: true
      }
    },
    jobType: 'full-time',
    experienceLevel: 'mid',
    salary: {
      min: 95000,
      max: 140000,
      currency: 'USD',
      period: 'yearly'
    },
    location: {
      city: 'Boston',
      state: 'MA',
      country: 'USA',
      remote: true,
      hybrid: true
    },
    requirements: {
      skills: ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics', 'Pandas', 'Scikit-learn'],
      education: {
        level: 'master',
        field: 'Data Science, Statistics, or Computer Science'
      },
      experience: {
        years: 3,
        description: '3+ years of data science or analytics experience'
      },
      certifications: ['Google Data Analytics Certificate'],
      languages: [
        { name: 'English', proficiency: 'native' }
      ]
    },
    benefits: [
      'Health Insurance',
      'Dental Insurance',
      '401k Matching',
      'Flexible Schedule',
      'Remote Work'
    ],
    perks: [
      'Research Budget',
      'Conference Attendance',
      'Learning Stipend',
      'Data Science Tools'
    ],
    applicationProcess: {
      deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      startDate: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000),
      process: 'multi-stage',
      stages: [
        { name: 'Resume Review', description: 'Initial screening of qualifications', order: 1 },
        { name: 'Technical Interview', description: 'Data science and statistics assessment', order: 2 },
        { name: 'Case Study', description: 'Real-world data analysis project', order: 3 },
        { name: 'Final Interview', description: 'Team fit and communication assessment', order: 4 }
      ]
    },
    status: 'active',
    visibility: 'public',
    analytics: {
      views: 203,
      applications: 15,
      shortlisted: 4,
      hired: 0
    },
    tags: ['data-science', 'python', 'machine-learning', 'analytics', 'remote'],
    keywords: ['statistics', 'sql', 'pandas', 'scikit-learn', 'r'],
    featured: true,
    urgent: false,
    tenantId: 'default'
  },
  {
    title: 'Product Manager',
    description: 'We are looking for a Product Manager to lead the development of our core products. You will work closely with engineering, design, and business teams to define product strategy, prioritize features, and ensure successful product delivery.',
    shortDescription: 'Product Manager position to lead product development and strategy.',
    company: {
      name: 'InnovateTech',
      logo: 'https://via.placeholder.com/100x100/EF4444/FFFFFF?text=IT',
      website: 'https://innovatetech.com',
      size: 'startup',
      industry: 'Technology',
      location: {
        city: 'Austin',
        state: 'TX',
        country: 'USA',
        remote: true
      }
    },
    jobType: 'full-time',
    experienceLevel: 'senior',
    salary: {
      min: 110000,
      max: 160000,
      currency: 'USD',
      period: 'yearly'
    },
    location: {
      city: 'Austin',
      state: 'TX',
      country: 'USA',
      remote: true,
      hybrid: false
    },
    requirements: {
      skills: ['Product Management', 'Agile', 'User Research', 'Analytics', 'Communication', 'Leadership'],
      education: {
        level: 'bachelor',
        field: 'Business, Engineering, or related field'
      },
      experience: {
        years: 5,
        description: '5+ years of product management experience'
      },
      certifications: ['Certified Scrum Product Owner', 'Google Analytics Certified'],
      languages: [
        { name: 'English', proficiency: 'native' }
      ]
    },
    benefits: [
      'Health Insurance',
      'Dental Insurance',
      'Stock Options',
      'Flexible Schedule',
      'Remote Work'
    ],
    perks: [
      'Equity Participation',
      'Professional Development',
      'Team Building Events',
      'Startup Culture'
    ],
    applicationProcess: {
      deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      startDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
      process: 'interview',
      stages: [
        { name: 'Initial Interview', description: 'Product management experience and approach', order: 1 },
        { name: 'Case Study', description: 'Product strategy and prioritization exercise', order: 2 },
        { name: 'Stakeholder Interview', description: 'Cross-functional collaboration assessment', order: 3 }
      ]
    },
    status: 'active',
    visibility: 'public',
    analytics: {
      views: 167,
      applications: 9,
      shortlisted: 3,
      hired: 0
    },
    tags: ['product-management', 'strategy', 'leadership', 'startup', 'remote'],
    keywords: ['agile', 'user-research', 'analytics', 'communication', 'leadership'],
    featured: false,
    urgent: false,
    tenantId: 'default'
  }
];

const sampleUsers = [
  {
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    roles: ['user'],
    tenantId: new mongoose.Types.ObjectId()
  },
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@example.com',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    roles: ['user'],
    tenantId: new mongoose.Types.ObjectId()
  },
  {
    firstName: 'Mike',
    lastName: 'Chen',
    email: 'mike.chen@example.com',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    roles: ['user'],
    tenantId: new mongoose.Types.ObjectId()
  },
  {
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@example.com',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    roles: ['user'],
    tenantId: new mongoose.Types.ObjectId()
  },
  {
    firstName: 'Alex',
    lastName: 'Rodriguez',
    email: 'alex.rodriguez@example.com',
    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    roles: ['user'],
    tenantId: new mongoose.Types.ObjectId()
  }
];

const sampleCandidateProfiles = [
  {
    personalInfo: {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '+1-555-0123',
      location: {
        city: 'San Francisco',
        state: 'CA',
        country: 'USA'
      }
    },
    professionalSummary: {
      headline: 'Senior Full Stack Developer with 8+ years experience',
      summary: 'Passionate developer with expertise in React, Node.js, and cloud technologies. Led multiple successful projects and teams.',
      currentStatus: 'employed',
      openToWork: true
    },
    experience: [
      {
        company: 'TechStart Inc',
        position: 'Senior Full Stack Developer',
        startDate: new Date('2020-01-01'),
        endDate: null,
        isCurrent: true,
        description: 'Leading development of microservices architecture and mentoring junior developers.',
        achievements: ['Reduced API response time by 40%', 'Led team of 5 developers'],
        skills: ['React', 'Node.js', 'AWS', 'Docker']
      }
    ],
    skills: {
      technical: [
        { name: 'React', level: 'expert', years: 6 },
        { name: 'Node.js', level: 'expert', years: 5 },
        { name: 'TypeScript', level: 'advanced', years: 4 },
        { name: 'AWS', level: 'advanced', years: 3 }
      ]
    },
    analytics: {
      profileViews: 45,
      lastActive: new Date(),
      profileCompleteness: 85
    },
    atsData: {
      overallScore: 92,
      skillsScore: 88,
      experienceScore: 95,
      educationScore: 85,
      aiInsights: {
        strengths: ['Strong technical skills', 'Leadership experience', 'Cloud expertise'],
        weaknesses: ['Limited mobile development', 'No ML experience'],
        recommendations: ['Consider mobile development courses', 'Learn machine learning basics']
      },
      quality: 'high'
    },
    status: 'active',
    tenantId: 'default'
  },
  {
    personalInfo: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+1-555-0124',
      location: {
        city: 'New York',
        state: 'NY',
        country: 'USA'
      }
    },
    professionalSummary: {
      headline: 'Frontend Developer specializing in React and UI/UX',
      summary: 'Creative frontend developer with a passion for beautiful user interfaces and exceptional user experiences.',
      currentStatus: 'employed',
      openToWork: true
    },
    experience: [
      {
        company: 'DesignCo',
        position: 'Frontend Developer',
        startDate: new Date('2019-06-01'),
        endDate: null,
        isCurrent: true,
        description: 'Building responsive web applications and collaborating with design team.',
        achievements: ['Improved page load speed by 50%', 'Implemented design system'],
        skills: ['React', 'TypeScript', 'CSS', 'Figma']
      }
    ],
    skills: {
      technical: [
        { name: 'React', level: 'advanced', years: 4 },
        { name: 'TypeScript', level: 'advanced', years: 3 },
        { name: 'CSS', level: 'expert', years: 5 },
        { name: 'Figma', level: 'advanced', years: 2 }
      ]
    },
    analytics: {
      profileViews: 32,
      lastActive: new Date(),
      profileCompleteness: 78
    },
    atsData: {
      overallScore: 85,
      skillsScore: 90,
      experienceScore: 80,
      educationScore: 85,
      aiInsights: {
        strengths: ['Strong design skills', 'Modern frontend technologies', 'User-focused approach'],
        weaknesses: ['Limited backend knowledge', 'No testing experience'],
        recommendations: ['Learn backend basics', 'Study testing frameworks']
      },
      quality: 'high'
    },
    status: 'active',
    tenantId: 'default'
  }
];

async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URL || 'mongodb://localhost:27017/luxgen';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

async function clearExistingData() {
  try {
    console.log('🧹 Clearing existing data...');
    await Job.deleteMany({});
    await JobApplication.deleteMany({});
    await CandidateProfile.deleteMany({});
    await User.deleteMany({ email: { $in: sampleUsers.map(u => u.email) } });
    console.log('✅ Existing data cleared');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  }
}

async function seedUsers() {
  try {
    console.log('👥 Creating users...');
    const users = await User.insertMany(sampleUsers);
    console.log(`✅ Created ${users.length} users`);
    return users;
  } catch (error) {
    console.error('❌ Error creating users:', error);
    return [];
  }
}

async function seedJobs(users) {
  try {
    console.log('💼 Creating jobs...');
    const jobsWithPostedBy = sampleJobs.map((job, index) => ({
      ...job,
      postedBy: users[index % users.length]._id,
      publishedAt: new Date()
    }));
    const jobs = await Job.insertMany(jobsWithPostedBy);
    console.log(`✅ Created ${jobs.length} jobs`);
    return jobs;
  } catch (error) {
    console.error('❌ Error creating jobs:', error);
    return [];
  }
}

async function seedCandidateProfiles(users) {
  try {
    console.log('👤 Creating candidate profiles...');
    const profilesWithUsers = sampleCandidateProfiles.map((profile, index) => ({
      ...profile,
      userId: users[index]._id
    }));
    const profiles = await CandidateProfile.insertMany(profilesWithUsers);
    console.log(`✅ Created ${profiles.length} candidate profiles`);
    return profiles;
  } catch (error) {
    console.error('❌ Error creating candidate profiles:', error);
    return [];
  }
}

async function seedApplications(jobs, users, candidateProfiles) {
  try {
    console.log('📝 Creating job applications...');
    const applications = [];
    
    // Create some applications
    for (let i = 0; i < 3; i++) {
      const job = jobs[i % jobs.length];
      const candidate = users[i % users.length];
      const profile = candidateProfiles[i % candidateProfiles.length];
      
      const application = new JobApplication({
        jobId: job._id,
        candidateId: candidate._id,
        tenantId: 'default',
        status: ['applied', 'under-review', 'shortlisted'][i],
        candidateProfile: profile.toObject(),
        process: {
          appliedAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000)
        },
        atsData: {
          score: 75 + (i * 5),
          ranking: i + 1,
          screening: {
            passed: i > 0,
            score: 70 + (i * 10)
          },
          aiAnalysis: {
            skillsMatch: 80 + (i * 5),
            experienceMatch: 75 + (i * 5),
            overallFit: 78 + (i * 3)
          },
          priority: ['medium', 'high', 'low'][i]
        }
      });
      
      applications.push(application);
    }
    
    await JobApplication.insertMany(applications);
    console.log(`✅ Created ${applications.length} job applications`);
  } catch (error) {
    console.error('❌ Error creating applications:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Starting database seeding...');
    
    await connectToDatabase();
    await clearExistingData();
    
    const users = await seedUsers();
    const jobs = await seedJobs(users);
    const candidateProfiles = await seedCandidateProfiles(users);
    await seedApplications(jobs, users, candidateProfiles);
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Jobs: ${jobs.length}`);
    console.log(`- Candidate Profiles: ${candidateProfiles.length}`);
    console.log(`- Applications: 3`);
    
    console.log('\n🔗 Test the API endpoints:');
    console.log('- GET /api/v1/jobs - View all jobs');
    console.log('- GET /api/v1/ats/candidates - View candidates');
    console.log('- GET /api/v1/ats/dashboard - View ATS dashboard');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seeding script
if (require.main === module) {
  main();
}

module.exports = { main };
