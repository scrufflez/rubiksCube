// Utility functions for notation parsing, scramble generation, etc.
export const FACES = ['U','D','L','R','F','B'];

// Parse a move string like "R U R' U' F2" into array
export function parseMoves(str){
  return str.trim().split(/\s+/).filter(Boolean).map(tok=>{
    const face = tok[0];
    let amount = 1;
    if(tok.includes("2")) amount = 2;
    let dir = tok.includes("'")? -1 : 1;
    return {face, amount, dir};
  });
}

// Convert moves array back to string
export function movesToString(moves){
  return moves.map(m=> m.face + (m.amount===2? '2':'') + (m.dir===-1? "'":'')).join(' ');
}

// Invert a move sequence
export function invertMoves(moves){
  if(typeof moves === 'string') moves = parseMoves(moves);
  return moves.slice().reverse().map(m=>({face:m.face, amount:m.amount, dir:-m.dir}));
}

// Pseudo random generator with seed (xorshift32)
export function rng(seed){
  let x = seed|0 || Date.now();
  return function(){
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return (x>>>0)/4294967296;
  }
}

// Generate random scramble avoiding immediate inverses/repeats
export function randomScramble(n=25, seed){
  const rnd = rng(seed);
  const moves=[];
  while(moves.length<n){
    const face = FACES[Math.floor(rnd()*6)];
    const last = moves[moves.length-1];
    if(last && last.face===face) continue;
    const dir = rnd() > 0.5 ? 1 : -1;
    const amount = rnd() > 0.8 ? 2 : 1;
    const move = {face, amount, dir};
    // avoid immediate inverse
    const inverse = last && last.face===face && last.dir===-dir && last.amount===amount;
    if(inverse) continue;
    moves.push(move);
  }
  return moves;
}

export const sleep = ms => new Promise(res=>setTimeout(res,ms));
