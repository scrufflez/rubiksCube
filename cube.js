// Cube model and animation system using Three.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.156.1/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.156.1/examples/jsm/controls/OrbitControls.js';
import { SceneUtils } from "https://cdn.jsdelivr.net/npm/three@0.156.1/examples/jsm/utils/SceneUtils.js";
import { parseMoves, movesToString, invertMoves, randomScramble, FACES } from './utils.js';

const COLORS = {U:0xffffff, D:0xffff00, L:0xff8000, R:0xff0000, F:0x00ff00, B:0x0000ff, X:0x222222};

export class Cube {
  constructor(container){
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth/container.clientHeight, 0.1, 1000);
    this.camera.position.set(3,3,4);
    this.renderer = new THREE.WebGLRenderer({antialias:true});
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff,0.6); this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff,0.6); dir.position.set(5,5,5); this.scene.add(dir);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.group = new THREE.Group();
    this.scene.add(this.group);
    this._createCubies();

    this.moveQueue=[]; this.isAnimating=false; this.history=[]; this.lastScramble=[]; this.paused=true;
    this.speed=1; // multiplier
    window.addEventListener('resize',()=>this._onResize());
    this._onResize();
  }

  _onResize(){
    const w = this.container.clientWidth; const h = this.container.clientHeight;
    this.camera.aspect=w/h; this.camera.updateProjectionMatrix();
    this.renderer.setSize(w,h);
  }

  _createCubies(){
    this.cubies=[];
    const geo = new THREE.BoxGeometry(0.98,0.98,0.98);
    for(let x=-1;x<=1;x++){
      for(let y=-1;y<=1;y++){
        for(let z=-1;z<=1;z++){
          if(x===0 && y===0 && z===0) continue;
          const mats=[];
          mats.push(new THREE.MeshLambertMaterial({color: x===1? COLORS.R: COLORS.X})); // +X R
          mats.push(new THREE.MeshLambertMaterial({color: x===-1? COLORS.L: COLORS.X})); // -X L
          mats.push(new THREE.MeshLambertMaterial({color: y===1? COLORS.U: COLORS.X})); // +Y U
          mats.push(new THREE.MeshLambertMaterial({color: y===-1? COLORS.D: COLORS.X})); // -Y D
          mats.push(new THREE.MeshLambertMaterial({color: z===1? COLORS.F: COLORS.X})); // +Z F
          mats.push(new THREE.MeshLambertMaterial({color: z===-1? COLORS.B: COLORS.X})); // -Z B
          const mesh = new THREE.Mesh(geo, mats);
          mesh.position.set(x,y,z);
          mesh.userData = {home:new THREE.Vector3(x,y,z)};
          this.group.add(mesh);
          this.cubies.push(mesh);
        }
      }
    }
  }

  update(dt){
    if(this.isAnimating) this._animate(dt);
    else if(!this.paused) this._next();
    this.controls.update();
    this.renderer.render(this.scene,this.camera);
  }

  play(){this.paused=false;}
  pause(){this.paused=true;}
  toggle(){this.paused=!this.paused;}
  setSpeed(mult){this.speed=mult;}

  queueMoves(moves, record=true){
    if(typeof moves==='string') moves=parseMoves(moves);
    moves.forEach(m=>{this.moveQueue.push({...m, record});});
  }

  async randomScramble(n=25, seed){
    const moves=randomScramble(n,seed); this.lastScramble=moves;
    this.queueMoves(moves);
    return movesToString(moves);
  }

  reset(){
    // rebuild cube
    this.scene.remove(this.group);
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this._createCubies();
    this.moveQueue=[]; this.history=[]; this.lastScramble=[];
  }

  undo(){
    if(!this.history.length) return;
    const move=this.history.pop();
    this.queueMoves(invertMoves([move]), false);
  }

  applyMoves(str){
    this.queueMoves(str);
  }

  isSolved(){
    return this.cubies.every(c=>{
      const p=c.position.clone().round();
      const h=c.userData.home;
      return p.equals(h) && c.rotation.x% (Math.PI/2)===0 && c.rotation.y% (Math.PI/2)===0 && c.rotation.z%(Math.PI/2)===0;
    });
  }

  _next(){
    if(this.isAnimating||!this.moveQueue.length) return;
    const move=this.moveQueue.shift();
    this._startMove(move);
  }

  _startMove(move){
    const {face,amount,dir,record}=move;
    const axis = {U:'y',D:'y',L:'x',R:'x',F:'z',B:'z'}[face];
    const layer = {U:1,D:-1,L:-1,R:1,F:1,B:-1}[face];
    const cubies=this.cubies.filter(c=>Math.round(c.position[axis])===layer);
    const pivot=new THREE.Group(); pivot.position.set(0,0,0);
    this.group.add(pivot); cubies.forEach(c=>{SceneUtils.attach(c,this.group,pivot);});
    const angle=dir*amount*Math.PI/2;
    this.animating={pivot, cubies, axis, angle, rotated:0, record, notation: face + (amount===2?'2':'') + (dir===-1?"'":'')};
    this.isAnimating=true;
  }

  _animate(dt){
    const speed = Math.PI/2 * this.speed; // rad per sec
    const step = Math.sign(this.animating.angle) * speed * dt/1000;
    const remain = this.animating.angle - this.animating.rotated;
    const rot = Math.abs(step) > Math.abs(remain)? remain : step;
    this.animating.pivot.rotateOnAxis(new THREE.Vector3(this.animating.axis==='x',this.animating.axis==='y',this.animating.axis==='z'), rot);
    this.animating.rotated += rot;
    if(Math.abs(this.animating.rotated)>=Math.abs(this.animating.angle)-1e-5){
      // finish
      this.animating.pivot.rotateOnAxis(new THREE.Vector3(this.animating.axis==='x',this.animating.axis==='y',this.animating.axis==='z'), remain);
      this.animating.cubies.forEach(c=>{
        SceneUtils.detach(c,this.animating.pivot,this.group);
        c.position.set(Math.round(c.position.x),Math.round(c.position.y),Math.round(c.position.z));
        c.rotation.x=Math.round(c.rotation.x/ (Math.PI/2))*(Math.PI/2);
        c.rotation.y=Math.round(c.rotation.y/ (Math.PI/2))*(Math.PI/2);
        c.rotation.z=Math.round(c.rotation.z/ (Math.PI/2))*(Math.PI/2);
      });
      this.group.remove(this.animating.pivot);
      if(this.animating.record) this.history.push(this.animating.notation);
      this.isAnimating=false; this.animating=null;
    }
  }
}
