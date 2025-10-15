describe('Real-time Object Visibility with Screenshots', () => {
  beforeEach(() => {
    // Handle uncaught exceptions from Firebase
    cy.on('uncaught:exception', (err, runnable) => {
      // Don't fail the test on Firebase errors
      if (err.message.includes('Firebase') || err.message.includes('auth/invalid-api-key')) {
        return false
      }
      return true
    })
  })

  it('should demonstrate object visibility issues with screenshots', () => {
    // Visit the application
    cy.visit('/')
    
    // Take initial screenshot
    cy.screenshot('01-initial-page-load')
    
    // Wait for the page to load
    cy.get('body').should('be.visible')
    cy.wait(2000) // Wait for any initialization
    
    // Take screenshot after page load
    cy.screenshot('02-page-loaded')
    
    // Check if we can see any UI elements
    cy.get('body').then(($body) => {
      const bodyText = $body.text()
      cy.log('Page content:', bodyText)
      
      // Take screenshot of current state
      cy.screenshot('03-page-content-visible')
    })
    
    // Try to interact with the page
    cy.get('body').click()
    cy.wait(1000)
    cy.screenshot('04-after-body-click')
    
    // Check for any canvas-related elements
    cy.get('body').then(($body) => {
      const hasCanvas = $body.find('[data-testid*="canvas"]').length > 0
      const hasButtons = $body.find('button').length > 0
      const hasInputs = $body.find('input').length > 0
      
      cy.log('Canvas elements found:', hasCanvas)
      cy.log('Buttons found:', hasButtons)
      cy.log('Inputs found:', hasInputs)
      
      // Take screenshot showing what elements are available
      cy.screenshot('05-ui-elements-analysis')
    })
    
    // Try to find and interact with any buttons
    cy.get('body').then(($body) => {
      const buttons = $body.find('button')
      if (buttons.length > 0) {
        cy.log(`Found ${buttons.length} buttons`)
        buttons.each((index, button) => {
          cy.log(`Button ${index}:`, button.textContent || button.getAttribute('data-testid') || 'no text')
        })
        
        // Click the first button if it exists
        cy.get('button').first().click({ force: true })
        cy.wait(1000)
        cy.screenshot('06-after-first-button-click')
      }
    })
    
    // Check for any forms or input fields
    cy.get('body').then(($body) => {
      const inputs = $body.find('input')
      if (inputs.length > 0) {
        cy.log(`Found ${inputs.length} input fields`)
        
        // Try to interact with the first input
        cy.get('input').first().type('Test Canvas', { force: true })
        cy.wait(1000)
        cy.screenshot('07-after-input-interaction')
      }
    })
    
    // Final screenshot
    cy.screenshot('08-final-state')
  })

  it('should test canvas functionality if available', () => {
    cy.visit('/')
    cy.wait(3000) // Wait longer for full initialization
    
    // Take screenshot of initial state
    cy.screenshot('09-canvas-test-initial')
    
    // Look for canvas-related elements
    cy.get('body').then(($body) => {
      const canvasElements = $body.find('[data-testid*="canvas"], canvas, [class*="canvas"]')
      cy.log(`Found ${canvasElements.length} canvas-related elements`)
      
      if (canvasElements.length > 0) {
        // Take screenshot of canvas elements
        cy.screenshot('10-canvas-elements-found')
        
        // Try to interact with canvas
        canvasElements.first().click({ force: true })
        cy.wait(1000)
        cy.screenshot('11-after-canvas-click')
        
        // Try to add objects if buttons are available
        const addButtons = $body.find('[data-testid*="add"], button:contains("Add"), button:contains("Text"), button:contains("Rectangle")')
        if (addButtons.length > 0) {
          cy.log(`Found ${addButtons.length} add buttons`)
          cy.screenshot('12-add-buttons-found')
          
          // Click first add button
          addButtons.first().click({ force: true })
          cy.wait(1000)
          cy.screenshot('13-after-add-button-click')
          
          // Try to click on canvas to place object
          canvasElements.first().click(400, 300, { force: true })
          cy.wait(2000) // Wait for object to appear
          cy.screenshot('14-after-object-placement')
          
          // Check if object appeared
          cy.get('body').then(($body) => {
            const objects = $body.find('[data-testid*="object"], [class*="object"]')
            cy.log(`Objects found after placement: ${objects.length}`)
            cy.screenshot('15-object-visibility-check')
          })
        }
      } else {
        cy.log('No canvas elements found')
        cy.screenshot('16-no-canvas-elements')
      }
    })
  })

  it('should test real-time updates simulation', () => {
    cy.visit('/')
    cy.wait(3000)
    
    // Take initial screenshot
    cy.screenshot('17-realtime-test-initial')
    
    // Simulate adding multiple objects quickly
    cy.get('body').then(($body) => {
      const addButtons = $body.find('[data-testid*="add"], button:contains("Add"), button:contains("Text")')
      const canvas = $body.find('[data-testid*="canvas"], canvas, [class*="canvas"]')
      
      if (addButtons.length > 0 && canvas.length > 0) {
        // Add first object
        addButtons.first().click({ force: true })
        canvas.first().click(200, 200, { force: true })
        cy.wait(500)
        cy.screenshot('18-first-object-added')
        
        // Add second object quickly
        if (addButtons.length > 1) {
          addButtons.eq(1).click({ force: true })
          canvas.first().click(300, 300, { force: true })
          cy.wait(500)
          cy.screenshot('19-second-object-added')
        }
        
        // Add third object
        if (addButtons.length > 2) {
          addButtons.eq(2).click({ force: true })
          canvas.first().click(400, 400, { force: true })
          cy.wait(1000)
          cy.screenshot('20-third-object-added')
        }
        
        // Check final state
        cy.get('body').then(($body) => {
          const objects = $body.find('[data-testid*="object"], [class*="object"]')
          cy.log(`Final object count: ${objects.length}`)
          cy.screenshot('21-final-object-count')
        })
      } else {
        cy.log('Cannot test real-time updates - missing elements')
        cy.screenshot('22-cannot-test-realtime')
      }
    })
  })
})

