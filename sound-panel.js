// Move existing controls so their audio, persistence and file handlers stay intact.
export function unifySoundPanel(){
 const $=id=>document.getElementById(id),panel=$('sound');
 if(!panel||panel.dataset.unified)return;panel.dataset.unified='true';
 const heading=panel.querySelector('h2');heading.textContent='聲音';
 const eyebrow=panel.querySelector('.eyebrow');if(eyebrow)eyebrow.textContent='MUSIC & AMBIENCE';
 $('sound-button').innerHTML='<span aria-hidden="true">♫</span>聲音';
 for(const id of ['music-button','records-button'])if($(id))$(id).hidden=true;
 const music=document.createElement('section');music.className='unified-music';music.innerHTML='<h3>音樂</h3><p class="subtle">一次播放一首，單曲循環；進入場景不會自動播放音樂。</p>';
 const source=$('music')||$('records');
 if(source){for(const child of [...source.children])if(!child.classList.contains('dialog-head'))music.append(child);}
 else {const section=panel.querySelector('.chant-section');if(section){for(const child of [...section.children])if(child.tagName!=='H3')music.append(child);section.remove();}}
 const musicSlider=$('music-volume')||$('chant-volume');
 if(musicSlider){const label=document.querySelector(`label[for="${musicSlider.id}"]`);label.firstChild.textContent='音樂音量';music.append(label,musicSlider);}
 const environment=document.createElement('section');environment.className='unified-environment';environment.innerHTML='<h3>環境聲</h3>';
 const head=panel.querySelector('.dialog-head'),mute=$('mute');
 for(const child of [...panel.children])if(child!==head&&child!==mute)environment.append(child);
 panel.append(music,environment);
 const footer=document.createElement('div');footer.className='sound-footer';footer.append(mute);panel.append(footer);
 for(const id of ['ocean-motion','wave-strength','grass-motion']){
  const input=$(id);if(!input)continue;const label=input.closest('label')||document.querySelector(`label[for="${id}"]`);const container=$('help');container.insertBefore(label,container.querySelector('.settings-actions'));if(input.type==='range')label.after(input);
 }
 if($('motion-status'))$('help').append($('motion-status'));
 for(const slider of environment.querySelectorAll('input[type="range"]')){
  const key='p143-environment-toggle-'+location.pathname+'-'+slider.id;
  let saved={};try{saved=JSON.parse(localStorage.getItem(key))||{};}catch{}
  const toggle=document.createElement('input');toggle.type='checkbox';toggle.checked=saved.enabled!==false;toggle.setAttribute('aria-label',document.querySelector(`label[for="${slider.id}"]`).textContent.replace(/\d+%/, '').trim()+'開關');
  const label=document.createElement('label');label.className='environment-toggle';label.append(toggle,document.createTextNode('開啟'));
  slider.before(label);let previous=Number(saved.previous)||Number(slider.value)||10;
  function persist(){try{localStorage.setItem(key,JSON.stringify({enabled:toggle.checked,previous}));}catch{}}
  toggle.addEventListener('change',()=>{if(!toggle.checked){previous=Number(slider.value)||previous;slider.value=0;}else slider.value=previous;slider.dispatchEvent(new Event('input',{bubbles:true}));slider.disabled=!toggle.checked;persist();});
  slider.addEventListener('input',()=>{if(toggle.checked){previous=Number(slider.value);persist();}});
  if(!toggle.checked){slider.value=0;slider.dispatchEvent(new Event('input',{bubbles:true}));slider.disabled=true;}
 }
 for(const card of music.querySelectorAll('.record,.music-card,.track')){
  const controls=card.querySelector('.record-actions,.track-actions');if(!controls)continue;
  const details=document.createElement('details');details.className='track-options';const summary=document.createElement('summary');summary.textContent='⋯';summary.setAttribute('aria-label','曲目選項');details.append(summary);
  for(const control of [...controls.children])if(control.matches('label,.load-track,.reset-track,[id$="-reset"]'))details.append(control);
  controls.append(details);
 }
 if(!$('now-playing')){
  const now=document.createElement('aside');now.id='now-playing';now.className='hud now-playing';now.hidden=true;now.innerHTML='<div><small>此刻的旋律</small><span id="playing-title"></span></div><button id="stop-music" class="round" aria-label="播放或暫停音樂">Ⅱ</button>';document.body.append(now);
  $('stop-music').addEventListener('click',()=>{const id=document.body.dataset.playing;if(id&&id!=='none')$(id+'-play')?.click();});
 }
 const coverStates=[];
 const scene=location.pathname.split('/').pop().replace('.html','');
 const images={seaside:['assets/photo-entry.png','assets/photo-sofa.png','assets/photo-records.png'],snow:['assets/snow-wide-day.png','assets/snow-wide-warm.png','assets/snow-wide-night.png'],balcony:['assets/balcony-wide-day-v0028.png','assets/balcony-wide-dusk-v0028.png','assets/balcony-wide-night-v0028.png'],garden:['assets/garden-day.png','assets/garden-warm.png','assets/garden-night.png'],temple:['assets/temple-day.png','assets/temple-morning.png','assets/temple-night.png']};
 for(const [index,card]of [...music.querySelectorAll('.record,.music-card,.track')].entries()){
  const play=card.querySelector('[id$="-play"],.play-track');if(!play)continue;play.hidden=true;
  const old=card.querySelector('.cover,.music-cover');let cover=old;
  const native=old?.tagName==='BUTTON';
  if(!native){cover=document.createElement('button');cover.type='button';cover.className=(old?.className||'music-cover')+' image-play';if(old){while(old.firstChild)cover.append(old.firstChild);old.replaceWith(cover);}else card.prepend(cover);cover.addEventListener('click',()=>play.click());}
  cover.classList.add('image-play');cover.style.backgroundImage=`url("${(images[scene]||images.seaside)[index%3]}")`;
  const title=card.querySelector('h3,strong,.music-cover span')?.textContent||['音樂一','音樂二','音樂三'][index];
  const badge=document.createElement('span');badge.className='cover-play-symbol';badge.setAttribute('aria-hidden','true');cover.append(badge);
  coverStates.push({cover,play,title,badge});
 }
 function syncCovers(){for(const {cover,play,title,badge}of coverStates){const playing=play.textContent.startsWith('暫停');if(cover.disabled!==play.disabled)cover.disabled=play.disabled;const text=playing?'Ⅱ':'▶';if(badge.textContent!==text)badge.textContent=text;const label=(play.disabled?'請先另選音檔：':playing?'暫停：':'播放：')+title;if(cover.getAttribute('aria-label')!==label)cover.setAttribute('aria-label',label);cover.setAttribute('aria-pressed',String(playing));}}
 new MutationObserver(syncCovers).observe(music,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['disabled']});syncCovers();
 const now=$('now-playing'),button=$('stop-music')||$('pause');
 const sync=()=>{const active=music.querySelector('.playing,.record.active');const play=active?.querySelector('[id$="-play"],.play-track');const playing=play?.textContent.startsWith('暫停');if(button){button.textContent=playing?'Ⅱ':'▷';button.setAttribute('aria-label',playing?'暫停音樂':'繼續播放');}};
 new MutationObserver(sync).observe(music,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});sync();
 for(const note of music.querySelectorAll('.note'))note.textContent=note.textContent.replace(/重新進入[^。]*不會自動播放。/,'音樂會隨你回到地圖，進入其他場所才停止。');
 if($('records-sit'))$('records-sit').hidden=true;
}
