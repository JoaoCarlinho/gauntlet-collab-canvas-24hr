describe('Canvas Deletion Functionality', () => {
  beforeEach(() => {
    // Mock Firebase and authentication for local testing
    cy.window().then((win) => {
      // Mock Firebase auth
      win.firebase = {
        auth: () => ({
          currentUser: {
            uid: 'test-user-id',
            email: 'test@example.com',
            displayName: 'Test User',
            getIdToken: () => Promise.resolve('mock-token-for-testing')
          },
          onAuthStateChanged: (callback) => {
            callback(win.firebase.auth().currentUser)
            return () => {}
          },
          signInWithPopup: () => Promise.resolve({
            user: win.firebase.auth().currentUser
          }),
          signOut: () => Promise.resolve()
        })
      }
      
      // Mock localStorage
      win.localStorage.setItem('idToken', 'mock-token-for-testing')
      win.localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }))
    })
    
    // Handle uncaught exceptions from Firebase
    cy.on('uncaught:exception', (err, runnable) => {
      // Don't fail the test on Firebase errors
      if (err.message.includes('Firebase') || err.message.includes('auth/invalid-api-key')) {
        return false
      }
      return true
    })
  })

  it('should show delete button only for owned canvases', () => {
    // Visit the application
    cy.visit('/')
    
    // Login
    cy.login()
    
    // Create a canvas using the UI
    cy.get('[data-testid="create-canvas-button"]').click()
    cy.get('[data-testid="canvas-title-input"]').type('Test Canvas for Deletion')
    cy.get('[data-testid="canvas-description-input"]').type('Description for deletion test')
    cy.get('[data-testid="create-canvas-submit"]').click()
    
    // Wait for canvas to appear in the list
    cy.get('[data-testid="canvas-list"]').should('contain', 'Test Canvas for Deletion')
    
    // Check that delete button appears on hover for owned canvas
    cy.get('[data-testid="canvas-list-item"]').contains('Test Canvas for Deletion').parent().trigger('mouseover')
    cy.get('button[aria-label*="Delete canvas"]').should('be.visible')
    
    // Take screenshot
    cy.screenshot('delete-button-visible')
  })

  it('should show confirmation modal when delete button is clicked', () => {
    // Visit the application
    cy.visit('/')
    
    // Login
    cy.login()
    
    // Create a canvas using the UI
    cy.get('[data-testid="create-canvas-button"]').click()
    cy.get('[data-testid="canvas-title-input"]').type('Test Canvas for Deletion Modal')
    cy.get('[data-testid="canvas-description-input"]').type('Description for deletion modal test')
    cy.get('[data-testid="create-canvas-submit"]').click()
    
    // Wait for canvas to appear in the list
    cy.get('[data-testid="canvas-list"]').should('contain', 'Test Canvas for Deletion Modal')
    
    // Hover over canvas to show delete button
    cy.get('[data-testid="canvas-list-item"]').contains('Test Canvas for Deletion Modal').parent().trigger('mouseover')
    
    // Click delete button
    cy.get('button[aria-label*="Delete canvas"]').click()
    
    // Check that confirmation modal appears
    cy.get('[role="dialog"]').should('be.visible')
    cy.contains('Delete Canvas').should('be.visible')
    cy.contains('Test Canvas for Deletion Modal').should('be.visible')
    cy.contains('This action cannot be undone').should('be.visible')
    
    // Take screenshot
    cy.screenshot('delete-confirmation-modal')
    
    // Cancel the deletion
    cy.contains('Cancel').click()
    cy.get('[role="dialog"]').should('not.exist')
  })

  it('should delete canvas when confirmed', () => {
    // Visit the application
    cy.visit('/')
    
    // Login
    cy.login()
    
    // Create a canvas using the UI
    cy.get('[data-testid="create-canvas-button"]').click()
    cy.get('[data-testid="canvas-title-input"]').type('Test Canvas for Actual Deletion')
    cy.get('[data-testid="canvas-description-input"]').type('Description for actual deletion test')
    cy.get('[data-testid="create-canvas-submit"]').click()
    
    // Wait for canvas to appear in the list
    cy.get('[data-testid="canvas-list"]').should('contain', 'Test Canvas for Actual Deletion')
    
    // Verify canvas exists
    cy.get('[data-testid="canvas-list-item"]').contains('Test Canvas for Actual Deletion').should('exist')
    
    // Hover over canvas to show delete button
    cy.get('[data-testid="canvas-list-item"]').contains('Test Canvas for Actual Deletion').parent().trigger('mouseover')
    
    // Click delete button
    cy.get('button[aria-label*="Delete canvas"]').click()
    
    // Confirm deletion
    cy.contains('Delete Canvas').click()
    
    // Verify canvas is removed from list
    cy.get('[data-testid="canvas-list-item"]').contains('Test Canvas for Actual Deletion').should('not.exist')
    
    // Take screenshot
    cy.screenshot('canvas-deleted-successfully')
  })

  it('should handle delete errors gracefully', () => {
    // This test would require mocking the API to return an error
    // For now, we'll just verify the UI handles the loading state
    
    cy.visit('/')
    cy.login()
    
    // Create a canvas using the UI
    cy.get('[data-testid="create-canvas-button"]').click()
    cy.get('[data-testid="canvas-title-input"]').type('Test Canvas for Error Handling')
    cy.get('[data-testid="canvas-description-input"]').type('Description for error test')
    cy.get('[data-testid="create-canvas-submit"]').click()
    
    // Wait for canvas to appear in the list
    cy.get('[data-testid="canvas-list"]').should('contain', 'Test Canvas for Error Handling')
    
    // Hover and click delete
    cy.get('[data-testid="canvas-list-item"]').contains('Test Canvas for Error Handling').parent().trigger('mouseover')
    cy.get('button[aria-label*="Delete canvas"]').click()
    
    // Click delete button in modal
    cy.contains('Delete Canvas').click()
    
    // The button should show loading state briefly
    cy.contains('Deleting...').should('be.visible')
    
    // Take screenshot
    cy.screenshot('delete-loading-state')
  })
})
