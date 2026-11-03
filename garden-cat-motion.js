// Fixed-place behaviour for the garden photographic companion.
import {catSpot} from './reading-model.js?v=0.030';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const random=seed=>{let x=(seed+14329)|0;x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};
export function quietCatAt(seconds,reduced=false){
 const t=Math.max(0,Number.isFinite(seconds)?seconds:0),cycle=Math.floor(t/83),p=t%83,start=29+random(cycle*7919)*17;
 let action='rest',amount=0,index=0;
 if(!reduced){
  if(p>=start&&p<start+11){const u=(p-start)/11;amount=smooth(u/.23)*smooth((1-u)/.23);index=cycle%2===0?1:2;action=index===1?'look-out':'look-at-you';}
  else for(const blink of [9+random(cycle*7919+7)*3,65+random(cycle*7919+19)*3])if(p>=blink&&p<blink+.48){amount=Math.sin((p-blink)/.48*Math.PI)**2;index=3;action='blink';break;}
 }
 const weights=[1-amount,0,0,0];weights[index]+=amount;
 return{action,amount,weights,breath:reduced?1:1+.0035*Math.sin(t*Math.PI/2.9)**2};
}
export function gardenCatPlacement(compact=false){const spot=catSpot('garden','',compact),width=spot.width,height=width/2,center=spot.x+width/2,feet=spot.y;return{x:spot.x,y:feet-height*.95,width,height,center,feet};}
export function catLighting(weights){const w=[0,1,2].map(i=>Math.max(0,Number.isFinite(weights[i])?weights[i]:0)),sum=w.reduce((a,b)=>a+b,0),[day,gold,night]=sum?w.map(x=>x/sum):[1,0,0];return{brightness:day*.8+gold*.67+night*.3,warmth:gold*.065+night*.02,shadowX:-14*day-26*gold+5*night,shadowY:5*day+8*gold+3*night,shadowOpacity:.30*day+.36*gold+.18*night};}
