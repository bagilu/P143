export const CHURCH_TRACKS=[
 {
  "id": "dawn",
  "name": "晨光聖詠",
  "english": "Chant at First Light",
  "description": "清澈的詠唱，如晨光穿過石窗，陪心緒慢慢安定。",
  "filename": "P143-61.mp3"
 },
 {
  "id": "choir",
  "name": "迴廊和聲",
  "english": "Voices in the Cloister",
  "description": "聲聲和音沿著迴廊舒展，讓片刻停留，多一點溫暖。",
  "filename": "P143-62.mp3"
 },
 {
  "id": "vespers",
  "name": "晚禱餘音",
  "english": "Echoes of Evening Prayer",
  "description": "管風琴與人聲輕輕相伴，把一天的紛擾留在遠處。",
  "filename": "P143-63.mp3"
 }
];
export async function resolveChurchDefault(filename,fetcher=fetch){
 const src='Music/'+filename,controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
 try{const response=await fetcher(src,{method:'HEAD',cache:'no-store',signal:controller.signal});return response.ok&&!/text\/html/i.test(response.headers.get('content-type')||'')?src:null;}
 catch{return null;}finally{clearTimeout(timer);}
}
