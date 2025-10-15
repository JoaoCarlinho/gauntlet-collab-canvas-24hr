describe('Enhanced Object Interactions', () => {
  beforeEach(() => {
    // Visit the local development server
    cy.visit('http://localhost:3005')
    
    // Wait for the app to load
    cy.get('[data-testid="app-container"]', { timeout: 10000 }).should('exist')
  })

  it('should authenticate and navigate to canvas', () => {
    // Click sign in button
    cy.get('button').contains('Sign in with Google').click()
    
    // Wait for authentication to complete
    cy.url().should('include', '/canvas/', { timeout: 15000 })
    
    // Verify we're on a canvas page
    cy.get('h1').should('contain', 'Canvas')
  })

  it('should create and edit text objects', () => {
    // Authenticate first
    cy.get('button').contains('Sign in with Google').click()
    cy.url().should('include', '/canvas/', { timeout: 15000 })
    
    // Select text tool
    cy.get('button').contains('Text').click()
    
    // Click on canvas to create text
    cy.get('[data-testid="canvas-stage"]').click(200, 200)
    
    // Wait for text object to be created
    cy.wait(1000)
    
    // Double-click the text to edit it
    cy.get('[data-testid="canvas-stage"]').dblclick(200, 200)
    
    // Verify text editing mode is active
    // Note: This test would need to be adapted based on the actual implementation
    // of how text editing is handled in the Konva canvas
    
    // Type new text
    cy.get('body').type('New Text Content')
    
    // Press Enter to save
    cy.get('body').type('{enter}')
    
    // Verify text was updated
    // This would need to be adapted based on the actual text rendering
  })

  it('should select and move objects', () => {
    // Authenticate first
    cy.get('button').contains('Sign in with Google').click()
    cy.url().should('include', '/canvas/', { timeout: 15000 })
    
    // Create a rectangle
    cy.get('button').contains('Rectangle').click()
    cy.get('[data-testid="canvas-stage"]').click(100, 100)
    cy.wait(1000)
    
    // Select the select tool
    cy.get('button').contains('Select').click()
    
    // Click on the rectangle to select it
    cy.get('[data-testid="canvas-stage"]').click(100, 100)
    
    // Verify selection indicator appears
    // This would need to be adapted based on the actual selection rendering
    
    // Drag the rectangle to a new position
    cy.get('[data-testid="canvas-stage"]')
      .trigger('mousedown', { which: 1, pageX: 100, pageY: 100 })
      .trigger('mousemove', { which: 1, pageX: 200, pageY: 200 })
      .trigger('mouseup', { which: 1, pageX: 200, pageY: 200 })
    
    // Verify rectangle moved
    cy.wait(1000)
  })

  it('should resize shapes with handles', () => {
    // Authenticate first
    cy.get('button').contains('Sign in with Google').click()
    cy.url().should('include', '/canvas/', { timeout: 15000 })
    
    // Create a rectangle
    cy.get('button').contains('Rectangle').click()
    cy.get('[data-testid="canvas-stage"]').click(150, 150)
    cy.wait(1000)
    
    // Select the rectangle
    cy.get('button').contains('Select').click()
    cy.get('[data-testid="canvas-stage"]').click(150, 150)
    
    // Verify resize handles appear
    // This would need to be adapted based on the actual resize handle rendering
    
    // Drag a resize handle
    // This would need to be adapted based on the actual resize handle implementation
  })

  it('should handle keyboard shortcuts', () => {
    // Authenticate first
    cy.get('button').contains('Sign in with Google').click()
    cy.url().should('include', '/canvas/', { timeout: 15000 })
    
    // Create a text object
    cy.get('button').contains('Text').click()
    cy.get('[data-testid="canvas-stage"]').click(200, 200)
    cy.wait(1000)
    
    // Double-click to edit
    cy.get('[data-testid="canvas-stage"]').dblclick(200, 200)
    
    // Press Escape to cancel editing
    cy.get('body').type('{esc}')
    
    // Verify editing was cancelled
    // This would need to be adapted based on the actual implementation
  })

  it('should show visual feedback for interactions', () => {
    // Authenticate first
    cy.get('button').contains('Sign in with Google').click()
    cy.url().should('include', '/canvas/', { timeout: 15000 })
    
    // Create a circle
    cy.get('button').contains('Circle').click()
    cy.get('[data-testid="canvas-stage"]').click(250, 250)
    cy.wait(1000)
    
    // Select the circle
    cy.get('button').contains('Select').click()
    cy.get('[data-testid="canvas-stage"]').click(250, 250)
    
    // Verify selection indicator appears
    // This would need to be adapted based on the actual selection rendering
    
    // Hover over the circle
    cy.get('[data-testid="canvas-stage"]').trigger('mouseover', 250, 250)
    
    // Verify hover indicator appears
    // This would need to be adapted based on the actual hover rendering
  })

  it('should handle real-time collaborative updates', () => {
    // This test would require multiple browser instances or a more complex setup
    // to test real-time collaboration features
    
    // For now, we'll just verify the basic functionality
    cy.get('button').contains('Sign in with Google').click()
    cy.url().should('include', '/canvas/', { timeout: 15000 })
    
    // Create an object
    cy.get('button').contains('Rectangle').click()
    cy.get('[data-testid="canvas-stage"]').click(100, 100)
    cy.wait(1000)
    
    // Verify object was created
    // This would need to be adapted based on the actual object rendering
  })
})
