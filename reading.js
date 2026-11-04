import {READING_KEY,COMPANION_KEY,readingState,companionFrame,catSpot,spreadStride,spreadCount,spreadAt,textChunks} from './reading-model.js?v=0.030';

const COMPANION_AVAILABLE=false;
const $=id=>document.getElementById(id),room=document.body.dataset.place;
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
let state=readingState(read(READING_KEY,{})),book=null,bookPromise=null,loading=false,storageOK=true,restoring=false,scrollTimer;
let companion=read(COMPANION_KEY,{enabled:true});if(typeof companion.enabled!=='boolean')companion={enabled:true};
const reader=document.createElement('dialog');reader.id='reading';reader.setAttribute('aria-labelledby','reading-title');
reader.innerHTML=`<svg class="reading-book-frame" viewBox="0 0 1600 800" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="book-left"><stop stop-color="var(--paper-edge)"/><stop offset=".14" stop-color="var(--paper)"/><stop offset=".8" stop-color="var(--paper)"/><stop offset="1" stop-color="var(--paper-fold)"/></linearGradient><linearGradient id="book-right"><stop stop-color="var(--paper-fold)"/><stop offset=".12" stop-color="var(--paper)"/><stop offset=".86" stop-color="var(--paper)"/><stop offset="1" stop-color="var(--paper-edge)"/></linearGradient></defs><path class="book-cover" d="M 213 36 Q 480 12 800 48 Q 1120 12 1387 36 L 1593 744 Q 1601 769 1570 779 Q 1120 789 800 796 Q 480 789 30 779 Q -1 769 7 744 Z"/><path class="book-page-stack" d="M 210 36 Q 480 9 800 44 Q 1120 9 1390 36 L 1582 735 L 1578 769 Q 1130 773 800 784 Q 470 773 22 769 L 18 735 Z"/><path class="book-page-lines" d="M 20 744 Q 440 752 800 779 Q 1160 752 1580 744 M 22 753 Q 440 763 800 786 Q 1160 763 1578 753 M 24 762 Q 440 771 800 792 Q 1160 771 1576 762"/><path fill="url(#book-left)" d="M 220 28 Q 480 5 800 42 L 800 770 Q 420 744 24 744 Q 10 738 18 720 L 187 60 Q 198 35 220 28 Z"/><path fill="url(#book-right)" d="M 1380 28 Q 1120 5 800 42 L 800 770 Q 1180 744 1576 744 Q 1590 738 1582 720 L 1413 60 Q 1402 35 1380 28 Z"/><path class="book-spine-shadow" d="M 800 42 Q 789 350 800 770"/><path class="book-spine-light" d="M 805 44 Q 796 350 805 766"/></svg><div class="reading-interior"><div class="reading-top"><div><span class="reading-eyebrow">A BOOK, A LITTLE COMPANY</span><h2 id="reading-title">帶一本書，坐一會兒。</h2></div><button id="reading-close" aria-label="收起書本">×</button></div>
<div class="reading-tools"><label class="chapter-picker" for="reading-chapter">章回<select id="reading-chapter" disabled aria-label="選擇紅樓夢章回"><option>紅樓夢 · 準備中</option></select></label><div class="reading-type"><button id="reading-smaller" aria-label="縮小閱讀字級">A−</button><output id="reading-size" aria-live="polite"></output><button id="reading-larger" aria-label="放大閱讀字級">A＋</button></div><button id="reading-theme" aria-pressed="false">夜讀</button><button id="reading-expand" aria-pressed="false">放大閱讀</button></div>
<div id="reading-content" tabindex="0" role="region" aria-label="紅樓夢內文"><div id="reading-flow"><p class="reading-loading">正在取出《紅樓夢》…</p></div></div>
<div class="reading-bottom"><button id="reading-prev" disabled>上一回</button><button id="reading-page-prev" aria-label="上一頁" disabled>‹ 上一頁</button><span id="reading-progress" role="status">第一次打開，從第一回開始。</span><button id="reading-page-next" aria-label="下一頁" disabled>下一頁 ›</button><button id="reading-next" disabled>下一回</button></div>
<div class="reading-meta"><label><input id="reading-cat" type="checkbox" checked>黑貓陪伴</label><details id="reading-source"><summary>版本與來源</summary><p id="reading-edition">《紅樓夢》· 一百二十回數位文本。正文保留來源字形，供自在閱讀。</p><p id="reading-source-note"></p><p>來源致謝：<a id="reading-source-link" href="books/hongloumeng-source.txt" target="_blank" rel="noopener">紅樓夢數位原文</a> · <span id="reading-source-credit"></span>。<a id="reading-license-link" href="books/hongloumeng-source.txt" target="_blank" rel="noopener">原始文字與使用條件</a></p><p class="reading-license" id="reading-license"></p></details></div><p id="reading-save" class="reading-save" role="status">閱讀位置會保存在這個瀏覽器，五個場所共用。</p></div>`;
document.body.append(reader);
const button=document.createElement('button');button.id='reading-button';button.type='button';button.setAttribute('aria-controls','reading');button.setAttribute('aria-expanded','false');button.innerHTML='<span aria-hidden="true">▤</span>拿本書';$('dock').append(button);
const help=document.createElement('section');help.className='companion-settings';help.innerHTML='<h3>一點陪伴</h3><label class="check"><input id="companion-enabled" type="checkbox" checked>讓黑貓陪著我</label><p class="subtle">牠會安靜趴著，偶爾眨眼。關閉陪伴或啟用減少動態，都可以自在選擇。</p>';help.hidden=!COMPANION_AVAILABLE;$('help').append(help);$('reading-cat').closest('label').hidden=!COMPANION_AVAILABLE;
const content=$('reading-content'),flow=$('reading-flow');
let paged=false,spread=0,count=1,gap=0,stride=1,restoreRevision=0,wheelAt=0;
function capture(){
 if(!book||!reader.open||restoring)return;
 const box=content.getBoundingClientRect();
 for(const span of flow.querySelectorAll('[data-start]')){
  if([...span.getClientRects()].some(r=>r.bottom>box.top+2&&r.top<box.bottom-2&&r.right>box.left+2&&r.left<box.right-2)){
   const p=span.closest('[data-paragraph]');state.paragraph=Number(p.dataset.paragraph);state.offset=Number(span.dataset.start)/Math.max(1,p.textContent.length);return;
  }
 }
}
function save(){try{localStorage.setItem(READING_KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}$('reading-save').textContent=storageOK?'閱讀位置已保存在這個瀏覽器，五個場所共用。':'這個瀏覽器無法保存進度；本次仍可閱讀。';}
function measure(){paged=matchMedia('(min-width:901px) and (min-height:600px)').matches;reader.dataset.layout=paged?'spread':'scroll';spread=0;flow.style.transform='';content.scrollTop=0;gap=paged?parseFloat(getComputedStyle(flow).columnGap)||0:0;const width=content.getBoundingClientRect().width;stride=spreadStride(width,gap);count=paged?spreadCount(flow.scrollWidth,width,gap):1;}
function paintSpread(){flow.style.transform=paged?`translateX(${-spread*stride}px)`:'';reader.dataset.spread=String(spread);reader.dataset.spreadCount=String(count);}
function restore(){
 restoring=true;const revision=++restoreRevision;
 requestAnimationFrame(()=>{
  if(revision!==restoreRevision||!reader.open){if(revision===restoreRevision)restoring=false;return;}
  measure();
  if(book){const p=flow.querySelector(`[data-paragraph="${state.paragraph}"]`),target=state.offset*(p?.textContent.length||1),spans=p?[...p.querySelectorAll('[data-start]')]:[],span=spans.find(e=>Number(e.dataset.start)+e.textContent.length>target)||spans.at(-1);
   if(span&&!(state.paragraph===0&&state.offset===0)){const r=span.getClientRects()[0],box=content.getBoundingClientRect();if(r){if(paged)spread=spreadAt(r.left-box.left,box.width,gap,count);else content.scrollTop=r.top-box.top;}}
  }
  paintSpread();requestAnimationFrame(()=>{if(revision===restoreRevision){restoring=false;updateProgress();}});
 });
}
function style(){reader.dataset.theme=state.theme;reader.classList.toggle('reading-expanded',state.expanded);reader.style.setProperty('--reading-size',state.font+'px');$('reading-size').textContent=state.font;$('reading-smaller').disabled=state.font<=16;$('reading-larger').disabled=state.font>=30;$('reading-theme').setAttribute('aria-pressed',String(state.theme==='night'));$('reading-expand').setAttribute('aria-pressed',String(state.expanded));$('reading-expand').textContent=state.expanded?'回到窗景':'放大閱讀';}
function updateProgress(){if(!book)return;const max=content.scrollHeight-content.clientHeight,pct=max>0?Math.round(content.scrollTop/max*100):100;const totalPages=Math.max(2,Math.round((flow.scrollWidth+gap)/Math.max(1,(content.getBoundingClientRect().width+gap)/2)));$('reading-progress').textContent=`第 ${state.chapter+1} / ${book.chapters.length} 回 · `+(paged?`第 ${spread*2+1}–${Math.min(spread*2+2,totalPages)} / ${totalPages} 頁`:`本回 ${pct}%`);$('reading-prev').disabled=state.chapter===0;$('reading-next').disabled=state.chapter===book.chapters.length-1;$('reading-page-prev').disabled=!paged||spread===0;$('reading-page-next').disabled=!paged||spread>=count-1;}
function render(){const chapter=book.chapters[state.chapter];state.paragraph=Math.min(state.paragraph,Math.max(0,chapter.paragraphs.length-1));flow.replaceChildren();const heading=document.createElement('h3');heading.textContent=chapter.displayTitle||chapter.title;flow.append(heading);chapter.paragraphs.forEach((text,i)=>{const p=document.createElement('p');p.dataset.paragraph=i;for(const chunk of textChunks(text)){const span=document.createElement('span');span.dataset.start=chunk.start;span.textContent=chunk.text;p.append(span);}flow.append(p);});$('reading-title').textContent='紅樓夢';$('reading-chapter').value=state.chapter;restore();}
function turnSpread(delta){if(!book||!paged||restoring)return;spread=Math.max(0,Math.min(count-1,spread+delta));paintSpread();capture();updateProgress();save();}
async function loadBook(){if(book)return true;if(loading)return bookPromise;loading=true;flow.innerHTML='<p class="reading-loading">正在取出《紅樓夢》…</p>';bookPromise=(async()=>{try{const response=await fetch('books/hongloumeng.json?v=0.024');if(!response.ok)throw Error('book response');const data=await response.json();if(data.id!=='hongloumeng'||data.chapters?.length!==120||!data.chapters.every(c=>Array.isArray(c.paragraphs)&&c.paragraphs.length))throw Error('book format');book=data;state=readingState(state,book.chapters.length);$('reading-chapter').replaceChildren();book.chapters.forEach((c,i)=>{const option=document.createElement('option');option.value=i;option.textContent=c.displayTitle||c.title;$('reading-chapter').append(option);});$('reading-chapter').disabled=false;$('reading-edition').textContent=`${book.author} · ${book.edition}`;$('reading-source-note').textContent=book.textNote;$('reading-source-link').href=book.sourceURL;$('reading-source-link').textContent=book.sourceName||'原文來源';$('reading-source-credit').textContent=book.sourceCredit;$('reading-license-link').href=book.licenseURL;$('reading-license').textContent=book.sourceNotice;render();return true;}catch{flow.innerHTML='<div class="reading-error"><p>這次沒有取到書本，請再試一次。</p><button id="reading-retry">重新取書</button></div>';$('reading-retry').addEventListener('click',loadBook);return false;}finally{loading=false;}})();return bookPromise;}
button.addEventListener('click',async()=>{if(reader.open){capture();reader.close();return;}for(const d of document.querySelectorAll('dialog[open]'))d.close();state=readingState(read(READING_KEY,state));style();reader.show();document.body.classList.add('reading-open');button.setAttribute('aria-expanded','true');await loadBook();if(book)render();});
$('reading-close').addEventListener('click',()=>{capture();reader.close();});reader.addEventListener('close',()=>{save();document.body.classList.remove('reading-open');button.setAttribute('aria-expanded','false');if(!document.querySelector('dialog[open]'))button.focus({preventScroll:true});});
reader.addEventListener('keydown',e=>{if(paged&&e.target===content&&['PageDown','ArrowRight','ArrowDown',' ','PageUp','ArrowLeft','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();turnSpread(e.key==='Home'?-count:e.key==='End'?count:['PageUp','ArrowLeft','ArrowUp'].includes(e.key)?-1:1);}if(e.key==='Escape'){e.preventDefault();capture();reader.close();}if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Home','End','PageUp','PageDown','w','a','s','d'].includes(e.key))e.stopPropagation();});
content.addEventListener('scroll',()=>{if(restoring||!book||paged)return;capture();updateProgress();clearTimeout(scrollTimer);scrollTimer=setTimeout(save,220);},{passive:true});
$('reading-page-prev').addEventListener('click',()=>turnSpread(-1));$('reading-page-next').addEventListener('click',()=>turnSpread(1));
content.addEventListener('wheel',e=>{if(!paged)return;e.preventDefault();if(Math.abs(e.deltaY)+Math.abs(e.deltaX)<8||performance.now()-wheelAt<320)return;wheelAt=performance.now();turnSpread((e.deltaY||e.deltaX)>0?1:-1);},{passive:false});
for(const [id,delta]of[['reading-prev',-1],['reading-next',1]])$(id).addEventListener('click',()=>{if(!book)return;state.chapter=Math.max(0,Math.min(book.chapters.length-1,state.chapter+delta));state.paragraph=0;state.offset=0;render();save();content.focus({preventScroll:true});});
$('reading-chapter').addEventListener('change',e=>{state.chapter=Number(e.target.value);state.paragraph=0;state.offset=0;render();save();});
for(const [id,delta]of[['reading-smaller',-1],['reading-larger',1]])$(id).addEventListener('click',()=>{capture();state.font=Math.max(16,Math.min(30,state.font+delta));style();restore();save();});
$('reading-theme').addEventListener('click',()=>{state.theme=state.theme==='paper'?'night':'paper';style();save();});
$('reading-expand').addEventListener('click',()=>{capture();state.expanded=!state.expanded;style();restore();save();});
window.addEventListener('resize',()=>{if(reader.open)restore();});$('reading-source').addEventListener('toggle',()=>{if(reader.open)restore();});document.fonts?.ready.then(()=>{if(reader.open)restore();});
window.addEventListener('pagehide',()=>{if(reader.open){capture();save();}});document.addEventListener('visibilitychange',()=>{if(document.hidden&&reader.open){capture();save();}});
window.addEventListener('storage',e=>{if(e.key===COMPANION_KEY){companion=read(COMPANION_KEY,{enabled:true});syncCompanion();}});
function syncCompanion(){for(const id of ['reading-cat','companion-enabled'])$(id).checked=companion.enabled;document.body.dataset.companion=COMPANION_AVAILABLE&&companion.enabled?'on':'off';}
for(const id of ['reading-cat','companion-enabled'])$(id).addEventListener('change',e=>{companion.enabled=e.target.checked;try{localStorage.setItem(COMPANION_KEY,JSON.stringify(companion));}catch{}syncCompanion();});syncCompanion();style();

// The companion lives in photographic scene coordinates, never in screen/HUD space.
const NS='http://www.w3.org/2000/svg',svgNode=(tag,attrs={})=>{const e=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;};
let catSVG,catRoot,catBody,catEyes,catHighlight,last=-Infinity;
function mountCat(){
 catSVG=document.querySelector('#garden-view,#temple-view,#snow-view,#balcony-view,body.photo-mode #scenic-view');
 if(!catSVG){setTimeout(mountCat,250);return;}
 const defs=svgNode('defs'),ground=svgNode('radialGradient',{id:'quiet-cat-ground'});
 ground.append(svgNode('stop',{offset:0,'stop-color':'#080806','stop-opacity':.66}),svgNode('stop',{offset:.45,'stop-color':'#080806','stop-opacity':.28}),svgNode('stop',{offset:1,'stop-color':'#080806','stop-opacity':0}));
 const alpha=svgNode('mask',{id:'quiet-cat-alpha',maskUnits:'userSpaceOnUse',x:0,y:0,width:1774,height:887,style:'mask-type:alpha'});
 alpha.append(svgNode('image',{href:'assets/companion-black-cat.png',width:1774,height:887}));
 const light=svgNode('linearGradient',{id:'quiet-cat-volume',x1:0,y1:0,x2:.7,y2:1});
 catHighlight=svgNode('stop',{offset:0,'stop-color':'#fff1cf','stop-opacity':.10});
 light.append(catHighlight,svgNode('stop',{offset:.48,'stop-color':'#ffe9ba','stop-opacity':.015}),svgNode('stop',{offset:1,'stop-color':'#11120d','stop-opacity':.19}));
 const edge=svgNode('filter',{id:'quiet-cat-material',x:'-1%',y:'-1%',width:'102%',height:'102%','color-interpolation-filters':'sRGB'});
 edge.append(svgNode('feGaussianBlur',{in:'SourceAlpha',stdDeviation:.85,result:'softAlpha'}),svgNode('feComposite',{in:'SourceGraphic',in2:'softAlpha',operator:'in'}));
 defs.append(ground,alpha,light,edge);
 catRoot=svgNode('g',{'data-effect':'quiet-cat',class:'quiet-cat','pointer-events':'none','aria-hidden':'true'});
 catRoot.append(defs,svgNode('ellipse',{cx:900,cy:867,rx:910,ry:92,fill:'url(#quiet-cat-ground)',opacity:.42}),svgNode('ellipse',{cx:1120,cy:865,rx:610,ry:30,fill:'url(#quiet-cat-ground)',opacity:.62}),svgNode('ellipse',{cx:460,cy:867,rx:400,ry:21,fill:'url(#quiet-cat-ground)',opacity:.82}));
 catBody=svgNode('g');catBody.append(svgNode('image',{href:'assets/companion-black-cat.png',width:1774,height:887,preserveAspectRatio:'none'}),svgNode('rect',{x:0,y:0,width:1774,height:887,fill:'url(#quiet-cat-volume)',mask:'url(#quiet-cat-alpha)'}));
 catEyes=svgNode('g',{opacity:0,fill:'#282625'});catEyes.append(svgNode('path',{d:'M 399 288 Q 427 283 451 311 Q 425 327 408 310 Z'}),svgNode('path',{d:'M 573 336 Q 596 327 623 340 Q 616 366 585 359 Z'}));
 catBody.append(catEyes);catRoot.append(catBody);catSVG.append(catRoot);requestAnimationFrame(catLoop);
}
function catLoop(now){
 requestAnimationFrame(catLoop);if(document.hidden||now-last<1000/24)return;last=now;
 const source=catSVG.querySelector('image')?.getAttribute('href')||'',spot=catSpot(room,source,innerWidth<600);if(!spot)return;
 catRoot.setAttribute('transform',`translate(${spot.x} ${spot.y-871*spot.width/1774}) scale(${spot.width/1774})`);catRoot.dataset.width=spot.width.toFixed(2);
 const weights=(catSVG.dataset.lightWeights||'1,0,0').split(',').map(Number),[day,gold,night]=weights,brightness=day+gold*.88+night*.36;
 catBody.style.filter=`url(#quiet-cat-material) brightness(${brightness.toFixed(4)}) saturate(.90)`;
 catHighlight.setAttribute('stop-color',gold>day?'#ffd595':night>.5?'#e6cb9f':'#f4f1dd');catHighlight.setAttribute('stop-opacity',(.09*day+.15*gold+.12*night).toFixed(4));
 const reduced=$('reduce-motion')?.checked??matchMedia('(prefers-reduced-motion: reduce)').matches,active=document.body.classList.contains('entered')&&companion.enabled,frame=companionFrame(now/1000,reduced||!active);
 catRoot.dataset.motion=reduced?'paused':'running';catBody.setAttribute('transform',`translate(0 ${871*(1-frame.breath)}) scale(1 ${frame.breath})`);catEyes.setAttribute('opacity',frame.blink.toFixed(4));
}
if(COMPANION_AVAILABLE)mountCat();
