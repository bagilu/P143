import assert from 'node:assert/strict';
import {mapLightAtState,startMapLight} from '../map-light.js';
import {SolarLightClock,solarLightAtMinute} from '../solar-light-clock.js';
import {solarForDate} from '../solar-time.js';
const date=new Date('2026-11-04T12:00:00+08:00'),solar=solarForDate(date),at=m=>mapLightAtState(solarLightAtMinute(m,undefined,date));
assert.equal(at(720).brightness,1);assert.equal(at(720).alpha,0);assert.equal(at(0).brightness,.24);assert.equal(at(0).alpha,.28);
for(const [center,direction] of [[solar.sunrise,1],[solar.sunset,-1]]){
 let previous=at(center-30).brightness;
 for(let i=1;i<=600;i++){const v=at(center-30+i*.1);assert.ok(direction*(v.brightness-previous)>=-1e-10);assert.ok(v.tint.every(Number.isFinite));previous=v.brightness;}
}
for(const m of [0,solar.sunrise-30,solar.sunrise,solar.sunrise+30,solar.sunset-30,solar.sunset,solar.sunset+30,1440])assert.ok(Math.abs(at(m-.000001).brightness-at(m+.000001).brightness)<1e-5);
// The raster is fully hidden by day, fully visible at night; fades use the shared night weight.
for(const m of [0,solar.sunrise-30,solar.sunrise,solar.sunrise+30,720,solar.sunset-30,solar.sunset,solar.sunset+30]){const state=solarLightAtMinute(m,undefined,date),rendered=mapLightAtState(state,true);assert.equal(rendered.nightOpacity,state.weights[2]);assert.ok(Number.isFinite(rendered.brightness));}
assert.equal(mapLightAtState({weights:[0,0,1]},true).nightOpacity,1);
assert.equal(mapLightAtState({weights:[1,0,0]},true).brightness,1);
// A real shared clock drives a minimal DOM/timer harness through page lifecycle events.
const original={document:globalThis.document,window:globalThis.window,setInterval:globalThis.setInterval,clearInterval:globalThis.clearInterval};
const styles=new Map(),world={style:{setProperty:(k,v)=>styles.set(k,v)},dataset:{}},note={},events=new Map(),timers=new Map();let next=0,current=date;const imageEvents=new Map(),nightImage={complete:false,naturalWidth:0,addEventListener:(k,f)=>imageEvents.set(k,f)};let provideNight=false;
const clock=new SolarLightClock(date);
globalThis.document={hidden:false,getElementById:id=>id==='map-world'?world:id==='map-light-note'?note:provideNight?nightImage:null,addEventListener:(k,f)=>events.set(k,f)};
globalThis.window={addEventListener:(k,f)=>events.set(k,f)};
globalThis.setInterval=f=>{timers.set(++next,f);return next;};globalThis.clearInterval=id=>timers.delete(id);
try{
 startMapLight({clock:{sample:()=>clock.sample(0,current)}});assert.equal(styles.get('--map-brightness'),'1.000000');assert.ok(note.textContent.includes('花蓮時間 12:00'));assert.equal(timers.size,1);
 current=new Date('2026-11-04T23:00:00+08:00');[...timers.values()][0]();assert.equal(styles.get('--map-brightness'),'0.240000');assert.equal(world.dataset.lightWeights,'0.000000,0.000000,1.000000');
 document.hidden=true;events.get('visibilitychange')();assert.equal(timers.size,0);
 current=new Date('2027-01-01T12:00:00+08:00');document.hidden=false;events.get('visibilitychange')();assert.equal(world.dataset.lightDate,'2027-01-01');assert.equal(styles.get('--map-brightness'),'1.000000');assert.equal(timers.size,1);
 events.get('pagehide')();assert.equal(timers.size,0);events.get('pageshow')();events.get('pageshow')();assert.equal(timers.size,1);assert.ok(note.title.includes('UTC+8')&&note.title.includes('日出'));
 events.get('pagehide')();provideNight=true;current=new Date('2026-11-04T23:00:00+08:00');startMapLight({clock:{sample:()=>clock.sample(0,current)}});assert.equal(styles.get('--map-night-opacity'),'0.000000');
 nightImage.naturalWidth=1672;imageEvents.get('load')();assert.equal(styles.get('--map-night-opacity'),'1.000000');assert.equal(world.dataset.nightReady,'true');
 imageEvents.get('error')();assert.equal(styles.get('--map-night-opacity'),'0.000000');assert.equal(styles.get('--map-brightness'),'0.240000');
}finally{Object.assign(globalThis,original);}
console.log('PASS: map dawn/dusk endpoints, monotonic continuous light, unchanged daylight, shared clock, midnight/year update, visibility and BFCache resume, single active timer.');
