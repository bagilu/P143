import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TEMPLE_SCENE,templeViewport,initialTempleGaze,TempleView} from '../temple-scene.js';
import {LightClock} from '../light-clock.js';
for(const file of TEMPLE_SCENE.plates){const png=readFileSync(new URL('../'+file,import.meta.url));assert.equal(png.readUInt32BE(16),TEMPLE_SCENE.width);assert.equal(png.readUInt32BE(20),TEMPLE_SCENE.height);}
let checks=0;for(const[w,h]of[[1363,936],[1920,1080],[390,844],[844,390],[320,568]])for(const x of[-1,0,.5,1,2])for(const y of[-1,0,.5,1,2]){const c=templeViewport(w,h,{x,y});assert.ok(c.x>=0&&c.y>=0&&c.x+c.width<=TEMPLE_SCENE.width+1e-8&&c.y+c.height<=TEMPLE_SCENE.height+1e-8);assert.ok(Math.abs(c.width/c.height-w/h)<1e-8);checks++;}
for(const patch of TEMPLE_SCENE.foliage)for(const[x,y]of patch){assert.ok(x>535&&x<1075&&y>280&&y<650,'Only foliage inside the courtyard opening may move');}
class Node{constructor(){this.attrs={};this.style={};this.children=[];this.dataset={};}setAttribute(k,v){this.attrs[k]=String(v);}append(...nodes){this.children.push(...nodes);}replaceChildren(...nodes){this.children=nodes;}}
globalThis.document={createElementNS:()=>new Node()};globalThis.innerWidth=1363;globalThis.innerHeight=936;globalThis.Image=class{set src(value){queueMicrotask(()=>value.includes('missing')?this.onerror():this.onload());}};
const svg=new Node(),view=new TempleView(svg);assert.equal(await view.load(),true);assert.deepEqual(view.gaze,initialTempleGaze(1363,936));
view.drag(99999,-99999,{invertX:false,invertY:false});assert.deepEqual(view.gaze,{x:1,y:0});const gaze={...view.gaze},clock=new LightClock();clock.select(720);view.setLight(clock.sample());assert.deepEqual(view.gaze,gaze);assert.equal(svg.dataset.lightWeights,'1.000000,0.000000,0.000000');
clock.select(1260);view.setLight(clock.sample());assert.equal(svg.dataset.lightWeights,'0.000000,0.000000,1.000000');view.update(1);assert.ok(view.layers[2].leaves.patches[0].image.attrs.transform);view.setMotion(false);const frozen=view.layers[2].leaves.patches[0].image.attrs.transform;view.update(20);assert.equal(view.layers[2].leaves.patches[0].image.attrs.transform,frozen);
view.reset();assert.deepEqual(view.gaze,initialTempleGaze(1363,936));
const original=TEMPLE_SCENE.plates[0];TEMPLE_SCENE.plates[0]='missing';assert.equal(await view.load(),false);TEMPLE_SCENE.plates[0]=original;
const html=readFileSync(new URL('../temple.html',import.meta.url),'utf8');assert.ok(html.includes('href="./"')&&html.includes('id="light-follow"'));assert.ok(!html.includes('panorama-controls')&&!html.includes('data-sofa-look'));
console.log(`PASS: three aligned-size photo plates, ${checks} viewport bounds/aspects, bounded pan, retained gaze during immediate day/night selection, reduced motion, courtyard-only masks, failed-load handling and return link.`);
