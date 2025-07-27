const Presentation = require('../models/Presentation');
const Poll = require('../models/Poll');
const User = require('../models/User');
const logger = require('../utils/logger');

class PresentationController {
// ==================== PRESENTATIONS ====================

  /**
   * Get all presentations for a tenant
   */
  async getPresentations (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const {
        page = 1,
        limit = 10,
        category,
        isActive,
        isPublished,
        search
      } = req.query;

      const query = { tenantId };

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
          { presentationCode: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;

      const presentations = await Presentation.find(query)
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Presentation.countDocuments(query);

      logger.info('Presentations retrieved', {
        tenantId,
        count: presentations.length,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        data: presentations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error retrieving presentations', { error: error.message, tenantId: req.tenantId });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve presentations',
        error: error.message
      });
    }
  }

  /**
   * Get a specific presentation by ID
   */
  async getPresentation (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { presentationId } = req.params;

      const presentation = await Presentation.findOne({ _id: presentationId, tenantId })
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email');

      if (!presentation) {
        return res.status(404).json({
          success: false,
          message: 'Presentation not found'
        });
      }

      logger.info('Presentation retrieved', { presentationId, tenantId });

      res.json({
        success: true,
        data: presentation
      });
    } catch (error) {
      logger.error('Error retrieving presentation', { error: error.message, presentationId: req.params.presentationId });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve presentation',
        error: error.message
      });
    }
  }

  /**
   * Create a new presentation
   */
  async createPresentation (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const presentationData = {
        ...req.body,
        tenantId,
        createdBy: req.user.id
      };

      const presentation = new Presentation(presentationData);
      await presentation.save();

      logger.info('Presentation created', {
        presentationId: presentation._id,
        tenantId,
        title: presentation.title
      });

      res.status(201).json({
        success: true,
        message: 'Presentation created successfully',
        data: presentation
      });
    } catch (error) {
      logger.error('Error creating presentation', { error: error.message, tenantId: req.tenantId });
      res.status(400).json({
        success: false,
        message: 'Failed to create presentation',
        error: error.message
      });
    }
  }

  /**
   * Update a presentation
   */
  async updatePresentation (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { presentationId } = req.params;
      const updateData = {
        ...req.body,
        updatedBy: req.user.id
      };

      const presentation = await Presentation.findOneAndUpdate(
        { _id: presentationId, tenantId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!presentation) {
        return res.status(404).json({
          success: false,
          message: 'Presentation not found'
        });
      }

      logger.info('Presentation updated', { presentationId, tenantId });

      res.json({
        success: true,
        message: 'Presentation updated successfully',
        data: presentation
      });
    } catch (error) {
      logger.error('Error updating presentation', { error: error.message, presentationId: req.params.presentationId });
      res.status(400).json({
        success: false,
        message: 'Failed to update presentation',
        error: error.message
      });
    }
  }

  /**
   * Delete a presentation
   */
  async deletePresentation (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { presentationId } = req.params;

      const presentation = await Presentation.findOneAndDelete({ _id: presentationId, tenantId });

      if (!presentation) {
        return res.status(404).json({
          success: false,
          message: 'Presentation not found'
        });
      }

      logger.info('Presentation deleted', { presentationId, tenantId });

      res.json({
        success: true,
        message: 'Presentation deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting presentation', { error: error.message, presentationId: req.params.presentationId });
      res.status(500).json({
        success: false,
        message: 'Failed to delete presentation',
        error: error.message
      });
    }
  }


  // ==================== PRESENTATION SESSIONS ====================

  /**
   * Start a presentation session
   */
  async startPresentation (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { presentationId } = req.params;
      const { sessionData } = req.body;

      const presentation = await Presentation.findOne({ _id: presentationId, tenantId });
      if (!presentation) {
        return res.status(404).json({
          success: false,
          message: 'Presentation not found'
        });
      }

      const session = await presentation.createSession(sessionData);

      logger.info('Presentation session started', {
        presentationId,
        sessionId: session.sessionId,
        tenantId
      });

      res.json({
        success: true,
        message: 'Presentation session started successfully',
        data: session
      });
    } catch (error) {
      logger.error('Error starting presentation session', { error: error.message, presentationId: req.params.presentationId });
      res.status(400).json({
        success: false,
        message: 'Failed to start presentation session',
        error: error.message
      });
    }
  }

  /**
   * End a presentation session
   */
  async endPresentation (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { presentationId, sessionId } = req.params;

      const presentation = await Presentation.findOne({ _id: presentationId, tenantId });
      if (!presentation) {
        return res.status(404).json({
          success: false,
          message: 'Presentation not found'
        });
      }

      await presentation.endSession(sessionId);

      logger.info('Presentation session ended', {
        presentationId,
        sessionId,
        tenantId
      });

      res.json({
        success: true,
        message: 'Presentation session ended successfully'
      });
    } catch (error) {
      logger.error('Error ending presentation session', { error: error.message, presentationId: req.params.presentationId });
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Add participant to presentation session
   */
  async addSessionParticipant (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { presentationId, sessionId } = req.params;
      const { userId, role = 'attendee' } = req.body;

      const presentation = await Presentation.findOne({ _id: presentationId, tenantId });
      if (!presentation) {
        return res.status(404).json({
          success: false,
          message: 'Presentation not found'
        });
      }

      await presentation.addParticipant(sessionId, userId, role);

      logger.info('Participant added to presentation session', {
        presentationId,
        sessionId,
        userId,
        role,
        tenantId
      });

      res.json({
        success: true,
        message: 'Participant added successfully'
      });
    } catch (error) {
      logger.error('Error adding participant to presentation session', { error: error.message, presentationId: req.params.presentationId });
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Remove participant from presentation session
   */
  async removeSessionParticipant (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { presentationId, sessionId, userId } = req.params;

      const presentation = await Presentation.findOne({ _id: presentationId, tenantId });
      if (!presentation) {
        return res.status(404).json({
          success: false,
          message: 'Presentation not found'
        });
      }

      await presentation.removeParticipant(sessionId, userId);

      logger.info('Participant removed from presentation session', {
        presentationId,
        sessionId,
        userId,
        tenantId
      });

      res.json({
        success: true,
        message: 'Participant removed successfully'
      });
    } catch (error) {
      logger.error('Error removing participant from presentation session', { error: error.message, presentationId: req.params.presentationId });
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Advance to next slide
   */
  async advanceSlide (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { presentationId, sessionId } = req.params;
      const { slideIndex } = req.body;

      const presentation = await Presentation.findOne({ _id: presentationId, tenantId });
      if (!presentation) {
        return res.status(404).json({
          success: false,
          message: 'Presentation not found'
        });
      }

      await presentation.advanceSlide(sessionId, slideIndex);

      logger.info('Slide advanced', {
        presentationId,
        sessionId,
        slideIndex,
        tenantId
      });

      res.json({
        success: true,
        message: 'Slide advanced successfully'
      });
    } catch (error) {
      logger.error('Error advancing slide', { error: error.message, presentationId: req.params.presentationId });
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }


  // ==================== PRESENTATION POLLS ====================

  /**
   * Add poll to presentation
   */
  async addPollToPresentation (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { presentationId } = req.params;
      const { pollId, slideId } = req.body;

      const presentation = await Presentation.findOne({ _id: presentationId, tenantId });
      if (!presentation) {
        return res.status(404).json({
          success: false,
          message: 'Presentation not found'
        });
      }


      // Verify poll exists
      const poll = await Poll.findOne({ _id: pollId, tenantId });
      if (!poll) {
        return res.status(404).json({
          success: false,
          message: 'Poll not found'
        });
      }


      // Add poll to slide
      const slide = presentation.slides.find(s => s.slideId === slideId);
      if (!slide) {
        return res.status(404).json({
          success: false,
          message: 'Slide not found'
        });
      }

      slide.pollId = pollId;
      await presentation.save();

      logger.info('Poll added to presentation', {
        presentationId,
        pollId,
        slideId,
        tenantId
      });

      res.json({
        success: true,
        message: 'Poll added to presentation successfully'
      });
    } catch (error) {
      logger.error('Error adding poll to presentation', { error: error.message, presentationId: req.params.presentationId });
      res.status(400).json({
        success: false,
        message: 'Failed to add poll to presentation',
        error: error.message
      });
    }
  }

  /**
   * Activate poll in presentation session
   */
  async activatePoll (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { presentationId, sessionId, pollId } = req.params;
      const { slideId } = req.body;

      const presentation = await Presentation.findOne({ _id: presentationId, tenantId });
      if (!presentation) {
        return res.status(404).json({
          success: false,
          message: 'Presentation not found'
        });
      }

      await presentation.activatePoll(sessionId, pollId, slideId);

      logger.info('Poll activated in presentation session', {
        presentationId,
        sessionId,
        pollId,
        slideId,
        tenantId
      });

      res.json({
        success: true,
        message: 'Poll activated successfully'
      });
    } catch (error) {
      logger.error('Error activating poll', { error: error.message, presentationId: req.params.presentationId });
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Deactivate poll in presentation session
   */
  async deactivatePoll (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { presentationId, sessionId, pollId } = req.params;

      const presentation = await Presentation.findOne({ _id: presentationId, tenantId });
      if (!presentation) {
        return res.status(404).json({
          success: false,
          message: 'Presentation not found'
        });
      }

      await presentation.deactivatePoll(sessionId, pollId);

      logger.info('Poll deactivated in presentation session', {
        presentationId,
        sessionId,
        pollId,
        tenantId
      });

      res.json({
        success: true,
        message: 'Poll deactivated successfully'
      });
    } catch (error) {
      logger.error('Error deactivating poll', { error: error.message, presentationId: req.params.presentationId });
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Submit poll response in presentation session
   */
  async submitPollResponse (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { presentationId, sessionId, pollId } = req.params;
      const { userId, response } = req.body;

      const presentation = await Presentation.findOne({ _id: presentationId, tenantId });
      if (!presentation) {
        return res.status(404).json({
          success: false,
          message: 'Presentation not found'
        });
      }

      await presentation.submitPollResponse(sessionId, pollId, userId, response);

      logger.info('Poll response submitted in presentation session', {
        presentationId,
        sessionId,
        pollId,
        userId,
        tenantId
      });

      res.json({
        success: true,
        message: 'Poll response submitted successfully'
      });
    } catch (error) {
      logger.error('Error submitting poll response', { error: error.message, presentationId: req.params.presentationId });
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Get poll results from presentation session
   */
  async getPollResults (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { presentationId, sessionId, pollId } = req.params;

      const presentation = await Presentation.findOne({ _id: presentationId, tenantId });
      if (!presentation) {
        return res.status(404).json({
          success: false,
          message: 'Presentation not found'
        });
      }

      const session = presentation.sessions.find(s => s.sessionId === sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      const activePoll = session.activePolls.find(p => p.pollId.toString() === pollId && !p.deactivatedAt);
      if (!activePoll) {
        return res.status(404).json({
          success: false,
          message: 'Active poll not found'
        });
      }


      // Get the actual poll to calculate results
      const poll = await Poll.findOne({ _id: pollId, tenantId });
      if (!poll) {
        return res.status(404).json({
          success: false,
          message: 'Poll not found'
        });
      }


      // Calculate results
      const results = {
        totalResponses: activePoll.responses.length,
        responses: activePoll.responses,
        pollDetails: {
          title: poll.title,
          question: poll.question,
          options: poll.options
        }
      };

      logger.info('Poll results retrieved from presentation session', {
        presentationId,
        sessionId,
        pollId,
        tenantId
      });

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      logger.error('Error retrieving poll results', { error: error.message, presentationId: req.params.presentationId });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve poll results',
        error: error.message
      });
    }
  }


  // ==================== PRESENTATION SLIDES ====================

  /**
   * Add slide to presentation
   */
  async addSlide (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { presentationId } = req.params;
      const slideData = req.body;

      const presentation = await Presentation.findOne({ _id: presentationId, tenantId });
      if (!presentation) {
        return res.status(404).json({
          success: false,
          message: 'Presentation not found'
        });
      }

      await presentation.addSlide(slideData);

      logger.info('Slide added to presentation', {
        presentationId,
        tenantId
      });

      res.json({
        success: true,
        message: 'Slide added successfully'
      });
    } catch (error) {
      logger.error('Error adding slide to presentation', { error: error.message, presentationId: req.params.presentationId });
      res.status(400).json({
        success: false,
        message: 'Failed to add slide',
        error: error.message
      });
    }
  }

  /**
   * Update slide in presentation
   */
  async updateSlide (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { presentationId, slideIndex } = req.params;
      const updateData = req.body;

      const presentation = await Presentation.findOne({ _id: presentationId, tenantId });
      if (!presentation) {
        return res.status(404).json({
          success: false,
          message: 'Presentation not found'
        });
      }

      await presentation.updateSlide(parseInt(slideIndex), updateData);

      logger.info('Slide updated in presentation', {
        presentationId,
        slideIndex,
        tenantId
      });

      res.json({
        success: true,
        message: 'Slide updated successfully'
      });
    } catch (error) {
      logger.error('Error updating slide in presentation', { error: error.message, presentationId: req.params.presentationId });
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * Remove slide from presentation
   */
  async removeSlide (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { presentationId, slideIndex } = req.params;

      const presentation = await Presentation.findOne({ _id: presentationId, tenantId });
      if (!presentation) {
        return res.status(404).json({
          success: false,
          message: 'Presentation not found'
        });
      }

      await presentation.removeSlide(parseInt(slideIndex));

      logger.info('Slide removed from presentation', {
        presentationId,
        slideIndex,
        tenantId
      });

      res.json({
        success: true,
        message: 'Slide removed successfully'
      });
    } catch (error) {
      logger.error('Error removing slide from presentation', { error: error.message, presentationId: req.params.presentationId });
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }


  // ==================== PRESENTATION STATISTICS ====================

  /**
   * Get presentation statistics
   */
  async getPresentationStats (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { presentationId } = req.params;

      const presentation = await Presentation.findOne({ _id: presentationId, tenantId });
      if (!presentation) {
        return res.status(404).json({
          success: false,
          message: 'Presentation not found'
        });
      }

      const stats = {
        totalSessions: presentation.statistics.totalSessions,
        totalParticipants: presentation.statistics.totalParticipants,
        averageSessionDuration: presentation.statistics.averageSessionDuration,
        averageRating: presentation.statistics.averageRating,
        totalViews: presentation.statistics.totalViews,
        slideCount: presentation.slides.length,
        activeSessions: presentation.sessions.filter(s => s.status === 'in-progress').length
      };

      logger.info('Presentation statistics retrieved', { presentationId, tenantId });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error retrieving presentation statistics', { error: error.message, presentationId: req.params.presentationId });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve presentation statistics',
        error: error.message
      });
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats (req, res) {
    // TODO: Add await statements
    try {
      const { tenantId } = req;
      const { presentationId, sessionId } = req.params;

      const presentation = await Presentation.findOne({ _id: presentationId, tenantId });
      if (!presentation) {
        return res.status(404).json({
          success: false,
          message: 'Presentation not found'
        });
      }

      const session = presentation.sessions.find(s => s.sessionId === sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      const stats = {
        sessionId: session.sessionId,
        title: session.title,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        currentSlide: session.currentSlide,
        totalSlides: presentation.slides.length,
        activeParticipants: session.participants.filter(p => p.isActive).length,
        totalParticipants: session.participants.length,
        totalComments: session.comments.length,
        activePolls: session.activePolls.filter(p => !p.deactivatedAt).length,
        totalPollResponses: session.activePolls.reduce((total, poll) => total + poll.responses.length, 0)
      };

      logger.info('Session statistics retrieved', {
        presentationId, sessionId, tenantId
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error retrieving session statistics', { error: error.message, presentationId: req.params.presentationId });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve session statistics',
        error: error.message
      });
    }
  }
}

module.exports = new PresentationController();
