// 🚀 Production Screenshot Generation
// Phase 5: Production Testing - Production Screenshot Validation

describe('Production Screenshots', () => {
  beforeEach(() => {
    // Set production environment
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('production-mode', 'true');
      }
    });
  });

  describe('Home Page Screenshots', () => {
    it('should capture production home page', () => {
      cy.wait(2000); // Wait for page to load
      cy.screenshot('production-home-page', {
        capture: 'fullPage',
        overwrite: true
      });
    });

    it('should capture home page with canvas list', () => {
      cy.wait(2000);
      cy.get('[data-testid="canvas-list"]').should('be.visible');
      cy.screenshot('production-home-page-with-canvas-list', {
        capture: 'fullPage',
        overwrite: true
      });
    });

    it('should capture create canvas modal', () => {
      cy.get('[data-testid="create-canvas-button"]').click();
      cy.wait(1000);
      cy.screenshot('production-create-canvas-modal', {
        capture: 'viewport',
        overwrite: true
      });
    });
  });

  describe('Authentication Screenshots', () => {
    it('should capture production login page', () => {
      cy.visit('/login');
      cy.wait(2000);
      cy.screenshot('production-login-page', {
        capture: 'fullPage',
        overwrite: true
      });
    });

    it('should capture login form with validation', () => {
      cy.visit('/login');
      cy.wait(2000);
      
      // Try to submit empty form to show validation
      cy.get('[data-testid="login-button"]').click();
      cy.wait(500);
      
      cy.screenshot('production-login-form-validation', {
        capture: 'viewport',
        overwrite: true
      });
    });

    it('should capture authentication error states', () => {
      cy.visit('/login');
      cy.wait(2000);
      
      // Enter invalid credentials
      cy.get('[data-testid="email-input"]').type('invalid@example.com');
      cy.get('[data-testid="password-input"]').type('wrongpassword');
      cy.get('[data-testid="login-button"]').click();
      cy.wait(2000);
      
      cy.screenshot('production-login-error', {
        capture: 'viewport',
        overwrite: true
      });
    });
  });

  describe('Canvas Screenshots', () => {
    beforeEach(() => {
      cy.visit('/canvas');
      cy.wait(3000); // Wait for canvas to load
    });

    it('should capture empty canvas page', () => {
      cy.screenshot('production-canvas-empty', {
        capture: 'fullPage',
        overwrite: true
      });
    });

    it('should capture canvas with floating toolbar', () => {
      cy.get('[data-testid="floating-toolbar"]').should('be.visible');
      cy.screenshot('production-canvas-with-toolbar', {
        capture: 'fullPage',
        overwrite: true
      });
    });

    it('should capture all object types on canvas', () => {
      // Create rectangle
      cy.get('[data-testid="tool-rectangle"]').click();
      cy.get('[data-testid="canvas-stage"]').click(200, 200);
      cy.get('[data-testid="canvas-stage"]').click(300, 300);
      
      // Create circle
      cy.get('[data-testid="tool-circle"]').click();
      cy.get('[data-testid="canvas-stage"]').click(400, 200);
      
      // Create text
      cy.get('[data-testid="tool-text"]').click();
      cy.get('[data-testid="canvas-stage"]').click(500, 200);
      cy.get('[data-testid="text-input"]').type('Production Test');
      cy.get('[data-testid="text-input"]').blur();
      
      // Create arrow
      cy.get('[data-testid="tool-arrow"]').click();
      cy.get('[data-testid="canvas-stage"]').click(600, 200);
      cy.get('[data-testid="canvas-stage"]').click(700, 300);
      
      // Create diamond
      cy.get('[data-testid="tool-diamond"]').click();
      cy.get('[data-testid="canvas-stage"]').click(800, 200);
      
      // Create star
      cy.get('[data-testid="tool-star"]').click();
      cy.get('[data-testid="canvas-stage"]').click(900, 200);
      
      cy.wait(2000); // Wait for all objects to render
      cy.screenshot('production-canvas-all-object-types', {
        capture: 'fullPage',
        overwrite: true
      });
    });

    it('should capture object selection and editing', () => {
      // Create an object first
      cy.get('[data-testid="tool-rectangle"]').click();
      cy.get('[data-testid="canvas-stage"]').click(200, 200);
      cy.get('[data-testid="canvas-stage"]').click(300, 300);
      
      // Select the object
      cy.get('[data-testid="canvas-stage"]').click(250, 250);
      cy.wait(500);
      
      cy.screenshot('production-canvas-object-selection', {
        capture: 'fullPage',
        overwrite: true
      });
    });

    it('should capture object resizing', () => {
      // Create and select an object
      cy.get('[data-testid="tool-rectangle"]').click();
      cy.get('[data-testid="canvas-stage"]').click(200, 200);
      cy.get('[data-testid="canvas-stage"]').click(300, 300);
      cy.get('[data-testid="canvas-stage"]').click(250, 250);
      
      // Show resize handles
      cy.get('[data-testid="resize-handles"]').should('be.visible');
      
      cy.screenshot('production-canvas-object-resizing', {
        capture: 'fullPage',
        overwrite: true
      });
    });

    it('should capture zoom controls', () => {
      cy.get('[data-testid="zoom-controls"]').should('be.visible');
      cy.screenshot('production-canvas-zoom-controls', {
        capture: 'viewport',
        overwrite: true
      });
    });
  });

  describe('Collaboration Screenshots', () => {
    beforeEach(() => {
      cy.visit('/canvas');
      cy.wait(3000);
    });

    it('should capture collaboration sidebar', () => {
      cy.get('[data-testid="collaboration-sidebar"]').should('be.visible');
      cy.screenshot('production-collaboration-sidebar', {
        capture: 'viewport',
        overwrite: true
      });
    });

    it('should capture user status indicators', () => {
      cy.get('[data-testid="user-status"]').should('be.visible');
      cy.screenshot('production-user-status', {
        capture: 'viewport',
        overwrite: true
      });
    });

    it('should capture presence indicators', () => {
      // Create an object to show presence
      cy.get('[data-testid="tool-rectangle"]').click();
      cy.get('[data-testid="canvas-stage"]').click(200, 200);
      cy.get('[data-testid="canvas-stage"]').click(300, 300);
      
      cy.wait(1000);
      cy.screenshot('production-presence-indicators', {
        capture: 'fullPage',
        overwrite: true
      });
    });

    it('should capture invite collaborator modal', () => {
      cy.get('[data-testid="invite-collaborator-button"]').click();
      cy.wait(1000);
      
      cy.screenshot('production-invite-collaborator-modal', {
        capture: 'viewport',
        overwrite: true
      });
    });
  });

  describe('Error State Screenshots', () => {
    it('should capture 404 error page', () => {
      cy.visit('/nonexistent-page', { failOnStatusCode: false });
      cy.wait(2000);
      cy.screenshot('production-404-page', {
        capture: 'fullPage',
        overwrite: true
      });
    });

    it('should capture network error state', () => {
      cy.visit('/canvas');
      cy.wait(3000);
      
      // Simulate network error
      cy.intercept('**', { forceNetworkError: true }).as('networkError');
      
      // Try to create an object
      cy.get('[data-testid="tool-rectangle"]').click();
      cy.get('[data-testid="canvas-stage"]').click(200, 200);
      cy.get('[data-testid="canvas-stage"]').click(300, 300);
      
      cy.wait(2000);
      cy.screenshot('production-network-error', {
        capture: 'fullPage',
        overwrite: true
      });
    });

    it('should capture offline indicator', () => {
      cy.visit('/canvas');
      cy.wait(3000);
      
      // Simulate offline
      cy.window().then((win) => {
        win.dispatchEvent(new Event('offline'));
      });
      
      cy.wait(1000);
      cy.screenshot('production-offline-indicator', {
        capture: 'fullPage',
        overwrite: true
      });
    });

    it('should capture connection lost state', () => {
      cy.visit('/canvas');
      cy.wait(3000);
      
      // Simulate connection loss
      cy.intercept('**', { forceNetworkError: true }).as('connectionLost');
      
      cy.wait(2000);
      cy.screenshot('production-connection-lost', {
        capture: 'fullPage',
        overwrite: true
      });
    });
  });

  describe('Performance Screenshots', () => {
    it('should capture loading states', () => {
      cy.visit('/canvas');
      
      // Capture during loading
      cy.screenshot('production-canvas-loading', {
        capture: 'fullPage',
        overwrite: true
      });
      
      // Wait for load completion
      cy.get('[data-testid="canvas-container"]').should('be.visible');
      cy.wait(1000);
      
      cy.screenshot('production-canvas-loaded', {
        capture: 'fullPage',
        overwrite: true
      });
    });

    it('should capture performance indicators', () => {
      cy.visit('/canvas');
      cy.wait(3000);
      
      // Create multiple objects to show performance
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="tool-rectangle"]').click();
        cy.get('[data-testid="canvas-stage"]').click(100 + i * 50, 100 + i * 50);
        cy.get('[data-testid="canvas-stage"]').click(150 + i * 50, 150 + i * 50);
      }
      
      cy.wait(2000);
      cy.screenshot('production-performance-multiple-objects', {
        capture: 'fullPage',
        overwrite: true
      });
    });
  });

  describe('Mobile Screenshots', () => {
    it('should capture mobile home page', () => {
      cy.viewport(375, 667); // iPhone SE
      cy.visit('/');
      cy.wait(2000);
      
      cy.screenshot('production-mobile-home-page', {
        capture: 'fullPage',
        overwrite: true
      });
    });

    it('should capture mobile canvas page', () => {
      cy.viewport(375, 667);
      cy.visit('/canvas');
      cy.wait(3000);
      
      cy.screenshot('production-mobile-canvas-page', {
        capture: 'fullPage',
        overwrite: true
      });
    });

    it('should capture mobile toolbar', () => {
      cy.viewport(375, 667);
      cy.visit('/canvas');
      cy.wait(3000);
      
      cy.get('[data-testid="floating-toolbar"]').should('be.visible');
      cy.screenshot('production-mobile-toolbar', {
        capture: 'viewport',
        overwrite: true
      });
    });
  });

  describe('Accessibility Screenshots', () => {
    it('should capture keyboard navigation focus', () => {
      cy.visit('/');
      cy.wait(2000);
      
      // Tab to focus elements
      cy.get('body').tab();
      cy.focused().should('be.visible');
      
      cy.screenshot('production-keyboard-navigation', {
        capture: 'fullPage',
        overwrite: true
      });
    });

    it('should capture high contrast mode', () => {
      cy.visit('/canvas');
      cy.wait(3000);
      
      // Simulate high contrast
      cy.get('body').invoke('css', 'filter', 'contrast(200%)');
      
      cy.screenshot('production-high-contrast', {
        capture: 'fullPage',
        overwrite: true
      });
    });
  });

  describe('User Experience Screenshots', () => {
    it('should capture complete user workflow', () => {
      // Start from home
      cy.visit('/');
      cy.wait(2000);
      cy.screenshot('production-workflow-1-home', {
        capture: 'fullPage',
        overwrite: true
      });
      
      // Create canvas
      cy.get('[data-testid="create-canvas-button"]').click();
      cy.wait(2000);
      cy.screenshot('production-workflow-2-canvas-created', {
        capture: 'fullPage',
        overwrite: true
      });
      
      // Add objects
      cy.get('[data-testid="tool-rectangle"]').click();
      cy.get('[data-testid="canvas-stage"]').click(200, 200);
      cy.get('[data-testid="canvas-stage"]').click(300, 300);
      
      cy.get('[data-testid="tool-text"]').click();
      cy.get('[data-testid="canvas-stage"]').click(400, 200);
      cy.get('[data-testid="text-input"]').type('Production Workflow Test');
      cy.get('[data-testid="text-input"]').blur();
      
      cy.wait(2000);
      cy.screenshot('production-workflow-3-objects-added', {
        capture: 'fullPage',
        overwrite: true
      });
    });

    it('should capture collaboration workflow', () => {
      cy.visit('/canvas');
      cy.wait(3000);
      
      // Show collaboration features
      cy.get('[data-testid="collaboration-sidebar"]').should('be.visible');
      cy.get('[data-testid="invite-collaborator-button"]').click();
      cy.wait(1000);
      
      cy.screenshot('production-collaboration-workflow', {
        capture: 'fullPage',
        overwrite: true
      });
    });
  });
});
