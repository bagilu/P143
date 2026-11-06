// A persistent world must fullscreen its outer document so map and all rooms stay reachable.
export async function toggleSiteFullscreen(doc=document){
 let worldDocument=doc;
 try{const win=doc.defaultView;if(win?.parent!==win&&win?.parent?.p143World)worldDocument=win.parent.document;}catch{}
 if(worldDocument.fullscreenElement)return worldDocument.exitFullscreen();
 if(doc.fullscreenElement)return doc.exitFullscreen();
 if(!worldDocument.documentElement.requestFullscreen)throw new Error('Fullscreen unavailable');
 return worldDocument.documentElement.requestFullscreen();
}
