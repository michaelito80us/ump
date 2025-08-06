/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select DOM element by data-cy attribute.
       * @example cy.dataCy('greeting')
       */
      dataCy(value: string): Chainable<JQuery<HTMLElement>>;

      /**
       * Custom command to select DOM element by data-testid attribute.
       * @example cy.dataTestId('submit-button')
       */
      dataTestId(value: string): Chainable<JQuery<HTMLElement>>;
    }
  }
}

Cypress.Commands.add('dataCy', (value: string) => {
  return cy.get(`[data-cy="${value}"]`);
});

Cypress.Commands.add('dataTestId', (value: string) => {
  return cy.get(`[data-testid="${value}"]`);
});

// Prevent TypeScript from reading file as legacy script
export {};
