import assert from 'node:assert/strict';
import {LightClock,lightAtMinute,automaticLightAtMinute,localMinute,formatMinute,FADE_MS} from '../light-clock.js';
const date=(h,m=0,s=0)=>new Date(2026,10,2,h,m,s);
const vector=s=>[...s.weights,s.brightness,s.saturation,...s.tint,s.tintAlpha];
const near=(a,b,eps=1e-8)=>vector(a).forEach((v,i)=>assert.ok(Math.abs(v-vector(b)[i])<eps));
assert.equal(FADE_MS,300000);
const c=new LightClock(date(23,59));assert.equal(c.follow,true);assert.equal(c.minute,1439);near(c.current,automaticLightAtMinute(1439));
const next=c.sample(1000,date(0,1));assert.equal(next.minute,1);near(next.state,automaticLightAtMinute(1));
// Manual scrubbing changes light immediately and holds despite elapsed real time.
c.select(720);const manual=c.sample(1000,date(0,1));near(manual.state,lightAtMinute(720));assert.equal(manual.transitioning,false);assert.equal(manual.follow,false);
near(c.sample(901000,date(12,15)).state,lightAtMinute(720));assert.equal(c.minute,720);
c.select(1260);near(c.sample(902000,date(12,15)).state,lightAtMinute(1260));
// Return to the actual current time, not an offset from the last manual selection.
c.followNow(902000,date(7));assert.equal(c.follow,true);assert.equal(c.minute,420);near(c.sample(902000,date(7)).state,lightAtMinute(1260));
const half=c.sample(1052000,date(7,2,30));assert.equal(half.progress,.5);assert.ok(half.state.weights[0]>.49&&half.state.weights[2]>.49);
near(c.sample(1202000,date(7,5)).state,automaticLightAtMinute(425));assert.equal(c.minute,425);assert.equal(c.fade,null);
near(c.sample(1203000,date(7,5,1)).state,automaticLightAtMinute(425+1/60));
// Scrubbing during an automatic fade must cancel that fade in the same event.
c.select(720);c.followNow(1300000,date(21));assert.equal(c.sample(1450000,date(21,2,30)).transitioning,true);
c.select(1080);const interrupted=c.sample(1450000,date(21,2,30));near(interrupted.state,lightAtMinute(1080));assert.equal(interrupted.transitioning,false);
near(c.sample(2000000,date(23)).state,lightAtMinute(1080));assert.equal(c.minute,1080);
// Clock labels still advance each second, while automatic light eases over 5 min.
const a=new LightClock(date(12));assert.equal(a.sample(1000,date(12,0,1)).minute,720+1/60);
for(let m=0;m<1440;m+=.1){for(const fn of [lightAtMinute,automaticLightAtMinute]){const s=fn(m);assert.ok(Math.abs(s.weights.reduce((a,b)=>a+b,0)-1)<1e-8);near(s,fn(m+.0001),.001);if(m>=1140||m<=300)assert.ok(Math.abs(s.weights[2]-1)<1e-8);}}
for(let m=0;m<1440;m+=5)near(automaticLightAtMinute(m-.000001),automaticLightAtMinute(m+.000001),.00001);
assert.equal(formatMinute(1440),'00:00');assert.equal(formatMinute(-1),'23:59');assert.equal(localMinute(date(6,30,30)),390.5);
console.log('PASS: instant manual preview, frozen manual clock, cancelled fade, actual-time resume, 300-second automatic fade, second-by-second clock, continuous five-minute intervals and midnight.');
