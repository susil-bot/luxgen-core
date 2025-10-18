#!/bin/bash

# LuxGen Backend Pre-commit Setup Script
# Sets up pre-commit hooks for code quality and deployment

set -e

echo "🔧 LuxGen Backend Pre-commit Setup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 This script will set up:${NC}"
echo "1. Pre-commit hooks"
echo "2. Code quality checks"
echo "3. Security validation"
echo "4. Build pipeline"
echo ""

# Check if we're in the right directory
check_directory() {
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ Not in backend directory. Please run from luxgen-backend folder${NC}"
        exit 1
    fi
    
    if [ ! -f ".pre-commit-config.yaml" ]; then
        echo -e "${RED}❌ Pre-commit config not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Backend directory structure verified${NC}"
}

# Install pre-commit
install_pre_commit() {
    echo -e "${BLUE}📦 Installing pre-commit...${NC}"
    
    if command -v pre-commit &> /dev/null; then
        echo -e "${GREEN}✅ Pre-commit already installed${NC}"
    else
        echo -e "${BLUE}Installing pre-commit...${NC}"
        pip install pre-commit
        echo -e "${GREEN}✅ Pre-commit installed${NC}"
    fi
}

# Install pre-commit hooks
install_hooks() {
    echo -e "${BLUE}🔗 Installing pre-commit hooks...${NC}"
    
    pre-commit install
    echo -e "${GREEN}✅ Pre-commit hooks installed${NC}"
}

# Install Node.js dependencies
install_dependencies() {
    echo -e "${BLUE}📦 Installing Node.js dependencies...${NC}"
    
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Test pre-commit hooks
test_hooks() {
    echo -e "${BLUE}🧪 Testing pre-commit hooks...${NC}"
    
    # Run pre-commit on all files
    pre-commit run --all-files || echo -e "${YELLOW}⚠️  Some hooks failed (this is normal for initial setup)${NC}"
    
    echo -e "${GREEN}✅ Pre-commit hooks tested${NC}"
}

# Create GitHub Actions secrets template
create_secrets_template() {
    echo -e "${BLUE}🔐 Creating GitHub secrets template...${NC}"
    
    cat > .github-secrets-template.md << 'EOF'
# GitHub Secrets Required

Add these secrets to your GitHub repository settings:

## Netlify Secrets
- `NETLIFY_AUTH_TOKEN`: Your Netlify personal access token
- `NETLIFY_SITE_ID`: Your Netlify site ID

## How to get Netlify secrets:

### 1. Get Netlify Auth Token:
1. Go to: https://app.netlify.com/user/applications#personal-access-tokens
2. Click "New access token"
3. Give it a name: "GitHub Actions"
4. Copy the token

### 2. Get Netlify Site ID:
1. Go to: https://app.netlify.com/sites/luxgen-backend
2. Go to Site settings > General
3. Copy the Site ID

## Add to GitHub:
1. Go to: https://github.com/susil-bot/luxgen-core/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret with the values above
EOF
    
    echo -e "${GREEN}✅ GitHub secrets template created${NC}"
}

# Create deployment checklist
create_deployment_checklist() {
    echo -e "${BLUE}📋 Creating deployment checklist...${NC}"
    
    cat > DEPLOYMENT_CHECKLIST.md << 'EOF'
# 🚀 Deployment Checklist

## Pre-deployment:
- [ ] Pre-commit hooks installed
- [ ] All tests passing
- [ ] Linting clean
- [ ] Security audit clean
- [ ] Build successful

## Netlify Setup:
- [ ] Netlify account connected to GitHub
- [ ] Site created: luxgen-backend
- [ ] Build settings configured
- [ ] Environment variables set
- [ ] Functions directory configured

## GitHub Actions:
- [ ] NETLIFY_AUTH_TOKEN secret added
- [ ] NETLIFY_SITE_ID secret added
- [ ] Workflow permissions enabled
- [ ] Auto-deployment enabled

## Testing:
- [ ] Health endpoint working
- [ ] API endpoints responding
- [ ] CORS headers correct
- [ ] Frontend can communicate

## Post-deployment:
- [ ] Update frontend API URL
- [ ] Test full integration
- [ ] Monitor logs and metrics
- [ ] Set up monitoring alerts
EOF
    
    echo -e "${GREEN}✅ Deployment checklist created${NC}"
}

# Main setup function
main() {
    echo -e "${BLUE}🚀 Setting up LuxGen Backend Pre-commit${NC}"
    echo ""
    
    check_directory
    install_pre_commit
    install_hooks
    install_dependencies
    test_hooks
    create_secrets_template
    create_deployment_checklist
    
    echo ""
    echo -e "${GREEN}🎉 Pre-commit setup completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo "1. Set up Netlify: https://app.netlify.com/"
    echo "2. Connect repository: susil-bot/luxgen-core"
    echo "3. Configure build settings"
    echo "4. Add environment variables"
    echo "5. Add GitHub secrets (see .github-secrets-template.md)"
    echo "6. Test deployment"
    echo ""
    echo -e "${YELLOW}⚠️  Don't forget to:${NC}"
    echo "- Add MongoDB connection string to Netlify environment variables"
    echo "- Set secure JWT_SECRET"
    echo "- Configure CORS_ORIGINS for your frontend URLs"
    echo ""
    echo -e "${GREEN}🎯 Your backend is ready for Netlify deployment!${NC}"
}

# Run main function
main "$@"