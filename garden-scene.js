import {GrassMotion} from './grass-motion.js?v=0.014';

export const GARDEN_SCENE={width:1672,height:941,plates:['assets/garden-day.png','assets/garden-warm.png','assets/garden-night.png'],foliage:[
 [[610,210],[670,184],[740,202],[776,242],[708,262],[638,248]],
 [[792,350],[850,322],[944,330],[998,369],[946,403],[841,391]],
 [[1230,211],[1285,181],[1358,211],[1375,284],[1325,315],[1244,281]]
]};
export const initialGardenGaze=(width,height)=>({x:width<height?.50:.34,y:.70});
export function gardenViewport(width,height,gaze,scene=GARDEN_SCENE){
 const aspect=width/height,zoom=1.08;
 let w,h;if(scene.width/scene.height>aspect){h=scene.height/zoom;w=h*aspect;}else{w=scene.width/zoom;h=w/aspect;}
 return {x:(scene.width-w)*Math.max(0,Math.min(1,gaze.x)),y:(scene.height-h)*Math.max(0,Math.min(1,gaze.y)),width:w,height:h};
}
const NS='http://www.w3.org/2000/svg';
export class GardenView{
 constructor(svg){this.svg=svg;this.gaze=initialGardenGaze(innerWidth,innerHeight);this.layers=[];this.motion=true;
  for(const src of GARDEN_SCENE.plates){const group=document.createElementNS(NS,'g'),image=document.createElementNS(NS,'image');image.setAttribute('href',src);image.setAttribute('width',GARDEN_SCENE.width);image.setAttribute('height',GARDEN_SCENE.height);image.setAttribute('preserveAspectRatio','none');group.append(image);svg.append(group);const leaves=new GrassMotion(group);leaves.setScene({...GARDEN_SCENE,src,grassMasks:GARDEN_SCENE.foliage});leaves.setEnabled(true);this.layers.push({group,leaves});}
  this.tint=document.createElementNS(NS,'rect');for(const[k,v]of Object.entries({width:GARDEN_SCENE.width,height:GARDEN_SCENE.height,'pointer-events':'none'}))this.tint.setAttribute(k,v);svg.append(this.tint);this.createSteam();this.paintSteam(0);this.resize();
 }
 async load(){const loaded=await Promise.all(GARDEN_SCENE.plates.map(src=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(true);img.onerror=()=>resolve(false);img.src=src;})));return loaded.every(Boolean);}
 setLight(frame){const state=frame.state,[day,gold,night]=state.weights,alphas=[1,day+gold?gold/(day+gold):0,night];this.weights=state.weights;
  this.layers.forEach((l,i)=>l.group.setAttribute('opacity',alphas[i].toFixed(6)));this.svg.style.filter=`brightness(${state.brightness}) saturate(${state.saturation})`;this.tint.setAttribute('fill',`rgb(${state.tint.map(Math.round).join(',')})`);this.tint.setAttribute('opacity',state.tintAlpha);this.svg.dataset.lightTime=String(frame.minute);this.svg.dataset.lightWeights=state.weights.map(w=>w.toFixed(6)).join(',');
 }
 resize(){const c=gardenViewport(innerWidth,innerHeight,this.gaze);this.svg.setAttribute('viewBox',`${c.x} ${c.y} ${c.width} ${c.height}`);this.svg.dataset.gaze=`${this.gaze.x.toFixed(4)},${this.gaze.y.toFixed(4)}`;}
 drag(dx,dy,settings){this.gaze.x=Math.max(0,Math.min(1,this.gaze.x+dx/(Math.max(480,innerWidth))*(settings.invertX?-1:1)));this.gaze.y=Math.max(0,Math.min(1,this.gaze.y+dy/Math.max(350,innerHeight)*(settings.invertY?-1:1)));this.resize();}
 reset(){this.gaze=initialGardenGaze(innerWidth,innerHeight);this.resize();}
 setMotion(on){this.motion=on;this.steam.style.display=on?'':'none';this.layers.forEach(l=>l.leaves.setEnabled(on));this.svg.dataset.foliageMotion=on?'running':'paused';}
 update(seconds){if(!this.motion||seconds-(this.lastSteamTime??-Infinity)<1/24)return;this.lastSteamTime=seconds;this.layers.forEach((l,i)=>{if((this.weights?.[i]||0)>.00001)l.leaves.update(seconds*.65);});this.paintSteam(seconds);}
 createSteam(){const make=(tag,attrs={})=>{const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;},id=++steamId,defs=make('defs'),fade=make('linearGradient',{id:`garden-steam-${id}`,x1:0,y1:0,x2:0,y2:1});for(const[offset,opacity]of[[0,0],[.4,1],[.82,1],[1,0]])fade.append(make('stop',{offset,'stop-color':'white','stop-opacity':opacity}));const mask=make('mask',{id:`garden-steam-mask-${id}`,maskUnits:'userSpaceOnUse',x:635,y:683,width:88,height:124});mask.append(make('rect',{x:635,y:683,width:88,height:124,fill:`url(#garden-steam-${id})`}));const blur=make('filter',{id:`garden-steam-blur-${id}`,x:'-100%',y:'-20%',width:'300%',height:'140%'});blur.append(make('feGaussianBlur',{stdDeviation:2.1}));defs.append(fade,mask,blur);this.svg.append(defs);this.steam=make('g',{mask:`url(#garden-steam-mask-${id})`,'data-effect':'tea-steam','pointer-events':'none'});this.wisps=[];for(let i=0;i<3;i++){const p=make('path',{fill:'none',stroke:'#f1eee2','stroke-width':3.2+i*.8,'stroke-linecap':'round',filter:`url(#garden-steam-blur-${id})`});this.steam.append(p);this.wisps.push(p);}this.svg.append(this.steam);}
 paintSteam(seconds){this.wisps.forEach((p,i)=>{const f=teaSteamFrame(seconds,i/3);p.setAttribute('d',f.d);p.setAttribute('opacity',f.opacity.toFixed(4));});}
}
let steamId=0;
export function teaSteamFrame(seconds,phase=0){const life=((seconds/12+phase)%1+1)%1,t=seconds*.5+phase*6.28,x=676,y=806,rise=78+38*life;return {d:`M ${x+phase*6-2} ${y} C ${x-9+Math.sin(t)*5} ${y-24} ${x+13+Math.sin(t)*7} ${y-39} ${x+Math.sin(t)*9} ${y-54} S ${x-15+Math.sin(t+1)*11} ${y-rise+18} ${x+Math.sin(t+2)*15} ${y-rise}`,opacity:.30*Math.sin(Math.PI*life)**2};}
