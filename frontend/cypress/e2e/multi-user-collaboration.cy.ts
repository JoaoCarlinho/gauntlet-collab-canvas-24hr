/**
 * Multi-User Collaboration Tests
 * Tests real-time collaboration features with multiple users
 */

describe('Multi-User Collaboration Tests', () => {
  beforeEach(() => {
    // Visit the canvas page with authentication
    cy.visit('/dev/canvas/test-canvas', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('dev-mode', 'true')
        win.localStorage.setItem('idToken', 'dev-token')
        win.localStorage.setItem('user', JSON.stringify({
          id: 'test-user-1',
          email: 'test@collabcanvas.com',
          name: 'Test User 1'
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

  it('should simulate multi-user object creation', () => {
    // Simulate User 1 creating objects
    cy.get('[data-testid="tool-rectangle"]').click()
    cy.get('.konvajs-content').click(800, 100, { force: true })
    cy.wait(1000)
    
    // Take screenshot of User 1's object
    cy.screenshot('multi-user-user1-rectangle', {
      capture: 'fullPage'
    })
    
    // Simulate User 2 creating objects (different position)
    cy.get('[data-testid="tool-circle"]').click()
    cy.get('.konvajs-content').click(1000, 200, { force: true })
    cy.wait(1000)
    
    // Take screenshot with both objects
    cy.screenshot('multi-user-both-objects', {
      capture: 'fullPage'
    })
    
    // Simulate User 3 creating text
    cy.get('[data-testid="tool-text"]').click()
    cy.get('.konvajs-content').click(1100, 300, { force: true })
    
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="text-input"]').length > 0) {
        cy.get('[data-testid="text-input"]').type('Collaborative Text')
        cy.get('[data-testid="text-input"]').type('{enter}')
      }
    })
    
    cy.wait(1000)
    
    // Take final screenshot with all three objects
    cy.screenshot('multi-user-all-three-objects', {
      capture: 'fullPage'
    })
  })

  it('should simulate concurrent object manipulation', () => {
    // Create initial objects
    cy.get('[data-testid="tool-rectangle"]').click()
    cy.get('.konvajs-content').click(800, 100, { force: true })
    cy.wait(500)
    
    cy.get('[data-testid="tool-circle"]').click()
    cy.get('.konvajs-content').click(950, 100, { force: true })
    cy.wait(500)
    
    // Take initial screenshot
    cy.screenshot('multi-user-concurrent-initial', {
      capture: 'fullPage'
    })
    
    // Simulate concurrent manipulation
    cy.get('[data-testid="tool-select"]').click()
    
    // Select and move first object (User 1)
    cy.get('.konvajs-content').click(800, 100, { force: true })
    cy.wait(200)
    
    cy.get('.konvajs-content')
      .trigger('mousedown', { which: 1, clientX: 800, clientY: 100 })
      .trigger('mousemove', { which: 1, clientX: 850, clientY: 150 })
      .trigger('mouseup', { which: 1, clientX: 850, clientY: 150 })
    
    cy.wait(500)
    
    // Take screenshot after first move
    cy.screenshot('multi-user-concurrent-after-first-move', {
      capture: 'fullPage'
    })
    
    // Select and move second object (User 2)
    cy.get('.konvajs-content').click(950, 100, { force: true })
    cy.wait(200)
    
    cy.get('.konvajs-content')
      .trigger('mousedown', { which: 1, clientX: 950, clientY: 100 })
      .trigger('mousemove', { which: 1, clientX: 1000, clientY: 200 })
      .trigger('mouseup', { which: 1, clientX: 1000, clientY: 200 })
    
    cy.wait(500)
    
    // Take final screenshot
    cy.screenshot('multi-user-concurrent-final', {
      capture: 'fullPage'
    })
  })

  it('should simulate real-time cursor tracking', () => {
    // Create an object first
    cy.get('[data-testid="tool-rectangle"]').click()
    cy.get('.konvajs-content').click(800, 200, { force: true })
    cy.wait(1000)
    
    // Simulate cursor movement across the canvas
    const cursorPositions = [
      { x: 400, y: 200 },
      { x: 600, y: 300 },
      { x: 800, y: 400 },
      { x: 1000, y: 500 }
    ]
    
    cursorPositions.forEach((pos, index) => {
      cy.get('.konvajs-content')
        .trigger('mousemove', { clientX: pos.x, clientY: pos.y })
      
      cy.wait(200)
      
      // Take screenshot at each cursor position
      cy.screenshot(`multi-user-cursor-position-${index + 1}`, {
        capture: 'fullPage'
      })
    })
  })

  it('should simulate conflict resolution scenarios', () => {
    // Create overlapping objects to simulate conflicts
    cy.get('[data-testid="tool-rectangle"]').click()
    cy.get('.konvajs-content').click(800, 200, { force: true })
    cy.wait(500)
    
    // Create another rectangle in similar position
    cy.get('.konvajs-content').click(820, 220, { force: true })
    cy.wait(500)
    
    // Take screenshot showing potential conflict
    cy.screenshot('multi-user-conflict-scenario', {
      capture: 'fullPage'
    })
    
    // Select and move one object to resolve conflict
    cy.get('[data-testid="tool-select"]').click()
    cy.get('.konvajs-content').click(820, 220, { force: true })
    cy.wait(200)
    
    cy.get('.konvajs-content')
      .trigger('mousedown', { which: 1, clientX: 820, clientY: 220 })
      .trigger('mousemove', { which: 1, clientX: 900, clientY: 300 })
      .trigger('mouseup', { which: 1, clientX: 900, clientY: 300 })
    
    cy.wait(500)
    
    // Take screenshot after conflict resolution
    cy.screenshot('multi-user-conflict-resolved', {
      capture: 'fullPage'
    })
  })

  it('should simulate state synchronization', () => {
    // Create multiple objects to test state sync
    const objects = [
      { tool: 'rectangle', x: 800, y: 100 },
      { tool: 'circle', x: 950, y: 100 },
      { tool: 'text', x: 1100, y: 100 }
    ]

    objects.forEach((obj) => {
      cy.get(`[data-testid="tool-${obj.tool}"]`).click()
      cy.get('.konvajs-content').click(obj.x, obj.y, { force: true })
      
      if (obj.tool === 'text') {
        cy.get('body').then(($body) => {
          if ($body.find('[data-testid="text-input"]').length > 0) {
            cy.get('[data-testid="text-input"]').type('Sync Test')
            cy.get('[data-testid="text-input"]').type('{enter}')
          }
        })
      }
      
      cy.wait(500)
    })
    
    // Take screenshot of initial state
    cy.screenshot('multi-user-state-sync-initial', {
      capture: 'fullPage'
    })
    
    // Simulate state changes
    cy.get('[data-testid="tool-select"]').click()
    
    // Move all objects to simulate state changes
    objects.forEach((obj, index) => {
      cy.get('.konvajs-content').click(obj.x, obj.y, { force: true })
      cy.wait(200)
      
      cy.get('.konvajs-content')
        .trigger('mousedown', { which: 1, clientX: obj.x, clientY: obj.y })
        .trigger('mousemove', { which: 1, clientX: obj.x + 100, clientY: obj.y + 100 })
        .trigger('mouseup', { which: 1, clientX: obj.x + 100, clientY: obj.y + 100 })
      
      cy.wait(500)
    })
    
    // Take final screenshot showing synchronized state
    cy.screenshot('multi-user-state-sync-final', {
      capture: 'fullPage'
    })
  })
})
