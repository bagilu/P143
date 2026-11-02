import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LIGHT_PRESETS,lightPreset,litPhotoScene} from '../light-scenes.js';
import {PHOTO_SCENES} from '../photo-scenes.js';
import {PhotoView} from '../photo-view.js';
assert.equal(LIGHT_PRESETS.length,12);assert.equal(new Set(LIGHT_PRESETS.map(p=>p.id)).size,12);
assert.equal(lightPreset('invalid').id,'16');
for(const id of ['19','21','00','03','05'])assert.equal(lightPreset(id).plate,'night');
for(const preset of LIGHT_PRESETS)for(const scene of Object.values(PHOTO_SCENES)){
 const s=litPhotoScene(scene,preset.id),png=readFileSync(new URL('../'+s.src,import.meta.url));
 const dims=scene.plateSizes?.[preset.plate]||s;assert.equal(png.readUInt32BE(16),dims.width);assert.equal(png.readUInt32BE(20),dims.height);
 assert.deepEqual(s.seaMask,scene.seaMask);assert.equal(s.zoom,scene.zoom);
}
class Node{constructor(){this.attrs={};this.style={};this.children=[];}setAttribute(k,v){this.attrs[k]=String(v);}append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}querySelector(){return this.children[0];}}
globalThis.document={createElementNS:()=>new Node()};globalThis.innerWidth=1363;globalThis.innerHeight=936;
let fail=false;globalThis.Image=class{set src(value){queueMicrotask(()=>fail?this.onerror():this.onload());}};
const svg=new Node();svg.append(new Node());const view=new PhotoView(svg,PHOTO_SCENES);await view.ready;
view.setMotion(true);view.setGrassMotion(true);view.setWaveStrength(.7);view.drag(60,-40,{});const look=[view.yaw,view.pitch];
const {lightAtMinute}=await import('../light-clock.js');
view.setLightState(lightAtMinute(21*60),21*60);assert.deepEqual([view.yaw,view.pitch],look);assert.equal(svg.attrs['data-light-time'],'21:00');
assert.equal(view.layers[2].image.attrs.href,'assets/photo-entry-night.png');assert.equal(view.layers[2].motion.rows[0].image.attrs.href,view.layers[2].image.attrs.href);
await view.setView('sofa');assert.equal(view.layers[2].grass.patches[0].image.attrs.href,'assets/photo-sofa-wide-night.png');assert.equal(svg.attrs['data-grass-motion'],'running');assert.equal(view.minute,21*60);assert.equal(view.layers[2].image.attrs.href,'assets/photo-sofa-wide-night.png');assert.equal(view.yaw,0);
fail=true;assert.equal(await view.setView('records'),false);assert.equal(view.view,'sofa');
fail=false;const first=view.setView('records'),last=view.setView('entry');assert.equal(await first,false);assert.equal(await last,true);assert.equal(view.view,'entry');
view.setMotion(false);view.setGrassMotion(false);await view.setView('window');assert.equal(svg.attrs['data-grass-motion'],'paused');assert.equal(svg.attrs['data-sea-motion'],'paused');
console.log('PASS: 12 presets, matching assets, blended sea sources, retained lighting across views, stopped motion, failed and stale load protection.');
