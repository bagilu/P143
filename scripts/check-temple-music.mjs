import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {TEMPLE_TRACKS,resolveTempleDefault} from '../temple-music.js';
assert.deepEqual(TEMPLE_TRACKS.map(t=>[t.id,t.name,t.filename]),[
 ['chant','梵音入靜','P143-21.mp3'],['sutra','清心誦語','P143-22.mp3'],['mountain','山寺悠然','P143-23.mp3']
]);
for(const [ok,type,expected]of [[true,'audio/mpeg','Music/P143-21.mp3'],[false,'text/plain',null],[true,'text/html',null]]){
 assert.equal(await resolveTempleDefault('P143-21.mp3',async(url,options)=>{assert.equal(url,'Music/P143-21.mp3');assert.equal(options.method,'HEAD');return{ok,headers:{get:()=>type}};}),expected);
}
assert.equal(await resolveTempleDefault('P143-21.mp3',async()=>{throw Error('offline')}),null);
const source=readFileSync('temple.js','utf8');
const loader=source.slice(source.indexOf('let checkingDefaults=false;'),source.indexOf("$('retry-defaults').addEventListener"));
const elements=new Map();let updates=0;
const tracks=Object.fromEntries(TEMPLE_TRACKS.map(t=>[t.id,{custom:false,url:null}]));
const context={TEMPLE_TRACKS,tracks,resolveTempleDefault:async filename=>filename.endsWith('23.mp3')?null:'Music/'+filename,updateTracks(){updates++},$:id=>{if(!elements.has(id))elements.set(id,{});return elements.get(id)}};
vm.createContext(context);vm.runInContext(loader,context);await vm.runInContext('loadDefaults()',context);
assert.equal(tracks.chant.url,'Music/P143-21.mp3');assert.equal(tracks.mountain.url,null);assert.ok(elements.get('music-pending').textContent.startsWith('1 '));assert.equal(elements.get('retry-defaults').hidden,false);
// An asynchronous availability check must not replace personal music selected in the meantime.
tracks.chant.custom=true;tracks.chant.url='blob:personal';tracks.chant.filename='my.mp3';
context.resolveTempleDefault=async filename=>'Music/'+filename;
await vm.runInContext('loadDefaults()',context);
assert.equal(tracks.chant.url,'blob:personal');assert.equal(tracks.chant.filename,'my.mp3');assert.equal(tracks.chant.defaultSrc,'Music/P143-21.mp3');assert.equal(elements.get('music-pending').hidden,true);assert.equal(updates,2);
console.log('PASS: temple filenames, missing/default availability, HTML and network rejection, retry discovery and personal-file preservation.');
