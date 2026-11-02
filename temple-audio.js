// Original procedural ambience. No human voice or third-party recording.
export const bellInterval=(random=Math.random)=>45000+random()*45000;
export const BELL_MODES=[[1,1,13],[2.01,.34,8],[2.72,.19,5],[4.07,.08,3.5],[5.43,.035,2]];
export class TempleAudio{
 constructor(){this.ctx=null;this.master=null;this.wind=.18;this.bells=.22;this.muted=false;this.timer=null;this.voices=new Set();this.active=false;this.bufferSource=null;this.available=true;}
 async start(){try{if(!this.ctx){const AudioContext=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AudioContext)throw Error('audio-unavailable');this.ctx=new AudioContext();const c=this.ctx;this.master=c.createGain();const limiter=c.createDynamicsCompressor();limiter.threshold.value=-15;limiter.ratio.value=8;this.master.connect(limiter).connect(c.destination);
   const buffer=c.createBuffer(1,c.sampleRate*20,c.sampleRate),data=buffer.getChannelData(0);let low=0;for(let i=0;i<data.length;i++){low=(low+.028*(Math.random()*2-1))/1.028;data[i]=low*2;}
   const source=c.createBufferSource();source.buffer=buffer;source.loop=true;const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=850;this.windGain=c.createGain();source.connect(filter).connect(this.windGain).connect(this.master);source.start();this.bufferSource=source;
   this.reverb=c.createConvolver();const impulse=c.createBuffer(2,c.sampleRate*3,c.sampleRate);for(let ch=0;ch<2;ch++){const d=impulse.getChannelData(ch);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3)*.25;}this.reverb.buffer=impulse;const wet=c.createGain();wet.gain.value=.24;this.reverb.connect(wet).connect(this.master);
  }await this.ctx.resume();this.active=true;this.apply();this.schedule(9000);return true;
 }catch{this.available=false;return false;}}
 apply(){if(!this.ctx)return;const t=this.ctx.currentTime;this.master.gain.setTargetAtTime(this.active&&!this.muted?1:0,t,.18);this.windGain.gain.setTargetAtTime(this.wind,t,.8);if(this.bells<=0||this.muted)this.stopVoices();}
 setLevels(wind,bells,muted){this.wind=wind;this.bells=bells;this.muted=muted;this.apply();}
 schedule(delay=bellInterval()){clearTimeout(this.timer);this.timer=null;if(!this.active)return;this.timer=setTimeout(()=>{this.timer=null;if(this.active&&!this.muted&&this.bells>0)this.ring();this.schedule();},delay);}
 ring(){if(!this.ctx||!this.active||this.muted||this.bells<=0)return false;const c=this.ctx,t=c.currentTime,voice=c.createGain();voice.connect(this.master);voice.connect(this.reverb);voice.gain.value=this.bells*.16;const oscillators=[];
  for(const[ratio,level,decay]of BELL_MODES){const osc=c.createOscillator(),gain=c.createGain();osc.type='sine';osc.frequency.value=110*ratio;gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(level,t+.018);gain.gain.exponentialRampToValueAtTime(.0001,t+decay);osc.connect(gain).connect(voice);osc.start(t);osc.stop(t+decay+.1);oscillators.push(osc);}
  const item={voice,oscillators};this.voices.add(item);oscillators[0].onended=()=>{voice.disconnect();this.voices.delete(item);};return true;
 }
 stopVoices(){if(!this.ctx)return;for(const v of this.voices){v.voice.gain.setTargetAtTime(0,this.ctx.currentTime,.08);for(const o of v.oscillators)try{o.stop(this.ctx.currentTime+.4);}catch{}}this.voices.clear();}
 async suspend(){this.active=false;clearTimeout(this.timer);this.timer=null;this.stopVoices();if(this.ctx)await this.ctx.suspend().catch(()=>{});}
 async resume(){if(!this.ctx)return false;try{await this.ctx.resume();this.active=true;this.apply();this.schedule();return true;}catch{return false;}}
 async leave(){this.active=false;clearTimeout(this.timer);this.timer=null;if(this.ctx){this.master.gain.cancelScheduledValues(this.ctx.currentTime);this.master.gain.setTargetAtTime(0,this.ctx.currentTime,.12);}await new Promise(r=>setTimeout(r,600));if(this.ctx)await this.ctx.suspend().catch(()=>{});}
}
