import {GARDEN_TRACKS} from './garden-music.js?v=0.027';
import {LightClock,formatMinute} from './light-clock.js?v=0.017';
import {gardenLightAtMinute,GARDEN_MOMENTS} from './garden-light.js?v=0.023';
import {GardenView} from './garden-scene.js?v=0.023';
import {TempleAudio} from './temple-audio.js?v=0.017';
import {readLookSettings,describeLookSettings} from './look-controls.js?v=0.013';

const $=id=>document.getElementById(id),stage=$('garden-stage'),view=new GardenView($('garden-view')),clock=new LightClock(new Date(),gardenLightAtMinute),sound=new TempleAudio();
const reduceMedia=matchMedia('(prefers-reduced-motion: reduce)');
let saved={};try{saved=JSON.parse(localStorage.getItem('p143-garden-settings-v1'))||{};}catch{}
const level=(value,fallback)=>typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(1,value)):fallback;
const look=readLookSettings();for(const key of ['invertX','invertY'])if(typeof saved[key]==='boolean')look[key]=saved[key];
let wind=level(saved.wind,.06),bells=level(saved.bells,.10),recordingVolume=level(saved.recordingVolume,.25),muted=saved.muted===true,foliage=saved.foliage!==false,reduced=typeof saved.reduced==='boolean'?saved.reduced:reduceMedia.matches;

let entered=false,quiet=false,leaving=false,pointer=null,lastTick=-Infinity,toastTimer,visibilityRevision=0;
const audio=new Audio();audio.loop=true;audio.preload='metadata';
let activeTrack=null,playToken=0,dbPromise,writeQueue=Promise.resolve();
const tracks=Object.fromEntries(GARDEN_TRACKS.map(t=>[t.id,{...t,defaultSrc:'Music/'+t.filename,url:'Music/'+t.filename,custom:false,revision:0}]));
function toast(text){$('hint').textContent=text;$('hint').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('hint').classList.remove('visible'),4500);}
function save(){try{localStorage.setItem('p143-garden-settings-v1',JSON.stringify({windDefaultVersion:2,wind,bells,recordingVolume,muted,foliage,reduced,...look}));}catch{}}
function setQuiet(value){quiet=value;document.body.classList.toggle('quiet',value);document.querySelectorAll('.hud').forEach(el=>el.inert=value);$('wake').hidden=!value;if(value)stage.focus({preventScroll:true});}
function applySound(){sound.setLevels(wind,bells,muted);audio.volume=muted?0:recordingVolume;$('mute').textContent=muted?'恢復聲音':'全部靜音';}
function applyMotion(){view.setMotion(foliage&&!reduced);$('foliage-motion').checked=foliage;$('foliage-motion').disabled=reduced;$('reduce-motion').checked=reduced;}
function updateLook(){$('invert-look-x').checked=look.invertX;$('invert-look-y').checked=look.invertY;$('drag-direction').textContent=describeLookSettings(look);}
function tick(now=performance.now()){const frame=clock.sample(now),time=formatMinute(frame.minute);view.setLight(frame);$('light-label').textContent=time;$('light-current').textContent=time+' · '+frame.label+' · '+(frame.follow?'跟隨現在':'手動暫停');$('light-follow').checked=frame.follow;if(document.activeElement!==$('light-time'))$('light-time').value=Math.floor(frame.minute);$('light-time-value').textContent=time;$('light-time').setAttribute('aria-valuetext',time);$('light-status').textContent=frame.transitioning?`正在平順接回現在的光景 · 約 ${Math.max(1,Math.ceil((1-frame.progress)*5))} 分鐘後完成。`:frame.follow?'跟隨裝置當地時間，光景以 5 分鐘平順漸變。':'已停在選定時刻；聲音仍可繼續播放。';document.body.dataset.timeMode=frame.follow?'auto':'manual';for(const button of document.querySelectorAll('[data-moment]'))button.setAttribute('aria-pressed',String(!frame.follow&&Number(button.dataset.moment)===Math.floor(frame.minute)));const moment=GARDEN_MOMENTS.find(p=>p.minute===Math.floor(frame.minute));$('moment-description').textContent=moment?.description||'拖曳時間，看看松竹與木廊如何隨光改變。';}
function openDialog(id){setQuiet(false);$(id).showModal();}
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
for(const button of document.querySelectorAll('.close'))button.addEventListener('click',()=>button.closest('dialog').close());
for(const id of ['light','sound','help'])$(id+'-button').addEventListener('click',()=>{tick();openDialog(id);});
$('sit-button').addEventListener('click',()=>setQuiet(true));$('wake').addEventListener('click',()=>setQuiet(false));
for(const moment of GARDEN_MOMENTS){const button=document.createElement('button');button.type='button';button.dataset.moment=moment.minute;button.textContent=moment.label+' '+formatMinute(moment.minute);button.setAttribute('aria-pressed','false');button.addEventListener('click',()=>{clock.select(moment.minute);tick();});$('light-moments').append(button);}
$('light-time').addEventListener('input',e=>{clock.select(Number(e.target.value));tick();});
$('light-follow').addEventListener('change',e=>{if(e.target.checked)clock.followNow();else clock.select(clock.minute);tick();});
for(const[id,read,set]of [['wind',()=>wind,v=>wind=v],['bell',()=>bells,v=>bells=v],['chant',()=>recordingVolume,v=>recordingVolume=v]]){const slider=$(id+'-volume');slider.value=Math.round(read()*100);$(id+'-value').textContent=slider.value+'%';slider.addEventListener('input',()=>{set(Number(slider.value)/100);$(id+'-value').textContent=slider.value+'%';applySound();save();});}
$('mute').addEventListener('click',()=>{muted=!muted;applySound();save();});
$('bell-test').addEventListener('click',async()=>{if(!sound.active&&entered)await sound.resume();if(!sound.ring())toast(muted?'目前已全部靜音。':bells<=0?'請先調高鐘聲音量。':'目前無法播放鐘聲，可重新進入庭園再試。');});
for(const[axis,key]of [['x','invertX'],['y','invertY']])$('invert-look-'+axis).addEventListener('change',e=>{look[key]=e.target.checked;updateLook();save();});
$('foliage-motion').addEventListener('change',e=>{foliage=e.target.checked;applyMotion();save();});
$('reduce-motion').addEventListener('change',e=>{reduced=e.target.checked;applyMotion();save();});
reduceMedia.addEventListener('change',e=>{let explicit=false;try{explicit=typeof JSON.parse(localStorage.getItem('p143-garden-settings-v1'))?.reduced==='boolean';}catch{}if(!explicit){reduced=e.matches;applyMotion();}});
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

function openDB(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open('p143-garden-audio',1);req.onupgradeneeded=()=>req.result.createObjectStore('tracks');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});return dbPromise;}
function persistTrack(id,value){const operation=writeQueue.catch(()=>{}).then(async()=>{const db=await openDB();await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite');if(value)tx.objectStore('tracks').put(value,id);else tx.objectStore('tracks').delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});});writeQueue=operation;return operation;}
function updateTracks(){for(const[id,t]of Object.entries(tracks)){$(id+'-name').textContent=t.filename;$(id+'-play').disabled=!t.url;$(id+'-reset').disabled=!t.custom;$(id+'-play').textContent=activeTrack===id?'停止'+t.name:'播放'+t.name;document.querySelector(`[data-track="${id}"]`).classList.toggle('playing',activeTrack===id);}document.body.dataset.playing=activeTrack||'none';}
function stopTrack(){playToken++;audio.pause();audio.removeAttribute('src');audio.load();activeTrack=null;updateTracks();}
function bindTrack(id,blob,name){const t=tracks[id];if(activeTrack===id)stopTrack();if(t.custom&&t.url)URL.revokeObjectURL(t.url);t.url=URL.createObjectURL(blob);t.custom=true;t.filename=name;updateTracks();}
async function restoreTracks(){const revisions=Object.fromEntries(Object.entries(tracks).map(([id,t])=>[id,t.revision]));try{const db=await openDB();await Promise.all(Object.keys(tracks).map(id=>new Promise(resolve=>{const req=db.transaction('tracks').objectStore('tracks').get(id);req.onsuccess=()=>{if(req.result?.blob instanceof Blob&&tracks[id].revision===revisions[id])bindTrack(id,req.result.blob,req.result.name);resolve();};req.onerror=resolve;})));}catch{$('track-status').textContent='此瀏覽器無法保存音檔；仍可在本次停留選擇播放。';}}
for(const[id,t]of Object.entries(tracks)){
 $(id+'-file').addEventListener('change',async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(!file.type.startsWith('audio/')&&!/\.(mp3|m4a|wav|ogg|flac|aac|opus|webm)$/i.test(file.name)){toast('請選擇 MP3 或其他音訊檔案。');return;}const revision=++t.revision;bindTrack(id,file,file.name);$('track-status').textContent='正在保存音檔…';try{await persistTrack(id,{blob:file,name:file.name});if(t.revision===revision)$('track-status').textContent='已保存在這個瀏覽器；按播放即可聆聽。';}catch{if(t.revision===revision)$('track-status').textContent='本次可播放；此瀏覽器未能保存音檔。';}});
 $(id+'-play').addEventListener('click',async()=>{if(!t.url)return;if(activeTrack===id){stopTrack();return;}stopTrack();const token=++playToken;activeTrack=id;audio.src=t.url;applySound();updateTracks();try{await audio.play();if(token!==playToken)return;$('track-status').textContent='正在循環播放'+t.name+'。';}catch{if(token!==playToken)return;activeTrack=null;updateTracks();$('track-status').textContent='無法播放此音檔，請換一個音檔再試。';}});
 $(id+'-reset').addEventListener('click',async()=>{const revision=++t.revision;if(activeTrack===id)stopTrack();if(t.custom&&t.url)URL.revokeObjectURL(t.url);t.url=t.defaultSrc;t.custom=false;t.filename=GARDEN_TRACKS.find(track=>track.id===id).filename;updateTracks();try{await persistTrack(id,null);if(t.revision===revision)$('track-status').textContent='已恢復預設音樂。';}catch{if(t.revision===revision)$('track-status').textContent='本次已恢復預設；瀏覽器未能保存變更，下次可能需再次恢復。';}});
}
audio.addEventListener('error',()=>{if(activeTrack){activeTrack=null;updateTracks();$('track-status').textContent='無法讀取此音檔，請重新選擇。';}});

$('enter').addEventListener('click',async()=>{if(entered)return;entered=true;document.body.classList.add('entered');$('welcome').classList.add('leaving');stage.focus();applySound();const ok=await sound.start();if(document.hidden)await sound.suspend();if(!ok){$('audio-status').textContent='目前無法啟動環境聲；仍可播放音樂。';$('bell-test').disabled=true;}else $('audio-status').textContent='可分別調整微風與鐘聲，或將音量設為零。';toast('坐一會兒，松風與竹影會陪著你。');});
document.addEventListener('visibilitychange',async()=>{if(!entered||leaving)return;const revision=++visibilityRevision;if(document.hidden){audio.pause();await sound.suspend();}else{if(clock.follow)clock.followNow();tick();await sound.resume();if(revision!==visibilityRevision||document.hidden){if(document.hidden)await sound.suspend();return;}if(activeTrack){try{await audio.play();}catch{activeTrack=null;updateTracks();toast('錄音已暫停，可在聲音面板重新播放。');}}}});
$('return-map').addEventListener('click',async e=>{e.preventDefault();if(leaving)return;leaving=true;closeDialogs();$('leave-fade').classList.add('active');const initialVolume=audio.volume,start=performance.now();const fade=now=>{const progress=Math.min(1,(now-start)/600);audio.volume=initialVolume*(1-progress);if(progress<1)requestAnimationFrame(fade);else audio.pause();};requestAnimationFrame(fade);await sound.leave();location.assign($('return-map').href);});
window.addEventListener('pagehide',()=>{audio.pause();sound.suspend();});
window.addEventListener('pageshow',e=>{if(e.persisted){leaving=false;$('leave-fade').classList.remove('active');applySound();if(entered)sound.resume();}});
applyMotion();updateLook();applySound();updateTracks();restoreTracks();tick();
view.load().then(ok=>{if(ok){$('enter').disabled=false;$('enter').textContent='進入松風庭園';}else{$('load-error').textContent='有一張光景未能載入，請重新整理再試，或先回到心圖。';$('enter').textContent='光景尚未備妥';}});
function loop(now){requestAnimationFrame(loop);if(document.hidden)return;if(now-lastTick>150){lastTick=now;tick(now);}if(entered)view.update(now/1000);}requestAnimationFrame(loop);
