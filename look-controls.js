export const DEFAULT_LOOK_SETTINGS=Object.freeze({invertX:false,invertY:false});
export const LOOK_LIMITS=Object.freeze({minPitch:-.64,maxPitch:.66});

// Screen coordinates increase to the right and down. The default maps a
// pointer motion to a look direction: up -> look up, right -> look right.
export function applyDragLook(yaw,pitch,dx,dy,settings=DEFAULT_LOOK_SETTINGS){
 const horizontal=settings.invertX?-1:1;
 const vertical=settings.invertY?-1:1;
 return {
  yaw:yaw-dx*.0032*horizontal,
  pitch:Math.max(LOOK_LIMITS.minPitch,Math.min(LOOK_LIMITS.maxPitch,pitch-dy*.0026*vertical))
 };
}

export function describeLookSettings({invertX=false,invertY=false}={}){
 return `上拖＝往${invertY?'下':'上'}看；右拖＝往${invertX?'左':'右'}看`;
}
