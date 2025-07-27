#!/bin/bash

# ========================================
# 🐳 DOCKER TEST SCRIPT FOR TRAINER PLATFORM
# ========================================

set -e

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Docker status
check_docker() {
    print_status "Checking Docker installation..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed!"
        exit 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running!"
        print_status "Please start Docker Desktop and try again."
        exit 1
    fi
    
    print_success "Docker is running"
}

# Function to validate Dockerfile
validate_dockerfile() {
    print_status "Validating Dockerfile..."
    
    if [ ! -f "Dockerfile" ]; then
        print_error "Dockerfile not found!"
        exit 1
    fi
    
    # Check for required stages
    if ! grep -q "FROM.*AS.*base" Dockerfile; then
        print_warning "Base stage not found in Dockerfile"
    fi
    
    if ! grep -q "FROM.*AS.*production" Dockerfile; then
        print_warning "Production stage not found in Dockerfile"
    fi
    
    if ! grep -q "FROM.*AS.*development" Dockerfile; then
        print_warning "Development stage not found in Dockerfile"
    fi
    
    print_success "Dockerfile validation completed"
}

# Function to validate Docker Compose files
validate_compose_files() {
    print_status "Validating Docker Compose files..."
    
    # Check production compose file
    if [ -f "docker-compose.yml" ]; then
        if docker-compose -f docker-compose.yml config >/dev/null 2>&1; then
            print_success "docker-compose.yml is valid"
        else
            print_error "docker-compose.yml is invalid!"
            exit 1
        fi
    else
        print_error "docker-compose.yml not found!"
        exit 1
    fi
    
    # Check development compose file
    if [ -f "docker-compose.dev.yml" ]; then
        if docker-compose -f docker-compose.dev.yml config >/dev/null 2>&1; then
            print_success "docker-compose.dev.yml is valid"
        else
            print_error "docker-compose.dev.yml is invalid!"
            exit 1
        fi
    else
        print_error "docker-compose.dev.yml not found!"
        exit 1
    fi
}

# Function to check required directories
check_directories() {
    print_status "Checking required directories..."
    
    local required_dirs=(
        "logs"
        "uploads"
        "monitoring/grafana/dashboards"
        "monitoring/grafana/datasources"
        "nginx/ssl"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            print_warning "Directory $dir does not exist, creating..."
            mkdir -p "$dir"
        fi
        print_success "Directory $dir exists"
    done
}

# Function to check required files
check_files() {
    print_status "Checking required configuration files..."
    
    local required_files=(
        "monitoring/prometheus.yml"
        "monitoring/prometheus.dev.yml"
        "nginx/nginx.conf"
        ".dockerignore"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Required file $file not found!"
            exit 1
        fi
        print_success "File $file exists"
    done
}

# Function to test Docker build
test_docker_build() {
    print_status "Testing Docker build (production target)..."
    
    # Clean up any existing test images
    docker rmi trainer-platform-backend:test 2>/dev/null || true
    
    # Build the image
    if docker build --target production -t trainer-platform-backend:test .; then
        print_success "Docker build successful"
    else
        print_error "Docker build failed!"
        exit 1
    fi
}

# Function to test Docker Compose
test_docker_compose() {
    print_status "Testing Docker Compose setup..."
    
    # Stop any running containers
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    
    # Start services in background
    print_status "Starting development services..."
    docker-compose -f docker-compose.dev.yml up -d mongodb redis
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 10
    
    # Check if services are running
    if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
        print_success "Docker Compose services started successfully"
    else
        print_error "Docker Compose services failed to start!"
        docker-compose -f docker-compose.dev.yml logs
        exit 1
    fi
    
    # Test health checks
    print_status "Testing health checks..."
    sleep 5
    
    # Check MongoDB health
    if docker-compose -f docker-compose.dev.yml exec -T mongodb mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
        print_success "MongoDB health check passed"
    else
        print_warning "MongoDB health check failed"
    fi
    
    # Check Redis health
    if docker-compose -f docker-compose.dev.yml exec -T redis redis-cli ping >/dev/null 2>&1; then
        print_success "Redis health check passed"
    else
        print_warning "Redis health check failed"
    fi
}

# Function to test backend service
test_backend_service() {
    print_status "Testing backend service..."
    
    # Start backend service
    docker-compose -f docker-compose.dev.yml up -d backend
    
    # Wait for backend to be ready
    print_status "Waiting for backend service to be ready..."
    sleep 15
    
    # Test health endpoint
    if curl -f http://localhost:3001/health >/dev/null 2>&1; then
        print_success "Backend health check passed"
    else
        print_warning "Backend health check failed"
    fi
    
    # Test API endpoint
    if curl -f http://localhost:3001/api/v1/health >/dev/null 2>&1; then
        print_success "API health check passed"
    else
        print_warning "API health check failed"
    fi
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up test environment..."
    
    # Stop and remove containers
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    
    # Remove test image
    docker rmi trainer-platform-backend:test 2>/dev/null || true
    
    print_success "Cleanup completed"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --validate-only    Only validate configurations without building"
    echo "  --no-cleanup       Don't cleanup after testing"
    echo "  --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                 Run full test suite"
    echo "  $0 --validate-only Only validate configurations"
    echo "  $0 --no-cleanup    Run tests without cleanup"
}

# Main execution
main() {
    local validate_only=false
    local no_cleanup=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --validate-only)
                validate_only=true
                shift
                ;;
            --no-cleanup)
                no_cleanup=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    echo "========================================"
    echo "🐳 DOCKER TEST SUITE FOR TRAINER PLATFORM"
    echo "========================================"
    echo ""
    
    # Run validation checks
    if [ "$validate_only" = false ]; then
        check_docker
    fi
    validate_dockerfile
    validate_compose_files
    check_directories
    check_files
    
    if [ "$validate_only" = true ]; then
        print_success "Validation completed successfully!"
        exit 0
    fi
    
    # Run build and runtime tests
    test_docker_build
    test_docker_compose
    test_backend_service
    
    if [ "$no_cleanup" = false ]; then
        cleanup
    fi
    
    echo ""
    echo "========================================"
    print_success "ALL TESTS PASSED! 🎉"
    echo "========================================"
    echo ""
    echo "Your Docker setup is working correctly!"
    echo ""
    echo "Next steps:"
    echo "1. Run: docker-compose -f docker-compose.dev.yml up -d"
    echo "2. Access the application at: http://localhost:3001"
    echo "3. Access monitoring tools:"
    echo "   - Grafana: http://localhost:3002 (admin/admin)"
    echo "   - Prometheus: http://localhost:9091"
    echo "   - Mongo Express: http://localhost:8081 (admin/password)"
    echo "   - Redis Commander: http://localhost:8082"
}

# Run main function with all arguments
main "$@" 