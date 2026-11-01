import assert from 'node:assert/strict';
import {PHOTO_SCENES} from '../photo-scenes.js';
import {seaMotionFrame,seaRegionBounds} from '../sea-motion.js';
import {parseSoundSettings} from '../sound-settings.js';
for(const scene of Object.values(PHOTO_SCENES)){
 const b=seaRegionBounds(scene.seaMask);
 assert.ok(b&&b.x>=0&&b.y>=0&&b.x+b.width<=scene.width&&b.y+b.height<=scene.height,'Water must remain within photo');
 assert.ok(b.y>scene.height*.35&&b.y+b.height<scene.height*.6,'Water must remain inside window');
}
let min=Infinity,max=-Infinity;
for(let t=0;t<=360;t+=.25)for(let d=0;d<=1;d+=.01){
 const f=seaMotionFrame(t,d,1);
 assert.ok(Math.abs(f.dx)<=3.2&&Math.abs(f.dy)<=7.2,'Limit maximum deformation');
 const zero=seaMotionFrame(t,d,0);assert.ok(zero.dx===0&&zero.dy===0,'Zero strength must stop deformation');
 const horizon=seaMotionFrame(t,0,1);assert.ok(horizon.dx===0&&horizon.dy===0);
 const next=seaMotionFrame(t,Math.min(1,d+.01),1);assert.ok(Math.abs(f.dy-next.dy)<.5,'Depth field must remain smooth');
 if(d>.65){min=Math.min(min,f.dy);max=Math.max(max,f.dy);}
}
assert.ok(max-min>10,'Nearshore movement must be substantially visible');
const half=seaMotionFrame(5,.8,.5),full=seaMotionFrame(5,.8,1);assert.equal(half.dy,full.dy/2);
assert.deepEqual(parseSoundSettings('broken'),{seaVolume:.35,musicVolume:.5,muted:false,oceanMotion:true,waveStrength:.7});
assert.deepEqual(parseSoundSettings('{"seaVolume":-2,"musicVolume":5,"muted":true,"oceanMotion":false,"waveStrength":3}'),{seaVolume:0,musicVolume:1,muted:true,oceanMotion:false,waveStrength:1});
assert.equal(parseSoundSettings('{"waveStrength":0}').waveStrength,0);
assert.equal(parseSoundSettings('{"waveStrength":"oops"}').waveStrength,.7);
console.log('PASS: bounded water masks, stable horizon, smooth wave field over 6 minutes, visible nearshore range, strength scaling and persisted defaults.');
