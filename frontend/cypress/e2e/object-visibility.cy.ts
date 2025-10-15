describe('Real-time Object Visibility', () => {
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

  it('should immediately show objects after dropping them on canvas', () => {
    // Visit the application
    cy.visit('/')
    
    // Wait for the app to load
    cy.get('[data-testid="home-page"]', { timeout: 10000 }).should('be.visible')
    
    // Create a new canvas
    cy.get('[data-testid="create-canvas-button"]').click()
    cy.get('[data-testid="canvas-title-input"]').type('Test Canvas for Object Visibility')
    cy.get('[data-testid="canvas-description-input"]').type('Testing real-time object visibility')
    cy.get('[data-testid="create-canvas-submit"]').click()
    
    // Wait for canvas page to load
    cy.url().should('include', '/canvas/')
    cy.get('[data-testid="canvas-container"]', { timeout: 10000 }).should('be.visible')
    
    // Wait for canvas to be fully loaded
    cy.get('[data-testid="canvas-area"]').should('be.visible')
    
    // Test adding a text object
    cy.get('[data-testid="add-text-button"]').click()
    
    // Click on canvas to place text object
    cy.get('[data-testid="canvas-area"]').click(400, 300)
    
    // The text object should be immediately visible
    cy.get('[data-testid="canvas-object"]', { timeout: 5000 }).should('be.visible')
    cy.get('[data-testid="canvas-object"]').should('contain.text', 'Text')
    
    // Test adding a rectangle
    cy.get('[data-testid="add-rectangle-button"]').click()
    cy.get('[data-testid="canvas-area"]').click(500, 400)
    
    // The rectangle should be immediately visible
    cy.get('[data-testid="canvas-object"]').should('have.length', 2)
    
    // Test adding a circle
    cy.get('[data-testid="add-circle-button"]').click()
    cy.get('[data-testid="canvas-area"]').click(600, 500)
    
    // The circle should be immediately visible
    cy.get('[data-testid="canvas-object"]').should('have.length', 3)
    
    // Verify all objects are visible and interactive
    cy.get('[data-testid="canvas-object"]').each(($el) => {
      cy.wrap($el).should('be.visible')
      cy.wrap($el).should('have.css', 'pointer-events', 'auto')
    })
  })

  it('should show objects immediately without page refresh', () => {
    // Visit the application
    cy.visit('/')
    
    // Wait for the app to load
    cy.get('[data-testid="home-page"]', { timeout: 10000 }).should('be.visible')
    
    // Create a new canvas
    cy.get('[data-testid="create-canvas-button"]').click()
    cy.get('[data-testid="canvas-title-input"]').type('Immediate Visibility Test')
    cy.get('[data-testid="create-canvas-submit"]').click()
    
    // Wait for canvas page to load
    cy.url().should('include', '/canvas/')
    cy.get('[data-testid="canvas-container"]', { timeout: 10000 }).should('be.visible')
    
    // Add multiple objects quickly
    cy.get('[data-testid="add-text-button"]').click()
    cy.get('[data-testid="canvas-area"]').click(200, 200)
    
    // Object should appear immediately
    cy.get('[data-testid="canvas-object"]', { timeout: 2000 }).should('be.visible')
    
    // Add another object
    cy.get('[data-testid="add-rectangle-button"]').click()
    cy.get('[data-testid="canvas-area"]').click(300, 300)
    
    // Second object should appear immediately
    cy.get('[data-testid="canvas-object"]').should('have.length', 2)
    
    // Verify objects persist without refresh
    cy.reload()
    cy.get('[data-testid="canvas-object"]', { timeout: 10000 }).should('have.length', 2)
  })

  it('should handle real-time updates for multiple users', () => {
    // This test would require multiple browser instances or mocking WebSocket
    // For now, we'll test the basic functionality
    cy.visit('/')
    
    // Wait for the app to load
    cy.get('[data-testid="home-page"]', { timeout: 10000 }).should('be.visible')
    
    // Create a new canvas
    cy.get('[data-testid="create-canvas-button"]').click()
    cy.get('[data-testid="canvas-title-input"]').type('Multi-user Test')
    cy.get('[data-testid="create-canvas-submit"]').click()
    
    // Wait for canvas page to load
    cy.url().should('include', '/canvas/')
    cy.get('[data-testid="canvas-container"]', { timeout: 10000 }).should('be.visible')
    
    // Add an object
    cy.get('[data-testid="add-text-button"]').click()
    cy.get('[data-testid="canvas-area"]').click(400, 400)
    
    // Object should be visible
    cy.get('[data-testid="canvas-object"]', { timeout: 5000 }).should('be.visible')
    
    // Check that WebSocket connection is established
    cy.window().then((win) => {
      // Check if socket service is connected
      expect(win.socketService || win.socket).to.exist
    })
  })
})
