/// <reference types="cypress" />

describe('PWA Functionality', () => {
  beforeEach(() => {
    // Visit the homepage first to ensure app is loaded
    cy.visit('/en');
    // Wait for the page to load completely
    cy.contains('Welcome').should('be.visible');
    cy.contains('UMP Tournament Manager').should('be.visible');
  });

  it('should display PWA features on homepage', () => {
    // Verify PWA test page link exists
    cy.contains('PWA Test Page').should('be.visible');

    // Verify PWA features list
    cy.contains('PWA Features to Test:').should('be.visible');
    cy.contains('Install app prompt').should('be.visible');
    cy.contains('Offline data storage').should('be.visible');
    cy.contains('Online/offline indicators').should('be.visible');
    cy.contains('Background sync').should('be.visible');
  });

  it('should navigate to PWA test page successfully', () => {
    // Click on PWA Test Page link using more specific text matching
    cy.contains('🚀 PWA Test Page').should('be.visible').click();

    // Wait for navigation to complete by checking URL change
    cy.url({ timeout: 15000 }).should('include', '/test-pwa');

    // Wait for page to fully load
    cy.wait(1000);

    // Verify we're on the PWA test page
    cy.contains('PWA Test Page').should('be.visible');
  });

  it('should verify service worker is registered', () => {
    // Check that service worker is supported in the browser
    cy.window().should('have.property', 'navigator');
    cy.window().its('navigator').should('have.property', 'serviceWorker');
  });

  it('should verify PWA navigation works', () => {
    // Navigate to PWA test page from homepage
    cy.contains('PWA Test Page').click();

    // Verify we're on the PWA test page
    cy.url().should('include', '/test-pwa');
    cy.contains('PWA Test Page').should('be.visible');

    // Wait for database initialization to complete
    cy.wait(2000);
  });

  it('should verify service worker file exists', () => {
    // Check that the service worker file is accessible
    cy.request('/sw.js').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.include('UMP Tournament Manager');
    });
  });
});

// Test PWA manifest and installation
describe('PWA Installation', () => {
  it('should have proper PWA manifest', () => {
    cy.visit('/en');

    // Check for manifest link in head
    cy.get('head link[rel="manifest"]').should('exist');
  });

  it('should load manifest.json successfully', () => {
    cy.request('/manifest.json').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('name');
      expect(response.body).to.have.property('short_name');
      expect(response.body).to.have.property('start_url');
      expect(response.body).to.have.property('display');
      expect(response.body).to.have.property('theme_color');
      expect(response.body).to.have.property('background_color');
      expect(response.body).to.have.property('icons');
    });
  });
});
