describe('Authenticated Object Visibility Test', () => {
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

  it('should test the complete user journey with authentication', () => {
    // Visit the production application
    cy.visit('https://gauntlet-collab-canvas-24hr.vercel.app')
    
    // Take screenshot of initial login state
    cy.screenshot('01-initial-login-state')
    
    // Wait for page to load
    cy.wait(3000)
    
    // Take screenshot after load
    cy.screenshot('02-after-page-load')
    
    // Look for and click the login button
    cy.get('body').then(($body) => {
      const loginButtons = $body.find('button:contains("Sign"), button:contains("Login"), [data-testid*="sign"], [data-testid*="login"]')
      
      if (loginButtons.length > 0) {
        cy.log(`Found ${loginButtons.length} login buttons`)
        
        // Take screenshot of login buttons
        cy.screenshot('03-login-buttons-found')
        
        // Click the first login button
        cy.get('button:contains("Sign"), button:contains("Login")').first().click({ force: true })
        
        // Wait for authentication flow
        cy.wait(5000)
        
        // Take screenshot after login attempt
        cy.screenshot('04-after-login-click')
      } else {
        // Take screenshot showing no login buttons
        cy.screenshot('05-no-login-buttons')
      }
    })
    
    // Check if we're now authenticated
    cy.get('body').then(($body) => {
      const bodyText = $body.text()
      cy.log('Body text after login attempt:', bodyText)
      
      // Take screenshot of post-login state
      cy.screenshot('06-post-login-state')
    })
    
    // Look for canvas elements after authentication
    cy.get('body').then(($body) => {
      const canvasElements = $body.find('[data-testid*="canvas"], canvas, [class*="canvas"]')
      cy.log(`Found ${canvasElements.length} canvas-related elements after auth`)
      
      if (canvasElements.length > 0) {
        // Take screenshot of canvas elements
        cy.screenshot('07-canvas-elements-after-auth')
        
        // Try to interact with canvas
        canvasElements.first().click({ force: true })
        cy.wait(1000)
        cy.screenshot('08-after-canvas-interaction')
      } else {
        // Take screenshot showing no canvas elements
        cy.screenshot('09-no-canvas-after-auth')
      }
    })
    
    // Look for add buttons after authentication
    cy.get('body').then(($body) => {
      const addButtons = $body.find('[data-testid*="add"], button:contains("Add"), button:contains("Text"), button:contains("Rectangle")')
      cy.log(`Found ${addButtons.length} add buttons after auth`)
      
      if (addButtons.length > 0) {
        // Take screenshot of add buttons
        cy.screenshot('10-add-buttons-after-auth')
        
        // Click first add button
        addButtons.first().click({ force: true })
        cy.wait(1000)
        cy.screenshot('11-after-add-button-click')
        
        // Try to place object on canvas
        const canvas = $body.find('[data-testid*="canvas"], canvas, [class*="canvas"]')
        if (canvas.length > 0) {
          canvas.first().click(400, 300, { force: true })
          cy.wait(2000)
          cy.screenshot('12-after-object-placement')
          
          // Check if object appeared
          const objects = $body.find('[data-testid*="object"], [class*="object"]')
          cy.log(`Objects found after placement: ${objects.length}`)
          cy.screenshot('13-object-visibility-check')
        }
      } else {
        // Take screenshot showing no add buttons
        cy.screenshot('14-no-add-buttons-after-auth')
      }
    })
  })

  it('should test object visibility with mock authentication', () => {
    // Visit the production application
    cy.visit('https://gauntlet-collab-canvas-24hr.vercel.app')
    
    // Take screenshot of initial state
    cy.screenshot('15-mock-auth-initial')
    
    // Mock authentication by setting localStorage
    cy.window().then((win) => {
      // Mock Firebase auth state
      win.localStorage.setItem('idToken', 'mock-token-for-testing')
      win.localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }))
      
      // Mock Firebase auth object
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
          }
        })
      }
    })
    
    // Reload the page to trigger auth state change
    cy.reload()
    cy.wait(3000)
    
    // Take screenshot after mock authentication
    cy.screenshot('16-after-mock-auth')
    
    // Check if canvas elements are now visible
    cy.get('body').then(($body) => {
      const canvasElements = $body.find('[data-testid*="canvas"], canvas, [class*="canvas"]')
      cy.log(`Found ${canvasElements.length} canvas elements with mock auth`)
      
      if (canvasElements.length > 0) {
        // Take screenshot of canvas elements
        cy.screenshot('17-canvas-with-mock-auth')
        
        // Try to add objects
        const addButtons = $body.find('[data-testid*="add"], button:contains("Add"), button:contains("Text")')
        if (addButtons.length > 0) {
          addButtons.first().click({ force: true })
          cy.wait(1000)
          cy.screenshot('18-after-add-with-mock-auth')
          
          // Place object
          canvasElements.first().click(300, 200, { force: true })
          cy.wait(2000)
          cy.screenshot('19-object-placed-with-mock-auth')
          
          // Check object visibility
          const objects = $body.find('[data-testid*="object"], [class*="object"]')
          cy.log(`Objects visible: ${objects.length}`)
          cy.screenshot('20-final-object-visibility')
        }
      } else {
        // Take screenshot showing no canvas with mock auth
        cy.screenshot('21-no-canvas-with-mock-auth')
      }
    })
  })
})
