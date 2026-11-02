export const MAP_SIZE={width:1672,height:941};
// Positions refer to the authored photographic landscape, not real coordinates.
export const PLACES=[
 {id:'seaside',number:'01',name:'海邊小屋',english:'Quiet Seaside Cabin',kind:'海岸',x:.318,y:.652,status:'open',href:'seaside.html',icon:'cabin',description:'挑一張唱片，坐下看海。讓海浪、光線與喜歡的音樂，陪你待一會兒。',detail:'海浪 · 黑膠音樂 · 十二時段光景'},
 {id:'temple',number:'02',name:'寂靜寺院',english:'Silent Temple',kind:'山林',x:.496,y:.453,status:'open',href:'temple.html',icon:'temple',description:'坐在禪房，望向山林庭院。讓一盞暖燈、林間微風與悠然鐘聲，陪伴自在停留的片刻。',detail:'山林微風 · 遠處鐘聲 · 隨時光停留'},
 {id:'snow',number:'03',name:'雪山暖屋',english:'Snowbound Cabin',kind:'雪山',x:.815,y:.174,status:'open',href:'snow.html',icon:'mountain',description:'窩在雪線上的暖屋，望著遠山與雪色。讓爐火、一杯熱飲與喜歡的音樂，陪你自在待著。',detail:'壁爐柴火 · 自選音樂 · 十二時段光景'},
 {id:'city',number:'04',name:'都會陽台',english:'City Balcony',kind:'城市',x:.816,y:.741,status:'open',href:'balcony.html',icon:'city',description:'坐在樹梢與屋頂之間。讓一杯飲料、對街窗燈與喜歡的音樂，陪伴屬於自己的片刻。',detail:'陽台微風 · 自選音樂 · 十二時段光景'}
];
export function fitCamera(width,height,compact=false){const scale=(compact?Math.min:Math.max)(width/MAP_SIZE.width,height/MAP_SIZE.height);return constrainCamera({scale,x:(width-MAP_SIZE.width*scale)/2,y:(height-MAP_SIZE.height*scale)/2},width,height);}
export function constrainCamera(camera,width,height){const w=MAP_SIZE.width*camera.scale,h=MAP_SIZE.height*camera.scale;return {...camera,x:w<=width?(width-w)/2:Math.min(0,Math.max(width-w,camera.x)),y:h<=height?(height-h)/2:Math.min(0,Math.max(height-h,camera.y))};}
export function zoomCamera(camera,scale,anchor,width,height){const ratio=scale/camera.scale;return constrainCamera({scale,x:anchor.x-(anchor.x-camera.x)*ratio,y:anchor.y-(anchor.y-camera.y)*ratio},width,height);}

// On a narrow screen, frame all four destinations before the user explores farther.
export function framePlacesCamera(width,height){const xs=PLACES.map(p=>p.x*MAP_SIZE.width),ys=PLACES.map(p=>p.y*MAP_SIZE.height),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys),fit=fitCamera(width,height,true),scale=Math.max(fit.scale,Math.min((width-88)/(right-left),(height-100)/(bottom-top)));return constrainCamera({scale,x:width/2-(left+right)/2*scale,y:height/2-(top+bottom)/2*scale},width,height);}
