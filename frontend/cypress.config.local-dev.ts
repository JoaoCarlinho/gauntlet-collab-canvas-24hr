import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3002',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    // Environment variables for local testing
    env: {
      API_URL: 'http://localhost:5000',
      MOCK_AUTH: true,
      MOCK_WEBSOCKET: false
    },
    setupNodeEvents(on, config) {
      // Add custom tasks here if needed
      on('task', {
        log(message) {
          console.log(message)
          return null
        },
      })
    },
  },
})
