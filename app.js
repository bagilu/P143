import {toggleSiteFullscreen} from './site-fullscreen.js?v=0.045';
import {createMusicAudio,worldHost} from './music-bridge.js?v=0.042';
import * as THREE from './assets/three.module.js';
import { SOFA_VIEW, OCEAN_PLATE } from './view-config.js';
import { applyDragLook, describeLookSettings, readLookSettings } from './look-controls.js?v=0.013';
import { RoomEnvironment } from './assets/RoomEnvironment.js';
import { PhotoView } from './photo-view.js?v=0.014';
import { SolarLightClock as LightClock,formatMinute } from './solar-light-clock.js?v=0.032';
import {syncSolarUI} from './solar-ui.js?v=0.032';
import { PHOTO_SCENES } from './photo-scenes.js?v=0.014';
import { parseSoundSettings } from './sound-settings.js';

const $=id=>document.getElementById(id);
const canvas=$('scene');
let displayPreference='photo';
try{displayPreference=localStorage.getItem('cabin-display-mode-v5')||'photo';}catch{}
if(!['photo','auto','model','art'].includes(displayPreference))displayPreference='photo';
const photoMode=displayPreference==='photo';
const lightClock=new LightClock();let lightFrame=lightClock.sample();let lastLightTick=-Infinity;
let renderer,photoView,scenicMode=false,fallbackMode=photoMode?'photo':displayPreference==='art'?'art':'model';
const staticHint=()=>photoMode?'拖曳查看 · 點選位置換位':fallbackMode==='model'?'模型預覽 · 使用下方按鈕移動':'靜景模式 · 使用下方按鈕移動';
try{if(displayPreference!=='auto')throw new Error('static-choice');renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}catch(e){
 scenicMode=true;
 renderer={setPixelRatio(){},setSize(){},render(){},shadowMap:{},capabilities:{getMaxAnisotropy:()=>1}};
 document.body.classList.add('scenic-mode');
 $('load-error').textContent=photoMode?'照片質感室內 · 拖曳查看，點選位置換位。':displayPreference==='auto'?'此裝置未啟用 WebGL，先顯示實際模型的固定視角預覽。':fallbackMode==='model'?'目前選擇模型預覽，可在「？」中切換畫面模式。':'目前選擇靜景模式，可在「？」中切換畫面模式。';
 const scenic=document.createElement('div');scenic.id='scenic';
 scenic.innerHTML=photoMode?'<svg id="scenic-view" preserveAspectRatio="xMidYMid slice" aria-label="寫實室內視景"><image/></svg>':fallbackMode==='model'?'<svg id="scenic-view" viewBox="0 0 960 540" preserveAspectRatio="xMidYMid slice" aria-label="小屋實際模型的入口預覽"><image href="assets/model-entry.png" width="960" height="540"/></svg>':'<svg id="scenic-view" viewBox="0 512 768 512" preserveAspectRatio="xMidYMid slice" aria-label="海邊小屋的靜景視角"><image href="assets/cabin-views.png" width="1536" height="1024"/></svg>';
 document.body.prepend(scenic);
 if(photoMode){photoView=new PhotoView($('scenic-view'),PHOTO_SCENES,lightFrame.minute);document.body.classList.add('photo-mode');canvas.setAttribute('aria-label','寫實室內視景。拖曳查看左右上下，使用下方按鈕或點選物件換位。');}
 $('location').querySelector('span').textContent=staticHint();
 const note=document.createElement('p');note.className='subtle';note.textContent=photoMode?'寫實視景採用 AI 生成的照片質感畫面，可在有限範圍拖曳查看，並切換入口、沙發、唱機與窗邊；不提供自由走動。':fallbackMode==='model'?'模型預覽是從網站實際幾何與材質輸出的固定視角；光影為離線近似。可切換位置與聽音樂，自由轉頭與走動需使用即時 3D 模式。':'靜景模式使用美術圖片，可切換位置與聽音樂。自由轉頭與走動需使用即時 3D 模式。';$('help').append(note);
}
$('mode-badge').textContent='海邊小屋 · '+(photoMode?'寫實視景':scenicMode?(fallbackMode==='model'?'模型預覽':'靜景模式'):'即時 3D');
$('display-mode').value=displayPreference;
if(!scenicMode)$('load-error').textContent='即時 3D 空間 · 可拖曳轉頭、走動與操作唱機。';
renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.0;
const scene=new THREE.Scene();
scene.background=new THREE.Color('#a3b9bc');
const camera=new THREE.PerspectiveCamera(SOFA_VIEW.standingFov,innerWidth/innerHeight,.04,100);
camera.rotation.order='YXZ';
camera.position.set(-2.18,1.6,1.92);
let yaw=-.42,pitch=-.025,entered=false,seated=false,navigation=null,transitioning=false;
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
try{reduced=localStorage.getItem('cabin-reduced')===null?reduced:localStorage.getItem('cabin-reduced')==='true';}catch{}
$('reduce-motion').checked=reduced;
const lookSettings=readLookSettings();
$('invert-look-x').checked=lookSettings.invertX;
$('invert-look-y').checked=lookSettings.invertY;
$('drag-direction').textContent=describeLookSettings(lookSettings);
const interactionObjects=[],sleeves=[],curtains=[],keys=new Set();
const raycaster=new THREE.Raycaster();
const mouse=new THREE.Vector2();
const floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
const clock=new THREE.Clock();
let savedSound=null;try{savedSound=localStorage.getItem('cabin-sound-settings');}catch{}
let {musicVolume,seaVolume,muted,oceanMotion,waveStrength}=parseSoundSettings(savedSound);
let grassMotion=true;try{grassMotion=localStorage.getItem('cabin-grass-motion')!=='false';}catch{}
let elapsed=0,hintTimer,lastActivity=performance.now(),activeTrack=-1;
const tracks=[{name:'琥珀時光',english:'Amber Hours'},{name:'靜謐琴聲',english:'Still Keys'},{name:'水晶潮汐',english:'Crystal Tide'}].map((track,id)=>({...track,defaultUrl:`Music/P143-0${id+1}.mp3`,url:`Music/P143-0${id+1}.mp3`,file:`P143-0${id+1}.mp3`,custom:false,revision:0}));
const audio=createMusicAudio();audio.id='record-audio';audio.hidden=true;audio.preload='none';audio.loop=true;audio.volume=musicVolume;if(audio instanceof Node)document.body.append(audio);
let audioContext,seaGain,dbPromise,leavingRoom=false;

function toast(message){$('hint').textContent=message;$('hint').classList.add('visible');clearTimeout(hintTimer);hintTimer=setTimeout(()=>$('hint').classList.remove('visible'),3600);}
function activity(){lastActivity=performance.now();document.body.classList.remove('hud-hidden');$('wake').hidden=true;}
function anyDialog(){return !!document.querySelector('dialog[open]');}
function openDialog(id){if(id==='records')id='sound';activity();keys.clear();navigation=null;const d=$(id);if(!d.open)d.showModal();}
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());activity();}

// The entire room, furniture and all viewpoints share this one world.
function grainTexture(base,kind='wood'){
 const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');g.fillStyle=base;g.fillRect(0,0,512,512);
 let seed=18271;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
 if(kind==='wood'){
  // Low-contrast fibres: board joints are geometry, not black stripes in the map.
  for(let i=0;i<900;i++){const x=random()*512,phase=random()*6.283;g.strokeStyle=`rgba(68,47,27,${.015+random()*.035})`;g.lineWidth=.25+random()*.45;g.beginPath();for(let y=0;y<=512;y+=8){const xx=x+Math.sin(y/512*Math.PI*2+phase)*1.5+Math.sin(y/512*Math.PI*4+phase)*.6;if(y===0)g.moveTo(xx,y);else g.lineTo(xx,y);}g.stroke();}
  for(let i=0;i<100;i++){g.strokeStyle='rgba(255,246,224,.045)';const x=random()*512;g.beginPath();g.moveTo(x,0);g.lineTo(x+1,512);g.stroke();}
 }else{
  for(let i=0;i<512;i+=2){g.strokeStyle=i%4?'rgba(255,250,236,.06)':'rgba(45,37,25,.035)';g.lineWidth=.6;g.beginPath();g.moveTo(i,0);g.lineTo(i,512);g.moveTo(0,i);g.lineTo(512,i);g.stroke();}
  for(let i=0;i<16000;i++){g.fillStyle=random()>.5?'rgba(255,250,231,.08)':'rgba(54,43,29,.04)';g.fillRect(random()*512,random()*512,.7,random()*1.4+.3);}
 }
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;
}
const timberTex=grainTexture('#b39b7c');timberTex.repeat.set(2,2);
const floorTex=grainTexture('#c7b392');floorTex.repeat.set(4,2);
const clothTex=grainTexture('#ded1b7','cloth');clothTex.repeat.set(3,3);
const rugTex=grainTexture('#a59679','cloth');rugTex.repeat.set(4,4);
const wallMat=new THREE.MeshStandardMaterial({map:timberTex,bumpMap:timberTex,bumpScale:.006,roughness:.86});
const floorMat=new THREE.MeshStandardMaterial({map:floorTex,bumpMap:floorTex,bumpScale:.004,roughness:.7});
const darkWood=new THREE.MeshStandardMaterial({color:'#735439',roughness:.76});
const trimMat=new THREE.MeshStandardMaterial({color:'#ad885b',roughness:.7});
const linen=new THREE.MeshStandardMaterial({map:clothTex,bumpMap:clothTex,bumpScale:.015,roughness:1,color:'#e5ddcd'});
const pillowMat=new THREE.MeshStandardMaterial({map:clothTex,roughness:1,color:'#c4b99d'});
const black=new THREE.MeshStandardMaterial({color:'#161a17',roughness:.48});
const brass=new THREE.MeshStandardMaterial({color:'#b9945a',roughness:.35,metalness:.65});
function box(w,h,d,mat,x=0,y=0,z=0,parent=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function roundBox(w,h,d,r,mat,x,y,z,parent=scene){
 const s=new THREE.Shape();const a=w/2-r,b=h/2-r;s.moveTo(-a,-b);s.lineTo(a,-b);s.lineTo(a,b);s.lineTo(-a,b);s.closePath();
 const geo=new THREE.ExtrudeGeometry(s,{depth:Math.max(.01,d-2*r),bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:4,steps:1,curveSegments:6});geo.translate(0,0,-d/2+r);
 const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function cylinder(rt,rb,h,mat,x,y,z,parent=scene,segments=40){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function interactive(m,kind,index){m.userData={kind,index};interactionObjects.push(m);return m;}
function segment(a,b,r,mat,parent=scene){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);const v=end.clone().sub(start);const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,v.length(),12),mat);m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());parent.add(m);return m;}
box(6.12,.14,5.12,floorMat,0,-.07,0);
box(.14,2.85,5.12,wallMat,-3.06,1.425,0);box(.14,2.85,5.12,wallMat,3.06,1.425,0);
box(6.12,2.85,.14,wallMat,0,1.425,2.57);
box(6.12,.16,5.12,wallMat,0,2.92,0);
// Ocean-facing wall has an actual opening, with sill at 0.55 m.
box(6.12,.55,.14,wallMat,0,.275,-2.57);box(6.12,.26,.14,wallMat,0,2.72,-2.57);
box(.72,2.05,.14,wallMat,-2.7,1.57,-2.57);box(.72,2.05,.14,wallMat,2.7,1.57,-2.57);
box(4.82,.11,.26,trimMat,0,.55,-2.49);box(4.82,.1,.22,trimMat,0,2.59,-2.49);
box(.11,2.12,.22,trimMat,-2.36,1.57,-2.49);box(.11,2.12,.22,trimMat,2.36,1.57,-2.49);
for(let x=-2.8;x<=3;x+=.4){box(.012,2.66,.012,darkWood,x,1.38,2.49);}
for(let z=-2.4;z<2.6;z+=.4){box(.012,2.66,.012,darkWood,-2.98,1.38,z);box(.012,2.66,.012,darkWood,2.98,1.38,z);}
// Fine floor joints and the lower window wall's timber boards.
const jointMat=new THREE.MeshStandardMaterial({color:'#88765e',roughness:1});
for(let x=-2.8;x<3;x+=.28)box(.003,.0015,5,jointMat,x,.001,0);
for(let x=-2.8;x<3;x+=.32)box(.003,.45,.003,jointMat,x,.27,-2.493);
for(let z=-2.4;z<2.8;z+=1.2)box(6.1,.12,.15,darkWood,0,2.79,z);
box(6.1,.08,.06,trimMat,0,.07,2.46);box(.06,.08,5,trimMat,-2.97,.07,0);box(.06,.08,5,trimMat,2.97,.07,0);
// Door and a quiet framed print at the back.
box(.95,2.1,.06,darkWood,-2.07,1.05,2.46);box(.84,1.96,.02,wallMat,-2.07,1.05,2.415);cylinder(.035,.035,.1,brass,-1.75,1.05,2.36).rotation.x=Math.PI/2;
const printMat=new THREE.MeshStandardMaterial({color:'#b8b9a3',roughness:1});box(.035,.68,.9,darkWood,-2.955,1.65,-.75);box(.04,.59,.8,printMat,-2.93,1.65,-.75);
// Rug, linen sofa and low oval table.
box(3.55,.018,2.6,new THREE.MeshStandardMaterial({map:rugTex,roughness:1}),0,.014,.82);
const sofa=new THREE.Group();scene.add(sofa);
[-1.15,1.15].forEach(x=>[.86,1.66].forEach(z=>cylinder(.035,.03,.17,darkWood,x,.11,z,sofa)));
interactive(roundBox(2.7,.29,.98,.07,linen,0,.34,1.25,sofa),'sofa');
interactive(roundBox(2.72,.57,.24,.075,linen,0,.72,1.67,sofa),'sofa');
[-1.29,1.29].forEach(x=>interactive(roundBox(.22,.42,.96,.07,linen,x,.57,1.25,sofa),'sofa'));
[-.61,.61].forEach(x=>interactive(roundBox(1.18,.15,.75,.05,linen,x,.55,1.15,sofa),'sofa'));
const pipingMat=new THREE.MeshStandardMaterial({color:'#c9c0ad',roughness:1});
for(const x of [-.61,.61]){const points=[[-.52,-.29],[.52,-.29],[.55,-.25],[.55,.25],[.52,.29],[-.52,.29],[-.55,.25],[-.55,-.25]].map(([dx,dz])=>new THREE.Vector3(x+dx,.62,1.15+dz));const seam=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points,true),64,.0035,5,true),pipingMat);sofa.add(seam);}
[-.8,.8].forEach(x=>{const p=interactive(roundBox(.56,.42,.16,.055,pillowMat,x,.79,1.47,sofa),'sofa');p.rotation.x=-.14;p.rotation.z=x>0?-.09:.1;});
const blanketMat=new THREE.MeshStandardMaterial({color:'#a49778',map:clothTex,roughness:1});const blanket=box(.47,.025,.74,blanketMat,-.79,.65,1.35,sofa);blanket.rotation.z=.02;box(.47,.47,.025,blanketMat,-.79,.39,.87,sofa);
const tableMat=new THREE.MeshStandardMaterial({map:timberTex,color:'#a9875e',roughness:.62});
const table=cylinder(.67,.67,.07,tableMat,-.32,.4,-.12);table.scale.z=.56;
[-.69,.06].forEach(x=>[-.3,.08].forEach(z=>box(.045,.34,.045,darkWood,x,.21,z)));
box(.25,.03,.18,new THREE.MeshStandardMaterial({color:'#c8c5b1'}),-.57,.45,-.1);box(.245,.025,.17,new THREE.MeshStandardMaterial({color:'#d5d1bd'}),-.55,.476,-.12);
const ceramic=new THREE.MeshStandardMaterial({color:'#c0b49b',roughness:.98});cylinder(.057,.049,.085,ceramic,-.04,.477,-.12);const handle=new THREE.Mesh(new THREE.TorusGeometry(.033,.009,8,18),ceramic);handle.position.set(.017,.488,-.12);scene.add(handle);
const coffee=new THREE.Mesh(new THREE.CircleGeometry(.046,40),new THREE.MeshStandardMaterial({color:'#3e2a1c',roughness:.24}));coffee.rotation.x=-Math.PI/2;coffee.position.set(-.04,.5205,-.12);scene.add(coffee);
const mugRim=new THREE.Mesh(new THREE.TorusGeometry(.052,.004,8,40),ceramic);mugRim.rotation.x=-Math.PI/2;mugRim.position.set(-.04,.521,-.12);scene.add(mugRim);
// East wall record cabinet, record sleeves and turntable.
const recordZoneStart=scene.children.length;
const cabinetMat=new THREE.MeshStandardMaterial({map:timberTex,color:'#eee6d5',roughness:.67});
interactive(box(.6,.7,2.2,cabinetMat,2.65,.45,-.2),'records');box(.65,.07,2.26,tableMat,2.63,.835,-.2);
for(let z=-1.25;z<.94;z+=.43){box(.014,.59,.015,darkWood,2.342,.45,z);}
[-1.05,.65].forEach(z=>box(.4,.13,.06,darkWood,2.66,.08,z));
const manager=new THREE.LoadingManager();
manager.onLoad=async()=>{sleeves.forEach(s=>{s.front.material.map.needsUpdate=true;});if(photoMode){let loaded=await photoView.ready;if(!loaded){loaded=await photoView.setView('entry');if(loaded){syncLightUI();}else{$('load-error').textContent='小屋圖片暫時無法載入，請重新整理再試。';return;}}}$('enter').disabled=false;$('enter').textContent='進入海邊小屋';};
manager.onError=url=>{$('load-error').textContent='部分素材未能載入，您仍可進入小屋。';};
const loader=new THREE.TextureLoader(manager);
const albumBase=loader.load('assets/albums.png');albumBase.colorSpace=THREE.SRGBColorSpace;
const crops=[{x:44,w:491},{x:711,w:489},{x:1376,w:493}];
crops.forEach((crop,i)=>{
 const t=albumBase.clone();t.repeat.set(crop.w/2048,496/683);t.offset.set(crop.x/2048,1-585/683);t.needsUpdate=true;
 const material=new THREE.MeshStandardMaterial({map:t,roughness:.85});
 const sleeve=interactive(box(.025,.43,.43,new THREE.MeshStandardMaterial({color:['#263539','#ddd6be','#b5adc8'][i]}),2.76,1.09,-1.01+i*.48),'sleeve',i);
 const front=interactive(new THREE.Mesh(new THREE.PlaneGeometry(.43,.43),material),'sleeve',i);front.rotation.y=-Math.PI/2;front.position.set(2.743,1.09,-1.01+i*.48);scene.add(front);sleeves.push({mesh:sleeve,front,baseY:1.09});
});
interactive(roundBox(.5,.07,.66,.018,darkWood,2.61,.905,.55),'records');
interactive(cylinder(.216,.216,.025,black,2.61,.956,.55),'records');
const vinyl=new THREE.Group();vinyl.position.set(2.61,.973,.55);scene.add(vinyl);
const label=new THREE.Mesh(new THREE.CircleGeometry(.075,48),new THREE.MeshStandardMaterial({color:'#d2b878',roughness:.8}));label.rotation.x=-Math.PI/2;vinyl.add(label);
const notch=box(.014,.002,.05,new THREE.MeshStandardMaterial({color:'#665542'}),.018,.002,0,vinyl);cylinder(.007,.007,.03,brass,2.61,.99,.55);
for(let r=.09;r<.21;r+=.009){const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.0008,3,64),new THREE.MeshStandardMaterial({color:'#414640',roughness:.5}));ring.rotation.x=-Math.PI/2;ring.position.set(2.61,.971,.55);scene.add(ring);}
const tonearm=new THREE.Group();tonearm.position.set(2.78,.98,.81);scene.add(tonearm);segment([0,0,0],[-.04,.02,-.13],.006,brass,tonearm);segment([-.04,.02,-.13],[-.10,.02,-.17],.006,brass,tonearm);box(.025,.018,.04,black,-.1,.014,-.17,tonearm);
// Move the complete record area together; preserve every object's relative placement.
const recordZone=new THREE.Group();for(const object of scene.children.slice(recordZoneStart))recordZone.add(object);recordZone.position.z=-.8;scene.add(recordZone);
// Warm floor lamp and very restrained greenery.
cylinder(.16,.18,.035,black,-2.52,.03,-1.54);cylinder(.014,.014,1.66,black,-2.52,.85,-1.54);
const shadeMat=new THREE.MeshStandardMaterial({color:'#e8d3a5',roughness:1,side:THREE.DoubleSide,emissive:'#b98c49',emissiveIntensity:.25});
const shade=new THREE.Mesh(new THREE.CylinderGeometry(.17,.24,.37,40,1,true),shadeMat);shade.position.set(-2.52,1.65,-1.54);scene.add(shade);
const lamp=new THREE.PointLight('#ffcd88',.4,3,2);lamp.position.set(-2.52,1.59,-1.54);scene.add(lamp);
function plant(x,z){cylinder(.11,.085,.23,ceramic,x,.12,z);const leafMat=new THREE.MeshStandardMaterial({color:'#74805a',side:THREE.DoubleSide,roughness:1});for(let i=0;i<15;i++){const a=i*2.4,rad=.1+(i%3)*.04,y=.32+(i%5)*.08;const lx=x+Math.cos(a)*rad,lz=z+Math.sin(a)*rad;segment([x,.2,z],[lx,y,lz],.003,leafMat);const leaf=new THREE.Mesh(new THREE.SphereGeometry(.065,7,5),leafMat);leaf.scale.set(.45,.28,1.1);leaf.position.set(lx,y,lz);leaf.rotation.set(.5,a,.5);scene.add(leaf);}}
plant(-2.63,-1.94);
function curtain(x,width){const geometry=new THREE.PlaneGeometry(width,2.38,24,28);const pos=geometry.attributes.position;for(let i=0;i<pos.count;i++){pos.setZ(i,Math.sin((pos.getX(i)/width)*Math.PI*12)*.047);}
 geometry.computeVertexNormals();const curtainTex=grainTexture('#eee9dc','cloth');curtainTex.repeat.set(1,4);
 const material=new THREE.MeshStandardMaterial({map:curtainTex,bumpMap:curtainTex,bumpScale:.003,roughness:1,side:THREE.DoubleSide,transparent:true,opacity:.82});const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,1.45,-2.37);mesh.receiveShadow=true;scene.add(mesh);curtains.push({mesh,base:pos.array.slice()});}
curtain(2.22,.35);curtain(-2.32,.12);segment([-2.56,2.7,-2.36],[2.56,2.7,-2.36],.015,darkWood);
// Single outdoor image, gently animated on the sea only; the cabin is real geometry.
const oceanTexture=loader.load('assets/ocean.png');oceanTexture.colorSpace=THREE.SRGBColorSpace;
const wallPrint=new THREE.Mesh(new THREE.PlaneGeometry(.76,.55),new THREE.MeshStandardMaterial({map:oceanTexture,roughness:1,color:'#e2dfcf'}));wallPrint.rotation.y=Math.PI/2;wallPrint.position.set(-2.905,1.65,-.75);scene.add(wallPrint);
const oceanMaterial=new THREE.ShaderMaterial({uniforms:{uMap:{value:oceanTexture},uTime:{value:0},uMotion:{value:reduced?0:1}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`uniform sampler2D uMap;uniform float uTime;uniform float uMotion;varying vec2 vUv;void main(){vec2 uv=vUv;float sea=smoothstep(.20,.30,uv.y)*(1.0-smoothstep(.465,.49,uv.y));uv.x+=sin(uv.y*210.0+uTime*.72)*.00085*sea*uMotion;uv.y+=sin(uv.x*90.0-uTime*.52)*.00045*sea*uMotion;vec4 c=texture2D(uMap,uv);c.rgb+=sin(uv.x*190.0+uv.y*370.0+uTime*.6)*.004*sea*uMotion;gl_FragColor=c;#include <tonemapping_fragment>\n#include <colorspace_fragment>}`,side:THREE.DoubleSide});
// Shader include directives must start on their own lines.
oceanMaterial.fragmentShader=oceanMaterial.fragmentShader.replace(';#include',';\n#include');
const ocean=new THREE.Mesh(new THREE.PlaneGeometry(OCEAN_PLATE.width,OCEAN_PLATE.height),oceanMaterial);ocean.position.set(0,OCEAN_PLATE.centerY,OCEAN_PLATE.z);scene.add(ocean);
const hemi=new THREE.HemisphereLight('#e6edee','#927553',1.65);scene.add(hemi);
const sun=new THREE.DirectionalLight('#ffe6bc',2.4);sun.position.set(-4,6,-7);sun.target.position.set(.4,0,.6);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);Object.assign(sun.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.5,far:18});sun.shadow.bias=-.0004;sun.shadow.normalBias=.025;scene.add(sun);scene.add(sun.target);
const fill=new THREE.DirectionalLight('#c6dee7',.4);fill.position.set(1,2,-5);scene.add(fill);
function contactShadow(x,z,w,d,opacity){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');const grad=g.createRadialGradient(64,64,12,64,64,64);grad.addColorStop(0,'rgba(0,0,0,.7)');grad.addColorStop(.6,'rgba(0,0,0,.28)');grad.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=grad;g.fillRect(0,0,128,128);const shadowMap=new THREE.CanvasTexture(c);const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,opacity,depthWrite:false,toneMapped:false}));m.rotation.x=-Math.PI/2;m.position.set(x,.028,z);m.userData.previewIgnore=true;scene.add(m);}
contactShadow(0,1.3,3.1,1.5,.42);contactShadow(-.32,-.12,1.75,1.0,.23);contactShadow(2.63,-1.0,.9,2.4,.2);

// Walkable grid. Movement and point-to-point navigation use the same collision map.
if(!scenicMode){const pmrem=new THREE.PMREMGenerator(renderer);const environment=new RoomEnvironment();const environmentTarget=pmrem.fromScene(environment,.04);scene.environment=environmentTarget.texture;scene.environmentIntensity=.28;environment.dispose();pmrem.dispose();}
const obstacles=[{x0:-1.58,x1:1.58,z0:.59,z1:1.99},{x0:-1.17,x1:.53,z0:-.65,z1:.41},{x0:2.18,x1:3.1,z0:-2.35,z1:.32},{x0:-2.8,x1:-2.27,z0:-1.84,z1:-1.24}];
function walkable(x,z){return x>=-2.76&&x<=2.76&&z>=-2.2&&z<=2.28&&!obstacles.some(o=>x>o.x0&&x<o.x1&&z>o.z0&&z<o.z1);}
const gridStep=.14,gridMinX=-2.73,gridMinZ=-2.17,gridW=40,gridH=32;
function gridPoint(id){return new THREE.Vector3(gridMinX+(id%gridW)*gridStep,1.6,gridMinZ+Math.floor(id/gridW)*gridStep);}
function nearestNode(x,z){let best=-1,dist=Infinity;for(let id=0;id<gridW*gridH;id++){const p=gridPoint(id);if(!walkable(p.x,p.z))continue;const d=(p.x-x)**2+(p.z-z)**2;if(d<dist){best=id;dist=d;}}return best;}
function pathTo(target){const start=nearestNode(camera.position.x,camera.position.z),end=nearestNode(target.x,target.z);if(start<0||end<0)return null;const open=new Set([start]),came=new Map(),scores=new Map([[start,0]]);const goal=gridPoint(end);let limit=0;
 while(open.size&&limit++<2000){let current=-1,best=Infinity;for(const n of open){const p=gridPoint(n);const f=(scores.get(n)??Infinity)+p.distanceTo(goal);if(f<best){best=f;current=n;}}if(current===end){const result=[gridPoint(current)];while(came.has(current)){current=came.get(current);result.unshift(gridPoint(current));}return result.slice(1);}
 open.delete(current);const cx=current%gridW,cz=Math.floor(current/gridW);for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=cx+dx,nz=cz+dz;if(nx<0||nx>=gridW||nz<0||nz>=gridH)continue;const next=nz*gridW+nx,p=gridPoint(next);if(!walkable(p.x,p.z))continue;if(dx&&dz){if(!walkable(gridMinX+(cx+dx)*gridStep,gridMinZ+cz*gridStep)||!walkable(gridMinX+cx*gridStep,gridMinZ+(cz+dz)*gridStep))continue;}const score=(scores.get(current)??Infinity)+gridStep*Math.hypot(dx,dz);if(score<(scores.get(next)??Infinity)){came.set(next,current);scores.set(next,score);open.add(next);}}}return null;
}
function lookToward(target){const d=target.clone().sub(camera.position);yaw=Math.atan2(-d.x,-d.z);pitch=Math.atan2(d.y,Math.hypot(d.x,d.z));}
function setLocation(label,sub){$('location').firstChild.textContent=label;$('location').querySelector('span').textContent=sub;}
const destinations={entry:{pos:new THREE.Vector3(-2.18,1.6,1.92),look:new THREE.Vector3(0,1.3,-2.5)},records:{pos:new THREE.Vector3(1.81,1.6,-.28),look:new THREE.Vector3(2.64,1.03,-.95)},window:{pos:new THREE.Vector3(.05,1.6,-1.64),look:new THREE.Vector3(0,1.6,-25)},sofa:{pos:new THREE.Vector3(1.8,1.6,.43),look:new THREE.Vector3(0,1.1,-2.5)}};
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function scenicView(name){if(photoMode)return photoView.setView(name);if(!scenicMode)return;const svg=$('scenic-view'),img=svg.querySelector('image');if(fallbackMode==='model'){const view=['sofa','entry','records','window'].includes(name)?name:'entry';img.setAttribute('href',`assets/model-${view}.png`);img.setAttribute('width','960');img.setAttribute('height','540');svg.setAttribute('viewBox','0 0 960 540');svg.setAttribute('aria-label',`小屋實際模型預覽：${{sofa:'沙發',entry:'入口',records:'唱機前',window:'窗邊'}[view]}`);return;}if(name==='sofa'){img.setAttribute('href','assets/sofa-view.png');img.setAttribute('width','1672');img.setAttribute('height','941');svg.setAttribute('viewBox','0 0 1672 941');svg.setAttribute('aria-label','坐在沙發看海的靜景畫面');return;}img.setAttribute('href','assets/cabin-views.png');img.setAttribute('width','1536');img.setAttribute('height','1024');const boxes={entry:'0 512 768 512',records:'768 512 768 512',window:'180 25 1150 385'};svg.setAttribute('viewBox',boxes[name]??boxes.entry);svg.setAttribute('aria-label',name==='window'?'窗邊海景的靜景畫面':name==='records'?'唱機前的靜景畫面':'海邊小屋入口的靜景畫面');}
async function fadeTo(position,look,view){transitioning=true;$('fade').classList.add('active');await delay(reduced?100:440);camera.position.copy(position);lookToward(look);camera.fov=view==='sofa'?SOFA_VIEW.verticalFov:SOFA_VIEW.standingFov;camera.updateProjectionMatrix();if(view)await scenicView(view);await delay(80);$('fade').classList.remove('active');transitioning=false;}
async function stand(){if(!seated)return;seated=false;await fadeTo(destinations.sofa.pos,destinations.sofa.look,'entry');$('sit-label').textContent='坐下看海';setLocation('沙發旁',scenicMode?staticHint():'拖曳轉頭 · 輕點地板走動');activity();}
async function sit(){if(transitioning)return;closeDialogs();navigation=null;keys.clear();if(seated){await stand();return;}await fadeTo(new THREE.Vector3(...SOFA_VIEW.position),new THREE.Vector3(...SOFA_VIEW.target),'sofa');seated=true;$('sit-label').textContent='起身走走';setLocation('坐在海邊',photoMode?'左右拖曳環顧 · 自在看海':'不必做什麼，就在這裡待著。');activity();}
async function navigate(name,done){if(transitioning)return;closeDialogs();await stand();const dest=destinations[name];if(reduced||scenicMode){await fadeTo(dest.pos,dest.look,name);arrival(name);done?.();return;}const points=pathTo(dest.pos);if(!points){toast('這裡走不過去，試著從家具旁邊繞行。');return;}navigation={points,name,look:dest.look,done};activity();}
function arrival(name){if(name==='window')setLocation('窗邊','慢慢看海，也可以什麼都不想。');else if(name==='records')setLocation('唱機前','三張唱片，三種心情。');else setLocation('初到小屋',scenicMode?staticHint():'拖曳看看四周 · 方向鍵慢慢走');}

// Shared defaults stream from Music/. Personal replacements stay in this browser.
function openDB(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open('quiet-seaside-cabin',1);req.onupgradeneeded=()=>req.result.createObjectStore('tracks');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});return dbPromise;}
async function storeTrack(id,file){const db=await openDB();await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite');tx.objectStore('tracks').put({blob:file,name:file.name},id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
function stopTrackSource(id){if(activeTrack===id){audio.pause();audio.removeAttribute('src');audio.load();activeTrack=-1;}}
function releaseTrack(id){if(tracks[id].custom&&tracks[id].url)URL.revokeObjectURL(tracks[id].url);}
function bindTrack(id,blob,name){stopTrackSource(id);releaseTrack(id);Object.assign(tracks[id],{file:name,url:URL.createObjectURL(blob),custom:true,revision:tracks[id].revision+1});updatePlayer();}
async function restoreTracks(){const revisions=tracks.map(t=>t.revision);try{const db=await openDB();await Promise.all(tracks.map((_,id)=>new Promise(resolve=>{const req=db.transaction('tracks').objectStore('tracks').get(id);req.onsuccess=()=>{if(req.result&&tracks[id].revision===revisions[id])bindTrack(id,req.result.blob,req.result.name);resolve();};req.onerror=resolve;})));}catch{/* Hosted defaults still play if IndexedDB is unavailable. */}}
async function resetTrack(id){activity();stopTrackSource(id);releaseTrack(id);Object.assign(tracks[id],{file:`P143-0${id+1}.mp3`,url:tracks[id].defaultUrl,custom:false,revision:tracks[id].revision+1});updatePlayer();try{const db=await openDB();await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite');tx.objectStore('tracks').delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});toast('已恢復這張唱片的預設音樂。');}catch{toast('本次已恢復預設；此瀏覽器未能保存變更，下次可能需再次恢復。');}}
restoreTracks();
let fileTarget=0;
function chooseFile(id){fileTarget=id;$('music-file').value='';$('music-file').click();}
$('music-file').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;const id=fileTarget;if(!/^audio\//.test(file.type)&&! /\.(mp3|m4a|wav|ogg|flac|aac)$/i.test(file.name)){toast('請選擇音樂檔，例如 MP3。');return;}bindTrack(id,file,file.name);try{await storeTrack(id,file);toast('音樂已放入唱片；點「播放」即可聆聽。');}catch{toast('本次可播放；此瀏覽器未能保留檔案，下次需重新選取。');}activity();});
function updatePlayer(){const playing=activeTrack>=0&&!audio.paused;$('now-playing').hidden=activeTrack<0;$('playing-title').textContent=activeTrack<0?'':tracks[activeTrack].name;$('pause').textContent=playing?'Ⅱ':'▷';$('pause').setAttribute('aria-label',playing?'暫停音樂':'繼續播放');document.querySelectorAll('.record').forEach((e,i)=>{e.classList.toggle('active',i===activeTrack);e.querySelector('.play-track').textContent=i===activeTrack&&playing?'暫停':'播放';e.querySelector('.load-track').textContent=tracks[i].custom?'更換 MP3':'另選音樂';e.querySelector('.reset-track').hidden=!tracks[i].custom;$('file-'+i).textContent=(tracks[i].custom?'自選音樂 · ':'預設音樂 · ')+tracks[i].file;});label.material.color.set(['#b89755','#e0d9bf','#c3b9d6'][Math.max(0,activeTrack)]);}
async function playTrack(id,{sitAfter=false}={}){activity();if(!tracks[id].url){toast('先為這張唱片放入您的音樂。');chooseFile(id);return;}try{if(activeTrack===id&&!audio.paused){audio.pause();updatePlayer();return;}if(activeTrack!==id){audio.pause();audio.src=tracks[id].url;activeTrack=id;audio.currentTime=0;}audio.volume=muted?0:musicVolume;await audio.play();updatePlayer();if(sitAfter&&!seated)await sit();}catch{toast('目前無法播放，請再試一次、檢查連線，或另選 MP3。');updatePlayer();}}
audio.addEventListener('pause',updatePlayer);audio.addEventListener('play',updatePlayer);audio.addEventListener('error',()=>{if(audio.getAttribute('src'))toast('音樂暫時無法播放，請檢查連線、再按播放，或另選 MP3。');});
function initSea(){try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();if(!seaGain){const buffer=audioContext.createBuffer(1,audioContext.sampleRate*12,audioContext.sampleRate),data=buffer.getChannelData(0);let last=0;for(let i=0;i<data.length;i++){const white=Math.random()*2-1;last=(last+white*.03)/1.03;data[i]=last*3.2;}const source=audioContext.createBufferSource();source.buffer=buffer;source.loop=true;const low=audioContext.createBiquadFilter();low.type='lowpass';low.frequency.value=1700;const high=audioContext.createBiquadFilter();high.type='highpass';high.frequency.value=110;seaGain=audioContext.createGain();seaGain.gain.value=0;source.connect(low).connect(high).connect(seaGain).connect(audioContext.destination);source.start();}audioContext.resume();}catch{toast('目前無法啟動海浪聲，您仍可使用唱機。');}}
function setVolumes(){audio.volume=muted?0:musicVolume;$('mute').textContent=muted?'恢復聲音':'全部靜音';}
function saveSoundSettings(){try{localStorage.setItem('cabin-sound-settings',JSON.stringify({musicVolume,seaVolume,muted,oceanMotion,waveStrength}));}catch{}}
function syncSeaMotion(){const enabled=oceanMotion&&!reduced;if(photoMode){photoView.setMotion(enabled);photoView.setWaveStrength(waveStrength);photoView.setGrassMotion(grassMotion&&!reduced);}$('grass-motion').checked=grassMotion;$('grass-motion').disabled=reduced||!photoMode;$('wave-strength').value=Math.round(waveStrength*100);$('wave-value').textContent=Math.round(waveStrength*100)+'%';$('wave-strength').disabled=!enabled||(scenicMode&&!photoMode);oceanMaterial.uniforms.uMotion.value=enabled?waveStrength/.7:0;$('ocean-motion').checked=oceanMotion;$('ocean-motion').disabled=reduced||(scenicMode&&!photoMode);$('motion-status').textContent=scenicMode&&!photoMode?'目前固定視角模式不播放海面動態。':reduced?'已啟用「減少動態」，海面保持靜止。':oceanMotion&&waveStrength>0?'海浪緩緩湧進、退回，可調整起伏幅度。':'海面動態已關閉。';}

$('enter').addEventListener('click',()=>{if(entered)return;entered=true;document.body.classList.add('entered');$('welcome').classList.add('leaving');initSea();activity();canvas.focus();toast('歡迎。慢慢看看，這裡沒有需要完成的事。');});
$('records-button').addEventListener('click',()=>navigate('records',()=>openDialog('records')));
$('sit-button').addEventListener('click',sit);$('window-button').addEventListener('click',()=>navigate('window'));
function syncLightUI(){
 const f=lightFrame,time=formatMinute(f.minute);syncSolarUI(f,lightClock,tickLight);$('light-label').textContent=time;
 $('light-current').textContent=time+' · '+(f.follow?'跟隨現在':f.label+' · 手動暫停');
 if(document.activeElement!==$('light-time'))$('light-time').value=Math.floor(f.minute);
 $('light-time').setAttribute('aria-valuetext',time);$('light-time-value').textContent=time;
 $('light-follow').checked=f.follow;
 $('light-status').textContent=f.transitioning?`正在平順接回現在的光景 · 約 ${Math.max(1,Math.ceil((1-f.progress)*5))} 分鐘後完成。`:f.follow?'跟隨花蓮時間，日出與日落各以一小時平順漸變。':'時間已暫停，立即呈現選定光景；海浪與音樂繼續。';
}
function tickLight(now=performance.now()){
 lightFrame=lightClock.sample(now);if(photoMode)photoView.setLightState(lightFrame.state,lightFrame.minute);syncLightUI();
}
$('light-time').addEventListener('input',e=>{lightClock.select(Number(e.target.value));tickLight();activity();});
$('light-follow').addEventListener('change',e=>{if(e.target.checked)lightClock.followNow();else lightClock.select(lightFrame.minute);tickLight();activity();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&lightClock.follow){lightClock.followNow();tickLight();}});
$('light-button').hidden=!photoMode;$('light-button').addEventListener('click',()=>{tickLight();openDialog('light');});$('light-sit').addEventListener('click',()=>{closeDialogs();if(!seated)sit();});syncLightUI();
$('sound-button').addEventListener('click',()=>openDialog('sound'));$('help-button').addEventListener('click',()=>openDialog('help'));
$('records-sit').addEventListener('click',sit);$('return-entry').addEventListener('click',()=>navigate('entry'));
document.querySelectorAll('.close').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('close',activity);d.addEventListener('click',e=>{if(e.target!==d)return;const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();});});
document.querySelectorAll('[data-play]').forEach(b=>b.addEventListener('click',()=>playTrack(Number(b.dataset.play),{sitAfter:false})));
document.querySelectorAll('[data-select]').forEach(b=>b.addEventListener('click',()=>playTrack(Number(b.dataset.select))));
document.querySelectorAll('[data-reset]').forEach(b=>b.addEventListener('click',()=>resetTrack(Number(b.dataset.reset))));
document.querySelectorAll('[data-load]').forEach(b=>b.addEventListener('click',()=>chooseFile(Number(b.dataset.load))));
$('stop-record').addEventListener('click',()=>{audio.pause();audio.currentTime=0;activeTrack=-1;updatePlayer();toast('唱機已停止，還有窗外的海。');});
$('pause').addEventListener('click',()=>{if(activeTrack>=0)playTrack(activeTrack);});
$('sea-volume').addEventListener('input',e=>{seaVolume=Number(e.target.value)/100;$('sea-value').textContent=e.target.value+'%';saveSoundSettings();activity();});
$('music-volume').addEventListener('input',e=>{musicVolume=Number(e.target.value)/100;$('music-value').textContent=e.target.value+'%';setVolumes();saveSoundSettings();activity();});
$('mute').addEventListener('click',()=>{muted=!muted;setVolumes();saveSoundSettings();});
$('wave-strength').addEventListener('input',e=>{waveStrength=Number(e.target.value)/100;syncSeaMotion();saveSoundSettings();activity();});
$('ocean-motion').addEventListener('change',e=>{oceanMotion=e.target.checked;syncSeaMotion();saveSoundSettings();activity();});
$('grass-motion').addEventListener('change',e=>{grassMotion=e.target.checked;syncSeaMotion();try{localStorage.setItem('cabin-grass-motion',String(grassMotion));}catch{}activity();});
$('reduce-motion').addEventListener('change',e=>{reduced=e.target.checked;syncSeaMotion();try{localStorage.setItem('cabin-reduced',String(reduced));}catch{}});
for(const [key,value] of [['sea',seaVolume],['music',musicVolume]]){$(key+'-volume').value=Math.round(value*100);$(key+'-value').textContent=Math.round(value*100)+'%';}
setVolumes();syncSeaMotion();updatePlayer();
for(const axis of ['x','y']){$('invert-look-'+axis).addEventListener('change',e=>{lookSettings[axis==='x'?'invertX':'invertY']=e.target.checked;try{localStorage.setItem('cabin-look-invert-'+axis,String(e.target.checked));}catch{}$('drag-direction').textContent=describeLookSettings(lookSettings);activity();});}
$('fullscreen').addEventListener('click',async()=>{try{closeDialogs();await toggleSiteFullscreen();}catch{toast('此瀏覽器暫不支援全螢幕。');}});
$('wake').addEventListener('click',activity);
$('display-mode').addEventListener('change',e=>{try{localStorage.setItem('cabin-display-mode-v5',e.target.value);location.reload();}catch{toast('此瀏覽器無法保存畫面設定。');}});
document.addEventListener('focusin',activity);
const modeNote=document.createElement('p');modeNote.className='subtle';modeNote.id='render-mode-status';modeNote.textContent=photoMode?'目前畫面：寫實室內視景 · 可拖曳查看／位置切換':scenicMode?(fallbackMode==='model'?'目前畫面：實際模型預覽 · 固定位置切換':'目前畫面：靜景模式 · 固定位置切換'):'目前畫面：即時 3D 空間 · 可轉頭與自由走動';$('help').append(modeNote);

// Drag-to-look never triggers a click on release. Pinch and multitouch are ignored.
let pointer=null;
canvas.addEventListener('pointerdown',e=>{if(!entered||anyDialog()||transitioning||!e.isPrimary)return;const hidden=document.body.classList.contains('hud-hidden');activity();pointer={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,drag:false,wakeOnly:hidden};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!pointer||e.pointerId!==pointer.id)return;const dx=e.clientX-pointer.lastX,dy=e.clientY-pointer.lastY;if(Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>7)pointer.drag=true;if(pointer.drag){navigation=null;if(photoMode){photoView.drag(dx,dy,lookSettings);}else if(!scenicMode){({yaw,pitch}=applyDragLook(yaw,pitch,dx,dy,lookSettings));}activity();}pointer.lastX=e.clientX;pointer.lastY=e.clientY;});
canvas.addEventListener('pointerup',e=>{if(!pointer||e.pointerId!==pointer.id)return;const p=pointer;pointer=null;canvas.releasePointerCapture(e.pointerId);if(!p.drag&&!p.wakeOnly)clickScene(e);});
canvas.addEventListener('pointercancel',()=>{pointer=null;});
function clickScene(e){if(photoMode){const action=photoView.hit(e.clientX,e.clientY);if(action==='sofa')sit();else if(action==='records')navigate('records',()=>openDialog('records'));else if(action==='window')navigate('window');activity();return;}if(scenicMode){activity();return;}mouse.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);raycaster.setFromCamera(mouse,camera);const hit=raycaster.intersectObjects(interactionObjects,false)[0];if(hit&&hit.distance<5){const data=hit.object.userData;if(data.kind==='sofa'){sit();return;}if(data.kind==='records'||data.kind==='sleeve'){navigate('records',()=>openDialog('records'));return;}}if(seated)return;const p=new THREE.Vector3();if(raycaster.ray.intersectPlane(floorPlane,p)&&walkable(p.x,p.z)){const points=pathTo(p);if(points)navigation={points,name:'walk',look:null};}}
window.addEventListener('keydown',e=>{if(!entered||anyDialog()||transitioning)return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(e.key)){e.preventDefault();if(photoMode){const steps={arrowup:[0,-35],arrowdown:[0,35],arrowleft:[-35,0],arrowright:[35,0]};const step=steps[e.key.toLowerCase()];if(step)photoView.drag(...step,{invertX:false,invertY:false});else toast('寫實視景請使用下方按鈕切換位置。');activity();return;}if(scenicMode){activity();toast('固定視角模式請使用下方按鈕切換位置。');return;}if(seated){toast('點「起身走走」後就能移動。');return;}navigation=null;keys.add(e.key.toLowerCase());activity();}});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();pointer=null;});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(photoMode)photoView.resize();});

function loop(){requestAnimationFrame(loop);const now=performance.now();if(now-lastLightTick>100){lastLightTick=now;tickLight(now);}const dt=Math.min(clock.getDelta(),.05);elapsed+=dt;
 if(entered&&!anyDialog()&&!transitioning){
  if(navigation){const next=navigation.points[0];if(!next){const nav=navigation;navigation=null;if(nav.look)lookToward(nav.look);if(nav.name!=='walk')arrival(nav.name);nav.done?.();}else{const delta=next.clone().sub(camera.position);delta.y=0;const dist=delta.length(),step=dt*1.25;if(dist<step+.02){camera.position.x=next.x;camera.position.z=next.z;navigation.points.shift();}else{delta.normalize().multiplyScalar(step);const nx=camera.position.x+delta.x,nz=camera.position.z+delta.z;if(walkable(nx,nz)){camera.position.x=nx;camera.position.z=nz;}else navigation=null;}}}
  if(!seated&&keys.size){const forward=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0);const side=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);const amount=Math.hypot(forward,side)||1;const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*dt*.95/amount;const dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*dt*.95/amount;if(walkable(camera.position.x+dx,camera.position.z))camera.position.x+=dx;if(walkable(camera.position.x,camera.position.z+dz))camera.position.z+=dz;}
 }
 camera.rotation.set(pitch,yaw,0,'YXZ');
 if(activeTrack>=0&&!audio.paused){vinyl.rotation.y-=dt*3.49;tonearm.rotation.y=THREE.MathUtils.lerp(tonearm.rotation.y,.15,.05);}else tonearm.rotation.y=THREE.MathUtils.lerp(tonearm.rotation.y,-.3,.05);
 oceanMaterial.uniforms.uTime.value=elapsed;
 if(photoMode&&entered&&!document.hidden)photoView.update(elapsed);
 if(!reduced){for(const c of curtains){const pos=c.mesh.geometry.attributes.position;for(let i=0;i<pos.count;i++){const y=c.base[i*3+1];pos.array[i*3+2]=c.base[i*3+2]+Math.sin(elapsed*.65+y*2+i*.03)*.012*(1-(y+1.19)/2.38);}pos.needsUpdate=true;}}
 if(seaGain&&audioContext?.state==='running'){const swell=.62+.22*Math.sin(elapsed*.46)+.12*Math.sin(elapsed*.19);const target=muted||leavingRoom?0:seaVolume*.48*swell;seaGain.gain.setTargetAtTime(target,audioContext.currentTime,.25);}
 if(seated&&!anyDialog()&&performance.now()-lastActivity>5500){document.body.classList.add('hud-hidden');$('wake').hidden=false;}
 renderer.render(scene,camera);
}
loop();

// Small, read-only QA hooks for verifying navigation and player state.
window.cabinQA={getState:()=>({lighting:{...lightFrame,state:lightFrame.state},entered,seated,scenicMode,activeTrack,playing:!audio.paused,position:camera.position.toArray(),navigation:!!navigation,tracks:tracks.map(t=>({name:t.name,loaded:!!t.url})),reduced,walkable:walkable(camera.position.x,camera.position.z)}),pathTo:name=>{const d=destinations[name];return d?pathTo(d.pos)?.map(p=>p.toArray()):null;}};

// A room belongs to the shared world; leaving fades both music and ambience.
$('return-map').addEventListener('click',e=>{
 if(e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
 e.preventDefault();if(leavingRoom)return;leavingRoom=true;closeDialogs();if(worldHost()){audioContext?.suspend();worldHost().showMap();return;}
 const start=performance.now(),volume=audio.volume,duration=reduced?0:650;
 const leave=now=>{const t=duration?Math.min(1,(now-start)/duration):1;audio.volume=volume*(1-t);if(t<1)requestAnimationFrame(leave);else{audio.pause();audioContext?.suspend();location.assign($('return-map').href);}};requestAnimationFrame(leave);
});
window.addEventListener('pageshow',e=>{if(e.persisted){leavingRoom=false;setVolumes();updatePlayer();if(entered)initSea();activity();}});

import {unifySoundPanel} from './sound-panel.js?v=0.045';
unifySoundPanel();

window.addEventListener('p143-room-hide',()=>{leavingRoom=true;closeDialogs();audioContext?.suspend();});
window.addEventListener('p143-room-resume',()=>{leavingRoom=false;setVolumes();updatePlayer();if(entered)initSea();activity();});

$('enter').addEventListener('click',()=>worldHost()?.entered(window),{capture:true});
