#!/bin/bash

# WORKING API Netlify Build Script
# This script creates a working Netlify deployment with proper serverless functions

echo "🏗️ Building WORKING API Netlify deployment..."

# Create clean dist directory
rm -rf dist
mkdir -p dist

# Create package.json
cat > dist/package.json << 'EOF'
{
  "name": "luxgen-core",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "serverless-http": "^3.2.0",
    "cors": "^2.8.5",
    "express-validator": "^7.0.1",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3"
  }
}
EOF

# Create netlify.toml
cat > dist/netlify.toml << 'EOF'
[build]
  command = "echo 'No build needed'"
  publish = "."
  functions = "netlify/functions"

[build.processing.secrets]
  enabled = false

[build.processing]
  skip_processing = true
EOF

# Create .netlifyignore
cat > dist/.netlifyignore << 'EOF'
# Ignore everything except essential files
*
!netlify/
!package.json
!netlify.toml
EOF

# Create netlify functions directory
mkdir -p dist/netlify/functions

# Create working API function
cat > dist/netlify/functions/api.js << 'EOF'
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://luxgen-lac.vercel.app',
    'https://luxgen.vercel.app',
    'https://demo-luxgen.vercel.app',
    'https://test-luxgen.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Simple in-memory storage
const users = [];
const JWT_SECRET = 'demo-secret-key';

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Auth routes
app.post('/api/auth/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().isLength({ min: 2, max: 50 }),
  body('lastName').trim().isLength({ min: 2, max: 50 }),
  validateRequest
], async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, company, role } = req.body;
    
    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone: phone || '',
      company: company || '',
      role: role || 'user',
      createdAt: new Date().toISOString()
    };
    
    users.push(user);
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          company: user.company,
          role: user.role,
          createdAt: user.createdAt
        },
        token
      },
      message: 'Registration successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validateRequest
], async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          company: user.company,
          role: user.role,
          createdAt: user.createdAt
        },
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Tenant endpoints
app.get('/api/tenants/:tenantId', (req, res) => {
  const { tenantId } = req.params;
  
  // Mock tenant data
  const tenant = {
    id: tenantId,
    name: 'LuxGen',
    slug: tenantId,
    domain: 'luxgen-lac.vercel.app',
    subdomain: tenantId,
    apiUrl: 'https://luxgen-backend.netlify.app/api/v1',
    theme: {
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
      logo: '/assets/logos/luxgen-logo.svg'
    },
    features: {
      analytics: true,
      notifications: true,
      chat: true,
      reports: true
    },
    limits: {
      maxUsers: 1000,
      maxStorage: 10000,
      maxApiCalls: 100000
    },
    status: 'active',
    createdAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: tenant,
    message: 'Tenant retrieved successfully'
  });
});

app.get('/api/tenants', (req, res) => {
  const tenants = [
    {
      id: 'luxgen-lac',
      name: 'LuxGen LAC',
      slug: 'luxgen-lac',
      domain: 'luxgen-lac.vercel.app',
      subdomain: 'luxgen-lac',
      apiUrl: 'https://luxgen-backend.netlify.app/api/v1',
      status: 'active'
    },
    {
      id: 'luxgen',
      name: 'LuxGen',
      slug: 'luxgen',
      domain: 'luxgen.vercel.app',
      subdomain: 'luxgen',
      apiUrl: 'https://luxgen-backend.netlify.app/api/v1',
      status: 'active'
    }
  ];
  
  res.json({
    success: true,
    data: tenants,
    message: 'Tenants retrieved successfully'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'LuxGen Backend is running',
    timestamp: new Date().toISOString()
  });
});

// API health endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'LuxGen Backend API',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      apiHealth: '/api/health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      logout: 'POST /api/auth/logout'
    }
  });
});

// Catch-all handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    timestamp: new Date().toISOString()
  });
});

// Export the handler correctly
const handler = serverless(app);
module.exports.handler = handler;
EOF

# Create health function
cat > dist/netlify/functions/health.js << 'EOF'
const express = require('express');
const serverless = require('serverless-http');

const app = express();

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Health check passed',
    timestamp: new Date().toISOString()
  });
});

const handler = serverless(app);
module.exports.handler = handler;
EOF

# Create index.html for root
cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>LuxGen Backend API</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .method { background: #007bff; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px; }
        .status { color: green; font-weight: bold; }
        .auth-section { background: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>LuxGen Backend API</h1>
        <p class="status">✅ Backend is running with complete API endpoints</p>
        
        <div class="auth-section">
            <h2>🔐 Authentication Endpoints:</h2>
            <div class="endpoint">
                <span class="method">POST</span> <strong>/api/auth/register</strong> - User registration
                <br><small>Body: { email, password, firstName, lastName, phone?, company?, role? }</small>
            </div>
            <div class="endpoint">
                <span class="method">POST</span> <strong>/api/auth/login</strong> - User login
                <br><small>Body: { email, password }</small>
            </div>
            <div class="endpoint">
                <span class="method">POST</span> <strong>/api/auth/logout</strong> - User logout
            </div>
        </div>
        
        <h2>📊 System Endpoints:</h2>
        <div class="endpoint">
            <span class="method">GET</span> <strong>/health</strong> - Health check endpoint
        </div>
        <div class="endpoint">
            <span class="method">GET</span> <strong>/api/health</strong> - API health check
        </div>
        <div class="endpoint">
            <span class="method">GET</span> <strong>/</strong> - This page
        </div>
        
        <p>Timestamp: <span id="timestamp"></span></p>
        <p><strong>Note:</strong> This is a demo API with in-memory storage. For production, connect to a database.</p>
    </div>
    <script>
        document.getElementById('timestamp').textContent = new Date().toISOString();
    </script>
</body>
</html>
EOF

echo ""
echo "✅ WORKING API Netlify build completed successfully!"
echo "📁 Files included:"
echo "  - netlify/functions/api.js (working API with proper exports)"
echo "  - netlify/functions/health.js (health check function)"
echo "  - index.html (root page with API documentation)"
echo "  - package.json (all required dependencies)"
echo "  - netlify.toml (deployment config)"
echo ""
echo "🎯 API Endpoints included:"
echo "  - POST /api/auth/register - User registration"
echo "  - POST /api/auth/login - User login"
echo "  - POST /api/auth/logout - User logout"
echo "  - GET /health - Health check"
echo "  - GET /api/health - API health"
echo ""
echo "🚀 This build should work with proper serverless function exports!"
