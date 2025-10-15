describe('Simple Object Visibility Test', () => {
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

  it('should load the application and take screenshots', () => {
    // Visit the application
    cy.visit('/')
    
    // Take screenshot of initial load
    cy.screenshot('01-initial-load')
    
    // Wait for page to load
    cy.wait(3000)
    
    // Take screenshot after wait
    cy.screenshot('02-after-wait')
    
    // Check what's actually on the page
    cy.get('body').then(($body) => {
      const bodyText = $body.text()
      cy.log('Body text:', bodyText)
      
      // Take screenshot of page content
      cy.screenshot('03-page-content')
    })
    
    // Check for specific elements
    cy.get('body').then(($body) => {
      const html = $body.html()
      cy.log('HTML content length:', html.length)
      
      // Take screenshot showing HTML structure
      cy.screenshot('04-html-structure')
    })
    
    // Try to find any interactive elements
    cy.get('body').then(($body) => {
      const buttons = $body.find('button')
      const inputs = $body.find('input')
      const divs = $body.find('div')
      
      cy.log(`Found ${buttons.length} buttons`)
      cy.log(`Found ${inputs.length} inputs`)
      cy.log(`Found ${divs.length} divs`)
      
      // Take screenshot of element analysis
      cy.screenshot('05-element-analysis')
    })
    
    // Final screenshot
    cy.screenshot('06-final-state')
  })

  it('should test if the page is actually loading', () => {
    // Visit with longer timeout
    cy.visit('/', { timeout: 30000 })
    
    // Take screenshot immediately
    cy.screenshot('07-immediate-load')
    
    // Wait longer for any async loading
    cy.wait(5000)
    
    // Take screenshot after longer wait
    cy.screenshot('08-after-long-wait')
    
    // Check if we can see anything at all
    cy.get('html').should('exist')
    cy.screenshot('09-html-exists')
    
    // Check if body exists
    cy.get('body').should('exist')
    cy.screenshot('10-body-exists')
    
    // Check if root div exists
    cy.get('#root').should('exist')
    cy.screenshot('11-root-exists')
  })
})

