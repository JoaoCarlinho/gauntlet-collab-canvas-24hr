/**
 * Authenticated Object Manipulation Tests
 * Tests object creation, movement, resizing, and deletion with proper Firebase authentication
 */

describe('Authenticated Object Manipulation', () => {
  let authToken: string
  let testCanvasId: string

  before(() => {
    // Setup test environment
    cy.task('createTestUser', {
      email: Cypress.env('TEST_USER_EMAIL'),
      password: Cypress.env('TEST_USER_PASSWORD'),
      displayName: 'Test User'
    })
  })

  beforeEach(() => {
    // Generate authentication token
    cy.task('generateAuthToken', {
      email: Cypress.env('TEST_USER_EMAIL'),
      password: Cypress.env('TEST_USER_PASSWORD')
    }).then((result: any) => {
      authToken = result.token
    })

    // Create a test canvas
    cy.request({
      method: 'POST',
      url: `${Cypress.env('API_URL')}/api/canvas`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        name: `Test Canvas ${Date.now()}`,
        description: 'E2E Test Canvas'
      }
    }).then((response) => {
      expect(response.status).to.eq(201)
      testCanvasId = response.body.id
    })

    // Visit the canvas with authentication
    cy.visit(`/canvas/${testCanvasId}`, {
      onBeforeLoad: (win) => {
        // Set authentication token in localStorage
        win.localStorage.setItem('idToken', authToken)
        win.localStorage.setItem('user', JSON.stringify({
          id: 'test-user-1-uid',
          email: Cypress.env('TEST_USER_EMAIL'),
          displayName: 'Test User'
        }))
      }
    })

    // Wait for canvas to load
    cy.get('[data-testid="canvas-container"]', { timeout: 10000 }).should('be.visible')
  })

  afterEach(() => {
    // Clean up test canvas
    if (testCanvasId) {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.env('API_URL')}/api/canvas/${testCanvasId}`,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
    }
  })

  describe('Object Creation', () => {
    it('should create a rectangle as authenticated user', () => {
      // Select rectangle tool
      cy.get('[data-testid="tool-rectangle"]').click()
      
      // Click on canvas to create rectangle
      cy.get('[data-testid="canvas-container"]').click(200, 200)
      
      // Verify rectangle was created
      cy.get('[data-testid="object-rectangle"]').should('exist')
      
      // Take screenshot
      cy.screenshot('authenticated-rectangle-creation')
    })

    it('should create a circle as authenticated user', () => {
      // Select circle tool
      cy.get('[data-testid="tool-circle"]').click()
      
      // Click on canvas to create circle
      cy.get('[data-testid="canvas-container"]').click(300, 300)
      
      // Verify circle was created
      cy.get('[data-testid="object-circle"]').should('exist')
      
      // Take screenshot
      cy.screenshot('authenticated-circle-creation')
    })

    it('should create text as authenticated user', () => {
      // Select text tool
      cy.get('[data-testid="tool-text"]').click()
      
      // Click on canvas to create text
      cy.get('[data-testid="canvas-container"]').click(400, 400)
      
      // Type text
      cy.get('[data-testid="text-input"]').type('Test Text')
      cy.get('[data-testid="text-input"]').type('{enter}')
      
      // Verify text was created
      cy.get('[data-testid="object-text"]').should('exist')
      
      // Take screenshot
      cy.screenshot('authenticated-text-creation')
    })
  })

  describe('Object Movement', () => {
    let rectangleId: string

    beforeEach(() => {
      // Create a rectangle for movement tests
      cy.get('[data-testid="tool-rectangle"]').click()
      cy.get('[data-testid="canvas-container"]').click(200, 200)
      
      // Get the rectangle ID
      cy.get('[data-testid="object-rectangle"]').then(($el) => {
        rectangleId = $el.attr('data-object-id') || ''
      })
    })

    it('should move rectangle with proper permissions', () => {
      // Select the rectangle
      cy.get(`[data-object-id="${rectangleId}"]`).click()
      
      // Drag the rectangle
      cy.get(`[data-object-id="${rectangleId}"]`)
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 300, clientY: 300 })
        .trigger('mouseup')
      
      // Verify rectangle moved
      cy.get(`[data-object-id="${rectangleId}"]`)
        .should('have.attr', 'data-x', '300')
        .should('have.attr', 'data-y', '300')
      
      // Take screenshot
      cy.screenshot('authenticated-rectangle-movement')
    })

    it('should handle movement with optimistic updates', () => {
      // Select the rectangle
      cy.get(`[data-object-id="${rectangleId}"]`).click()
      
      // Verify optimistic update indicator appears
      cy.get('[data-testid="optimistic-update-indicator"]').should('be.visible')
      
      // Drag the rectangle
      cy.get(`[data-object-id="${rectangleId}"]`)
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 400, clientY: 400 })
        .trigger('mouseup')
      
      // Wait for optimistic update to complete
      cy.get('[data-testid="optimistic-update-indicator"]', { timeout: 5000 }).should('not.exist')
      
      // Verify success animation
      cy.get('[data-testid="success-animation"]').should('be.visible')
      
      // Take screenshot
      cy.screenshot('authenticated-optimistic-movement')
    })
  })

  describe('Object Resizing', () => {
    let rectangleId: string

    beforeEach(() => {
      // Create a rectangle for resizing tests
      cy.get('[data-testid="tool-rectangle"]').click()
      cy.get('[data-testid="canvas-container"]').click(200, 200)
      
      // Get the rectangle ID
      cy.get('[data-testid="object-rectangle"]').then(($el) => {
        rectangleId = $el.attr('data-object-id') || ''
      })
    })

    it('should resize rectangle with proper permissions', () => {
      // Select the rectangle
      cy.get(`[data-object-id="${rectangleId}"]`).click()
      
      // Resize using resize handle
      cy.get('[data-testid="resize-handle-se"]')
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 300, clientY: 300 })
        .trigger('mouseup')
      
      // Verify rectangle was resized
      cy.get(`[data-object-id="${rectangleId}"]`)
        .should('have.attr', 'data-width', '300')
        .should('have.attr', 'data-height', '300')
      
      // Take screenshot
      cy.screenshot('authenticated-rectangle-resize')
    })

    it('should handle resize with batch updates', () => {
      // Select the rectangle
      cy.get(`[data-object-id="${rectangleId}"]`).click()
      
      // Perform multiple resize operations quickly
      for (let i = 0; i < 3; i++) {
        cy.get('[data-testid="resize-handle-se"]')
          .trigger('mousedown', { which: 1 })
          .trigger('mousemove', { clientX: 250 + i * 50, clientY: 250 + i * 50 })
          .trigger('mouseup')
      }
      
      // Verify batch processing indicator
      cy.get('[data-testid="batch-processing-indicator"]').should('be.visible')
      
      // Wait for batch to complete
      cy.get('[data-testid="batch-processing-indicator"]', { timeout: 10000 }).should('not.exist')
      
      // Take screenshot
      cy.screenshot('authenticated-batch-resize')
    })
  })

  describe('Object Deletion', () => {
    let rectangleId: string

    beforeEach(() => {
      // Create a rectangle for deletion tests
      cy.get('[data-testid="tool-rectangle"]').click()
      cy.get('[data-testid="canvas-container"]').click(200, 200)
      
      // Get the rectangle ID
      cy.get('[data-testid="object-rectangle"]').then(($el) => {
        rectangleId = $el.attr('data-object-id') || ''
      })
    })

    it('should delete rectangle with proper permissions', () => {
      // Select the rectangle
      cy.get(`[data-object-id="${rectangleId}"]`).click()
      
      // Delete the rectangle
      cy.get('[data-testid="delete-object-button"]').click()
      
      // Confirm deletion
      cy.get('[data-testid="confirm-delete-button"]').click()
      
      // Verify rectangle was deleted
      cy.get(`[data-object-id="${rectangleId}"]`).should('not.exist')
      
      // Take screenshot
      cy.screenshot('authenticated-rectangle-deletion')
    })
  })

  describe('Error Handling with Authentication', () => {
    it('should handle token expiration gracefully', () => {
      // Create a rectangle
      cy.get('[data-testid="tool-rectangle"]').click()
      cy.get('[data-testid="canvas-container"]').click(200, 200)
      
      // Simulate token expiration by clearing localStorage
      cy.window().then((win) => {
        win.localStorage.removeItem('idToken')
      })
      
      // Try to move the rectangle
      cy.get('[data-testid="object-rectangle"]').click()
      cy.get('[data-testid="object-rectangle"]')
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 300, clientY: 300 })
        .trigger('mouseup')
      
      // Verify error handling
      cy.get('[data-testid="error-message"]').should('be.visible')
      cy.get('[data-testid="error-message"]').should('contain', 'Authentication required')
      
      // Take screenshot
      cy.screenshot('authenticated-token-expiration')
    })

    it('should handle network failures with authentication', () => {
      // Create a rectangle
      cy.get('[data-testid="tool-rectangle"]').click()
      cy.get('[data-testid="canvas-container"]').click(200, 200)
      
      // Intercept and fail network requests
      cy.intercept('POST', '**/api/objects/**', { statusCode: 500 }).as('failedUpdate')
      
      // Try to move the rectangle
      cy.get('[data-testid="object-rectangle"]').click()
      cy.get('[data-testid="object-rectangle"]')
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 300, clientY: 300 })
        .trigger('mouseup')
      
      // Verify fallback mechanism
      cy.get('[data-testid="fallback-indicator"]').should('be.visible')
      cy.get('[data-testid="retry-button"]').should('be.visible')
      
      // Take screenshot
      cy.screenshot('authenticated-network-failure')
    })
  })

  describe('Performance Monitoring', () => {
    it('should track performance metrics for authenticated operations', () => {
      // Enable performance monitoring
      cy.window().then((win) => {
        win.performance.mark('test-start')
      })
      
      // Create multiple objects
      const tools = ['rectangle', 'circle', 'text']
      tools.forEach((tool, index) => {
        cy.get(`[data-testid="tool-${tool}"]`).click()
        cy.get('[data-testid="canvas-container"]').click(200 + index * 100, 200 + index * 100)
      })
      
      // Measure performance
      cy.window().then((win) => {
        win.performance.mark('test-end')
        win.performance.measure('test-duration', 'test-start', 'test-end')
        
        const measure = win.performance.getEntriesByName('test-duration')[0]
        expect(measure.duration).to.be.lessThan(5000) // Should complete within 5 seconds
      })
      
      // Take screenshot
      cy.screenshot('authenticated-performance-test')
    })
  })
})
