/**
 * Seed Job Posts Script
 * Creates 50 sample job posts for the LuxGen platform
 */

const mongoose = require('mongoose');
const Job = require('../models/Job');
const User = require('../models/User');

// Sample job data
const jobTitles = [
  'Senior React Developer',
  'Full Stack Engineer',
  'Frontend Developer',
  'Backend Developer',
  'DevOps Engineer',
  'Data Scientist',
  'Machine Learning Engineer',
  'Product Manager',
  'UX/UI Designer',
  'Mobile App Developer',
  'Cloud Architect',
  'Security Engineer',
  'QA Engineer',
  'Technical Writer',
  'Sales Engineer',
  'Marketing Manager',
  'Content Creator',
  'Business Analyst',
  'Project Manager',
  'Scrum Master',
  'Database Administrator',
  'System Administrator',
  'Network Engineer',
  'Cybersecurity Specialist',
  'AI Research Scientist',
  'Blockchain Developer',
  'Game Developer',
  'AR/VR Developer',
  'IoT Engineer',
  'Robotics Engineer',
  'Digital Marketing Specialist',
  'SEO Specialist',
  'Social Media Manager',
  'Graphic Designer',
  'Video Editor',
  'Photographer',
  'Copywriter',
  'Translator',
  'Customer Success Manager',
  'Account Manager',
  'HR Specialist',
  'Recruiter',
  'Financial Analyst',
  'Operations Manager',
  'Supply Chain Manager',
  'Logistics Coordinator',
  'Warehouse Manager',
  'Quality Assurance Manager',
  'Compliance Officer',
  'Legal Counsel'
];

const companies = [
  'TechCorp Solutions',
  'InnovateTech Inc',
  'Digital Dynamics',
  'CloudFirst Systems',
  'DataDriven Labs',
  'AI Innovations',
  'Blockchain Technologies',
  'CyberSec Pro',
  'DevOps Masters',
  'MobileFirst Apps',
  'WebCraft Studios',
  'DesignHub Creative',
  'MarketingMax Agency',
  'ContentCraft Studio',
  'SalesForce Solutions',
  'BusinessBoost Inc',
  'ProjectPro Management',
  'AgileWorks Team',
  'DatabaseExperts',
  'SystemSolutions Pro',
  'NetworkNinjas',
  'SecurityFirst Corp',
  'AIFuture Labs',
  'BlockchainBuilders',
  'GameDev Studios',
  'ARVR Innovations',
  'IoT Solutions',
  'RoboticsWorks',
  'DigitalMarketing Pro',
  'SEO Masters',
  'SocialMedia Experts',
  'DesignStudio Pro',
  'VideoCraft Studio',
  'PhotoPro Services',
  'CopyCraft Writers',
  'TranslationPro',
  'CustomerSuccess Hub',
  'AccountManagement Pro',
  'HR Solutions',
  'RecruitmentExperts',
  'FinancialAnalytics',
  'OperationsPro',
  'SupplyChain Solutions',
  'LogisticsPro',
  'WarehouseManagement',
  'QualityAssurance Pro',
  'ComplianceExperts',
  'LegalSolutions'
];

const locations = [
  'San Francisco, CA',
  'New York, NY',
  'Seattle, WA',
  'Austin, TX',
  'Boston, MA',
  'Chicago, IL',
  'Los Angeles, CA',
  'Denver, CO',
  'Portland, OR',
  'Miami, FL',
  'Atlanta, GA',
  'Dallas, TX',
  'Phoenix, AZ',
  'Las Vegas, NV',
  'Salt Lake City, UT',
  'Remote',
  'Hybrid',
  'London, UK',
  'Toronto, Canada',
  'Berlin, Germany',
  'Amsterdam, Netherlands',
  'Dublin, Ireland',
  'Sydney, Australia',
  'Singapore',
  'Tokyo, Japan',
  'Mumbai, India',
  'Bangalore, India',
  'Delhi, India',
  'Pune, India',
  'Chennai, India'
];

const jobTypes = ['full-time', 'part-time', 'contract', 'internship', 'freelance'];
const experienceLevels = ['entry', 'mid', 'senior', 'lead', 'executive'];
const remoteOptions = ['on-site', 'remote', 'hybrid'];
const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'];

const skills = [
  'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue.js',
  'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes',
  'Git', 'Agile', 'Scrum', 'Machine Learning', 'AI', 'Data Science', 'DevOps',
  'TypeScript', 'GraphQL', 'REST API', 'Microservices', 'Redis', 'Elasticsearch',
  'Jenkins', 'CI/CD', 'Terraform', 'Ansible', 'Linux', 'Windows', 'macOS',
  'iOS', 'Android', 'Flutter', 'React Native', 'Swift', 'Kotlin', 'C++',
  'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Scala', 'Haskell', 'Clojure',
  'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Matplotlib',
  'Tableau', 'Power BI', 'Excel', 'Google Analytics', 'Adobe Creative Suite',
  'Figma', 'Sketch', 'InVision', 'Zeplin', 'Principle', 'After Effects',
  'Photoshop', 'Illustrator', 'InDesign', 'Premiere Pro', 'Final Cut Pro',
  'WordPress', 'Drupal', 'Joomla', 'Shopify', 'Magento', 'WooCommerce',
  'Salesforce', 'HubSpot', 'Marketo', 'Pardot', 'Mailchimp', 'Constant Contact',
  'Google Ads', 'Facebook Ads', 'LinkedIn Ads', 'Twitter Ads', 'TikTok Ads',
  'SEO', 'SEM', 'PPC', 'Content Marketing', 'Social Media Marketing',
  'Email Marketing', 'Affiliate Marketing', 'Influencer Marketing', 'PR',
  'Event Planning', 'Project Management', 'Agile', 'Scrum', 'Kanban',
  'Jira', 'Confluence', 'Slack', 'Microsoft Teams', 'Zoom', 'Google Meet',
  'Trello', 'Asana', 'Monday.com', 'Notion', 'Airtable', 'ClickUp'
];

const requirements = [
  'Bachelor\'s degree in Computer Science or related field',
  '3+ years of experience in software development',
  'Strong problem-solving skills',
  'Excellent communication skills',
  'Ability to work in a team environment',
  'Experience with version control systems',
  'Knowledge of software development lifecycle',
  'Understanding of database design principles',
  'Experience with cloud platforms',
  'Familiarity with agile methodologies',
  'Strong analytical skills',
  'Attention to detail',
  'Ability to meet deadlines',
  'Experience with testing frameworks',
  'Knowledge of security best practices',
  'Understanding of performance optimization',
  'Experience with API development',
  'Knowledge of microservices architecture',
  'Familiarity with containerization',
  'Experience with CI/CD pipelines',
  'Understanding of DevOps practices',
  'Knowledge of monitoring and logging',
  'Experience with infrastructure as code',
  'Understanding of scalability principles',
  'Knowledge of data structures and algorithms',
  'Experience with machine learning frameworks',
  'Understanding of statistical analysis',
  'Knowledge of data visualization tools',
  'Experience with big data technologies',
  'Understanding of data modeling',
  'Knowledge of ETL processes',
  'Experience with data warehousing',
  'Understanding of data governance',
  'Knowledge of data privacy regulations',
  'Experience with user research',
  'Understanding of UX principles',
  'Knowledge of design systems',
  'Experience with prototyping tools',
  'Understanding of accessibility standards',
  'Knowledge of responsive design',
  'Experience with cross-browser compatibility',
  'Understanding of performance optimization',
  'Knowledge of SEO best practices',
  'Experience with analytics tools',
  'Understanding of conversion optimization',
  'Knowledge of A/B testing',
  'Experience with marketing automation',
  'Understanding of customer journey mapping',
  'Knowledge of persona development',
  'Experience with competitive analysis'
];

const benefits = [
  'Competitive salary',
  'Health insurance',
  'Dental insurance',
  'Vision insurance',
  'Life insurance',
  'Disability insurance',
  '401(k) matching',
  'Flexible working hours',
  'Remote work options',
  'Paid time off',
  'Sick leave',
  'Maternity/paternity leave',
  'Professional development budget',
  'Conference attendance',
  'Training programs',
  'Certification support',
  'Gym membership',
  'Wellness programs',
  'Mental health support',
  'Employee assistance program',
  'Stock options',
  'Performance bonuses',
  'Annual salary reviews',
  'Career advancement opportunities',
  'Mentorship programs',
  'Team building activities',
  'Company events',
  'Free meals',
  'Snacks and beverages',
  'Transportation allowance',
  'Parking allowance',
  'Home office setup',
  'Equipment allowance',
  'Internet allowance',
  'Phone allowance',
  'Laptop/computer',
  'Software licenses',
  'Cloud services',
  'Development tools',
  'Design tools',
  'Marketing tools',
  'Analytics tools',
  'Project management tools',
  'Communication tools',
  'Collaboration tools'
];

// Generate random job data
const generateJobData = (index) => {
  const title = jobTitles[index % jobTitles.length];
  const company = companies[index % companies.length];
  const location = locations[Math.floor(Math.random() * locations.length)];
  const type = jobTypes[Math.floor(Math.random() * jobTypes.length)];
  const experience = experienceLevels[Math.floor(Math.random() * experienceLevels.length)];
  const remote = remoteOptions[Math.floor(Math.random() * remoteOptions.length)];
  const currency = currencies[Math.floor(Math.random() * currencies.length)];
  
  // Generate salary range based on experience
  const baseSalary = {
    'entry': 50000,
    'mid': 75000,
    'senior': 100000,
    'lead': 125000,
    'executive': 150000
  }[experience];
  
  const minSalary = baseSalary + Math.floor(Math.random() * 20000);
  const maxSalary = minSalary + Math.floor(Math.random() * 30000);
  
  // Generate random skills
  const jobSkills = skills
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.floor(Math.random() * 10) + 5);
  
  // Generate random requirements
  const jobRequirements = requirements
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.floor(Math.random() * 8) + 3);
  
  // Generate random benefits
  const jobBenefits = benefits
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.floor(Math.random() * 12) + 5);
  
  // Generate description
  const description = `We are looking for a ${title} to join our team at ${company}. This is a ${type} position that offers ${remote} work options.
  
Key Responsibilities:
• Develop and maintain high-quality software solutions
• Collaborate with cross-functional teams
• Participate in code reviews and technical discussions
• Contribute to architectural decisions
• Mentor junior developers
• Stay up-to-date with industry trends

Requirements:
${jobRequirements.map(req => `• ${req}`).join('\n')}

Skills Required:
${jobSkills.map(skill => `• ${skill}`).join('\n')}

Benefits:
${jobBenefits.map(benefit => `• ${benefit}`).join('\n')}

Join our team and be part of an innovative company that values creativity, collaboration, and continuous learning. We offer a dynamic work environment with opportunities for growth and development.`;

  return {
    title,
    company,
    location,
    description,
    type,
    experience,
    remote,
    salary: {
      min: minSalary,
      max: maxSalary,
      currency
    },
    requirements: {
      experience,
      skills: jobSkills,
      list: jobRequirements
    },
    benefits: jobBenefits,
    status: 'active',
    postedBy: null, // Will be set to a user ID
    applicants: [],
    metadata: {
      source: 'seed',
      priority: Math.floor(Math.random() * 5) + 1,
      featured: Math.random() < 0.2, // 20% chance of being featured
      urgent: Math.random() < 0.1, // 10% chance of being urgent
      remote: remote === 'remote',
      hybrid: remote === 'hybrid'
    },
    analytics: {
      views: Math.floor(Math.random() * 1000) + 100,
      applications: Math.floor(Math.random() * 50) + 5,
      saves: Math.floor(Math.random() * 20) + 2,
      shares: Math.floor(Math.random() * 10) + 1
    }
  };
};

// Main seeding function
const seedJobPosts = async () => {
  try {
    console.log('🌱 Starting job posts seeding...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/luxgen');
    console.log('✅ Connected to database');
    
    // Get a user to be the poster
    const user = await User.findOne({ role: 'super_admin' });
    if (!user) {
      console.error('❌ No super_admin user found. Please seed users first.');
      return;
    }
    
    // Clear existing job posts
    await Job.deleteMany({});
    console.log('🗑️ Cleared existing job posts');
    
    // Generate and insert job posts
    const jobs = [];
    for (let i = 0; i < 50; i++) {
      const jobData = generateJobData(i);
      jobData.postedBy = user._id;
      jobData.tenantId = user.tenantId;
      jobData.postedAt = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
      jobData.createdAt = jobData.postedAt;
      jobData.updatedAt = jobData.postedAt;
      
      jobs.push(jobData);
    }
    
    // Insert jobs
    const insertedJobs = await Job.insertMany(jobs);
    console.log(`✅ Inserted ${insertedJobs.length} job posts`);
    
    // Update user's job count
    await User.findByIdAndUpdate(user._id, {
      $inc: { 'metadata.jobPosts': insertedJobs.length }
    });
    
    // Create indexes for performance
    await Job.collection.createIndex({ title: 'text', description: 'text', company: 'text' });
    await Job.collection.createIndex({ location: 1 });
    await Job.collection.createIndex({ type: 1 });
    await Job.collection.createIndex({ 'requirements.experience': 1 });
    await Job.collection.createIndex({ 'salary.min': 1, 'salary.max': 1 });
    await Job.collection.createIndex({ postedAt: -1 });
    await Job.collection.createIndex({ status: 1 });
    await Job.collection.createIndex({ tenantId: 1 });
    
    console.log('✅ Created database indexes');
    
    // Display summary
    console.log('\n📊 Job Posts Summary:');
    console.log(`Total jobs: ${insertedJobs.length}`);
    console.log(`Active jobs: ${insertedJobs.filter(job => job.status === 'active').length}`);
    console.log(`Remote jobs: ${insertedJobs.filter(job => job.remote === 'remote').length}`);
    console.log(`Hybrid jobs: ${insertedJobs.filter(job => job.remote === 'hybrid').length}`);
    console.log(`On-site jobs: ${insertedJobs.filter(job => job.remote === 'on-site').length}`);
    
    // Display by experience level
    const experienceCounts = {};
    insertedJobs.forEach(job => {
      experienceCounts[job.requirements.experience] = (experienceCounts[job.requirements.experience] || 0) + 1;
    });
    console.log('\n📈 Jobs by Experience Level:');
    Object.entries(experienceCounts).forEach(([level, count]) => {
      console.log(`  ${level}: ${count}`);
    });
    
    // Display by job type
    const typeCounts = {};
    insertedJobs.forEach(job => {
      typeCounts[job.type] = (typeCounts[job.type] || 0) + 1;
    });
    console.log('\n📈 Jobs by Type:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    console.log('\n🎉 Job posts seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding job posts:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
};

// Run if called directly
if (require.main === module) {
  seedJobPosts()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedJobPosts;
