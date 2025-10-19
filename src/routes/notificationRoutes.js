const express = require('express');
const router = express.Router();

// Notification Routes for Frontend Support
// =========================================

// Get notifications with pagination
router.get('/', (req, res) => {
  const { page = 1, limit = 20, unread, type, priority } = req.query;
  
  res.json({
    success: true,
    data: [
      {
        id: 'notification-1',
        type: 'course_reminder',
        title: 'Course Reminder',
        message: 'Your JavaScript course session starts in 1 hour',
        isRead: false,
        priority: 'high',
        metadata: {
          courseId: 'course-1',
          courseName: 'JavaScript Fundamentals',
          sessionTime: new Date(Date.now() + 3600000).toISOString()
        },
        userId: 'user-123',
        tenantId: 'tenant-456',
        createdAt: new Date().toISOString(),
        scheduledFor: new Date(Date.now() + 3600000).toISOString()
      },
      {
        id: 'notification-2',
        type: 'achievement',
        title: 'Achievement Unlocked',
        message: 'Congratulations! You earned the "High Achiever" badge',
        isRead: true,
        priority: 'medium',
        metadata: {
          achievementId: 'achievement-1',
          achievementName: 'High Achiever',
          icon: '/media/achievements/high-achiever.png'
        },
        userId: 'user-123',
        tenantId: 'tenant-456',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'notification-3',
        type: 'job_application',
        title: 'Application Status Update',
        message: 'Your application for Senior Developer has been reviewed',
        isRead: false,
        priority: 'medium',
        metadata: {
          jobId: 'job-1',
          jobTitle: 'Senior Developer',
          company: 'Tech Corp',
          status: 'under_review'
        },
        userId: 'user-123',
        tenantId: 'tenant-456',
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 3,
      pages: 1
    },
    filters: {
      unread: unread === 'true',
      type: type || '',
      priority: priority || ''
    },
    summary: {
      total: 3,
      unread: 2,
      byType: {
        course_reminder: 1,
        achievement: 1,
        job_application: 1
      },
      byPriority: {
        high: 1,
        medium: 2,
        low: 0
      }
    }
  });
});

// Mark notification as read
router.post('/:id/read', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: 'Notification marked as read',
    data: {
      id,
      isRead: true,
      readAt: new Date().toISOString()
    }
  });
});

// Mark all notifications as read
router.post('/read-all', (req, res) => {
  res.json({
    success: true,
    message: 'All notifications marked as read',
    data: {
      readCount: 2,
      readAt: new Date().toISOString()
    }
  });
});

// Get notification by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      id,
      type: 'course_reminder',
      title: 'Course Reminder',
      message: 'Your JavaScript course session starts in 1 hour',
      isRead: false,
      priority: 'high',
      metadata: {
        courseId: 'course-1',
        courseName: 'JavaScript Fundamentals',
        sessionTime: new Date(Date.now() + 3600000).toISOString(),
        instructor: 'John Doe',
        meetingLink: 'https://meet.example.com/session-123'
      },
      userId: 'user-123',
      tenantId: 'tenant-456',
      createdAt: new Date().toISOString(),
      scheduledFor: new Date(Date.now() + 3600000).toISOString(),
      actions: [
        {
          id: 'action-1',
          type: 'join_session',
          label: 'Join Session',
          url: 'https://meet.example.com/session-123'
        },
        {
          id: 'action-2',
          type: 'remind_later',
          label: 'Remind in 30 min',
          data: { delay: 1800000 }
        }
      ]
    }
  });
});

// Create notification
router.post('/', (req, res) => {
  const notificationData = req.body;
  
  res.json({
    success: true,
    message: 'Notification created successfully',
    data: {
      id: 'notification-new-' + Date.now(),
      ...notificationData,
      isRead: false,
      createdAt: new Date().toISOString()
    }
  });
});

// Update notification
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  res.json({
    success: true,
    message: 'Notification updated successfully',
    data: {
      id,
      ...updates,
      updatedAt: new Date().toISOString()
    }
  });
});

// Delete notification
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: 'Notification deleted successfully',
    data: { id }
  });
});

// Get notification preferences
router.get('/preferences', (req, res) => {
  res.json({
    success: true,
    data: {
      userId: 'user-123',
      preferences: {
        email: {
          course_reminders: true,
          achievements: true,
          job_updates: true,
          system_updates: false
        },
        push: {
          course_reminders: true,
          achievements: true,
          job_updates: true,
          system_updates: false
        },
        sms: {
          urgent_reminders: true,
          security_alerts: true
        },
        frequency: {
          digest: 'daily',
          realTime: ['course_reminders', 'achievements']
        }
      },
      updatedAt: new Date().toISOString()
    }
  });
});

// Update notification preferences
router.put('/preferences', (req, res) => {
  const preferences = req.body;
  
  res.json({
    success: true,
    message: 'Notification preferences updated successfully',
    data: {
      preferences,
      updatedAt: new Date().toISOString()
    }
  });
});

// Get notification statistics
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      total: 25,
      unread: 5,
      read: 20,
      byType: {
        course_reminder: 8,
        achievement: 5,
        job_application: 7,
        system_update: 3,
        social: 2
      },
      byPriority: {
        high: 3,
        medium: 15,
        low: 7
      },
      recentActivity: {
        last24Hours: 3,
        lastWeek: 12,
        lastMonth: 25
      }
    }
  });
});

module.exports = router;
