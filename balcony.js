import {SolarLightClock as LightClock,formatMinute} from './solar-light-clock.js?v=0.032';
import {syncSolarUI} from './solar-ui.js?v=0.032';
import {balconyLightAtMinute,BALCONY_MOMENTS} from './balcony-light.js?v=0.022';
import {BalconyView} from './balcony-view.js?v=0.028';
import {BalconyAudio} from './balcony-audio.js?v=0.021';
import {BALCONY_TRACKS,resolveDefault} from './balcony-music.js?v=0.021';
import {readLookSettings,describeLookSettings} from './look-controls.js?v=0.013';

const $=id=>document.getElementById(id),stage=$('balcony-stage'),view=new BalconyView($('balcony-view')),clock=new LightClock(new Date(),balconyLightAtMinute),sound=new BalconyAudio();
const reduceMedia=matchMedia('(prefers-reduced-motion: reduce)');
let saved={};try{saved=JSON.parse(localStorage.getItem('p143-balcony-settings-v1'))||{};}catch{}
const level=(value,fallback)=>typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(1,value)):fallback;
const look=readLookSettings();for(const key of ['invertX','invertY'])if(typeof saved[key]==='boolean')look[key]=saved[key];
let wind=level(saved.wind,.06),city=level(saved.city,.03),musicVolume=level(saved.musicVolume,.25),muted=saved.muted===true,motion=saved.motion!==false,reduced=typeof saved.reduced==='boolean'?saved.reduced:reduceMedia.matches;
let resumeMusic=false;
let entered=false,quiet=false,leaving=false,pointer=null,lastTick=-Infinity,toastTimer,visibilityRevision=0;
const audio=new Audio();audio.loop=true;audio.preload='metadata';
let activeTrack=null,playToken=0,dbPromise,writeQueue=Promise.resolve();
const tracks=Object.fromEntries(BALCONY_TRACKS.map(t=>[t.id,{...t,requestedFilename:t.filename,defaultSrc:null,url:null,custom:false,filename:'預設音樂準備中 · '+t.filename,revision:0}]));
function toast(text){$('hint').textContent=text;$('hint').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('hint').classList.remove('visible'),4500);}
function save(){try{localStorage.setItem('p143-balcony-settings-v1',JSON.stringify({wind,city,musicVolume,muted,motion,reduced,...look}));}catch{}}
function setQuiet(value){quiet=value;document.body.classList.toggle('quiet',value);document.querySelectorAll('.hud').forEach(el=>el.inert=value);$('wake').hidden=!value;if(value)stage.focus({preventScroll:true});}
function applySound(){sound.setLevels(city,wind,muted);audio.volume=muted?0:musicVolume;$('mute').textContent=muted?'恢復聲音':'全部靜音';}
function applyMotion(){view.setMotion(motion&&!reduced);$('room-motion').checked=motion;$('room-motion').disabled=reduced;$('reduce-motion').checked=reduced;}
function updateLook(){$('invert-look-x').checked=look.invertX;$('invert-look-y').checked=look.invertY;$('drag-direction').textContent=describeLookSettings(look);}
function tick(now=performance.now()){const frame=clock.sample(now),time=formatMinute(frame.minute);view.setLight(frame);const moments=syncSolarUI(frame,clock,tick,BALCONY_MOMENTS);$('light-label').textContent=time;$('light-current').textContent=time+' · '+frame.label+' · '+(frame.follow?'跟隨現在':'手動暫停');$('light-follow').checked=frame.follow;if(document.activeElement!==$('light-time'))$('light-time').value=Math.floor(frame.minute);$('light-time-value').textContent=time;$('light-time').setAttribute('aria-valuetext',time);$('light-status').textContent=frame.transitioning?`正在平順接回現在的光景 · 約 ${Math.max(1,Math.ceil((1-frame.progress)*5))} 分鐘後完成。`:frame.follow?'跟隨花蓮時間，日出與日落各以一小時平順漸變。':'已停在選定時刻；聲音仍可繼續播放。';document.body.dataset.timeMode=frame.follow?'auto':'manual';for(const button of document.querySelectorAll('[data-moment]'))button.setAttribute('aria-pressed',String(!frame.follow&&Number(button.dataset.moment)===Math.floor(frame.minute)));const moment=moments.find(p=>p.minute===Math.floor(frame.minute));$('moment-description').textContent=moment?.description||'拖曳時間，看看屋頂與陽台如何隨光改變。';}
function openDialog(id){setQuiet(false);$(id).showModal();}
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
for(const button of document.querySelectorAll('.close'))button.addEventListener('click',()=>button.closest('dialog').close());
for(const id of ['light','sound','help','music'])$(id+'-button').addEventListener('click',()=>{tick();openDialog(id);});
$('sit-button').addEventListener('click',()=>setQuiet(true));$('wake').addEventListener('click',()=>setQuiet(false));
$('light-time').addEventListener('input',e=>{clock.select(Number(e.target.value));tick();});
$('light-follow').addEventListener('change',e=>{if(e.target.checked)clock.followNow();else clock.select(clock.minute);tick();});
for(const[id,read,set]of [['wind',()=>wind,v=>wind=v],['city',()=>city,v=>city=v],['music',()=>musicVolume,v=>musicVolume=v]]){const slider=$(id+'-volume');slider.value=Math.round(read()*100);$(id+'-value').textContent=slider.value+'%';slider.addEventListener('input',()=>{set(Number(slider.value)/100);$(id+'-value').textContent=slider.value+'%';applySound();save();});}
$('mute').addEventListener('click',()=>{muted=!muted;applySound();save();});
for(const[axis,key]of [['x','invertX'],['y','invertY']])$('invert-look-'+axis).addEventListener('change',e=>{look[key]=e.target.checked;updateLook();save();});
$('room-motion').addEventListener('change',e=>{motion=e.target.checked;applyMotion();save();});
$('reduce-motion').addEventListener('change',e=>{reduced=e.target.checked;applyMotion();save();});
reduceMedia.addEventListener('change',e=>{let explicit=false;try{explicit=typeof JSON.parse(localStorage.getItem('p143-balcony-settings-v1'))?.reduced==='boolean';}catch{}if(!explicit){reduced=e.matches;applyMotion();}});
$('reset-view').addEventListener('click',()=>{view.reset();closeDialogs();});
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('此瀏覽器暫不支援全螢幕。');}});

stage.addEventListener('pointerdown',e=>{if(!entered||leaving||!e.isPrimary||(e.pointerType==='mouse'&&e.button!==0))return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false,wakeOnly:quiet};stage.setPointerCapture(e.pointerId);stage.classList.add('dragging');stage.focus({preventScroll:true});});
stage.addEventListener('pointermove',e=>{if(!pointer||e.pointerId!==pointer.id)return;if(Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>6)pointer.moved=true;if(pointer.moved)view.drag(e.clientX-pointer.lastX,e.clientY-pointer.lastY,look);pointer.lastX=e.clientX;pointer.lastY=e.clientY;});
function release(e){if(!pointer||pointer.id!==e.pointerId)return;const wake=pointer.wakeOnly&&!pointer.moved;pointer=null;stage.classList.remove('dragging');if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);if(wake)setQuiet(false);}
for(const type of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(type,release);
stage.addEventListener('keydown',e=>{const moves={ArrowLeft:[-45,0],ArrowRight:[45,0],ArrowUp:[0,-55],ArrowDown:[0,55]};if(!entered)return;if(moves[e.key]){e.preventDefault();view.drag(...moves[e.key],{invertX:false,invertY:false});}else if(e.key==='Home'){e.preventDefault();view.reset();}});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&quiet)setQuiet(false);});
window.addEventListener('blur',()=>{pointer=null;stage.classList.remove('dragging');});
window.addEventListener('resize',()=>view.resize());

function openDB(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open('p143-balcony-audio',1);req.onupgradeneeded=()=>req.result.createObjectStore('tracks');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});return dbPromise;}
function persistTrack(id,value){const operation=writeQueue.catch(()=>{}).then(async()=>{const db=await openDB();await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite');if(value)tx.objectStore('tracks').put(value,id);else tx.objectStore('tracks').delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});});writeQueue=operation;return operation;}
function updateTracks(){for(const[id,t]of Object.entries(tracks)){$(id+'-name').textContent=t.filename;$(id+'-play').disabled=!t.url;$(id+'-reset').disabled=!t.custom;$(id+'-reset').textContent=t.defaultSrc?'恢復預設':'清除自選';$(id+'-play').textContent=activeTrack===id?'停止':t.url?'播放':'音樂準備中';document.querySelector(`[data-track="${id}"]`).classList.toggle('playing',activeTrack===id);}document.body.dataset.playing=activeTrack||'none';$('now-playing').hidden=!activeTrack;$('playing-title').textContent=tracks[activeTrack]?.name||'';}
function stopTrack(){playToken++;audio.pause();audio.removeAttribute('src');audio.load();activeTrack=null;updateTracks();}
function bindTrack(id,blob,name){const t=tracks[id];if(activeTrack===id)stopTrack();if(t.custom&&t.url)URL.revokeObjectURL(t.url);t.url=URL.createObjectURL(blob);t.custom=true;t.filename=name;updateTracks();}
async function restoreTracks(){const revisions=Object.fromEntries(Object.entries(tracks).map(([id,t])=>[id,t.revision]));try{const db=await openDB();await Promise.all(Object.keys(tracks).map(id=>new Promise(resolve=>{const req=db.transaction('tracks').objectStore('tracks').get(id);req.onsuccess=()=>{if(req.result?.blob instanceof Blob&&tracks[id].revision===revisions[id])bindTrack(id,req.result.blob,req.result.name);resolve();};req.onerror=resolve;})));}catch{$('track-status').textContent='此瀏覽器無法保存音檔；仍可在本次停留選擇播放。';}}
for(const t of BALCONY_TRACKS){const card=document.createElement('article');card.className='music-card';card.dataset.track=t.id;card.innerHTML=`<div class="music-cover cover-${t.id}"><span>${t.name}</span></div><p class="genre">${t.style}</p><p class="english" lang="en">${t.english}</p><p class="description">${t.description}</p><small id="${t.id}-name" class="filename"></small><div class="track-actions"><button id="${t.id}-play" class="secondary play-music" disabled>播放</button><label class="file-button">另選音樂<input id="${t.id}-file" type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac" aria-label="為${t.name}另選音樂"></label><button id="${t.id}-reset" class="text-button" disabled>清除自選</button></div>`;$('music-grid').append(card);}
let checkingDefaults=false;
async function loadDefaults(){if(checkingDefaults)return;checkingDefaults=true;$('retry-defaults').disabled=true;$('music-pending').textContent='正在確認三首預設音樂…';
 try{await Promise.all(Object.entries(tracks).map(async([id,t])=>{const src=await resolveDefault(t.requestedFilename);t.defaultSrc=src;if(!t.custom){t.url=src;t.filename=src?src.split('/').pop():'預設音樂準備中 · '+BALCONY_TRACKS.find(p=>p.id===id).filename;}}));}finally{checkingDefaults=false;const missing=Object.values(tracks).filter(t=>!t.defaultSrc);$('music-pending').hidden=missing.length===0;$('music-pending').textContent=missing.length?'有 '+missing.length+' 首預設音樂準備中，現在也可以另選自己的音檔。':'';$('retry-defaults').hidden=missing.length===0;$('retry-defaults').disabled=false;updateTracks();}}
$('retry-defaults').addEventListener('click',()=>loadDefaults());
$('stop-music').addEventListener('click',()=>{if(activeTrack)$(activeTrack+'-play').click();});
for(const[id,t]of Object.entries(tracks)){
 $(id+'-file').addEventListener('change',async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(!file.type.startsWith('audio/')&&!/\.(mp3|m4a|wav|ogg|flac|aac|opus|webm)$/i.test(file.name)){toast('請選擇 MP3 或其他音訊檔案。');return;}const revision=++t.revision;bindTrack(id,file,file.name);$('track-status').textContent='正在保存音檔…';try{await persistTrack(id,{blob:file,name:file.name});if(t.revision===revision)$('track-status').textContent=activeTrack===id?'正在循環播放'+t.name+'。':'已保存在這個瀏覽器；按播放即可聆聽。';}catch{if(t.revision===revision)$('track-status').textContent='本次可播放；此瀏覽器未能保存音檔。';}});
 $(id+'-play').addEventListener('click',async()=>{if(!t.url)return;if(activeTrack===id){if(!audio.paused){audio.pause();updateTracks();return;}try{await audio.play();updateTracks();}catch{$('track-status').textContent='無法繼續播放，請再試一次。';}return;}stopTrack();const token=++playToken;activeTrack=id;audio.src=t.url;applySound();updateTracks();try{await audio.play();if(token!==playToken)return;$('track-status').textContent='正在循環播放'+t.name+'。';}catch{if(token!==playToken)return;activeTrack=null;updateTracks();$('track-status').textContent='無法播放此音檔，請換一個音檔再試。';}});
 $(id+'-reset').addEventListener('click',async()=>{const revision=++t.revision;if(activeTrack===id)stopTrack();if(t.custom&&t.url)URL.revokeObjectURL(t.url);t.url=t.defaultSrc;t.custom=false;t.filename=t.defaultSrc?t.defaultSrc.split('/').pop():'預設音樂準備中 · '+t.requestedFilename;updateTracks();try{await persistTrack(id,null);if(t.revision===revision)$('track-status').textContent=t.defaultSrc?'已恢復預設音樂。':'已清除自選音檔。';}catch{if(t.revision===revision)$('track-status').textContent='本次已清除；瀏覽器未能保存變更，下次可能需再次清除。';}});
}
audio.addEventListener('play',updateTracks);audio.addEventListener('pause',updateTracks);
audio.addEventListener('error',()=>{if(activeTrack){activeTrack=null;updateTracks();$('track-status').textContent='無法讀取此音檔，請重新選擇。';}});

$('enter').addEventListener('click',async()=>{if(entered)return;entered=true;document.body.classList.add('entered');$('welcome').classList.add('leaving');stage.focus();applySound();const ok=await sound.start();if(document.hidden)await sound.suspend();if(!ok){$('audio-status').textContent='目前無法啟動環境聲；仍可播放音樂。';}else $('audio-status').textContent='微風與城市底聲可分別調整，音樂音量在選曲面板設定。';toast('坐著就好，屋頂與窗燈會陪著你。');});
document.addEventListener('visibilitychange',async()=>{if(!entered||leaving)return;const revision=++visibilityRevision;if(document.hidden){resumeMusic=!!activeTrack&&!audio.paused;audio.pause();await sound.suspend();}else{if(clock.follow)clock.followNow();tick();await sound.resume();if(revision!==visibilityRevision||document.hidden){if(document.hidden)await sound.suspend();return;}if(activeTrack&&resumeMusic){resumeMusic=false;try{await audio.play();}catch{activeTrack=null;updateTracks();toast('音樂已暫停，可在選曲面板重新播放。');}}}});
$('return-map').addEventListener('click',async e=>{e.preventDefault();if(leaving)return;leaving=true;closeDialogs();$('leave-fade').classList.add('active');const initialVolume=audio.volume,start=performance.now();const fade=now=>{const progress=Math.min(1,(now-start)/600);audio.volume=initialVolume*(1-progress);if(progress<1)requestAnimationFrame(fade);else audio.pause();};requestAnimationFrame(fade);await sound.leave();location.assign($('return-map').href);});
window.addEventListener('pagehide',()=>{audio.pause();sound.suspend();});
window.addEventListener('pageshow',e=>{if(e.persisted){leaving=false;$('leave-fade').classList.remove('active');applySound();if(entered)sound.resume();}});
applyMotion();updateLook();applySound();updateTracks();restoreTracks();loadDefaults();tick();
view.load().then(ok=>{if(ok){$('enter').disabled=false;$('enter').textContent='進入都會陽台';}else{$('load-error').textContent='有一張光景未能載入，請重新整理再試，或先回到地圖。';$('enter').textContent='光景尚未備妥';}});
function loop(now){requestAnimationFrame(loop);if(document.hidden)return;if(now-lastTick>150){lastTick=now;tick(now);}if(entered)view.update(now/1000);}requestAnimationFrame(loop);

import {unifySoundPanel} from './sound-panel.js?v=0.035';
unifySoundPanel();
import {addBalconyPositions} from './balcony-positions.js?v=0.036';
addBalconyPositions(view,{ready:()=>entered&&!leaving,reduced:()=>reduced,onMove:inside=>{setQuiet(false);document.querySelector('.location').firstChild.textContent=inside?'客廳座位':'樹梢上的陽台';toast(inside?'已到客廳，可拖曳環顧；目前為固定暮色試景。':'已回到陽台，恢復原本觀看方向。');}});
