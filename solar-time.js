import SunCalc from './assets/vendor/suncalc-1.9.0.js';
export const HUALIEN=Object.freeze({id:'hualien',name:'花蓮',latitude:23+58/60+31/3600,longitude:121+36/60+48/3600,timeZone:'Asia/Taipei'});
// Named location/time zone leaves room for later location choices without guessing zones from longitude.
const formatters=new Map(),cache=new Map();
function parts(date,region){let f=formatters.get(region.timeZone);if(!f){f=new Intl.DateTimeFormat('en-CA',{timeZone:region.timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});formatters.set(region.timeZone,f);}return Object.fromEntries(f.formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));}
export function regionalMinute(date=new Date(),region=HUALIEN){const p=parts(date,region);return Number(p.hour)*60+Number(p.minute)+Number(p.second)/60+date.getUTCMilliseconds()/60000;}
export function solarForDate(date=new Date(),region=HUALIEN){
 const p=parts(date,region),key=`${region.id}:${region.latitude}:${region.longitude}:${region.timeZone}:${p.year}-${p.month}-${p.day}`;
 if(cache.has(key))return cache.get(key);
 const desired=Date.UTC(+p.year,+p.month-1,+p.day,12);let noon=desired;
 for(let i=0;i<2;i++){const local=parts(new Date(noon),region),offset=Date.UTC(+local.year,+local.month-1,+local.day,+local.hour,+local.minute,+local.second)-noon;noon=desired-offset;}
 const times=SunCalc.getTimes(new Date(noon),region.latitude,region.longitude,0),sunrise=regionalMinute(times.sunrise,region),sunset=regionalMinute(times.sunset,region);
 if(!Number.isFinite(sunrise)||!Number.isFinite(sunset)||sunrise>=sunset)throw Error('No supported rise/set on this local date');
 const result=Object.freeze({date:`${p.year}-${p.month}-${p.day}`,region:region.id,timeZone:region.timeZone,sunrise,sunset});if(cache.size>=8)cache.delete(cache.keys().next().value);cache.set(key,result);return result;
}
