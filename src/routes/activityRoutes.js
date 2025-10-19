const express = require('express');
const router = express.Router();

// Activity Feed Routes for Frontend Support
// =========================================

// Get activities with pagination
router.get('/', (req, res) => {
  const { page = 1, limit = 20, type, userId } = req.query;
  
  res.json({
    success: true,
    data: [
      {
        id: 'activity-1',
        title: 'New Training Program Available',
        description: 'Advanced JavaScript Training has been added to your learning path',
        type: 'training',
        userId: 'user-123',
        tenantId: 'tenant-456',
        metadata: {
          programId: 'program-1',
          programName: 'Advanced JavaScript Training'
        },
        tags: ['training', 'javascript', 'programming'],
        likes: 15,
        comments: 3,
        shares: 1,
        visibility: 'public',
        priority: 1,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'activity-2',
        title: 'Job Application Submitted',
        description: 'Your application for Senior Developer position has been submitted',
        type: 'job',
        userId: 'user-123',
        tenantId: 'tenant-456',
        metadata: {
          jobId: 'job-1',
          jobTitle: 'Senior Developer',
          company: 'Tech Corp'
        },
        tags: ['job', 'application', 'career'],
        likes: 8,
        comments: 2,
        shares: 0,
        visibility: 'private',
        priority: 2,
        status: 'active',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 2,
      pages: 1
    }
  });
});

// Get activity statistics
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalActivities: 150,
      activitiesToday: 5,
      topActivityTypes: ['training', 'job', 'achievement'],
      engagement: {
        totalLikes: 1250,
        totalComments: 340,
        totalShares: 89
      },
      recentTrends: {
        training: 45,
        jobs: 30,
        achievements: 25
      }
    }
  });
});

// Perform activity action (like, comment, share)
router.post('/:id/actions', (req, res) => {
  const { id } = req.params;
  const { action, metadata } = req.body;
  
  res.json({
    success: true,
    message: `Activity ${action} successful`,
    data: {
      activityId: id,
      action,
      metadata: metadata || {},
      performedAt: new Date().toISOString(),
      userId: 'user-123'
    }
  });
});

// Search activities
router.get('/search', (req, res) => {
  const { q, type, dateFrom, dateTo } = req.query;
  
  res.json({
    success: true,
    data: [],
    query: {
      search: q || '',
      type: type || '',
      dateFrom: dateFrom || '',
      dateTo: dateTo || ''
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      pages: 0
    }
  });
});

// Get activity by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      id,
      title: 'New Training Program Available',
      description: 'Advanced JavaScript Training has been added to your learning path',
      type: 'training',
      userId: 'user-123',
      tenantId: 'tenant-456',
      metadata: {
        programId: 'program-1',
        programName: 'Advanced JavaScript Training'
      },
      tags: ['training', 'javascript', 'programming'],
      likes: 15,
      comments: 3,
      shares: 1,
      visibility: 'public',
      priority: 1,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      actions: [
        {
          id: 'action-1',
          type: 'like',
          userId: 'user-456',
          createdAt: new Date().toISOString()
        }
      ]
    }
  });
});

// Create new activity
router.post('/', (req, res) => {
  const activityData = req.body;
  
  res.json({
    success: true,
    message: 'Activity created successfully',
    data: {
      id: 'activity-new-' + Date.now(),
      ...activityData,
      likes: 0,
      comments: 0,
      shares: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
});

// Update activity
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  res.json({
    success: true,
    message: 'Activity updated successfully',
    data: {
      id,
      ...updates,
      updatedAt: new Date().toISOString()
    }
  });
});

// Delete activity
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: 'Activity deleted successfully',
    data: { id }
  });
});

module.exports = router;