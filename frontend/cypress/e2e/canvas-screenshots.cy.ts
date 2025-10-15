describe('Canvas Screenshots After Authentication', () => {
  it('should capture canvas screenshots step by step', () => {
    // Step 1: Visit the app
    cy.visit('/')
    cy.wait(3000)
    cy.screenshot('canvas-01-initial-page')
    
    // Step 2: Find and click login button
    cy.get('body').then(($body) => {
      const buttons = $body.find('button')
      if (buttons.length > 0) {
        cy.screenshot('canvas-02-login-button-found')
        
        // Click the first button (should be login)
        cy.get('button').first().click({ force: true })
        cy.wait(3000)
        cy.screenshot('canvas-03-after-login-click')
        
        // Step 3: Handle Google OAuth
        cy.url().then((url) => {
          if (url.includes('accounts.google.com')) {
            cy.screenshot('canvas-04-google-oauth-page')
            
            // Wait for page to fully load
            cy.wait(2000)
            cy.screenshot('canvas-05-google-page-loaded')
            
            // Step 4: Enter email
            cy.get('body').then(($body) => {
              const emailInput = $body.find('input[type="email"]')
              if (emailInput.length > 0) {
                cy.screenshot('canvas-06-email-input-visible')
                
                // Type email
                cy.get('input[type="email"]').type('JSkeete@gmail.com')
                cy.screenshot('canvas-07-email-entered')
                
                // Step 5: Click Next
                cy.get('button').contains('Next').click({ force: true })
                cy.wait(2000)
                cy.screenshot('canvas-08-after-next-click')
                
                // Step 6: Wait for passkey prompt
                cy.wait(3000)
                cy.screenshot('canvas-09-passkey-prompt')
                
                // Step 7: Wait longer for manual passkey entry
                cy.wait(10000)
                cy.screenshot('canvas-10-after-passkey-wait')
                
                // Step 8: Check if we're back to the app
                cy.url().then((url) => {
                  if (url.includes('gauntlet-collab-canvas-24hr.vercel.app')) {
                    cy.screenshot('canvas-11-back-to-app')
                    
                    // Step 9: Look for dashboard/canvas elements
                    cy.wait(2000)
                    cy.screenshot('canvas-12-dashboard-loaded')
                    
                    // Step 10: Look for canvas interface
                    cy.get('body').then(($body) => {
                      const canvasElements = $body.find('[data-testid*="canvas"], canvas, [class*="canvas"]')
                      const addButtons = $body.find('[data-testid*="add"], button:contains("Add")')
                      
                      cy.screenshot('canvas-13-canvas-interface-check')
                      
                      if (canvasElements.length > 0) {
                        cy.screenshot('canvas-14-canvas-found')
                        
                        if (addButtons.length > 0) {
                          cy.screenshot('canvas-15-add-buttons-found')
                          
                          // Step 11: Try to add an object
                          cy.get('[data-testid*="add"]').first().click({ force: true })
                          cy.wait(1000)
                          cy.screenshot('canvas-16-after-add-button-click')
                          
                          // Step 12: Click on canvas to place object
                          cy.get('[data-testid*="canvas"]').first().click(200, 200, { force: true })
                          cy.wait(2000)
                          cy.screenshot('canvas-17-object-placed')
                          
                          // Step 13: Check object visibility
                          cy.get('body').then(($body) => {
                            const objects = $body.find('[data-testid*="object"], [class*="object"]')
                            cy.screenshot('canvas-18-object-visibility-check')
                          })
                        } else {
                          cy.screenshot('canvas-15-no-add-buttons')
                        }
                      } else {
                        cy.screenshot('canvas-14-no-canvas-found')
                      }
                    })
                  } else {
                    cy.screenshot('canvas-11-not-back-to-app')
                  }
                })
              } else {
                cy.screenshot('canvas-06-no-email-input')
              }
            })
          } else {
            cy.screenshot('canvas-04-not-google-oauth')
          }
        })
      } else {
        cy.screenshot('canvas-02-no-login-button')
      }
    })
    
    // Final screenshot
    cy.screenshot('canvas-19-final-state')
  })
})

