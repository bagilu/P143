import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {quietCatAt,gardenCatPlacement,catLighting} from '../garden-cat-motion.js';
const seen=new Set();let previous=quietCatAt(0);
for(let t=0;t<830;t+=.01){const p=quietCatAt(t);seen.add(p.action);assert.ok(p.weights.every(w=>Number.isFinite(w)&&w>=0&&w<=1));assert.ok(Math.abs(p.weights.reduce((a,b)=>a+b,0)-1)<1e-9);assert.ok(p.breath>=1&&p.breath<=1.0035001);assert.ok(Math.max(...p.weights.map((w,i)=>Math.abs(w-previous.weights[i])))<.07,'No discontinuous pose cut');previous=p;assert.deepEqual(quietCatAt(t,true),{action:'rest',amount:0,weights:[1,0,0,0],breath:1});}
assert.deepEqual([...seen].sort(),['blink','look-at-you','look-out','rest']);
for(const input of [NaN,Infinity,-1])assert.ok(quietCatAt(input).weights.every(Number.isFinite));
for(const compact of [false,true]){const p=gardenCatPlacement(compact);assert.equal(p.x+p.width/2,p.center);assert.equal(p.y+p.height*.95,p.feet);assert.ok(p.width<110);}
assert.ok(catLighting([0,0,1]).brightness<catLighting([0,1,0]).brightness);assert.ok(catLighting([0,1,0]).brightness<catLighting([1,0,0]).brightness);assert.deepEqual(catLighting([NaN,-1,0]),catLighting([1,0,0]));
const image=readFileSync(new URL('../assets/garden-cat-poses-v0029.png',import.meta.url));assert.equal(image.readUInt32BE(16),1774);assert.equal(image.readUInt32BE(20),887);assert.equal(image[25],6,'RGBA atlas');
for(const place of ['seaside','temple','snow','balcony'])assert.ok(!readFileSync(new URL('../'+place+'.html',import.meta.url),'utf8').includes('garden-cat.js'));
const html=readFileSync(new URL('../garden.html',import.meta.url),'utf8'),css=readFileSync(new URL('../garden.css',import.meta.url),'utf8'),js=readFileSync(new URL('../garden-cat.js',import.meta.url),'utf8');assert.ok(html.includes('garden-cat.js?v=0.029')&&html.includes('garden.css?v=0.029'));assert.ok(css.includes('body.entered[data-companion="on"][data-garden-cat="active"]'));assert.ok(js.includes('destination-out')&&js.includes('document.hidden')&&js.includes('reduce-motion'));
console.log('PASS: 83,000 samples of continuous fixed-place poses, both head directions, blinking, reduced motion, bounded photo-relative size, light response, RGBA atlas and garden-only integration.');
