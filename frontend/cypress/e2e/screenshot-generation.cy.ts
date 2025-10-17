/**
 * Screenshot Generation Tests
 * Generates comprehensive screenshots for documentation and user guides
 */

describe('Screenshot Generation', () => {
  let authToken: string
  let testCanvasId: string

  before(() => {
    // Setup test user
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
        name: `Screenshot Test Canvas ${Date.now()}`,
        description: 'Screenshot generation test canvas'
      }
    }).then((response) => {
      expect(response.status).to.eq(201)
      testCanvasId = response.body.id
    })

    // Visit the canvas with authentication
    cy.visit(`/canvas/${testCanvasId}`, {
      onBeforeLoad: (win) => {
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

  describe('User Interface Components', () => {
    it('should capture toolbar and controls', () => {
      // Take screenshot of empty canvas with toolbar
      cy.screenshot('ui-toolbar-and-controls', {
        capture: 'fullPage'
      })
    })

    it('should capture object creation tools', () => {
      // Show all available tools
      cy.get('[data-testid="toolbar"]').should('be.visible')
      
      // Take screenshot of all tools
      cy.screenshot('ui-object-creation-tools', {
        capture: 'fullPage'
      })
    })

    it('should capture collaboration features', () => {
      // Show collaboration sidebar
      cy.get('[data-testid="collaboration-sidebar-toggle"]').click()
      cy.get('[data-testid="collaboration-sidebar"]').should('be.visible')
      
      // Take screenshot of collaboration features
      cy.screenshot('ui-collaboration-features', {
        capture: 'fullPage'
      })
    })

    it('should capture status indicators', () => {
      // Show all status indicators
      cy.get('[data-testid="connection-status-indicator"]').should('be.visible')
      cy.get('[data-testid="sync-status-indicator"]').should('be.visible')
      cy.get('[data-testid="queue-status-indicator"]').should('be.visible')
      
      // Take screenshot of status indicators
      cy.screenshot('ui-status-indicators', {
        capture: 'fullPage'
      })
    })
  })

  describe('Object Types and Interactions', () => {
    it('should capture all object types', () => {
      // Create all object types
      const objects = [
        { tool: 'rectangle', name: 'Rectangle', x: 100, y: 100 },
        { tool: 'circle', name: 'Circle', x: 250, y: 100 },
        { tool: 'text', name: 'Text', x: 400, y: 100 },
        { tool: 'heart', name: 'Heart', x: 100, y: 250 },
        { tool: 'star', name: 'Star', x: 250, y: 250 },
        { tool: 'diamond', name: 'Diamond', x: 400, y: 250 },
        { tool: 'line', name: 'Line', x: 100, y: 400 },
        { tool: 'arrow', name: 'Arrow', x: 250, y: 400 }
      ]

      objects.forEach((obj, index) => {
        cy.get(`[data-testid="tool-${obj.tool}"]`).click()
        cy.get('[data-testid="canvas-container"]').click(obj.x, obj.y)
        
        // Add text for text object
        if (obj.tool === 'text') {
          cy.get('[data-testid="text-input"]').type(obj.name)
          cy.get('[data-testid="text-input"]').type('{enter}')
        }
      })

      // Take screenshot of all object types
      cy.screenshot('objects-all-types', {
        capture: 'fullPage'
      })
    })

    it('should capture object selection and editing', () => {
      // Create a rectangle
      cy.get('[data-testid="tool-rectangle"]').click()
      cy.get('[data-testid="canvas-container"]').click(200, 200)
      
      // Select the rectangle
      cy.get('[data-testid="object-rectangle"]').click()
      
      // Show selection handles
      cy.get('[data-testid="selection-indicator"]').should('be.visible')
      cy.get('[data-testid="resize-handles"]').should('be.visible')
      
      // Take screenshot of object selection
      cy.screenshot('objects-selection-and-editing', {
        capture: 'fullPage'
      })
    })

    it('should capture object resizing', () => {
      // Create and select a rectangle
      cy.get('[data-testid="tool-rectangle"]').click()
      cy.get('[data-testid="canvas-container"]').click(200, 200)
      cy.get('[data-testid="object-rectangle"]').click()
      
      // Resize the rectangle
      cy.get('[data-testid="resize-handle-se"]')
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 300, clientY: 300 })
        .trigger('mouseup')
      
      // Take screenshot of resized object
      cy.screenshot('objects-resizing', {
        capture: 'fullPage'
      })
    })

    it('should capture object movement', () => {
      // Create and select a rectangle
      cy.get('[data-testid="tool-rectangle"]').click()
      cy.get('[data-testid="canvas-container"]').click(200, 200)
      cy.get('[data-testid="object-rectangle"]').click()
      
      // Move the rectangle
      cy.get('[data-testid="object-rectangle"]')
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 300, clientY: 300 })
        .trigger('mouseup')
      
      // Take screenshot of moved object
      cy.screenshot('objects-movement', {
        capture: 'fullPage'
      })
    })
  })

  describe('Error States and Recovery', () => {
    it('should capture connection error states', () => {
      // Simulate connection error
      cy.intercept('GET', '**/api/**', { statusCode: 500 }).as('connectionError')
      
      // Trigger an action that requires connection
      cy.get('[data-testid="tool-rectangle"]').click()
      cy.get('[data-testid="canvas-container"]').click(200, 200)
      
      // Wait for error to appear
      cy.get('[data-testid="error-message"]', { timeout: 10000 }).should('be.visible')
      
      // Take screenshot of error state
      cy.screenshot('error-connection-failure', {
        capture: 'fullPage'
      })
    })

    it('should capture offline mode', () => {
      // Simulate offline mode
      cy.window().then((win) => {
        Object.defineProperty(win.navigator, 'onLine', {
          writable: true,
          value: false
        })
        win.dispatchEvent(new Event('offline'))
      })
      
      // Wait for offline indicator
      cy.get('[data-testid="offline-indicator"]', { timeout: 5000 }).should('be.visible')
      
      // Take screenshot of offline mode
      cy.screenshot('error-offline-mode', {
        capture: 'fullPage'
      })
    })

    it('should capture conflict resolution dialog', () => {
      // Create an object
      cy.get('[data-testid="tool-rectangle"]').click()
      cy.get('[data-testid="canvas-container"]').click(200, 200)
      
      // Simulate conflict by updating the same object
      cy.get('[data-testid="object-rectangle"]').click()
      cy.get('[data-testid="object-rectangle"]')
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 250, clientY: 250 })
        .trigger('mouseup')
      
      // Simulate server conflict
      cy.intercept('PUT', '**/api/objects/**', { 
        statusCode: 409,
        body: { error: 'Conflict detected' }
      }).as('conflictError')
      
      // Trigger conflict
      cy.get('[data-testid="object-rectangle"]')
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 300, clientY: 300 })
        .trigger('mouseup')
      
      // Wait for conflict dialog
      cy.get('[data-testid="conflict-resolution-dialog"]', { timeout: 10000 }).should('be.visible')
      
      // Take screenshot of conflict resolution
      cy.screenshot('error-conflict-resolution', {
        capture: 'fullPage'
      })
    })
  })

  describe('Performance and Optimization Features', () => {
    it('should capture debouncing indicators', () => {
      // Create an object
      cy.get('[data-testid="tool-rectangle"]').click()
      cy.get('[data-testid="canvas-container"]').click(200, 200)
      
      // Perform rapid movements to trigger debouncing
      cy.get('[data-testid="object-rectangle"]').click()
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="object-rectangle"]')
          .trigger('mousedown', { which: 1 })
          .trigger('mousemove', { clientX: 200 + i * 10, clientY: 200 + i * 10 })
          .trigger('mouseup')
      }
      
      // Take screenshot of debouncing in action
      cy.screenshot('performance-debouncing', {
        capture: 'fullPage'
      })
    })

    it('should capture batch processing indicators', () => {
      // Create multiple objects quickly
      const tools = ['rectangle', 'circle', 'text']
      tools.forEach((tool, index) => {
        cy.get(`[data-testid="tool-${tool}"]`).click()
        cy.get('[data-testid="canvas-container"]').click(200 + index * 100, 200 + index * 100)
      })
      
      // Take screenshot of batch processing
      cy.screenshot('performance-batch-processing', {
        capture: 'fullPage'
      })
    })

    it('should capture optimization statistics', () => {
      // Open debug panel
      cy.get('[data-testid="debug-panel-toggle"]').click()
      cy.get('[data-testid="debug-panel"]').should('be.visible')
      
      // Take screenshot of optimization statistics
      cy.screenshot('performance-optimization-stats', {
        capture: 'fullPage'
      })
    })
  })

  describe('User Experience Flows', () => {
    it('should capture complete user workflow', () => {
      // Step 1: Create objects
      cy.get('[data-testid="tool-rectangle"]').click()
      cy.get('[data-testid="canvas-container"]').click(100, 100)
      
      cy.get('[data-testid="tool-circle"]').click()
      cy.get('[data-testid="canvas-container"]').click(250, 100)
      
      cy.get('[data-testid="tool-text"]').click()
      cy.get('[data-testid="canvas-container"]').click(400, 100)
      cy.get('[data-testid="text-input"]').type('Hello World')
      cy.get('[data-testid="text-input"]').type('{enter}')
      
      // Step 2: Arrange objects
      cy.get('[data-testid="object-rectangle"]').click()
      cy.get('[data-testid="object-rectangle"]')
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 100, clientY: 200 })
        .trigger('mouseup')
      
      cy.get('[data-testid="object-circle"]').click()
      cy.get('[data-testid="object-circle"]')
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 250, clientY: 200 })
        .trigger('mouseup')
      
      // Step 3: Resize objects
      cy.get('[data-testid="object-rectangle"]').click()
      cy.get('[data-testid="resize-handle-se"]')
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 150, clientY: 250 })
        .trigger('mouseup')
      
      // Take screenshot of complete workflow
      cy.screenshot('user-experience-complete-workflow', {
        capture: 'fullPage'
      })
    })

    it('should capture collaboration workflow', () => {
      // Show collaboration features
      cy.get('[data-testid="collaboration-sidebar-toggle"]').click()
      cy.get('[data-testid="collaboration-sidebar"]').should('be.visible')
      
      // Show user presence
      cy.get('[data-testid="user-presence-indicator"]').should('be.visible')
      
      // Show cursor tracking
      cy.get('[data-testid="canvas-container"]').trigger('mousemove', { clientX: 200, clientY: 200 })
      cy.get('[data-testid="cursor-indicator"]').should('be.visible')
      
      // Take screenshot of collaboration workflow
      cy.screenshot('user-experience-collaboration', {
        capture: 'fullPage'
      })
    })
  })

  describe('Documentation Screenshots', () => {
    it('should generate user guide screenshots', () => {
      // Create a comprehensive canvas for user guide
      const guideObjects = [
        { tool: 'rectangle', x: 50, y: 50, label: 'Rectangle Tool' },
        { tool: 'circle', x: 200, y: 50, label: 'Circle Tool' },
        { tool: 'text', x: 350, y: 50, label: 'Text Tool' },
        { tool: 'heart', x: 50, y: 200, label: 'Heart Tool' },
        { tool: 'star', x: 200, y: 200, label: 'Star Tool' },
        { tool: 'diamond', x: 350, y: 200, label: 'Diamond Tool' },
        { tool: 'line', x: 50, y: 350, label: 'Line Tool' },
        { tool: 'arrow', x: 200, y: 350, label: 'Arrow Tool' }
      ]

      guideObjects.forEach((obj) => {
        cy.get(`[data-testid="tool-${obj.tool}"]`).click()
        cy.get('[data-testid="canvas-container"]').click(obj.x, obj.y)
        
        if (obj.tool === 'text') {
          cy.get('[data-testid="text-input"]').type(obj.label)
          cy.get('[data-testid="text-input"]').type('{enter}')
        }
      })

      // Take comprehensive user guide screenshot
      cy.screenshot('user-guide-complete-tools', {
        capture: 'fullPage'
      })
    })

    it('should generate feature showcase screenshots', () => {
      // Create a feature-rich canvas
      cy.get('[data-testid="tool-rectangle"]').click()
      cy.get('[data-testid="canvas-container"]').click(100, 100)
      
      cy.get('[data-testid="tool-circle"]').click()
      cy.get('[data-testid="canvas-container"]').click(250, 100)
      
      cy.get('[data-testid="tool-text"]').click()
      cy.get('[data-testid="canvas-container"]').click(400, 100)
      cy.get('[data-testid="text-input"]').type('CollabCanvas')
      cy.get('[data-testid="text-input"]').type('{enter}')
      
      // Show all features
      cy.get('[data-testid="collaboration-sidebar-toggle"]').click()
      cy.get('[data-testid="debug-panel-toggle"]').click()
      
      // Take feature showcase screenshot
      cy.screenshot('feature-showcase-complete', {
        capture: 'fullPage'
      })
    })
  })
})
