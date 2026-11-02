import {normalizeMinute,mixLight} from './light-clock.js?v=0.017';
export const GARDEN_LIGHTS=[
 {minute:0,label:'午夜',weights:[0,0,1],brightness:.78,saturation:.90,tint:[52,73,106],tintAlpha:.012},
 {minute:180,label:'深夜',weights:[0,0,1],brightness:.68,saturation:.84,tint:[35,53,89],tintAlpha:.02},
 {minute:300,label:'黎明前',weights:[0,0,1],brightness:.76,saturation:.86,tint:[92,116,146],tintAlpha:.018},
 {minute:360,label:'晨光',weights:[.7,.2,.1],brightness:.86,saturation:.9,tint:[239,224,197],tintAlpha:.025},
 {minute:480,label:'清晨',weights:[1,0,0],brightness:.96,saturation:.96,tint:[238,247,229],tintAlpha:.012},
 {minute:600,label:'雨後晴光',weights:[1,0,0],brightness:1,saturation:1,tint:[255,255,255],tintAlpha:0},
 {minute:720,label:'正午',weights:[1,0,0],brightness:1.015,saturation:.98,tint:[255,255,255],tintAlpha:0},
 {minute:840,label:'午後',weights:[.7,.3,0],brightness:.98,saturation:.98,tint:[244,231,204],tintAlpha:.015},
 {minute:960,label:'斜陽',weights:[0,1,0],brightness:1,saturation:1,tint:[255,255,255],tintAlpha:0},
 {minute:1080,label:'暮色',weights:[0,.4,.6],brightness:.85,saturation:.9,tint:[133,143,166],tintAlpha:.015},
 {minute:1140,label:'初夜',weights:[0,0,1],brightness:.94,saturation:.95,tint:[255,255,255],tintAlpha:0},
 {minute:1260,label:'廊下夜色',weights:[0,0,1],brightness:.88,saturation:.92,tint:[53,73,109],tintAlpha:.008}
];
export const GARDEN_MOMENTS=[
 {minute:360,label:'晨光',description:'庭園慢慢甦醒，屋簷下留著一點暖光。'},
 {minute:600,label:'雨後晴光',description:'松竹鮮綠，雨後日光落在微暖的木廊。'},
 {minute:720,label:'正午',description:'翠松舒展，一杯茶陪著透亮的庭院。'},
 {minute:960,label:'斜陽',description:'竹影與松影，緩緩走過榻榻米。'},
 {minute:1080,label:'暮色',description:'庭前漸暗，廊下的光柔和起來。'},
 {minute:1260,label:'廊下夜色',description:'松竹沉入深藍，屋簷下留一處安心的暖光。'}
];
export function gardenLightAtMinute(minute){const m=normalizeMinute(minute);let i=GARDEN_LIGHTS.findLastIndex(p=>p.minute<=m);if(i<0)i=GARDEN_LIGHTS.length-1;const a=GARDEN_LIGHTS[i],b=GARDEN_LIGHTS[(i+1)%GARDEN_LIGHTS.length],end=b.minute+(i===GARDEN_LIGHTS.length-1?1440:0),x=m<a.minute?m+1440:m;return {...mixLight(a,b,(x-a.minute)/(end-a.minute)),label:a.label};}
