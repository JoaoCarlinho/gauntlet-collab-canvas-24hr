// 🚀 Production Performance Tests
// Phase 5: Production Testing - Performance Monitoring

describe('Production Performance Tests', () => {
  beforeEach(() => {
    // Set production environment
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('production-mode', 'true');
        win.performance.mark('test-start');
      }
    });
  });

  describe('Page Load Performance', () => {
    it('should load home page within performance threshold', () => {
      const startTime = Date.now();
      
      cy.visit('/');
      cy.get('[data-testid="home-page"]').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000); // 3 seconds max
        
        // Log performance metrics
        cy.log(`Home page load time: ${loadTime}ms`);
      });
    });

    it('should load canvas page within performance threshold', () => {
      const startTime = Date.now();
      
      cy.visit('/canvas');
      cy.get('[data-testid="canvas-container"]').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(5000); // 5 seconds max for canvas
        
        // Log performance metrics
        cy.log(`Canvas page load time: ${loadTime}ms`);
      });
    });

    it('should measure Core Web Vitals', () => {
      cy.visit('/');
      cy.get('[data-testid="home-page"]').should('be.visible');
      
      // Measure performance metrics
      cy.window().then((win) => {
        return new Promise((resolve) => {
          win.addEventListener('load', () => {
            const navigation = win.performance.getEntriesByType('navigation')[0];
            const paint = win.performance.getEntriesByType('paint');
            
            const metrics = {
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
              loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
              firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
              firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
            };
            
            // Log metrics
            cy.log('Performance Metrics:', JSON.stringify(metrics, null, 2));
            
            // Assert performance thresholds
            expect(metrics.domContentLoaded).to.be.lessThan(2000);
            expect(metrics.loadComplete).to.be.lessThan(3000);
            expect(metrics.firstContentfulPaint).to.be.lessThan(2500);
            
            resolve(metrics);
          });
        });
      });
    });
  });

  describe('API Response Performance', () => {
    it('should measure API response times', () => {
      cy.visit('/canvas');
      cy.wait(3000);
      
      // Intercept API calls and measure response times
      cy.intercept('GET', '**/api/**').as('apiCall');
      cy.intercept('POST', '**/api/**').as('apiPost');
      
      // Trigger API calls
      cy.get('[data-testid="tool-rectangle"]').click();
      cy.get('[data-testid="canvas-stage"]').click(200, 200);
      cy.get('[data-testid="canvas-stage"]').click(300, 300);
      
      // Wait for API calls and measure
      cy.wait('@apiPost').then((interception) => {
        const responseTime = interception.response.duration;
        expect(responseTime).to.be.lessThan(1000); // 1 second max
        
        cy.log(`API response time: ${responseTime}ms`);
      });
    });

    it('should measure WebSocket connection performance', () => {
      cy.visit('/canvas');
      cy.wait(3000);
      
      // Measure WebSocket connection time
      cy.window().then((win) => {
        const startTime = Date.now();
        
        // Check if WebSocket is connected
        cy.get('[data-testid="connection-status"]').should('contain', 'Connected');
        
        cy.then(() => {
          const connectionTime = Date.now() - startTime;
          expect(connectionTime).to.be.lessThan(2000); // 2 seconds max
          
          cy.log(`WebSocket connection time: ${connectionTime}ms`);
        });
      });
    });
  });

  describe('Memory Usage Performance', () => {
    it('should monitor memory usage during object creation', () => {
      cy.visit('/canvas');
      cy.wait(3000);
      
      // Get initial memory usage
      cy.window().then((win) => {
        const initialMemory = (win.performance as any).memory?.usedJSHeapSize || 0;
        
        // Create multiple objects
        for (let i = 0; i < 10; i++) {
          cy.get('[data-testid="tool-rectangle"]').click();
          cy.get('[data-testid="canvas-stage"]').click(200 + i * 10, 200 + i * 10);
          cy.get('[data-testid="canvas-stage"]').click(300 + i * 10, 300 + i * 10);
        }
        
        // Check final memory usage
        cy.then(() => {
          const finalMemory = (win.performance as any).memory?.usedJSHeapSize || 0;
          const memoryIncrease = finalMemory - initialMemory;
          
          // Memory increase should be reasonable (less than 50MB)
          expect(memoryIncrease).to.be.lessThan(50 * 1024 * 1024);
          
          cy.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
        });
      });
    });

    it('should handle memory cleanup on object deletion', () => {
      cy.visit('/canvas');
      cy.wait(3000);
      
      // Create objects
      cy.get('[data-testid="tool-rectangle"]').click();
      cy.get('[data-testid="canvas-stage"]').click(200, 200);
      cy.get('[data-testid="canvas-stage"]').click(300, 300);
      
      // Get memory after creation
      cy.window().then((win) => {
        const memoryAfterCreation = (win.performance as any).memory?.usedJSHeapSize || 0;
        
        // Delete object
        cy.get('[data-testid="canvas-stage"]').click(250, 250);
        cy.get('[data-testid="delete-button"]').click();
        
        // Check memory after deletion
        cy.then(() => {
          const memoryAfterDeletion = (win.performance as any).memory?.usedJSHeapSize || 0;
          
          // Memory should not increase significantly after deletion
          expect(memoryAfterDeletion).to.be.lessThan(memoryAfterCreation * 1.1);
          
          cy.log(`Memory after creation: ${(memoryAfterCreation / 1024 / 1024).toFixed(2)}MB`);
          cy.log(`Memory after deletion: ${(memoryAfterDeletion / 1024 / 1024).toFixed(2)}MB`);
        });
      });
    });
  });

  describe('Rendering Performance', () => {
    it('should maintain smooth rendering with many objects', () => {
      cy.visit('/canvas');
      cy.wait(3000);
      
      // Create many objects
      for (let i = 0; i < 20; i++) {
        cy.get('[data-testid="tool-rectangle"]').click();
        cy.get('[data-testid="canvas-stage"]').click(100 + i * 20, 100 + i * 20);
        cy.get('[data-testid="canvas-stage"]').click(150 + i * 20, 150 + i * 20);
      }
      
      // Test panning performance
      const startTime = Date.now();
      cy.get('[data-testid="canvas-stage"]').trigger('mousedown', { which: 2 });
      cy.get('[data-testid="canvas-stage"]').trigger('mousemove', { clientX: 100, clientY: 100 });
      cy.get('[data-testid="canvas-stage"]').trigger('mouseup');
      
      cy.then(() => {
        const panTime = Date.now() - startTime;
        expect(panTime).to.be.lessThan(100); // Pan should be smooth
        
        cy.log(`Pan operation time: ${panTime}ms`);
      });
    });

    it('should handle zoom performance smoothly', () => {
      cy.visit('/canvas');
      cy.wait(3000);
      
      // Test zoom performance
      const startTime = Date.now();
      cy.get('[data-testid="canvas-stage"]').trigger('wheel', { deltaY: -100 });
      
      cy.then(() => {
        const zoomTime = Date.now() - startTime;
        expect(zoomTime).to.be.lessThan(50); // Zoom should be very smooth
        
        cy.log(`Zoom operation time: ${zoomTime}ms`);
      });
    });
  });

  describe('Network Performance', () => {
    it('should handle slow network conditions', () => {
      // Simulate slow 3G
      cy.intercept('**', (req) => {
        req.reply((res) => {
          res.delay(1000); // 1 second delay
          return res;
        });
      }).as('slowNetwork');
      
      const startTime = Date.now();
      cy.visit('/');
      cy.get('[data-testid="home-page"]').should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - startTime;
        // Should still load within reasonable time even with slow network
        expect(loadTime).to.be.lessThan(10000); // 10 seconds max
        
        cy.log(`Load time with slow network: ${loadTime}ms`);
      });
    });

    it('should handle network interruptions gracefully', () => {
      cy.visit('/canvas');
      cy.wait(3000);
      
      // Simulate network interruption
      cy.intercept('**', { forceNetworkError: true }).as('networkError');
      
      // Try to create an object
      cy.get('[data-testid="tool-rectangle"]').click();
      cy.get('[data-testid="canvas-stage"]').click(200, 200);
      cy.get('[data-testid="canvas-stage"]').click(300, 300);
      
      // Should show error handling UI
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });
  });

  describe('Concurrent User Performance', () => {
    it('should handle multiple rapid interactions', () => {
      cy.visit('/canvas');
      cy.wait(3000);
      
      // Rapid tool switching
      const startTime = Date.now();
      for (let i = 0; i < 50; i++) {
        cy.get('[data-testid="tool-rectangle"]').click();
        cy.get('[data-testid="tool-circle"]').click();
        cy.get('[data-testid="tool-text"]').click();
      }
      
      cy.then(() => {
        const totalTime = Date.now() - startTime;
        const avgTimePerInteraction = totalTime / 150; // 50 * 3 interactions
        
        expect(avgTimePerInteraction).to.be.lessThan(100); // 100ms per interaction max
        
        cy.log(`Average interaction time: ${avgTimePerInteraction.toFixed(2)}ms`);
      });
    });

    it('should maintain performance during continuous object creation', () => {
      cy.visit('/canvas');
      cy.wait(3000);
      
      const startTime = Date.now();
      
      // Create objects continuously
      for (let i = 0; i < 30; i++) {
        cy.get('[data-testid="tool-rectangle"]').click();
        cy.get('[data-testid="canvas-stage"]').click(100 + i * 10, 100 + i * 10);
        cy.get('[data-testid="canvas-stage"]').click(150 + i * 10, 150 + i * 10);
      }
      
      cy.then(() => {
        const totalTime = Date.now() - startTime;
        const avgTimePerObject = totalTime / 30;
        
        expect(avgTimePerObject).to.be.lessThan(500); // 500ms per object max
        
        cy.log(`Average object creation time: ${avgTimePerObject.toFixed(2)}ms`);
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should collect comprehensive performance metrics', () => {
      cy.visit('/canvas');
      cy.wait(3000);
      
      // Collect performance metrics
      cy.window().then((win) => {
        const performanceData = {
          timestamp: new Date().toISOString(),
          userAgent: win.navigator.userAgent,
          viewport: {
            width: win.innerWidth,
            height: win.innerHeight
          },
          memory: (win.performance as any).memory ? {
            used: (win.performance as any).memory.usedJSHeapSize,
            total: (win.performance as any).memory.totalJSHeapSize,
            limit: (win.performance as any).memory.jsHeapSizeLimit
          } : null,
          timing: win.performance.timing ? {
            navigationStart: win.performance.timing.navigationStart,
            loadEventEnd: win.performance.timing.loadEventEnd,
            domContentLoadedEventEnd: win.performance.timing.domContentLoadedEventEnd
          } : null
        };
        
        // Log comprehensive metrics
        cy.log('Performance Data:', JSON.stringify(performanceData, null, 2));
        
        // Assert basic performance requirements
        if (performanceData.memory) {
          expect(performanceData.memory.used).to.be.lessThan(100 * 1024 * 1024); // 100MB max
        }
        
        if (performanceData.timing) {
          const loadTime = performanceData.timing.loadEventEnd - performanceData.timing.navigationStart;
          expect(loadTime).to.be.lessThan(5000); // 5 seconds max
        }
      });
    });
  });
});
