describe('Headless Screenshot Test', () => {
  it('should capture screenshots without UI issues', () => {
    // Visit the production application
    cy.visit('/')
    
    // Wait for page to load
    cy.wait(5000)
    
    // Take multiple screenshots
    cy.screenshot('headless-01-initial')
    
    // Check for login elements
    cy.get('body').then(($body) => {
      const bodyText = $body.text()
      cy.log('Page content length:', bodyText.length)
      
      if (bodyText.includes('Sign in') || bodyText.includes('Google')) {
        cy.screenshot('headless-02-login-found')
        
        // Try to find and click sign-in button
        cy.get('button').first().click({ force: true })
        cy.wait(3000)
        cy.screenshot('headless-03-after-signin-click')
        
        // Check if redirected to Google
        cy.url().then((url) => {
          if (url.includes('accounts.google.com')) {
            cy.screenshot('headless-04-google-oauth')
            
            // Try to find email input
            cy.get('body').then(($body) => {
              const emailInput = $body.find('input[type="email"]')
              if (emailInput.length > 0) {
                cy.screenshot('headless-05-email-input-found')
                
                // Type email
                cy.get('input[type="email"]').type('JSkeete@gmail.com')
                cy.screenshot('headless-06-email-entered')
                
                // Look for Next button
                cy.get('button').contains('Next').click({ force: true })
                cy.wait(2000)
                cy.screenshot('headless-07-after-next-click')
                
                // Wait for passkey prompt
                cy.wait(5000)
                cy.screenshot('headless-08-passkey-prompt')
              } else {
                cy.screenshot('headless-05-no-email-input')
              }
            })
          } else {
            cy.screenshot('headless-04-not-google-oauth')
          }
        })
      } else {
        cy.screenshot('headless-02-no-login-found')
      }
    })
    
    // Final screenshot
    cy.screenshot('headless-09-final-state')
  })
})

