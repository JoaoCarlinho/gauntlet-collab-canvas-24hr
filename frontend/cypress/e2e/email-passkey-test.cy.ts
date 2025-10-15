describe('Email and Passkey Authentication Test', () => {
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

  it('should navigate to Google OAuth and pause for email/passkey input', () => {
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
        cy.wait(2000)
        
        // Take screenshot after login click
        cy.screenshot('04-after-login-click')
        
        // Wait for Google OAuth to load
        cy.wait(3000)
        
        // Take screenshot of Google OAuth page
        cy.screenshot('05-google-oauth-page')
        
        // Look for email input field
        cy.get('body').then(($body) => {
          const emailInputs = $body.find('input[type="email"], input[name="identifier"], input[placeholder*="email"], input[placeholder*="Email"]')
          
          if (emailInputs.length > 0) {
            cy.log(`Found ${emailInputs.length} email input fields`)
            
            // Take screenshot of email input field
            cy.screenshot('06-email-input-field')
            
            // Type the email address
            cy.get('input[type="email"], input[name="identifier"], input[placeholder*="email"], input[placeholder*="Email"]').first().type('JSkeete@gmail.com')
            
            // Take screenshot after typing email
            cy.screenshot('07-email-entered')
            
            // Look for Next button or Enter key
            cy.get('body').then(($body) => {
              const nextButtons = $body.find('button:contains("Next"), button:contains("Continue"), button[type="submit"], #identifierNext')
              
              if (nextButtons.length > 0) {
                cy.log(`Found ${nextButtons.length} next buttons`)
                
                // Take screenshot of next button
                cy.screenshot('08-next-button-visible')
                
                // Click Next button
                cy.get('button:contains("Next"), button:contains("Continue"), button[type="submit"], #identifierNext').first().click({ force: true })
                
                // Wait for passkey prompt
                cy.wait(3000)
                
                // Take screenshot of passkey prompt
                cy.screenshot('09-passkey-prompt')
                
                // Pause here for manual passkey input
                cy.pause('Please enter your passkey now. The system is waiting for your authentication. Click "Resume" after entering your passkey.')
                
                // After passkey entry, wait and take screenshots
                cy.wait(5000)
                cy.screenshot('10-after-passkey-entry')
                
                // Check if we're redirected back to the app
                cy.url().then((url) => {
                  cy.log('Current URL after authentication:', url)
                  cy.screenshot('11-current-url-after-auth')
                })
                
                // Wait for app to load
                cy.wait(3000)
                
                // Take screenshot of authenticated app
                cy.screenshot('12-authenticated-app')
                
                // Look for canvas elements
                cy.get('body').then(($body) => {
                  const canvasElements = $body.find('[data-testid*="canvas"], canvas, [class*="canvas"]')
                  cy.log(`Found ${canvasElements.length} canvas elements`)
                  
                  if (canvasElements.length > 0) {
                    cy.screenshot('13-canvas-elements-found')
                    
                    // Try to interact with canvas
                    canvasElements.first().click({ force: true })
                    cy.wait(1000)
                    cy.screenshot('14-canvas-clicked')
                  } else {
                    cy.screenshot('15-no-canvas-elements')
                  }
                })
                
                // Look for add buttons
                cy.get('body').then(($body) => {
                  const addButtons = $body.find('[data-testid*="add"], button:contains("Add"), button:contains("Text"), button:contains("Rectangle"), button:contains("Circle")')
                  cy.log(`Found ${addButtons.length} add buttons`)
                  
                  if (addButtons.length > 0) {
                    cy.screenshot('16-add-buttons-found')
                    
                    // Click first add button
                    addButtons.first().click({ force: true })
                    cy.wait(1000)
                    cy.screenshot('17-after-add-button-click')
                    
                    // Try to place object on canvas
                    const canvas = $body.find('[data-testid*="canvas"], canvas, [class*="canvas"]')
                    if (canvas.length > 0) {
                      canvas.first().click(400, 300, { force: true })
                      cy.wait(2000)
                      cy.screenshot('18-object-placed-on-canvas')
                      
                      // Check if object appeared
                      const objects = $body.find('[data-testid*="object"], [class*="object"]')
                      cy.log(`Objects found after placement: ${objects.length}`)
                      cy.screenshot('19-object-visibility-check')
                    }
                  } else {
                    cy.screenshot('20-no-add-buttons')
                  }
                })
                
                // Final comprehensive screenshot
                cy.screenshot('21-final-authenticated-state')
                
              } else {
                // Try pressing Enter if no Next button found
                cy.get('input[type="email"], input[name="identifier"], input[placeholder*="email"], input[placeholder*="Email"]').first().type('{enter}')
                
                // Wait for passkey prompt
                cy.wait(3000)
                cy.screenshot('22-passkey-prompt-after-enter')
                
                // Pause for manual passkey input
                cy.pause('Please enter your passkey now. Click "Resume" after entering your passkey.')
                
                // Continue with authentication flow
                cy.wait(5000)
                cy.screenshot('23-after-passkey-entry')
              }
            })
            
          } else {
            // If no email input found, take screenshot and pause
            cy.screenshot('24-no-email-input-found')
            cy.pause('No email input field found. Please manually enter JSkeete@gmail.com and continue with passkey authentication.')
          }
        })
        
      } else {
        cy.screenshot('25-no-login-buttons')
        cy.pause('No login buttons found. Please manually start the authentication process.')
      }
    })
  })

  it('should handle the complete authentication flow', () => {
    // This test assumes we're already in the OAuth flow
    cy.visit('https://gauntlet-collab-canvas-24hr.vercel.app')
    
    // Wait for any existing authentication state
    cy.wait(3000)
    
    // Take screenshot of current state
    cy.screenshot('26-authentication-flow-initial')
    
    // Check if we're already authenticated
    cy.get('body').then(($body) => {
      const bodyText = $body.text()
      cy.log('Current page content:', bodyText)
      
      // Take screenshot of current content
      cy.screenshot('27-current-page-content')
      
      // Look for any canvas or authenticated content
      const canvasElements = $body.find('[data-testid*="canvas"], canvas, [class*="canvas"]')
      const userElements = $body.find('[class*="user"], [class*="profile"], [class*="account"]')
      
      if (canvasElements.length > 0 || userElements.length > 0) {
        cy.log('Appears to be authenticated')
        cy.screenshot('28-appears-authenticated')
        
        // Test canvas functionality
        if (canvasElements.length > 0) {
          canvasElements.first().click({ force: true })
          cy.wait(1000)
          cy.screenshot('29-canvas-interaction')
        }
      } else {
        cy.log('Not authenticated, need to login')
        cy.screenshot('30-not-authenticated')
      }
    })
  })
})

