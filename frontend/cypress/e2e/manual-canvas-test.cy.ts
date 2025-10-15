describe('Manual Canvas Test - Interactive Mode', () => {
  it('should allow manual navigation to canvas with screenshots', () => {
    // Visit the production application
    cy.visit('/')
    cy.wait(3000)
    cy.screenshot('manual-01-initial-page')
    
    // Wait for page to load
    cy.get('body').should('be.visible')
    cy.screenshot('manual-02-page-loaded')
    
    // Look for login button
    cy.get('body').then(($body) => {
      const buttons = $body.find('button')
      if (buttons.length > 0) {
        cy.screenshot('manual-03-login-button-found')
        
        // Pause here for manual interaction
        cy.log('Please manually click the login button and complete authentication')
        cy.log('After you are logged in and see the canvas, click Resume in Cypress')
        cy.pause() // This will pause the test for manual interaction
        
        // After manual authentication, take screenshots
        cy.screenshot('manual-04-after-manual-auth')
        
        // Look for canvas elements
        cy.get('body').then(($body) => {
          const canvasElements = $body.find('[data-testid*="canvas"], canvas, [class*="canvas"]')
          const addButtons = $body.find('[data-testid*="add"], button:contains("Add")')
          
          cy.screenshot('manual-05-canvas-interface-check')
          
          if (canvasElements.length > 0) {
            cy.screenshot('manual-06-canvas-found')
            
            if (addButtons.length > 0) {
              cy.screenshot('manual-07-add-buttons-found')
              
              // Try to add an object
              cy.get('[data-testid*="add"]').first().click({ force: true })
              cy.wait(1000)
              cy.screenshot('manual-08-after-add-button-click')
              
              // Click on canvas to place object
              cy.get('[data-testid*="canvas"]').first().click(200, 200, { force: true })
              cy.wait(2000)
              cy.screenshot('manual-09-object-placed')
              
              // Check object visibility
              cy.get('body').then(($body) => {
                const objects = $body.find('[data-testid*="object"], [class*="object"]')
                cy.screenshot('manual-10-object-visibility-check')
              })
            } else {
              cy.screenshot('manual-07-no-add-buttons')
            }
          } else {
            cy.screenshot('manual-06-no-canvas-found')
          }
        })
      } else {
        cy.screenshot('manual-03-no-login-button')
      }
    })
    
    // Final screenshot
    cy.screenshot('manual-11-final-state')
  })
})

