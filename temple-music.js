// Preserve chant/sutra keys so existing personal recordings survive this upgrade.
export const TEMPLE_TRACKS=[
 {id:'chant',name:'梵音入靜',description:'悠遠梵音，讓心緒慢慢安定。',filename:'P143-21.mp3'},
 {id:'sutra',name:'清心誦語',description:'清朗柔和的誦念，陪伴片刻休憩。',filename:'P143-22.mp3'},
 {id:'mountain',name:'山寺悠然',description:'山林環抱古寺，無須趕路，自在停留。',filename:'P143-23.mp3'}
];
export async function resolveTempleDefault(filename,fetcher=fetch){
 const src='Music/'+filename,controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
 try{const response=await fetcher(src,{method:'HEAD',cache:'no-store',signal:controller.signal});return response.ok&&!/text\/html/i.test(response.headers.get('content-type')||'')?src:null;}
 catch{return null;}finally{clearTimeout(timer);}
}
