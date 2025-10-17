/**
 * Authentication Error Scenarios Tests
 * Tests error handling with authentication failures
 */

describe('Authentication Error Scenarios', () => {
  beforeEach(() => {
    // Visit the canvas page with authentication
    cy.visit('/dev/canvas/test-canvas', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('dev-mode', 'true')
        win.localStorage.setItem('idToken', 'dev-token')
        win.localStorage.setItem('user', JSON.stringify({
          id: 'test-user-1',
          email: 'test@collabcanvas.com',
          name: 'Test User'
        }))
      }
    })
    
    // Wait for canvas to load
    cy.wait(3000)
    
    // Wait for Konva canvas to be ready
    cy.get('.konvajs-content').should('be.visible')
    
    // Collapse the toolbar
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="toolbar"]').length > 0) {
        cy.get('[data-testid="toolbar"]').then(($toolbar) => {
          if ($toolbar.hasClass('w-48')) {
            cy.get('[data-testid="toolbar"] button[title*="Collapse"]').click()
          }
        })
      }
    })
  })

  it('should handle token expiration scenarios', () => {
    // Create an object first
    cy.get('[data-testid="tool-rectangle"]').click()
    cy.get('.konvajs-content').click(800, 200, { force: true })
    cy.wait(1000)
    
    // Take screenshot before token expiration
    cy.screenshot('auth-error-before-token-expiry', {
      capture: 'fullPage'
    })
    
    // Simulate token expiration by clearing localStorage
    cy.window().then((win) => {
      win.localStorage.removeItem('idToken')
      win.localStorage.setItem('idToken', 'expired-token')
    })
    
    // Try to create another object (should handle gracefully)
    cy.get('[data-testid="tool-circle"]').click()
    cy.get('.konvajs-content').click(950, 200, { force: true })
    cy.wait(1000)
    
    // Take screenshot after token expiration
    cy.screenshot('auth-error-after-token-expiry', {
      capture: 'fullPage'
    })
  })

  it('should handle permission denied scenarios', () => {
    // Create an object first
    cy.get('[data-testid="tool-rectangle"]').click()
    cy.get('.konvajs-content').click(800, 200, { force: true })
    cy.wait(1000)
    
    // Take screenshot before permission change
    cy.screenshot('auth-error-before-permission-denied', {
      capture: 'fullPage'
    })
    
    // Simulate permission denied by changing user role
    cy.window().then((win) => {
      const user = JSON.parse(win.localStorage.getItem('user') || '{}')
      user.role = 'readonly'
      win.localStorage.setItem('user', JSON.stringify(user))
    })
    
    // Try to manipulate the object (should handle gracefully)
    cy.get('[data-testid="tool-select"]').click()
    cy.get('.konvajs-content').click(800, 200, { force: true })
    cy.wait(500)
    
    // Try to move the object
    cy.get('.konvajs-content')
      .trigger('mousedown', { which: 1, clientX: 800, clientY: 200 })
      .trigger('mousemove', { which: 1, clientX: 850, clientY: 250 })
      .trigger('mouseup', { which: 1, clientX: 850, clientY: 250 })
    
    cy.wait(1000)
    
    // Take screenshot after permission denied
    cy.screenshot('auth-error-after-permission-denied', {
      capture: 'fullPage'
    })
  })

  it('should handle network failures with authentication', () => {
    // Create an object first
    cy.get('[data-testid="tool-rectangle"]').click()
    cy.get('.konvajs-content').click(800, 200, { force: true })
    cy.wait(1000)
    
    // Take screenshot before network failure
    cy.screenshot('auth-error-before-network-failure', {
      capture: 'fullPage'
    })
    
    // Simulate network failure by intercepting requests
    cy.intercept('POST', '**/api/**', { forceNetworkError: true }).as('networkError')
    cy.intercept('GET', '**/api/**', { forceNetworkError: true }).as('networkError')
    
    // Try to create another object (should handle gracefully)
    cy.get('[data-testid="tool-circle"]').click()
    cy.get('.konvajs-content').click(950, 200, { force: true })
    cy.wait(1000)
    
    // Take screenshot after network failure
    cy.screenshot('auth-error-after-network-failure', {
      capture: 'fullPage'
    })
  })

  it('should handle reconnection with valid authentication', () => {
    // Create an object first
    cy.get('[data-testid="tool-rectangle"]').click()
    cy.get('.konvajs-content').click(800, 200, { force: true })
    cy.wait(1000)
    
    // Take screenshot before disconnection
    cy.screenshot('auth-error-before-disconnection', {
      capture: 'fullPage'
    })
    
    // Simulate disconnection by dispatching offline event
    cy.window().then((win) => {
      win.dispatchEvent(new Event('offline'))
    })
    
    cy.wait(1000)
    
    // Take screenshot during disconnection
    cy.screenshot('auth-error-during-disconnection', {
      capture: 'fullPage'
    })
    
    // Simulate reconnection by dispatching online event
    cy.window().then((win) => {
      win.dispatchEvent(new Event('online'))
    })
    
    cy.wait(1000)
    
    // Take screenshot after reconnection
    cy.screenshot('auth-error-after-reconnection', {
      capture: 'fullPage'
    })
  })

  it('should handle invalid authentication tokens', () => {
    // Create an object first
    cy.get('[data-testid="tool-rectangle"]').click()
    cy.get('.konvajs-content').click(800, 200, { force: true })
    cy.wait(1000)
    
    // Take screenshot before invalid token
    cy.screenshot('auth-error-before-invalid-token', {
      capture: 'fullPage'
    })
    
    // Simulate invalid token
    cy.window().then((win) => {
      win.localStorage.setItem('idToken', 'invalid-token-123')
    })
    
    // Try to create another object (should handle gracefully)
    cy.get('[data-testid="tool-circle"]').click()
    cy.get('.konvajs-content').click(950, 200, { force: true })
    cy.wait(1000)
    
    // Take screenshot after invalid token
    cy.screenshot('auth-error-after-invalid-token', {
      capture: 'fullPage'
    })
  })

  it('should handle authentication service unavailable', () => {
    // Create an object first
    cy.get('[data-testid="tool-rectangle"]').click()
    cy.get('.konvajs-content').click(800, 200, { force: true })
    cy.wait(1000)
    
    // Take screenshot before service unavailable
    cy.screenshot('auth-error-before-service-unavailable', {
      capture: 'fullPage'
    })
    
    // Simulate authentication service unavailable
    cy.intercept('POST', '**/auth/**', { statusCode: 503, body: { error: 'Service Unavailable' } }).as('authServiceDown')
    cy.intercept('GET', '**/auth/**', { statusCode: 503, body: { error: 'Service Unavailable' } }).as('authServiceDown')
    
    // Try to create another object (should handle gracefully)
    cy.get('[data-testid="tool-circle"]').click()
    cy.get('.konvajs-content').click(950, 200, { force: true })
    cy.wait(1000)
    
    // Take screenshot after service unavailable
    cy.screenshot('auth-error-after-service-unavailable', {
      capture: 'fullPage'
    })
  })

  it('should handle session timeout scenarios', () => {
    // Create an object first
    cy.get('[data-testid="tool-rectangle"]').click()
    cy.get('.konvajs-content').click(800, 200, { force: true })
    cy.wait(1000)
    
    // Take screenshot before session timeout
    cy.screenshot('auth-error-before-session-timeout', {
      capture: 'fullPage'
    })
    
    // Simulate session timeout
    cy.window().then((win) => {
      // Clear authentication data
      win.localStorage.removeItem('idToken')
      win.localStorage.removeItem('user')
      
      // Simulate session timeout event
      win.dispatchEvent(new Event('storage'))
    })
    
    cy.wait(1000)
    
    // Try to create another object (should handle gracefully)
    cy.get('[data-testid="tool-circle"]').click()
    cy.get('.konvajs-content').click(950, 200, { force: true })
    cy.wait(1000)
    
    // Take screenshot after session timeout
    cy.screenshot('auth-error-after-session-timeout', {
      capture: 'fullPage'
    })
  })
})
