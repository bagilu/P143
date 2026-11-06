import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {CHURCH_SCENE,churchViewport,initialChurchGaze,ChurchView,candleFrame} from '../church-scene.js';
import {churchLightAtMinute} from '../church-light.js';
import {SolarLightClock} from '../solar-light-clock.js';
import {CHURCH_TRACKS,resolveChurchDefault} from '../church-music.js';
for(const src of CHURCH_SCENE.plates)assert.ok(existsSync(src));
let checks=0;
for(const[w,h]of [[1363,936],[1920,1080],[390,844],[320,568],[844,390]])for(const x of [-1,0,.5,1,2])for(const y of [-1,0,.5,1,2]){const c=churchViewport(w,h,{x,y});assert.ok(c.x>=0&&c.y>=0&&c.x+c.width<=1774+1e-8&&c.y+c.height<=887+1e-8);assert.ok(Math.abs(c.width/c.height-w/h)<1e-8);checks++;}
assert.ok(initialChurchGaze(390,844).x>.5);
for(const patch of CHURCH_SCENE.foliage)for(const[x,y]of patch)assert.ok(x>=1180&&x<=1668&&y>=140&&y<=396,'Only leaves outside arch');
for(let t=0;t<100;t+=.7){const f=candleFrame(t);assert.ok(f.opacity>.2&&f.opacity<.6&&Math.abs(f.sway)<=.35&&f.scaleY>.9&&f.scaleY<1.1);}
class Node{constructor(){this.attrs={};this.style={};this.children=[];this.dataset={};}setAttribute(k,v){this.attrs[k]=String(v);}append(...n){this.children.push(...n)}replaceChildren(...n){this.children=n}}
globalThis.document={createElementNS:()=>new Node()};globalThis.innerWidth=1363;globalThis.innerHeight=936;globalThis.Image=class{set src(v){queueMicrotask(()=>this.onload())}};
const svg=new Node(),view=new ChurchView(svg);assert.equal(await view.load(),true);
const clock=new SolarLightClock(new Date('2026-11-06T04:00:00Z'),churchLightAtMinute);clock.select(720);view.setLight(clock.sample());assert.equal(svg.dataset.lightWeights,'1.000000,0.000000,0.000000');clock.select(1260);view.setLight(clock.sample());assert.equal(svg.dataset.lightWeights,'0.000000,0.000000,1.000000');assert.ok(clock.sample().state.brightness>=.95,'Night stays welcoming');
view.update(1);const transform=view.flame.attrs.transform;view.setMotion(false);view.update(5);assert.equal(view.flame.attrs.transform,transform);assert.equal(view.flame.style.display,'none');view.drag(1e5,-1e5,{invertX:false,invertY:false});assert.deepEqual(view.gaze,{x:1,y:0});
assert.deepEqual(CHURCH_TRACKS.map(t=>t.filename),['P143-61.mp3','P143-62.mp3','P143-63.mp3']);assert.equal(await resolveChurchDefault('P143-61.mp3',async()=>({ok:false,headers:{get:()=>''}})),null);assert.equal(await resolveChurchDefault('P143-61.mp3',async()=>({ok:true,headers:{get:()=> 'audio/mpeg'}})),'Music/P143-61.mp3');
const html=readFileSync('church.html','utf8');for(const t of CHURCH_TRACKS)assert.ok(html.includes(t.name)&&html.includes(t.id+'-play'));
console.log(`PASS: sixth scene plates, ${checks} bounded viewports, mobile gaze, outdoor-only foliage, bounded candle/reduced motion, day/night, warm night and three default slots.`);
