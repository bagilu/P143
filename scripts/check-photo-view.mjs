import assert from 'node:assert/strict';
import {photoViewport} from '../photo-view.js';
import {PHOTO_SCENES} from '../photo-scenes.js';
import {applyDragLook} from '../look-controls.js';

let checks=0;
for(const scene of Object.values(PHOTO_SCENES))for(const [w,h] of [[1366,940],[1920,1080],[390,844],[844,390]]){
 for(const [yaw,pitch] of [[0,0],[-.65,.4],[.65,-.4],[-10,10]]){
  const c=photoViewport(scene.width,scene.height,w,h,scene.zoom,yaw,pitch);
  assert.ok(c.x>=-1e-8&&c.y>=-1e-8);
  assert.ok(c.x+c.width<=scene.width+1e-8&&c.y+c.height<=scene.height+1e-8,'View must not expose blank image edges');
  assert.ok(Math.abs(c.width/c.height-w/h)<1e-8,'Photo must retain its proportions');
  checks++;
 }
 const before=photoViewport(scene.width,scene.height,w,h,scene.zoom);
 const up=applyDragLook(0,0,0,-50,{}),right=applyDragLook(0,0,50,0,{});
 assert.ok(photoViewport(scene.width,scene.height,w,h,scene.zoom,up.yaw,up.pitch).y<before.y,'Upward drag must reveal the upper image');
 assert.ok(photoViewport(scene.width,scene.height,w,h,scene.zoom,right.yaw,right.pitch).x>before.x,'Rightward drag must reveal the right image');
}
console.log(`PASS: ${checks} photo crop bounds/aspect cases and upward/rightward drag in all viewports.`);
