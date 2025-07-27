const TrainingSession = require('../models/TrainingSession');
const TrainingCourse = require('../models/TrainingCourse');
const TrainingModule = require('../models/TrainingModule');
const TrainingAssessment = require('../models/TrainingAssessment');
const User = require('../models/User');
const logger = require('../utils/logger');
const { optimizeQuery, createPaginationOptions } = require('../config/database');
const cacheManager = require('../utils/cache');

class TrainingController {
  /**
   * Get all training sessions with pagination and optimization
   */
  async getTrainingSessions (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req.user;
      const pagination = createPaginationOptions(req);


      // Try to get from cache first
      const cacheKey = `training:sessions:${tenantId}:${pagination.page}:${pagination.limit}`;
      const cachedResult = await cacheManager.get(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult);
      }


      // Build optimized query
      const query = TrainingSession.find({ tenantId });


      // Apply filters
      if (req.query.status) {
        query.where('status', req.query.status);
      }
      if (req.query.trainerId) {
        query.where('trainerId', req.query.trainerId);
      }
      if (req.query.sessionType) {
        query.where('sessionType', req.query.sessionType);
      }


      // Optimize query with pagination
      const optimizedQuery = optimizeQuery(query, {
        lean: true,
        limit: pagination.limit,
        select: 'title sessionType scheduledAt duration status trainerId participants capacity',
        sort: pagination.sort
      });

      const sessions = await optimizedQuery.skip(pagination.skip);
      const total = await TrainingSession.countDocuments({ tenantId });

      const result = {
        success: true,
        data: {
          sessions,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total,
            pages: Math.ceil(total / pagination.limit)
          }
        },
        message: 'Training sessions retrieved successfully'
      };


      // Cache the result for 5 minutes
      await cacheManager.set(cacheKey, result, 300);

      res.json(result);
    } catch (error) {
      logger.error('❌ Error getting training sessions:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve training sessions'
      });
    }
  }

  /**
   * Get a specific training session by ID
   */
  async getTrainingSession (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { sessionId } = req.params;

      const session = await TrainingSession.findOne({ _id: sessionId, tenantId })
        .populate('trainers.trainerId', 'firstName lastName email phone')
        .populate('participants.userId', 'firstName lastName email role')
        .populate('courseId', 'title courseCode description')
        .populate('createdBy', 'firstName lastName email');

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Training session not found'
        });
      }

      logger.info('Training session retrieved', { sessionId, tenantId });

      res.json({
        success: true,
        data: session
      });
    } catch (error) {
      logger.error('Error retrieving training session', { error: error.message, sessionId: req.params.sessionId });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve training session',
        error: error.message
      });
    }
  }

  /**
   * Create a new training session
   */
  async createTrainingSession (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const sessionData = {
        ...req.body,
        tenantId,
        createdBy: req.user.id
      };

      const session = new TrainingSession(sessionData);
      await session.save();

      const populatedSession = await TrainingSession.findById(session._id)
        .populate('trainers.trainerId', 'firstName lastName email')
        .populate('courseId', 'title courseCode');

      logger.info('Training session created', {
        sessionId: session._id,
        tenantId,
        title: session.title
      });

      res.status(201).json({
        success: true,
        message: 'Training session created successfully',
        data: populatedSession
      });
    } catch (error) {
      logger.error('Error creating training session', { error: error.message, tenantId: req.tenantId });
      res.status(400).json({
        success: false,
        message: 'Failed to create training session',
        error: error.message
      });
    }
  }

  /**
   * Update a training session
   */
  async updateTrainingSession (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { sessionId } = req.params;
      const updateData = {
        ...req.body,
        updatedBy: req.user.id
      };

      const session = await TrainingSession.findOneAndUpdate(
        { _id: sessionId, tenantId },
        updateData,
        { new: true, runValidators: true }
      ).populate('trainers.trainerId', 'firstName lastName email')
        .populate('participants.userId', 'firstName lastName email')
        .populate('courseId', 'title courseCode');

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Training session not found'
        });
      }

      logger.info('Training session updated', { sessionId, tenantId });

      res.json({
        success: true,
        message: 'Training session updated successfully',
        data: session
      });
    } catch (error) {
      logger.error('Error updating training session', { error: error.message, sessionId: req.params.sessionId });
      res.status(400).json({
        success: false,
        message: 'Failed to update training session',
        error: error.message
      });
    }
  }

  /**
   * Delete a training session
   */
  async deleteTrainingSession (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { sessionId } = req.params;

      const session = await TrainingSession.findOneAndDelete({ _id: sessionId, tenantId });

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Training session not found'
        });
      }

      logger.info('Training session deleted', { sessionId, tenantId });

      res.json({
        success: true,
        message: 'Training session deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting training session', { error: error.message, sessionId: req.params.sessionId });
      res.status(500).json({
        success: false,
        message: 'Failed to delete training session',
        error: error.message
      });
    }
  }

  /**
   * Add participant to training session
   */
  async addSessionParticipant (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { sessionId } = req.params;
      const { userId } = req.body;

      const session = await TrainingSession.findOne({ _id: sessionId, tenantId });
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Training session not found'
        });
      }

      await session.addParticipant(userId);

      logger.info('Participant added to training session', {
        sessionId, userId, tenantId
      });

      res.json({
        success: true,
        message: 'Participant added successfully'
      });
    } catch (error) {
      logger.error('Error adding participant to session', { error: error.message, sessionId: req.params.sessionId });
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Remove participant from training session
   */
  async removeSessionParticipant (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { sessionId, userId } = req.params;

      const session = await TrainingSession.findOne({ _id: sessionId, tenantId });
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Training session not found'
        });
      }

      await session.removeParticipant(userId);

      logger.info('Participant removed from training session', {
        sessionId, userId, tenantId
      });

      res.json({
        success: true,
        message: 'Participant removed successfully'
      });
    } catch (error) {
      logger.error('Error removing participant from session', { error: error.message, sessionId: req.params.sessionId });
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Mark attendance for a participant
   */
  async markAttendance (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { sessionId, userId } = req.params;

      const session = await TrainingSession.findOne({ _id: sessionId, tenantId });
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Training session not found'
        });
      }

      await session.markAttendance(userId);

      logger.info('Attendance marked for participant', {
        sessionId, userId, tenantId
      });

      res.json({
        success: true,
        message: 'Attendance marked successfully'
      });
    } catch (error) {
      logger.error('Error marking attendance', { error: error.message, sessionId: req.params.sessionId });
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Complete a training session
   */
  async completeSession (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { sessionId } = req.params;

      const session = await TrainingSession.findOne({ _id: sessionId, tenantId });
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Training session not found'
        });
      }

      await session.completeSession();

      logger.info('Training session completed', { sessionId, tenantId });

      res.json({
        success: true,
        message: 'Training session completed successfully'
      });
    } catch (error) {
      logger.error('Error completing training session', { error: error.message, sessionId: req.params.sessionId });
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get all training courses with pagination and optimization
   */
  async getTrainingCourses (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req.user;
      const pagination = createPaginationOptions(req);


      // Try to get from cache first
      const cacheKey = `training:courses:${tenantId}:${pagination.page}:${pagination.limit}`;
      const cachedResult = await cacheManager.get(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult);
      }


      // Build optimized query
      const query = TrainingCourse.find({ tenantId });


      // Apply filters
      if (req.query.status) {
        query.where('status', req.query.status);
      }
      if (req.query.category) {
        query.where('category', req.query.category);
      }
      if (req.query.instructorId) {
        query.where('instructorId', req.query.instructorId);
      }


      // Optimize query with pagination
      const optimizedQuery = optimizeQuery(query, {
        lean: true,
        limit: pagination.limit,
        select: 'title code category level duration instructorId enrollmentCount status',
        sort: pagination.sort
      });

      const courses = await optimizedQuery.skip(pagination.skip);
      const total = await TrainingCourse.countDocuments({ tenantId });

      const result = {
        success: true,
        data: {
          courses,
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total,
            pages: Math.ceil(total / pagination.limit)
          }
        },
        message: 'Training courses retrieved successfully'
      };


      // Cache the result for 5 minutes
      await cacheManager.set(cacheKey, result, 300);

      res.json(result);
    } catch (error) {
      logger.error('❌ Error getting training courses:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve training courses'
      });
    }
  }

  /**
   * Get a specific training course by ID
   */
  async getTrainingCourse (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { courseId } = req.params;

      const course = await TrainingCourse.findOne({ _id: courseId, tenantId })
        .populate('instructors.instructorId', 'firstName lastName email phone')
        .populate('modules.moduleId', 'title moduleCode description estimatedDuration')
        .populate('assessments.assessmentId', 'title type passingScore')
        .populate('enrollments.userId', 'firstName lastName email role')
        .populate('createdBy', 'firstName lastName email');

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Training course not found'
        });
      }

      logger.info('Training course retrieved', { courseId, tenantId });

      res.json({
        success: true,
        data: course
      });
    } catch (error) {
      logger.error('Error retrieving training course', { error: error.message, courseId: req.params.courseId });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve training course',
        error: error.message
      });
    }
  }

  /**
   * Create a new training course
   */
  async createTrainingCourse (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const courseData = {
        ...req.body,
        tenantId,
        createdBy: req.user.id
      };

      const course = new TrainingCourse(courseData);
      await course.save();

      const populatedCourse = await TrainingCourse.findById(course._id)
        .populate('instructors.instructorId', 'firstName lastName email')
        .populate('modules.moduleId', 'title moduleCode');

      logger.info('Training course created', {
        courseId: course._id,
        tenantId,
        title: course.title
      });

      res.status(201).json({
        success: true,
        message: 'Training course created successfully',
        data: populatedCourse
      });
    } catch (error) {
      logger.error('Error creating training course', { error: error.message, tenantId: req.tenantId });
      res.status(400).json({
        success: false,
        message: 'Failed to create training course',
        error: error.message
      });
    }
  }

  /**
   * Update a training course
   */
  async updateTrainingCourse (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { courseId } = req.params;
      const updateData = {
        ...req.body,
        updatedBy: req.user.id
      };

      const course = await TrainingCourse.findOneAndUpdate(
        { _id: courseId, tenantId },
        updateData,
        { new: true, runValidators: true }
      ).populate('instructors.instructorId', 'firstName lastName email')
        .populate('modules.moduleId', 'title moduleCode')
        .populate('assessments.assessmentId', 'title type');

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Training course not found'
        });
      }

      logger.info('Training course updated', { courseId, tenantId });

      res.json({
        success: true,
        message: 'Training course updated successfully',
        data: course
      });
    } catch (error) {
      logger.error('Error updating training course', { error: error.message, courseId: req.params.courseId });
      res.status(400).json({
        success: false,
        message: 'Failed to update training course',
        error: error.message
      });
    }
  }

  /**
   * Delete a training course
   */
  async deleteTrainingCourse (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { courseId } = req.params;

      const course = await TrainingCourse.findOneAndDelete({ _id: courseId, tenantId });

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Training course not found'
        });
      }

      logger.info('Training course deleted', { courseId, tenantId });

      res.json({
        success: true,
        message: 'Training course deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting training course', { error: error.message, courseId: req.params.courseId });
      res.status(500).json({
        success: false,
        message: 'Failed to delete training course',
        error: error.message
      });
    }
  }

  /**
   * Enroll user in a course
   */
  async enrollInCourse (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { courseId } = req.params;
      const { userId } = req.body;

      const course = await TrainingCourse.findOne({ _id: courseId, tenantId });
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Training course not found'
        });
      }

      await course.enrollUser(userId);

      logger.info('User enrolled in course', {
        courseId, userId, tenantId
      });

      res.json({
        success: true,
        message: 'User enrolled successfully'
      });
    } catch (error) {
      logger.error('Error enrolling user in course', { error: error.message, courseId: req.params.courseId });
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get participant progress
   */
  async getParticipantProgress (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { courseId, participantId } = req.params;

      const course = await TrainingCourse.findOne({ _id: courseId, tenantId });
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Training course not found'
        });
      }

      const enrollment = course.enrollments.find(e => e.userId.toString() === participantId);
      if (!enrollment) {
        return res.status(404).json({
          success: false,
          message: 'Participant not enrolled in this course'
        });
      }

      logger.info('Participant progress retrieved', {
        courseId, participantId, tenantId
      });

      res.json({
        success: true,
        data: enrollment
      });
    } catch (error) {
      logger.error('Error retrieving participant progress', { error: error.message, courseId: req.params.courseId });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve participant progress',
        error: error.message
      });
    }
  }

  /**
   * Complete a module
   */
  async completeModule (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { courseId, moduleId } = req.params;
      const { userId, score } = req.body;

      const course = await TrainingCourse.findOne({ _id: courseId, tenantId });
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Training course not found'
        });
      }

      await course.updateUserProgress(userId, moduleId, score);

      logger.info('Module completed', {
        courseId, moduleId, userId, tenantId
      });

      res.json({
        success: true,
        message: 'Module completed successfully'
      });
    } catch (error) {
      logger.error('Error completing module', { error: error.message, courseId: req.params.courseId });
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }


  // ==================== TRAINING MODULES ====================

  /**
   * Get all training modules for a tenant
   */
  async getTrainingModules (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const {
        page = 1,
        limit = 10,
        category,
        type,
        difficulty,
        isActive,
        isPublished,
        search
      } = req.query;

      const query = { tenantId };

      if (category) {
        query.category = category;
      }
      if (type) {
        query.type = type;
      }
      if (difficulty) {
        query.difficulty = difficulty;
      }
      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }
      if (isPublished !== undefined) {
        query.isPublished = isPublished === 'true';
      }
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { moduleCode: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;

      const modules = await TrainingModule.find(query)
        .populate('assessments.assessmentId', 'title type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await TrainingModule.countDocuments(query);

      logger.info('Training modules retrieved', {
        tenantId,
        count: modules.length,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: modules,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error retrieving training modules', { error: error.message, tenantId: req.tenantId });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve training modules',
        error: error.message
      });
    }
  }

  /**
   * Get a specific training module by ID
   */
  async getTrainingModule (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { moduleId } = req.params;

      const module = await TrainingModule.findOne({ _id: moduleId, tenantId })
        .populate('assessments.assessmentId', 'title type passingScore')
        .populate('createdBy', 'firstName lastName email');

      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Training module not found'
        });
      }

      logger.info('Training module retrieved', { moduleId, tenantId });

      res.json({
        success: true,
        data: module
      });
    } catch (error) {
      logger.error('Error retrieving training module', { error: error.message, moduleId: req.params.moduleId });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve training module',
        error: error.message
      });
    }
  }

  /**
   * Create a new training module
   */
  async createTrainingModule (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const moduleData = {
        ...req.body,
        tenantId,
        createdBy: req.user.id
      };

      const module = new TrainingModule(moduleData);
      await module.save();

      logger.info('Training module created', {
        moduleId: module._id,
        tenantId,
        title: module.title
      });

      res.status(201).json({
        success: true,
        message: 'Training module created successfully',
        data: module
      });
    } catch (error) {
      logger.error('Error creating training module', { error: error.message, tenantId: req.tenantId });
      res.status(400).json({
        success: false,
        message: 'Failed to create training module',
        error: error.message
      });
    }
  }

  /**
   * Update a training module
   */
  async updateTrainingModule (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { moduleId } = req.params;
      const updateData = {
        ...req.body,
        updatedBy: req.user.id
      };

      const module = await TrainingModule.findOneAndUpdate(
        { _id: moduleId, tenantId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Training module not found'
        });
      }

      logger.info('Training module updated', { moduleId, tenantId });

      res.json({
        success: true,
        message: 'Training module updated successfully',
        data: module
      });
    } catch (error) {
      logger.error('Error updating training module', { error: error.message, moduleId: req.params.moduleId });
      res.status(400).json({
        success: false,
        message: 'Failed to update training module',
        error: error.message
      });
    }
  }

  /**
   * Delete a training module
   */
  async deleteTrainingModule (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { moduleId } = req.params;

      const module = await TrainingModule.findOneAndDelete({ _id: moduleId, tenantId });

      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Training module not found'
        });
      }

      logger.info('Training module deleted', { moduleId, tenantId });

      res.json({
        success: true,
        message: 'Training module deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting training module', { error: error.message, moduleId: req.params.moduleId });
      res.status(500).json({
        success: false,
        message: 'Failed to delete training module',
        error: error.message
      });
    }
  }


  // ==================== TRAINING ASSESSMENTS ====================

  /**
   * Get all training assessments for a tenant
   */
  async getTrainingAssessments (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const {
        page = 1,
        limit = 10,
        type,
        category,
        isActive,
        isPublished,
        search
      } = req.query;

      const query = { tenantId };

      if (type) {
        query.type = type;
      }
      if (category) {
        query.category = category;
      }
      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }
      if (isPublished !== undefined) {
        query.isPublished = isPublished === 'true';
      }
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { assessmentCode: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;

      const assessments = await TrainingAssessment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await TrainingAssessment.countDocuments(query);

      logger.info('Training assessments retrieved', {
        tenantId,
        count: assessments.length,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: assessments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error retrieving training assessments', { error: error.message, tenantId: req.tenantId });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve training assessments',
        error: error.message
      });
    }
  }

  /**
   * Get a specific training assessment by ID
   */
  async getTrainingAssessment (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { assessmentId } = req.params;

      const assessment = await TrainingAssessment.findOne({ _id: assessmentId, tenantId })
        .populate('createdBy', 'firstName lastName email');

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Training assessment not found'
        });
      }

      logger.info('Training assessment retrieved', { assessmentId, tenantId });

      res.json({
        success: true,
        data: assessment
      });
    } catch (error) {
      logger.error('Error retrieving training assessment', { error: error.message, assessmentId: req.params.assessmentId });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve training assessment',
        error: error.message
      });
    }
  }

  /**
   * Create a new training assessment
   */
  async createTrainingAssessment (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const assessmentData = {
        ...req.body,
        tenantId,
        createdBy: req.user.id
      };

      const assessment = new TrainingAssessment(assessmentData);
      await assessment.save();

      logger.info('Training assessment created', {
        assessmentId: assessment._id,
        tenantId,
        title: assessment.title
      });

      res.status(201).json({
        success: true,
        message: 'Training assessment created successfully',
        data: assessment
      });
    } catch (error) {
      logger.error('Error creating training assessment', { error: error.message, tenantId: req.tenantId });
      res.status(400).json({
        success: false,
        message: 'Failed to create training assessment',
        error: error.message
      });
    }
  }

  /**
   * Update a training assessment
   */
  async updateTrainingAssessment (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { assessmentId } = req.params;
      const updateData = {
        ...req.body,
        updatedBy: req.user.id
      };

      const assessment = await TrainingAssessment.findOneAndUpdate(
        { _id: assessmentId, tenantId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Training assessment not found'
        });
      }

      logger.info('Training assessment updated', { assessmentId, tenantId });

      res.json({
        success: true,
        message: 'Training assessment updated successfully',
        data: assessment
      });
    } catch (error) {
      logger.error('Error updating training assessment', { error: error.message, assessmentId: req.params.assessmentId });
      res.status(400).json({
        success: false,
        message: 'Failed to update training assessment',
        error: error.message
      });
    }
  }

  /**
   * Delete a training assessment
   */
  async deleteTrainingAssessment (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { assessmentId } = req.params;

      const assessment = await TrainingAssessment.findOneAndDelete({ _id: assessmentId, tenantId });

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Training assessment not found'
        });
      }

      logger.info('Training assessment deleted', { assessmentId, tenantId });

      res.json({
        success: true,
        message: 'Training assessment deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting training assessment', { error: error.message, assessmentId: req.params.assessmentId });
      res.status(500).json({
        success: false,
        message: 'Failed to delete training assessment',
        error: error.message
      });
    }
  }

  /**
   * Submit assessment answers
   */
  async submitAssessment (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { assessmentId } = req.params;
      const { answers, userId } = req.body;

      const assessment = await TrainingAssessment.findOne({ _id: assessmentId, tenantId });
      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Training assessment not found'
        });
      }

      const result = assessment.calculateScore(answers);


      // Update assessment statistics
      await assessment.updateStatistics({
        completed: true,
        score: result.percentage,
        passed: result.passed
      });

      logger.info('Assessment submitted', {
        assessmentId,
        userId,
        tenantId,
        score: result.percentage,
        passed: result.passed
      });

      res.json({
        success: true,
        message: 'Assessment submitted successfully',
        data: {
          score: result.score,
          maxScore: result.maxScore,
          percentage: result.percentage,
          passed: result.passed
        }
      });
    } catch (error) {
      logger.error('Error submitting assessment', { error: error.message, assessmentId: req.params.assessmentId });
      res.status(400).json({
        success: false,
        message: 'Failed to submit assessment',
        error: error.message
      });
    }
  }

  /**
   * Get trainer statistics with optimization
   */
  async getTrainerStats (req, res) {
    // TODO: Add await statements
    try {
      const { trainerId } = req.params;
      const { tenantId } = req.user;


      // Try to get from cache first
      const cacheKey = `trainer:stats:${trainerId}:${tenantId}`;
      const cachedResult = await cacheManager.get(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult);
      }


      // Get trainer sessions with optimization
      const sessionsQuery = TrainingSession.find({
        trainerId,
        tenantId
      });

      const sessions = await optimizeQuery(sessionsQuery, {
        lean: true,
        select: 'title scheduledAt duration status participants attendance'
      });


      // Calculate statistics
      const stats = {
        totalSessions: sessions.length,
        completedSessions: sessions.filter(s => s.status === 'completed').length,
        upcomingSessions: sessions.filter(s => s.status === 'scheduled').length,
        totalDuration: sessions.reduce((sum, s) => sum + (s.duration || 0), 0),
        averageAttendance: sessions.length > 0
          ? sessions.reduce((sum, s) => sum + (s.attendance?.length || 0), 0) / sessions.length : 0,
        totalParticipants: sessions.reduce((sum, s) => sum + (s.participants?.length || 0), 0)
      };

      const result = {
        success: true,
        data: {
          trainerId,
          stats,
          recentSessions: sessions.slice(0, 5)
          // Last 5 sessions
        },
        message: 'Trainer statistics retrieved successfully'
      };


      // Cache the result for 10 minutes
      await cacheManager.set(cacheKey, result, 600);

      res.json(result);
    } catch (error) {
      logger.error('❌ Error getting trainer stats:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve trainer statistics'
      });
    }
  }

  /**
   * Get participant statistics with optimization
   */
  async getParticipantStats (req, res) {
    // TODO: Add await statements
    try {
      const { participantId } = req.params;
      const { tenantId } = req.user;


      // Try to get from cache first
      const cacheKey = `participant:stats:${participantId}:${tenantId}`;
      const cachedResult = await cacheManager.get(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult);
      }


      // Get participant sessions with optimization
      const sessionsQuery = TrainingSession.find({
        participants: participantId,
        tenantId
      });

      const sessions = await optimizeQuery(sessionsQuery, {
        lean: true,
        select: 'title scheduledAt duration status attendance'
      });


      // Get participant courses with optimization
      const coursesQuery = TrainingCourse.find({
        'enrollments.participantId': participantId,
        tenantId
      });

      const courses = await optimizeQuery(coursesQuery, {
        lean: true,
        select: 'title code category level progress'
      });


      // Calculate statistics
      const stats = {
        totalSessions: sessions.length,
        attendedSessions: sessions.filter(s =>
          s.attendance?.some(a => a.participantId === participantId && a.attended)
        ).length,
        totalCourses: courses.length,
        completedCourses: courses.filter(c =>
          c.progress?.find(p => p.participantId === participantId)?.completed
        ).length,
        totalDuration: sessions.reduce((sum, s) => sum + (s.duration || 0), 0),
        attendanceRate: sessions.length > 0
          ? sessions.filter(s =>
            s.attendance?.some(a => a.participantId === participantId && a.attended)
          ).length / sessions.length * 100 : 0
      };

      const result = {
        success: true,
        data: {
          participantId,
          stats,
          recentSessions: sessions.slice(0, 5),
          // Last 5 sessions
          enrolledCourses: courses.slice(0, 5)
          // Last 5 courses
        },
        message: 'Participant statistics retrieved successfully'
      };


      // Cache the result for 10 minutes
      await cacheManager.set(cacheKey, result, 600);

      res.json(result);
    } catch (error) {
      logger.error('❌ Error getting participant stats:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        message: 'Failed to retrieve participant statistics'
      });
    }
  }
}

module.exports = new TrainingController();
