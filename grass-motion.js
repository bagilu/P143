const NS='http://www.w3.org/2000/svg';let nextId=0;
const el=(tag,attrs={})=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n;};
export function grassSwayFrame(seconds,phase=0){return 1.8*Math.sin(seconds*.85+phase)+.6*Math.sin(seconds*.31+phase*.7);}
export function grassPatchBounds(points){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);return {x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};}
// Each photographic clump bends around its fixed ground line. Only masked outdoor
// vegetation is redrawn; the interior, rocks, sky and water remain in their layers.
export class GrassMotion{
 constructor(group){this.group=group;this.enabled=false;this.patches=[];this.lastTime=-Infinity;this.defs=el('defs');this.layer=el('g',{'pointer-events':'none','data-grass-layer':''});group.append(this.defs,this.layer);}
 setScene(scene){this.defs.replaceChildren();this.layer.replaceChildren();this.patches=[];
  for(const points of scene.grassMasks||[]){const b=grassPatchBounds(points);if(!b.height||!b.width)continue;
   const id=++nextId,clipId=`grass-clip-${id}`,fadeId=`grass-fade-${id}`,maskId=`grass-mask-${id}`;
   const clip=el('clipPath',{id:clipId,clipPathUnits:'userSpaceOnUse'});clip.append(el('polygon',{points:points.map(p=>p.join(',')).join(' ')}));
   const fade=el('linearGradient',{id:fadeId,x1:0,y1:0,x2:0,y2:1,gradientUnits:'objectBoundingBox'});
   for(const [offset,opacity] of [[0,0],[.14,1],[.65,1],[1,0]])fade.append(el('stop',{offset,'stop-color':'white','stop-opacity':opacity}));
   const mask=el('mask',{id:maskId,maskUnits:'userSpaceOnUse',...b});mask.append(el('rect',{...b,fill:`url(#${fadeId})`}));this.defs.append(clip,fade,mask);
   const patch=el('g',{'clip-path':`url(#${clipId})`,mask:`url(#${maskId})`});const image=el('image',{href:scene.src,width:scene.width,height:scene.height,preserveAspectRatio:'none'});patch.append(image);this.layer.append(patch);this.patches.push({image,...b,root:b.y+b.height,phase:(b.x+b.y)*.013});
  }
  this.lastTime=-Infinity;this.refresh();
 }
 setEnabled(enabled){this.enabled=enabled;this.lastTime=-Infinity;this.refresh();}
 refresh(){const running=this.enabled&&this.patches.length>0;this.layer.style.display=running?'':'none';this.group.setAttribute('data-grass-motion',running?'running':'paused');}
 update(seconds){if(!this.enabled||seconds-this.lastTime<1/24)return;this.lastTime=seconds;for(const p of this.patches){const shear=-grassSwayFrame(seconds,p.phase)/p.height;p.image.setAttribute('transform',`matrix(1 0 ${shear.toFixed(7)} 1 ${(-shear*p.root).toFixed(5)} 0)`);}}
}
