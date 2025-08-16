// Debug import test
try {
  console.log('Testing core import...');
  const core = require('../core/src/index.ts');
  console.log('Core exports:', Object.keys(core));
  console.log('TournamentError:', core.TournamentError);
  console.log('TournamentError type:', typeof core.TournamentError);
} catch (error) {
  console.error('Import error:', error.message);
  console.error('Stack:', error.stack);
}
