import {NightSky} from './night-sky.js?v=0.022';
import {GrassMotion} from './grass-motion.js?v=0.014';

export const TEMPLE_SCENE={width:1774,height:887,plates:['assets/temple-day.png','assets/temple-morning.png','assets/temple-night.png'],foliage:[
 [[639,404],[677,372],[727,375],[764,407],[735,437],[678,428]],
 [[798,293],[843,285],[892,300],[915,335],[865,347],[814,328]],
 [[971,400],[1008,367],[1061,370],[1060,420],[1025,446],[981,434]],
 [[901,587],[936,565],[977,577],[994,609],[957,629],[908,618]]
]};
export const initialTempleGaze=(width,height)=>({x:width<height?.46:.06,y:.94});
export function templeViewport(width,height,gaze,scene=TEMPLE_SCENE){
 const aspect=width/height,zoom=1.08;
 let w,h;if(scene.width/scene.height>aspect){h=scene.height/zoom;w=h*aspect;}else{w=scene.width/zoom;h=w/aspect;}
 return {x:(scene.width-w)*Math.max(0,Math.min(1,gaze.x)),y:(scene.height-h)*Math.max(0,Math.min(1,gaze.y)),width:w,height:h};
}
const NS='http://www.w3.org/2000/svg';
export class TempleView{
 constructor(svg){this.svg=svg;this.gaze=initialTempleGaze(innerWidth,innerHeight);this.layers=[];this.motion=true;
  for(const src of TEMPLE_SCENE.plates){const group=document.createElementNS(NS,'g'),image=document.createElementNS(NS,'image');image.setAttribute('href',src);image.setAttribute('width',TEMPLE_SCENE.width);image.setAttribute('height',TEMPLE_SCENE.height);image.setAttribute('preserveAspectRatio','none');group.append(image);svg.append(group);const leaves=new GrassMotion(group);leaves.setScene({...TEMPLE_SCENE,src,grassMasks:TEMPLE_SCENE.foliage});leaves.setEnabled(true);this.layers.push({group,leaves});}
  this.tint=document.createElementNS(NS,'rect');for(const[k,v]of Object.entries({width:TEMPLE_SCENE.width,height:TEMPLE_SCENE.height,'pointer-events':'none'}))this.tint.setAttribute(k,v);svg.append(this.tint);this.nightSky=new NightSky(svg,'temple');this.resize();
 }
 async load(){const loaded=await Promise.all(TEMPLE_SCENE.plates.map(src=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(true);img.onerror=()=>resolve(false);img.src=src;})));return loaded.every(Boolean);}
 setLight(frame){const state=frame.state,[day,gold,night]=state.weights,alphas=[1,day+gold?gold/(day+gold):0,night];this.weights=state.weights;this.nightSky.setLight(state);
  this.layers.forEach((l,i)=>l.group.setAttribute('opacity',alphas[i].toFixed(6)));this.svg.style.filter=`brightness(${state.brightness}) saturate(${state.saturation})`;this.tint.setAttribute('fill',`rgb(${state.tint.map(Math.round).join(',')})`);this.tint.setAttribute('opacity',state.tintAlpha);this.svg.dataset.lightTime=String(frame.minute);this.svg.dataset.lightWeights=state.weights.map(w=>w.toFixed(6)).join(',');
 }
 resize(){const c=templeViewport(innerWidth,innerHeight,this.gaze);this.svg.setAttribute('viewBox',`${c.x} ${c.y} ${c.width} ${c.height}`);this.svg.dataset.gaze=`${this.gaze.x.toFixed(4)},${this.gaze.y.toFixed(4)}`;}
 drag(dx,dy,settings){this.gaze.x=Math.max(0,Math.min(1,this.gaze.x+dx/(Math.max(480,innerWidth))*(settings.invertX?-1:1)));this.gaze.y=Math.max(0,Math.min(1,this.gaze.y+dy/Math.max(350,innerHeight)*(settings.invertY?-1:1)));this.resize();}
 reset(){this.gaze=initialTempleGaze(innerWidth,innerHeight);this.resize();}
 setMotion(on){this.motion=on;this.layers.forEach(l=>l.leaves.setEnabled(on));this.svg.dataset.foliageMotion=on?'running':'paused';}
 update(seconds){if(this.motion)this.layers.forEach((l,i)=>{if((this.weights?.[i]||0)>.00001)l.leaves.update(seconds);});}
}
