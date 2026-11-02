import {normalizeMinute,mixLight} from './light-clock.js?v=0.017';

// An authored day in this imagined courtyard; plate order is day / warm / night.
// Dawn uses the approved warm morning plate, independently of the seaside moods.
export const TEMPLE_LIGHTS=[
 {minute:0,label:'午夜',weights:[0,0,1],brightness:.82,saturation:.88,tint:[57,72,99],tintAlpha:.02},
 {minute:180,label:'深夜',weights:[0,0,1],brightness:.73,saturation:.84,tint:[38,55,81],tintAlpha:.025},
 {minute:300,label:'黎明前',weights:[0,.04,.96],brightness:.84,saturation:.85,tint:[107,128,151],tintAlpha:.025},
 {minute:360,label:'晨光',weights:[0,1,0],brightness:.88,saturation:.91,tint:[242,217,179],tintAlpha:.025},
 {minute:480,label:'清晨',weights:[.7,.3,0],brightness:.97,saturation:.95,tint:[242,236,216],tintAlpha:.012},
 {minute:600,label:'晴日',weights:[1,0,0],brightness:1.015,saturation:.97,tint:[244,249,255],tintAlpha:.008},
 {minute:720,label:'正午',weights:[1,0,0],brightness:1.045,saturation:1,tint:[255,255,255],tintAlpha:0},
 {minute:840,label:'午後',weights:[.8,.2,0],brightness:.98,saturation:1,tint:[240,221,195],tintAlpha:.018},
 {minute:960,label:'斜陽',weights:[0,1,0],brightness:1.02,saturation:1.03,tint:[247,207,153],tintAlpha:.025},
 {minute:1080,label:'暮色',weights:[0,.6,.4],brightness:.78,saturation:.82,tint:[149,123,148],tintAlpha:.035},
 {minute:1140,label:'初夜',weights:[0,0,1],brightness:1.06,saturation:.96,tint:[107,124,149],tintAlpha:.012},
 {minute:1260,label:'夜深',weights:[0,0,1],brightness:.97,saturation:.94,tint:[255,255,255],tintAlpha:0}
];
export const TEMPLE_MOMENTS=[
 {minute:360,label:'晨光',description:'晨光穿過樹林，禪房裡仍留著暖燈。'},
 {minute:480,label:'清晨',description:'薄霧漸散，庭院的綠意慢慢明亮。'},
 {minute:720,label:'正午',description:'日光照亮庭院，屋簷下留著安靜的陰涼。'},
 {minute:960,label:'斜陽',description:'暖光落在木地板上，山林漸染金色。'},
 {minute:1080,label:'暮色',description:'庭院漸暗，燈光陪著暮色慢慢到來。'},
 {minute:1260,label:'夜深',description:'樹林歸於夜色，佛龕與石燈留下一點暖光。'}
];
export function templeLightAtMinute(minute){const m=normalizeMinute(minute);let i=TEMPLE_LIGHTS.findLastIndex(p=>p.minute<=m);if(i<0)i=TEMPLE_LIGHTS.length-1;const a=TEMPLE_LIGHTS[i],b=TEMPLE_LIGHTS[(i+1)%TEMPLE_LIGHTS.length],end=b.minute+(i===TEMPLE_LIGHTS.length-1?1440:0),x=m<a.minute?m+1440:m;return {...mixLight(a,b,(x-a.minute)/(end-a.minute)),label:a.label};}
