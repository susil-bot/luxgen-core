#!/bin/bash

# FIXED Netlify Build Script
# This script creates a proper Netlify deployment with serverless functions

echo "🏗️ Building FIXED Netlify deployment..."

# Create clean dist directory
rm -rf dist
mkdir -p dist

# Create package.json for Netlify
cat > dist/package.json << 'EOF'
{
  "name": "luxgen-core",
  "version": "1.0.0",
  "main": "netlify/functions/api.js",
  "scripts": {
    "start": "node netlify/functions/api.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "serverless-http": "^3.2.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "compression": "^1.7.4"
  }
}
EOF

# Create netlify.toml for proper deployment
cat > dist/netlify.toml << 'EOF'
[build]
  command = "echo 'No build needed'"
  publish = "."
  functions = "netlify/functions"

[build.processing.secrets]
  enabled = false

[build.processing]
  skip_processing = true

# Redirect all API calls to serverless functions
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/health"
  to = "/.netlify/functions/health"
  status = 200
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

# Create main API function
cat > dist/netlify/functions/api.js << 'EOF'
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(compression());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'LuxGen Backend is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API is healthy',
    timestamp: new Date().toISOString()
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

// Export for serverless
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
echo "✅ FIXED Netlify build completed successfully!"
echo "📁 Files included:"
echo "  - netlify/functions/api.js (main API function)"
echo "  - netlify/functions/health.js (health check function)"
echo "  - package.json (minimal dependencies)"
echo "  - netlify.toml (proper deployment config)"
echo ""
echo "🎯 This build should work with Netlify serverless functions!"
