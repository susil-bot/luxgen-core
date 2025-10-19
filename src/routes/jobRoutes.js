const express = require('express');
const router = express.Router();

// Job Board Routes for Frontend Support
// =====================================

// Get jobs with pagination and filters
router.get('/', (req, res) => {
  const { page = 1, limit = 10, search, location, jobType, experience, salary, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  
  res.json({
    success: true,
    data: [
      {
        id: 'job-1',
        title: 'Senior JavaScript Developer',
        company: 'Tech Corp',
        location: 'San Francisco, CA',
        jobType: 'full-time',
        experience: 'senior',
        salary: '$120,000 - $150,000',
        description: 'We are looking for a senior JavaScript developer...',
        requirements: ['5+ years JavaScript', 'React experience', 'Node.js'],
        benefits: ['Health insurance', '401k', 'Remote work'],
        postedAt: new Date().toISOString(),
        featured: true,
        urgent: false
      },
      {
        id: 'job-2',
        title: 'Frontend Developer',
        company: 'StartupXYZ',
        location: 'New York, NY',
        jobType: 'full-time',
        experience: 'mid',
        salary: '$80,000 - $100,000',
        description: 'Join our growing team...',
        requirements: ['3+ years frontend', 'Vue.js', 'CSS'],
        benefits: ['Stock options', 'Flexible hours'],
        postedAt: new Date(Date.now() - 86400000).toISOString(),
        featured: false,
        urgent: true
      }
    ],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 2,
      pages: 1
    },
    filters: {
      search: search || '',
      location: location || '',
      jobType: jobType || '',
      experience: experience || '',
      salary: salary || ''
    }
  });
});

// Get featured jobs
router.get('/featured', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'job-1',
        title: 'Senior JavaScript Developer',
        company: 'Tech Corp',
        location: 'San Francisco, CA',
        featured: true,
        badge: 'Featured'
      }
    ]
  });
});

// Get job statistics
router.get('/statistics', (req, res) => {
  res.json({
    success: true,
    data: {
      totalJobs: 150,
      newJobsToday: 5,
      featuredJobs: 12,
      urgentJobs: 3,
      averageSalary: '$95,000',
      topLocations: ['San Francisco', 'New York', 'Seattle'],
      topSkills: ['JavaScript', 'Python', 'React', 'Node.js']
    }
  });
});

// Search jobs
router.get('/search', (req, res) => {
  const { q, location, jobType, experience } = req.query;
  
  res.json({
    success: true,
    data: [],
    query: {
      search: q || '',
      location: location || '',
      jobType: jobType || '',
      experience: experience || ''
    },
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      pages: 0
    }
  });
});

// Get single job
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      id,
      title: 'Senior JavaScript Developer',
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      jobType: 'full-time',
      experience: 'senior',
      salary: '$120,000 - $150,000',
      description: 'We are looking for a senior JavaScript developer with extensive experience in modern web technologies...',
      requirements: [
        '5+ years of JavaScript development experience',
        'Strong experience with React and Node.js',
        'Experience with modern build tools',
        'Knowledge of testing frameworks'
      ],
      benefits: [
        'Comprehensive health insurance',
        '401k with company matching',
        'Remote work flexibility',
        'Professional development budget'
      ],
      postedAt: new Date().toISOString(),
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      companyInfo: {
        name: 'Tech Corp',
        size: '100-500 employees',
        industry: 'Technology',
        website: 'https://techcorp.com'
      }
    }
  });
});

// Create job (for employers)
router.post('/', (req, res) => {
  const jobData = req.body;
  
  res.json({
    success: true,
    message: 'Job created successfully',
    data: {
      id: 'job-new-' + Date.now(),
      ...jobData,
      postedAt: new Date().toISOString(),
      status: 'active'
    }
  });
});

// Update job
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  res.json({
    success: true,
    message: 'Job updated successfully',
    data: {
      id,
      ...updates,
      updatedAt: new Date().toISOString()
    }
  });
});

// Delete job
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: 'Job deleted successfully',
    data: { id }
  });
});

module.exports = router;
