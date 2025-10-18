#!/bin/bash

# API Deployment Script for Free Hosting Services
# Supports: Render, Railway, Heroku, Vercel, Netlify Functions

set -e

echo "🚀 Starting API Deployment Setup..."

# Configuration
API_NAME="trainer-platform-api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function definitions
setup_render_deployment() {
    print_status "Setting up Render deployment..."
    
    # Create render.yaml
    cat > render.yaml << 'EOF'
services:
  - type: web
    name: trainer-platform-api
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: MONGODB_URL
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: REDIS_URL
        sync: false
      - key: POSTGRES_HOST
        sync: false
      - key: POSTGRES_PORT
        sync: false
      - key: POSTGRES_DB
        sync: false
      - key: POSTGRES_USER
        sync: false
      - key: POSTGRES_PASSWORD
        sync: false
EOF

    # Update package.json scripts
    if ! grep -q '"start": "node src/index.js"' package.json; then
        sed -i '' 's/"start": "nodemon src\/index.js"/"start": "node src\/index.js"/' package.json
    fi
    
    print_success "Render deployment files created!"
    print_status "render.yaml created with configuration"
}

setup_railway_deployment() {
    print_status "Setting up Railway deployment..."
    
    # Create railway.json
    cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF

    # Update package.json scripts
    if ! grep -q '"start": "node src/index.js"' package.json; then
        sed -i '' 's/"start": "nodemon src\/index.js"/"start": "node src\/index.js"/' package.json
    fi
    
    print_success "Railway deployment files created!"
    print_status "railway.json created with configuration"
}

setup_heroku_deployment() {
    print_status "Setting up Heroku deployment..."
    
    # Create Procfile
    cat > Procfile << 'EOF'
web: npm start
EOF

    # Create app.json
    cat > app.json << 'EOF'
{
  "name": "trainer-platform-api",
  "description": "Trainer Platform API",
  "repository": "https://github.com/yourusername/trainer-platform",
  "logo": "https://node-js-sample.herokuapp.com/node.png",
  "keywords": ["node", "express", "api", "trainer"],
  "env": {
    "NODE_ENV": {
      "description": "Environment",
      "value": "production"
    },
    "PORT": {
      "description": "Port to run the server on",
      "value": "10000"
    }
  },
  "formation": {
    "web": {
      "quantity": 1,
      "size": "free"
    }
  },
  "buildpacks": [
    {
      "url": "heroku/nodejs"
    }
  ]
}
EOF

    # Update package.json scripts
    if ! grep -q '"start": "node src/index.js"' package.json; then
        sed -i '' 's/"start": "nodemon src\/index.js"/"start": "node src\/index.js"/' package.json
    fi
    
    print_success "Heroku deployment files created!"
    print_status "Procfile and app.json created with configuration"
}

setup_vercel_deployment() {
    print_status "Setting up Vercel deployment..."
    
    # Create vercel.json
    cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
EOF

    print_success "Vercel deployment files created!"
    print_status "vercel.json created with configuration"
}

    print_status "Setting up Netlify Functions deployment..."
    
[build]
  functions = "functions"
  publish = "public"

[functions]
  directory = "functions"

[[redirects]]
  from = "/api/*"
  status = 200

[build.environment]
  NODE_ENV = "production"
EOF

    # Create functions directory and API handler
    mkdir -p functions
    cat > functions/api.js << 'EOF'
const serverless = require('serverless-http');
const app = require('../src/index');

exports.handler = serverless(app);
EOF

    # Add serverless-http dependency
    npm install serverless-http --save
    
    print_success "Netlify Functions deployment files created!"
}

create_env_template() {
    print_status "Creating environment template..."
    
    cat > .env.production.template << 'EOF'
# Production Environment Variables
NODE_ENV=production
PORT=10000

# Database Configuration
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/trainer_platform
POSTGRES_HOST=your-postgres-host
POSTGRES_PORT=5432
POSTGRES_DB=trainer_platform
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password

# Redis Configuration
REDIS_URL=redis://your-redis-host:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret
EOF

    print_success "Environment template created: .env.production.template"
    print_warning "Remember to update the values with your actual credentials!"
}

create_deployment_instructions() {
    print_status "Creating deployment instructions..."
    
    cat > DEPLOYMENT.md << 'EOF'
# API Deployment Instructions

## Quick Deploy Options

### 1. Render (Recommended - Free Tier)
1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Connect your GitHub repository
4. Create new Web Service
5. Set environment variables in dashboard
6. Deploy!

### 2. Railway
1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Connect your GitHub repository
4. Set environment variables
5. Deploy!

### 3. Heroku
1. Install Heroku CLI
2. Run: `heroku create your-app-name`
3. Set environment variables: `heroku config:set KEY=value`
4. Deploy: `git push heroku main`

### 4. Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts
4. Set environment variables in dashboard

## Environment Variables Required

Copy from `.env.production.template` and update with your values:

- `MONGODB_URL`: Your MongoDB Atlas connection string
- `JWT_SECRET`: A strong secret key
- `CORS_ORIGIN`: Your frontend URL (e.g., http://localhost:3000 for development)

## Local Development Setup

1. Copy `.env.production.template` to `.env`
2. Update with local values
3. Run: `npm run dev`

## Frontend Configuration

Update your frontend API client to point to the deployed API:

```javascript
// In src/services/apiClient.ts
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
```

Set `REACT_APP_API_URL` in your frontend `.env` file to your deployed API URL.
EOF

    print_success "Deployment instructions created: DEPLOYMENT.md"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the backend directory."
    exit 1
fi

print_status "Setting up deployment for: $DEPLOYMENT_TYPE"

# Create deployment-specific files
case $DEPLOYMENT_TYPE in
    "render")
        setup_render_deployment
        ;;
    "railway")
        setup_railway_deployment
        ;;
    "heroku")
        setup_heroku_deployment
        ;;
    "vercel")
        setup_vercel_deployment
        ;;
        ;;
    *)
        print_error "Unsupported deployment type: $DEPLOYMENT_TYPE"
        exit 1
        ;;
esac

# Create environment template and instructions
create_env_template
create_deployment_instructions

print_success "Deployment setup completed!"
print_status "Next steps:"
print_status "1. Push your code to GitHub"
print_status "2. Connect your repository to $DEPLOYMENT_TYPE"
print_status "3. Set environment variables in $DEPLOYMENT_TYPE dashboard"
print_status "4. Deploy!"

print_success "🎉 API deployment setup completed!"
print_status "Next steps:"
print_status "1. Review and update .env.production.template"
print_status "2. Follow instructions in DEPLOYMENT.md"
print_status "3. Deploy your API to your chosen platform"
print_status "4. Update frontend to connect to deployed API" 