/**
 * Job Board Routes
 * API endpoints for job posting, searching, and applications
 */

const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const CandidateProfile = require('../models/CandidateProfile');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { body, query, param } = require('express-validator');
const logger = require('../utils/logger');

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route GET /api/v1/jobs
 * @desc Get all jobs with filtering and pagination
 * @access Public (authenticated users)
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('location').optional().isString(),
  query('jobType').optional().isIn(['full-time', 'part-time', 'contract', 'internship', 'freelance']),
  query('experienceLevel').optional().isIn(['entry', 'junior', 'mid', 'senior', 'lead', 'executive']),
  query('remote').optional().isBoolean(),
  query('salaryMin').optional().isNumeric(),
  query('salaryMax').optional().isNumeric(),
  query('company').optional().isString(),
  query('skills').optional().isString(),
  query('sortBy').optional().isIn(['createdAt', 'salary', 'title', 'company']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], validateRequest, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      location,
      jobType,
      experienceLevel,
      remote,
      salaryMin,
      salaryMax,
      company,
      skills,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const tenantId = req.tenantId || 'default';
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {
      tenantId,
      status: 'active',
      visibility: 'public'
    };

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Location filter
    if (location) {
      filter.$or = [
        { 'location.city': new RegExp(location, 'i') },
        { 'location.state': new RegExp(location, 'i') },
        { 'location.country': new RegExp(location, 'i') },
        { 'company.location.city': new RegExp(location, 'i') },
        { 'company.location.country': new RegExp(location, 'i') }
      ];
    }

    // Job type filter
    if (jobType) {
      filter.jobType = jobType;
    }

    // Experience level filter
    if (experienceLevel) {
      filter.experienceLevel = experienceLevel;
    }

    // Remote work filter
    if (remote !== undefined) {
      filter['location.remote'] = remote === 'true';
    }

    // Salary filter
    if (salaryMin || salaryMax) {
      filter['salary.min'] = {};
      if (salaryMin) filter['salary.min'].$gte = parseInt(salaryMin);
      if (salaryMax) filter['salary.max'] = { $lte: parseInt(salaryMax) };
    }

    // Company filter
    if (company) {
      filter['company.name'] = new RegExp(company, 'i');
    }

    // Skills filter
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      filter['requirements.skills'] = { $in: skillsArray };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const jobs = await Job.find(filter)
      .populate('postedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(filter);

    const pages = Math.ceil(total / limit);
    res.json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages,
        hasNext: parseInt(page) < pages,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    logger.error('Failed to get jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get jobs',
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/jobs/:id
 * @desc Get job by ID
 * @access Public (authenticated users)
 */
router.get('/:id', [
  param('id').isMongoId()
], validateRequest, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name email company');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Increment view count
    await Job.findByIdAndUpdate(req.params.id, {
      $inc: { 'analytics.views': 1 }
    });

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    logger.error('Failed to get job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job',
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/jobs
 * @desc Create new job posting
 * @access Private (trainers/employers)
 */
router.post('/', [
  body('title').notEmpty().isLength({ min: 5, max: 100 }),
  body('description').notEmpty().isLength({ min: 50, max: 5000 }),
  body('company.name').notEmpty(),
  body('jobType').isIn(['full-time', 'part-time', 'contract', 'internship', 'freelance']),
  body('experienceLevel').isIn(['entry', 'junior', 'mid', 'senior', 'lead', 'executive']),
  body('location.city').notEmpty(),
  body('location.country').notEmpty()
], validateRequest, authorizeRoles(['trainer', 'admin']), async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      postedBy: req.user.id,
      tenantId: req.tenantId || 'default',
      publishedAt: new Date()
    };

    const job = new Job(jobData);
    await job.save();

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      data: job
    });
  } catch (error) {
    logger.error('Failed to create job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/v1/jobs/:id
 * @desc Update job posting
 * @access Private (job owner or admin)
 */
router.put('/:id', [
  param('id').isMongoId()
], validateRequest, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user can edit this job
    if (job.postedBy.toString() !== req.user.id && !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this job'
      });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: updatedJob
    });
  } catch (error) {
    logger.error('Failed to update job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/v1/jobs/:id
 * @desc Delete job posting
 * @access Private (job owner or admin)
 */
router.delete('/:id', [
  param('id').isMongoId()
], validateRequest, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user can delete this job
    if (job.postedBy.toString() !== req.user.id && !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job'
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    logger.error('Failed to delete job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job',
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/jobs/:id/apply
 * @desc Apply for a job
 * @access Private (candidates)
 */
router.post('/:id/apply', [
  param('id').isMongoId(),
  body('coverLetter').optional().isString(),
  body('resume').optional().isString()
], validateRequest, async (req, res) => {
  try {
    const jobId = req.params.id;
    const candidateId = req.user.id;
    const tenantId = req.tenantId || 'default';

    // Check if job exists and is active
    const job = await Job.findById(jobId);
    if (!job || job.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Job not found or not accepting applications'
      });
    }

    // Check if already applied
    const existingApplication = await JobApplication.findOne({
      jobId,
      candidateId,
      tenantId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Get or create candidate profile
    let candidateProfile = await CandidateProfile.findOne({ userId: candidateId });
    if (!candidateProfile) {
      // Create basic profile from user data
      candidateProfile = new CandidateProfile({
        userId: candidateId,
        tenantId,
        personalInfo: {
          firstName: req.user.name?.split(' ')[0] || '',
          lastName: req.user.name?.split(' ').slice(1).join(' ') || '',
          email: req.user.email
        },
        status: 'active'
      });
      await candidateProfile.save();
    }

    // Create application
    const application = new JobApplication({
      jobId,
      candidateId,
      tenantId,
      status: 'applied',
      candidateProfile: candidateProfile.toObject(),
      documents: {
        coverLetter: req.body.coverLetter ? {
          content: req.body.coverLetter,
          uploadedAt: new Date()
        } : null,
        resume: req.body.resume ? {
          url: req.body.resume,
          uploadedAt: new Date()
        } : null
      },
      process: {
        appliedAt: new Date()
      }
    });

    await application.save();

    // Update job application count
    await Job.findByIdAndUpdate(jobId, {
      $inc: { 'analytics.applications': 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    logger.error('Failed to apply for job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to apply for job',
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/jobs/:id/applications
 * @desc Get applications for a job
 * @access Private (job owner or admin)
 */
router.get('/:id/applications', [
  param('id').isMongoId(),
  query('status').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], validateRequest, async (req, res) => {
  try {
    const jobId = req.params.id;
    const tenantId = req.tenantId || 'default';

    // Check if user can view applications
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.postedBy.toString() !== req.user.id && !req.user.roles.includes('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view applications for this job'
      });
    }

    const {
      status,
      page = 1,
      limit = 20
    } = req.query;

    const filter = { jobId, tenantId };
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;
    const applications = await JobApplication.find(filter)
      .populate('candidateId', 'name email')
      .sort({ 'process.appliedAt': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await JobApplication.countDocuments(filter);

    res.json({
      success: true,
      data: applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Failed to get job applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job applications',
      error: error.message
    });
  }
});

module.exports = router;
