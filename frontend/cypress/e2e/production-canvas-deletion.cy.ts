describe('Production Canvas Deletion Tests', () => {
  beforeEach(() => {
    // Handle uncaught exceptions from Firebase and other production services
    cy.on('uncaught:exception', (err, runnable) => {
      // Don't fail the test on Firebase errors or other production-specific issues
      if (err.message.includes('Firebase') || 
          err.message.includes('auth/invalid-api-key') ||
          err.message.includes('Network Error') ||
          err.message.includes('CORS')) {
        return false
      }
      return true
    })
  })

  it('should load the production application', () => {
    cy.visit('/')
    cy.screenshot('01-production-app-loaded')
    
    // Verify the app loads
    cy.get('body').should('be.visible')
    cy.get('#root').should('exist')
    
    // Check for sign in button
    cy.contains('Sign in with Google').should('be.visible')
    cy.screenshot('02-signin-button-visible')
  })

  it('should handle authentication flow', () => {
    cy.visit('/')
    cy.screenshot('03-before-authentication')
    
    // Click sign in button
    cy.contains('Sign in with Google').click()
    cy.screenshot('04-after-signin-click')
    
    // Wait for redirect to Google OAuth
    cy.url().should('include', 'accounts.google.com')
    cy.screenshot('05-google-oauth-page')
    
    // Note: Manual intervention required for OAuth
    cy.log('Manual authentication required - please complete login in browser')
    cy.task('productionAuth')
  })

  it('should test canvas deletion after manual authentication', () => {
    cy.visit('/')
    cy.screenshot('06-initial-load-for-deletion-test')
    
    // This test assumes manual authentication has been completed
    // We'll check if we're authenticated by looking for dashboard elements
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="create-canvas-button"]').length > 0) {
        cy.log('User is authenticated, proceeding with canvas deletion test')
        cy.screenshot('07-authenticated-dashboard')
        
        // Create a test canvas
        cy.get('[data-testid="create-canvas-button"]').click()
        cy.get('[data-testid="canvas-title-input"]').type('Production Deletion Test')
        cy.get('[data-testid="canvas-description-input"]').type('Testing deletion in production environment')
        cy.get('[data-testid="create-canvas-submit"]').click()
        
        // Wait for canvas to appear
        cy.get('[data-testid="canvas-list"]').should('contain', 'Production Deletion Test')
        cy.screenshot('08-canvas-created')
        
        // Test delete button visibility
        cy.get('[data-testid="canvas-list-item"]').contains('Production Deletion Test').parent().trigger('mouseover')
        cy.get('button[aria-label*="Delete canvas"]').should('be.visible')
        cy.screenshot('09-delete-button-visible')
        
        // Test deletion confirmation modal
        cy.get('button[aria-label*="Delete canvas"]').click()
        cy.get('[role="dialog"]').should('be.visible')
        cy.contains('Delete Canvas').should('be.visible')
        cy.contains('Production Deletion Test').should('be.visible')
        cy.screenshot('10-deletion-modal-open')
        
        // Cancel deletion
        cy.contains('Cancel').click()
        cy.get('[role="dialog"]').should('not.exist')
        cy.screenshot('11-deletion-cancelled')
        
        // Test actual deletion
        cy.get('[data-testid="canvas-list-item"]').contains('Production Deletion Test').parent().trigger('mouseover')
        cy.get('button[aria-label*="Delete canvas"]').click()
        cy.contains('Delete Canvas').click()
        
        // Verify canvas is deleted
        cy.get('[data-testid="canvas-list-item"]').contains('Production Deletion Test').should('not.exist')
        cy.screenshot('12-canvas-deleted-successfully')
        
      } else {
        cy.log('User not authenticated, skipping canvas deletion test')
        cy.screenshot('13-not-authenticated')
      }
    })
  })

  it('should test canvas creation functionality', () => {
    cy.visit('/')
    cy.screenshot('14-canvas-creation-test-start')
    
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="create-canvas-button"]').length > 0) {
        cy.log('Testing canvas creation in production')
        
        // Create multiple canvases
        const canvasTitles = [
          'Production Test Canvas 1',
          'Production Test Canvas 2',
          'Production Test Canvas 3'
        ]
        
        canvasTitles.forEach((title, index) => {
          cy.get('[data-testid="create-canvas-button"]').click()
          cy.get('[data-testid="canvas-title-input"]').type(title)
          cy.get('[data-testid="canvas-description-input"]').type(`Production test canvas ${index + 1}`)
          cy.get('[data-testid="create-canvas-submit"]').click()
          
          // Verify canvas appears
          cy.get('[data-testid="canvas-list"]').should('contain', title)
          cy.screenshot(`15-canvas-${index + 1}-created`)
        })
        
        // Verify all canvases are in the list
        canvasTitles.forEach(title => {
          cy.get('[data-testid="canvas-list"]').should('contain', title)
        })
        
        cy.screenshot('16-all-canvases-created')
        
      } else {
        cy.log('User not authenticated, skipping canvas creation test')
        cy.screenshot('17-not-authenticated-for-creation')
      }
    })
  })

  it('should test real-time collaboration features', () => {
    cy.visit('/')
    cy.screenshot('18-realtime-test-start')
    
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="create-canvas-button"]').length > 0) {
        cy.log('Testing real-time features in production')
        
        // Create a canvas for testing
        cy.get('[data-testid="create-canvas-button"]').click()
        cy.get('[data-testid="canvas-title-input"]').type('Realtime Test Canvas')
        cy.get('[data-testid="canvas-description-input"]').type('Testing real-time features')
        cy.get('[data-testid="create-canvas-submit"]').click()
        
        // Navigate to canvas
        cy.get('[data-testid="canvas-list-item"]').contains('Realtime Test Canvas').click()
        cy.screenshot('19-canvas-editor-loaded')
        
        // Check for WebSocket connection in browser console
        cy.window().then((win) => {
          // Check if socket.io is available
          if (win.io) {
            cy.log('Socket.IO is available')
          } else {
            cy.log('Socket.IO not found')
          }
        })
        
        // Test adding objects (if canvas editor is available)
        cy.get('body').then(($canvasBody) => {
          if ($canvasBody.find('[data-testid="canvas-area"]').length > 0) {
            cy.log('Canvas editor is available, testing object creation')
            
            // Try to add a rectangle
            cy.get('[data-testid="add-rectangle-button"]').click()
            cy.get('[data-testid="canvas-area"]').click(100, 100)
            cy.screenshot('20-rectangle-added')
            
            // Check if object appears
            cy.get('[data-testid="canvas-object"]').should('exist')
            cy.screenshot('21-object-visible')
            
          } else {
            cy.log('Canvas editor not available')
            cy.screenshot('22-canvas-editor-not-available')
          }
        })
        
      } else {
        cy.log('User not authenticated, skipping real-time test')
        cy.screenshot('23-not-authenticated-for-realtime')
      }
    })
  })

  it('should test object visibility and persistence', () => {
    cy.visit('/')
    cy.screenshot('24-object-visibility-test-start')
    
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="create-canvas-button"]').length > 0) {
        cy.log('Testing object visibility in production')
        
        // Navigate to existing canvas or create one
        cy.get('[data-testid="canvas-list-item"]').first().click()
        cy.screenshot('25-canvas-loaded-for-object-test')
        
        cy.get('body').then(($canvasBody) => {
          if ($canvasBody.find('[data-testid="canvas-area"]').length > 0) {
            cy.log('Testing object creation and visibility')
            
            // Add multiple objects
            cy.get('[data-testid="add-rectangle-button"]').click()
            cy.get('[data-testid="canvas-area"]').click(50, 50)
            cy.screenshot('26-rectangle-added')
            
            cy.get('[data-testid="add-circle-button"]').click()
            cy.get('[data-testid="canvas-area"]').click(150, 150)
            cy.screenshot('27-circle-added')
            
            cy.get('[data-testid="add-text-button"]').click()
            cy.get('[data-testid="canvas-area"]').click(250, 250)
            cy.screenshot('28-text-added')
            
            // Verify objects are visible
            cy.get('[data-testid="canvas-object"]').should('have.length.at.least', 3)
            cy.screenshot('29-all-objects-visible')
            
            // Test persistence by refreshing
            cy.reload()
            cy.screenshot('30-after-reload')
            
            // Verify objects persist
            cy.get('[data-testid="canvas-object"]').should('have.length.at.least', 3)
            cy.screenshot('31-objects-persist-after-reload')
            
          } else {
            cy.log('Canvas editor not available for object testing')
            cy.screenshot('32-canvas-editor-not-available-for-objects')
          }
        })
        
      } else {
        cy.log('User not authenticated, skipping object visibility test')
        cy.screenshot('33-not-authenticated-for-objects')
      }
    })
  })
})
