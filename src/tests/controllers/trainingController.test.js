const request = require('supertest');
const express = require('express');
const testUtils = require('../setup');
const TrainingController = require('../../controllers/trainingController');
const TrainingSession = require('../../models/TrainingSession');
const TrainingCourse = require('../../models/TrainingCourse');


// Create Express app for testing
const app = express();
app.use(express.json());


// Mock middleware
const mockAuthMiddleware = (req, res, next) => {
  req.user = testUtils.testConfig.testUsers[0];
  next();
};


// Apply middleware and routes
app.use(mockAuthMiddleware);


// Initialize controller
const trainingController = new TrainingController();


// Test routes
app.get('/api/v1/training/sessions', trainingController.getTrainingSessions);
app.get('/api/v1/training/courses', trainingController.getTrainingCourses);
app.get('/api/v1/training/trainers/:trainerId/stats', trainingController.getTrainerStats);
app.get('/api/v1/training/participants/:participantId/stats', trainingController.getParticipantStats);

describe('TrainingController', () => {
  beforeAll(async () => {
    await testUtils.setupTestDatabase();
    await testUtils.seedTestData();
  });

  afterEach(async () => {
    await testUtils.clearCollections();
    await testUtils.seedTestData();
  });

  afterAll(async () => {
    await testUtils.teardownTestDatabase();
  });

  describe('GET /api/v1/training/sessions', () => {
    it('should return training sessions with pagination', async () => {
      // Create test training sessions
      const testSessions = [
        {
          title: 'Test Session 1',
          sessionType: 'workshop',
          scheduledAt: new Date(),
          duration: 120,
          status: 'scheduled',
          trainerId: testUtils.testConfig.testUsers[1]._id,
          participants: [testUtils.testConfig.testUsers[2]._id],
          capacity: 20,
          tenantId: testUtils.testConfig.testUsers[0].tenantId
        },
        {
          title: 'Test Session 2',
          sessionType: 'lecture',
          scheduledAt: new Date(),
          duration: 90,
          status: 'completed',
          trainerId: testUtils.testConfig.testUsers[1]._id,
          participants: [testUtils.testConfig.testUsers[2]._id],
          capacity: 15,
          tenantId: testUtils.testConfig.testUsers[0].tenantId
        }
      ];

      await TrainingSession.insertMany(testSessions);

      const response = await request(app)
        .get('/api/v1/training/sessions')
        .set('Authorization', `Bearer ${testUtils.generateTestToken()}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.total).toBe(2);
      expect(response.body.data.pagination.page).toBe(1);
    });

    it('should filter sessions by status', async () => {
      // Create test sessions with different statuses
      const testSessions = [
        {
          title: 'Scheduled Session',
          sessionType: 'workshop',
          scheduledAt: new Date(),
          duration: 120,
          status: 'scheduled',
          trainerId: testUtils.testConfig.testUsers[1]._id,
          participants: [],
          capacity: 20,
          tenantId: testUtils.testConfig.testUsers[0].tenantId
        },
        {
          title: 'Completed Session',
          sessionType: 'lecture',
          scheduledAt: new Date(),
          duration: 90,
          status: 'completed',
          trainerId: testUtils.testConfig.testUsers[1]._id,
          participants: [],
          capacity: 15,
          tenantId: testUtils.testConfig.testUsers[0].tenantId
        }
      ];

      await TrainingSession.insertMany(testSessions);

      const response = await request(app)
        .get('/api/v1/training/sessions?status=scheduled')
        .set('Authorization', `Bearer ${testUtils.generateTestToken()}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions).toHaveLength(1);
      expect(response.body.data.sessions[0].status).toBe('scheduled');
    });

    it('should handle empty results', async () => {
      const response = await request(app)
        .get('/api/v1/training/sessions')
        .set('Authorization', `Bearer ${testUtils.generateTestToken()}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });
  });

  describe('GET /api/v1/training/courses', () => {
    it('should return training courses with pagination', async () => {
      // Create test training courses
      const testCourses = [
        {
          title: 'Test Course 1',
          code: 'TC001',
          category: 'Technology',
          level: 'beginner',
          duration: 480,
          instructorId: testUtils.testConfig.testUsers[1]._id,
          enrollmentCount: 5,
          status: 'active',
          tenantId: testUtils.testConfig.testUsers[0].tenantId
        },
        {
          title: 'Test Course 2',
          code: 'TC002',
          category: 'Business',
          level: 'intermediate',
          duration: 360,
          instructorId: testUtils.testConfig.testUsers[1]._id,
          enrollmentCount: 3,
          status: 'active',
          tenantId: testUtils.testConfig.testUsers[0].tenantId
        }
      ];

      await TrainingCourse.insertMany(testCourses);

      const response = await request(app)
        .get('/api/v1/training/courses')
        .set('Authorization', `Bearer ${testUtils.generateTestToken()}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.courses).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should filter courses by category', async () => {
      // Create test courses with different categories
      const testCourses = [
        {
          title: 'Tech Course',
          code: 'TECH001',
          category: 'Technology',
          level: 'beginner',
          duration: 480,
          instructorId: testUtils.testConfig.testUsers[1]._id,
          enrollmentCount: 5,
          status: 'active',
          tenantId: testUtils.testConfig.testUsers[0].tenantId
        },
        {
          title: 'Business Course',
          code: 'BUS001',
          category: 'Business',
          level: 'intermediate',
          duration: 360,
          instructorId: testUtils.testConfig.testUsers[1]._id,
          enrollmentCount: 3,
          status: 'active',
          tenantId: testUtils.testConfig.testUsers[0].tenantId
        }
      ];

      await TrainingCourse.insertMany(testCourses);

      const response = await request(app)
        .get('/api/v1/training/courses?category=Technology')
        .set('Authorization', `Bearer ${testUtils.generateTestToken()}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.courses).toHaveLength(1);
      expect(response.body.data.courses[0].category).toBe('Technology');
    });
  });

  describe('GET /api/v1/training/trainers/:trainerId/stats', () => {
    it('should return trainer statistics', async () => {
      const trainerId = testUtils.testConfig.testUsers[1]._id;


      // Create test sessions for the trainer
      const testSessions = [
        {
          title: 'Trainer Session 1',
          sessionType: 'workshop',
          scheduledAt: new Date(),
          duration: 120,
          status: 'completed',
          trainerId,
          participants: [testUtils.testConfig.testUsers[2]._id],
          attendance: [
            {
              participantId: testUtils.testConfig.testUsers[2]._id,
              attended: true
            }
          ],
          capacity: 20,
          tenantId: testUtils.testConfig.testUsers[0].tenantId
        },
        {
          title: 'Trainer Session 2',
          sessionType: 'lecture',
          scheduledAt: new Date(Date.now() + 86400000),
          // Tomorrow
          duration: 90,
          status: 'scheduled',
          trainerId,
          participants: [testUtils.testConfig.testUsers[2]._id],
          capacity: 15,
          tenantId: testUtils.testConfig.testUsers[0].tenantId
        }
      ];

      await TrainingSession.insertMany(testSessions);

      const response = await request(app)
        .get(`/api/v1/training/trainers/${trainerId}/stats`)
        .set('Authorization', `Bearer ${testUtils.generateTestToken()}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.trainerId).toBe(trainerId.toString());
      expect(response.body.data.stats.totalSessions).toBe(2);
      expect(response.body.data.stats.completedSessions).toBe(1);
      expect(response.body.data.stats.upcomingSessions).toBe(1);
      expect(response.body.data.stats.totalDuration).toBe(210);
      expect(response.body.data.stats.averageAttendance).toBe(1);
      expect(response.body.data.stats.totalParticipants).toBe(2);
    });

    it('should handle trainer with no sessions', async () => {
      const trainerId = testUtils.testConfig.testUsers[1]._id;

      const response = await request(app)
        .get(`/api/v1/training/trainers/${trainerId}/stats`)
        .set('Authorization', `Bearer ${testUtils.generateTestToken()}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats.totalSessions).toBe(0);
      expect(response.body.data.stats.completedSessions).toBe(0);
      expect(response.body.data.stats.upcomingSessions).toBe(0);
      expect(response.body.data.stats.totalDuration).toBe(0);
      expect(response.body.data.stats.averageAttendance).toBe(0);
      expect(response.body.data.stats.totalParticipants).toBe(0);
    });
  });

  describe('GET /api/v1/training/participants/:participantId/stats', () => {
    it('should return participant statistics', async () => {
      const participantId = testUtils.testConfig.testUsers[2]._id;


      // Create test sessions where user is a participant
      const testSessions = [
        {
          title: 'Participant Session 1',
          sessionType: 'workshop',
          scheduledAt: new Date(),
          duration: 120,
          status: 'completed',
          trainerId: testUtils.testConfig.testUsers[1]._id,
          participants: [participantId],
          attendance: [
            {
              participantId,
              attended: true
            }
          ],
          capacity: 20,
          tenantId: testUtils.testConfig.testUsers[0].tenantId
        },
        {
          title: 'Participant Session 2',
          sessionType: 'lecture',
          scheduledAt: new Date(),
          duration: 90,
          status: 'completed',
          trainerId: testUtils.testConfig.testUsers[1]._id,
          participants: [participantId],
          attendance: [
            {
              participantId,
              attended: false
            }
          ],
          capacity: 15,
          tenantId: testUtils.testConfig.testUsers[0].tenantId
        }
      ];

      await TrainingSession.insertMany(testSessions);


      // Create test courses where user is enrolled
      const testCourses = [
        {
          title: 'Participant Course 1',
          code: 'PC001',
          category: 'Technology',
          level: 'beginner',
          duration: 480,
          instructorId: testUtils.testConfig.testUsers[1]._id,
          enrollments: [{ participantId }],
          progress: [
            {
              participantId,
              completed: true,
              progress: 100
            }
          ],
          status: 'active',
          tenantId: testUtils.testConfig.testUsers[0].tenantId
        }
      ];

      await TrainingCourse.insertMany(testCourses);

      const response = await request(app)
        .get(`/api/v1/training/participants/${participantId}/stats`)
        .set('Authorization', `Bearer ${testUtils.generateTestToken()}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.participantId).toBe(participantId.toString());
      expect(response.body.data.stats.totalSessions).toBe(2);
      expect(response.body.data.stats.attendedSessions).toBe(1);
      expect(response.body.data.stats.totalCourses).toBe(1);
      expect(response.body.data.stats.completedCourses).toBe(1);
      expect(response.body.data.stats.totalDuration).toBe(210);
      expect(response.body.data.stats.attendanceRate).toBe(50);
    });

    it('should handle participant with no sessions or courses', async () => {
      const participantId = testUtils.testConfig.testUsers[2]._id;

      const response = await request(app)
        .get(`/api/v1/training/participants/${participantId}/stats`)
        .set('Authorization', `Bearer ${testUtils.generateTestToken()}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats.totalSessions).toBe(0);
      expect(response.body.data.stats.attendedSessions).toBe(0);
      expect(response.body.data.stats.totalCourses).toBe(0);
      expect(response.body.data.stats.completedCourses).toBe(0);
      expect(response.body.data.stats.totalDuration).toBe(0);
      expect(response.body.data.stats.attendanceRate).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      jest.spyOn(TrainingSession, 'find').mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .get('/api/v1/training/sessions')
        .set('Authorization', `Bearer ${testUtils.generateTestToken()}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database connection failed');


      // Restore original implementation
      jest.restoreAllMocks();
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/training/sessions?page=-1&limit=1000')
        .set('Authorization', `Bearer ${testUtils.generateTestToken()}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(100);
      // Max limit enforced
    });
  });
});
