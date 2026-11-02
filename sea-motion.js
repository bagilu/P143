const NS='http://www.w3.org/2000/svg';
let motionId=0;
export function seaRegionBounds(points){if(!points?.length)return null;const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);return {x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};}
const clamp=v=>Math.max(0,Math.min(1,v));
// Continuous depth field: the horizon stays still, nearer waves travel towards shore.
// The slow 38 s component suggests surging water; it is not an actual tidal model.
export function seaMotionFrame(seconds,depth=0,strength=.7){
 const d=clamp(depth),gain=clamp(strength),edge=Math.sin(Math.PI*d/2);
 const swell=Math.sin(seconds*Math.PI*2/9-d*5.5);
 const ripple=Math.sin(seconds*1.4-d*18);
 const tide=Math.sin(seconds*Math.PI*2/38);
 return {dx:gain*edge*(2.4*Math.sin(seconds*.48-d*4)+.8*ripple),dy:gain*edge*(4.3*swell+2.3*tide+.6*ripple)};
}
const el=(tag,attrs={})=>{const node=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);return node;};

// Fine strips share one decoded photograph; the water-only mask excludes room and rocks.
export class SeaMotion {
 constructor(svg){
  const id=++motionId,clipId=`photo-sea-clip-${id}`,fadeId=`photo-sea-fade-${id}`,maskId=`photo-sea-soft-${id}`;
  this.svg=svg;this.enabled=false;this.strength=.7;this.lastTime=-Infinity;this.rows=[];
  this.defs=el('defs');const clip=el('clipPath',{id:clipId,clipPathUnits:'userSpaceOnUse'});this.polygon=el('polygon');clip.append(this.polygon);this.defs.append(clip);
  this.fade=el('linearGradient',{id:fadeId,x1:0,y1:0,x2:0,y2:1,gradientUnits:'objectBoundingBox'});
  for(const [offset,opacity] of [[0,0],[.08,1],[.76,1],[1,0]])this.fade.append(el('stop',{offset,'stop-color':'white','stop-opacity':opacity}));
  this.mask=el('mask',{id:maskId,maskUnits:'userSpaceOnUse'});this.maskRect=el('rect',{fill:`url(#${fadeId})`});this.mask.append(this.maskRect);this.defs.append(this.fade,this.mask);svg.append(this.defs);
  this.layer=el('g',{'clip-path':`url(#${clipId})`,mask:`url(#${maskId})`,'pointer-events':'none'});svg.append(this.layer);this.refresh();
 }
 setScene(scene){
  this.bounds=seaRegionBounds(scene.seaMask);this.layer.replaceChildren();this.rows=[];
  if(this.bounds){
   this.polygon.setAttribute('points',scene.seaMask.map(p=>p.join(',')).join(' '));const b=this.bounds;
   for(const [key,value] of Object.entries(b)){this.maskRect.setAttribute(key,value);this.mask.setAttribute(key,value);}
   // About two image pixels per strip keeps the displacement field smooth.
   const count=Math.ceil(b.height/1.5);
   for(let i=0;i<count;i++){
    const top=b.y+b.height*i/count,height=b.height/count+.12;
    const strip=el('svg',{x:b.x,y:top,width:b.width,height,viewBox:`${b.x} ${top} ${b.width} ${height}`,overflow:'hidden'});
    const image=el('image',{href:scene.src,width:scene.width,height:scene.height,preserveAspectRatio:'none'});strip.append(image);this.layer.append(strip);this.rows.push({image,depth:(i+.5)/count});
   }
  }
  this.lastTime=-Infinity;this.refresh();
 }
 setEnabled(enabled){this.enabled=enabled;this.lastTime=-Infinity;this.refresh();}
 setStrength(value){this.strength=clamp(value);this.lastTime=-Infinity;this.refresh();}
 refresh(){const running=!!(this.enabled&&this.bounds&&this.strength>0);this.layer.style.display=running?'':'none';this.svg.setAttribute('data-sea-motion',running?'running':'paused');}
 update(seconds){if(!this.enabled||!this.bounds||!this.strength||seconds-this.lastTime<1/24)return;this.lastTime=seconds;this.rows.forEach(({image,depth})=>{const f=seaMotionFrame(seconds,depth,this.strength);image.setAttribute('transform',`translate(${f.dx.toFixed(3)} ${f.dy.toFixed(3)})`);});}
}
