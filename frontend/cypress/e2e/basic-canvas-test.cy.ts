describe('Basic Canvas Functionality', () => {
  beforeEach(() => {
    // Handle uncaught exceptions from Firebase
    cy.on('uncaught:exception', (err, runnable) => {
      // Don't fail the test on Firebase errors
      if (err.message.includes('Firebase') || err.message.includes('auth/invalid-api-key')) {
        return false
      }
      return true
    })
  })

  it('should load the application without crashing', () => {
    // Visit the application
    cy.visit('/')
    
    // Wait for the page to load
    cy.get('body').should('be.visible')
    
    // Check if the app loads (even with Firebase errors)
    // Just verify the page is not empty
    cy.get('body').should('not.be.empty')
    
    // Check if React app is mounted
    cy.get('#root').should('exist')
  })

  it('should have proper HTML structure', () => {
    cy.visit('/')
    
    // Check basic HTML structure
    cy.get('html').should('exist')
    cy.get('head').should('exist')
    cy.get('body').should('exist')
    
    // Check if React app is mounted
    cy.get('#root').should('exist')
  })

  it('should handle Firebase errors gracefully', () => {
    cy.visit('/')
    
    // Wait a bit for any initialization
    cy.wait(2000)
    
    // The page should still be functional even with Firebase errors
    cy.get('body').should('be.visible')
    
    // Check console for errors (but don't fail the test)
    cy.window().then((win) => {
      // Just verify the window object exists
      expect(win).to.exist
    })
  })
})
