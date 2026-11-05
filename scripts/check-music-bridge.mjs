import assert from 'node:assert/strict';
class Media extends EventTarget{constructor(){super();this.paused=true;this.volume=1;this.currentTime=0;this.src='';}async play(){this.paused=false;this.dispatchEvent(new Event('play'));}pause(){this.paused=true;this.dispatchEvent(new Event('pause'));}removeAttribute(){this.src='';}load(){}}
const audio=new Media(),host={refresh(){},music:{audio,owner:null,claim(owner,win,src,s){if(this.owner!==owner||audio.src!==src){audio.pause();this.owner=owner;audio.src=src;}audio.volume=s.volume;audio.loop=s.loop;}}};
globalThis.window=new EventTarget();globalThis.parent={p143World:host};globalThis.document={body:{},addEventListener(){},getElementById(){return null;}};globalThis.location={href:'https://example.test/P143/snow.html'};globalThis.MutationObserver=class{observe(){}disconnect(){}};
const {createMusicAudio}=await import('../music-bridge.js');
const first=createMusicAudio();first.src='Music/song.mp3';first.volume=.25;first.loop=true;let events=0;first.addEventListener('play',()=>events++);await first.play();assert.equal(events,1);assert.equal(audio.src,'https://example.test/P143/Music/song.mp3');assert.equal(audio.volume,.25);audio.currentTime=42;
const pending=createMusicAudio();pending.volume=.8;pending.pause();pending.removeAttribute('src');assert.equal(audio.paused,false);assert.equal(audio.volume,.25);assert.equal(first.currentTime,42);
first.pause();assert.equal(audio.paused,true);await first.play();assert.equal(audio.currentTime,42);
pending.src='blob:https://example.test/local-file';await pending.play();assert.equal(audio.src,pending.src);assert.equal(audio.volume,.8);assert.equal(first.paused,true);first.pause();assert.equal(audio.paused,false);assert.equal(pending.paused,false);
console.log('PASS: one shared media owner, dormant-room isolation, retained progress/volume, event forwarding and local blob source.');
