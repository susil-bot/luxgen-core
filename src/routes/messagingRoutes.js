const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { authenticateToken } = require('../middleware/auth');
const TenantMiddleware = require('../middleware/tenantMiddleware');

// Apply middleware to all routes
router.use(TenantMiddleware.identifyTenant());
router.use(authenticateToken);

// Get user conversations
router.get('/conversations', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({
      tenantId: req.tenantId,
      'participants.userId': req.user.id
    })
      .populate('participants.userId', 'firstName lastName avatar')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Conversation.countDocuments({
      tenantId: req.tenantId,
      'participants.userId': req.user.id
    });

    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: conversations,
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
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch conversations' });
  }
});

// Get single conversation
router.get('/conversations/:conversationId', async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      tenantId: req.tenantId,
      'participants.userId': req.user.id
    }).populate('participants.userId', 'firstName lastName avatar');

    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch conversation' });
  }
});

// Create new conversation
router.post('/conversations', async (req, res) => {
  try {
    const { participants, title, type = 'direct' } = req.body;

    // Add current user to participants
    const allParticipants = [
      {
        userId: req.user.id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        avatar: req.user.avatar || '',
        role: 'admin'
      },
      ...participants
    ];

    const conversation = new Conversation({
      tenantId: req.tenantId,
      participants: allParticipants,
      title,
      type,
      metadata: {
        createdBy: req.user.id
      }
    });

    await conversation.save();

    res.status(201).json({ success: true, data: conversation });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ success: false, error: 'Failed to create conversation' });
  }
});

// Get conversation messages
router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Check if user is part of conversation
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      tenantId: req.tenantId,
      'participants.userId': req.user.id
    });

    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    const messages = await Message.find({
      conversationId: req.params.conversationId,
      tenantId: req.tenantId
    })
      .populate('sender.userId', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({
      conversationId: req.params.conversationId,
      tenantId: req.tenantId
    });

    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: messages.reverse(), // Return in chronological order
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
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

// Send message
router.post('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { content, messageType = 'text', attachments = [] } = req.body;

    // Check if user is part of conversation
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      tenantId: req.tenantId,
      'participants.userId': req.user.id
    });

    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    // Get other participants
    const otherParticipants = conversation.participants
      .filter(p => p.userId.toString() !== req.user.id.toString())
      .map(p => ({
        userId: p.userId,
        readAt: null,
        deliveredAt: new Date()
      }));

    const message = new Message({
      tenantId: req.tenantId,
      conversationId: req.params.conversationId,
      sender: {
        userId: req.user.id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        avatar: req.user.avatar || ''
      },
      content: {
        text: content,
        attachments
      },
      recipients: otherParticipants,
      messageType
    });

    await message.save();

    // Update conversation last message
    await Conversation.findByIdAndUpdate(req.params.conversationId, {
      lastMessage: {
        content: content,
        sender: `${req.user.firstName} ${req.user.lastName}`,
        timestamp: new Date()
      }
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

// Mark messages as read
router.put('/conversations/:conversationId/read', async (req, res) => {
  try {
    // Update user's last read time in conversation
    await Conversation.findOneAndUpdate(
      {
        _id: req.params.conversationId,
        tenantId: req.tenantId,
        'participants.userId': req.user.id
      },
      {
        $set: {
          'participants.$.lastReadAt': new Date()
        }
      }
    );

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark messages as read' });
  }
});

// Get unread message count
router.get('/unread-count', async (req, res) => {
  try {
    const conversations = await Conversation.find({
      tenantId: req.tenantId,
      'participants.userId': req.user.id
    });

    let unreadCount = 0;

    for (const conversation of conversations) {
      const participant = conversation.participants.find(p => p.userId.toString() === req.user.id.toString());
      const lastReadAt = participant?.lastReadAt || new Date(0);

      const unreadMessages = await Message.countDocuments({
        conversationId: conversation._id,
        tenantId: req.tenantId,
        'sender.userId': { $ne: req.user.id },
        createdAt: { $gt: lastReadAt }
      });

      unreadCount += unreadMessages;
    }

    res.json({ success: true, data: { unreadCount } });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ success: false, error: 'Failed to get unread count' });
  }
});

module.exports = router;
