import {MAP_SIZE,PLACES,framePlacesCamera,fitCamera,constrainCamera,zoomCamera} from './world-map-model.js?v=0.045';
import {startMapLight} from './map-light.js?v=0.034';
const $=id=>document.getElementById(id),viewport=$('map-viewport'),world=$('map-world');
const pins=new Map();let camera,baseScale=1,width=1,height=1,saved=null;
try{saved=JSON.parse(sessionStorage.getItem('p143-world-map-state'));}catch{}
for(const place of PLACES){
 const pin=document.querySelector(`.map-pin[data-place="${place.id}"]`)||document.createElement('a');pin.className='map-pin';pin.dataset.place=place.id;pin.href=place.href;pin.style.left=`${place.x*100}%`;pin.style.top=`${place.y*100}%`;pin.setAttribute('aria-label',`前往${place.name}`);
 let label=pin.querySelector('.pin-label');if(!label){label=document.createElement('span');label.className='pin-label';pin.append(label);}label.textContent=place.name;$('map-pins').append(pin);pins.set(place.id,pin);
}
function saveState(){if(!camera)return;try{sessionStorage.setItem('p143-world-map-state',JSON.stringify({version:4,camera,width,height}));}catch{}}
function render(){world.style.transform=`translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`;world.style.setProperty('--pin-scale',1/camera.scale);$('zoom-out').disabled=camera.scale<=baseScale+.00001;$('zoom-in').disabled=camera.scale>=baseScale*4-.00001;viewport.setAttribute('data-map-scale',camera.scale.toFixed(4));keepLabelsVisible();saveState();}
function keepLabelsVisible(){
 const bounds=viewport.getBoundingClientRect();
 for(const [id,pin] of pins){const place=PLACES.find(p=>p.id===id),label=pin.querySelector('.pin-label');label.style.left='0px';label.style.top='0px';const r=label.getBoundingClientRect();const point={x:bounds.left+camera.x+place.x*MAP_SIZE.width*camera.scale,y:bounds.top+camera.y+place.y*MAP_SIZE.height*camera.scale};
 if(point.x>=bounds.left&&point.x<=bounds.right&&point.y>=bounds.top&&point.y<=bounds.bottom){label.style.left=`${Math.max(bounds.left+8-r.left,Math.min(0,bounds.right-8-r.right))}px`;label.style.top=`${Math.max(0,bounds.top+8-r.top)}px`;}
 }
}
function resize(){const rect=viewport.getBoundingClientRect();width=rect.width;height=rect.height;const compact=matchMedia('(max-width:900px), (max-aspect-ratio:1/1), (max-height:520px)').matches;camera=fitCamera(width,height,compact);baseScale=camera.scale;if(compact)camera=framePlacesCamera(width,height);
 if(saved?.version===4&&saved.width===width&&saved.height===height&&saved.camera&&['scale','x','y'].every(k=>Number.isFinite(saved.camera[k]))&&saved.camera.scale>=baseScale&&saved.camera.scale<=baseScale*4){camera=constrainCamera(saved.camera,width,height);}saved=null;render();}
function zoom(factor,anchor={x:width/2,y:height/2}){camera=zoomCamera(camera,Math.min(baseScale*4,Math.max(baseScale,camera.scale*factor)),anchor,width,height);render();}
$('zoom-in').addEventListener('click',()=>zoom(1.3));$('zoom-out').addEventListener('click',()=>zoom(1/1.3));$('map-fit').addEventListener('click',()=>{camera=fitCamera(width,height,matchMedia('(max-width:900px), (max-aspect-ratio:1/1), (max-height:520px)').matches);render();});
viewport.addEventListener('wheel',e=>{if(e.target.closest('.map-controls'))return;e.preventDefault();const rect=viewport.getBoundingClientRect();zoom(Math.exp(-Math.max(-100,Math.min(100,e.deltaY))*.003),{x:e.clientX-rect.left,y:e.clientY-rect.top});},{passive:false});
const pointers=new Map();let gesture=null,suppressClickUntil=0;
function startGesture(){const ps=[...pointers.values()];gesture=ps.length>=2?{kind:'pinch',camera:{...camera},center:{x:(ps[0].x+ps[1].x)/2,y:(ps[0].y+ps[1].y)/2},distance:Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y)||1}:{kind:'drag',camera:{...camera},start:ps[0],moved:false};}
viewport.addEventListener('pointerdown',e=>{if(e.target.closest('button,a')||(e.pointerType==='mouse'&&e.button!==0))return;const r=viewport.getBoundingClientRect();pointers.set(e.pointerId,{x:e.clientX-r.left,y:e.clientY-r.top});viewport.setPointerCapture(e.pointerId);viewport.focus({preventScroll:true});viewport.classList.add('dragging');startGesture();});
viewport.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const r=viewport.getBoundingClientRect();pointers.set(e.pointerId,{x:e.clientX-r.left,y:e.clientY-r.top});const ps=[...pointers.values()];if(gesture.kind==='pinch'&&ps.length>=2){const center={x:(ps[0].x+ps[1].x)/2,y:(ps[0].y+ps[1].y)/2},distance=Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y);const scale=Math.max(baseScale,Math.min(baseScale*4,gesture.camera.scale*distance/gesture.distance));camera=zoomCamera(gesture.camera,scale,gesture.center,width,height);camera=constrainCamera({...camera,x:camera.x+center.x-gesture.center.x,y:camera.y+center.y-gesture.center.y},width,height);suppressClickUntil=performance.now()+350;}else if(gesture.kind==='drag'){const dx=ps[0].x-gesture.start.x,dy=ps[0].y-gesture.start.y;if(Math.hypot(dx,dy)>5)gesture.moved=true;if(gesture.moved){camera=constrainCamera({...gesture.camera,x:gesture.camera.x+dx,y:gesture.camera.y+dy},width,height);suppressClickUntil=performance.now()+350;}}render();});
function releasePointer(e){if(!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);if(viewport.hasPointerCapture(e.pointerId))viewport.releasePointerCapture(e.pointerId);if(pointers.size)startGesture();else{gesture=null;viewport.classList.remove('dragging');}}
for(const type of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(type,releasePointer);
viewport.addEventListener('click',e=>{if(performance.now()<suppressClickUntil){e.preventDefault();e.stopPropagation();}},true);
window.addEventListener('blur',()=>{pointers.clear();gesture=null;viewport.classList.remove('dragging');});
viewport.addEventListener('keydown',e=>{if(e.target!==viewport)return;const shift=55;const moves={ArrowLeft:[shift,0],ArrowRight:[-shift,0],ArrowUp:[0,shift],ArrowDown:[0,-shift]};if(moves[e.key]){e.preventDefault();const [dx,dy]=moves[e.key];camera=constrainCamera({...camera,x:camera.x+dx,y:camera.y+dy},width,height);render();}else if(['+','=','-','Home'].includes(e.key)){e.preventDefault();if(e.key==='Home')$('map-fit').click();else zoom(e.key==='-'?1/1.3:1.3);}});
new ResizeObserver(resize).observe(viewport);resize();
// Static links remain usable if JavaScript or the map image fails.
const image=$('world-image');function imageReady(){$('map-loading').hidden=true;viewport.setAttribute('data-map-ready','true');}
image.addEventListener('load',imageReady);image.addEventListener('error',()=>{$('map-loading').textContent='地景暫時無法載入，仍可點選地點名稱進入。';});if(image.complete&&image.naturalWidth)imageReady();
startMapLight();
