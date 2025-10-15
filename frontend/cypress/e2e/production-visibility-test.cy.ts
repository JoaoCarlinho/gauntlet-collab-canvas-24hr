describe('Production Object Visibility Test', () => {
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

  it('should load the production application and take screenshots', () => {
    // Visit the production application
    cy.visit('https://gauntlet-collab-canvas-24hr.vercel.app')
    
    // Take screenshot of initial load
    cy.screenshot('01-production-initial-load')
    
    // Wait for page to load
    cy.wait(5000)
    
    // Take screenshot after wait
    cy.screenshot('02-production-after-wait')
    
    // Check what's actually on the page
    cy.get('body').then(($body) => {
      const bodyText = $body.text()
      cy.log('Body text:', bodyText)
      
      // Take screenshot of page content
      cy.screenshot('03-production-page-content')
    })
    
    // Check for specific elements
    cy.get('body').then(($body) => {
      const html = $body.html()
      cy.log('HTML content length:', html.length)
      
      // Take screenshot showing HTML structure
      cy.screenshot('04-production-html-structure')
    })
    
    // Try to find any interactive elements
    cy.get('body').then(($body) => {
      const buttons = $body.find('button')
      const inputs = $body.find('input')
      const divs = $body.find('div')
      
      cy.log(`Found ${buttons.length} buttons`)
      cy.log(`Found ${inputs.length} inputs`)
      cy.log(`Found ${divs.length} divs`)
      
      // Take screenshot of element analysis
      cy.screenshot('05-production-element-analysis')
    })
    
    // Look for canvas-related elements
    cy.get('body').then(($body) => {
      const canvasElements = $body.find('[data-testid*="canvas"], canvas, [class*="canvas"]')
      cy.log(`Found ${canvasElements.length} canvas-related elements`)
      
      // Take screenshot of canvas elements
      cy.screenshot('06-production-canvas-elements')
    })
    
    // Final screenshot
    cy.screenshot('07-production-final-state')
  })

  it('should test authentication flow', () => {
    // Visit the production application
    cy.visit('https://gauntlet-collab-canvas-24hr.vercel.app')
    
    // Take screenshot of initial state
    cy.screenshot('08-auth-initial-state')
    
    // Wait for page to load
    cy.wait(3000)
    
    // Take screenshot after load
    cy.screenshot('09-auth-after-load')
    
    // Look for sign-in elements
    cy.get('body').then(($body) => {
      const signInElements = $body.find('button:contains("Sign"), button:contains("Login"), [data-testid*="sign"], [data-testid*="login"]')
      cy.log(`Found ${signInElements.length} sign-in elements`)
      
      // Take screenshot of sign-in elements
      cy.screenshot('10-auth-signin-elements')
    })
    
    // Check for any error messages
    cy.get('body').then(($body) => {
      const errorElements = $body.find('[class*="error"], [class*="Error"], .error, .Error')
      cy.log(`Found ${errorElements.length} error elements`)
      
      // Take screenshot of error elements
      cy.screenshot('11-auth-error-elements')
    })
  })

  it('should test canvas functionality if available', () => {
    // Visit the production application
    cy.visit('https://gauntlet-collab-canvas-24hr.vercel.app')
    
    // Take screenshot of initial state
    cy.screenshot('12-canvas-test-initial')
    
    // Wait for page to load
    cy.wait(5000)
    
    // Take screenshot after load
    cy.screenshot('13-canvas-test-after-load')
    
    // Look for canvas elements
    cy.get('body').then(($body) => {
      const canvasElements = $body.find('[data-testid*="canvas"], canvas, [class*="canvas"]')
      cy.log(`Found ${canvasElements.length} canvas-related elements`)
      
      if (canvasElements.length > 0) {
        // Take screenshot of canvas elements
        cy.screenshot('14-canvas-elements-found')
        
        // Try to interact with canvas
        canvasElements.first().click({ force: true })
        cy.wait(1000)
        cy.screenshot('15-after-canvas-click')
      } else {
        // Take screenshot showing no canvas elements
        cy.screenshot('16-no-canvas-elements')
      }
    })
    
    // Look for add buttons
    cy.get('body').then(($body) => {
      const addButtons = $body.find('[data-testid*="add"], button:contains("Add"), button:contains("Text"), button:contains("Rectangle")')
      cy.log(`Found ${addButtons.length} add buttons`)
      
      if (addButtons.length > 0) {
        // Take screenshot of add buttons
        cy.screenshot('17-add-buttons-found')
        
        // Click first add button
        addButtons.first().click({ force: true })
        cy.wait(1000)
        cy.screenshot('18-after-add-button-click')
      } else {
        // Take screenshot showing no add buttons
        cy.screenshot('19-no-add-buttons')
      }
    })
  })
})

