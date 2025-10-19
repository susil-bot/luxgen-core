#!/bin/bash

# Production Deployment Script for LuxGen Backend
# This script handles production deployment with comprehensive checks and rollback capabilities

set -e

# Configuration
APP_NAME="luxgen-backend"
APP_VERSION=${APP_VERSION:-"1.0.0"}
DOCKER_COMPOSE_FILE="docker-compose.production.yml"
BACKUP_DIR="./backups"
LOG_DIR="./logs"
HEALTH_CHECK_URL="http://localhost:3000/health"
MAX_RETRIES=3
RETRY_DELAY=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Error handling
handle_error() {
    log_error "Deployment failed at line $1"
    log_error "Starting rollback process..."
    rollback_deployment
    exit 1
}

trap 'handle_error $LINENO' ERR

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running"
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose > /dev/null 2>&1; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if required environment variables are set
    required_vars=("MONGODB_URI" "JWT_SECRET" "SESSION_SECRET")
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        log_warning ".env file not found, using environment variables"
    fi
    
    # Check disk space
    available_space=$(df . | tail -1 | awk '{print $4}')
    if [ "$available_space" -lt 1048576 ]; then # 1GB in KB
        log_warning "Low disk space: ${available_space}KB available"
    fi
    
    log_success "Pre-deployment checks passed"
}

# Create backup
create_backup() {
    log_info "Creating backup..."
    
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_path="${BACKUP_DIR}/backup_${timestamp}"
    
    mkdir -p "$backup_path"
    
    # Backup application files
    cp -r src "$backup_path/"
    cp -r public "$backup_path/" 2>/dev/null || true
    cp package*.json "$backup_path/"
    cp docker-compose*.yml "$backup_path/"
    cp Dockerfile* "$backup_path/"
    
    # Backup logs
    if [ -d "$LOG_DIR" ]; then
        cp -r "$LOG_DIR" "$backup_path/"
    fi
    
    # Backup database (if using local MongoDB)
    if docker-compose -f "$DOCKER_COMPOSE_FILE" ps mongodb | grep -q "Up"; then
        log_info "Backing up MongoDB data..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T mongodb mongodump --out /data/backup
        docker cp $(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q mongodb):/data/backup "$backup_path/mongodb_backup"
    fi
    
    log_success "Backup created at $backup_path"
    echo "$backup_path" > .last_backup
}

# Build application
build_application() {
    log_info "Building application..."
    
    # Build Docker image
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache
    
    log_success "Application built successfully"
}

# Deploy application
deploy_application() {
    log_info "Deploying application..."
    
    # Stop existing containers
    docker-compose -f "$DOCKER_COMPOSE_FILE" down --remove-orphans
    
    # Start new containers
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    log_success "Application deployed"
}

# Health check
health_check() {
    log_info "Running health checks..."
    
    local retries=0
    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -f "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            log_success "Health check passed"
            return 0
        fi
        
        retries=$((retries + 1))
        log_warning "Health check failed, retrying in ${RETRY_DELAY}s... (${retries}/${MAX_RETRIES})"
        sleep $RETRY_DELAY
    done
    
    log_error "Health check failed after $MAX_RETRIES attempts"
    return 1
}

# Performance test
performance_test() {
    log_info "Running performance tests..."
    
    # Basic load test
    if command -v ab > /dev/null 2>&1; then
        ab -n 100 -c 10 "$HEALTH_CHECK_URL" > /dev/null 2>&1
        log_success "Performance test passed"
    else
        log_warning "Apache Bench not available, skipping performance test"
    fi
}

# Rollback deployment
rollback_deployment() {
    log_info "Rolling back deployment..."
    
    if [ -f ".last_backup" ]; then
        backup_path=$(cat .last_backup)
        log_info "Rolling back to backup: $backup_path"
        
        # Stop current containers
        docker-compose -f "$DOCKER_COMPOSE_FILE" down
        
        # Restore files
        cp -r "$backup_path"/* ./
        
        # Restore database
        if [ -d "$backup_path/mongodb_backup" ]; then
            docker-compose -f "$DOCKER_COMPOSE_FILE" up -d mongodb
            sleep 10
            docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T mongodb mongorestore /data/backup
        fi
        
        # Start previous version
        docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
        
        log_success "Rollback completed"
    else
        log_error "No backup found for rollback"
    fi
}

# Post-deployment tasks
post_deployment_tasks() {
    log_info "Running post-deployment tasks..."
    
    # Clean up old images
    docker image prune -f
    
    # Clean up old backups (keep last 5)
    if [ -d "$BACKUP_DIR" ]; then
        cd "$BACKUP_DIR"
        ls -t | tail -n +6 | xargs -r rm -rf
        cd - > /dev/null
    fi
    
    # Set up log rotation
    if [ -d "$LOG_DIR" ]; then
        find "$LOG_DIR" -name "*.log" -mtime +7 -delete
    fi
    
    log_success "Post-deployment tasks completed"
}

# Main deployment function
main() {
    log_info "Starting production deployment for $APP_NAME v$APP_VERSION"
    
    # Pre-deployment checks
    pre_deployment_checks
    
    # Create backup
    create_backup
    
    # Build application
    build_application
    
    # Deploy application
    deploy_application
    
    # Health check
    if ! health_check; then
        log_error "Health check failed, rolling back..."
        rollback_deployment
        exit 1
    fi
    
    # Performance test
    performance_test
    
    # Post-deployment tasks
    post_deployment_tasks
    
    log_success "Production deployment completed successfully!"
    log_info "Application is running at: $HEALTH_CHECK_URL"
    log_info "Monitoring dashboard: http://localhost:3001"
    log_info "Metrics endpoint: http://localhost:9090"
}

# Script options
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback_deployment
        ;;
    "health")
        health_check
        ;;
    "backup")
        create_backup
        ;;
    "cleanup")
        post_deployment_tasks
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health|backup|cleanup}"
        echo "  deploy   - Deploy the application (default)"
        echo "  rollback - Rollback to previous version"
        echo "  health   - Run health checks"
        echo "  backup   - Create backup only"
        echo "  cleanup  - Clean up old files"
        exit 1
        ;;
esac
