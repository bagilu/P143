// Twelve authored moods, based on day / golden-hour / starry-night photographs.
// Times describe the experience; this is not an astronomical lighting simulation.
export const LIGHT_PRESETS=[
 {id:'05',time:'05:00',label:'黎明前',plate:'night',brightness:.93,saturation:.88,tint:'#6685b3',tintAlpha:.025},
 {id:'06',time:'06:00',label:'晨光',plate:'day',brightness:.85,saturation:.84,tint:'#edcba5',tintAlpha:.09},
 {id:'08',time:'08:00',label:'清晨',plate:'day',brightness:.95,saturation:.92,tint:'#f3e7cf',tintAlpha:.025},
 {id:'10',time:'10:00',label:'晴日',plate:'day',brightness:1.025,saturation:.96,tint:'#e9f3ff',tintAlpha:.012},
 {id:'12',time:'12:00',label:'正午',plate:'day',brightness:1.06,saturation:1,tint:'#ffffff',tintAlpha:0},
 {id:'14',time:'14:00',label:'午後',plate:'day',brightness:.97,saturation:1.02,tint:'#ecc9a1',tintAlpha:.055},
 {id:'16',time:'16:00',label:'斜陽',plate:'gold',brightness:1,saturation:1,tint:'#ffffff',tintAlpha:0},
 {id:'18',time:'18:00',label:'暮色',plate:'gold',brightness:.72,saturation:.78,tint:'#986778',tintAlpha:.07},
 {id:'19',time:'19:00',label:'初夜',plate:'night',brightness:1.08,saturation:.96,tint:'#637ea5',tintAlpha:.015},
 {id:'21',time:'21:00',label:'星夜',plate:'night',brightness:1,saturation:1,tint:'#ffffff',tintAlpha:0},
 {id:'00',time:'00:00',label:'午夜',plate:'night',brightness:.88,saturation:.92,tint:'#334869',tintAlpha:.025},
 {id:'03',time:'03:00',label:'深夜',plate:'night',brightness:.79,saturation:.86,tint:'#203959',tintAlpha:.035}
];
export function lightPreset(id){return LIGHT_PRESETS.find(p=>p.id===id)||LIGHT_PRESETS.find(p=>p.id==='16');}
export function litPhotoScene(scene,id){const p=lightPreset(id);return {...scene,src:p.plate==='gold'?scene.src:scene.src.replace('.png',`-${p.plate}.png`)};}
