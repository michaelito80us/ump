/// <reference types="cypress" />

describe('Internationalization', () => {
  beforeEach(() => {
    // Visit the English version of the homepage
    cy.visit('/en');
  });

  it('should display content in English by default', () => {
    cy.contains('Welcome').should('be.visible');
    cy.contains('UMP Mobile').should('be.visible');
  });

  it('should change locale when language switcher is used', () => {
    // Check initial English content
    cy.contains('Welcome').should('be.visible');

    // Click Spanish language switcher
    cy.get('[data-testid="language-switcher-es"]').click();

    // Verify URL changed to Spanish
    cy.url().should('include', '/es');

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
