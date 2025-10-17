#!/bin/bash

# 🔗 CollabCanvas Git Hooks Setup Script
# Sets up pre-push validation hooks for automatic testing

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
GIT_HOOKS_DIR="$PROJECT_ROOT/.git/hooks"
PRE_PUSH_SCRIPT="$SCRIPT_DIR/pre-push-validation.sh"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if we're in a git repository
check_git_repo() {
    if [ ! -d "$PROJECT_ROOT/.git" ]; then
        log_error "Not in a git repository. Please run this script from the project root."
        exit 1
    fi
    log_success "Git repository detected"
}

# Function to create pre-push hook
create_pre_push_hook() {
    log_info "Creating pre-push hook..."
    
    local hook_file="$GIT_HOOKS_DIR/pre-push"
    
    # Create the pre-push hook
    cat > "$hook_file" << 'EOF'
#!/bin/bash

# CollabCanvas Pre-Push Hook
# Automatically runs validation before every push

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the project root directory
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
SCRIPT_DIR="$PROJECT_ROOT/scripts"
VALIDATION_SCRIPT="$SCRIPT_DIR/pre-push-validation.sh"

echo -e "${BLUE}🚀 CollabCanvas Pre-Push Validation${NC}"
echo -e "${BLUE}====================================${NC}"

# Check if validation script exists
if [ ! -f "$VALIDATION_SCRIPT" ]; then
    echo -e "${RED}❌ Validation script not found: $VALIDATION_SCRIPT${NC}"
    echo -e "${YELLOW}⚠️  Skipping validation...${NC}"
    exit 0
fi

# Check if validation script is executable
if [ ! -x "$VALIDATION_SCRIPT" ]; then
    echo -e "${RED}❌ Validation script is not executable${NC}"
    echo -e "${YELLOW}⚠️  Skipping validation...${NC}"
    exit 0
fi

# Run validation
echo -e "${BLUE}🔍 Running pre-push validation...${NC}"
if bash "$VALIDATION_SCRIPT"; then
    echo -e "${GREEN}✅ Pre-push validation passed!${NC}"
    echo -e "${GREEN}🚀 Proceeding with push...${NC}"
    exit 0
else
    echo -e "${RED}❌ Pre-push validation failed!${NC}"
    echo -e "${RED}🚫 Push aborted. Please fix the issues and try again.${NC}"
    exit 1
fi
EOF

    # Make the hook executable
    chmod +x "$hook_file"
    
    log_success "Pre-push hook created: $hook_file"
}

# Function to create pre-commit hook
create_pre_commit_hook() {
    log_info "Creating pre-commit hook..."
    
    local hook_file="$GIT_HOOKS_DIR/pre-commit"
    
    # Create the pre-commit hook
    cat > "$hook_file" << 'EOF'
#!/bin/bash

# CollabCanvas Pre-Commit Hook
# Runs basic checks before every commit

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 CollabCanvas Pre-Commit Checks${NC}"
echo -e "${BLUE}=================================${NC}"

# Get the project root directory
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Check if we're in the frontend directory
if [ -d "$FRONTEND_DIR" ]; then
    cd "$FRONTEND_DIR"
    
    # Check for TypeScript compilation errors
    echo -e "${BLUE}🔍 Checking TypeScript compilation...${NC}"
    if npm run build --silent 2>/dev/null; then
        echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
    else
        echo -e "${RED}❌ TypeScript compilation failed${NC}"
        echo -e "${RED}🚫 Commit aborted. Please fix TypeScript errors.${NC}"
        exit 1
    fi
    
    # Check for linting errors
    echo -e "${BLUE}🔍 Running ESLint...${NC}"
    if npx eslint src --ext .ts,.tsx --max-warnings 0 2>/dev/null; then
        echo -e "${GREEN}✅ ESLint passed${NC}"
    else
        echo -e "${RED}❌ ESLint failed${NC}"
        echo -e "${RED}🚫 Commit aborted. Please fix linting errors.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Pre-commit checks passed!${NC}"
echo -e "${GREEN}🚀 Proceeding with commit...${NC}"
exit 0
EOF

    # Make the hook executable
    chmod +x "$hook_file"
    
    log_success "Pre-commit hook created: $hook_file"
}

# Function to create commit-msg hook
create_commit_msg_hook() {
    log_info "Creating commit-msg hook..."
    
    local hook_file="$GIT_HOOKS_DIR/commit-msg"
    
    # Create the commit-msg hook
    cat > "$hook_file" << 'EOF'
#!/bin/bash

# CollabCanvas Commit Message Hook
# Validates commit message format

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the commit message
COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

echo -e "${BLUE}📝 Validating commit message...${NC}"

# Check if commit message is empty
if [ -z "$COMMIT_MSG" ]; then
    echo -e "${RED}❌ Commit message cannot be empty${NC}"
    exit 1
fi

# Check commit message length
if [ ${#COMMIT_MSG} -lt 10 ]; then
    echo -e "${RED}❌ Commit message too short (minimum 10 characters)${NC}"
    exit 1
fi

# Check for conventional commit format (optional)
if [[ "$COMMIT_MSG" =~ ^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .+ ]]; then
    echo -e "${GREEN}✅ Conventional commit format detected${NC}"
elif [[ "$COMMIT_MSG" =~ ^(✅|🎉|🚀|🔧|📝|🧪|📊|🎯|🔍|⚠️|❌) ]]; then
    echo -e "${GREEN}✅ Emoji commit format detected${NC}"
else
    echo -e "${YELLOW}⚠️  Consider using conventional commit format or emoji prefix${NC}"
fi

echo -e "${GREEN}✅ Commit message validation passed!${NC}"
exit 0
EOF

    # Make the hook executable
    chmod +x "$hook_file"
    
    log_success "Commit-msg hook created: $hook_file"
}

# Function to create post-commit hook
create_post_commit_hook() {
    log_info "Creating post-commit hook..."
    
    local hook_file="$GIT_HOOKS_DIR/post-commit"
    
    # Create the post-commit hook
    cat > "$hook_file" << 'EOF'
#!/bin/bash

# CollabCanvas Post-Commit Hook
# Runs after successful commit

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🎉 Commit successful!${NC}"
echo -e "${BLUE}📊 Consider running tests to ensure everything is working correctly.${NC}"

# Optional: Run quick tests after commit
# Uncomment the following lines to enable automatic testing after commit
# PROJECT_ROOT="$(git rev-parse --show-toplevel)"
# FRONTEND_DIR="$PROJECT_ROOT/frontend"
# if [ -d "$FRONTEND_DIR" ]; then
#     cd "$FRONTEND_DIR"
#     echo -e "${BLUE}🧪 Running quick tests...${NC}"
#     npm test -- --watchAll=false --passWithNoTests
# fi

exit 0
EOF

    # Make the hook executable
    chmod +x "$hook_file"
    
    log_success "Post-commit hook created: $hook_file"
}

# Function to backup existing hooks
backup_existing_hooks() {
    log_info "Checking for existing hooks..."
    
    local hooks=("pre-push" "pre-commit" "commit-msg" "post-commit")
    local backup_dir="$GIT_HOOKS_DIR/backup-$(date +%Y%m%d-%H%M%S)"
    
    for hook in "${hooks[@]}"; do
        local hook_file="$GIT_HOOKS_DIR/$hook"
        if [ -f "$hook_file" ]; then
            log_warning "Existing $hook hook found"
            mkdir -p "$backup_dir"
            cp "$hook_file" "$backup_dir/$hook"
            log_info "Backed up existing $hook hook to $backup_dir"
        fi
    done
}

# Function to test hooks
test_hooks() {
    log_info "Testing git hooks..."
    
    # Test pre-commit hook
    if [ -f "$GIT_HOOKS_DIR/pre-commit" ]; then
        log_info "Testing pre-commit hook..."
        if bash "$GIT_HOOKS_DIR/pre-commit"; then
            log_success "Pre-commit hook test passed"
        else
            log_warning "Pre-commit hook test failed (this is expected if there are no changes)"
        fi
    fi
    
    # Test commit-msg hook
    if [ -f "$GIT_HOOKS_DIR/commit-msg" ]; then
        log_info "Testing commit-msg hook..."
        local test_msg="test: testing commit message validation"
        echo "$test_msg" | bash "$GIT_HOOKS_DIR/commit-msg" /dev/stdin
        if [ $? -eq 0 ]; then
            log_success "Commit-msg hook test passed"
        else
            log_error "Commit-msg hook test failed"
        fi
    fi
}

# Function to display usage information
display_usage() {
    log_info "Git hooks setup completed!"
    echo ""
    echo -e "${GREEN}📋 Installed Hooks:${NC}"
    echo -e "  ${BLUE}•${NC} pre-commit: Runs TypeScript compilation and ESLint checks"
    echo -e "  ${BLUE}•${NC} commit-msg: Validates commit message format"
    echo -e "  ${BLUE}•${NC} pre-push: Runs comprehensive validation before push"
    echo -e "  ${BLUE}•${NC} post-commit: Displays success message after commit"
    echo ""
    echo -e "${GREEN}🚀 Usage:${NC}"
    echo -e "  ${BLUE}•${NC} Hooks will run automatically during git operations"
    echo -e "  ${BLUE}•${NC} To bypass hooks temporarily: git commit --no-verify"
    echo -e "  ${BLUE}•${NC} To disable hooks: chmod -x .git/hooks/<hook-name>"
    echo ""
    echo -e "${GREEN}🔧 Manual Testing:${NC}"
    echo -e "  ${BLUE}•${NC} Test pre-push validation: ./scripts/pre-push-validation.sh"
    echo -e "  ${BLUE}•${NC} Test report generation: ./scripts/generate-test-report.sh"
    echo ""
}

# Main function
main() {
    log_info "🔗 Setting up CollabCanvas Git Hooks"
    log_info "Project Root: $PROJECT_ROOT"
    log_info "Git Hooks Directory: $GIT_HOOKS_DIR"
    
    # Check prerequisites
    check_git_repo
    
    # Backup existing hooks
    backup_existing_hooks
    
    # Create hooks
    create_pre_commit_hook
    create_commit_msg_hook
    create_pre_push_hook
    create_post_commit_hook
    
    # Test hooks
    test_hooks
    
    # Display usage information
    display_usage
    
    log_success "🎉 Git hooks setup completed successfully!"
}

# Run main function
main "$@"
