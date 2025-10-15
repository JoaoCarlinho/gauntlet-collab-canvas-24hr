describe('Simple Screenshot Test', () => {
  it('should take screenshots of the production app', () => {
    // Visit the production application
    cy.visit('/')
    
    // Wait for page to load
    cy.wait(3000)
    
    // Take screenshot of initial page
    cy.screenshot('01-initial-page')
    
    // Check if page loaded
    cy.get('body').should('be.visible')
    cy.screenshot('02-body-visible')
    
    // Look for any buttons
    cy.get('body').then(($body) => {
      const buttons = $body.find('button')
      if (buttons.length > 0) {
        cy.screenshot('03-buttons-found')
        
        // Click first button
        cy.get('button').first().click({ force: true })
        cy.wait(2000)
        cy.screenshot('04-after-button-click')
      } else {
        cy.screenshot('03-no-buttons')
      }
    })
    
    // Final screenshot
    cy.screenshot('05-final-state')
  })
})

