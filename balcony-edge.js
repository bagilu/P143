export const POSITION_ORDER=['balcony','living','kitchen','bedroom'];
export const EDGE_THRESHOLD=90;
export function edgeStep(state,{gaze,dx,dy,invertX,width,index}){
 const scale=Math.max(480,width),travel=dx*(invertX?-1:1),raw=gaze+travel/scale;
 const overflow=(raw>1?raw-1:raw<0?raw:0)*scale;
 if(Math.abs(dy)>Math.abs(dx)*1.25)return {pull:0};
 if(!overflow)return {pull:0};
 const direction=Math.sign(overflow);
 if(index+direction<0||index+direction>=POSITION_ORDER.length)return {pull:0};
 return {pull:(Math.sign(state.pull)===direction?state.pull:0)+overflow};
}
