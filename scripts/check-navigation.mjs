import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from '../assets/three.module.js';
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const section=app.slice(app.indexOf('const obstacles='),app.indexOf('const delay='));
const camera={position:new THREE.Vector3(-2.18,1.6,1.92)};
const {walkable,pathTo,destinations}=new Function('THREE','camera',section+';return {walkable,pathTo,destinations};')(THREE,camera);
let cases=0;
for(const from of Object.values(destinations)){
 camera.position.copy(from.pos);
 for(const [name,to] of Object.entries(destinations)){
  const path=pathTo(to.pos);
  assert.ok(path,`No route to ${name}`);
  let last=from.pos;
  for(const point of path){
   for(let j=0;j<=10;j++){
    const p=last.clone().lerp(point,j/10);
    assert.ok(walkable(p.x,p.z),`Route crosses obstacle toward ${name}: ${p.x}, ${p.z}`);
   }
   last=point;
  }
  assert.ok(Math.hypot(last.x-to.pos.x,last.z-to.pos.z)<.22,`Route misses ${name}`);
  cases++;
 }
}
assert.equal(walkable(0,1.2),false,'Sofa must block walking');
assert.equal(walkable(-.3,-.12),false,'Table must block walking');
assert.equal(walkable(2.65,-.2),false,'Cabinet must block walking');
assert.equal(walkable(0,-2.4),false,'Cannot walk through window');
console.log(`PASS: ${cases} viewpoint routes avoid furniture and room boundaries.`);
