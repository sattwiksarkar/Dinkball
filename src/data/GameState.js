// GameState — singleton holding cross-scene state.
const GameState = {
  mode: 'quick',          // 'quick' | 'circuit' | 'tournament' | 'practice'
  playerId: 'rex',
  opponentId: 'colonel',
  venueId: 'garden',
  circuitTier: 1,
  aiDifficulty: 'Medium', // 'Easy' | 'Medium' | 'Hard' | 'Expert'
  charSelectRole: 'player', // 'player' | 'opponent'
};

export default GameState;
