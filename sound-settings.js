export function parseSoundSettings(raw){
 let value={};try{value=JSON.parse(raw)||{};}catch{}
 const volume=(v,fallback)=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):fallback;
 return {seaVolume:volume(value.seaVolume,.35),musicVolume:volume(value.musicVolume,.5),muted:value.muted===true,oceanMotion:value.oceanMotion!==false,waveStrength:volume(value.waveStrength,.7)};
}
