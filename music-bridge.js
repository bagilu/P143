// Room controllers keep their existing UI; only the outer world owns music playback.
export function worldHost(){try{return parent!==window&&parent.p143World||null;}catch{return null;}}
export function createMusicAudio(){
 const host=worldHost();if(!host)return new Audio();
 const target=new EventTarget();let source='',volume=1,loop=false,preload='metadata';
 const owns=()=>host.music.owner===target;
 Object.defineProperties(target,{
  src:{get:()=>source,set:v=>{source=v?new URL(v,location.href).href:'';}},
  volume:{get:()=>owns()?host.music.audio.volume:volume,set:v=>{volume=Math.max(0,Math.min(1,v));if(owns())host.music.audio.volume=volume;}},
  loop:{get:()=>loop,set:v=>{loop=!!v;if(owns())host.music.audio.loop=loop;}},
  preload:{get:()=>preload,set:v=>{preload=v;}},
  paused:{get:()=>!owns()||host.music.audio.paused},
  currentTime:{get:()=>owns()?host.music.audio.currentTime:0,set:v=>{if(owns())host.music.audio.currentTime=v;}},
  error:{get:()=>owns()?host.music.audio.error:null}
 });
 target.getAttribute=name=>name==='src'?(source||null):null;
 target.removeAttribute=name=>{if(name==='src'){source='';if(owns())host.music.audio.removeAttribute('src');host.refresh();}};
 target.load=()=>{if(owns())host.music.audio.load();};
 target.pause=()=>{if(owns())host.music.audio.pause();};
 target.play=async()=>{host.music.claim(target,window,source,{volume,loop,preload});await host.music.audio.play();host.refresh();};
 const listeners=['play','pause','error','ended','loadedmetadata'].map(type=>{const handler=()=>{if(owns())target.dispatchEvent(new Event(type));};host.music.audio.addEventListener(type,handler);return [type,handler];});
 const updateTitle=()=>{if(owns()){host.music.title=document.getElementById('playing-title')?.textContent||'此刻的音樂';host.refresh();}};
 const observer=new MutationObserver(updateTitle);observer.observe(document.body,{subtree:true,childList:true,characterData:true});
 window.addEventListener('pagehide',()=>{observer.disconnect();for(const [type,handler]of listeners)host.music.audio.removeEventListener(type,handler);},{once:true});
 return target;
}
// Includes the welcome screen's return link, not just the in-room header.
document.addEventListener('click',e=>{const host=worldHost();if(!host||e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;const a=e.target.closest('a[href]');if(!a)return;const url=new URL(a.href,location.href),base=new URL('./',location.href);if(url.origin===base.origin&&(url.pathname===base.pathname||url.pathname===base.pathname+'index.html')){e.preventDefault();e.stopImmediatePropagation();host.showMap();}},{capture:true});
