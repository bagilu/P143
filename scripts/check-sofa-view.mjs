import assert from 'node:assert/strict';
import * as THREE from '../assets/three.module.js';
import { SOFA_VIEW, OCEAN_PLATE, WINDOW_OPENING } from '../view-config.js';

const results=[];
for(const aspect of [16/9,4/3,9/16]){
 const camera=new THREE.PerspectiveCamera(SOFA_VIEW.verticalFov,aspect,.04,100);
 camera.position.fromArray(SOFA_VIEW.position);
 camera.lookAt(new THREE.Vector3(...SOFA_VIEW.target));
 camera.updateMatrixWorld();
 const project=(x,y,z)=>new THREE.Vector3(x,y,z).project(camera);
 const horizonY=OCEAN_PLATE.centerY+(.5-OCEAN_PLATE.horizonFromTop)*OCEAN_PLATE.height;
 const leftHorizon=project(-8,horizonY,OCEAN_PLATE.z);
 const rightHorizon=project(8,horizonY,OCEAN_PLATE.z);
 assert.ok(Math.abs(leftHorizon.y-rightHorizon.y)<1e-8,'Horizon must be level');
 assert.ok(Math.abs(leftHorizon.y)<.03,'Horizon should remain close to seated eye level');
 const sill=project(0,WINDOW_OPENING.bottom,WINDOW_OPENING.z);
 const top=project(0,WINDOW_OPENING.top,WINDOW_OPENING.z);
 const table=project(-.32,.435,-.12);
 assert.ok(sill.y>-.6&&top.y<.95,'Window should retain upper and lower timber framing');
 assert.ok(table.y<sill.y-.1,'Coffee table must stay below the sea view');
 const left=project(WINDOW_OPENING.left,1.12,WINDOW_OPENING.z);
 const right=project(WINDOW_OPENING.right,1.12,WINDOW_OPENING.z);
 const width=(right.x-left.x)/2;
 if(aspect===16/9)assert.ok(width>.6&&width<.75,'Window should occupy 60–75% of a landscape viewport');
 results.push({aspect:Number(aspect.toFixed(3)),horizonPercent:Number(((1-leftHorizon.y)*50).toFixed(1)),windowWidthPercent:Number((width*100).toFixed(1))});
}
console.log('PASS: level seated horizon, visible timber framing and clear sea view.');
console.log(JSON.stringify(results));
