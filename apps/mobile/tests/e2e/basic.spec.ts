describe('Basic Page Access', () => {
  it('should load the home page', () => {
    cy.visit('http://localhost:3001/en');
    cy.get('body').should('be.visible');
    cy.contains('English').should('be.visible');
  });

  it('should load the live scores page', () => {
    cy.visit('http://localhost:3001/en/live');
    cy.get('[data-testid="live-scores-view"]', { timeout: 10000 }).should(
      'be.visible'
    );
  });

  it('should load the schedule page', () => {
    cy.visit('http://localhost:3001/en/schedule');
    cy.get('[data-testid="schedule-view"]', { timeout: 10000 }).should(
      'be.visible'
    );
  });

  it('should load the standings page', () => {
    cy.visit('http://localhost:3001/en/standings');
    cy.get('body').should('be.visible');
  });
});
