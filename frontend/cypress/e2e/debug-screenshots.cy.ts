describe('Debug Screenshot Functionality', () => {
  it('should capture a simple screenshot to verify functionality', () => {
    // Visit a simple page first to test screenshot functionality
    cy.visit('https://example.com')
    
    // Take screenshot of a known working page
    cy.screenshot('01-example-com-test')
    
    // Wait a moment
    cy.wait(2000)
    
    // Take another screenshot
    cy.screenshot('02-example-com-after-wait')
    
    // Verify the page loaded
    cy.get('h1').should('contain', 'Example Domain')
    cy.screenshot('03-example-com-verified')
  })

  it('should test screenshot with our production app', () => {
    // Visit our production app
    cy.visit('https://gauntlet-collab-canvas-24hr.vercel.app')
    
    // Take immediate screenshot
    cy.screenshot('04-production-immediate')
    
    // Wait for page to load
    cy.wait(5000)
    
    // Take screenshot after wait
    cy.screenshot('05-production-after-wait')
    
    // Check what's actually on the page
    cy.get('body').then(($body) => {
      const bodyText = $body.text()
      cy.log('Body text content:', bodyText)
      
      // Take screenshot with body content logged
      cy.screenshot('06-production-with-content')
    })
    
    // Try to capture specific elements
    cy.get('html').screenshot('07-html-element')
    cy.get('body').screenshot('08-body-element')
    
    // Check if root div exists and capture it
    cy.get('#root').then(($root) => {
      if ($root.length > 0) {
        cy.get('#root').screenshot('09-root-element')
      } else {
        cy.screenshot('10-no-root-element')
      }
    })
  })

  it('should test with different viewport sizes', () => {
    // Test with different viewport sizes
    cy.viewport(1920, 1080)
    cy.visit('https://gauntlet-collab-canvas-24hr.vercel.app')
    cy.wait(3000)
    cy.screenshot('11-desktop-viewport')
    
    cy.viewport(1280, 720)
    cy.screenshot('12-medium-viewport')
    
    cy.viewport(768, 1024)
    cy.screenshot('13-tablet-viewport')
    
    cy.viewport(375, 667)
    cy.screenshot('14-mobile-viewport')
  })

  it('should test screenshot with forced browser settings', () => {
    // Visit with specific browser settings
    cy.visit('https://gauntlet-collab-canvas-24hr.vercel.app', {
      onBeforeLoad: (win) => {
        // Disable any potential blocking
        win.fetch = win.fetch || (() => Promise.resolve())
      }
    })
    
    // Take screenshot immediately
    cy.screenshot('15-forced-settings-immediate')
    
    // Wait and take another
    cy.wait(5000)
    cy.screenshot('16-forced-settings-after-wait')
    
    // Force a page refresh and screenshot
    cy.reload()
    cy.wait(3000)
    cy.screenshot('17-after-reload')
  })
})

