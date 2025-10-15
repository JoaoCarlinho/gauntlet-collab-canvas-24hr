describe('Basic Screenshot Test', () => {
  it('should take basic screenshots', () => {
    cy.visit('/')
    cy.wait(3000)
    cy.screenshot('basic-01-initial')
    
    cy.get('body').should('be.visible')
    cy.screenshot('basic-02-body-visible')
    
    // Just take a few more screenshots
    cy.screenshot('basic-03-page-loaded')
    cy.screenshot('basic-04-final')
  })
})

