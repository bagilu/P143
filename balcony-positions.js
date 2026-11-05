import {POSITION_ORDER,EDGE_THRESHOLD,edgeStep} from './balcony-edge.js?v=0.040';
// Adjacent photographic positions share one clock and audio controller.
export function addBalconyPositions(view,{ready,reduced,onMove}){
 const NS='http://www.w3.org/2000/svg',stage=document.getElementById('balcony-stage');
 const positions={living:{name:'客廳座位',plates:['assets/balcony-living-day-v0037.jpg','assets/balcony-living-dusk-v0036.jpg','assets/balcony-living-night-v0037.jpg']},kitchen:{name:'餐廚空間',plates:['assets/balcony-kitchen-day-v0038.jpg','assets/balcony-kitchen-dusk-v0038.jpg','assets/balcony-kitchen-night-v0038.jpg']},bedroom:{name:'臥室',plates:['assets/balcony-bedroom-day-v0039.jpg','assets/balcony-bedroom-dusk-v0039.jpg','assets/balcony-bedroom-night-v0039.jpg']}};
 for(const [id,p]of Object.entries(positions)){p.gaze={x:.5,y:.6};p.svg=document.createElementNS(NS,'svg');p.svg.id=id+'-view';p.svg.setAttribute('aria-hidden','true');p.svg.setAttribute('hidden','');p.layers=p.plates.map(src=>{const n=document.createElementNS(NS,'image');n.setAttribute('href',src);n.setAttribute('width',2048);n.setAttribute('height',768);p.svg.append(n);return n;});stage.after(p.svg);}
 let current='balcony',busy=false,gesture=false,edge={pull:0};const original={drag:view.drag.bind(view),resize:view.resize.bind(view),reset:view.reset.bind(view),light:view.setLight.bind(view)};
 const controls=document.createElement('div');controls.id='position-controls';controls.className='hud';document.body.append(controls);
 const note=document.createElement('p');note.className='hud position-note';note.hidden=true;document.body.append(note);
 function paint(){const p=positions[current];if(!p)return;const aspect=innerWidth/innerHeight;let h=768/1.12,w=h*aspect;if(w>2048/1.12){w=2048/1.12;h=w/aspect;}p.svg.setAttribute('viewBox',`${(2048-w)*p.gaze.x} ${(768-h)*p.gaze.y} ${w} ${h}`);}
 const edgeHint=document.createElement('p');edgeHint.id='edge-hint';edgeHint.setAttribute('role','status');edgeHint.hidden=true;document.body.append(edgeHint);
 function clearEdge(){gesture=false;edge={pull:0};edgeHint.hidden=true;}
 view.beginEdge=()=>{clearEdge();gesture=ready()&&!busy;};
 view.endEdge=cancel=>{const pull=edge.pull;clearEdge();if(cancel||!ready()||busy||Math.abs(pull)<EDGE_THRESHOLD)return;const direction=Math.sign(pull),id=POSITION_ORDER[POSITION_ORDER.indexOf(current)+direction];if(id)move(id,document.createElement('button'),direction);};
 view.drag=(dx,dy,s)=>{if(busy)return;const p=positions[current],gaze=p?p.gaze:view.gaze;
 if(gesture){edge=edgeStep(edge,{gaze:gaze.x,dx,dy,invertX:s.invertX,width:innerWidth,index:POSITION_ORDER.indexOf(current)});edgeHint.hidden=!edge.pull;if(edge.pull){const id=POSITION_ORDER[POSITION_ORDER.indexOf(current)+Math.sign(edge.pull)],name=positions[id]?.name||'陽台';edgeHint.textContent=Math.abs(edge.pull)>=EDGE_THRESHOLD?'放開，前往'+name:'繼續拖曳，前往'+name;edgeHint.dataset.side=edge.pull>0?'right':'left';}}
 if(!p)return original.drag(dx,dy,s);p.gaze.x=Math.max(0,Math.min(1,p.gaze.x+dx/Math.max(480,innerWidth)*(s.invertX?-1:1)));p.gaze.y=Math.max(0,Math.min(1,p.gaze.y+dy/Math.max(350,innerHeight)*(s.invertY?-1:1)));paint();};
 window.addEventListener('blur',clearEdge);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearEdge();});
 view.resize=()=>{original.resize();paint();};view.reset=()=>{if(positions[current]){positions[current].gaze={x:.5,y:.6};paint();}else original.reset();};
 function light(state){const [d,w,n]=state.weights,a=[1,d+w?w/(d+w):0,n];for(const p of Object.values(positions))p.layers.forEach((img,i)=>img.setAttribute('opacity',a[i].toFixed(6)));}
 view.setLight=frame=>{original.light(frame);light(frame.state);};light({weights:view.weights||[0,1,0]});
 async function load(id){const p=positions[id];if(!p)return true;if(p.loaded)return true;if(p.loading)return p.loading;p.loading=Promise.all(p.plates.map(src=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(true);img.onerror=()=>resolve(false);img.src=src;}))).then(results=>{p.loaded=results.every(Boolean);p.loading=null;return p.loaded;});return p.loading;}
 const links={balcony:[['living','↗ 走進客廳']],living:[['balcony','↙ 回到陽台'],['kitchen','↗ 前往餐廚']],kitchen:[['living','↙ 回到客廳'],['bedroom','↗ 走進臥室']],bedroom:[['kitchen','↙ 回到餐廚']]};
 function buttons(){controls.replaceChildren();for(const [id,label]of links[current]){const b=document.createElement('button');b.textContent=label;b.disabled=busy;b.addEventListener('click',()=>move(id,b));controls.append(b);}}
 async function move(id,button,direction=0){if(!ready()||busy)return;busy=true;button.disabled=true;button.textContent='準備光景…';if(!await load(id)){button.textContent='圖片未能載入 · 點此重試';button.disabled=false;busy=false;return;}
 document.body.classList.add('position-changing');if(!reduced())await new Promise(r=>setTimeout(r,180));current=id;if(direction){const gaze=positions[id]?.gaze||view.gaze;gaze.x=direction>0?0:1;}view.svg.style.visibility=id==='balcony'?'':'hidden';for(const [key,p]of Object.entries(positions))p.svg.toggleAttribute('hidden',key!==id);document.body.dataset.balconyPosition=id;note.hidden=id==='balcony';note.textContent=(positions[id]?.name||'陽台')+' · 同步光景';view.resize();onMove(id);document.body.classList.remove('position-changing');busy=false;buttons();}
 buttons();load('living');
}
