import {LIGHT_PRESETS} from './light-scenes.js';
export const FADE_MS=5*60*1000;
export const normalizeMinute=m=>((m%1440)+1440)%1440;
export const localMinute=(date=new Date())=>date.getHours()*60+date.getMinutes()+date.getSeconds()/60+date.getMilliseconds()/60000;
export function formatMinute(minute){const m=Math.floor(normalizeMinute(minute));return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;}
const keys=[...LIGHT_PRESETS].sort((a,b)=>Number(a.id)-Number(b.id));
const color=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const mix=(a,b,t)=>a+(b-a)*t;
export function mixLight(a,b,t){return {weights:a.weights.map((v,i)=>mix(v,b.weights[i],t)),brightness:mix(a.brightness,b.brightness,t),saturation:mix(a.saturation,b.saturation,t),tint:a.tint.map((v,i)=>mix(v,b.tint[i],t)),tintAlpha:mix(a.tintAlpha,b.tintAlpha,t)};}
const state=p=>({weights:['day','gold','night'].map(v=>Number(p.plate===v)),brightness:p.brightness,saturation:p.saturation,tint:color(p.tint),tintAlpha:p.tintAlpha});
// Cyclic interpolation keeps midnight, dawn and dusk continuous. Stars remain the
// only photographic plate from 19:00 through 05:00; dawn blends from 05:00 to 06:00.
export function lightAtMinute(minute){const m=normalizeMinute(minute);let i=keys.findLastIndex(p=>Number(p.id)*60<=m);if(i<0)i=keys.length-1;const a=keys[i],b=keys[(i+1)%keys.length],start=Number(a.id)*60,end=Number(b.id)*60+(i===keys.length-1?1440:0),x=m<start?m+1440:m;const t=(x-start)/(end-start);return {...mixLight(state(a),state(b),t),label:a.label};}
const smooth=t=>t*t*(3-2*t);
// Automatic time advances through continuous five-minute lighting intervals.
// Manual previews use the exact requested minute without any temporal easing.
export function automaticLightAtMinute(minute,atMinute=lightAtMinute){const m=normalizeMinute(minute),span=FADE_MS/60000,start=Math.floor(m/span)*span;return mixLight(atMinute(start),atMinute(start+span),smooth((m-start)/span));}
export class LightClock{
 constructor(date=new Date(),atMinute=lightAtMinute){this.atMinute=atMinute;this.follow=true;this.minute=localMinute(date);this.current=automaticLightAtMinute(this.minute,this.atMinute);this.fade=null;}
 select(minute){this.follow=false;this.minute=normalizeMinute(minute);this.fade=null;this.current=this.atMinute(this.minute);}
 followNow(now=performance.now(),date=new Date()){this.sample(now,date);this.follow=true;this.minute=localMinute(date);this.fade={start:now,from:this.current};}
 sample(now=performance.now(),date=new Date()){
  if(this.follow)this.minute=localMinute(date);
  const target=this.follow?automaticLightAtMinute(this.minute,this.atMinute):this.atMinute(this.minute);let progress=1;
  if(this.fade){progress=Math.min(1,Math.max(0,(now-this.fade.start)/FADE_MS));this.current=mixLight(this.fade.from,target,smooth(progress));if(progress===1)this.fade=null;}else this.current=target;
  return {state:this.current,minute:this.minute,follow:this.follow,progress,transitioning:!!this.fade,label:this.atMinute(this.minute).label};
 }
}
