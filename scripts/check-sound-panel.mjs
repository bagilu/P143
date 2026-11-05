import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
for(const scene of ['snow','balcony','garden','temple']){
 const source=readFileSync(scene+'.js','utf8');
 const match=source.match(/\$\(id\+'-play'\)\.addEventListener\('click',async\(\)=>\{([\s\S]*?)\}\);/);
 assert.ok(match,scene);
 let stopped=0;const audio={paused:false,currentTime:42,pause(){this.paused=true},async play(){this.paused=false}};
 const context={t:{url:'sample'},id:'one',activeTrack:'one',audio,updateTracks(){},stopTrack(){stopped++},$:()=>({textContent:''})};
 vm.createContext(context);const handler=vm.runInContext('(async()=>{'+match[1]+'})',context);
 await handler();assert.equal(audio.paused,true);assert.equal(audio.currentTime,42);await handler();assert.equal(audio.paused,false);assert.equal(audio.currentTime,42);assert.equal(stopped,0);
 assert.ok(source.includes('activeTrack&&resumeMusic'),scene+' preserves user pause on visibility restore');
}
for(const scene of ['seaside','snow','balcony','garden','temple']){
 const html=readFileSync(scene+'.html','utf8');assert.ok(html.includes('sound-panel.css?v=0.042'));
 const js=readFileSync(scene==='seaside'?'app.js':scene+'.js','utf8');assert.ok(js.includes('unifySoundPanel();'));
}
console.log('PASS: four audio controllers pause/resume at retained position, visibility restore respects pause, all five scenes load shared panel.');
