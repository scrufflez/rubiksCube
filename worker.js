// Web Worker to offload solving
import { solveFromScramble } from './solver.js';

self.onmessage = e=>{
  const data = e.data;
  if(data.type==='solve'){
    const moves = solveFromScramble(data.scramble);
    postMessage({type:'solution', moves});
  }
};
