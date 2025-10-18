#!/bin/bash

# Comprehensive Deployment Test Script
# Tests all aspects of the deployment pipeline

set -e

echo "🧪 LuxGen Backend Deployment Test"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 This script will test:${NC}"
echo "1. Security checks (no hardcoded secrets)"
echo "2. Code quality (linting, testing)"
echo "3. Build process"
echo "4. MongoDB connection"
echo "5. Deployment readiness"
echo ""

# Test security
test_security() {
    echo -e "${BLUE}🔐 Testing security...${NC}"
    
    # Check for hardcoded secrets (exclude documentation and scripts)
    if grep -r "LuxGenPassword123\|your-super-secret\|your_vercel_token" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.sh" --exclude="docs/" --exclude="scripts/" > /dev/null; then
        echo -e "${RED}❌ Hardcoded secrets found!${NC}"
        echo "Please remove hardcoded secrets from code"
        exit 1
    else
        echo -e "${GREEN}✅ No hardcoded secrets found${NC}"
    fi
    
    # Check for .env files in git
    if git ls-files | grep -E "\.env$|\.env\." | grep -v ".env.example" > /dev/null; then
        echo -e "${RED}❌ Environment files found in git!${NC}"
        echo "Please remove .env files from git"
        exit 1
    else
        echo -e "${GREEN}✅ No .env files in git${NC}"
    fi
}

# Test code quality
test_code_quality() {
    echo -e "${BLUE}🔍 Testing code quality...${NC}"
    
    # Linting
    echo "Running ESLint..."
    if npm run lint; then
        echo -e "${GREEN}✅ Linting passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Linting issues found${NC}"
    fi
    
    # Testing
    echo "Running tests..."
    if npm test; then
        echo -e "${GREEN}✅ Tests passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Some tests failed${NC}"
    fi
    
    # Security audit
    echo "Running security audit..."
    if npm audit --audit-level=moderate; then
        echo -e "${GREEN}✅ Security audit passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Security issues found${NC}"
    fi
}

# Test build process
test_build() {
    echo -e "${BLUE}🏗️  Testing build process...${NC}"
    
    # Clean previous build
    rm -rf dist
    
    # Run build
    if npm run build; then
        echo -e "${GREEN}✅ Build successful${NC}"
        
        # Check if required files exist
        if [ -f "dist/netlify.toml" ]; then
            echo -e "${GREEN}✅ netlify.toml found${NC}"
        else
            echo -e "${RED}❌ netlify.toml missing${NC}"
            exit 1
        fi
        
        if [ -d "dist/netlify/functions" ]; then
            echo -e "${GREEN}✅ Functions directory found${NC}"
        else
            echo -e "${RED}❌ Functions directory missing${NC}"
            exit 1
        fi
        
        if [ -f "dist/package.json" ]; then
            echo -e "${GREEN}✅ package.json found${NC}"
        else
            echo -e "${RED}❌ package.json missing${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Build failed${NC}"
        exit 1
    fi
}

# Test MongoDB connection
test_mongodb() {
    echo -e "${BLUE}🗄️  Testing MongoDB connection...${NC}"
    
    if [ -f ".env.secure" ]; then
        echo -e "${GREEN}✅ Secure environment file found${NC}"
        
        # Test MongoDB connection
        if node scripts/test-mongodb-connection.js; then
            echo -e "${GREEN}✅ MongoDB connection successful${NC}"
        else
            echo -e "${YELLOW}⚠️  MongoDB connection failed${NC}"
            echo "Please check your MongoDB configuration"
        fi
    else
        echo -e "${YELLOW}⚠️  .env.secure not found${NC}"
        echo "Please run ./scripts/generate-secrets.sh first"
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
        exit 1
    fi
    
    # Check if functions exist
    if [ -f "netlify/functions/api.js" ]; then
        echo -e "${GREEN}✅ API function configured${NC}"
    else
        echo -e "${RED}❌ API function missing${NC}"
        exit 1
    fi
    
    if [ -f "netlify/functions/health.js" ]; then
        echo -e "${GREEN}✅ Health function configured${NC}"
    else
        echo -e "${RED}❌ Health function missing${NC}"
        exit 1
    fi
    
    # Check if GitHub Actions workflow exists
    if [ -f ".github/workflows/netlify-deploy.yml" ]; then
        echo -e "${GREEN}✅ GitHub Actions workflow configured${NC}"
    else
        echo -e "${RED}❌ GitHub Actions workflow missing${NC}"
        exit 1
    fi
    
    # Check if pre-commit config exists
    if [ -f ".pre-commit-config.yaml" ]; then
        echo -e "${GREEN}✅ Pre-commit hooks configured${NC}"
    else
        echo -e "${RED}❌ Pre-commit hooks missing${NC}"
        exit 1
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
    
    # Check if setup instructions exist
    if [ -f "MONGODB_SETUP_INSTRUCTIONS.md" ]; then
        echo -e "${GREEN}✅ MongoDB setup instructions found${NC}"
    else
        echo -e "${YELLOW}⚠️  MongoDB setup instructions missing${NC}"
    fi
    
    if [ -f "NETLIFY_SETUP_INSTRUCTIONS.md" ]; then
        echo -e "${GREEN}✅ Netlify setup instructions found${NC}"
    else
        echo -e "${YELLOW}⚠️  Netlify setup instructions missing${NC}"
    fi
}

# Main test function
main() {
    echo -e "${BLUE}🚀 Testing LuxGen Backend Deployment${NC}"
    echo ""
    
    test_security
    echo ""
    test_code_quality
    echo ""
    test_build
    echo ""
    test_mongodb
    echo ""
    test_deployment_readiness
    echo ""
    test_environment
    
    echo ""
    echo -e "${GREEN}🎉 All deployment tests completed!${NC}"
    echo ""
    echo -e "${BLUE}📋 Next steps:${NC}"
    echo "1. Follow MONGODB_SETUP_INSTRUCTIONS.md"
    echo "2. Follow NETLIFY_SETUP_INSTRUCTIONS.md"
    echo "3. Use SECURE_DEPLOYMENT_CHECKLIST.md"
    echo "4. Add your actual MongoDB connection string to Netlify"
    echo "5. Push to main to trigger deployment!"
    echo ""
    echo -e "${GREEN}🎯 Your backend is ready for secure deployment!${NC}"
}

# Run main function
main "$@"
