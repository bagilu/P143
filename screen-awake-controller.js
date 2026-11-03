// One screen lock at a time. Async results always follow the latest page intent.
export class ScreenAwakeController{
 constructor({request=null,onState=()=>{}}={}){this.request=request;this.onState=onState;this.enabled=true;this.entered=false;this.visible=true;this.pageActive=true;this.lock=null;this.pending=false;this.blocked=null;this.state='idle';}
 get eligible(){return this.enabled&&this.entered&&this.visible&&this.pageActive;}
 emit(state){if(this.state===state&&this.notified)return;this.state=state;this.notified=true;this.onState(state);}
 update(context={}){const before=this.eligible;for(const key of ['enabled','entered','visible','pageActive'])if(key in context)this[key]=Boolean(context[key]);if(!before&&this.eligible)this.blocked=null;this.reconcile();}
 retry(){this.blocked=null;this.reconcile();}
 reconcile(){
  if(this.lock?.released)this.lock=null;
  if(!this.eligible){
   const state=!this.enabled?'off':!this.entered?'idle':'paused';
   if(this.lock)this.release();
   this.emit(state);return;
  }
  if(!this.request){this.emit('unsupported');return;}
  if(this.lock){this.emit('active');return;}
  if(this.pending){this.emit('requesting');return;}
  if(this.blocked){this.emit(this.blocked);return;}
  this.acquire();
 }
 async acquire(){
  this.pending=true;this.emit('requesting');
  try{
   const lock=await this.request('screen');this.lock=lock;
   lock.addEventListener('release',()=>{if(this.lock!==lock)return;this.lock=null;this.blocked=this.eligible?'released':null;this.reconcile();},{once:true});
   if(lock.released){this.lock=null;this.blocked='released';}
  }catch{this.blocked='blocked';}
  finally{this.pending=false;this.reconcile();}
 }
 async release(){
  const lock=this.lock;if(!lock)return;this.lock=null;this.pending=true;
  try{await lock.release();}
  catch{if(!lock.released){this.lock=lock;this.emit('release-failed');}}
  finally{this.pending=false;if(this.lock&&!this.eligible){this.emit('release-failed');}else this.reconcile();}
 }
}
