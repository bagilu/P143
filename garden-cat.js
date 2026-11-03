import {quietCatAt,gardenCatPlacement,catLighting} from './garden-cat-motion.js?v=0.029';
const NS='http://www.w3.org/2000/svg',KEY='p143-garden-cat-v1',body=document.body;
let enabled=true;try{enabled=JSON.parse(localStorage.getItem(KEY))?.enabled!==false;}catch{}
const section=document.createElement('section');section.className='companion-settings';section.innerHTML='<h3>庭園裡的黑貓</h3><label class="check"><input id="garden-cat-trial" type="checkbox" checked>黑貓原地小動作（試作）</label><p class="subtle">牠會留在原地，輕輕呼吸，偶爾眨眼、抬頭看庭院或望向我們。取消勾選可回到原照片黑貓；「減少動態」會讓牠安靜停留。</p>';document.getElementById('help').append(section);const toggle=document.getElementById('garden-cat-trial');toggle.checked=enabled;
let svg,host,root,shadow,canvas,ctx,parts,loading=false,elapsed=0,last=null,paintAt=-Infinity,demo=null,failed=false;
function surface(){const c=document.createElement('canvas');c.width=888;c.height=444;return c;}
async function load(){if(parts||loading||failed||!enabled||!body.classList.contains('entered')||body.dataset.companion!=='on')return;loading=true;
 try{
  const image=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src='assets/garden-cat-poses-v0029.png';});
  svg=document.getElementById('garden-view');if(!svg)throw Error('garden scene');
  // Feather only the head/neck. Torso, paws and tail remain the same pixels in every pose.
  const mask=surface(),mc=mask.getContext('2d'),cw=image.naturalWidth/2,ch=image.naturalHeight/2;
  const x=mc.createLinearGradient(300,0,470,0);x.addColorStop(0,'white');x.addColorStop(1,'transparent');mc.fillStyle=x;mc.fillRect(0,0,888,444);
  mc.globalCompositeOperation='destination-in';const y=mc.createLinearGradient(0,290,0,414);y.addColorStop(0,'white');y.addColorStop(1,'transparent');mc.fillStyle=y;mc.fillRect(0,0,888,444);
  const heads=[0,1,2,3].map(index=>{const c=surface(),cctx=c.getContext('2d');cctx.drawImage(image,index%2*cw,Math.floor(index/2)*ch,cw,ch,0,0,888,444);cctx.globalCompositeOperation='destination-in';cctx.drawImage(mask,0,0);return c;});
  const torso=surface(),tc=torso.getContext('2d');tc.drawImage(image,0,0,cw,ch,0,0,888,444);tc.globalCompositeOperation='destination-out';tc.drawImage(mask,0,0);parts={torso,heads};
  root=document.createElementNS(NS,'g');root.classList.add('garden-cat');root.setAttribute('pointer-events','none');root.setAttribute('aria-hidden','true');
  const defs=document.createElementNS(NS,'defs'),gradient=document.createElementNS(NS,'radialGradient');gradient.id='garden-cat-contact';
  for(const[offset,opacity]of[[0,.6],[.55,.25],[1,0]]){const stop=document.createElementNS(NS,'stop');stop.setAttribute('offset',offset);stop.setAttribute('stop-color','#171611');stop.setAttribute('stop-opacity',opacity);gradient.append(stop);}defs.append(gradient);root.append(defs);
  shadow=document.createElementNS(NS,'ellipse');shadow.setAttribute('fill','url(#garden-cat-contact)');root.append(shadow);
  host=document.createElementNS(NS,'foreignObject');canvas=surface();canvas.setAttribute('aria-hidden','true');canvas.style.cssText='display:block;width:100%;height:100%;pointer-events:none';ctx=canvas.getContext('2d');host.append(canvas);root.append(host);svg.append(root);layout();body.dataset.gardenCat='active';
 }catch{parts=null;failed=true;body.dataset.gardenCat='off';root?.remove();}finally{loading=false;}
}
function layout(){if(!host)return;const p=gardenCatPlacement(innerWidth<600);for(const k of ['x','y','width','height'])host.setAttribute(k,p[k]);for(const[k,v]of Object.entries({cx:p.center,cy:p.feet-1,rx:p.width*.48,ry:4.2}))shadow.setAttribute(k,v);}
function paint(pose,light){ctx.clearRect(0,0,888,444);ctx.save();ctx.translate(0,444*.95);ctx.scale(1,pose.breath);ctx.translate(0,-444*.95);ctx.globalCompositeOperation='lighter';ctx.drawImage(parts.torso,0,0);pose.weights.forEach((weight,i)=>{if(weight<.00001)return;ctx.globalAlpha=weight;ctx.drawImage(parts.heads[i],0,0);});ctx.restore();
 if(light.warmth>.001){ctx.save();ctx.globalCompositeOperation='source-atop';ctx.fillStyle=`rgba(232,178,107,${light.warmth})`;ctx.fillRect(0,0,888,444);ctx.restore();}canvas.style.filter=`brightness(${light.brightness}) saturate(.9)`;
}
function loop(now){requestAnimationFrame(loop);const active=enabled&&body.classList.contains('entered')&&body.dataset.companion==='on'&&!document.hidden;if(!active){last=null;return;}if(!parts){load();last=null;return;}if(last!==null)elapsed+=Math.min(.15,Math.max(0,(now-last)/1000));last=now;if(now-paintAt<1000/24)return;paintAt=now;
 const reduced=document.getElementById('reduce-motion')?.checked??matchMedia('(prefers-reduced-motion: reduce)').matches,pose=demo&&!reduced?demo:quietCatAt(elapsed,reduced),light=catLighting((svg.dataset.lightWeights||'1,0,0').split(',').map(Number));paint(pose,light);root.dataset.action=pose.action;root.dataset.motion=reduced?'paused':'running';root.dataset.amount=pose.amount.toFixed(4);layout();
}
 toggle.addEventListener('change',()=>{enabled=toggle.checked;try{localStorage.setItem(KEY,JSON.stringify({enabled}));}catch{}body.dataset.gardenCat=enabled&&parts?'active':'off';if(enabled){failed=false;load();}});
new MutationObserver(()=>load()).observe(body,{attributes:true,attributeFilter:['class','data-companion']});window.addEventListener('resize',layout);window.addEventListener('pagehide',()=>{last=null;});
// The isolated preview fixture uses this public export; no extra buttons in the site.
export function previewCatPose(seconds){demo=seconds===null?null:quietCatAt(seconds);}
requestAnimationFrame(loop);
