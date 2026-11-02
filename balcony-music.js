// User's Suno order: twilight jazz / gentle bossa / ambient piano.
export const BALCONY_TRACKS=[
 {id:'twilight',name:'暮色爵士',english:'Twilight Jazz',style:'溫柔爵士三重奏',description:'看著窗燈亮起，讓鋼琴與輕刷鼓陪你坐一會兒。',filename:'P143-41.mp3'},
 {id:'bossa',name:'微風巴薩',english:'Balcony Bossa',style:'輕柔巴薩諾瓦',description:'吉他的步調，剛好留給一本書與一杯飲料。',filename:'P143-42.mp3'},
 {id:'nocturne',name:'屋頂夜曲',english:'Nocturne Above the Rooftops',style:'柔音鋼琴與氛圍音色',description:'屋頂漸漸安靜，讓音符與夜空之間多留一點空白。',filename:'P143-43.mp3'}
];
// GitHub Pages is case-sensitive; accept both folder spellings without duplicating audio.
export const defaultCandidates=filename=>[`MUSIC/${filename}`,`Music/${filename}`];
export async function resolveDefault(filename,fetcher=fetch){
 for(const src of defaultCandidates(filename)){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);try{const r=await fetcher(src,{method:'HEAD',cache:'no-store',signal:controller.signal});if(r.ok&&!/text\/html/i.test(r.headers.get('content-type')||''))return src;}catch{}finally{clearTimeout(timer);}}
 return null;
}
