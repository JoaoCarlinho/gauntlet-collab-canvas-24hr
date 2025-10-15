import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'https://gauntlet-collab-canvas-24hr.vercel.app',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots/production',
    defaultScreenshotOptions: {
      capture: 'fullPage',
      clip: null,
      disableTimersAndAnimations: false
    },
    defaultCommandTimeout: 15000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    pageLoadTimeout: 30000,
    // Environment variables for production testing
    env: {
      API_URL: 'https://gauntlet-collab-canvas-24hr-production.up.railway.app',
      MOCK_AUTH: false,
      MOCK_WEBSOCKET: false,
      PRODUCTION_TESTING: true
    },
    setupNodeEvents(on, config) {
      // Add custom tasks for production testing
      on('task', {
        log(message) {
          console.log(`[Production Test] ${message}`)
          return null
        },
        // Task to handle production-specific operations
        productionAuth() {
          console.log('Production authentication required')
          return null
        }
      })
    }
  }
})
