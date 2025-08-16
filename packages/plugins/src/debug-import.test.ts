// Debug import test - relative import
import { TournamentError } from '../../core/src/types';

describe('Debug Import Relative', () => {
  it('should import TournamentError with relative path', () => {
    console.log('TournamentError:', TournamentError);
    console.log('TournamentError type:', typeof TournamentError);
    expect(TournamentError).toBeDefined();
    expect(typeof TournamentError).toBe('function');
  });
});
