#!/bin/bash

# LuxGen Core Pre-Commit Setup Script
# This script sets up comprehensive pre-commit hooks for code quality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main setup function
setup_pre_commit() {
    log_header "LuxGen Core Pre-Commit Setup"
    
    # Check prerequisites
    log_info "Checking prerequisites..."
    
    if ! command_exists node; then
        log_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    if ! command_exists npm; then
        log_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if ! command_exists git; then
        log_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    log_success "All prerequisites are available"
    
    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        log_error "Not in a Git repository. Please run this script from the project root."
        exit 1
    fi
    
    log_success "Git repository detected"
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm install
    log_success "Dependencies installed"
    
    # Install Husky
    log_info "Setting up Husky..."
    npx husky install
    log_success "Husky installed"
    
    # Create pre-commit hook
    log_info "Creating pre-commit hook..."
    npx husky add .husky/pre-commit "npm run pre-commit"
    chmod +x .husky/pre-commit
    log_success "Pre-commit hook created"
    
    # Create pre-push hook
    log_info "Creating pre-push hook..."
    npx husky add .husky/pre-push "npm run ci"
    chmod +x .husky/pre-push
    log_success "Pre-push hook created"
    
    # Make pre-commit script executable
    log_info "Making scripts executable..."
    chmod +x scripts/pre-commit.js
    chmod +x scripts/setup-pre-commit.sh
    log_success "Scripts made executable"
    
    # Test the setup
    log_info "Testing pre-commit setup..."
    if npm run lint > /dev/null 2>&1; then
        log_success "ESLint is working"
    else
        log_warning "ESLint test failed, but setup continues"
    fi
    
    if npm run test > /dev/null 2>&1; then
        log_success "Tests are working"
    else
        log_warning "Test run failed, but setup continues"
    fi
    
    # Create .gitignore entries for coverage and cache
    log_info "Updating .gitignore..."
    if [ ! -f ".gitignore" ]; then
        touch .gitignore
    fi
    
    # Add coverage and cache directories to .gitignore
    if ! grep -q "coverage/" .gitignore; then
        echo "coverage/" >> .gitignore
    fi
    
    if ! grep -q "node_modules/.cache/" .gitignore; then
        echo "node_modules/.cache/" >> .gitignore
    fi
    
    if ! grep -q ".nyc_output/" .gitignore; then
        echo ".nyc_output/" >> .gitignore
    fi
    
    log_success ".gitignore updated"
    
    # Create README for pre-commit setup
    log_info "Creating documentation..."
    cat > PRE_COMMIT_README.md << 'EOF'
# LuxGen Core Pre-Commit Setup

This project uses comprehensive pre-commit hooks to ensure code quality.

## What's Included

### Pre-Commit Checks
- **ESLint**: Code quality and style checks
- **Prettier**: Code formatting
- **Tests**: Full test suite execution
- **Security**: Vulnerability scanning
- **Coverage**: Test coverage validation
- **Dependencies**: Outdated package checks
- **File Size**: Large file detection
- **Sensitive Data**: Hardcoded secrets detection

### Pre-Push Checks
- **Full CI Pipeline**: Lint, test, and security checks
- **Performance**: Basic performance validation

## Commands

```bash
# Run all checks manually
npm run pre-commit

# Run specific checks
npm run lint          # ESLint only
npm run test          # Tests only
npm run security      # Security audit only
npm run ci            # Full CI pipeline

# Format code
npm run format        # Format with Prettier
npm run format:check  # Check formatting

# Clean up
npm run clean         # Clean cache and coverage
npm run clean:all     # Clean everything including node_modules
```

## Configuration Files

- `.eslintrc.js` - ESLint configuration
- `.prettierrc.js` - Prettier configuration
- `.lintstagedrc.js` - Lint-staged configuration
- `scripts/pre-commit.js` - Custom pre-commit checks
- `.github/workflows/ci.yml` - GitHub Actions CI/CD

## Troubleshooting

### Hook Not Running
```bash
# Reinstall hooks
npm run pre-commit:install
```

### Tests Failing
```bash
# Run tests individually
npm run test:unit
npm run test:integration
```

### ESLint Errors
```bash
# Fix auto-fixable issues
npm run lint:fix
```

### Security Issues
```bash
# Fix security vulnerabilities
npm run deps:audit
```

## Disabling Hooks (Not Recommended)

```bash
# Temporarily disable
git commit --no-verify

# Permanently disable (not recommended)
npm run pre-commit:uninstall
```
EOF
    
    log_success "Documentation created"
    
    # Final summary
    log_header "Setup Complete!"
    log_success "Pre-commit hooks are now active"
    log_info "Every commit will now run:"
    log_info "  • ESLint code quality checks"
    log_info "  • Prettier code formatting"
    log_info "  • Full test suite"
    log_info "  • Security audit"
    log_info "  • Coverage validation"
    log_info "  • And more..."
    
    log_info "\nTo test the setup:"
    log_info "  npm run pre-commit"
    
    log_info "\nTo bypass hooks (not recommended):"
    log_info "  git commit --no-verify"
    
    log_success "Setup completed successfully! 🎉"
}

# Uninstall function
uninstall_pre_commit() {
    log_header "Uninstalling Pre-Commit Hooks"
    
    log_info "Removing Husky hooks..."
    npx husky uninstall
    rm -rf .husky/
    log_success "Husky hooks removed"
    
    log_info "Cleaning up..."
    npm run clean
    log_success "Cleanup completed"
    
    log_success "Pre-commit hooks uninstalled"
}

# Main execution
case "${1:-setup}" in
    "setup")
        setup_pre_commit
        ;;
    "uninstall")
        uninstall_pre_commit
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [setup|uninstall|help]"
        echo ""
        echo "Commands:"
        echo "  setup     - Install pre-commit hooks (default)"
        echo "  uninstall - Remove pre-commit hooks"
        echo "  help      - Show this help message"
        ;;
    *)
        log_error "Unknown command: $1"
        echo "Use '$0 help' for available commands"
        exit 1
        ;;
esac
