export const READING_KEY='p143-reading-hongloumeng-v1';
export const COMPANION_KEY='p143-companion-v1';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function readingState(raw={},chapters=120){return {chapter:clamp(Number.isInteger(raw.chapter)?raw.chapter:0,0,Math.max(0,chapters-1)),paragraph:Math.max(0,Number.isInteger(raw.paragraph)?raw.paragraph:0),offset:clamp(Number.isFinite(raw.offset)?raw.offset:0,0,1),font:clamp(Number.isFinite(raw.font)?raw.font:21,16,30),theme:['paper','night'].includes(raw.theme)?raw.theme:'paper',expanded:raw.expanded===true};}
export function paragraphAnchor(tops,scrollTop){let paragraph=0;for(let i=0;i<tops.length;i++){if(tops[i]<=scrollTop+4)paragraph=i;else break;}const height=(tops[paragraph+1]??tops[paragraph]+100)-tops[paragraph];return {paragraph,offset:clamp((scrollTop-tops[paragraph])/Math.max(1,height),0,1)};}
export function anchorScroll(tops,anchor){if(anchor.paragraph===0&&anchor.offset===0)return 0;const i=clamp(anchor.paragraph,0,Math.max(0,tops.length-1));return (tops[i]??0)+anchor.offset*Math.max(1,(tops[i+1]??tops[i]+100)-tops[i]);}
export function companionFrame(seconds,reduced=false){if(reduced)return {breath:1,blink:0};const t=((seconds%29)+29)%29,blink=t>23&&t<23.58?Math.sin((t-23)/.58*Math.PI)**2:0;return {breath:1+.006*Math.sin(seconds*Math.PI/2.7),blink};}
// Feet are authored on visible floor/rug surfaces. Garden: one clear wood-deck
// spot shared by desktop/mobile and the original photo fallback (124 px wide).
export const CAT_SCALE=.45;
export const CAT_SPOTS={
 garden:{x:930-62/CAT_SCALE,y:698,width:124/CAT_SCALE},
 temple:{x:470,y:790,width:240,compact:{x:850,y:761,width:215}},
 snow:{x:230,y:650,width:190,compact:{x:610,y:769,width:170}},
 balcony:{x:685,y:650,width:150,compact:{x:690,y:650,width:145}},
 entry:{x:405,y:675,width:235,compact:{x:640,y:610,width:190}},
 sofa:{x:515,y:583,width:240,compact:{x:820,y:563,width:210}},
 records:{x:310,y:835,width:240,compact:{x:580,y:835,width:200}},
 window:{x:600,y:710,width:230,compact:{x:690,y:710,width:190}}
};
export function catSpot(room,source,compact=false){let key=room;if(room==='seaside')key=source.includes('sofa-wide')?'sofa':source.includes('records')?'records':source.includes('photo-sofa.')||source.includes('photo-sofa-')?'window':'entry';const base=CAT_SPOTS[key],spot=compact&&base?.compact?base.compact:base;return spot?{...spot,x:spot.x+spot.width*(1-CAT_SCALE)/2,width:spot.width*CAT_SCALE}:undefined;}
export const spreadStride=(width,gap)=>Math.max(1,width+gap);
export const spreadCount=(scrollWidth,width,gap)=>Math.max(1,Math.ceil((scrollWidth+gap-.5)/spreadStride(width,gap)));
export const spreadAt=(x,width,gap,count)=>Math.max(0,Math.min(count-1,Math.floor(Math.max(0,x)/spreadStride(width,gap))));
export function textChunks(text,size=24){let start=0;const chunks=[];let chunk='';for(const char of text){chunk+=char;if([...chunk].length>=size){chunks.push({text:chunk,start});start+=chunk.length;chunk='';}}if(chunk)chunks.push({text:chunk,start});return chunks;}
