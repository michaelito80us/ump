/// <reference types="cypress" />

describe('Internationalization', () => {
  beforeEach(() => {
    // Visit the English version of the homepage
    cy.visit('/en');
  });

  it('should display content in English by default', () => {
    cy.contains('Welcome').should('be.visible');
    cy.contains('UMP Tournament Manager').should('be.visible');
  });

  it('should change locale when language switcher is used', () => {
    // Check initial English content
    cy.contains('Welcome').should('be.visible');

    // Click Spanish language switcher and wait for it to be clickable
    cy.get('[data-testid="language-switcher-es"]')
      .should('be.visible')
      .should('not.be.disabled')
      .click();

    // Wait for navigation to complete by checking URL change
    cy.url({ timeout: 15000 }).should('include', '/es');

    // Wait for page to fully load before checking content
    cy.wait(1000);

    // Verify Spanish content is displayed
    cy.contains('Bienvenido').should('be.visible');
    cy.contains('UMP Móvil').should('be.visible');
  });

  it('should switch back to English from Spanish', () => {
    // Start with Spanish
    cy.visit('/es');
    cy.contains('Bienvenido').should('be.visible');

    // Switch to English
    cy.get('[data-testid="language-switcher-en"]').click();

    // Verify URL and content
    cy.url().should('include', '/en');
    cy.contains('Welcome').should('be.visible');
  });
});
