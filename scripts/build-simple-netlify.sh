#!/bin/bash

# SIMPLE Netlify Build Script
# This script creates a minimal working Netlify deployment

echo "🏗️ Building SIMPLE Netlify deployment..."

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
    "cors": "^2.8.5"
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

# Create simple API function
cat > dist/netlify/functions/api.js << 'EOF'
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

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
      apiHealth: '/api/health'
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

module.exports.handler = serverless(app);
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

module.exports.handler = serverless(app);
EOF

echo ""
echo "✅ SIMPLE Netlify build completed successfully!"
echo "📁 Files included:"
echo "  - netlify/functions/api.js (main API function)"
echo "  - netlify/functions/health.js (health check function)"
echo "  - package.json (minimal dependencies)"
echo "  - netlify.toml (deployment config)"
echo ""
echo "🎯 This build should work with Netlify!"
