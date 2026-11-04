import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ScreenAwakeController} from '../screen-awake-controller.js';
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
class Lock extends EventTarget{released=false;releases=0;async release(){this.releases++;this.released=true;this.dispatchEvent(new Event('release'));}}
const locks=[],states=[];let requests=0;
const c=new ScreenAwakeController({request:async type=>{assert.equal(type,'screen');requests++;const l=new Lock();locks.push(l);return l;},onState:s=>states.push(s)});
c.update({entered:false});assert.equal(requests,0);c.update({entered:true});await flush();assert.equal(c.state,'active');assert.equal(requests,1);
for(let i=0;i<8;i++)c.update({entered:true});await flush();assert.equal(requests,1,'HUD/class activity must not duplicate requests');
c.update({visible:false});await flush();assert.equal(c.state,'paused');assert.equal(locks[0].releases,1);c.update({visible:true});await flush();assert.equal(requests,2);assert.equal(c.state,'active');
await locks[1].release();await flush();assert.equal(c.state,'released');assert.equal(requests,2,'System release must not cause a retry loop');c.retry();await flush();assert.equal(requests,3);
c.update({enabled:false});await flush();assert.equal(c.state,'off');assert.ok(locks[2].released);c.update({enabled:true});await flush();assert.equal(requests,4);
c.update({pageActive:false});await flush();assert.equal(c.state,'paused');c.update({pageActive:true});await flush();assert.equal(requests,5,'BFCache return requests a new lock');
let resolve;const late=new Lock(),pending=new ScreenAwakeController({request:()=>new Promise(r=>resolve=r)});pending.update({entered:true});pending.update({enabled:false});resolve(late);await flush();assert.ok(late.released,'Late grant after disabling must be released');assert.equal(pending.state,'off');
let complete;const hideLock=new Lock(),hide=new ScreenAwakeController({request:()=>new Promise(r=>complete=r)});hide.update({entered:true});hide.update({visible:false});complete(hideLock);await flush();assert.ok(hideLock.released);assert.equal(hide.state,'paused');
let failures=0;const denied=new ScreenAwakeController({request:async()=>{failures++;throw Error('NotAllowedError');}});denied.update({entered:true});await flush();assert.equal(denied.state,'blocked');denied.update({entered:true});await flush();assert.equal(failures,1);denied.retry();await flush();assert.equal(failures,2);assert.equal(denied.state,'blocked');
const unavailable=new ScreenAwakeController();unavailable.update({entered:true});assert.equal(unavailable.state,'unsupported');unavailable.update({enabled:false});assert.equal(unavailable.state,'off');
const badLock=new Lock();badLock.release=async()=>{throw Error('release failed');};const releaseFailure=new ScreenAwakeController({request:async()=>badLock});releaseFailure.update({entered:true});await flush();releaseFailure.update({enabled:false});await flush();assert.equal(releaseFailure.state,'release-failed','Failed release must not be silently reported as success');
for(const room of ['seaside','temple','snow','balcony','garden']){const html=readFileSync(new URL('../'+room+'.html',import.meta.url),'utf8');assert.ok(html.includes('screen-awake.js?v=0.031'));assert.equal(html.match(/screen-awake.js/g).length,1);assert.ok(html.includes('V0.034'));}
assert.ok(!readFileSync(new URL('../index.html',import.meta.url),'utf8').includes('screen-awake.js'),'Map does not hold the screen awake');
console.log('PASS: five-place integration, single lock, hidden/re-entry, explicit off, BFCache, late grants, denial, unsupported, release errors and no automatic retry loop.');
