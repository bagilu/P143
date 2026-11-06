import {normalizeMinute,mixLight} from './light-clock.js?v=0.017';
// Warm interior stays legible throughout the night; moonlit lawn is already in the plate.
export const CHURCH_LIGHTS=[
 {minute:180,label:'月下小室',weights:[0,0,1],brightness:.98,saturation:.98,tint:[40,58,91],tintAlpha:.006},
 {minute:720,label:'庭院日光',weights:[1,0,0],brightness:1,saturation:1,tint:[255,255,255],tintAlpha:0},
 {minute:960,label:'迴廊暮色',weights:[0,1,0],brightness:1,saturation:1,tint:[255,255,255],tintAlpha:0},
 {minute:1260,label:'燈下晚讀',weights:[0,0,1],brightness:.99,saturation:.99,tint:[50,65,95],tintAlpha:.004}
];
export const CHURCH_MOMENTS=[
 {minute:360,label:'日出',description:'晨光穿過石窗，小室與庭院慢慢甦醒。'},
 {minute:480,label:'清晨',description:'石窗透進柔和晨光，書桌留著一盞暖燈。'},
 {minute:720,label:'庭院日光',description:'草地與老樹舒展，書桌留著一盞暖燈。'},
 {minute:960,label:'夕照',description:'日光走過石地，迴廊與草地仍然明亮。'},
 {minute:1020,label:'迴廊暮色',description:'暮色走進庭院，室內的燈光柔和相伴。'},
 {minute:1260,label:'月下小室',description:'月光照著草地與老樹，小室裡仍有安心的暖光。'}
];
export function churchLightAtMinute(minute){const m=normalizeMinute(minute),points=CHURCH_LIGHTS;let i=points.findLastIndex(p=>p.minute<=m);if(i<0)i=points.length-1;const a=points[i],b=points[(i+1)%points.length],end=b.minute+(i===points.length-1?1440:0),x=m<a.minute?m+1440:m;return {...mixLight(a,b,(x-a.minute)/(end-a.minute)),label:a.label};}
