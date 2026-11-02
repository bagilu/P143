import assert from 'node:assert/strict';
import * as THREE from '../assets/three.module.js';
import {applyDragLook,describeLookSettings,LOOK_LIMITS,DEFAULT_LOOK_SETTINGS,readLookSettings} from '../look-controls.js';

function cameraAt(yaw,pitch){const camera=new THREE.PerspectiveCamera();camera.rotation.set(pitch,yaw,0,'YXZ');camera.updateMatrixWorld();return camera;}
function direction(yaw,pitch){return cameraAt(yaw,pitch).getWorldDirection(new THREE.Vector3());}
let checks=0;
for(const yaw of [0,.7,Math.PI/2,Math.PI,-Math.PI/2]){
 for(const pitch of [-.3,0,.3]){
  const before=direction(yaw,pitch);
  const right=new THREE.Vector3(1,0,0).applyQuaternion(cameraAt(yaw,pitch).quaternion);
  const cases=[
   {dx:0,dy:-30,settings:{},vertical:1},
   {dx:0,dy:30,settings:{},vertical:-1},
   {dx:30,dy:0,settings:{},horizontal:1},
   {dx:-30,dy:0,settings:{},horizontal:-1},
   {dx:0,dy:-30,settings:{invertY:true},vertical:-1},
   {dx:0,dy:30,settings:{invertY:true},vertical:1},
   {dx:30,dy:0,settings:{invertX:true},horizontal:-1},
   {dx:-30,dy:0,settings:{invertX:true},horizontal:1}
  ];
  for(const c of cases){
   const after=applyDragLook(yaw,pitch,c.dx,c.dy,c.settings);
   const look=direction(after.yaw,after.pitch);
   if(c.vertical)assert.ok((look.y-before.y)*c.vertical>0,'Vertical drag moves actual gaze the wrong way');
   if(c.horizontal)assert.ok(look.dot(right)*c.horizontal>0,'Horizontal drag moves actual gaze the wrong way');
   assert.equal(cameraAt(after.yaw,after.pitch).rotation.z,0,'Drag must not roll the horizon');
   checks++;
  }
 }
}
assert.equal(applyDragLook(0,0,0,-100000,{}).pitch,LOOK_LIMITS.maxPitch);
assert.equal(applyDragLook(0,0,0,100000,{}).pitch,LOOK_LIMITS.minPitch);
assert.equal(describeLookSettings({}),'上拖＝往上看；右拖＝往右看');
assert.equal(describeLookSettings({invertX:true,invertY:true}),'上拖＝往下看；右拖＝往左看');
const a=applyDragLook(0,0,30,-30,{invertX:true});
const b=applyDragLook(0,0,30,-30,{invertY:true});
assert.ok(a.yaw>0&&a.pitch>0,'Horizontal inversion must not invert vertical gaze');
assert.ok(b.yaw<0&&b.pitch<0,'Vertical inversion must not invert horizontal gaze');
console.log(`PASS: ${checks} actual camera-direction checks, independent axis inversion, pitch limits and level horizon.`);

assert.deepEqual(DEFAULT_LOOK_SETTINGS,{invertX:true,invertY:true});
assert.deepEqual(readLookSettings({getItem:()=>null}),DEFAULT_LOOK_SETTINGS);
assert.deepEqual(readLookSettings({getItem:()=>{throw new Error('blocked');}}),DEFAULT_LOOK_SETTINGS);
assert.deepEqual(readLookSettings({getItem:key=>key.endsWith('x')?'false':'true'}),{invertX:false,invertY:true});
assert.deepEqual(readLookSettings({getItem:()=> 'invalid'}),DEFAULT_LOOK_SETTINGS);
const initial=applyDragLook(0,0,30,-30);assert.ok(initial.yaw>0&&initial.pitch<0);
assert.equal(describeLookSettings(),'上拖＝往下看；右拖＝往左看');
console.log('PASS: reversed initial defaults, independent saved overrides and unavailable storage.');
