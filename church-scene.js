import {GrassMotion} from './grass-motion.js?v=0.014';
export const CHURCH_SCENE={width:1774,height:887,plates:['assets/church-day-v0045.jpg','assets/church-dusk-v0045.jpg','assets/church-night-v0045.jpg'],foliage:[
 [[1180,212],[1205,162],[1280,144],[1345,170],[1350,255],[1270,292],[1200,266]],
 [[1435,170],[1490,156],[1575,195],[1595,260],[1528,290],[1450,250]],
 [[1515,310],[1555,282],[1652,300],[1668,358],[1610,396],[1534,367]]
]};
export const initialChurchGaze=(width,height)=>({x:width<height?.60:.50,y:.52});
export function churchViewport(width,height,gaze,scene=CHURCH_SCENE){
 const aspect=width/height,zoom=1.045;let w,h;
 if(scene.width/scene.height>aspect){h=scene.height/zoom;w=h*aspect;}else{w=scene.width/zoom;h=w/aspect;}
 return {x:(scene.width-w)*Math.max(0,Math.min(1,gaze.x)),y:(scene.height-h)*Math.max(0,Math.min(1,gaze.y)),width:w,height:h};
}
const NS='http://www.w3.org/2000/svg';
const make=(tag,attrs={})=>{const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;};
export function candleFrame(seconds){return{opacity:.40+.09*Math.sin(seconds*2.1)+.04*Math.sin(seconds*5.3),sway:.35*Math.sin(seconds*2.4),scaleY:1+.07*Math.sin(seconds*3.2)};}
export class ChurchView{
 constructor(svg){this.svg=svg;this.gaze=initialChurchGaze(innerWidth,innerHeight);this.layers=[];this.motion=true;
  for(const src of CHURCH_SCENE.plates){const group=make('g'),image=make('image',{href:src,width:1774,height:887,preserveAspectRatio:'none'});group.append(image);svg.append(group);const leaves=new GrassMotion(group);leaves.setScene({...CHURCH_SCENE,src,grassMasks:CHURCH_SCENE.foliage});leaves.setEnabled(true);this.layers.push({group,leaves});}
  this.tint=make('rect',{width:1774,height:887,'pointer-events':'none'});svg.append(this.tint);
  this.flame=make('g',{'data-effect':'candle-flame','pointer-events':'none'});
  this.flame.append(make('ellipse',{cx:820,cy:465,rx:7,ry:14,fill:'#ffd38b',opacity:.18}),make('path',{d:'M 817 472 Q 814 464 821 454 Q 825 465 823 472 Z',fill:'#fff1bc',opacity:.75}));svg.append(this.flame);this.resize();
 }
 async load(){const loaded=await Promise.all(CHURCH_SCENE.plates.map(src=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(true);img.onerror=()=>resolve(false);img.src=src;})));return loaded.every(Boolean);}
 setLight(frame){const state=frame.state,[day,warm,night]=state.weights,alpha=[1,day+warm?warm/(day+warm):0,night];this.weights=state.weights;this.layers.forEach((l,i)=>l.group.setAttribute('opacity',alpha[i].toFixed(6)));this.svg.style.filter=`brightness(${state.brightness}) saturate(${state.saturation})`;this.tint.setAttribute('fill',`rgb(${state.tint.map(Math.round).join(',')})`);this.tint.setAttribute('opacity',state.tintAlpha);this.svg.dataset.lightTime=String(frame.minute);this.svg.dataset.lightWeights=state.weights.map(w=>w.toFixed(6)).join(',');}
 resize(){const c=churchViewport(innerWidth,innerHeight,this.gaze);this.svg.setAttribute('viewBox',`${c.x} ${c.y} ${c.width} ${c.height}`);this.svg.dataset.gaze=`${this.gaze.x.toFixed(4)},${this.gaze.y.toFixed(4)}`;}
 drag(dx,dy,settings){this.gaze.x=Math.max(0,Math.min(1,this.gaze.x+dx/Math.max(480,innerWidth)*(settings.invertX?-1:1)));this.gaze.y=Math.max(0,Math.min(1,this.gaze.y+dy/Math.max(350,innerHeight)*(settings.invertY?-1:1)));this.resize();}
 reset(){this.gaze=initialChurchGaze(innerWidth,innerHeight);this.resize();}
 setMotion(on){this.motion=on;this.flame.style.display=on?'':'none';for(const l of this.layers)l.leaves.setEnabled(on);this.svg.dataset.foliageMotion=on?'running':'paused';}
 update(seconds){if(!this.motion)return;this.layers.forEach((l,i)=>{if((this.weights?.[i]||0)>.00001)l.leaves.update(seconds*.45);});const f=candleFrame(seconds);this.flame.setAttribute('opacity',f.opacity.toFixed(4));this.flame.setAttribute('transform',`translate(${f.sway.toFixed(4)} ${(472*(1-f.scaleY)).toFixed(4)}) scale(1 ${f.scaleY.toFixed(4)})`);}
}
