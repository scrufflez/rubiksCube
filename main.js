// App bootstrap and UI wiring
import { Cube } from './cube.js';
import { parseMoves, movesToString, invertMoves, randomScramble, FACES } from './utils.js';

const sceneEl = document.getElementById("scene");
const cube = new Cube(sceneEl);
let last=0; function loop(t){ cube.update(t-last); last=t; updateStatus(); requestAnimationFrame(loop);} requestAnimationFrame(loop);

const logEl = document.getElementById('log');
const statusEl = document.getElementById('status');
const playBtn = document.getElementById('playBtn');

function updateStatus(){
  statusEl.textContent = cube.isSolved()? 'Solved' : 'Unsolved';
  logEl.textContent = cube.history.join(' ');
}

// Buttons
const scrambleBtn = document.getElementById('scrambleBtn');
scrambleBtn.addEventListener('click', async()=>{
  cube.play();
  const scr = await cube.randomScramble();
  updateStatus();
});

const solveBtn = document.getElementById('solveBtn');
const worker = new Worker('worker.js', {type:'module'});
worker.onmessage = e=>{
  if(e.data.type==='solution'){
    cube.queueMoves(e.data.moves);
    cube.play();
  }
};
solveBtn.addEventListener('click',()=>{
  worker.postMessage({type:'solve', scramble:movesToString(cube.lastScramble)});
});

const resetBtn = document.getElementById('resetBtn');
resetBtn.addEventListener('click',()=>{cube.reset(); updateStatus();});

const undoBtn = document.getElementById('undoBtn');
undoBtn.addEventListener('click',()=>{cube.undo();});

const stepBtn = document.getElementById('stepBtn');
stepBtn.addEventListener('click',()=>{cube.paused=true; cube._next();});

playBtn.addEventListener('click',()=>{
  cube.toggle(); playBtn.textContent = cube.paused? 'Play':'Pause';
});

const speedSlider = document.getElementById('speedSlider');
speedSlider.addEventListener('input',()=>cube.setSpeed(parseFloat(speedSlider.value)));

// Keyboard shortcuts
window.addEventListener('keydown',e=>{
  const key = e.key.toUpperCase();
  if(FACES.includes(key)){
    cube.queueMoves(key + (e.shiftKey? "'" : '') + (e.altKey?'2':''));
  }else if(key===' '){ playBtn.click(); }
  else if(e.key==='Backspace'){ cube.undo(); }
});

updateStatus();
window.cube = cube;
