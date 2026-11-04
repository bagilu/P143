// Two photographic viewpoints share the existing audio and clock controllers.
export function addBalconyPositions(view,{ready,reduced,onMove}){
 const stage=document.getElementById('balcony-stage'),svg=view.svg;
 const room=document.createElementNS('http://www.w3.org/2000/svg','svg');room.id='living-view';room.setAttribute('aria-hidden','true');room.setAttribute('hidden','');
 const plates=['assets/balcony-living-day-v0037.jpg','assets/balcony-living-dusk-v0036.jpg','assets/balcony-living-night-v0037.jpg'];
 const layers=plates.map(src=>{const image=document.createElementNS(room.namespaceURI,'image');image.setAttribute('href',src);image.setAttribute('width',2048);image.setAttribute('height',768);room.append(image);return image;});stage.after(room);
 const originalLight=view.setLight.bind(view);
 function paintLight(state){const [day,warm,night]=state.weights;const alpha=[1,day+warm?warm/(day+warm):0,night];layers.forEach((image,i)=>image.setAttribute('opacity',alpha[i].toFixed(6)));room.dataset.lightWeights=state.weights.join(',');}
 view.setLight=frame=>{originalLight(frame);paintLight(frame.state);};
 paintLight({weights:view.weights||[0,1,0]});
 const button=document.createElement('button');button.id='position-move';button.className='hud position-move';button.textContent='↗ 走進客廳';button.disabled=true;document.body.append(button);
 const note=document.createElement('p');note.className='hud position-note';note.textContent='客廳座位 · 與陽台同步光景';note.hidden=true;document.body.append(note);
 let inside=false,busy=false,gaze={x:.5,y:.6};const saved={};
 const original={drag:view.drag.bind(view),resize:view.resize.bind(view),reset:view.reset.bind(view)};
 function paint(){const aspect=innerWidth/innerHeight;let h=768/1.12,w=h*aspect;if(w>2048/1.12){w=2048/1.12;h=w/aspect;}room.setAttribute('viewBox',`${(2048-w)*gaze.x} ${(768-h)*gaze.y} ${w} ${h}`);}
 view.drag=(dx,dy,settings)=>{if(!inside)return original.drag(dx,dy,settings);gaze.x=Math.max(0,Math.min(1,gaze.x+dx/Math.max(480,innerWidth)*(settings.invertX?-1:1)));gaze.y=Math.max(0,Math.min(1,gaze.y+dy/Math.max(350,innerHeight)*(settings.invertY?-1:1)));paint();};
 view.resize=()=>{original.resize();paint();};view.reset=()=>{if(inside){gaze={x:.5,y:.6};paint();}else original.reset();};
 let loaded=false;
 async function loadPlates(){button.disabled=true;loaded=(await Promise.all(plates.map(src=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(true);image.onerror=()=>resolve(false);image.src=src;})))).every(Boolean);button.disabled=false;button.textContent=loaded?'↗ 走進客廳':'客廳圖片未能載入 · 點此重試';}
 loadPlates();
 button.addEventListener('click',async()=>{if(!ready()||busy)return;if(!loaded){await loadPlates();return;}busy=true;button.disabled=true;document.body.classList.add('position-changing');if(!reduced())await new Promise(r=>setTimeout(r,180));inside=!inside;
 if(inside)saved.balcony={...view.gaze};else if(saved.balcony)view.gaze={...saved.balcony};
 svg.style.visibility=inside?'hidden':'';room.toggleAttribute('hidden',!inside);note.hidden=!inside;document.body.dataset.balconyPosition=inside?'living':'balcony';button.textContent=inside?'↙ 回到陽台':'↗ 走進客廳';view.resize();onMove(inside);document.body.classList.remove('position-changing');busy=false;button.disabled=false;
 });paint();
}
