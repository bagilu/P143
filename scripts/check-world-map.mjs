import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {MAP_SIZE,MAP_IMAGE,MAP_TRAILS,MAP_JUNCTIONS,PLACES,framePlacesCamera,fitCamera,constrainCamera,zoomCamera} from '../world-map-model.js';
assert.equal(PLACES.length,6);assert.equal(PLACES.filter(p=>p.status==='open').length,6);assert.equal(PLACES.filter(p=>p.status==='coming').length,0);
assert.equal(new Set(PLACES.map(p=>p.id)).size,PLACES.length);
for(const p of PLACES){assert.ok(p.x>0&&p.x<1&&p.y>0&&p.y<1);if(p.status==='open')assert.ok(existsSync(new URL('../'+p.href,import.meta.url)));else assert.equal(p.href,undefined);}
let checks=0;
for(const [w,h,compact] of [[1363,936,false],[1920,1080,false],[1024,768,false],[390,368,true],[390,280,true],[844,390,false]]){
 const fit=fitCamera(w,h,compact);assert.ok(fit.scale>0);if(compact){assert.ok(MAP_SIZE.width*fit.scale<=w+1e-8);assert.ok(MAP_SIZE.height*fit.scale<=h+1e-8);}else{assert.ok(MAP_SIZE.width*fit.scale>=w-1e-8);assert.ok(MAP_SIZE.height*fit.scale>=h-1e-8);}
 for(const scale of [fit.scale,fit.scale*2,fit.scale*4])for(const x of [-1e6,0,1e6])for(const y of [-1e6,0,1e6]){const c=constrainCamera({scale,x,y},w,h);const mw=MAP_SIZE.width*scale,mh=MAP_SIZE.height*scale;assert.ok(Number.isFinite(c.x)&&Number.isFinite(c.y));if(mw<=w)assert.ok(Math.abs(c.x-(w-mw)/2)<1e-8);else assert.ok(c.x<=0&&c.x>=w-mw);if(mh<=h)assert.ok(Math.abs(c.y-(h-mh)/2)<1e-8);else assert.ok(c.y<=0&&c.y>=h-mh);checks++;}
 const z=zoomCamera(fit,fit.scale*2,{x:w/2,y:h/2},w,h);const before=[(w/2-fit.x)/fit.scale,(h/2-fit.y)/fit.scale],after=[(w/2-z.x)/z.scale,(h/2-z.y)/z.scale];assert.ok(Math.abs(before[0]-after[0])<1e-8&&Math.abs(before[1]-after[1])<1e-8);
}
const png=readFileSync(new URL('../'+MAP_IMAGE,import.meta.url));assert.equal(png.readUInt16BE(0),0xffd8,'Optimized photographic map is JPEG');
const home=readFileSync(new URL('../index.html',import.meta.url),'utf8'),room=readFileSync(new URL('../seaside.html',import.meta.url),'utf8');assert.ok(home.includes('<h1 id="world-title">自在之所</h1>')&&!home.includes('自在心圖')&&!home.includes('THE MAP WITHIN'));assert.ok(home.includes('href="seaside.html"'));assert.ok(!home.includes('src="app.js'));assert.ok(room.includes('id="return-map"')&&room.includes('href="./"'));assert.ok(room.includes('data-play="0"')&&room.includes('id="light-time"'));
assert.equal(PLACES.find(p=>p.id==='temple').href,'temple.html');
assert.equal(PLACES.find(p=>p.id==='snow').href,'snow.html');
assert.equal(PLACES.find(p=>p.id==='city').href,'balcony.html');
assert.equal((home.match(/class="map-pin"/g)||[]).length,6);
for(const p of PLACES)assert.ok(home.includes(`data-place="${p.id}" href="${p.href}"`));
for(const id of ['place-list','place-card','map-guide'])assert.ok(!home.includes(`id="${id}"`));
assert.ok(!home.includes('已開放')&&!home.includes('籌備中'));
assert.ok(home.includes(MAP_IMAGE));
const nodes=[...PLACES.map(p=>({...p,x:p.x*MAP_SIZE.width,y:p.y*MAP_SIZE.height})),...MAP_JUNCTIONS];
const graph=new Map(nodes.map(p=>[p.id,[]]));
assert.equal(MAP_TRAILS.length,9,'Shared road trunks are drawn once');
for(const route of MAP_TRAILS){
 const values=route.d.match(/-?\d+(?:\.\d+)?/g).map(Number),from=nodes.find(p=>p.id===route.from),to=nodes.find(p=>p.id===route.to);
 for(const [actual,expected]of [[values[0],from.x],[values[1],from.y],[values.at(-2),to.x],[values.at(-1),to.y]])assert.ok(Math.abs(actual-expected)<.001);
 assert.equal(home.split(`data-from="${route.from}" data-to="${route.to}" d="${route.d}"`).length-1,2);
 graph.get(route.from).push(route.to);graph.get(route.to).push(route.from);
}
assert.deepEqual(graph.get('temple'),['garden-turn']);assert.ok(graph.get('garden-turn').includes('garden'));assert.deepEqual(new Set(graph.get('river-road')),new Set(['west-road','city','church-road']));
const seen=new Set(),visit=id=>{if(seen.has(id))return;seen.add(id);graph.get(id).forEach(visit);};visit('seaside');assert.equal(seen.size,10);
assert.ok(PLACES.find(p=>p.id==='temple').y<PLACES.find(p=>p.id==='garden').y);
assert.equal(PLACES.find(p=>p.id==='garden').href,'garden.html');
console.log(`PASS: six open destinations and direct links, nine road-following segments with shared junctions, all six places connected, aligned pins/routes, ${checks} camera boundaries, zoom, mobile fit, preserved cabin controls.`);

for(const[w,h]of[[390,542],[320,400],[844,260]]){const c=framePlacesCamera(w,h);for(const p of PLACES){const x=c.x+p.x*MAP_SIZE.width*c.scale,y=c.y+p.y*MAP_SIZE.height*c.scale;assert.ok(x>=40&&x<=w-40&&y>=40&&y<=h-40);}}

for(const page of ['seaside','temple','snow','balcony','garden','church']){const html=readFileSync(new URL('../'+page+'.html',import.meta.url),'utf8');assert.ok(html.includes('回到地圖')&&!html.includes('回到心圖'));}
