/**
 * Development Screenshot Generation Tests
 * Generates screenshots without authentication for development testing
 */

describe('Development Screenshot Generation', () => {
  let testCanvasId: string

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

  describe('Home Page Flow', () => {
    it('should capture home page with canvas list', () => {
      // Go back to home page to capture the canvas list
      cy.visit('/')
      
      // Wait for home page to load
      cy.get('[data-testid="create-canvas-button"]', { timeout: 10000 }).should('be.visible')
      
      // Wait for canvases to load (check for canvas list or empty state)
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="canvas-list"]').length > 0) {
          cy.get('[data-testid="canvas-list"]').should('be.visible')
        } else if ($body.find('[data-testid="empty-canvas-state"]').length > 0) {
          cy.get('[data-testid="empty-canvas-state"]').should('be.visible')
        } else {
          // Wait for loading to complete by checking that spinner is gone
          cy.get('.animate-spin', { timeout: 10000 }).should('not.exist')
        }
      })
      
      // Additional wait to ensure everything is loaded
      cy.wait(2000)
      
      // Take screenshot of home page
      cy.screenshot('dev-home-page-with-canvas-list', {
        capture: 'fullPage'
      })
    })

    it('should capture create canvas modal', () => {
      // Go back to home page
      cy.visit('/')
      
      // Wait for home page to load
      cy.get('[data-testid="create-canvas-button"]', { timeout: 10000 }).should('be.visible')
      
      // Open create canvas modal
      cy.get('[data-testid="create-canvas-button"]').click()
      
      // Wait for modal to appear
      cy.get('[data-testid="canvas-title-input"]').should('be.visible')
      
      // Take screenshot of create canvas modal
      cy.screenshot('dev-create-canvas-modal', {
        capture: 'fullPage'
      })
    })
  })

  describe('Canvas Navigation', () => {
    it('should navigate to canvas and capture canvas screenshots', () => {
      // Navigate directly to a canvas using the development route
      cy.visit('/dev/canvas/test-canvas', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('dev-mode', 'true')
          win.localStorage.setItem('idToken', 'dev-token')
        }
      })
      
      // Wait for page to load and take screenshot regardless of canvas container
      cy.wait(3000) // Wait for page to load
      
      // Take screenshot of whatever is rendered
      cy.screenshot('dev-canvas-page', {
        capture: 'fullPage'
      })
    })
  })

  describe('User Interface Components', () => {
    it('should capture toolbar and controls', () => {
      // Navigate to canvas page
      cy.visit('/dev/canvas/test-canvas', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('dev-mode', 'true')
          win.localStorage.setItem('idToken', 'dev-token')
        }
      })
      
      // Wait for page to load
      cy.wait(3000)
      
      // Take screenshot of canvas with toolbar
      cy.screenshot('dev-ui-toolbar-and-controls', {
        capture: 'fullPage'
      })
    })

    it('should capture object creation tools', () => {
      // Navigate to canvas page
      cy.visit('/dev/canvas/test-canvas', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('dev-mode', 'true')
          win.localStorage.setItem('idToken', 'dev-token')
        }
      })
      
      // Wait for page to load
      cy.wait(3000)
      
      // Take screenshot of canvas with tools
      cy.screenshot('dev-ui-object-creation-tools', {
        capture: 'fullPage'
      })
    })

    it('should capture collaboration features', () => {
      // Navigate to canvas page
      cy.visit('/dev/canvas/test-canvas', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('dev-mode', 'true')
          win.localStorage.setItem('idToken', 'dev-token')
        }
      })
      
      // Wait for page to load
      cy.wait(3000)
      
      // Take screenshot of collaboration features
      cy.screenshot('dev-ui-collaboration-features', {
        capture: 'fullPage'
      })
    })

    it('should capture status indicators', () => {
      // Navigate to canvas page
      cy.visit('/dev/canvas/test-canvas', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('dev-mode', 'true')
          win.localStorage.setItem('idToken', 'dev-token')
        }
      })
      
      // Wait for page to load
      cy.wait(3000)
      
      // Take screenshot of status indicators
      cy.screenshot('dev-ui-status-indicators', {
        capture: 'fullPage'
      })
    })
  })

  describe('Object Types and Interactions', () => {
    it('should capture all object types', () => {
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
      
      // Collapse the toolbar to make it smaller and not cover objects
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="toolbar"]').length > 0) {
          cy.get('[data-testid="toolbar"]').then(($toolbar) => {
            // Check if toolbar is expanded and collapse it
            if ($toolbar.hasClass('w-48')) {
              cy.get('[data-testid="toolbar"] button[title*="Collapse"]').click()
            }
          })
        }
      })
      
      // Create all object types that are available (positioned near the right edge of the canvas)
      const objects = [
        { tool: 'rectangle', name: 'Rectangle', x: 800, y: 100 },
        { tool: 'circle', name: 'Circle', x: 950, y: 100 },
        { tool: 'text', name: 'Text', x: 1100, y: 100 },
        { tool: 'heart', name: 'Heart', x: 800, y: 250 },
        { tool: 'star', name: 'Star', x: 950, y: 250 },
        { tool: 'diamond', name: 'Diamond', x: 1100, y: 250 },
        { tool: 'line', name: 'Line', x: 800, y: 400 },
        { tool: 'arrow', name: 'Arrow', x: 950, y: 400 }
      ]

      objects.forEach((obj, index) => {
        cy.get('body').then(($body) => {
          if ($body.find(`[data-testid="tool-${obj.tool}"]`).length > 0) {
            cy.get(`[data-testid="tool-${obj.tool}"]`).click()
            // Click on the actual Konva canvas, not the container
            cy.get('.konvajs-content').click(obj.x, obj.y, { force: true })
            
            // Add text for text object
            if (obj.tool === 'text') {
              cy.get('body').then(($body) => {
                if ($body.find('[data-testid="text-input"]').length > 0) {
                  cy.get('[data-testid="text-input"]').type(obj.name)
                  cy.get('[data-testid="text-input"]').type('{enter}')
                }
              })
            }
            
            // Wait for object to be created
            cy.wait(500)
          }
        })
      })

      // Take screenshot of all object types
      cy.screenshot('dev-objects-all-types', {
        capture: 'fullPage'
      })
    })

    it('should capture object selection and editing', () => {
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
      
      // Create a rectangle
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="tool-rectangle"]').length > 0) {
          cy.get('[data-testid="tool-rectangle"]').click()
          cy.get('.konvajs-content').click(800, 200, { force: true })
          
          // Select the rectangle
          cy.get('body').then(($body) => {
            if ($body.find('[data-testid="object-rectangle"]').length > 0) {
              cy.get('[data-testid="object-rectangle"]').click()
              
              // Show selection handles if available
              cy.get('body').then(($body) => {
                if ($body.find('[data-testid="selection-indicator"]').length > 0) {
                  cy.get('[data-testid="selection-indicator"]').should('be.visible')
                }
                if ($body.find('[data-testid="resize-handles"]').length > 0) {
                  cy.get('[data-testid="resize-handles"]').should('be.visible')
                }
              })
            }
          })
        }
      })
      
      // Take screenshot of object selection
      cy.screenshot('dev-objects-selection-and-editing', {
        capture: 'fullPage'
      })
    })

    it('should capture object resizing', () => {
      // Navigate to canvas page
      cy.visit('/dev/canvas/test-canvas', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('dev-mode', 'true')
          win.localStorage.setItem('idToken', 'dev-token')
        }
      })
      
      // Wait for canvas to load
      cy.wait(3000)
      
      // Create and select a rectangle
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="tool-rectangle"]').length > 0) {
          cy.get('[data-testid="tool-rectangle"]').click()
          cy.get('.konvajs-content').click(800, 200, { force: true })
          
          cy.get('body').then(($body) => {
            if ($body.find('[data-testid="object-rectangle"]').length > 0) {
              cy.get('[data-testid="object-rectangle"]').click()
              
              // Resize using resize handle if available
              cy.get('body').then(($body) => {
                if ($body.find('[data-testid="resize-handle-se"]').length > 0) {
                  cy.get('[data-testid="resize-handle-se"]')
                    .trigger('mousedown', { which: 1 })
                    .trigger('mousemove', { clientX: 300, clientY: 300 })
                    .trigger('mouseup')
                }
              })
            }
          })
        }
      })
      
      // Take screenshot of resized object
      cy.screenshot('dev-objects-resizing', {
        capture: 'fullPage'
      })
    })

    it('should capture object movement', () => {
      // Navigate to canvas page
      cy.visit('/dev/canvas/test-canvas', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('dev-mode', 'true')
          win.localStorage.setItem('idToken', 'dev-token')
        }
      })
      
      // Wait for canvas to load
      cy.wait(3000)
      
      // Create and select a rectangle
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="tool-rectangle"]').length > 0) {
          cy.get('[data-testid="tool-rectangle"]').click()
          cy.get('.konvajs-content').click(800, 200, { force: true })
          
          cy.get('body').then(($body) => {
            if ($body.find('[data-testid="object-rectangle"]').length > 0) {
              cy.get('[data-testid="object-rectangle"]').click()
              
              // Move the rectangle
              cy.get('[data-testid="object-rectangle"]')
                .trigger('mousedown', { which: 1 })
                .trigger('mousemove', { clientX: 300, clientY: 300 })
                .trigger('mouseup')
            }
          })
        }
      })
      
      // Take screenshot of moved object
      cy.screenshot('dev-objects-movement', {
        capture: 'fullPage'
      })
    })
  })

  describe('User Experience Flows', () => {
    it('should capture complete user workflow', () => {
      // Navigate to canvas page
      cy.visit('/dev/canvas/test-canvas', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('dev-mode', 'true')
          win.localStorage.setItem('idToken', 'dev-token')
        }
      })
      
      // Wait for canvas to load
      cy.wait(3000)
      
      // Step 1: Create objects
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="tool-rectangle"]').length > 0) {
          cy.get('[data-testid="tool-rectangle"]').click()
          cy.get('.konvajs-content').click(1100, 100, { force: true })
        }
      })
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="tool-circle"]').length > 0) {
          cy.get('[data-testid="tool-circle"]').click()
          cy.get('.konvajs-content').click(950, 100, { force: true })
        }
      })
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="tool-text"]').length > 0) {
          cy.get('[data-testid="tool-text"]').click()
          cy.get('.konvajs-content').click(1100, 100, { force: true })
          
          cy.get('body').then(($body) => {
            if ($body.find('[data-testid="text-input"]').length > 0) {
              cy.get('[data-testid="text-input"]').type('Hello World')
              cy.get('[data-testid="text-input"]').type('{enter}')
            }
          })
        }
      })
      
      // Step 2: Arrange objects
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="object-rectangle"]').length > 0) {
          cy.get('[data-testid="object-rectangle"]').click()
          cy.get('[data-testid="object-rectangle"]')
            .trigger('mousedown', { which: 1 })
            .trigger('mousemove', { clientX: 100, clientY: 200 })
            .trigger('mouseup')
        }
      })
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="object-circle"]').length > 0) {
          cy.get('[data-testid="object-circle"]').click()
          cy.get('[data-testid="object-circle"]')
            .trigger('mousedown', { which: 1 })
            .trigger('mousemove', { clientX: 250, clientY: 200 })
            .trigger('mouseup')
        }
      })
      
      // Step 3: Resize objects
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="object-rectangle"]').length > 0) {
          cy.get('[data-testid="object-rectangle"]').click()
          
          cy.get('body').then(($body) => {
            if ($body.find('[data-testid="resize-handle-se"]').length > 0) {
              cy.get('[data-testid="resize-handle-se"]')
                .trigger('mousedown', { which: 1 })
                .trigger('mousemove', { clientX: 150, clientY: 250 })
                .trigger('mouseup')
            }
          })
        }
      })
      
      // Take screenshot of complete workflow
      cy.screenshot('dev-user-experience-complete-workflow', {
        capture: 'fullPage'
      })
    })

    it('should capture collaboration workflow', () => {
      // Navigate to canvas page
      cy.visit('/dev/canvas/test-canvas', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('dev-mode', 'true')
          win.localStorage.setItem('idToken', 'dev-token')
        }
      })
      
      // Wait for canvas to load
      cy.wait(3000)
      
      // Check if we're on a canvas page or home page
      cy.url().then((url) => {
        if (url.includes('/canvas/')) {
          // We're on a canvas page, show collaboration features
          cy.get('body').then(($body) => {
            if ($body.find('[data-testid="collaboration-sidebar-toggle"]').length > 0) {
              cy.get('[data-testid="collaboration-sidebar-toggle"]').click()
              cy.get('[data-testid="collaboration-sidebar"]').should('be.visible')
            }
          })
          
          // Show user presence if available
          cy.get('body').then(($body) => {
            if ($body.find('[data-testid="user-presence-indicator"]').length > 0) {
              cy.get('[data-testid="user-presence-indicator"]').should('be.visible')
            }
          })
          
          // Show cursor tracking if available
          cy.get('[data-testid="canvas-container"]').trigger('mousemove', { clientX: 200, clientY: 200 })
          cy.get('body').then(($body) => {
            if ($body.find('[data-testid="cursor-indicator"]').length > 0) {
              cy.get('[data-testid="cursor-indicator"]').should('be.visible')
            }
          })
        } else {
          // We're on the home page, show home page collaboration features
          cy.get('[data-testid="create-canvas-button"]').should('be.visible')
        }
      })
      
      // Take screenshot of collaboration workflow
      cy.screenshot('dev-user-experience-collaboration', {
        capture: 'fullPage'
      })
    })
  })

  describe('Documentation Screenshots', () => {
    it('should generate user guide screenshots', () => {
      // Navigate to canvas page
      cy.visit('/dev/canvas/test-canvas', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('dev-mode', 'true')
          win.localStorage.setItem('idToken', 'dev-token')
        }
      })
      
      // Wait for canvas to load
      cy.wait(3000)
      
      // Create a comprehensive canvas for user guide
      const guideObjects = [
        { tool: 'rectangle', x: 800, y: 50, label: 'Rectangle Tool' },
        { tool: 'circle', x: 950, y: 50, label: 'Circle Tool' },
        { tool: 'text', x: 1100, y: 50, label: 'Text Tool' },
        { tool: 'heart', x: 800, y: 200, label: 'Heart Tool' },
        { tool: 'star', x: 950, y: 200, label: 'Star Tool' },
        { tool: 'diamond', x: 1100, y: 200, label: 'Diamond Tool' },
        { tool: 'line', x: 800, y: 350, label: 'Line Tool' },
        { tool: 'arrow', x: 950, y: 350, label: 'Arrow Tool' }
      ]

      guideObjects.forEach((obj) => {
        cy.get('body').then(($body) => {
          if ($body.find(`[data-testid="tool-${obj.tool}"]`).length > 0) {
            cy.get(`[data-testid="tool-${obj.tool}"]`).click()
            cy.get('.konvajs-content').click(obj.x, obj.y, { force: true })
            
            if (obj.tool === 'text') {
              cy.get('body').then(($body) => {
                if ($body.find('[data-testid="text-input"]').length > 0) {
                  cy.get('[data-testid="text-input"]').type(obj.label)
                  cy.get('[data-testid="text-input"]').type('{enter}')
                }
              })
            }
          }
        })
      })

      // Take comprehensive user guide screenshot
      cy.screenshot('dev-user-guide-complete-tools', {
        capture: 'fullPage'
      })
    })

    it('should generate feature showcase screenshots', () => {
      // Navigate to canvas page
      cy.visit('/dev/canvas/test-canvas', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('dev-mode', 'true')
          win.localStorage.setItem('idToken', 'dev-token')
        }
      })
      
      // Wait for canvas to load
      cy.wait(3000)
      
      // Create a feature-rich canvas
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="tool-rectangle"]').length > 0) {
          cy.get('[data-testid="tool-rectangle"]').click()
          cy.get('.konvajs-content').click(1100, 100, { force: true })
        }
      })
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="tool-circle"]').length > 0) {
          cy.get('[data-testid="tool-circle"]').click()
          cy.get('.konvajs-content').click(950, 100, { force: true })
        }
      })
      
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="tool-text"]').length > 0) {
          cy.get('[data-testid="tool-text"]').click()
          cy.get('.konvajs-content').click(1100, 100, { force: true })
          
          cy.get('body').then(($body) => {
            if ($body.find('[data-testid="text-input"]').length > 0) {
              cy.get('[data-testid="text-input"]').type('CollabCanvas')
              cy.get('[data-testid="text-input"]').type('{enter}')
            }
          })
        }
      })
      
      // Show all features if available
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="collaboration-sidebar-toggle"]').length > 0) {
          cy.get('[data-testid="collaboration-sidebar-toggle"]').click()
        }
        if ($body.find('[data-testid="debug-panel-toggle"]').length > 0) {
          cy.get('[data-testid="debug-panel-toggle"]').click()
        }
      })
      
      // Take feature showcase screenshot
      cy.screenshot('dev-feature-showcase-complete', {
        capture: 'fullPage'
      })
    })
  })
})
