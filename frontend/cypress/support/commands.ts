/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>
      createCanvas(title: string, description?: string): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', () => {
  // Mock Firebase auth for testing
  cy.window().then((win) => {
    win.localStorage.setItem('idToken', 'valid-token')
    win.localStorage.setItem('user', JSON.stringify({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User'
    }))
  })
})

Cypress.Commands.add('createCanvas', (title: string, description?: string) => {
  cy.get('[data-testid="new-canvas-button"]').click()
  cy.get('[data-testid="canvas-title-input"]').type(title)
  if (description) {
    cy.get('[data-testid="canvas-description-input"]').type(description)
  }
  cy.get('[data-testid="create-canvas-button"]').click()
})
