# 🤖 Cursor Code Review Bot Setup Guide

This guide explains how to set up and configure the Cursor AI code review bot for the LuxGen backend project.

## 📋 **Overview**

The Cursor Code Review Bot provides automated code reviews using AI to analyze:
- ✅ Code quality and best practices
- ✅ Security vulnerabilities
- ✅ Performance optimizations
- ✅ Documentation completeness
- ✅ Testing coverage
- ✅ Project-specific patterns

## 🚀 **Quick Setup**

### 1. **Get Cursor API Key**
1. Visit [Cursor AI](https://cursor.sh/)
2. Sign up for a free account
3. Navigate to API settings
4. Generate a new API key
5. Copy the API key for later use

### 2. **Add GitHub Secrets**
1. Go to your GitHub repository: `susil-bot/luxgen-core`
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

```bash
# Required secrets
CURSOR_API_KEY=your_cursor_api_key_here
GITHUB_TOKEN=${{ secrets.GITHUB_TOKEN }}  # Already available
```

### 3. **Enable the Workflow**
The workflow is already configured in `.github/workflows/cursor-review-bot.yml` and will automatically run on:
- Pull requests (opened, updated, reopened)
- Pushes to main/develop branches

## ⚙️ **Configuration**

### **Review Settings**
The bot is configured via `.cursor-review.yml` with the following features:

```yaml
# Review Features
features:
  code_quality: true      # Code quality analysis
  security: true          # Security vulnerability detection
  performance: true        # Performance optimization suggestions
  documentation: true      # Documentation completeness
  testing: true           # Test coverage analysis
  best_practices: true     # Best practices enforcement
```

### **File Patterns**
```yaml
# Files to review
include_patterns:
  - "src/**/*.js"
  - "src/**/*.ts"
  - "tests/**/*.js"
  - "*.json"
  - "*.md"

# Files to exclude
exclude_patterns:
  - "node_modules/**"
  - "dist/**"
  - "build/**"
  - "*.log"
```

## 🎯 **What the Bot Reviews**

### **Code Quality**
- ✅ Unused variables and imports
- ✅ Code complexity and maintainability
- ✅ Function and class organization
- ✅ Naming conventions
- ✅ Code duplication

### **Security**
- ✅ SQL injection vulnerabilities
- ✅ XSS and CSRF protection
- ✅ Hardcoded secrets detection
- ✅ Input validation
- ✅ Authentication/authorization patterns

### **Performance**
- ✅ N+1 query problems
- ✅ Memory leak detection
- ✅ Inefficient algorithms
- ✅ Database optimization
- ✅ Async operation handling

### **Documentation**
- ✅ Function documentation
- ✅ API documentation
- ✅ README completeness
- ✅ Code comments quality

### **Testing**
- ✅ Test coverage analysis
- ✅ Test quality and clarity
- ✅ Edge case coverage
- ✅ Test maintainability

### **LuxGen-Specific**
- ✅ Multi-tenancy patterns
- ✅ API consistency
- ✅ Error handling consistency
- ✅ Logging standards
- ✅ Database schema consistency

## 📊 **Review Output**

### **GitHub Comments**
The bot will post detailed comments on:
- **Pull requests**: Line-by-line feedback
- **Commits**: Summary of changes
- **Issues**: Critical findings

### **Review Summary**
Each review includes:
- 📋 **Summary**: Overview of findings
- 🔍 **Details**: Specific issues and suggestions
- 💡 **Examples**: Code examples and improvements
- 📚 **Resources**: Links to documentation and best practices

### **Severity Levels**
- 🔴 **Error**: Critical issues that must be fixed
- 🟡 **Warning**: Issues that should be addressed
- 🔵 **Info**: Suggestions for improvement
- 💡 **Suggestion**: Optional enhancements

## 🛠️ **Customization**

### **Modify Review Rules**
Edit `.cursor-review.yml` to customize:

```yaml
# Add custom rules
custom_rules:
  - name: "luxgen-api-consistency"
    description: "Ensure API endpoints follow LuxGen conventions"
    pattern: "src/routes/**/*.js"
    check: "api-consistency"
```

### **Adjust Review Scope**
```yaml
# Change file patterns
include_patterns:
  - "src/**/*.js"
  - "src/**/*.ts"
  # Add more patterns as needed

# Exclude specific files
exclude_patterns:
  - "src/legacy/**"
  - "src/experimental/**"
```

### **Configure Notifications**
```yaml
# Enable/disable notifications
notifications:
  on_completion: true
  on_critical: true
  on_security: true
```

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. Bot Not Running**
- ✅ Check GitHub secrets are set correctly
- ✅ Verify workflow file is in `.github/workflows/`
- ✅ Ensure repository has Actions enabled

#### **2. API Key Issues**
- ✅ Verify CURSOR_API_KEY is valid
- ✅ Check API key has sufficient credits
- ✅ Ensure API key has correct permissions

#### **3. Review Not Appearing**
- ✅ Check if files match include patterns
- ✅ Verify exclude patterns aren't too broad
- ✅ Ensure files are under max_file_size limit

#### **4. Too Many Comments**
- ✅ Adjust `max_comments_per_file` in config
- ✅ Modify severity levels
- ✅ Exclude non-critical files

### **Debug Mode**
Enable debug logging by adding to workflow:

```yaml
- name: 🔍 Debug Review
  run: |
    echo "Debug information:"
    echo "Repository: ${{ github.repository }}"
    echo "Event: ${{ github.event_name }}"
    echo "Files changed: ${{ github.event.pull_request.changed_files }}"
```

## 📈 **Best Practices**

### **For Developers**
1. **Read all bot comments** - They provide valuable insights
2. **Address critical issues** - Fix security and error issues first
3. **Consider suggestions** - Bot suggestions often improve code quality
4. **Ask questions** - If unclear, ask for clarification in PR comments

### **For Maintainers**
1. **Review bot configuration** - Ensure it matches project needs
2. **Monitor bot performance** - Check if reviews are helpful
3. **Update rules** - Add new rules as project evolves
4. **Balance automation** - Don't let bot override human judgment

## 🎯 **Expected Benefits**

### **Code Quality**
- ✅ Consistent code style and patterns
- ✅ Reduced bugs and vulnerabilities
- ✅ Better documentation
- ✅ Improved maintainability

### **Team Productivity**
- ✅ Faster code reviews
- ✅ Learning opportunities for developers
- ✅ Reduced manual review time
- ✅ Better code knowledge sharing

### **Project Health**
- ✅ Higher code quality standards
- ✅ Better security posture
- ✅ Improved performance
- ✅ Enhanced documentation

## 📚 **Resources**

- [Cursor AI Documentation](https://cursor.sh/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Code Review Best Practices](https://github.com/microsoft/vscode/wiki/Code-Review-Guidelines)
- [LuxGen Coding Standards](./CODE_QUALITY_GUIDE.md)

## 🆘 **Support**

If you encounter issues with the Cursor review bot:

1. **Check the logs** in GitHub Actions
2. **Review the configuration** in `.cursor-review.yml`
3. **Verify secrets** are set correctly
4. **Contact the team** for assistance

---

**🤖 Happy coding with Cursor AI! The bot is here to help make your code better, more secure, and more maintainable.**
