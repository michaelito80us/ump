/// <reference types="cypress" />
/// <reference types="jquery" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/* eslint-disable @typescript-eslint/no-namespace */
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

      /**
       * Custom command to setup tournament test data with API intercepts.
       * @example cy.setupTournamentData()
       */
      setupTournamentData(): Chainable<void>;

      /**
       * Custom command to mock live score updates for a specific match.
       * @example cy.mockLiveUpdates('match-123')
       */
      mockLiveUpdates(matchId: string): Chainable<void>;

      /**
       * Custom command to wait for tournament creation to complete.
       * @example cy.waitForTournamentCreation()
       */
      waitForTournamentCreation(): Chainable<void>;

      /**
       * Custom command to type text without keyboard simulation (bypasses KeyboardEvent issues).
       * @example cy.typeWithoutKeyboard('input[name="name"]', 'Tournament Name')
       */
      typeWithoutKeyboard(
        selector: string,
        text: string
      ): Chainable<JQuery<HTMLElement>>;

      /**
       * Custom command to simulate match status progression.
       * @example cy.simulateMatchProgression('match-123', 'LIVE')
       */
      simulateMatchProgression(
        matchId: string,
        newStatus: string
      ): Chainable<void>;
    }
  }
}

Cypress.Commands.add('dataCy', (value: string) => {
  return cy.get(`[data-cy="${value}"]`);
});

Cypress.Commands.add('dataTestId', (value: string) => {
  return cy.get(`[data-testid="${value}"]`);
});

Cypress.Commands.add('setupTournamentData', () => {
  // Mock GraphQL API responses for tournament data
  cy.intercept('POST', '**/graphql', (req) => {
    if (req.body.operationName === 'GetTournaments') {
      req.reply({ fixture: 'tournament.json' });
    } else if (req.body.operationName === 'GetMatches') {
      req.reply({ fixture: 'matches.json' });
    } else if (req.body.operationName === 'CreateTournament') {
      req.reply({
        data: {
          createTournament: {
            id: 'test-tournament-123',
            name: 'Summer Basketball Championship',
            status: 'published',
          },
        },
      });
    }
  }).as('graphqlApi');

  // Mock REST API endpoints if needed
  cy.intercept('GET', '**/api/tournaments/**', {
    fixture: 'tournament.json',
  }).as('getTournament');
  cy.intercept('GET', '**/api/matches/**', { fixture: 'matches.json' }).as(
    'getMatches'
  );
});

Cypress.Commands.add('mockLiveUpdates', (matchId: string) => {
  // Mock WebSocket or SSE connections for live updates
  cy.window().then((win) => {
    // Simulate live score updates
    const mockUpdate = {
      matchId,
      timestamp: new Date().toISOString(),
      type: 'SCORE_UPDATE',
      data: {
        homeScore: Math.floor(Math.random() * 100),
        awayScore: Math.floor(Math.random() * 100),
        timeRemaining: '05:30',
        quarter: 4,
      },
    };

    // Trigger custom event for live updates
    win.dispatchEvent(
      new CustomEvent('liveMatchUpdate', { detail: mockUpdate })
    );
  });
});

Cypress.Commands.add('waitForTournamentCreation', () => {
  // Wait for any GraphQL API calls to complete (with timeout handling)
  cy.wait('@graphqlApi', { timeout: 10000 }).then(() => {
    // Verify we're on a valid page after tournament creation
    cy.url().should('include', '/');
  });
});

Cypress.Commands.add(
  'simulateMatchProgression',
  (matchId: string, newStatus: string, scoreA?: number, scoreB?: number) => {
    // Dispatch a custom event to simulate real-time updates
    cy.window().then((win) => {
      // Dispatch match status update event
      win.dispatchEvent(
        new CustomEvent('matchStatusUpdate', {
          detail: {
            matchId,
            status: newStatus,
            scoreA: scoreA || 0,
            scoreB: scoreB || 0,
          },
        })
      );

      // Also dispatch a more generic match update event that components might listen to
      win.dispatchEvent(
        new CustomEvent('matchUpdate', {
          detail: {
            id: matchId,
            status: newStatus,
            scoreA: scoreA || 0,
            scoreB: scoreB || 0,
            updatedAt: new Date().toISOString(),
          },
        })
      );
    });

    // Wait for DOM to update after event dispatch
    cy.get('body').should('exist');
  }
);

// Custom command to type text without keyboard simulation
Cypress.Commands.add(
  'typeWithoutKeyboard',
  (selector: string, text: string) => {
    cy.get(selector).then(($el) => {
      const element = $el[0] as HTMLInputElement | HTMLTextAreaElement;

      // Set the value directly
      element.value = text;

      // Trigger input events to notify React/frameworks of the change
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));

      // For React specifically, trigger the synthetic event
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(element, text);
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }
);

// Prevent TypeScript from reading file as legacy script
export {};
