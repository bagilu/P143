// Authored, quiet stars in the existing photographic sky, never on roofs or mountains.
// These are visual accents for the imagined places, not an astronomical star map.
const NS='http://www.w3.org/2000/svg';let serial=0;
const el=(tag,attrs={})=>{const node=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))node.setAttribute(k,v);return node;};
export const NIGHT_SKIES={
 snow:{count:44,seed:1433,polygon:[[540,150],[1326,36],[1326,101],[1250,115],[1195,96],[1135,115],[1090,100],[1035,132],[990,120],[938,130],[890,116],[836,149],[792,117],[759,128],[712,169],[660,181],[609,171],[540,198]]},
 balcony:{count:30,seed:1434,polygon:[[12,12],[876,12],[933,94],[946,94],[946,218],[815,242],[700,250],[598,245],[500,234],[399,238],[300,220],[210,184],[154,164],[12,136]]},
 balconyWide:{count:30,seed:1434,polygon:[[12,12],[745,12],[784,70],[810,70],[810,205],[720,223],[600,212],[510,207],[420,197],[340,174],[270,151],[200,132],[140,113],[12,96]]},
 temple:{count:0,seed:1432,polygon:[]}
};
export function insideSky(x,y,polygon){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function skyStars(kind){const s=NIGHT_SKIES[kind];if(!s||!s.count)return [];let seed=s.seed;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},xs=s.polygon.map(p=>p[0]),ys=s.polygon.map(p=>p[1]),left=Math.min(...xs),top=Math.min(...ys),width=Math.max(...xs)-left,height=Math.max(...ys)-top,stars=[];
 for(let attempt=0;attempt<5000&&stars.length<s.count;attempt++){const x=left+random()*width,y=top+random()*height;if(!insideSky(x,y,s.polygon)||stars.some(p=>Math.hypot(x-p.x,y-p.y)<15))continue;stars.push({x,y,r:.4+random()*.5,opacity:.30+random()*.42,warm:random()>.83});}return stars;
}
export const starVisibility=weights=>Math.max(0,Math.min(1,Number(weights[2])||0))**2;
export class NightSky{
 constructor(svg,kind){this.group=el('g',{'pointer-events':'none','aria-hidden':'true','data-effect':'night-stars',opacity:0});const stars=skyStars(kind);this.count=stars.length;if(stars.length){const id=`night-sky-${++serial}`,defs=el('defs'),clip=el('clipPath',{id});clip.append(el('polygon',{points:NIGHT_SKIES[kind].polygon.map(p=>p.join(',')).join(' ')}));defs.append(clip);svg.append(defs);this.group.setAttribute('clip-path',`url(#${id})`);for(const s of stars){if(s.r>.8)this.group.append(el('circle',{cx:s.x,cy:s.y,r:s.r*2.2,fill:'#d5e3fa',opacity:.07}));this.group.append(el('circle',{cx:s.x.toFixed(3),cy:s.y.toFixed(3),r:s.r.toFixed(3),fill:s.warm?'#f4e4d0':'#dbe9fa',opacity:s.opacity.toFixed(3)}));}}svg.append(this.group);}
 setLight(state){this.group.setAttribute('opacity',starVisibility(state.weights).toFixed(6));}
}
