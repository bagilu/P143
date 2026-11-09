import {applyDragLook} from './look-controls.js?v=0.013';
import {GrassMotion} from './grass-motion.js?v=0.014';
import {SeaMotion} from './sea-motion.js?v=0.014';
import {lightAtMinute,formatMinute} from './light-clock.js';

// A bounded photographic view, not a 360-degree reconstruction or walkable model.
export function photoViewport(imageWidth,imageHeight,width,height,zoom=1.08,yaw=0,pitch=0){
 const aspect=width/height;
 let w,h;
 if(imageWidth/imageHeight>aspect){h=imageHeight/zoom;w=h*aspect;}else{w=imageWidth/zoom;h=w/aspect;}
 const px=Math.max(0,Math.min(1,.5-yaw/1.3)),py=Math.max(0,Math.min(1,.5-pitch/.8));
 return {x:(imageWidth-w)*px,y:(imageHeight-h)*py,width:w,height:h};
}
export const SOFA_LOOK_TARGETS=Object.freeze({left:.65,sea:0,right:-.65});
const NS='http://www.w3.org/2000/svg';
export class PhotoView {
 constructor(svg,scenes,minute=960){
  this.svg=svg;this.scenes=scenes;this.yaw=0;this.pitch=0;this.token=0;this.lookTarget=null;this.enabled=false;this.grassEnabled=false;this.strength=.7;this.lightState=lightAtMinute(minute);this.minute=minute;this.layers=[];this.cache=new Map();
  svg.replaceChildren();
  for(const plate of ['day','gold','night']){const group=document.createElementNS(NS,'g'),image=document.createElementNS(NS,'image');group.append(image);svg.append(group);const motion=new SeaMotion(group),grass=new GrassMotion(group);this.layers.push({plate,group,image,motion,grass});}
  this.tint=document.createElementNS(NS,'rect');this.tint.setAttribute('pointer-events','none');svg.append(this.tint);
  this.view='entry';this.ready=this.setView('entry');this.ready.then(ok=>{if(ok&&this.scenes.sofa?.wideLook)this.preloadView('sofa');});
 }
 load(src){if(!this.cache.has(src))this.cache.set(src,new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(true);img.onerror=()=>{this.cache.delete(src);resolve(false);};img.src=src;}));return this.cache.get(src);}
 preloadView(name){const scene=this.scenes[name];if(!scene)return Promise.resolve(false);return Promise.all(['day','gold','night'].map(plate=>this.load(scene.plates?.[plate]||(plate==='gold'?scene.src:scene.src.replace('.png',`-${plate}.png`))))).then(results=>results.every(Boolean));}
 async renderScene(name){
  const token=++this.token,view=this.scenes[name]?name:'entry',scene=this.scenes[view];
  const sources=this.layers.map(({plate})=>scene.plates?.[plate]||(plate==='gold'?scene.src:scene.src.replace('.png',`-${plate}.png`)));
  if(!(await Promise.all(sources.map(src=>this.load(src)))).every(Boolean)||token!==this.token)return false;
  this.view=view;this.yaw=this.pitch=0;this.lookTarget=null;
  this.layers.forEach(({image,motion,grass},i)=>{image.setAttribute('preserveAspectRatio','none');image.setAttribute('href',sources[i]);image.setAttribute('width',scene.width);image.setAttribute('height',scene.height);motion.setScene({...scene,src:sources[i]});motion.setEnabled(this.enabled);motion.setStrength(this.strength);grass.setScene({...scene,src:sources[i]});grass.setEnabled(this.grassEnabled);});
  for(const [key,value] of Object.entries({x:0,y:0,width:scene.width,height:scene.height}))this.tint.setAttribute(key,value);
  this.svg.setAttribute('data-look-mode',scene.wideLook?'wide':'standard');this.setLightState(this.lightState,this.minute);this.resize();return true;
 }
 setView(name){this.ready=this.renderScene(name);return this.ready;}
 setLightState(state,minute){
  this.lightState=state;this.minute=minute;
  const [day,gold,night]=state.weights;
  const alphas=[1,day+gold>0?gold/(day+gold):0,night];
  this.layers.forEach(({group},i)=>group.setAttribute('opacity',alphas[i].toFixed(6)));
  this.svg.style.filter=`brightness(${state.brightness}) saturate(${state.saturation})`;
  this.tint.setAttribute('fill',`rgb(${state.tint.map(Math.round).join(',')})`);this.tint.setAttribute('opacity',state.tintAlpha);
  this.svg.setAttribute('data-light-time',formatMinute(minute));this.svg.setAttribute('data-light-weights',state.weights.map(w=>w.toFixed(6)).join(','));
  this.svg.setAttribute('aria-label',`寫實室內視景：${{entry:'入口',sofa:'沙發',records:'唱機前',window:'窗邊',underwater:'海底房間'}[this.view]} · ${formatMinute(minute)}`);
 }
 drag(dx,dy,settings){this.lookTarget=null;const look=applyDragLook(this.yaw,this.pitch,dx,dy,settings);this.yaw=Math.max(-.65,Math.min(.65,look.yaw));this.pitch=Math.max(-.4,Math.min(.4,look.pitch));this.resize();}
 lookAt(direction,animate=true){const yaw=SOFA_LOOK_TARGETS[direction];if(yaw===undefined||!this.scenes[this.view].wideLook)return;if(animate)this.lookTarget={fromYaw:this.yaw,fromPitch:this.pitch,toYaw:yaw,start:null};else{this.lookTarget=null;this.yaw=yaw;this.pitch=0;this.resize();}}
 setMotion(enabled){this.enabled=enabled;this.layers.forEach(l=>l.motion.setEnabled(enabled));this.svg.setAttribute('data-sea-motion',enabled&&this.strength>0?'running':'paused');}
 setGrassMotion(enabled){this.grassEnabled=enabled;this.layers.forEach(l=>l.grass.setEnabled(enabled));this.svg.setAttribute('data-grass-motion',enabled?'running':'paused');}
 setWaveStrength(strength){this.strength=strength;this.layers.forEach(l=>l.motion.setStrength(strength));this.svg.setAttribute('data-sea-motion',this.enabled&&strength>0?'running':'paused');}
 update(seconds){if(this.lookTarget){const target=this.lookTarget;target.start??=seconds;const t=Math.min(1,Math.max(0,(seconds-target.start)/.45)),ease=t*t*(3-2*t);this.yaw=target.fromYaw+(target.toYaw-target.fromYaw)*ease;this.pitch=target.fromPitch*(1-ease);this.resize();if(t===1)this.lookTarget=null;}this.layers.forEach((l,i)=>{if(this.lightState.weights[i]>.00001){l.motion.update(seconds);l.grass.update(seconds);}});}
 resize(){const s=this.scenes[this.view];this.crop=photoViewport(s.width,s.height,innerWidth,innerHeight,s.zoom,this.yaw,this.pitch);const c=this.crop;this.svg.setAttribute('viewBox',`${c.x} ${c.y} ${c.width} ${c.height}`);this.svg.setAttribute('data-look-yaw',this.yaw.toFixed(4));}
 hit(clientX,clientY){const c=this.crop;const x=c.x+clientX/innerWidth*c.width,y=c.y+clientY/innerHeight*c.height;return this.scenes[this.view].hotspots?.find(h=>x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h)?.action;}
}
