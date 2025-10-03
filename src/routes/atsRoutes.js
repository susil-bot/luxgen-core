/**
 * ATS (Applicant Tracking System) Routes
 * API endpoints for managing candidates and applications
 */

const express = require('express');
const router = express.Router();
const JobApplication = require('../models/JobApplication');
const CandidateProfile = require('../models/CandidateProfile');
const { authenticateToken, requireAdmin, requireTrainer } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { body, query, param } = require('express-validator');
const logger = require('../utils/logger');

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route GET /api/v1/ats/candidates
 * @desc Get all candidates with filtering and search
 * @access Private (trainers/recruiters)
 */
router.get('/candidates', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('skills').optional().isString(),
  query('experience').optional().isInt({ min: 0 }),
  query('location').optional().isString(),
  query('status').optional().isIn(['active', 'inactive', 'suspended']),
  query('sortBy').optional().isIn(['createdAt', 'lastActive', 'profileCompleteness']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], validateRequest, requireTrainer, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      skills,
      experience,
      location,
      status = 'active',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const tenantId = req.tenantId || 'default';
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {
      tenantId,
      status
    };

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Skills filter
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      filter['skills.technical.name'] = { $in: skillsArray };
    }

    // Experience filter
    if (experience) {
      filter['experience'] = {
        $elemMatch: {
          $expr: {
            $gte: [
              { $divide: [{ $subtract: ['$endDate', '$startDate'] }, 365 * 24 * 60 * 60 * 1000] },
              parseInt(experience)
            ]
          }
        }
      };
    }

    // Location filter
    if (location) {
      filter.$or = [
        { 'personalInfo.location.city': new RegExp(location, 'i') },
        { 'personalInfo.location.state': new RegExp(location, 'i') },
        { 'personalInfo.location.country': new RegExp(location, 'i') }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const candidates = await CandidateProfile.find(filter)
      .populate('userId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CandidateProfile.countDocuments(filter);

    const pages = Math.ceil(total / limit);
    res.json({
      success: true,
      data: candidates,
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
    logger.error('Failed to get candidates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get candidates',
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/ats/candidates/:id
 * @desc Get candidate profile by ID
 * @access Private (trainers/recruiters)
 */
router.get('/candidates/:id', [
  param('id').isMongoId()
], validateRequest, requireTrainer, async (req, res) => {
  try {
    const candidateId = req.params.id;
    const tenantId = req.tenantId || 'default';

    const candidate = await CandidateProfile.findOne({
      userId: candidateId,
      tenantId
    }).populate('userId', 'name email');

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Check if user has permission to view sensitive information
    const hasPermission = candidate.permissions.viewers.some(
      viewer => viewer.userId.toString() === req.user.id
    ) || req.user.roles.includes('admin');

    // Filter sensitive data if no permission
    let candidateData = candidate.toObject();
    if (!hasPermission) {
      // Remove sensitive information
      delete candidateData.personalInfo.dateOfBirth;
      delete candidateData.personalInfo.phone;
      delete candidateData.personalInfo.alternateEmail;
      delete candidateData.preferences;
      delete candidateData.permissions;
    }

    res.json({
      success: true,
      data: candidateData,
      hasFullAccess: hasPermission
    });
  } catch (error) {
    logger.error('Failed to get candidate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get candidate',
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/ats/candidates/:id/request-access
 * @desc Request access to sensitive candidate information
 * @access Private (trainers/recruiters)
 */
router.post('/candidates/:id/request-access', [
  param('id').isMongoId(),
  body('reason').notEmpty().isString().isLength({ min: 10, max: 500 })
], validateRequest, requireTrainer, async (req, res) => {
  try {
    const candidateId = req.params.id;
    const tenantId = req.tenantId || 'default';
    const { reason } = req.body;

    const candidate = await CandidateProfile.findOne({
      userId: candidateId,
      tenantId
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Check if already has access
    const hasAccess = candidate.permissions.viewers.some(
      viewer => viewer.userId.toString() === req.user.id
    );

    if (hasAccess) {
      return res.status(400).json({
        success: false,
        message: 'You already have access to this candidate\'s information'
      });
    }

    // Check if request already exists
    const existingRequest = candidate.permissions.accessRequests.find(
      request => request.requestedBy.toString() === req.user.id && request.status === 'pending'
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request for this candidate'
      });
    }

    // Add access request
    candidate.permissions.accessRequests.push({
      requestedBy: req.user.id,
      requestedAt: new Date(),
      reason,
      status: 'pending'
    });

    await candidate.save();

    res.json({
      success: true,
      message: 'Access request submitted successfully. Super admin will review your request.'
    });
  } catch (error) {
    logger.error('Failed to request candidate access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request candidate access',
      error: error.message
    });
  }
});

/**
 * @route POST /api/v1/ats/candidates/:id/grant-access
 * @desc Grant access to sensitive candidate information (Super Admin only)
 * @access Private (super admin)
 */
router.post('/candidates/:id/grant-access', [
  param('id').isMongoId(),
  body('requestId').isMongoId(),
  body('approved').isBoolean()
], validateRequest, requireAdmin, async (req, res) => {
  try {
    const candidateId = req.params.id;
    const { requestId, approved } = req.body;
    const tenantId = req.tenantId || 'default';

    const candidate = await CandidateProfile.findOne({
      userId: candidateId,
      tenantId
    });

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    const request = candidate.permissions.accessRequests.id(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Access request not found'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed'
      });
    }

    // Update request status
    request.status = approved ? 'approved' : 'denied';
    request.approvedBy = req.user.id;
    request.approvedAt = new Date();

    // If approved, add to viewers
    if (approved) {
      candidate.permissions.viewers.push({
        userId: request.requestedBy,
        role: 'trainer',
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });
    }

    await candidate.save();

    res.json({
      success: true,
      message: `Access request ${approved ? 'approved' : 'denied'} successfully`
    });
  } catch (error) {
    logger.error('Failed to process access request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process access request',
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/ats/applications
 * @desc Get all applications with filtering
 * @access Private (trainers/recruiters)
 */
router.get('/applications', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isString(),
  query('jobId').optional().isMongoId(),
  query('candidateId').optional().isMongoId(),
  query('sortBy').optional().isIn(['appliedAt', 'score', 'status']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], validateRequest, requireTrainer, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      jobId,
      candidateId,
      sortBy = 'appliedAt',
      sortOrder = 'desc'
    } = req.query;

    const tenantId = req.tenantId || 'default';
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { tenantId };
    if (status) filter.status = status;
    if (jobId) filter.jobId = jobId;
    if (candidateId) filter.candidateId = candidateId;

    // Build sort object
    const sort = {};
    if (sortBy === 'appliedAt') {
      sort['process.appliedAt'] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    const applications = await JobApplication.find(filter)
      .populate('jobId', 'title company')
      .populate('candidateId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await JobApplication.countDocuments(filter);

    const pages = Math.ceil(total / limit);
    res.json({
      success: true,
      data: applications,
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
    logger.error('Failed to get applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get applications',
      error: error.message
    });
  }
});

/**
 * @route PUT /api/v1/ats/applications/:id/status
 * @desc Update application status
 * @access Private (trainers/recruiters)
 */
router.put('/applications/:id/status', [
  param('id').isMongoId(),
  body('status').isIn([
    'applied', 'under-review', 'shortlisted', 'interview-scheduled',
    'interviewed', 'assessment', 'reference-check', 'offer-extended',
    'offer-accepted', 'offer-declined', 'rejected', 'withdrawn'
  ]),
  body('notes').optional().isString()
], validateRequest, requireTrainer, async (req, res) => {
  try {
    const applicationId = req.params.id;
    const { status, notes } = req.body;
    const tenantId = req.tenantId || 'default';

    const application = await JobApplication.findOne({
      _id: applicationId,
      tenantId
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update status and process tracking
    application.status = status;
    const now = new Date();

    switch (status) {
      case 'under-review':
        application.process.reviewedAt = now;
        break;
      case 'shortlisted':
        application.process.shortlistedAt = now;
        break;
      case 'interview-scheduled':
        application.process.interviewScheduledAt = now;
        break;
      case 'interviewed':
        application.process.interviewedAt = now;
        break;
      case 'assessment':
        application.process.assessedAt = now;
        break;
      case 'reference-check':
        application.process.referenceCheckedAt = now;
        break;
      case 'offer-extended':
        application.process.offerExtendedAt = now;
        break;
      case 'offer-accepted':
        application.process.offerAcceptedAt = now;
        break;
      case 'rejected':
        application.process.rejectedAt = now;
        break;
      case 'withdrawn':
        application.process.withdrawnAt = now;
        break;
    }

    // Add communication note
    if (notes) {
      application.communications.push({
        type: 'note',
        content: notes,
        sentBy: req.user.id,
        direction: 'outbound'
      });
    }

    await application.save();

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: application
    });
  } catch (error) {
    logger.error('Failed to update application status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status',
      error: error.message
    });
  }
});

/**
 * @route GET /api/v1/ats/dashboard
 * @desc Get ATS dashboard statistics
 * @access Private (trainers/recruiters)
 */
router.get('/dashboard', requireTrainer, async (req, res) => {
  try {
    const tenantId = req.tenantId || 'default';

    // Get application statistics
    const totalApplications = await JobApplication.countDocuments({ tenantId });
    const applicationsByStatus = await JobApplication.aggregate([
      { $match: { tenantId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get candidate statistics
    const totalCandidates = await CandidateProfile.countDocuments({ tenantId });
    const activeCandidates = await CandidateProfile.countDocuments({
      tenantId,
      status: 'active'
    });

    // Get recent activity
    const recentApplications = await JobApplication.find({ tenantId })
      .populate('jobId', 'title company')
      .populate('candidateId', 'name email')
      .sort({ 'process.appliedAt': -1 })
      .limit(10);

    // Get top skills
    const topSkills = await CandidateProfile.aggregate([
      { $match: { tenantId, status: 'active' } },
      { $unwind: '$skills.technical' },
      { $group: { _id: '$skills.technical.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        applications: {
          total: totalApplications,
          byStatus: applicationsByStatus
        },
        candidates: {
          total: totalCandidates,
          active: activeCandidates
        },
        recentActivity: recentApplications,
        topSkills
      }
    });
  } catch (error) {
    logger.error('Failed to get ATS dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get ATS dashboard',
      error: error.message
    });
  }
});

module.exports = router;
