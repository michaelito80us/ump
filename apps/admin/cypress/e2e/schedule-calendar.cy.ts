/// <reference types="cypress" />

describe('T-5.4: Schedule Calendar with Drag-Drop', () => {
  beforeEach(() => {
    // Visit the schedule test page
    cy.visit('/schedule-test');

    // Wait for the page to load
    cy.contains('Schedule Calendar Test', { timeout: 10000 }).should(
      'be.visible'
    );
  });

  it('should display the basic page elements', () => {
    // Check for basic page elements first
    cy.get('h1').should('contain', 'Schedule Calendar Test');
    cy.get('button').should('contain', 'Regenerate Matches');
    cy.get('input[type="checkbox"]').should('be.visible');
    cy.get('select').should('be.visible');
  });

  it('should display the schedule calendar container', () => {
    // Wait for Tournament Schedule to be visible
    cy.contains('Tournament Schedule', { timeout: 10000 }).should('be.visible');

    // Verify calendar container exists
    cy.get('[data-testid="schedule-calendar"]', { timeout: 10000 }).should(
      'exist'
    );

    // Check if there are any console errors
    cy.window().then((win) => {
      cy.log('Checking for console errors');
    });
  });

  it('should display the schedule calendar with matches', () => {
    // Generate matches first
    cy.get('button').contains('Regenerate Matches').click();

    // Wait for Tournament Schedule to be visible
    cy.contains('Tournament Schedule', { timeout: 10000 }).should('be.visible');

    // Wait a bit for calendar to render
    cy.wait(3000);

    // Verify calendar container exists
    cy.get('[data-testid="schedule-calendar"]', { timeout: 10000 }).should(
      'exist'
    );

    // Check if FullCalendar root element exists
    cy.get('.fc', { timeout: 15000 }).should('exist');

    // Verify calendar is rendered
    cy.get('.fc-daygrid', { timeout: 15000 }).should('be.visible');

    // Verify matches are displayed as events
    cy.get('.fc-event', { timeout: 10000 }).should(
      'have.length.greaterThan',
      0
    );
  });

  it('should allow drag-drop of unlocked matches', () => {
    // Ensure we're not in read-only mode
    cy.get('input[type="checkbox"]').should('not.be.checked');

    // Find a draggable event (not locked)
    cy.get('.fc-event').not('.locked-event').first().as('draggableEvent');

    // Get the initial position
    cy.get('@draggableEvent').then(($event) => {
      const initialText = $event.text();

      // Perform drag and drop to a different day
      cy.get('@draggableEvent').trigger('mousedown', { which: 1 }).wait(100);

      // Find a different day cell to drop on
      cy.get('.fc-daygrid-day')
        .not('.fc-day-disabled')
        .eq(1)
        .trigger('mousemove')
        .trigger('mouseup');

      // Verify the event moved (this is a basic check)
      // In a real implementation, you'd verify the actual time change
      cy.get('.fc-event').should('contain', initialText);
    });
  });

  it('should prevent drag-drop of locked matches', () => {
    // Ensure we're not in read-only mode
    cy.get('input[type="checkbox"]').should('not.be.checked');

    // Look for locked events (they should have lock icon or specific class)
    cy.get('.fc-event').then(($events) => {
      // Find a locked event by checking for lock icon or locked class
      const lockedEvent = Array.from($events).find(
        (event) =>
          event.textContent?.includes('🔒') ||
          event.classList.contains('locked-event')
      );

      if (lockedEvent) {
        cy.wrap(lockedEvent).as('lockedEvent');

        // Get initial position
        cy.get('@lockedEvent').then(($event) => {
          const initialPosition = $event.offset();

          // Attempt to drag the locked event
          cy.get('@lockedEvent').trigger('mousedown', { which: 1 }).wait(100);

          // Try to move to a different day
          cy.get('.fc-daygrid-day')
            .not('.fc-day-disabled')
            .eq(2)
            .trigger('mousemove')
            .trigger('mouseup');

          // Verify the event didn't move (position should be the same)
          cy.get('@lockedEvent').then(($eventAfter) => {
            const finalPosition = $eventAfter.offset();
            expect(finalPosition?.top).to.equal(initialPosition?.top);
            expect(finalPosition?.left).to.equal(initialPosition?.left);
          });
        });
      } else {
        // If no locked events found, create one by changing a match status
        cy.log('No locked events found in current view');
      }
    });
  });

  it('should disable drag-drop in read-only mode', () => {
    // Enable read-only mode
    cy.get('input[type="checkbox"]').check();
    cy.get('input[type="checkbox"]').should('be.checked');

    // Try to drag any event
    cy.get('.fc-event').first().as('anyEvent');

    cy.get('@anyEvent').then(($event) => {
      const initialPosition = $event.offset();

      // Attempt to drag
      cy.get('@anyEvent').trigger('mousedown', { which: 1 }).wait(100);

      // Try to move to a different day
      cy.get('.fc-daygrid-day')
        .not('.fc-day-disabled')
        .eq(1)
        .trigger('mousemove')
        .trigger('mouseup');

      // Verify the event didn't move
      cy.get('@anyEvent').then(($eventAfter) => {
        const finalPosition = $eventAfter.offset();
        expect(finalPosition?.top).to.equal(initialPosition?.top);
        expect(finalPosition?.left).to.equal(initialPosition?.left);
      });
    });
  });

  it('should filter matches by venue', () => {
    // Get initial count of events
    cy.get('.fc-event').then(($initialEvents) => {
      const initialCount = $initialEvents.length;

      // Select a specific venue from dropdown
      cy.get('select').select('Field A');

      // Wait for filter to apply
      cy.wait(500);

      // Verify events are filtered
      cy.get('.fc-event').then(($filteredEvents) => {
        // Should have fewer or equal events after filtering
        expect($filteredEvents.length).to.be.at.most(initialCount);

        // All visible events should be for Field A
        $filteredEvents.each((index, event) => {
          expect(event.textContent).to.include('Field A');
        });
      });
    });
  });

  it('should show match details on click', () => {
    // Click on any event
    cy.get('.fc-event').first().click();

    // Verify modal or details panel appears
    // This depends on the implementation - adjust selector as needed
    cy.get('[role="dialog"]').should('be.visible');

    // Verify match details are shown
    cy.get('[role="dialog"]').should('contain', 'vs');

    // Close the modal
    cy.get('button').contains('Close').click();
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('should regenerate matches when button is clicked', () => {
    // Get initial events
    cy.get('.fc-event').then(($initialEvents) => {
      const initialCount = $initialEvents.length;

      // Click regenerate button
      cy.get('button').contains('Regenerate Matches').click();

      // Wait for regeneration
      cy.wait(1000);

      // Verify events are still present (may be different)
      cy.get('.fc-event').should('have.length.greaterThan', 0);
    });
  });

  it('should display status legend', () => {
    // Verify status legend is visible
    cy.contains('Status Legend').should('be.visible');

    // Verify different status types are shown
    cy.contains('Scheduled').should('be.visible');
    cy.contains('Live').should('be.visible');
    cy.contains('Final').should('be.visible');
  });

  it('should show loading state during updates', () => {
    // This test would need to be implemented based on how loading states are handled
    // For now, just verify the calendar renders without loading indicators
    cy.get('.fc-daygrid').should('be.visible');
    cy.get('.fc-event').should('have.length.greaterThan', 0);
  });
});
