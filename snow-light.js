import {normalizeMinute,mixLight} from './light-clock.js?v=0.017';
export const SNOW_LIGHTS=[
 {minute:0,label:'午夜',weights:[0,0,1],brightness:0.63,saturation:0.86,tint:[47,68,106],tintAlpha:0.018},
 {minute:180,label:'深夜',weights:[0,0,1],brightness:0.54,saturation:0.82,tint:[31,49,85],tintAlpha:0.024},
 {minute:300,label:'黎明前',weights:[0,0,1],brightness:0.65,saturation:0.84,tint:[75,102,140],tintAlpha:0.02},
 {minute:360,label:'晨光',weights:[.35,.65,0],brightness:.85,saturation:.88,tint:[236,214,196],tintAlpha:.03},
 {minute:480,label:'清晨',weights:[.9,.1,0],brightness:.96,saturation:.94,tint:[225,239,253],tintAlpha:.018},
 {minute:600,label:'晴日',weights:[1,0,0],brightness:1,saturation:.98,tint:[255,255,255],tintAlpha:0},
 {minute:720,label:'正午',weights:[1,0,0],brightness:1.025,saturation:1,tint:[255,255,255],tintAlpha:0},
 {minute:840,label:'午後',weights:[.65,.35,0],brightness:.98,saturation:1,tint:[244,228,203],tintAlpha:.015},
 {minute:960,label:'斜陽',weights:[0,1,0],brightness:1,saturation:1,tint:[255,255,255],tintAlpha:0},
 {minute:1080,label:'暮色',weights:[0,.4,.6],brightness:0.72,saturation:0.82,tint:[109,107,141],tintAlpha:0.025},
 {minute:1140,label:'初夜',weights:[0,0,1],brightness:0.78,saturation:0.9,tint:[50,73,112],tintAlpha:0.01},
 {minute:1260,label:'星夜',weights:[0,0,1],brightness:0.7,saturation:0.89,tint:[46,66,103],tintAlpha:0.008}
];
export const SNOW_MOMENTS=[
 {minute:360,label:'晨光',description:'雪峰甦醒，壁爐裡留著溫暖。'},
 {minute:480,label:'清晨',description:'清冷日光照亮積雪，森林漸漸清晰。'},
 {minute:720,label:'正午',description:'晴空下的雪山，陪著一杯熱飲。'},
 {minute:960,label:'斜陽',description:'山稜染上金色，陽光落在毛毯與木桌。'},
 {minute:1080,label:'暮色',description:'窗外轉暗，屋裡的燈火漸漸清楚。'},
 {minute:1260,label:'星夜',description:'雪峰隱入深藍，點點星光與爐邊暖燈陪伴夜晚。'}
];
export function snowLightAtMinute(minute){const m=normalizeMinute(minute);let i=SNOW_LIGHTS.findLastIndex(p=>p.minute<=m);if(i<0)i=SNOW_LIGHTS.length-1;const a=SNOW_LIGHTS[i],b=SNOW_LIGHTS[(i+1)%SNOW_LIGHTS.length],end=b.minute+(i===SNOW_LIGHTS.length-1?1440:0),x=m<a.minute?m+1440:m;return {...mixLight(a,b,(x-a.minute)/(end-a.minute)),label:a.label};}
