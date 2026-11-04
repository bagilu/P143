import {FADE_MS,normalizeMinute,mixLight,lightAtMinute,formatMinute} from './light-clock.js?v=0.017';
import {HUALIEN,regionalMinute,solarForDate} from './solar-time.js?v=0.032';
export {formatMinute};
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function solarLightAtMinute(minute,atMinute=lightAtMinute,date=new Date(),region=HUALIEN){
 const solar=solarForDate(date,region),m=normalizeMinute(minute),dark={...atMinute(180),weights:[0,0,1]},day={...atMinute(720),weights:[1,0,0]},warm={...atMinute(960),weights:[0,1,0],brightness:(dark.brightness+day.brightness)/2,saturation:(dark.saturation+day.saturation)/2};
 let value,label;
 if(m<solar.sunrise-30||m>=solar.sunset+30){value=dark;label='夜色';}
 else if(m<=solar.sunrise+30){const t=(m-solar.sunrise+30)/60;value=t<=.5?mixLight(dark,warm,smooth(t*2)):mixLight(warm,day,smooth(t*2-1));label='日出漸亮';}
 else if(m<solar.sunset-30){value=day;label='日間';}
 else{const t=(m-solar.sunset+30)/60;value=t<=.5?mixLight(day,warm,smooth(t*2)):mixLight(warm,dark,smooth(t*2-1));label='日落漸暗';}
 return {...value,label};
}
export class SolarLightClock{
 constructor(date=new Date(),atMinute=lightAtMinute,region=HUALIEN){this.rawAtMinute=atMinute;this.region=region;this.date=date;this.follow=true;this.minute=regionalMinute(date,region);this.fade=null;this.current=this.atMinute(this.minute);}
 atMinute(minute){return solarLightAtMinute(minute,this.rawAtMinute,this.date,this.region);}
 select(minute){this.follow=false;this.minute=normalizeMinute(minute);this.fade=null;this.current=this.atMinute(this.minute);}
 followNow(now=performance.now(),date=new Date()){this.sample(now,date);this.follow=true;this.date=date;this.minute=regionalMinute(date,this.region);this.fade={start:now,from:this.current};}
 sample(now=performance.now(),date=new Date()){
  if(this.follow){this.date=date;this.minute=regionalMinute(date,this.region);}
  const target=this.atMinute(this.minute);let progress=1;
  if(this.fade){progress=Math.min(1,Math.max(0,(now-this.fade.start)/FADE_MS));this.current=mixLight(this.fade.from,target,smooth(progress));if(progress===1)this.fade=null;}else this.current=target;
  return {state:this.current,minute:this.minute,follow:this.follow,progress,transitioning:!!this.fade,label:target.label,solar:solarForDate(this.date,this.region)};
 }
}
