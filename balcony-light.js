import {normalizeMinute,mixLight} from './light-clock.js?v=0.017';
export const BALCONY_LIGHTS=[
 {minute:0,label:'午夜',weights:[0,0,1],brightness:0.6,saturation:0.85,tint:[40,60,102],tintAlpha:0.02},
 {minute:180,label:'深夜',weights:[0,0,1],brightness:0.52,saturation:0.8,tint:[27,43,80],tintAlpha:0.025},
 {minute:300,label:'黎明前',weights:[0,0,1],brightness:0.64,saturation:0.83,tint:[74,98,137],tintAlpha:0.02},
 {minute:360,label:'晨光',weights:[.65,.1,.25],brightness:.88,saturation:.86,tint:[235,221,215],tintAlpha:.03},
 {minute:480,label:'清晨',weights:[1,0,0],brightness:.95,saturation:.93,tint:[233,242,252],tintAlpha:.018},
 {minute:600,label:'晴日',weights:[1,0,0],brightness:1,saturation:.98,tint:[255,255,255],tintAlpha:0},
 {minute:720,label:'正午',weights:[1,0,0],brightness:1.025,saturation:1,tint:[255,255,255],tintAlpha:0},
 {minute:840,label:'午後',weights:[1,0,0],brightness:1,saturation:.98,tint:[250,227,194],tintAlpha:.025},
 {minute:960,label:'斜陽',weights:[.75,.25,0],brightness:.98,saturation:1,tint:[251,214,172],tintAlpha:.04},
 {minute:1080,label:'暮色',weights:[0,1,0],brightness:1,saturation:1,tint:[255,255,255],tintAlpha:0},
 {minute:1140,label:'初夜',weights:[0,.2,.8],brightness:0.76,saturation:0.88,tint:[46,67,110],tintAlpha:0.012},
 {minute:1260,label:'夜讀',weights:[0,0,1],brightness:0.68,saturation:0.87,tint:[40,61,101],tintAlpha:0.01}
];
export const BALCONY_MOMENTS=[
 {minute:360,label:'晨光',description:'城市慢慢醒來，樹梢迎著第一道光。'},
 {minute:480,label:'清晨',description:'對街的屋頂清晰起來，陽台留著早晨的空氣。'},
 {minute:720,label:'正午',description:'日光落在藤椅與書頁，一杯飲料剛剛好。'},
 {minute:960,label:'斜陽',description:'屋頂帶上暖色，午後可以再慢一點。'},
 {minute:1080,label:'暮色',description:'天空轉藍，一扇扇窗燈在對街亮起。'},
 {minute:1260,label:'夜讀',description:'屋頂沉入夜色，天空留著星光，這裡留一盞燈給自己。'}
];
export function balconyLightAtMinute(minute){const m=normalizeMinute(minute);let i=BALCONY_LIGHTS.findLastIndex(p=>p.minute<=m);if(i<0)i=BALCONY_LIGHTS.length-1;const a=BALCONY_LIGHTS[i],b=BALCONY_LIGHTS[(i+1)%BALCONY_LIGHTS.length],end=b.minute+(i===BALCONY_LIGHTS.length-1?1440:0),x=m<a.minute?m+1440:m;return {...mixLight(a,b,(x-a.minute)/(end-a.minute)),label:a.label};}
