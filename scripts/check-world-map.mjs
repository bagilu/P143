import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {MAP_SIZE,PLACES,fitCamera,constrainCamera,zoomCamera} from '../world-map-model.js';
assert.equal(PLACES.length,4);assert.equal(PLACES.filter(p=>p.status==='open').length,2);assert.equal(PLACES.filter(p=>p.status==='coming').length,2);
assert.equal(new Set(PLACES.map(p=>p.id)).size,PLACES.length);
for(const p of PLACES){assert.ok(p.x>0&&p.x<1&&p.y>0&&p.y<1);if(p.status==='open')assert.ok(existsSync(new URL('../'+p.href,import.meta.url)));else assert.equal(p.href,undefined);}
let checks=0;
for(const [w,h,compact] of [[1363,936,false],[1920,1080,false],[1024,768,false],[390,368,true],[390,280,true],[844,390,false]]){
 const fit=fitCamera(w,h,compact);assert.ok(fit.scale>0);if(compact){assert.ok(MAP_SIZE.width*fit.scale<=w+1e-8);assert.ok(MAP_SIZE.height*fit.scale<=h+1e-8);}else{assert.ok(MAP_SIZE.width*fit.scale>=w-1e-8);assert.ok(MAP_SIZE.height*fit.scale>=h-1e-8);}
 for(const scale of [fit.scale,fit.scale*2,fit.scale*4])for(const x of [-1e6,0,1e6])for(const y of [-1e6,0,1e6]){const c=constrainCamera({scale,x,y},w,h);const mw=MAP_SIZE.width*scale,mh=MAP_SIZE.height*scale;assert.ok(Number.isFinite(c.x)&&Number.isFinite(c.y));if(mw<=w)assert.ok(Math.abs(c.x-(w-mw)/2)<1e-8);else assert.ok(c.x<=0&&c.x>=w-mw);if(mh<=h)assert.ok(Math.abs(c.y-(h-mh)/2)<1e-8);else assert.ok(c.y<=0&&c.y>=h-mh);checks++;}
 const z=zoomCamera(fit,fit.scale*2,{x:w/2,y:h/2},w,h);const before=[(w/2-fit.x)/fit.scale,(h/2-fit.y)/fit.scale],after=[(w/2-z.x)/z.scale,(h/2-z.y)/z.scale];assert.ok(Math.abs(before[0]-after[0])<1e-8&&Math.abs(before[1]-after[1])<1e-8);
}
const png=readFileSync(new URL('../assets/world-map-v0012.png',import.meta.url));assert.equal(png.readUInt32BE(16),MAP_SIZE.width);assert.equal(png.readUInt32BE(20),MAP_SIZE.height);
const home=readFileSync(new URL('../index.html',import.meta.url),'utf8'),room=readFileSync(new URL('../seaside.html',import.meta.url),'utf8');assert.ok(home.includes('自在之所')&&home.includes('自在心圖'));assert.ok(home.includes('href="seaside.html"'));assert.ok(!home.includes('src="app.js'));assert.ok(room.includes('id="return-map"')&&room.includes('href="./"'));assert.ok(room.includes('data-play="0"')&&room.includes('id="light-time"'));
assert.equal(PLACES.find(p=>p.id==='temple').href,'temple.html');
console.log(`PASS: 4 destinations / seaside and temple open, photographic asset coordinates, ${checks} camera boundary cases, zoom anchor, mobile whole-map fit, room links and preserved cabin controls.`);
