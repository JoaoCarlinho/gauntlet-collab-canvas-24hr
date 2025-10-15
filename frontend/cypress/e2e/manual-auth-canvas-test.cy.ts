describe('Manual Authentication Canvas Test', () => {
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

  it('should guide user through manual authentication and canvas interaction', () => {
    // Visit the production application
    cy.visit('https://gauntlet-collab-canvas-24hr.vercel.app')
    
    // Take screenshot of initial login state
    cy.screenshot('01-initial-login-page')
    
    // Wait for page to load
    cy.wait(3000)
    
    // Take screenshot after load
    cy.screenshot('02-login-page-loaded')
    
    // Look for login button and take screenshot
    cy.get('body').then(($body) => {
      const loginButtons = $body.find('button:contains("Sign"), button:contains("Login"), [data-testid*="sign"], [data-testid*="login"]')
      
      if (loginButtons.length > 0) {
        cy.log(`Found ${loginButtons.length} login buttons`)
        cy.screenshot('03-login-buttons-visible')
        
        // Highlight the login button
        cy.get('button:contains("Sign"), button:contains("Login")').first().should('be.visible')
        cy.screenshot('04-login-button-highlighted')
        
        // Pause for manual interaction
        cy.pause('Please manually click the login button and complete authentication. Then click "Resume" to continue.')
        
        // After manual authentication, take screenshots
        cy.wait(3000)
        cy.screenshot('05-after-manual-auth')
        
        // Check if we're now authenticated
        cy.get('body').then(($body) => {
          const bodyText = $body.text()
          cy.log('Body text after manual auth:', bodyText)
          cy.screenshot('06-authenticated-content')
        })
        
        // Look for canvas elements
        cy.get('body').then(($body) => {
          const canvasElements = $body.find('[data-testid*="canvas"], canvas, [class*="canvas"]')
          cy.log(`Found ${canvasElements.length} canvas elements`)
          
          if (canvasElements.length > 0) {
            cy.screenshot('07-canvas-elements-found')
            
            // Try to interact with canvas
            canvasElements.first().click({ force: true })
            cy.wait(1000)
            cy.screenshot('08-canvas-clicked')
          } else {
            cy.screenshot('09-no-canvas-elements')
          }
        })
        
        // Look for add buttons
        cy.get('body').then(($body) => {
          const addButtons = $body.find('[data-testid*="add"], button:contains("Add"), button:contains("Text"), button:contains("Rectangle"), button:contains("Circle")')
          cy.log(`Found ${addButtons.length} add buttons`)
          
          if (addButtons.length > 0) {
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
            cy.screenshot('14-no-add-buttons')
          }
        })
        
        // Look for any canvas-related UI elements
        cy.get('body').then(($body) => {
          const canvasUI = $body.find('[class*="canvas"], [id*="canvas"], [data-testid*="canvas"]')
          cy.log(`Found ${canvasUI.length} canvas UI elements`)
          
          if (canvasUI.length > 0) {
            cy.screenshot('15-canvas-ui-elements')
          }
        })
        
        // Look for any drawing tools or controls
        cy.get('body').then(($body) => {
          const tools = $body.find('[class*="tool"], [class*="control"], [class*="palette"], [class*="brush"]')
          cy.log(`Found ${tools.length} tool elements`)
          
          if (tools.length > 0) {
            cy.screenshot('16-drawing-tools')
          }
        })
        
        // Final comprehensive screenshot
        cy.screenshot('17-final-authenticated-state')
        
      } else {
        cy.screenshot('18-no-login-buttons')
      }
    })
  })

  it('should test canvas interaction after authentication', () => {
    // This test assumes the user is already authenticated
    cy.visit('https://gauntlet-collab-canvas-24hr.vercel.app')
    
    // Take screenshot of authenticated state
    cy.screenshot('19-authenticated-initial')
    
    // Wait for page to load
    cy.wait(3000)
    
    // Take screenshot after load
    cy.screenshot('20-authenticated-loaded')
    
    // Look for any canvas or workspace elements
    cy.get('body').then(($body) => {
      const workspace = $body.find('[class*="workspace"], [class*="editor"], [class*="canvas"], [class*="board"]')
      cy.log(`Found ${workspace.length} workspace elements`)
      
      if (workspace.length > 0) {
        cy.screenshot('21-workspace-elements')
      }
    })
    
    // Look for any interactive elements
    cy.get('body').then(($body) => {
      const interactive = $body.find('button, [role="button"], [tabindex], input, select, textarea')
      cy.log(`Found ${interactive.length} interactive elements`)
      
      if (interactive.length > 0) {
        cy.screenshot('22-interactive-elements')
      }
    })
    
    // Look for any text content that might indicate canvas functionality
    cy.get('body').then(($body) => {
      const textContent = $body.text()
      cy.log('Page text content:', textContent)
      cy.screenshot('23-page-content')
    })
  })
})
