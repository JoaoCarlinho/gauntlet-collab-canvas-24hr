/**
 * Canvas Object Action Videos
 * Creates videos showing canvas object creation, manipulation, and interaction
 */

describe('Canvas Object Action Videos', () => {
  beforeEach(() => {
    // Visit the home page first (which will show the canvas list)
    cy.visit('/', {
      onBeforeLoad: (win) => {
        // Set development mode flag
        win.localStorage.setItem('dev-mode', 'true')
        // Set mock authentication state
        win.localStorage.setItem('idToken', 'dev-token')
      }
    })

    // Wait for the home page to load
    cy.get('[data-testid="create-canvas-button"]', { timeout: 10000 }).should('be.visible')
  })

  describe('Object Creation Videos', () => {
    it('should create video of rectangle creation', () => {
      // Navigate to canvas page
      cy.visit('/dev/canvas/test-canvas', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('dev-mode', 'true')
          win.localStorage.setItem('idToken', 'dev-token')
        }
      })
      
      // Wait for canvas to load
      cy.wait(3000)
      
      // Wait for Konva canvas to be ready
      cy.get('.konvajs-content').should('be.visible')
      
      // Select rectangle tool
      cy.get('[data-testid="tool-rectangle"]').click()
      
      // Create rectangle with video recording
      cy.get('.konvajs-content').click(200, 200, { force: true })
      
      // Wait for object to be created
      cy.wait(1000)
      
      // Take screenshot
      cy.screenshot('video-rectangle-creation', {
        capture: 'fullPage'
      })
    })

    it('should create video of circle creation', () => {
      // Navigate to canvas page
      cy.visit('/dev/canvas/test-canvas', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('dev-mode', 'true')
          win.localStorage.setItem('idToken', 'dev-token')
        }
      })
      
      // Wait for canvas to load
      cy.wait(3000)
      
      // Wait for Konva canvas to be ready
      cy.get('.konvajs-content').should('be.visible')
      
      // Select circle tool
      cy.get('[data-testid="tool-circle"]').click()
      
      // Create circle with video recording
      cy.get('.konvajs-content').click(300, 200, { force: true })
      
      // Wait for object to be created
      cy.wait(1000)
      
      // Take screenshot
      cy.screenshot('video-circle-creation', {
        capture: 'fullPage'
      })
    })

    it('should create video of text creation', () => {
      // Navigate to canvas page
      cy.visit('/dev/canvas/test-canvas', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('dev-mode', 'true')
          win.localStorage.setItem('idToken', 'dev-token')
        }
      })
      
      // Wait for canvas to load
      cy.wait(3000)
      
      // Wait for Konva canvas to be ready
      cy.get('.konvajs-content').should('be.visible')
      
      // Select text tool
      cy.get('[data-testid="tool-text"]').click()
      
      // Create text with video recording
      cy.get('.konvajs-content').click(400, 200, { force: true })
      
      // Type text
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="text-input"]').length > 0) {
          cy.get('[data-testid="text-input"]').type('Hello World')
          cy.get('[data-testid="text-input"]').type('{enter}')
        }
      })
      
      // Wait for object to be created
      cy.wait(1000)
      
      // Take screenshot
      cy.screenshot('video-text-creation', {
        capture: 'fullPage'
      })
    })

    it('should create video of multiple object creation', () => {
      // Navigate to canvas page
      cy.visit('/dev/canvas/test-canvas', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('dev-mode', 'true')
          win.localStorage.setItem('idToken', 'dev-token')
        }
      })
      
      // Wait for canvas to load
      cy.wait(3000)
      
      // Wait for Konva canvas to be ready
      cy.get('.konvajs-content').should('be.visible')
      
      // Create multiple objects
      const objects = [
        { tool: 'rectangle', x: 100, y: 100 },
        { tool: 'circle', x: 250, y: 100 },
        { tool: 'text', x: 400, y: 100 },
        { tool: 'heart', x: 100, y: 250 },
        { tool: 'star', x: 250, y: 250 }
      ]

      objects.forEach((obj, index) => {
        cy.get('body').then(($body) => {
          if ($body.find(`[data-testid="tool-${obj.tool}"]`).length > 0) {
            cy.get(`[data-testid="tool-${obj.tool}"]`).click()
            cy.get('.konvajs-content').click(obj.x, obj.y, { force: true })
            
            // Add text for text object
            if (obj.tool === 'text') {
              cy.get('body').then(($body) => {
                if ($body.find('[data-testid="text-input"]').length > 0) {
                  cy.get('[data-testid="text-input"]').type('Sample Text')
                  cy.get('[data-testid="text-input"]').type('{enter}')
                }
              })
            }
            
            // Wait for object to be created
            cy.wait(500)
          }
        })
      })
      
      // Take screenshot of all objects
      cy.screenshot('video-multiple-objects-creation', {
        capture: 'fullPage'
      })
    })
  })

  describe('Object Interaction Videos', () => {
    it('should create video of object selection', () => {
      // Navigate to canvas page
      cy.visit('/dev/canvas/test-canvas', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('dev-mode', 'true')
          win.localStorage.setItem('idToken', 'dev-token')
        }
      })
      
      // Wait for canvas to load
      cy.wait(3000)
      
      // Wait for Konva canvas to be ready
      cy.get('.konvajs-content').should('be.visible')
      
      // Create a rectangle first
      cy.get('[data-testid="tool-rectangle"]').click()
      cy.get('.konvajs-content').click(200, 200, { force: true })
      cy.wait(1000)
      
      // Select the rectangle
      cy.get('[data-testid="tool-select"]').click()
      cy.get('.konvajs-content').click(200, 200, { force: true })
      cy.wait(1000)
      
      // Take screenshot of selected object
      cy.screenshot('video-object-selection', {
        capture: 'fullPage'
      })
    })

    it('should create video of object movement', () => {
      // Navigate to canvas page
      cy.visit('/dev/canvas/test-canvas', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('dev-mode', 'true')
          win.localStorage.setItem('idToken', 'dev-token')
        }
      })
      
      // Wait for canvas to load
      cy.wait(3000)
      
      // Wait for Konva canvas to be ready
      cy.get('.konvajs-content').should('be.visible')
      
      // Create a rectangle first
      cy.get('[data-testid="tool-rectangle"]').click()
      cy.get('.konvajs-content').click(200, 200, { force: true })
      cy.wait(1000)
      
      // Select and move the rectangle
      cy.get('[data-testid="tool-select"]').click()
      cy.get('.konvajs-content').click(200, 200, { force: true })
      cy.wait(500)
      
      // Drag the object
      cy.get('.konvajs-content')
        .trigger('mousedown', { clientX: 200, clientY: 200 })
        .trigger('mousemove', { clientX: 300, clientY: 300 })
        .trigger('mouseup')
      
      cy.wait(1000)
      
      // Take screenshot of moved object
      cy.screenshot('video-object-movement', {
        capture: 'fullPage'
      })
    })

    it('should create video of object resizing', () => {
      // Navigate to canvas page
      cy.visit('/dev/canvas/test-canvas', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('dev-mode', 'true')
          win.localStorage.setItem('idToken', 'dev-token')
        }
      })
      
      // Wait for canvas to load
      cy.wait(3000)
      
      // Wait for Konva canvas to be ready
      cy.get('.konvajs-content').should('be.visible')
      
      // Create a rectangle first
      cy.get('[data-testid="tool-rectangle"]').click()
      cy.get('.konvajs-content').click(200, 200, { force: true })
      cy.wait(1000)
      
      // Select the rectangle
      cy.get('[data-testid="tool-select"]').click()
      cy.get('.konvajs-content').click(200, 200, { force: true })
      cy.wait(500)
      
      // Try to resize using resize handles
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="resize-handle-se"]').length > 0) {
          cy.get('[data-testid="resize-handle-se"]')
            .trigger('mousedown', { which: 1 })
            .trigger('mousemove', { clientX: 300, clientY: 300 })
            .trigger('mouseup')
        }
      })
      
      cy.wait(1000)
      
      // Take screenshot of resized object
      cy.screenshot('video-object-resizing', {
        capture: 'fullPage'
      })
    })
  })

  describe('Tool Interaction Videos', () => {
    it('should create video of tool switching', () => {
      // Navigate to canvas page
      cy.visit('/dev/canvas/test-canvas', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('dev-mode', 'true')
          win.localStorage.setItem('idToken', 'dev-token')
        }
      })
      
      // Wait for canvas to load
      cy.wait(3000)
      
      // Wait for Konva canvas to be ready
      cy.get('.konvajs-content').should('be.visible')
      
      // Switch between different tools
      const tools = ['rectangle', 'circle', 'text', 'heart', 'star', 'select']
      
      tools.forEach((tool, index) => {
        cy.get('body').then(($body) => {
          if ($body.find(`[data-testid="tool-${tool}"]`).length > 0) {
            cy.get(`[data-testid="tool-${tool}"]`).click()
            cy.wait(500)
          }
        })
      })
      
      // Take screenshot showing tool switching
      cy.screenshot('video-tool-switching', {
        capture: 'fullPage'
      })
    })

    it('should create video of toolbar interaction', () => {
      // Navigate to canvas page
      cy.visit('/dev/canvas/test-canvas', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('dev-mode', 'true')
          win.localStorage.setItem('idToken', 'dev-token')
        }
      })
      
      // Wait for canvas to load
      cy.wait(3000)
      
      // Wait for Konva canvas to be ready
      cy.get('.konvajs-content').should('be.visible')
      
      // Interact with toolbar (check if it exists)
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="toolbar"]').length > 0) {
          cy.get('[data-testid="toolbar"]').should('be.visible')
        }
      })
      
      // Try to collapse/expand toolbar if available
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="toolbar-collapse"]').length > 0) {
          cy.get('[data-testid="toolbar-collapse"]').click()
          cy.wait(500)
          cy.get('[data-testid="toolbar-collapse"]').click()
          cy.wait(500)
        }
      })
      
      // Take screenshot of toolbar interaction
      cy.screenshot('video-toolbar-interaction', {
        capture: 'fullPage'
      })
    })
  })
})
