describe('GraphQL Integration', () => {
  it('should load the GraphQL test page', () => {
    cy.visit('/en/test-graphql');
    cy.contains('GraphQL Client Test').should('be.visible');
    cy.contains('Test Checklist').should('be.visible');
  });

  it('should display Apollo Client test component', () => {
    cy.visit('/en/test-graphql');
    cy.get('[data-testid="apollo-test-component"]', { timeout: 15000 }).should(
      'be.visible'
    );
    cy.get('[data-testid="graphql-status"]').should('be.visible');
  });

  it('should display GraphQL integration checklist', () => {
    cy.visit('/en/test-graphql');
    const checklistItems = [
      'Apollo Client configuration',
      'HTTP Link for queries/mutations',
      'WebSocket Link for subscriptions',
      'Clerk JWT authentication',
      'Error handling',
      'Cache configuration',
    ];

    checklistItems.forEach((item) => {
      cy.contains(item).should('be.visible');
    });
  });

  it('should verify GraphQL endpoint accessibility', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:4001/graphql',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        query: '{__typename}',
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('__typename', 'Query');
    });
  });

  it('should not show critical errors on the page', () => {
    cy.visit('/en/test-graphql');
    // Allow time for any async operations
    cy.wait(3000);
    // Check that the page doesn't show any critical error messages
    cy.get('body').should('not.contain', 'TypeError:');
    cy.get('body').should('not.contain', 'ReferenceError:');
  });
});
