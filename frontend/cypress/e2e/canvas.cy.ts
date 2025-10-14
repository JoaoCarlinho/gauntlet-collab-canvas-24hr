describe('Canvas Functionality', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/')
  })

  it('should create a new canvas', () => {
    cy.createCanvas('Test Canvas', 'Test Description')
    cy.contains('Test Canvas').should('be.visible')
    cy.contains('Test Description').should('be.visible')
  })

  it('should navigate to canvas page', () => {
    cy.createCanvas('Test Canvas')
    cy.contains('Test Canvas').click()
    cy.url().should('include', '/canvas/')
    cy.contains('Test Canvas').should('be.visible')
  })

  it('should display canvas tools', () => {
    cy.createCanvas('Test Canvas')
    cy.contains('Test Canvas').click()
    cy.contains('Select').should('be.visible')
    cy.contains('Rectangle').should('be.visible')
    cy.contains('Circle').should('be.visible')
    cy.contains('Text').should('be.visible')
  })

  it('should show connection status', () => {
    cy.createCanvas('Test Canvas')
    cy.contains('Test Canvas').click()
    cy.contains('Connected').should('be.visible')
  })
})
