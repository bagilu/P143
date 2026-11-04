import {formatMinute} from './solar-light-clock.js?v=0.032';
let renderedDate='',moments=[];
export function syncSolarUI(frame,clock,tick,templates=[]){
 let note=document.getElementById('light-location-note');if(!note){note=document.createElement('p');note.id='light-location-note';note.className='subtle';document.getElementById('light-current').after(note);}
 const s=frame.solar;note.textContent=`光景基準：花蓮｜天文推算｜台灣時間（UTC+8） · ${s.date} · 日出 ${formatMinute(Math.round(s.sunrise))}／日落 ${formatMinute(Math.round(s.sunset))}`;
 const container=document.getElementById('light-moments');
 if(container&&renderedDate!==s.date){renderedDate=s.date;const times=[s.sunrise,s.sunrise+90,720,s.sunset-60,s.sunset,s.sunset+60],labels=['日出','上午','正午','夕照','日落','夜色'];moments=templates.map((p,i)=>({...p,minute:Math.round(times[i]),label:labels[i],description:['日出前後各半小時，光景慢慢由暗轉亮。','讓白天的風景陪伴停留。','日光明亮，安靜坐一會兒。','距離日落約一小時，白天即將慢慢收起。','日落前後各半小時，光景慢慢由亮轉暗。','日落後，風景已進入夜色。'][i]}));container.replaceChildren();for(const p of moments){const button=document.createElement('button');button.type='button';button.dataset.moment=p.minute;button.textContent=p.label+' '+formatMinute(p.minute);button.setAttribute('aria-pressed','false');button.addEventListener('click',()=>{clock.select(p.minute);tick();});container.append(button);}}
 return moments;
}
