import assert from 'node:assert/strict';
import {TEMPLE_LIGHTS,TEMPLE_MOMENTS,templeLightAtMinute} from '../temple-light.js';
import {LightClock,automaticLightAtMinute,lightAtMinute,FADE_MS} from '../light-clock.js';
const vector=s=>[...s.weights,s.brightness,s.saturation,...s.tint,s.tintAlpha];
const near=(a,b,eps=1e-7)=>vector(a).forEach((v,i)=>assert.ok(Math.abs(v-vector(b)[i])<eps));
assert.equal(TEMPLE_LIGHTS.length,12);assert.equal(TEMPLE_MOMENTS.length,6);
assert.deepEqual(templeLightAtMinute(360).weights,[0,1,0]);assert.deepEqual(templeLightAtMinute(720).weights,[1,0,0]);assert.deepEqual(templeLightAtMinute(1260).weights,[0,0,1]);assert.notEqual(templeLightAtMinute(360).brightness,templeLightAtMinute(960).brightness);
for(let m=0;m<1440;m+=.25){const state=templeLightAtMinute(m);assert.ok(vector(state).every(Number.isFinite));assert.ok(state.weights.every(w=>w>=0&&w<=1));assert.ok(Math.abs(state.weights.reduce((a,b)=>a+b,0)-1)<1e-8);near(state,templeLightAtMinute(m+.00001),.0001);}
near(templeLightAtMinute(1439.999999),templeLightAtMinute(0),.0001);
for(let m=0;m<1440;m+=5)near(automaticLightAtMinute(m-.000001,templeLightAtMinute),automaticLightAtMinute(m+.000001,templeLightAtMinute),.0001);
const date=(h,m=0)=>new Date(2026,10,2,h,m),c=new LightClock(date(6),templeLightAtMinute);near(c.current,templeLightAtMinute(360));
c.select(1080);const manual=c.sample(100,date(12));near(manual.state,templeLightAtMinute(1080));assert.equal(manual.label,'暮色');assert.equal(manual.minute,1080);assert.equal(manual.follow,false);near(c.sample(900000,date(22)).state,manual.state);
c.followNow(1000000,date(21));near(c.sample(1000000,date(21)).state,manual.state);assert.equal(c.minute,1260);assert.equal(c.sample(1000000+FADE_MS/2,date(21,2)).progress,.5);near(c.sample(1000000+FADE_MS,date(21,5)).state,automaticLightAtMinute(1265,templeLightAtMinute));assert.equal(c.fade,null);
// Default callers, including the finalized seaside room, retain their own curve.
const seaside=new LightClock(date(6));near(seaside.current,lightAtMinute(360));assert.notDeepEqual(seaside.current.weights,new LightClock(date(6),templeLightAtMinute).current.weights);
console.log('PASS: 12 temple moods / 6 previews, warm dawn and distinct midday/dusk/night, full-day and midnight continuity, five-minute boundaries, frozen instant selection, actual-time resume, 300-second blend and unchanged seaside defaults.');
