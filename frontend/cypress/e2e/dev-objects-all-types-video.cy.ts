/**
 * Dev Objects All Types Video
 * Creates a video showing the creation of all object types on the canvas
 */

describe('Dev Objects All Types Video', () => {
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

  it('should create video of all object types creation', () => {
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
    // Toolbar is at x: 20, y: 20 with width: 192px (w-48) when expanded, 48px (w-12) when collapsed
    // Canvas is typically 1280px wide, so we place objects starting at x: 800 to be near the right edge
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

    // Create each object with a delay to show the process
    objects.forEach((obj, index) => {
      cy.get('body').then(($body) => {
        if ($body.find(`[data-testid="tool-${obj.tool}"]`).length > 0) {
          // Select the tool
          cy.get(`[data-testid="tool-${obj.tool}"]`).click()
          
          // Wait a moment to show tool selection
          cy.wait(500)
          
          // Special handling for circle to ensure visibility
          if (obj.tool === 'circle') {
            // Take screenshot before circle creation
            cy.screenshot(`dev-objects-all-types-before-circle`, {
              capture: 'fullPage'
            })
            
            // Click on the canvas to create the circle
            cy.get('.konvajs-content').click(obj.x, obj.y, { force: true })
            
            // Wait longer for circle to be created and rendered
            cy.wait(2000)
            
            // Take screenshot immediately after circle creation
            cy.screenshot(`dev-objects-all-types-after-circle-creation`, {
              capture: 'fullPage'
            })
            
            // Wait a bit more to ensure persistence
            cy.wait(1000)
            
            // Take another screenshot to check persistence
            cy.screenshot(`dev-objects-all-types-circle-persistence`, {
              capture: 'fullPage'
            })
          } else {
            // Click on the canvas to create the object
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
            
            // Wait for object to be created and rendered
            cy.wait(1000)
          }
          
          // Take intermediate screenshot to show progress
          cy.screenshot(`dev-objects-all-types-progress-${index + 1}-${obj.tool}`, {
            capture: 'fullPage'
          })
        }
      })
    })

    // Final screenshot showing all objects
    cy.screenshot('dev-objects-all-types-final', {
      capture: 'fullPage'
    })
  })

  it('should create video of object types with labels', () => {
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
    
    // Create objects with labels for better demonstration (positioned near the right edge of the canvas)
    const labeledObjects = [
      { tool: 'rectangle', x: 800, y: 50, label: 'Rectangle Tool' },
      { tool: 'circle', x: 950, y: 50, label: 'Circle Tool' },
      { tool: 'text', x: 1100, y: 50, label: 'Text Tool' },
      { tool: 'heart', x: 800, y: 200, label: 'Heart Tool' },
      { tool: 'star', x: 950, y: 200, label: 'Star Tool' },
      { tool: 'diamond', x: 1100, y: 200, label: 'Diamond Tool' },
      { tool: 'line', x: 800, y: 350, label: 'Line Tool' },
      { tool: 'arrow', x: 950, y: 350, label: 'Arrow Tool' }
    ]

    // Create each object with labels
    labeledObjects.forEach((obj, index) => {
      cy.get('body').then(($body) => {
        if ($body.find(`[data-testid="tool-${obj.tool}"]`).length > 0) {
          // Select the tool
          cy.get(`[data-testid="tool-${obj.tool}"]`).click()
          cy.wait(300)
          
          // Create the object
          cy.get('.konvajs-content').click(obj.x, obj.y, { force: true })
          
          // Add text for text objects
          if (obj.tool === 'text') {
            cy.get('body').then(($body) => {
              if ($body.find('[data-testid="text-input"]').length > 0) {
                cy.get('[data-testid="text-input"]').type(obj.label)
                cy.get('[data-testid="text-input"]').type('{enter}')
              }
            })
          }
          
          cy.wait(800)
        }
      })
    })

    // Take final screenshot with all labeled objects
    cy.screenshot('dev-objects-all-types-with-labels', {
      capture: 'fullPage'
    })
  })

  it('should create video of object types in organized layout', () => {
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
    
    // Create objects in an organized grid layout (positioned near the right edge of the canvas)
    const gridObjects = [
      // Row 1: Basic shapes
      { tool: 'rectangle', x: 800, y: 100, label: 'Rectangle' },
      { tool: 'circle', x: 900, y: 100, label: 'Circle' },
      { tool: 'text', x: 1000, y: 100, label: 'Text' },
      
      // Row 2: Decorative shapes
      { tool: 'heart', x: 800, y: 200, label: 'Heart' },
      { tool: 'star', x: 900, y: 200, label: 'Star' },
      { tool: 'diamond', x: 1000, y: 200, label: 'Diamond' },
      
      // Row 3: Lines and arrows
      { tool: 'line', x: 800, y: 300, label: 'Line' },
      { tool: 'arrow', x: 900, y: 300, label: 'Arrow' }
    ]

    // Create objects in organized layout
    gridObjects.forEach((obj, index) => {
      cy.get('body').then(($body) => {
        if ($body.find(`[data-testid="tool-${obj.tool}"]`).length > 0) {
          // Select the tool
          cy.get(`[data-testid="tool-${obj.tool}"]`).click()
          cy.wait(400)
          
          // Create the object
          cy.get('.konvajs-content').click(obj.x, obj.y, { force: true })
          
          // Add text for text objects
          if (obj.tool === 'text') {
            cy.get('body').then(($body) => {
              if ($body.find('[data-testid="text-input"]').length > 0) {
                cy.get('[data-testid="text-input"]').type(obj.label)
                cy.get('[data-testid="text-input"]').type('{enter}')
              }
            })
          }
          
          cy.wait(600)
        }
      })
    })

    // Take final screenshot with organized layout
    cy.screenshot('dev-objects-all-types-organized-layout', {
      capture: 'fullPage'
    })
  })
})
