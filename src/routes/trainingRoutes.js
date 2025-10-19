const express = require('express');
const router = express.Router();

// Training Routes for Frontend Support
// =====================================

// Get training courses/programs
router.get('/courses', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'course-1',
        title: 'Advanced JavaScript Training',
        description: 'Comprehensive JavaScript course for developers',
        duration: '40 hours',
        level: 'intermediate',
        status: 'enrolled',
        progress: 65,
        modules: [
          { id: 'mod-1', title: 'ES6+ Features', completed: true },
          { id: 'mod-2', title: 'Async Programming', completed: true },
          { id: 'mod-3', title: 'Testing', completed: false }
        ]
      }
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      pages: 1
    }
  });
});

// Get learning paths
router.get('/learning-paths', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'path-1',
        title: 'Full-Stack Developer Path',
        description: 'Complete path to become a full-stack developer',
        courses: ['course-1', 'course-2', 'course-3'],
        estimatedDuration: '6 months',
        difficulty: 'beginner'
      }
    ]
  });
});

// Start a module
router.post('/programs/:programId/modules/:moduleId/start', (req, res) => {
  const { programId, moduleId } = req.params;
  res.json({
    success: true,
    message: 'Module started successfully',
    data: {
      programId,
      moduleId,
      startedAt: new Date().toISOString(),
      status: 'in_progress'
    }
  });
});

// Complete a module
router.post('/programs/:programId/modules/:moduleId/complete', (req, res) => {
  const { programId, moduleId } = req.params;
  res.json({
    success: true,
    message: 'Module completed successfully',
    data: {
      programId,
      moduleId,
      completedAt: new Date().toISOString(),
      status: 'completed',
      score: 85
    }
  });
});

// Get assessments
router.get('/assessments', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'assessment-1',
        title: 'JavaScript Fundamentals Assessment',
        description: 'Test your JavaScript knowledge',
        duration: 60,
        questions: 20,
        passingScore: 70,
        status: 'available'
      }
    ]
  });
});

// Start assessment
router.post('/assessments/:assessmentId/start', (req, res) => {
  const { assessmentId } = req.params;
  res.json({
    success: true,
    message: 'Assessment started',
    data: {
      assessmentId,
      startedAt: new Date().toISOString(),
      timeLimit: 60,
      status: 'in_progress'
    }
  });
});

// Get certificate
router.get('/programs/:programId/certificate', (req, res) => {
  const { programId } = req.params;
  res.json({
    success: true,
    data: {
      programId,
      certificateUrl: `/api/v1/training/certificates/${programId}.pdf`,
      issuedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    }
  });
});

// Get participant statistics
router.get('/participants/:participantId/stats', (req, res) => {
  const { participantId } = req.params;
  res.json({
    success: true,
    data: {
      participantId,
      totalCourses: 5,
      completedCourses: 3,
      averageScore: 87,
      totalHours: 120,
      certificates: 2,
      currentStreak: 7,
      achievements: ['first_course', 'high_achiever']
    }
  });
});

module.exports = router;
