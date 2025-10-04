// Development server with fallback configuration
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'luxgen-trainer-platform-api-dev',
    version: '1.0.0',
    mode: 'development-fallback'
  });
});

// Mock API endpoints for development
app.get('/api/v1/jobs', (req, res) => {
  res.json({
    success: true,
    data: {
      jobPosts: [
        {
          _id: 'mock-job-1',
          title: 'Senior Software Engineer',
          description: 'We are looking for a senior software engineer...',
          company: {
            name: 'LuxGen Technologies',
            location: { city: 'San Francisco', country: 'USA' }
          },
          jobType: 'full-time',
          experienceLevel: 'senior',
          location: { city: 'San Francisco', country: 'USA' },
          salary: { min: 120000, max: 160000, currency: 'USD' },
          createdAt: new Date().toISOString()
        }
      ],
      total: 1,
      currentPage: 1,
      totalPages: 1
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1
    }
  });
});

app.get('/api/v1/feed/posts', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'mock-post-1',
        content: { text: 'Welcome to LuxGen! This is a sample post.' },
        author: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          avatar: ''
        },
        createdAt: new Date().toISOString(),
        likes: 5,
        comments: 2,
        shares: 1
      }
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1
    }
  });
});

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 LUXGEN DEVELOPMENT SERVER STARTED');
  console.log('=====================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ Jobs API: http://localhost:${PORT}/api/v1/jobs`);
  console.log(`✅ Feed API: http://localhost:${PORT}/api/v1/feed/posts`);
  console.log('🌍 Mode: Development Fallback (No Database)');
  console.log('=====================================');
});

module.exports = app;
