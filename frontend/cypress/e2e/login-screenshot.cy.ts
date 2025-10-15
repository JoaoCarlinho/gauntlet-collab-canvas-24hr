describe('Login Screenshot Test', () => {
  it('should capture login flow screenshots', () => {
    // Visit the production application
    cy.visit('/')
    cy.wait(3000)
    cy.screenshot('login-01-initial-page')
    
    // Check if page loaded
    cy.get('body').should('be.visible')
    cy.screenshot('login-02-body-visible')
    
    // Look for login elements
    cy.get('body').then(($body) => {
      const bodyText = $body.text()
      cy.log('Page content length:', bodyText.length)
      
      if (bodyText.includes('Sign in') || bodyText.includes('Google')) {
        cy.screenshot('login-03-login-elements-found')
        
        // Try to find and click sign-in button
        const buttons = $body.find('button')
        if (buttons.length > 0) {
          cy.screenshot('login-04-buttons-found')
          
          // Click first button
          cy.get('button').first().click({ force: true })
          cy.wait(3000)
          cy.screenshot('login-05-after-signin-click')
          
          // Check if redirected to Google
          cy.url().then((url) => {
            if (url.includes('accounts.google.com')) {
              cy.screenshot('login-06-google-oauth-page')
              
              // Wait a bit for page to load
              cy.wait(2000)
              cy.screenshot('login-07-google-page-loaded')
              
              // Try to find email input
              cy.get('body').then(($body) => {
                const emailInput = $body.find('input[type="email"]')
                if (emailInput.length > 0) {
                  cy.screenshot('login-08-email-input-found')
                  
                  // Type email
                  cy.get('input[type="email"]').type('JSkeete@gmail.com')
                  cy.screenshot('login-09-email-entered')
                  
                  // Look for Next button
                  cy.get('body').then(($body) => {
                    const nextButton = $body.find('button').filter((i, el) => 
                      el.textContent?.includes('Next') || 
                      el.textContent?.includes('Continue')
                    )
                    
                    if (nextButton.length > 0) {
                      cy.screenshot('login-10-next-button-found')
                      
                      // Click Next button
                      cy.get('button').contains('Next').click({ force: true })
                      cy.wait(2000)
                      cy.screenshot('login-11-after-next-click')
                      
                      // Wait for passkey prompt
                      cy.wait(3000)
                      cy.screenshot('login-12-passkey-prompt')
                      
                      // Wait longer for manual passkey entry
                      cy.wait(5000)
                      cy.screenshot('login-13-after-passkey-wait')
                      
                      // Check if we're back to the app
                      cy.url().then((url) => {
                        if (url.includes('gauntlet-collab-canvas-24hr.vercel.app')) {
                          cy.screenshot('login-14-back-to-app')
                          
                          // Look for canvas elements
                          cy.get('body').then(($body) => {
                            const canvasElements = $body.find('[data-testid*="canvas"], canvas, [class*="canvas"]')
                            cy.log('Canvas elements found:', canvasElements.length)
                            cy.screenshot('login-15-canvas-elements-check')
                            
                            if (canvasElements.length > 0) {
                              cy.screenshot('login-16-canvas-found')
                              
                              // Look for add buttons
                              const addButtons = $body.find('[data-testid*="add"], button:contains("Add")')
                              if (addButtons.length > 0) {
                                cy.screenshot('login-17-add-buttons-found')
                                
                                // Click first add button
                                cy.get('[data-testid*="add"]').first().click({ force: true })
                                cy.wait(1000)
                                cy.screenshot('login-18-after-add-button-click')
                                
                                // Click on canvas to place object
                                cy.get('[data-testid*="canvas"]').first().click(200, 200, { force: true })
                                cy.wait(2000)
                                cy.screenshot('login-19-object-placed')
                                
                                // Check if object is visible
                                cy.get('body').then(($body) => {
                                  const objects = $body.find('[data-testid*="object"], [class*="object"]')
                                  cy.log('Objects visible:', objects.length)
                                  cy.screenshot('login-20-object-visibility-check')
                                })
                              } else {
                                cy.screenshot('login-17-no-add-buttons')
                              }
                            } else {
                              cy.screenshot('login-16-no-canvas-found')
                            }
                          })
                        } else {
                          cy.screenshot('login-14-not-back-to-app')
                        }
                      })
                    } else {
                      cy.screenshot('login-10-no-next-button')
                    }
                  })
                } else {
                  cy.screenshot('login-08-no-email-input')
                }
              })
            } else {
              cy.screenshot('login-06-not-google-oauth')
            }
          })
        } else {
          cy.screenshot('login-04-no-buttons')
        }
      } else {
        cy.screenshot('login-03-no-login-elements')
      }
    })
    
    // Final screenshot
    cy.screenshot('login-21-final-state')
  })
})

