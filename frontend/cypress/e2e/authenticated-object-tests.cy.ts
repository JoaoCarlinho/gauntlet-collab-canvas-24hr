/**
 * Authenticated Object Tests
 * Tests object manipulation with Firebase authentication
 */

describe('Authenticated Object Tests', () => {
  beforeEach(() => {
    // Visit the canvas page directly with authentication
    cy.visit('/dev/canvas/test-canvas', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('dev-mode', 'true')
        win.localStorage.setItem('idToken', 'dev-token')
        win.localStorage.setItem('user', JSON.stringify({
          id: 'test-user-1',
          email: 'test@collabcanvas.com',
          name: 'Test User'
        }))
      }
    })
    
    // Wait for canvas to load
    cy.wait(3000)
    
    // Wait for Konva canvas to be ready
    cy.get('.konvajs-content').should('be.visible')
    
    // Collapse the toolbar
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="toolbar"]').length > 0) {
        cy.get('[data-testid="toolbar"]').then(($toolbar) => {
          if ($toolbar.hasClass('w-48')) {
            cy.get('[data-testid="toolbar"] button[title*="Collapse"]').click()
          }
        })
      }
    })
  })

  it('should create objects with authentication', () => {
    // Test object creation with authentication
    const objects = [
      { tool: 'rectangle', name: 'Authenticated Rectangle', x: 800, y: 100 },
      { tool: 'circle', name: 'Authenticated Circle', x: 950, y: 100 },
      { tool: 'text', name: 'Authenticated Text', x: 1100, y: 100 }
    ]

    objects.forEach((obj, index) => {
      // Select the tool
      cy.get(`[data-testid="tool-${obj.tool}"]`).click()
      cy.wait(500)
      
      // Create the object
      cy.get('.konvajs-content').click(obj.x, obj.y, { force: true })
      
      // Handle text input
      if (obj.tool === 'text') {
        cy.get('body').then(($body) => {
          if ($body.find('[data-testid="text-input"]').length > 0) {
            cy.get('[data-testid="text-input"]').type(obj.name)
            cy.get('[data-testid="text-input"]').type('{enter}')
          }
        })
      }
      
      // Wait for object creation
      cy.wait(1000)
      
      // Take screenshot
      cy.screenshot(`authenticated-object-${obj.tool}`, {
        capture: 'fullPage'
      })
    })
  })

  it('should manipulate objects with authentication', () => {
    // Create a rectangle first
    cy.get('[data-testid="tool-rectangle"]').click()
    cy.get('.konvajs-content').click(800, 200, { force: true })
    cy.wait(1000)
    
    // Select the rectangle
    cy.get('[data-testid="tool-select"]').click()
    cy.get('.konvajs-content').click(800, 200, { force: true })
    cy.wait(500)
    
    // Take screenshot after selection
    cy.screenshot('authenticated-object-selected', {
      capture: 'fullPage'
    })
    
    // Drag the object
    cy.get('.konvajs-content')
      .trigger('mousedown', { which: 1, clientX: 800, clientY: 200 })
      .trigger('mousemove', { which: 1, clientX: 900, clientY: 300 })
      .trigger('mouseup', { which: 1, clientX: 900, clientY: 300 })
    
    cy.wait(1000)
    
    // Take screenshot after drag
    cy.screenshot('authenticated-object-dragged', {
      capture: 'fullPage'
    })
  })

  it('should handle object resizing with authentication', () => {
    // Create a rectangle
    cy.get('[data-testid="tool-rectangle"]').click()
    cy.get('.konvajs-content').click(800, 200, { force: true })
    cy.wait(1000)
    
    // Select the rectangle
    cy.get('[data-testid="tool-select"]').click()
    cy.get('.konvajs-content').click(800, 200, { force: true })
    cy.wait(500)
    
    // Take screenshot before resize
    cy.screenshot('authenticated-object-before-resize', {
      capture: 'fullPage'
    })
    
    // Resize the object (simulate resize handle interaction)
    cy.get('.konvajs-content')
      .trigger('mousedown', { which: 1, clientX: 850, clientY: 250 })
      .trigger('mousemove', { which: 1, clientX: 900, clientY: 300 })
      .trigger('mouseup', { which: 1, clientX: 900, clientY: 300 })
    
    cy.wait(1000)
    
    // Take screenshot after resize
    cy.screenshot('authenticated-object-after-resize', {
      capture: 'fullPage'
    })
  })

  it('should handle multiple object operations with authentication', () => {
    // Create multiple objects
    const objects = [
      { tool: 'rectangle', x: 800, y: 100 },
      { tool: 'circle', x: 950, y: 100 },
      { tool: 'text', x: 1100, y: 100 }
    ]

    objects.forEach((obj) => {
      cy.get(`[data-testid="tool-${obj.tool}"]`).click()
      cy.get('.konvajs-content').click(obj.x, obj.y, { force: true })
      
      if (obj.tool === 'text') {
        cy.get('body').then(($body) => {
          if ($body.find('[data-testid="text-input"]').length > 0) {
            cy.get('[data-testid="text-input"]').type('Text')
            cy.get('[data-testid="text-input"]').type('{enter}')
          }
        })
      }
      
      cy.wait(500)
    })
    
    // Take screenshot with all objects
    cy.screenshot('authenticated-multiple-objects', {
      capture: 'fullPage'
    })
    
    // Select and move objects
    cy.get('[data-testid="tool-select"]').click()
    
    // Move each object
    objects.forEach((obj, index) => {
      cy.get('.konvajs-content').click(obj.x, obj.y, { force: true })
      cy.wait(200)
      
      cy.get('.konvajs-content')
        .trigger('mousedown', { which: 1, clientX: obj.x, clientY: obj.y })
        .trigger('mousemove', { which: 1, clientX: obj.x + 50, clientY: obj.y + 50 })
        .trigger('mouseup', { which: 1, clientX: obj.x + 50, clientY: obj.y + 50 })
      
      cy.wait(500)
    })
    
    // Take final screenshot
    cy.screenshot('authenticated-multiple-objects-moved', {
      capture: 'fullPage'
    })
  })
})
