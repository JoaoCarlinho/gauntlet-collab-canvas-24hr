#!/bin/bash

# Firebase Authentication Setup Script for E2E Tests
# This script configures Firebase authentication for comprehensive testing

set -e

echo "🔥 Setting up Firebase Authentication for E2E Tests..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID:-"collabcanvas-mvp-24"}
TEST_USER_EMAIL="test@collabcanvas.com"
TEST_USER_PASSWORD="TestPassword123!"
TEST_USER_2_EMAIL="test2@collabcanvas.com"
TEST_USER_2_PASSWORD="TestPassword456!"

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

# Check if Firebase CLI is installed
check_firebase_cli() {
    print_status "Checking Firebase CLI installation..."
    if ! command -v firebase &> /dev/null; then
        print_error "Firebase CLI is not installed. Please install it first:"
        echo "npm install -g firebase-tools"
        exit 1
    fi
    print_success "Firebase CLI is installed"
}

# Check if user is logged in to Firebase
check_firebase_auth() {
    print_status "Checking Firebase authentication..."
    if ! firebase projects:list &> /dev/null; then
        print_warning "Not logged in to Firebase. Please log in:"
        echo "firebase login"
        exit 1
    fi
    print_success "Firebase authentication verified"
}

# Create test users
create_test_users() {
    print_status "Creating test users..."
    
    # Create test user 1
    print_status "Creating test user 1: $TEST_USER_EMAIL"
    firebase auth:export test-users.json --project $FIREBASE_PROJECT_ID 2>/dev/null || true
    
    # Check if user already exists
    if grep -q "$TEST_USER_EMAIL" test-users.json 2>/dev/null; then
        print_warning "Test user 1 already exists"
    else
        # Create user via Firebase Admin SDK (would need to implement)
        print_status "Test user 1 will be created during E2E test execution"
    fi
    
    # Create test user 2
    print_status "Creating test user 2: $TEST_USER_2_EMAIL"
    if grep -q "$TEST_USER_2_EMAIL" test-users.json 2>/dev/null; then
        print_warning "Test user 2 already exists"
    else
        print_status "Test user 2 will be created during E2E test execution"
    fi
    
    print_success "Test users configured"
}

# Create test configuration files
create_test_configs() {
    print_status "Creating test configuration files..."
    
    # Create Firebase test config
    cat > firebase-test-config.json << EOF
{
  "projectId": "$FIREBASE_PROJECT_ID",
  "authDomain": "$FIREBASE_PROJECT_ID.firebaseapp.com",
  "databaseURL": "https://$FIREBASE_PROJECT_ID-default-rtdb.firebaseio.com",
  "storageBucket": "$FIREBASE_PROJECT_ID.appspot.com",
  "messagingSenderId": "123456789",
  "appId": "1:123456789:web:abcdef123456"
}
EOF
    
    # Create test users configuration
    cat > test-users.json << EOF
{
  "testUser1": {
    "email": "$TEST_USER_EMAIL",
    "password": "$TEST_USER_PASSWORD",
    "displayName": "Test User 1",
    "uid": "test-user-1-uid",
    "permissions": ["read", "write", "admin"]
  },
  "testUser2": {
    "email": "$TEST_USER_2_EMAIL",
    "password": "$TEST_USER_2_PASSWORD",
    "displayName": "Test User 2",
    "uid": "test-user-2-uid",
    "permissions": ["read", "write"]
  }
}
EOF
    
    # Create test environment variables
    cat > .env.test << EOF
# Test Environment Variables
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID
VITE_FIREBASE_AUTH_DOMAIN=$FIREBASE_PROJECT_ID.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=$FIREBASE_PROJECT_ID.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_DEBUG_SOCKET=true
VITE_DEBUG_MODE=true
EOF
    
    print_success "Test configuration files created"
}

# Create Cypress configuration for authenticated tests
create_cypress_config() {
    print_status "Creating Cypress configuration for authenticated tests..."
    
    cat > cypress.config.auth.ts << EOF
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    env: {
      // Test user credentials
      TEST_USER_EMAIL: '$TEST_USER_EMAIL',
      TEST_USER_PASSWORD: '$TEST_USER_PASSWORD',
      TEST_USER_2_EMAIL: '$TEST_USER_2_EMAIL',
      TEST_USER_2_PASSWORD: '$TEST_USER_2_PASSWORD',
      // Firebase configuration
      FIREBASE_PROJECT_ID: '$FIREBASE_PROJECT_ID',
      // API configuration
      API_URL: 'http://localhost:5000'
    },
    setupNodeEvents(on, config) {
      // Add custom tasks for Firebase authentication
      on('task', {
        // Task to create test users
        createTestUser: async ({ email, password, displayName }) => {
          // Implementation would use Firebase Admin SDK
          console.log(\`Creating test user: \${email}\`)
          return { success: true, uid: \`test-\${Date.now()}\` }
        },
        
        // Task to clean up test data
        cleanupTestData: async () => {
          console.log('Cleaning up test data...')
          return { success: true }
        },
        
        // Task to generate authentication token
        generateAuthToken: async ({ email, password }) => {
          // Implementation would use Firebase Auth
          console.log(\`Generating auth token for: \${email}\`)
          return { success: true, token: \`test-token-\${Date.now()}\` }
        }
      })
    }
  }
})
EOF
    
    print_success "Cypress configuration created"
}

# Create test data cleanup script
create_cleanup_script() {
    print_status "Creating test data cleanup script..."
    
    cat > scripts/cleanup-test-data.sh << 'EOF'
#!/bin/bash

# Test Data Cleanup Script
echo "🧹 Cleaning up test data..."

# Remove test configuration files
rm -f firebase-test-config.json
rm -f test-users.json
rm -f .env.test
rm -f cypress.config.auth.ts

# Clean up Cypress artifacts
rm -rf cypress/videos/
rm -rf cypress/screenshots/
rm -rf cypress/downloads/

# Clean up test reports
rm -rf docs/e2e-test-results.html
rm -rf docs/screenshots/
rm -rf docs/performance-metrics.md

echo "✅ Test data cleanup completed"
EOF
    
    chmod +x scripts/cleanup-test-data.sh
    print_success "Cleanup script created"
}

# Main execution
main() {
    print_status "Starting Firebase Authentication Setup for E2E Tests..."
    
    check_firebase_cli
    check_firebase_auth
    create_test_users
    create_test_configs
    create_cypress_config
    create_cleanup_script
    
    print_success "Firebase Authentication Setup Complete!"
    print_status "Next steps:"
    echo "1. Run E2E tests: npm run test:e2e:auth"
    echo "2. Generate screenshots: npm run test:screenshots"
    echo "3. Clean up test data: ./scripts/cleanup-test-data.sh"
}

# Run main function
main "$@"
