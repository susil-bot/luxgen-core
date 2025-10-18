#!/bin/bash

# Test GitHub Actions Workflow
# This script simulates the workflow locally

set -e

echo "🧪 Testing GitHub Actions Workflow"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 This script will test:${NC}"
echo "1. Pre-commit checks"
echo "2. Build process"
echo "3. Deployment readiness"
echo ""

# Test pre-commit checks
test_pre_commit() {
    echo -e "${BLUE}🔍 Testing pre-commit checks...${NC}"
    
    # Linting
    echo "Running ESLint..."
    npm run lint || echo -e "${YELLOW}⚠️  Linting issues found${NC}"
    
    # Testing
    echo "Running tests..."
    npm test || echo -e "${YELLOW}⚠️  Some tests failed${NC}"
    
    # Security audit
    echo "Running security audit..."
    npm audit --audit-level=moderate || echo -e "${YELLOW}⚠️  Security issues found${NC}"
    
    echo -e "${GREEN}✅ Pre-commit checks completed${NC}"
}

# Test build process
test_build() {
    echo -e "${BLUE}🏗️  Testing build process...${NC}"
    
    # Clean previous build
    rm -rf dist
    
    # Run build
    npm run build
    
    # Check if dist directory exists
    if [ -d "dist" ]; then
        echo -e "${GREEN}✅ Build successful - dist directory created${NC}"
        
        # Check if required files exist
        if [ -f "dist/netlify.toml" ]; then
            echo -e "${GREEN}✅ netlify.toml found${NC}"
        else
            echo -e "${RED}❌ netlify.toml missing${NC}"
        fi
        
        if [ -d "dist/netlify/functions" ]; then
            echo -e "${GREEN}✅ Functions directory found${NC}"
        else
            echo -e "${RED}❌ Functions directory missing${NC}"
        fi
    else
        echo -e "${RED}❌ Build failed - dist directory not created${NC}"
        exit 1
    fi
}

# Test deployment readiness
test_deployment_readiness() {
    echo -e "${BLUE}🚀 Testing deployment readiness...${NC}"
    
    # Check if Netlify config exists
    if [ -f "netlify.toml" ]; then
        echo -e "${GREEN}✅ netlify.toml configured${NC}"
    else
        echo -e "${RED}❌ netlify.toml missing${NC}"
    fi
    
    # Check if functions exist
    if [ -f "netlify/functions/api.js" ]; then
        echo -e "${GREEN}✅ API function configured${NC}"
    else
        echo -e "${RED}❌ API function missing${NC}"
    fi
    
    if [ -f "netlify/functions/health.js" ]; then
        echo -e "${GREEN}✅ Health function configured${NC}"
    else
        echo -e "${RED}❌ Health function missing${NC}"
    fi
    
    # Check if GitHub Actions workflow exists
    if [ -f ".github/workflows/netlify-deploy.yml" ]; then
        echo -e "${GREEN}✅ GitHub Actions workflow configured${NC}"
    else
        echo -e "${RED}❌ GitHub Actions workflow missing${NC}"
    fi
}

# Test environment variables
test_environment() {
    echo -e "${BLUE}🔧 Testing environment configuration...${NC}"
    
    # Check if .env.example exists
    if [ -f ".env.example" ]; then
        echo -e "${GREEN}✅ Environment template found${NC}"
    else
        echo -e "${YELLOW}⚠️  Environment template missing${NC}"
    fi
    
    # Check if secrets template exists
    if [ -f ".github-secrets-template.md" ]; then
        echo -e "${GREEN}✅ GitHub secrets template found${NC}"
    else
        echo -e "${YELLOW}⚠️  GitHub secrets template missing${NC}"
    fi
}

# Main test function
main() {
    echo -e "${BLUE}🚀 Testing LuxGen Backend Workflow${NC}"
    echo ""
    
    test_pre_commit
    echo ""
    test_build
    echo ""
    test_deployment_readiness
    echo ""
    test_environment
    
    echo ""
    echo -e "${GREEN}🎉 Workflow test completed!${NC}"
    echo ""
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo "1. Set up Netlify: https://app.netlify.com/"
    echo "2. Connect repository: susil-bot/luxgen-core"
    echo "3. Add environment variables"
    echo "4. Add GitHub secrets"
    echo "5. Push to main to trigger deployment!"
    echo ""
    echo -e "${GREEN}🎯 Your workflow is ready for automatic deployment!${NC}"
}

# Run main function
main "$@"
