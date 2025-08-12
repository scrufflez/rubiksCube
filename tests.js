// Lightweight test harness triggered from UI
import { randomScramble, movesToString, invertMoves, parseMoves } from './utils.js';
import { solveFromScramble } from './solver.js';

function runTests(){
  const results=[];
  // Test inversion
  const scr = movesToString(randomScramble(10,123));
  const combined = movesToString(invertMoves(invertMoves(scr)));
  results.push('invertMoves: ' + (scr===combined ? 'ok':'fail'));
  // Solver test on 100 scrambles
  let ok=true; for(let i=0;i<100;i++){ const s=movesToString(randomScramble()); const sol=solveFromScramble(s); if(movesToString(sol)!==movesToString(invertMoves(s))) {ok=false;break;} }
  results.push('solver inverse: ' + (ok? 'ok':'fail'));
  alert(results.join('\n'));
}

document.getElementById('testsBtn').addEventListener('click',runTests);
