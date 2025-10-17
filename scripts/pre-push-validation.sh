#!/bin/bash

# 🚀 CollabCanvas Pre-Push Validation Script
# Comprehensive validation pipeline before every push

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
REPORTS_DIR="$PROJECT_ROOT/reports"
LOGS_DIR="$PROJECT_ROOT/logs"

# Create directories if they don't exist
mkdir -p "$REPORTS_DIR" "$LOGS_DIR"

# Logging
LOG_FILE="$LOGS_DIR/pre-push-validation-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE")
exec 2>&1

# Validation results
VALIDATION_RESULTS=()
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
START_TIME=$(date +%s)

# Helper functions
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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# Validation functions
validate_prerequisites() {
    log_step "🔍 Validating Prerequisites"
    
    local missing_deps=()
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("Node.js")
    else
        local node_version=$(node --version)
        log_success "Node.js: $node_version"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    else
        local npm_version=$(npm --version)
        log_success "npm: $npm_version"
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        missing_deps+=("Python 3")
    else
        local python_version=$(python3 --version)
        log_success "Python: $python_version"
    fi
    
    # Check pip
    if ! command -v pip3 &> /dev/null; then
        missing_deps+=("pip3")
    else
        local pip_version=$(pip3 --version | cut -d' ' -f2)
        log_success "pip: $pip_version"
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        missing_deps+=("Git")
    else
        local git_version=$(git --version | cut -d' ' -f3)
        log_success "Git: $git_version"
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        return 1
    fi
    
    log_success "All prerequisites validated"
    return 0
}

validate_frontend_dependencies() {
    log_step "📦 Validating Frontend Dependencies"
    
    cd "$FRONTEND_DIR"
    
    if [ ! -f "package.json" ]; then
        log_error "package.json not found in frontend directory"
        return 1
    fi
    
    if [ ! -d "node_modules" ]; then
        log_warning "node_modules not found, installing dependencies..."
        npm install
    fi
    
    log_success "Frontend dependencies validated"
    return 0
}

validate_backend_dependencies() {
    log_step "🐍 Validating Backend Dependencies"
    
    cd "$BACKEND_DIR"
    
    if [ ! -f "requirements.txt" ]; then
        log_error "requirements.txt not found in backend directory"
        return 1
    fi
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        log_warning "Virtual environment not found, creating one..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment and install dependencies
    source venv/bin/activate
    pip install -r requirements.txt
    
    log_success "Backend dependencies validated"
    return 0
}

run_frontend_linting() {
    log_step "🔍 Running Frontend Linting"
    
    cd "$FRONTEND_DIR"
    
    # TypeScript compilation check
    log_info "Checking TypeScript compilation..."
    if npm run build --silent; then
        log_success "TypeScript compilation successful"
        ((PASSED_TESTS++))
    else
        log_error "TypeScript compilation failed"
        ((FAILED_TESTS++))
        return 1
    fi
    
    # ESLint check
    log_info "Running ESLint..."
    if npx eslint src --ext .ts,.tsx --max-warnings 0; then
        log_success "ESLint passed"
        ((PASSED_TESTS++))
    else
        log_error "ESLint failed"
        ((FAILED_TESTS++))
        return 1
    fi
    
    ((TOTAL_TESTS += 2))
    return 0
}

run_backend_tests() {
    log_step "🧪 Running Backend Tests"
    
    cd "$BACKEND_DIR"
    source venv/bin/activate
    
    # Run Python tests
    log_info "Running Python tests..."
    if python -m pytest tests/ -v --tb=short; then
        log_success "Backend tests passed"
        ((PASSED_TESTS++))
    else
        log_error "Backend tests failed"
        ((FAILED_TESTS++))
        return 1
    fi
    
    ((TOTAL_TESTS++))
    return 0
}

run_integration_tests() {
    log_step "🔗 Running Integration Tests"
    
    # Start backend server in background
    cd "$BACKEND_DIR"
    source venv/bin/activate
    log_info "Starting backend server..."
    python run.py &
    BACKEND_PID=$!
    
    # Wait for backend to start
    sleep 5
    
    # Start frontend server in background
    cd "$FRONTEND_DIR"
    log_info "Starting frontend server..."
    npm run dev &
    FRONTEND_PID=$!
    
    # Wait for frontend to start
    sleep 10
    
    # Test server connectivity
    log_info "Testing server connectivity..."
    if curl -f http://localhost:5000/health &> /dev/null; then
        log_success "Backend server is running"
        ((PASSED_TESTS++))
    else
        log_error "Backend server is not responding"
        ((FAILED_TESTS++))
    fi
    
    if curl -f http://localhost:3000 &> /dev/null; then
        log_success "Frontend server is running"
        ((PASSED_TESTS++))
    else
        log_error "Frontend server is not responding"
        ((FAILED_TESTS++))
    fi
    
    # Cleanup
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    sleep 2
    
    ((TOTAL_TESTS += 2))
    return 0
}

run_e2e_tests() {
    log_step "🎭 Running E2E Tests"
    
    cd "$FRONTEND_DIR"
    
    # Run authenticated object tests
    log_info "Running authenticated object tests..."
    if npx cypress run --spec 'cypress/e2e/authenticated-object-tests.cy.ts' --config-file cypress.config.auth.ts --headless; then
        log_success "Authenticated object tests passed"
        ((PASSED_TESTS++))
    else
        log_error "Authenticated object tests failed"
        ((FAILED_TESTS++))
    fi
    
    # Run multi-user collaboration tests
    log_info "Running multi-user collaboration tests..."
    if npx cypress run --spec 'cypress/e2e/multi-user-collaboration.cy.ts' --config-file cypress.config.auth.ts --headless; then
        log_success "Multi-user collaboration tests passed"
        ((PASSED_TESTS++))
    else
        log_error "Multi-user collaboration tests failed"
        ((FAILED_TESTS++))
    fi
    
    # Run authentication error scenarios
    log_info "Running authentication error scenarios..."
    if npx cypress run --spec 'cypress/e2e/auth-error-scenarios.cy.ts' --config-file cypress.config.auth.ts --headless; then
        log_success "Authentication error scenarios passed"
        ((PASSED_TESTS++))
    else
        log_error "Authentication error scenarios failed"
        ((FAILED_TESTS++))
    fi
    
    ((TOTAL_TESTS += 3))
    return 0
}

generate_screenshots() {
    log_step "📸 Generating Screenshots"
    
    cd "$FRONTEND_DIR"
    
    # Run screenshot generation tests
    log_info "Generating comprehensive screenshots..."
    if npx cypress run --spec 'cypress/e2e/dev-screenshot-generation.cy.ts' --config-file cypress.config.auth.ts --headless; then
        log_success "Screenshot generation completed"
        ((PASSED_TESTS++))
    else
        log_error "Screenshot generation failed"
        ((FAILED_TESTS++))
        return 1
    fi
    
    ((TOTAL_TESTS++))
    return 0
}

generate_test_report() {
    log_step "📊 Generating Test Report"
    
    # Call the test report generation script
    if [ -f "$SCRIPT_DIR/generate-test-report.sh" ]; then
        log_info "Generating comprehensive test report..."
        if bash "$SCRIPT_DIR/generate-test-report.sh"; then
            log_success "Test report generated successfully"
            ((PASSED_TESTS++))
        else
            log_error "Test report generation failed"
            ((FAILED_TESTS++))
            return 1
        fi
    else
        log_warning "Test report generation script not found, skipping..."
    fi
    
    ((TOTAL_TESTS++))
    return 0
}

cleanup() {
    log_step "🧹 Cleaning Up"
    
    # Kill any remaining processes
    pkill -f "python run.py" 2>/dev/null || true
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "cypress" 2>/dev/null || true
    
    # Clean up temporary files
    rm -f "$FRONTEND_DIR/cypress/screenshots/temp-*" 2>/dev/null || true
    
    log_success "Cleanup completed"
}

# Main validation function
main() {
    log_info "🚀 Starting CollabCanvas Pre-Push Validation"
    log_info "Timestamp: $(date)"
    log_info "Project Root: $PROJECT_ROOT"
    log_info "Log File: $LOG_FILE"
    
    # Validation steps
    local validation_steps=(
        "validate_prerequisites"
        "validate_frontend_dependencies"
        "validate_backend_dependencies"
        "run_frontend_linting"
        "run_backend_tests"
        "run_integration_tests"
        "run_e2e_tests"
        "generate_screenshots"
        "generate_test_report"
    )
    
    local failed_steps=()
    
    for step in "${validation_steps[@]}"; do
        if ! $step; then
            failed_steps+=("$step")
            log_error "Validation step failed: $step"
        fi
    done
    
    # Calculate results
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    
    # Generate summary
    log_step "📋 Validation Summary"
    log_info "Total Tests: $TOTAL_TESTS"
    log_info "Passed: $PASSED_TESTS"
    log_info "Failed: $FAILED_TESTS"
    log_info "Duration: ${duration}s"
    
    if [ ${#failed_steps[@]} -eq 0 ]; then
        log_success "🎉 All validations passed! Ready to push."
        cleanup
        exit 0
    else
        log_error "❌ Validation failed. Failed steps: ${failed_steps[*]}"
        log_error "Please fix the issues before pushing."
        cleanup
        exit 1
    fi
}

# Handle script interruption
trap cleanup EXIT

# Run main function
main "$@"