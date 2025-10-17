import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
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
      TEST_USER_EMAIL: 'test@collabcanvas.com',
      TEST_USER_PASSWORD: 'TestPassword123!',
      TEST_USER_2_EMAIL: 'test2@collabcanvas.com',
      TEST_USER_2_PASSWORD: 'TestPassword456!',
      // Firebase configuration
      FIREBASE_PROJECT_ID: 'collabcanvas-mvp-24',
      // API configuration
      API_URL: 'http://localhost:5000'
    },
    setupNodeEvents(on, config) {
      // Add custom tasks for Firebase authentication
      on('task', {
        // Task to create test users
        createTestUser: async ({ email, password, displayName }) => {
          // Implementation would use Firebase Admin SDK
          console.log(`Creating test user: ${email}`)
          return { success: true, uid: `test-${Date.now()}` }
        },
        
        // Task to clean up test data
        cleanupTestData: async () => {
          console.log('Cleaning up test data...')
          return { success: true }
        },
        
        // Task to generate authentication token
        generateAuthToken: async ({ email, password }) => {
          // Implementation would use Firebase Auth
          console.log(`Generating auth token for: ${email}`)
          return { success: true, token: `test-token-${Date.now()}` }
        }
      })
    }
  }
})
