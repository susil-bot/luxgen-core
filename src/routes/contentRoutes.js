const express = require('express');
const router = express.Router();

// Content Management Routes for Frontend Support
// ===============================================

// Get content list with filters
router.get('/', (req, res) => {
  const { type, status, page = 1, limit = 10, search } = req.query;
  
  res.json({
    success: true,
    data: [
      {
        id: 'content-1',
        title: 'Welcome to LuxGen Training Platform',
        description: 'Get started with our comprehensive training platform',
        type: 'training',
        category: 'onboarding',
        status: 'published',
        author: 'admin',
        tags: ['welcome', 'getting-started'],
        media: {
          thumbnail: '/media/thumbnails/welcome.jpg',
          video: '/media/videos/welcome.mp4'
        },
        metadata: {
          duration: 300,
          difficulty: 'beginner',
          language: 'en'
        },
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'content-2',
        title: 'JavaScript Fundamentals',
        description: 'Learn the basics of JavaScript programming',
        type: 'course',
        category: 'programming',
        status: 'published',
        author: 'instructor-1',
        tags: ['javascript', 'programming', 'fundamentals'],
        media: {
          thumbnail: '/media/thumbnails/js-fundamentals.jpg',
          video: '/media/videos/js-fundamentals.mp4'
        },
        metadata: {
          duration: 1800,
          difficulty: 'beginner',
          language: 'en',
          modules: 5
        },
        publishedAt: new Date(Date.now() - 86400000).toISOString(),
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      }
    ],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 2,
      pages: 1
    },
    filters: {
      type: type || '',
      status: status || '',
      search: search || ''
    }
  });
});

// Get content by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      id,
      title: 'JavaScript Fundamentals',
      description: 'Learn the basics of JavaScript programming',
      type: 'course',
      category: 'programming',
      status: 'published',
      author: 'instructor-1',
      tags: ['javascript', 'programming', 'fundamentals'],
      media: {
        thumbnail: '/media/thumbnails/js-fundamentals.jpg',
        video: '/media/videos/js-fundamentals.mp4',
        documents: [
          {
            name: 'JavaScript Basics.pdf',
            url: '/media/documents/js-basics.pdf',
            size: '2.5MB'
          }
        ]
      },
      metadata: {
        duration: 1800,
        difficulty: 'beginner',
        language: 'en',
        modules: 5,
        prerequisites: [],
        learningObjectives: [
          'Understand JavaScript syntax',
          'Learn variables and data types',
          'Master functions and scope'
        ]
      },
      publishedAt: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    }
  });
});

// Create content
router.post('/', (req, res) => {
  const contentData = req.body;
  
  res.json({
    success: true,
    message: 'Content created successfully',
    data: {
      id: 'content-new-' + Date.now(),
      ...contentData,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
});

// Update content
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  res.json({
    success: true,
    message: 'Content updated successfully',
    data: {
      id,
      ...updates,
      updatedAt: new Date().toISOString()
    }
  });
});

// Delete content
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: 'Content deleted successfully',
    data: { id }
  });
});

// Get content media
router.get('/:id/media', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    data: {
      contentId: id,
      media: {
        thumbnail: '/media/thumbnails/js-fundamentals.jpg',
        video: '/media/videos/js-fundamentals.mp4',
        documents: [
          {
            name: 'JavaScript Basics.pdf',
            url: '/media/documents/js-basics.pdf',
            size: '2.5MB',
            type: 'pdf'
          },
          {
            name: 'Code Examples.zip',
            url: '/media/documents/code-examples.zip',
            size: '1.2MB',
            type: 'zip'
          }
        ],
        images: [
          {
            name: 'JavaScript Logo',
            url: '/media/images/js-logo.png',
            size: '50KB',
            type: 'png'
          }
        ]
      }
    }
  });
});

// Upload content media
router.post('/:id/media', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: 'Media uploaded successfully',
    data: {
      contentId: id,
      mediaId: 'media-' + Date.now(),
      filename: 'uploaded-file.jpg',
      url: '/media/uploads/uploaded-file.jpg',
      size: '1.5MB',
      type: 'image',
      uploadedAt: new Date().toISOString()
    }
  });
});

// Get content by type (for specific frontend components)
router.get('/type/:type', (req, res) => {
  const { type } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  res.json({
    success: true,
    data: [],
    type,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 0,
      pages: 0
    }
  });
});

module.exports = router;
