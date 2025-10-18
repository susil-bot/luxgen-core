#!/bin/bash

# Generate Secure Secrets for Deployment
# This script generates secure secrets for production deployment

set -e

echo "🔐 LuxGen Secure Secrets Generator"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 This script will generate:${NC}"
echo "1. Secure JWT secret (64 characters)"
echo "2. Secure MongoDB password (32 characters)"
echo "3. Secure API keys"
echo "4. Environment variables template"
echo ""

# Generate JWT Secret
generate_jwt_secret() {
    echo -e "${BLUE}🔑 Generating JWT secret...${NC}"
    
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    echo -e "${GREEN}✅ JWT Secret generated:${NC}"
    echo "JWT_SECRET=$JWT_SECRET"
    echo ""
}

# Generate MongoDB Password
generate_mongodb_password() {
    echo -e "${BLUE}🗄️  Generating MongoDB password...${NC}"
    
    MONGODB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    
    echo -e "${GREEN}✅ MongoDB Password generated:${NC}"
    echo "MONGODB_PASSWORD=$MONGODB_PASSWORD"
    echo ""
}

# Generate API Keys
generate_api_keys() {
    echo -e "${BLUE}🔑 Generating API keys...${NC}"
    
    API_KEY=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")
    ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    echo -e "${GREEN}✅ API Keys generated:${NC}"
    echo "API_KEY=$API_KEY"
    echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
    echo ""
}

# Create secure environment template
create_secure_env_template() {
    echo -e "${BLUE}🔧 Creating secure environment template...${NC}"
    
    cat > .env.secure << EOF
# 🔐 SECURE ENVIRONMENT VARIABLES
# Generated on: $(date)
# 
# ⚠️  IMPORTANT: Replace placeholder values with your actual values
# ⚠️  NEVER commit this file to version control

# Database (REPLACE WITH YOUR ACTUAL MONGODB CONNECTION STRING)
MONGODB_URI=mongodb+srv://luxgen-prod-user:[YOUR_SECURE_PASSWORD]@luxgen-cluster.xxxxx.mongodb.net/luxgen?retryWrites=true&w=majority

# Server
NODE_ENV=production
PORT=3000

# CORS (REPLACE WITH YOUR FRONTEND URLS)
CORS_ORIGINS=https://luxgen-frontend.vercel.app,https://luxgen-multi-tenant.vercel.app
CORS_CREDENTIALS=true

# JWT (REPLACE WITH GENERATED SECRET)
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# API
API_VERSION=v1
API_PREFIX=/api

# Generated Secrets (DO NOT CHANGE)
API_KEY=$API_KEY
ENCRYPTION_KEY=$ENCRYPTION_KEY
EOF
    
    echo -e "${GREEN}✅ Secure environment template created: .env.secure${NC}"
}

# Create MongoDB setup instructions
create_mongodb_instructions() {
    echo -e "${BLUE}🗄️  Creating MongoDB setup instructions...${NC}"
    
    cat > MONGODB_SETUP_INSTRUCTIONS.md << EOF
# 🗄️ MongoDB Atlas Setup Instructions

## Step 1: Create MongoDB Atlas Account
1. Go to: https://cloud.mongodb.com/
2. Sign up with your email
3. Create project: "LuxGen-Production"

## Step 2: Create Database User
1. Go to "Database Access"
2. Click "Add New Database User"
3. Username: \`luxgen-prod-user\`
4. Password: \`$MONGODB_PASSWORD\`
5. Database User Privileges: "Read and write to any database"
6. Click "Add User"

## Step 3: Configure Network Access
1. Go to "Network Access"
2. Click "Add IP Address"
3. Choose "Allow access from anywhere" (0.0.0.0/0)
4. Click "Confirm"

## Step 4: Create Cluster
1. Go to "Clusters"
2. Click "Create Cluster"
3. Choose "M0 Sandbox" (FREE)
4. Cluster name: "luxgen-cluster"
5. Click "Create Cluster"

## Step 5: Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Driver: Node.js
4. Version: 4.1 or later
5. Copy connection string and replace:
   - \`<username>\` with \`luxgen-prod-user\`
   - \`<password>\` with \`$MONGODB_PASSWORD\`
   - \`<dbname>\` with \`luxgen\`

## Final Connection String:
\`\`\`
mongodb+srv://luxgen-prod-user:$MONGODB_PASSWORD@luxgen-cluster.xxxxx.mongodb.net/luxgen?retryWrites=true&w=majority
\`\`\`
EOF
    
    echo -e "${GREEN}✅ MongoDB setup instructions created: MONGODB_SETUP_INSTRUCTIONS.md${NC}"
}

# Create Netlify setup instructions
create_netlify_instructions() {
    echo -e "${BLUE}🚀 Creating Netlify setup instructions...${NC}"
    
    cat > NETLIFY_SETUP_INSTRUCTIONS.md << EOF
# 🚀 Netlify Setup Instructions

## Step 1: Create Netlify Account
1. Go to: https://app.netlify.com/
2. Sign up with GitHub
3. Connect your GitHub account

## Step 2: Create New Site
1. Click "New site from Git"
2. Choose "GitHub"
3. Select repository: \`susil-bot/luxgen-core\`
4. Choose root directory: \`luxgen-backend\`

## Step 3: Configure Build Settings
- Build command: \`npm run build\`
- Publish directory: \`dist\`
- Functions directory: \`netlify/functions\`

## Step 4: Add Environment Variables
Go to Site settings > Environment variables and add:

\`\`\`
MONGODB_URI=mongodb+srv://luxgen-prod-user:[YOUR_SECURE_PASSWORD]@luxgen-cluster.xxxxx.mongodb.net/luxgen?retryWrites=true&w=majority
NODE_ENV=production
PORT=3000
CORS_ORIGINS=https://luxgen-frontend.vercel.app,https://luxgen-multi-tenant.vercel.app
CORS_CREDENTIALS=true
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
API_VERSION=v1
API_PREFIX=/api
API_KEY=$API_KEY
ENCRYPTION_KEY=$ENCRYPTION_KEY
\`\`\`

## Step 5: Get Netlify Secrets for GitHub
1. Go to: https://app.netlify.com/user/applications#personal-access-tokens
2. Click "New access token"
3. Name: "GitHub Actions"
4. Copy the token

5. Go to your site settings
6. Copy the Site ID

## Step 6: Add GitHub Secrets
Go to: https://github.com/susil-bot/luxgen-core/settings/secrets/actions

Add these secrets:
- \`NETLIFY_AUTH_TOKEN\`: [Your Netlify token]
- \`NETLIFY_SITE_ID\`: [Your Netlify site ID]
EOF
    
    echo -e "${GREEN}✅ Netlify setup instructions created: NETLIFY_SETUP_INSTRUCTIONS.md${NC}"
}

# Create deployment checklist
create_deployment_checklist() {
    echo -e "${BLUE}📋 Creating deployment checklist...${NC}"
    
    cat > SECURE_DEPLOYMENT_CHECKLIST.md << EOF
# 🔐 Secure Deployment Checklist

## Pre-Deployment Security:
- [ ] All hardcoded secrets removed from code
- [ ] Secure passwords generated
- [ ] MongoDB Atlas configured with secure credentials
- [ ] Netlify environment variables set
- [ ] GitHub secrets added
- [ ] Pre-commit hooks installed

## MongoDB Setup:
- [ ] MongoDB Atlas account created
- [ ] Database user created with secure password
- [ ] Network access configured
- [ ] Connection string obtained
- [ ] Connection tested locally

## Netlify Setup:
- [ ] Netlify account connected to GitHub
- [ ] Site created: luxgen-backend
- [ ] Build settings configured
- [ ] Environment variables added
- [ ] Functions directory configured

## GitHub Actions:
- [ ] NETLIFY_AUTH_TOKEN secret added
- [ ] NETLIFY_SITE_ID secret added
- [ ] Workflow permissions enabled
- [ ] Auto-deployment enabled

## Testing:
- [ ] Health endpoint working
- [ ] API endpoints responding
- [ ] MongoDB connection working
- [ ] CORS headers correct
- [ ] Authentication flow working

## Post-Deployment:
- [ ] Update frontend API URL
- [ ] Test full integration
- [ ] Monitor logs and metrics
- [ ] Set up monitoring alerts
- [ ] Verify security headers

## Security Verification:
- [ ] No secrets in code
- [ ] Environment variables secure
- [ ] Database access restricted
- [ ] CORS properly configured
- [ ] JWT tokens secure
- [ ] Error messages don't expose secrets
EOF
    
    echo -e "${GREEN}✅ Deployment checklist created: SECURE_DEPLOYMENT_CHECKLIST.md${NC}"
}

# Main function
main() {
    echo -e "${BLUE}🚀 Generating Secure Secrets for LuxGen Backend${NC}"
    echo ""
    
    generate_jwt_secret
    generate_mongodb_password
    generate_api_keys
    create_secure_env_template
    create_mongodb_instructions
    create_netlify_instructions
    create_deployment_checklist
    
    echo ""
    echo -e "${GREEN}🎉 Secure secrets generated successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo "1. Follow MONGODB_SETUP_INSTRUCTIONS.md"
    echo "2. Follow NETLIFY_SETUP_INSTRUCTIONS.md"
    echo "3. Use SECURE_DEPLOYMENT_CHECKLIST.md"
    echo "4. Add your actual MongoDB connection string to Netlify"
    echo "5. Deploy and test!"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
    echo "- Never commit .env.secure to version control"
    echo "- Use the generated secrets in your deployment"
    echo "- Test MongoDB connection before deploying"
    echo "- Verify all endpoints work after deployment"
    echo ""
    echo -e "${GREEN}🎯 Your backend is ready for secure deployment!${NC}"
}

# Run main function
main "$@"
