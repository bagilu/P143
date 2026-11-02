import assert from 'node:assert/strict';
import {PHOTO_SCENES} from '../photo-scenes.js';
import {grassSwayFrame,grassPatchBounds,GrassMotion} from '../grass-motion.js';
for(const scene of Object.values(PHOTO_SCENES)){
 assert.ok(scene.grassMasks.length>=2);
 for(const points of scene.grassMasks){const b=grassPatchBounds(points);assert.ok(b.x>=0&&b.y>scene.height*.45&&b.x+b.width<=scene.width&&b.y+b.height<scene.height*.7);
  const root=b.y+b.height;
  for(let t=0;t<60;t+=.2){const dx=grassSwayFrame(t,b.x*.013),shear=-dx/b.height;assert.ok(Math.abs(dx)<=2.4+1e-9);assert.ok(Math.abs(shear*b.y-shear*root-dx)<1e-9);}
 }
}
class Node{constructor(){this.attrs={};this.style={};this.children=[];}setAttribute(k,v){this.attrs[k]=String(v);}append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}}
globalThis.document={createElementNS:()=>new Node()};
const parent=new Node(),motion=new GrassMotion(parent);motion.setScene(PHOTO_SCENES.sofa);motion.setEnabled(true);motion.update(0);const before=motion.patches[0].image.attrs.transform;motion.update(2);assert.notEqual(motion.patches[0].image.attrs.transform,before);for(const patch of motion.patches){const matrix=patch.image.attrs.transform.slice(7,-1).split(' ').map(Number);const [a,b,c,d,tx,ty]=matrix;assert.ok(Math.abs(a*patch.x+c*patch.root+tx-patch.x)<.0001,'The rendered transform must hold the root in place');assert.ok(Math.abs(b*patch.x+d*patch.root+ty-patch.root)<.0001);assert.ok(Math.abs(c*patch.y+tx)<=2.401,'Rendered tip displacement remains subtle');}const atTwo=motion.patches[0].image.attrs.transform;motion.setEnabled(false);motion.update(4);assert.equal(motion.patches[0].image.attrs.transform,atTwo);assert.equal(motion.layer.style.display,'none');assert.equal(parent.attrs['data-grass-motion'],'paused');
motion.setScene({...PHOTO_SCENES.records,src:'assets/photo-records-night.png'});assert.equal(motion.patches.length,2);assert.equal(motion.patches[0].image.attrs.href,'assets/photo-records-night.png');assert.equal(motion.layer.style.display,'none');
console.log('PASS: outdoor vegetation bounds, fixed ground roots, bounded gentle sway, frame updates, stopped motion and night-source preservation.');
