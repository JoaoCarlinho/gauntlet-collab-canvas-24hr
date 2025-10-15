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
      mockWebSocket(): Chainable<void>
      mockFirebaseAuth(): Chainable<void>
      waitForCanvasLoad(): Chainable<void>
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
  cy.get('[data-testid="create-canvas-button"]').click()
  cy.get('[data-testid="canvas-title-input"]').type(title)
  if (description) {
    cy.get('[data-testid="canvas-description-input"]').type(description)
  }
  cy.get('[data-testid="create-canvas-submit"]').click()
  
  // Wait for canvas to be created and appear in the list
  cy.get('[data-testid="canvas-list"]').should('contain', title)
})

Cypress.Commands.add('mockWebSocket', () => {
  // Mock WebSocket for testing real-time features
  cy.window().then((win) => {
    const mockWebSocket = {
      send: cy.stub(),
      close: cy.stub(),
      addEventListener: cy.stub(),
      removeEventListener: cy.stub(),
      readyState: 1,
      CONNECTING: 0,
      OPEN: 1,
      CLOSING: 2,
      CLOSED: 3
    }
    
    cy.stub(win, 'WebSocket').returns(mockWebSocket)
  })
})

Cypress.Commands.add('mockFirebaseAuth', () => {
  // Mock Firebase authentication
  cy.window().then((win) => {
    const mockUser = {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      getIdToken: cy.stub().resolves('mock-id-token')
    }
    
    const mockAuth = {
      currentUser: mockUser,
      onAuthStateChanged: cy.stub(),
      signInWithPopup: cy.stub().resolves({ user: mockUser }),
      signOut: cy.stub().resolves()
    }
    
    // Mock Firebase auth
    win.firebase = {
      auth: cy.stub().returns(mockAuth)
    }
  })
})

Cypress.Commands.add('waitForCanvasLoad', () => {
  // Wait for canvas to fully load
  cy.get('[data-testid="canvas-editor"]').should('be.visible')
  cy.get('[data-testid="canvas-tools"]').should('be.visible')
  cy.get('[data-testid="connection-status"]').should('be.visible')
})
