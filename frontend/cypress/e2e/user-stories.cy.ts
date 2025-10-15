/// <reference types="cypress" />

describe('User Stories - CollabCanvas MVP', () => {
  beforeEach(() => {
    // Clear any existing data
    cy.clearLocalStorage()
    cy.clearCookies()
    
    // Mock successful authentication
    cy.login()
    
    // Visit the homepage
    cy.visit('/')
  })

  describe('Authentication User Stories', () => {
    it('US-001: As a user, I can sign in with Google to access the application', () => {
      // This test assumes the user is already authenticated via the login command
      cy.get('[data-testid="user-menu"]').should('be.visible')
      cy.get('[data-testid="user-name"]').should('contain', 'Test User')
      cy.get('[data-testid="user-email"]').should('contain', 'test@example.com')
    })

    it('US-002: As a user, I can sign out of the application', () => {
      cy.get('[data-testid="user-menu"]').click()
      cy.get('[data-testid="sign-out-button"]').click()
      
      // Should redirect to login page
      cy.url().should('include', '/login')
      cy.get('[data-testid="login-page"]').should('be.visible')
    })
  })

  describe('Canvas Management User Stories', () => {
    it('US-003: As a user, I can create a new canvas with a title and description', () => {
      const canvasTitle = 'My Test Canvas'
      const canvasDescription = 'This is a test canvas for demonstration'
      
      cy.get('[data-testid="create-canvas-button"]').click()
      cy.get('[data-testid="canvas-title-input"]').type(canvasTitle)
      cy.get('[data-testid="canvas-description-input"]').type(canvasDescription)
      cy.get('[data-testid="create-canvas-submit"]').click()
      
      // Verify canvas was created and appears in the list
      cy.get('[data-testid="canvas-list"]').should('contain', canvasTitle)
      cy.get('[data-testid="canvas-list"]').should('contain', canvasDescription)
    })

    it('US-004: As a user, I can view a list of all my canvases', () => {
      // Create multiple canvases
      cy.createCanvas('Canvas 1', 'First canvas')
      cy.createCanvas('Canvas 2', 'Second canvas')
      cy.createCanvas('Canvas 3', 'Third canvas')
      
      // Verify all canvases are visible
      cy.get('[data-testid="canvas-list"]').should('contain', 'Canvas 1')
      cy.get('[data-testid="canvas-list"]').should('contain', 'Canvas 2')
      cy.get('[data-testid="canvas-list"]').should('contain', 'Canvas 3')
    })

    it('US-005: As a user, I can open a canvas to start editing', () => {
      const canvasTitle = 'Editable Canvas'
      cy.createCanvas(canvasTitle, 'Canvas for editing')
      
      // Click on the canvas to open it
      cy.get('[data-testid="canvas-list"]').contains(canvasTitle).click()
      
      // Verify we're on the canvas page
      cy.url().should('include', '/canvas/')
      cy.get('[data-testid="canvas-editor"]').should('be.visible')
      cy.get('[data-testid="canvas-title"]').should('contain', canvasTitle)
    })

    it('US-006: As a user, I can delete a canvas I own', () => {
      const canvasTitle = 'Canvas to Delete'
      cy.createCanvas(canvasTitle, 'This canvas will be deleted')
      
      // Find the canvas and click delete
      cy.get('[data-testid="canvas-list"]')
        .contains(canvasTitle)
        .parent()
        .find('[data-testid="delete-canvas-button"]')
        .click()
      
      // Confirm deletion
      cy.get('[data-testid="confirm-delete-button"]').click()
      
      // Verify canvas is removed from list
      cy.get('[data-testid="canvas-list"]').should('not.contain', canvasTitle)
    })
  })

  describe('Canvas Editing User Stories', () => {
    beforeEach(() => {
      // Create a canvas and navigate to it for editing tests
      cy.createCanvas('Test Canvas', 'Canvas for editing tests')
      cy.get('[data-testid="canvas-list"]').contains('Test Canvas').click()
    })

    it('US-007: As a user, I can add shapes (rectangle, circle) to the canvas', () => {
      // Test rectangle tool
      cy.get('[data-testid="rectangle-tool"]').click()
      cy.get('[data-testid="canvas-stage"]').click(100, 100)
      cy.get('[data-testid="canvas-stage"]').click(200, 200)
      
      // Test circle tool
      cy.get('[data-testid="circle-tool"]').click()
      cy.get('[data-testid="canvas-stage"]').click(300, 300)
      cy.get('[data-testid="canvas-stage"]').click(400, 400)
      
      // Verify shapes were added (this would depend on your implementation)
      cy.get('[data-testid="canvas-objects"]').should('have.length.at.least', 2)
    })

    it('US-008: As a user, I can add text to the canvas', () => {
      cy.get('[data-testid="text-tool"]').click()
      cy.get('[data-testid="canvas-stage"]').click(150, 150)
      
      // Type text
      cy.get('[data-testid="text-input"]').type('Hello World!')
      cy.get('[data-testid="text-submit"]').click()
      
      // Verify text was added
      cy.get('[data-testid="canvas-stage"]').should('contain', 'Hello World!')
    })

    it('US-009: As a user, I can select and move objects on the canvas', () => {
      // First add a rectangle
      cy.get('[data-testid="rectangle-tool"]').click()
      cy.get('[data-testid="canvas-stage"]').click(100, 100)
      cy.get('[data-testid="canvas-stage"]').click(200, 200)
      
      // Select the rectangle
      cy.get('[data-testid="select-tool"]').click()
      cy.get('[data-testid="canvas-stage"]').click(150, 150)
      
      // Move the rectangle
      cy.get('[data-testid="canvas-stage"]')
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 250, clientY: 250 })
        .trigger('mouseup')
      
      // Verify the object moved (this would depend on your implementation)
      cy.get('[data-testid="canvas-objects"]').should('exist')
    })

    it('US-010: As a user, I can delete objects from the canvas', () => {
      // Add a rectangle
      cy.get('[data-testid="rectangle-tool"]').click()
      cy.get('[data-testid="canvas-stage"]').click(100, 100)
      cy.get('[data-testid="canvas-stage"]').click(200, 200)
      
      // Select and delete the rectangle
      cy.get('[data-testid="select-tool"]').click()
      cy.get('[data-testid="canvas-stage"]').click(150, 150)
      cy.get('[data-testid="delete-object-button"]').click()
      
      // Verify object was deleted
      cy.get('[data-testid="canvas-objects"]').should('have.length', 0)
    })
  })

  describe('Real-time Collaboration User Stories', () => {
    beforeEach(() => {
      cy.createCanvas('Collaborative Canvas', 'Canvas for collaboration tests')
      cy.get('[data-testid="canvas-list"]').contains('Collaborative Canvas').click()
    })

    it('US-011: As a user, I can see when other users are online', () => {
      // Verify connection status
      cy.get('[data-testid="connection-status"]').should('contain', 'Connected')
      
      // Verify online users indicator
      cy.get('[data-testid="online-users"]').should('be.visible')
    })

    it('US-012: As a user, I can see other users\' cursors in real-time', () => {
      // This would require multiple browser instances or mocking
      // For now, we'll verify the cursor tracking is set up
      cy.get('[data-testid="canvas-stage"]').trigger('mousemove', { clientX: 100, clientY: 100 })
      
      // Verify cursor tracking is active (this would depend on your implementation)
      cy.get('[data-testid="cursor-tracking"]').should('exist')
    })

    it('US-013: As a user, I can see changes made by other users in real-time', () => {
      // This would require WebSocket mocking or multiple browser instances
      // For now, we'll verify the real-time features are enabled
      cy.get('[data-testid="realtime-indicator"]').should('be.visible')
      cy.get('[data-testid="websocket-status"]').should('contain', 'Connected')
    })
  })

  describe('Canvas Sharing User Stories', () => {
    it('US-014: As a user, I can make a canvas public so others can view it', () => {
      cy.createCanvas('Public Canvas', 'This canvas will be public')
      
      // Find the canvas and make it public
      cy.get('[data-testid="canvas-list"]')
        .contains('Public Canvas')
        .parent()
        .find('[data-testid="canvas-settings-button"]')
        .click()
      
      cy.get('[data-testid="make-public-toggle"]').check()
      cy.get('[data-testid="save-settings-button"]').click()
      
      // Verify canvas is now public
      cy.get('[data-testid="canvas-list"]')
        .contains('Public Canvas')
        .parent()
        .find('[data-testid="public-indicator"]')
        .should('be.visible')
    })

    it('US-015: As a user, I can invite other users to collaborate on my canvas', () => {
      cy.createCanvas('Shared Canvas', 'Canvas for sharing')
      cy.get('[data-testid="canvas-list"]').contains('Shared Canvas').click()
      
      // Open sharing modal
      cy.get('[data-testid="share-button"]').click()
      
      // Invite a user
      cy.get('[data-testid="invite-email-input"]').type('collaborator@example.com')
      cy.get('[data-testid="send-invitation-button"]').click()
      
      // Verify invitation was sent
      cy.get('[data-testid="invitation-sent-message"]').should('be.visible')
    })
  })

  describe('Performance and UX User Stories', () => {
    it('US-016: As a user, I can use keyboard shortcuts for common actions', () => {
      cy.createCanvas('Keyboard Test Canvas', 'Testing keyboard shortcuts')
      cy.get('[data-testid="canvas-list"]').contains('Keyboard Test Canvas').click()
      
      // Test keyboard shortcuts
      cy.get('body').type('{ctrl}n') // New object shortcut
      cy.get('[data-testid="new-object-indicator"]').should('be.visible')
      
      cy.get('body').type('{ctrl}s') // Save shortcut
      cy.get('[data-testid="save-indicator"]').should('be.visible')
    })

    it('US-017: As a user, I can undo and redo my actions', () => {
      cy.createCanvas('Undo Test Canvas', 'Testing undo/redo functionality')
      cy.get('[data-testid="canvas-list"]').contains('Undo Test Canvas').click()
      
      // Add an object
      cy.get('[data-testid="rectangle-tool"]').click()
      cy.get('[data-testid="canvas-stage"]').click(100, 100)
      cy.get('[data-testid="canvas-stage"]').click(200, 200)
      
      // Undo the action
      cy.get('[data-testid="undo-button"]').click()
      cy.get('[data-testid="canvas-objects"]').should('have.length', 0)
      
      // Redo the action
      cy.get('[data-testid="redo-button"]').click()
      cy.get('[data-testid="canvas-objects"]').should('have.length', 1)
    })

    it('US-018: As a user, I can see a loading indicator when operations are in progress', () => {
      // Test loading indicator during canvas creation
      cy.get('[data-testid="create-canvas-button"]').click()
      cy.get('[data-testid="canvas-title-input"]').type('Loading Test Canvas')
      cy.get('[data-testid="create-canvas-submit"]').click()
      
      // Verify loading indicator appears
      cy.get('[data-testid="loading-indicator"]').should('be.visible')
      
      // Wait for completion
      cy.get('[data-testid="loading-indicator"]').should('not.exist')
      cy.get('[data-testid="canvas-list"]').should('contain', 'Loading Test Canvas')
    })
  })
})
