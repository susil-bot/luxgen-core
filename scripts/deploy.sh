#!/bin/bash

# 🚀 LuxGen Trainer Platform - Deployment Script
# This script automates the deployment process to Render.com

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_NAME="luxgen-core"
SERVICE_NAME="luxgen-trainer-platform-backend"
BRANCH=${1:-main}

echo -e "${BLUE}🚀 LuxGen Trainer Platform - Deployment Script${NC}"
echo -e "${BLUE}================================================${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    # Check if node is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository. Please run this script from the project root."
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Run tests
run_tests() {
    print_info "Running tests..."
    
    # Install dependencies
    npm ci
    
    # Run linting
    print_info "Running linting..."
    npm run lint
    
    # Run security audit
    print_info "Running security audit..."
    npm run security:audit
    
    # Run tests
    print_info "Running unit tests..."
    npm run test
    
    # Run API tests
    print_info "Running API tests..."
    npm run api:test:simple
    
    print_status "All tests passed"
}

# Build application
build_application() {
    print_info "Building application..."
    
    # Build the application
    npm run build
    
    # Build Docker image
    print_info "Building Docker image..."
    docker build -f Dockerfile.prod -t $SERVICE_NAME:latest .
    
    print_status "Application built successfully"
}

# Deploy to Render
deploy_to_render() {
    print_info "Deploying to Render.com..."
    
    # Check if we have the necessary environment variables
    if [ -z "$RENDER_API_KEY" ]; then
        print_error "RENDER_API_KEY environment variable is not set"
        print_info "Please set it with: export RENDER_API_KEY=your-api-key"
        exit 1
    fi
    
    if [ -z "$RENDER_SERVICE_ID" ]; then
        print_error "RENDER_SERVICE_ID environment variable is not set"
        print_info "Please set it with: export RENDER_SERVICE_ID=your-service-id"
        exit 1
    fi
    
    # Push to GitHub to trigger deployment
    print_info "Pushing to GitHub to trigger deployment..."
    
    # Add all changes
    git add .
    
    # Commit changes
    git commit -m "Deploy: Automated deployment to Render.com [skip ci]"
    
    # Push to the specified branch
    git push origin $BRANCH
    
    print_status "Deployment triggered successfully"
    print_info "Check your Render.com dashboard for deployment progress"
}

# Verify deployment
verify_deployment() {
    print_info "Verifying deployment..."
    
    # Wait for deployment to complete
    print_info "Waiting for deployment to complete..."
    sleep 30
    
    # Get the service URL from Render API
    SERVICE_URL=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
        "https://api.render.com/v1/services/$RENDER_SERVICE_ID" | \
        jq -r '.service.serviceDetails.url')
    
    if [ "$SERVICE_URL" = "null" ] || [ -z "$SERVICE_URL" ]; then
        print_warning "Could not get service URL from Render API"
        print_info "Please check your deployment manually"
        return
    fi
    
    print_info "Service URL: $SERVICE_URL"
    
    # Test health endpoint
    print_info "Testing health endpoint..."
    HEALTH_RESPONSE=$(curl -s "$SERVICE_URL/health" || echo "FAILED")
    
    if [[ "$HEALTH_RESPONSE" == *"healthy"* ]]; then
        print_status "Health check passed"
    else
        print_warning "Health check failed. Response: $HEALTH_RESPONSE"
    fi
    
    # Test API documentation
    print_info "Testing API documentation..."
    DOCS_RESPONSE=$(curl -s "$SERVICE_URL/docs" || echo "FAILED")
    
    if [[ "$DOCS_RESPONSE" == *"LuxGen Trainer Platform API Documentation"* ]]; then
        print_status "API documentation accessible"
    else
        print_warning "API documentation test failed"
    fi
    
    print_status "Deployment verification completed"
}

# Main deployment function
main() {
    print_info "Starting deployment process for branch: $BRANCH"
    
    # Check prerequisites
    check_prerequisites
    
    # Run tests
    run_tests
    
    # Build application
    build_application
    
    # Deploy to Render
    deploy_to_render
    
    # Verify deployment
    verify_deployment
    
    print_status "Deployment process completed successfully!"
    print_info "Your application should be available at your Render.com service URL"
}

# Help function
show_help() {
    echo "Usage: $0 [BRANCH]"
    echo ""
    echo "Options:"
    echo "  BRANCH    Branch to deploy (default: main)"
    echo "  -h, --help Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  RENDER_API_KEY     Your Render.com API key"
    echo "  RENDER_SERVICE_ID  Your Render.com service ID"
    echo ""
    echo "Examples:"
    echo "  $0 main           # Deploy main branch"
    echo "  $0 develop        # Deploy develop branch"
    echo "  $0 feature/new-ui # Deploy feature branch"
}

# Parse command line arguments
case "$1" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main
        ;;
esac 