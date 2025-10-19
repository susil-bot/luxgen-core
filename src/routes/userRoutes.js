const express = require('express');
const router = express.Router();

// User Management Routes for Frontend Support
// ============================================

// Get current user profile
router.get('/me', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      role: 'user',
      tenantId: 'tenant-456',
      profile: {
        avatar: '/media/avatars/user-123.jpg',
        bio: 'Passionate developer and lifelong learner',
        location: 'San Francisco, CA',
        website: 'https://johndoe.dev',
        social: {
          linkedin: 'https://linkedin.com/in/johndoe',
          github: 'https://github.com/johndoe',
          twitter: 'https://twitter.com/johndoe'
        }
      },
      preferences: {
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showLocation: true
        },
        learning: {
          preferredLanguage: 'en',
          difficulty: 'intermediate',
          interests: ['javascript', 'react', 'nodejs']
        }
      },
      stats: {
        coursesCompleted: 5,
        totalHours: 120,
        certificates: 3,
        currentStreak: 7,
        achievements: ['first_course', 'high_achiever', 'consistent_learner']
      },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
});

// Update current user profile
router.put('/me', (req, res) => {
  const updates = req.body;
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      id: 'user-123',
      ...updates,
      updatedAt: new Date().toISOString()
    }
  });
});

// Get user by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      id,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      role: 'trainer',
      tenantId: 'tenant-456',
      profile: {
        avatar: '/media/avatars/user-456.jpg',
        bio: 'Experienced trainer and industry expert',
        location: 'New York, NY',
        website: 'https://janesmith.com',
        social: {
          linkedin: 'https://linkedin.com/in/janesmith',
          github: 'https://github.com/janesmith'
        }
      },
      stats: {
        coursesCreated: 12,
        studentsTaught: 500,
        rating: 4.8,
        totalHours: 2000
      },
      isPublic: true,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
});

// Search users
router.get('/search', (req, res) => {
  const { q, role, location, skills, page = 1, limit = 10 } = req.query;
  
  res.json({
    success: true,
    data: [
      {
        id: 'user-789',
        firstName: 'Mike',
        lastName: 'Johnson',
        role: 'developer',
        location: 'Seattle, WA',
        skills: ['javascript', 'python', 'react'],
        avatar: '/media/avatars/user-789.jpg',
        isPublic: true
      }
    ],
    query: {
      search: q || '',
      role: role || '',
      location: location || '',
      skills: skills || ''
    },
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 1,
      pages: 1
    }
  });
});

// Get user's learning progress
router.get('/:id/progress', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      userId: id,
      totalCourses: 8,
      completedCourses: 5,
      inProgressCourses: 2,
      upcomingCourses: 1,
      totalHours: 150,
      averageScore: 87,
      currentStreak: 12,
      achievements: [
        {
          id: 'achievement-1',
          name: 'First Course Completed',
          description: 'Completed your first training course',
          icon: '/media/achievements/first-course.png',
          earnedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'achievement-2',
          name: 'High Achiever',
          description: 'Scored 90% or higher in 3 courses',
          icon: '/media/achievements/high-achiever.png',
          earnedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      recentActivity: [
        {
          type: 'course_completed',
          courseName: 'Advanced JavaScript',
          completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          type: 'certificate_earned',
          certificateName: 'JavaScript Fundamentals',
          earnedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    }
  });
});

// Get user's enrolled courses
router.get('/:id/courses', (req, res) => {
  const { id } = req.params;
  const { status, page = 1, limit = 10 } = req.query;
  
  res.json({
    success: true,
    data: [
      {
        id: 'enrollment-1',
        courseId: 'course-1',
        courseName: 'JavaScript Fundamentals',
        status: 'completed',
        progress: 100,
        score: 92,
        enrolledAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'enrollment-2',
        courseId: 'course-2',
        courseName: 'React Advanced',
        status: 'in_progress',
        progress: 65,
        enrolledAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
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

// Update user preferences
router.put('/:id/preferences', (req, res) => {
  const { id } = req.params;
  const preferences = req.body;
  
  res.json({
    success: true,
    message: 'Preferences updated successfully',
    data: {
      userId: id,
      preferences,
      updatedAt: new Date().toISOString()
    }
  });
});

// Get user notifications
router.get('/:id/notifications', (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20, unread } = req.query;
  
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
        createdAt: new Date().toISOString()
      },
      {
        id: 'notification-2',
        type: 'achievement',
        title: 'Achievement Unlocked',
        message: 'Congratulations! You earned the "High Achiever" badge',
        isRead: true,
        priority: 'medium',
        createdAt: new Date(Date.now() - 3600000).toISOString()
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

module.exports = router;
