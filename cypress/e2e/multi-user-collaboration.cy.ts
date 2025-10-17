/**
 * Multi-User Collaboration Tests
 * Tests real-time collaboration between multiple authenticated users
 */

describe('Multi-User Collaboration', () => {
  let authToken1: string
  let authToken2: string
  let testCanvasId: string

  before(() => {
    // Setup test users
    cy.task('createTestUser', {
      email: Cypress.env('TEST_USER_EMAIL'),
      password: Cypress.env('TEST_USER_PASSWORD'),
      displayName: 'Test User 1'
    })
    
    cy.task('createTestUser', {
      email: Cypress.env('TEST_USER_2_EMAIL'),
      password: Cypress.env('TEST_USER_2_PASSWORD'),
      displayName: 'Test User 2'
    })
  })

  beforeEach(() => {
    // Generate authentication tokens for both users
    cy.task('generateAuthToken', {
      email: Cypress.env('TEST_USER_EMAIL'),
      password: Cypress.env('TEST_USER_PASSWORD')
    }).then((result: any) => {
      authToken1 = result.token
    })

    cy.task('generateAuthToken', {
      email: Cypress.env('TEST_USER_2_EMAIL'),
      password: Cypress.env('TEST_USER_2_PASSWORD')
    }).then((result: any) => {
      authToken2 = result.token
    })

    // Create a test canvas
    cy.request({
      method: 'POST',
      url: `${Cypress.env('API_URL')}/api/canvas`,
      headers: {
        'Authorization': `Bearer ${authToken1}`,
        'Content-Type': 'application/json'
      },
      body: {
        name: `Collaboration Test Canvas ${Date.now()}`,
        description: 'Multi-user collaboration test canvas'
      }
    }).then((response) => {
      expect(response.status).to.eq(201)
      testCanvasId = response.body.id
    })
  })

  afterEach(() => {
    // Clean up test canvas
    if (testCanvasId) {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.env('API_URL')}/api/canvas/${testCanvasId}`,
        headers: {
          'Authorization': `Bearer ${authToken1}`
        }
      })
    }
  })

  describe('Real-time Cursor Tracking', () => {
    it('should show cursors for multiple users', () => {
      // Open canvas as user 1
      cy.visit(`/canvas/${testCanvasId}`, {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('idToken', authToken1)
          win.localStorage.setItem('user', JSON.stringify({
            id: 'test-user-1-uid',
            email: Cypress.env('TEST_USER_EMAIL'),
            displayName: 'Test User 1'
          }))
        }
      })

      // Wait for canvas to load
      cy.get('[data-testid="canvas-container"]', { timeout: 10000 }).should('be.visible')

      // Open canvas as user 2 in a new window (simulated)
      cy.window().then((win) => {
        const user2Window = win.open(`/canvas/${testCanvasId}`, '_blank')
        user2Window.localStorage.setItem('idToken', authToken2)
        user2Window.localStorage.setItem('user', JSON.stringify({
          id: 'test-user-2-uid',
          email: Cypress.env('TEST_USER_2_EMAIL'),
          displayName: 'Test User 2'
        }))
      })

      // Move cursor as user 1
      cy.get('[data-testid="canvas-container"]').trigger('mousemove', { clientX: 200, clientY: 200 })

      // Verify cursor indicators are visible
      cy.get('[data-testid="cursor-indicator"]').should('be.visible')
      cy.get('[data-testid="user-presence-indicator"]').should('be.visible')

      // Take screenshot
      cy.screenshot('multi-user-cursor-tracking')
    })

    it('should show user presence indicators', () => {
      // Open canvas as user 1
      cy.visit(`/canvas/${testCanvasId}`, {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('idToken', authToken1)
          win.localStorage.setItem('user', JSON.stringify({
            id: 'test-user-1-uid',
            email: Cypress.env('TEST_USER_EMAIL'),
            displayName: 'Test User 1'
          }))
        }
      })

      // Wait for canvas to load
      cy.get('[data-testid="canvas-container"]', { timeout: 10000 }).should('be.visible')

      // Verify user 1 presence indicator
      cy.get('[data-testid="user-presence-indicator"]')
        .should('be.visible')
        .should('contain', 'Test User 1')

      // Take screenshot
      cy.screenshot('user-presence-indicators')
    })
  })

  describe('Concurrent Object Manipulation', () => {
    it('should handle concurrent object creation', () => {
      // Open canvas as user 1
      cy.visit(`/canvas/${testCanvasId}`, {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('idToken', authToken1)
          win.localStorage.setItem('user', JSON.stringify({
            id: 'test-user-1-uid',
            email: Cypress.env('TEST_USER_EMAIL'),
            displayName: 'Test User 1'
          }))
        }
      })

      // Wait for canvas to load
      cy.get('[data-testid="canvas-container"]', { timeout: 10000 }).should('be.visible')

      // Create object as user 1
      cy.get('[data-testid="tool-rectangle"]').click()
      cy.get('[data-testid="canvas-container"]').click(200, 200)

      // Verify object was created
      cy.get('[data-testid="object-rectangle"]').should('exist')

      // Simulate user 2 creating an object (via API call)
      cy.request({
        method: 'POST',
        url: `${Cypress.env('API_URL')}/api/objects`,
        headers: {
          'Authorization': `Bearer ${authToken2}`,
          'Content-Type': 'application/json'
        },
        body: {
          canvas_id: testCanvasId,
          type: 'circle',
          x: 300,
          y: 300,
          properties: {
            width: 100,
            height: 100,
            fill: '#ff0000',
            stroke: '#000000',
            strokeWidth: 2
          }
        }
      }).then((response) => {
        expect(response.status).to.eq(201)
      })

      // Verify both objects exist
      cy.get('[data-testid="object-rectangle"]').should('exist')
      cy.get('[data-testid="object-circle"]').should('exist')

      // Take screenshot
      cy.screenshot('concurrent-object-creation')
    })

    it('should handle concurrent object movement', () => {
      // Create objects for both users
      cy.visit(`/canvas/${testCanvasId}`, {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('idToken', authToken1)
          win.localStorage.setItem('user', JSON.stringify({
            id: 'test-user-1-uid',
            email: Cypress.env('TEST_USER_EMAIL'),
            displayName: 'Test User 1'
          }))
        }
      })

      // Wait for canvas to load
      cy.get('[data-testid="canvas-container"]', { timeout: 10000 }).should('be.visible')

      // Create rectangle as user 1
      cy.get('[data-testid="tool-rectangle"]').click()
      cy.get('[data-testid="canvas-container"]').click(200, 200)

      // Create circle as user 2 via API
      cy.request({
        method: 'POST',
        url: `${Cypress.env('API_URL')}/api/objects`,
        headers: {
          'Authorization': `Bearer ${authToken2}`,
          'Content-Type': 'application/json'
        },
        body: {
          canvas_id: testCanvasId,
          type: 'circle',
          x: 300,
          y: 300,
          properties: {
            width: 100,
            height: 100,
            fill: '#00ff00',
            stroke: '#000000',
            strokeWidth: 2
          }
        }
      })

      // Move rectangle as user 1
      cy.get('[data-testid="object-rectangle"]').click()
      cy.get('[data-testid="object-rectangle"]')
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 250, clientY: 250 })
        .trigger('mouseup')

      // Move circle as user 2 via API
      cy.request({
        method: 'PUT',
        url: `${Cypress.env('API_URL')}/api/objects`,
        headers: {
          'Authorization': `Bearer ${authToken2}`,
          'Content-Type': 'application/json'
        },
        body: {
          canvas_id: testCanvasId,
          x: 350,
          y: 350
        }
      })

      // Verify both objects moved
      cy.get('[data-testid="object-rectangle"]')
        .should('have.attr', 'data-x', '250')
        .should('have.attr', 'data-y', '250')

      cy.get('[data-testid="object-circle"]')
        .should('have.attr', 'data-x', '350')
        .should('have.attr', 'data-y', '350')

      // Take screenshot
      cy.screenshot('concurrent-object-movement')
    })
  })

  describe('State Synchronization', () => {
    it('should synchronize state between users', () => {
      // Open canvas as user 1
      cy.visit(`/canvas/${testCanvasId}`, {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('idToken', authToken1)
          win.localStorage.setItem('user', JSON.stringify({
            id: 'test-user-1-uid',
            email: Cypress.env('TEST_USER_EMAIL'),
            displayName: 'Test User 1'
          }))
        }
      })

      // Wait for canvas to load
      cy.get('[data-testid="canvas-container"]', { timeout: 10000 }).should('be.visible')

      // Create object as user 1
      cy.get('[data-testid="tool-rectangle"]').click()
      cy.get('[data-testid="canvas-container"]').click(200, 200)

      // Verify sync status indicator
      cy.get('[data-testid="sync-status-indicator"]').should('be.visible')
      cy.get('[data-testid="sync-status-indicator"]').should('contain', 'Synced')

      // Take screenshot
      cy.screenshot('state-synchronization')
    })

    it('should handle state conflicts', () => {
      // Open canvas as user 1
      cy.visit(`/canvas/${testCanvasId}`, {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('idToken', authToken1)
          win.localStorage.setItem('user', JSON.stringify({
            id: 'test-user-1-uid',
            email: Cypress.env('TEST_USER_EMAIL'),
            displayName: 'Test User 1'
          }))
        }
      })

      // Wait for canvas to load
      cy.get('[data-testid="canvas-container"]', { timeout: 10000 }).should('be.visible')

      // Create object as user 1
      cy.get('[data-testid="tool-rectangle"]').click()
      cy.get('[data-testid="canvas-container"]').click(200, 200)

      // Simulate conflict by updating the same object simultaneously
      cy.get('[data-testid="object-rectangle"]').click()
      
      // Move object as user 1
      cy.get('[data-testid="object-rectangle"]')
        .trigger('mousedown', { which: 1 })
        .trigger('mousemove', { clientX: 250, clientY: 250 })
        .trigger('mouseup')

      // Simulate user 2 moving the same object via API
      cy.request({
        method: 'PUT',
        url: `${Cypress.env('API_URL')}/api/objects`,
        headers: {
          'Authorization': `Bearer ${authToken2}`,
          'Content-Type': 'application/json'
        },
        body: {
          canvas_id: testCanvasId,
          x: 300,
          y: 300
        }
      })

      // Verify conflict resolution dialog appears
      cy.get('[data-testid="conflict-resolution-dialog"]', { timeout: 10000 }).should('be.visible')
      cy.get('[data-testid="conflict-resolution-dialog"]').should('contain', 'Conflict detected')

      // Take screenshot
      cy.screenshot('state-conflict-resolution')
    })
  })

  describe('Permission-based Access', () => {
    it('should respect user permissions for object access', () => {
      // Open canvas as user 1 (admin)
      cy.visit(`/canvas/${testCanvasId}`, {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('idToken', authToken1)
          win.localStorage.setItem('user', JSON.stringify({
            id: 'test-user-1-uid',
            email: Cypress.env('TEST_USER_EMAIL'),
            displayName: 'Test User 1',
            permissions: ['read', 'write', 'admin']
          }))
        }
      })

      // Wait for canvas to load
      cy.get('[data-testid="canvas-container"]', { timeout: 10000 }).should('be.visible')

      // Create object as admin
      cy.get('[data-testid="tool-rectangle"]').click()
      cy.get('[data-testid="canvas-container"]').click(200, 200)

      // Verify admin controls are visible
      cy.get('[data-testid="admin-controls"]').should('be.visible')
      cy.get('[data-testid="delete-object-button"]').should('be.visible')

      // Take screenshot
      cy.screenshot('admin-permissions')
    })

    it('should limit permissions for regular users', () => {
      // Open canvas as user 2 (regular user)
      cy.visit(`/canvas/${testCanvasId}`, {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('idToken', authToken2)
          win.localStorage.setItem('user', JSON.stringify({
            id: 'test-user-2-uid',
            email: Cypress.env('TEST_USER_2_EMAIL'),
            displayName: 'Test User 2',
            permissions: ['read', 'write']
          }))
        }
      })

      // Wait for canvas to load
      cy.get('[data-testid="canvas-container"]', { timeout: 10000 }).should('be.visible')

      // Create object as regular user
      cy.get('[data-testid="tool-rectangle"]').click()
      cy.get('[data-testid="canvas-container"]').click(200, 200)

      // Verify admin controls are not visible
      cy.get('[data-testid="admin-controls"]').should('not.exist')
      cy.get('[data-testid="delete-object-button"]').should('not.exist')

      // Take screenshot
      cy.screenshot('regular-user-permissions')
    })
  })

  describe('Performance under Load', () => {
    it('should handle multiple users efficiently', () => {
      // Open canvas as user 1
      cy.visit(`/canvas/${testCanvasId}`, {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('idToken', authToken1)
          win.localStorage.setItem('user', JSON.stringify({
            id: 'test-user-1-uid',
            email: Cypress.env('TEST_USER_EMAIL'),
            displayName: 'Test User 1'
          }))
        }
      })

      // Wait for canvas to load
      cy.get('[data-testid="canvas-container"]', { timeout: 10000 }).should('be.visible')

      // Create multiple objects quickly
      const tools = ['rectangle', 'circle', 'text']
      tools.forEach((tool, index) => {
        cy.get(`[data-testid="tool-${tool}"]`).click()
        cy.get('[data-testid="canvas-container"]').click(200 + index * 100, 200 + index * 100)
      })

      // Verify performance indicators
      cy.get('[data-testid="performance-indicator"]').should('be.visible')
      cy.get('[data-testid="performance-indicator"]').should('contain', 'Good')

      // Take screenshot
      cy.screenshot('multi-user-performance')
    })
  })
})
