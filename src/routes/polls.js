const express = require('express');
const router = express.Router();
const Poll = require('../models/Poll');
const User = require('../models/User');


// Middleware to extract tenant ID
const extractTenant = (req, res, next) => {
  req.tenantId = req.params.tenantId;
  next();
};


// Apply tenant middleware to all routes
router.use('/:tenantId', extractTenant);


// GET /api/polls/:tenantId - Get all polls for tenant
router.get('/:tenantId', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      niche,
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;


    // Build filter object
    const filters = { tenantId: req.tenantId };
    if (status && status !== 'all') {
      filters.status = status;
    }
    if (niche && niche !== 'all') {
      filters.niche = niche;
    }
    if (priority && priority !== 'all') {
      filters.priority = priority;
    }
    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }


    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;


    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);


    // Execute query
    const polls = await Poll.find(filters)
      .populate('createdBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();


    // Get total count for pagination
    const total = await Poll.countDocuments(filters);


    // Calculate analytics for each poll
    const pollsWithAnalytics = polls.map(poll => ({
      ...poll,
      responseRatePercentage: poll.analytics.totalRecipients > 0
        ? Math.round((poll.analytics.totalResponses / poll.analytics.totalRecipients) * 100)
        : 0
    }));

    res.json({
      success: true,
      data: pollsWithAnalytics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch polls',
      error: error.message
    });
  }
});


// GET /api/polls/:(tenantId/stats - Get) poll statistics
router.get('/:tenantId/stats', async (req, res) => {
  try {
    const stats = await Poll.aggregate([
      { $match: { tenantId: req.tenantId } },
      {
        $group: {
          _id: null,
          totalPolls: { $sum: 1 },
          totalRecipients: { $sum: '$analytics.totalRecipients' },
          totalResponses: { $sum: '$analytics.totalResponses' },
          avgResponseRate: { $avg: '$analytics.responseRate' },
          avgRating: { $avg: '$analytics.averageRating' }
        }
      }
    ]);

    const statusStats = await Poll.aggregate([
      { $match: { tenantId: req.tenantId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const nicheStats = await Poll.aggregate([
      { $match: { tenantId: req.tenantId } },
      {
        $group: {
          _id: '$niche',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalPolls: 0,
          totalRecipients: 0,
          totalResponses: 0,
          avgResponseRate: 0,
          avgRating: 0
        },
        byStatus: statusStats,
        byNiche: nicheStats
      }
    });
  } catch (error) {
    console.error('Error fetching poll stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch poll statistics',
      error: error.message
    });
  }
});


// GET /api/polls/:(tenantId/notifications - Get) notifications
router.get('/:tenantId/notifications', async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);


    // Get all polls for tenant and extract notifications
    const polls = await Poll.find({ tenantId: req.tenantId })
      .select('notifications title')
      .skip(skip)
      .limit(parseInt(limit));

    let allNotifications = [];
    polls.forEach(poll => {
      const pollNotifications = poll.notifications.map(notification => ({
        ...notification.toObject(),
        pollTitle: poll.title,
        pollId: poll._id
      }));
      allNotifications = allNotifications.concat(pollNotifications);
    });


    // Filter by read status if requested
    if (unreadOnly === 'true') {
      allNotifications = allNotifications.filter(n => !n.read);
    }


    // Sort by creation date (newest first)
    allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: allNotifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: allNotifications.length
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});


// PUT /api/polls/:tenantId/notifications/:(notificationId/read - Mark) notification as read
router.put('/:tenantId/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;


    // Find poll with this notification
    const poll = await Poll.findOne({
      'notifications._id': notificationId,
      tenantId: req.tenantId
    });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }


    // Mark notification as read
    const notification = poll.notifications.id(notificationId);
    notification.read = true;
    await poll.save();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
});


// GET /api/polls/:tenantId/:id - Get single poll
router.get('/:tenantId/:id', async (req, res) => {
  try {
    const poll = await Poll.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    }).populate('createdBy', 'firstName lastName email');

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    res.json({
      success: true,
      data: poll
    });
  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch poll',
      error: error.message
    });
  }
});


// POST /api/polls/:tenantId - Create new poll
router.post('/:tenantId', async (req, res) => {
  try {
    const {
      title,
      description,
      niche,
      targetAudience,
      questions,
      channels,
      priority,
      tags,
      scheduledDate,
      settings,
      recipients
    } = req.body;


    // Create poll
    const poll = new Poll({
      tenantId: req.tenantId,
      title,
      description,
      niche,
      targetAudience,
      questions,
      channels,
      priority,
      tags,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      settings,
      createdBy: req.user?.id || 'system',
      // TODO: Get from auth middleware
      recipients: recipients || []
    });

    await poll.save();


    // Add notification for poll creation
    await poll.addNotification(
      'schedule_reminder',
      'Poll Created',
      `Poll "${title}" has been created successfully`,
      req.user?.id
    );

    res.status(201).json({
      success: true,
      message: 'Poll created successfully',
      data: poll
    });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create poll',
      error: error.message
    });
  }
});


// PUT /api/polls/:tenantId/:id - Update poll
router.put('/:tenantId/:id', async (req, res) => {
  try {
    const poll = await Poll.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }


    // Update poll fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== 'tenantId' && key !== 'createdBy') {
        poll[key] = req.body[key];
      }
    });

    poll.updatedBy = req.user?.id || 'system';
    await poll.save();

    res.json({
      success: true,
      message: 'Poll updated successfully',
      data: poll
    });
  } catch (error) {
    console.error('Error updating poll:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update poll',
      error: error.message
    });
  }
});


// DELETE /api/polls/:tenantId/:id - Delete poll
router.delete('/:tenantId/:id', async (req, res) => {
  try {
    const poll = await Poll.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    res.json({
      success: true,
      message: 'Poll deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting poll:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete poll',
      error: error.message
    });
  }
});


// POST /api/polls/:tenantId/:(id/recipients - Add) recipients
router.post('/:tenantId/:id/recipients', async (req, res) => {
  try {
    const { recipients } = req.body;
    const poll = await Poll.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }


    // Add recipients
    for (const recipient of recipients) {
      await poll.addRecipient(
        recipient.userId,
        recipient.email,
        recipient.name
      );
    }

    res.json({
      success: true,
      message: 'Recipients added successfully',
      data: poll.recipients
    });
  } catch (error) {
    console.error('Error adding recipients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add recipients',
      error: error.message
    });
  }
});


// POST /api/polls/:tenantId/:(id/responses - Submit) poll response
router.post('/:tenantId/:id/responses', async (req, res) => {
  try {
    const { userId, userName, userEmail, answers } = req.body;
    const poll = await Poll.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }


    // Check if poll is active
    if (poll.status !== 'sent' && poll.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Poll is not accepting responses'
      });
    }


    // Check if user already responded
    const existingResponse = poll.responses.find(r => r.userEmail === userEmail);
    if (existingResponse) {
      return res.status(400).json({
        success: false,
        message: 'You have already responded to this poll'
      });
    }


    // Add response
    await poll.addResponse(userId, userName, userEmail, answers);


    // Add notification
    await poll.addNotification(
      'poll_response',
      'New Response Received',
      `${userName} completed the poll "${poll.title}"`,
      poll.createdBy,
      `/app/notifications/polls/${poll._id}`
    );

    res.json({
      success: true,
      message: 'Response submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit response',
      error: error.message
    });
  }
});


// POST /api/polls/:tenantId/:(id/feedback - Submit) feedback
router.post('/:tenantId/:id/feedback', async (req, res) => {
  try {
    const { userId, userName, userEmail, rating, comment } = req.body;
    const poll = await Poll.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }


    // Add feedback
    await poll.addFeedback(userId, userName, userEmail, rating, comment);


    // Add notification
    await poll.addNotification(
      'feedback_received',
      'Feedback Received',
      `${userName} left feedback on poll "${poll.title}"`,
      poll.createdBy,
      `/app/notifications/polls/${poll._id}`
    );

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
});


// GET /api/polls/:tenantId/:(id/responses - Get) poll responses
router.get('/:tenantId/:id/responses', async (req, res) => {
  try {
    const poll = await Poll.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    }).select('responses');

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    res.json({
      success: true,
      data: poll.responses
    });
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch responses',
      error: error.message
    });
  }
});


// GET /api/polls/:tenantId/:(id/feedback - Get) poll feedback
router.get('/:tenantId/:id/feedback', async (req, res) => {
  try {
    const poll = await Poll.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    }).select('feedback');

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    res.json({
      success: true,
      data: poll.feedback
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
});


// POST /api/polls/:tenantId/:(id/send - Send) poll to recipients
router.post('/:tenantId/:id/send', async (req, res) => {
  try {
    const poll = await Poll.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    if (poll.status !== 'draft' && poll.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Poll cannot be sent in current status'
      });
    }


    // Update poll status
    poll.status = 'sent';
    poll.sentDate = new Date();
    await poll.save();


    // TODO: Implement actual sending logic (email, SMS, etc.)

    // For now, just mark all recipients as sent
    poll.recipients.forEach(recipient => {
      recipient.sentAt = new Date();
    });
    await poll.save();

    res.json({
      success: true,
      message: 'Poll sent successfully',
      data: {
        sentTo: poll.recipients.length,
        sentAt: poll.sentDate
      }
    });
  } catch (error) {
    console.error('Error sending poll:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send poll',
      error: error.message
    });
  }
});

module.exports = router;
