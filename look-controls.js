export const DEFAULT_LOOK_SETTINGS=Object.freeze({invertX:true,invertY:true});
export const LOOK_LIMITS=Object.freeze({minPitch:-.64,maxPitch:.66});

// Drag inversion is the initial room preference; callers can override each axis.
// Explicit non-inverted settings still map up/right drags to up/right gaze.
export function applyDragLook(yaw,pitch,dx,dy,settings=DEFAULT_LOOK_SETTINGS){
 const horizontal=settings.invertX?-1:1;
 const vertical=settings.invertY?-1:1;
 return {
  yaw:yaw-dx*.0032*horizontal,
  pitch:Math.max(LOOK_LIMITS.minPitch,Math.min(LOOK_LIMITS.maxPitch,pitch-dy*.0026*vertical))
 };
}

export function describeLookSettings({invertX=false,invertY=false}=DEFAULT_LOOK_SETTINGS){
 return `上拖＝往${invertY?'下':'上'}看；右拖＝往${invertX?'左':'右'}看`;
}

export function readLookSettings(storage){const settings={...DEFAULT_LOOK_SETTINGS};try{const saved=storage??globalThis.localStorage;for(const axis of ['x','y']){const value=saved.getItem('cabin-look-invert-'+axis);if(value==='true'||value==='false')settings[axis==='x'?'invertX':'invertY']=value==='true';}}catch{}return settings;}
