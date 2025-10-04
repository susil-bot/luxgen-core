const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const { authenticateToken, requireRole } = require('../middleware/auth');
const TenantMiddleware = require('../middleware/tenantMiddleware');

// Apply middleware to all routes
router.use(TenantMiddleware.identifyTenant());
router.use(authenticateToken);

// Get feed posts
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, type = 'all' } = req.query;
    const skip = (page - 1) * limit;

    let filter = { tenantId: req.tenantId, status: 'published' };

    // Filter by type
    if (type === 'following') {
      // Get posts from users the current user follows
      // This would require a follow/following system
      filter['author.userId'] = { $in: req.user.following || [] };
    }

    const posts = await Post.find(filter)
      .populate('author.userId', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: posts,
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
    console.error('Error fetching feed:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch feed' });
  }
});

// Get single post
router.get('/:postId', async (req, res) => {
  try {
    const post = await Post.findOne({ 
      _id: req.params.postId, 
      tenantId: req.tenantId 
    }).populate('author.userId', 'firstName lastName avatar');

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    res.json({ success: true, data: post });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch post' });
  }
});

// Create new post
router.post('/', async (req, res) => {
  try {
    const { content, visibility, hashtags, mentions, location } = req.body;

    const post = new Post({
      tenantId: req.tenantId,
      author: {
        userId: req.user.id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        title: req.user.title || '',
        avatar: req.user.avatar || '',
        verified: req.user.verified || false
      },
      content,
      visibility: visibility || { type: 'public' },
      hashtags: hashtags || [],
      mentions: mentions || [],
      location: location || null
    });

    await post.save();

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ success: false, error: 'Failed to create post' });
  }
});

// Update post
router.put('/:postId', async (req, res) => {
  try {
    const { content, visibility, hashtags } = req.body;

    const post = await Post.findOneAndUpdate(
      { _id: req.params.postId, tenantId: req.tenantId, 'author.userId': req.user.id },
      { 
        content, 
        visibility, 
        hashtags,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found or unauthorized' });
    }

    res.json({ success: true, data: post });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ success: false, error: 'Failed to update post' });
  }
});

// Delete post
router.delete('/:postId', async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      { _id: req.params.postId, tenantId: req.tenantId, 'author.userId': req.user.id },
      { status: 'deleted' },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found or unauthorized' });
    }

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ success: false, error: 'Failed to delete post' });
  }
});

// Like/Unlike post
router.post('/:postId/like', async (req, res) => {
  try {
    const { reactionType = 'like' } = req.body;

    // Check if already liked
    const existingLike = await Like.findOne({
      tenantId: req.tenantId,
      userId: req.user.id,
      targetType: 'post',
      targetId: req.params.postId
    });

    if (existingLike) {
      // Unlike
      await Like.findByIdAndDelete(existingLike._id);
      await Post.findByIdAndUpdate(req.params.postId, { $inc: { 'engagement.likes': -1 } });
      res.json({ success: true, liked: false });
    } else {
      // Like
      const like = new Like({
        tenantId: req.tenantId,
        userId: req.user.id,
        targetType: 'post',
        targetId: req.params.postId,
        reactionType
      });

      await like.save();
      await Post.findByIdAndUpdate(req.params.postId, { $inc: { 'engagement.likes': 1 } });
      res.json({ success: true, liked: true });
    }
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ success: false, error: 'Failed to like post' });
  }
});

// Get post comments
router.get('/:postId/comments', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({
      postId: req.params.postId,
      tenantId: req.tenantId,
      status: 'active'
    })
      .populate('author.userId', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments({
      postId: req.params.postId,
      tenantId: req.tenantId,
      status: 'active'
    });

    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: comments,
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
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch comments' });
  }
});

// Add comment to post
router.post('/:postId/comments', async (req, res) => {
  try {
    const { content, parentComment } = req.body;

    const comment = new Comment({
      tenantId: req.tenantId,
      postId: req.params.postId,
      author: {
        userId: req.user.id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        avatar: req.user.avatar || ''
      },
      content,
      parentComment: parentComment || null
    });

    await comment.save();

    // Update post comment count
    await Post.findByIdAndUpdate(req.params.postId, { $inc: { 'engagement.comments': 1 } });

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
});

module.exports = router;
