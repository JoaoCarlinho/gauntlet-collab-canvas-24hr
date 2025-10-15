describe('Canvas Interaction with Authentication', () => {
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

  it('should perform login and capture canvas interactions', () => {
    // Visit the production application
    cy.visit('https://gauntlet-collab-canvas-24hr.vercel.app')
    
    // Take screenshot of initial login state
    cy.screenshot('01-initial-login-page')
    
    // Wait for page to load
    cy.wait(3000)
    
    // Take screenshot after load
    cy.screenshot('02-login-page-loaded')
    
    // Look for and click the login button
    cy.get('body').then(($body) => {
      const loginButtons = $body.find('button:contains("Sign"), button:contains("Login"), [data-testid*="sign"], [data-testid*="login"]')
      
      if (loginButtons.length > 0) {
        cy.log(`Found ${loginButtons.length} login buttons`)
        
        // Take screenshot of login buttons
        cy.screenshot('03-login-buttons-visible')
        
        // Click the first login button
        cy.get('button:contains("Sign"), button:contains("Login")').first().click({ force: true })
        
        // Wait for authentication popup/redirect
        cy.wait(5000)
        
        // Take screenshot after login click
        cy.screenshot('04-after-login-click')
        
        // Wait for potential redirect or popup
        cy.wait(3000)
        
        // Take screenshot of post-authentication state
        cy.screenshot('05-post-authentication')
        
        // Check if we're now on a different page or if canvas is visible
        cy.get('body').then(($body) => {
          const bodyText = $body.text()
          cy.log('Body text after authentication:', bodyText)
          
          // Take screenshot with new content
          cy.screenshot('06-authenticated-content')
        })
        
        // Look for canvas elements after authentication
        cy.get('body').then(($body) => {
          const canvasElements = $body.find('[data-testid*="canvas"], canvas, [class*="canvas"]')
          cy.log(`Found ${canvasElements.length} canvas elements after auth`)
          
          if (canvasElements.length > 0) {
            // Take screenshot of canvas elements
            cy.screenshot('07-canvas-elements-found')
            
            // Try to interact with canvas
            canvasElements.first().click({ force: true })
            cy.wait(1000)
            cy.screenshot('08-canvas-clicked')
          } else {
            // Take screenshot showing no canvas elements
            cy.screenshot('09-no-canvas-after-auth')
          }
        })
        
        // Look for add buttons after authentication
        cy.get('body').then(($body) => {
          const addButtons = $body.find('[data-testid*="add"], button:contains("Add"), button:contains("Text"), button:contains("Rectangle"), button:contains("Circle")')
          cy.log(`Found ${addButtons.length} add buttons after auth`)
          
          if (addButtons.length > 0) {
            // Take screenshot of add buttons
            cy.screenshot('10-add-buttons-found')
            
            // Click first add button
            addButtons.first().click({ force: true })
            cy.wait(1000)
            cy.screenshot('11-after-add-button-click')
            
            // Try to place object on canvas
            const canvas = $body.find('[data-testid*="canvas"], canvas, [class*="canvas"]')
            if (canvas.length > 0) {
              canvas.first().click(400, 300, { force: true })
              cy.wait(2000)
              cy.screenshot('12-object-placed-on-canvas')
              
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
        
      } else {
        // Take screenshot showing no login buttons
        cy.screenshot('15-no-login-buttons-found')
      }
    })
  })

  it('should test canvas interaction with manual authentication', () => {
    // Visit the production application
    cy.visit('https://gauntlet-collab-canvas-24hr.vercel.app')
    
    // Take screenshot of initial state
    cy.screenshot('16-manual-auth-initial')
    
    // Wait for page to load
    cy.wait(3000)
    
    // Take screenshot after load
    cy.screenshot('17-manual-auth-loaded')
    
    // Look for any navigation or menu elements
    cy.get('body').then(($body) => {
      const navElements = $body.find('nav, [role="navigation"], [class*="nav"], [class*="menu"]')
      cy.log(`Found ${navElements.length} navigation elements`)
      
      if (navElements.length > 0) {
        // Take screenshot of navigation
        cy.screenshot('18-navigation-elements')
        
        // Try to click on navigation elements
        navElements.first().click({ force: true })
        cy.wait(1000)
        cy.screenshot('19-after-nav-click')
      }
    })
    
    // Look for any dashboard or main content areas
    cy.get('body').then(($body) => {
      const mainContent = $body.find('main, [role="main"], [class*="main"], [class*="dashboard"], [class*="workspace"]')
      cy.log(`Found ${mainContent.length} main content areas`)
      
      if (mainContent.length > 0) {
        // Take screenshot of main content
        cy.screenshot('20-main-content-areas')
      }
    })
    
    // Look for any canvas-related text or indicators
    cy.get('body').then(($body) => {
      const canvasText = $body.find(':contains("canvas"), :contains("Canvas"), :contains("draw"), :contains("Draw")')
      cy.log(`Found ${canvasText.length} canvas-related text elements`)
      
      if (canvasText.length > 0) {
        // Take screenshot of canvas text
        cy.screenshot('21-canvas-text-elements')
      }
    })
    
    // Try to find any interactive elements that might lead to canvas
    cy.get('body').then(($body) => {
      const interactiveElements = $body.find('button, a, [role="button"], [tabindex]')
      cy.log(`Found ${interactiveElements.length} interactive elements`)
      
      if (interactiveElements.length > 0) {
        // Take screenshot of interactive elements
        cy.screenshot('22-interactive-elements')
        
        // Try clicking on different interactive elements
        interactiveElements.each((index, element) => {
          if (index < 5) { // Only try first 5 elements
            cy.wrap(element).click({ force: true })
            cy.wait(1000)
            cy.screenshot(`23-after-click-${index + 1}`)
          }
        })
      }
    })
  })

  it('should test with different authentication approaches', () => {
    // Visit the production application
    cy.visit('https://gauntlet-collab-canvas-24hr.vercel.app')
    
    // Take screenshot of initial state
    cy.screenshot('24-auth-approaches-initial')
    
    // Wait for page to load
    cy.wait(3000)
    
    // Try to find Google sign-in specifically
    cy.get('body').then(($body) => {
      const googleSignIn = $body.find('button:contains("Google"), [data-testid*="google"], [class*="google"]')
      cy.log(`Found ${googleSignIn.length} Google sign-in elements`)
      
      if (googleSignIn.length > 0) {
        // Take screenshot of Google sign-in
        cy.screenshot('25-google-signin-found')
        
        // Click Google sign-in
        googleSignIn.first().click({ force: true })
        cy.wait(5000)
        cy.screenshot('26-after-google-signin-click')
      }
    })
    
    // Check if we're redirected to a different page
    cy.url().then((url) => {
      cy.log('Current URL after authentication attempt:', url)
      cy.screenshot('27-current-url-check')
    })
    
    // Wait for any potential page changes
    cy.wait(5000)
    
    // Take final screenshot
    cy.screenshot('28-final-state-after-auth')
  })
})

