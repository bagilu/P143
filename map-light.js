import {SolarLightClock,formatMinute} from './solar-light-clock.js?v=0.032';

// Reuse the rooms' day/warm/night weights without changing the authored map geometry.
export function mapLightAtState({weights:[day,warm,night]},nightReady=false){
 const nightOpacity=nightReady?night:0;
 if(nightReady){const daylight=day+warm;[day,warm,night]=daylight?[day/daylight,warm/daylight,0]:[0,1,0];}
 const alpha=warm*.16+night*.28;
 const tint=alpha?[242,168,84].map((c,i)=>(c*warm*.16+[25,67,117][i]*night*.28)/alpha):[0,0,0];
 return {brightness:day+warm*.8+night*.24,saturation:day+warm*.9+night*.65,alpha,tint,nightOpacity};
}

export function startMapLight({clock=new SolarLightClock()}={}){
 const world=document.getElementById('map-world'),note=document.getElementById('map-light-note'),nightImage=document.getElementById('world-night');let timer,nightReady=!!(nightImage?.complete&&nightImage.naturalWidth);
 function update(){
  const frame=clock.sample(),light=mapLightAtState(frame.state,nightReady);
  world.style.setProperty('--map-brightness',light.brightness.toFixed(6));
  world.style.setProperty('--map-saturation',light.saturation.toFixed(6));
  world.style.setProperty('--map-wash',`rgba(${light.tint.map(c=>c.toFixed(3)).join(',')},${light.alpha.toFixed(6)})`);
  world.style.setProperty('--map-night-opacity',light.nightOpacity.toFixed(6));world.dataset.nightReady=String(nightReady);
  world.dataset.lightWeights=frame.state.weights.map(w=>w.toFixed(6)).join(',');
  world.dataset.lightDate=frame.solar.date;
  note.hidden=false;note.textContent=`花蓮時間 ${formatMinute(frame.minute)} · ${frame.label}`;
  note.title=`光景基準：花蓮｜天文推算｜台灣時間（UTC+8） · ${frame.solar.date} · 日出 ${formatMinute(Math.round(frame.solar.sunrise))}／日落 ${formatMinute(Math.round(frame.solar.sunset))}`;
 }
 function stop(){clearInterval(timer);timer=null;}
 function resume(){stop();if(document.hidden)return;update();timer=setInterval(update,1000);}
 document.addEventListener('visibilitychange',resume);
 window.addEventListener('pageshow',resume);
 window.addEventListener('pagehide',stop);
 nightImage?.addEventListener('load',()=>{nightReady=nightImage.naturalWidth>0;update();});
 nightImage?.addEventListener('error',()=>{nightReady=false;update();});
 resume();
}
