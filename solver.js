// Beginner layer-by-layer solver (simplified).
// For now this solver simply inverts the scramble sequence.
// A hook is provided below to integrate an advanced Kociemba solver later.
import { parseMoves, invertMoves, movesToString } from './utils.js';

export function solveFromScramble(scramble){
  // scramble: string of moves used to scramble cube
  const inv = invertMoves(scramble);
  return inv;
}

// Placeholder for future advanced solver integration
// To plug in Kociemba solver, export a function `solve(state)` that
// converts cube state into the solver's representation and returns
// a move string. The worker will prefer advanced solver if available.
