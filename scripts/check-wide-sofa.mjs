import assert from 'node:assert/strict';
import {PhotoView,photoViewport,SOFA_LOOK_TARGETS} from '../photo-view.js';
import {PHOTO_SCENES} from '../photo-scenes.js';
import {lightAtMinute} from '../light-clock.js';
const scene=PHOTO_SCENES.sofa;
assert.equal(scene.wideLook,true);assert.ok(scene.width/scene.height>2.9);
for(const [w,h] of [[1363,936],[1920,1080],[390,844],[844,390]]){
 const old=photoViewport(1672,941,w,h,1.08),left=photoViewport(scene.width,scene.height,w,h,scene.zoom,.65),right=photoViewport(scene.width,scene.height,w,h,scene.zoom,-.65);
 assert.equal(left.x,0);assert.ok(Math.abs(right.x+right.width-scene.width)<1e-8);assert.ok(right.x-left.x>(1672-old.width)*1.3,'Wide image should expose materially more lateral content');
}
class Node{constructor(){this.attrs={};this.style={};this.children=[];}setAttribute(k,v){this.attrs[k]=String(v);}append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}}
globalThis.document={createElementNS:()=>new Node()};globalThis.innerWidth=1363;globalThis.innerHeight=936;globalThis.Image=class{set src(value){queueMicrotask(()=>this.onload());}};
const svg=new Node(),view=new PhotoView(svg,PHOTO_SCENES);await view.ready;await view.setView('sofa');assert.equal(svg.attrs['data-look-mode'],'wide');
view.lookAt('left',false);assert.equal(view.yaw,SOFA_LOOK_TARGETS.left);assert.equal(view.crop.x,0);
view.lookAt('right',false);assert.equal(view.yaw,SOFA_LOOK_TARGETS.right);assert.ok(Math.abs(view.crop.x+view.crop.width-scene.width)<1e-8);
view.lookAt('sea',false);assert.equal(view.yaw,0);const center=view.crop.x;
view.lookAt('left');view.update(10);assert.equal(view.yaw,0);view.update(10.225);assert.ok(view.yaw>0&&view.yaw<.65);view.update(10.5);assert.equal(view.yaw,.65);assert.equal(view.lookTarget,null);
view.lookAt('right');view.update(11);view.drag(20,0,{});const dragged=view.yaw;view.update(12);assert.equal(view.yaw,dragged);assert.equal(view.lookTarget,null);
view.setLightState(lightAtMinute(1260),1260);assert.equal(view.yaw,dragged);view.lookAt('sea',false);assert.equal(view.crop.x,center);
await view.setView('records');view.lookAt('left',false);assert.equal(view.yaw,0);assert.equal(svg.attrs['data-look-mode'],'standard');
console.log('PASS: expanded lateral content on desktop/mobile, bounded extremes, direct look targets, smooth centering, drag interruption, retained lighting and unchanged other positions.');
