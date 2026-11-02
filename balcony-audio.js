// Quiet synthesized air and diffuse urban ambience, with no discrete traffic sounds.
export class BalconyAudio{
 constructor(){this.ctx=null;this.active=false;this.city=.03;this.wind=.06;this.muted=false;}
 async start(){try{if(!this.ctx){const Context=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Context)return false;const c=this.ctx=new Context();this.master=c.createGain();const limiter=c.createDynamicsCompressor();limiter.threshold.value=-20;limiter.ratio.value=6;this.master.connect(limiter).connect(c.destination);
  const buffer=c.createBuffer(1,c.sampleRate*24,c.sampleRate),data=buffer.getChannelData(0);let brown=0;for(let i=0;i<data.length;i++){brown=(brown+.02*(Math.random()*2-1))/1.02;data[i]=brown*1.8;}this.noise=c.createBufferSource();this.noise.buffer=buffer;this.noise.loop=true;
  const air=c.createBiquadFilter();air.type='lowpass';air.frequency.value=430;this.windGain=c.createGain();this.noise.connect(air).connect(this.windGain).connect(this.master);
  const city=c.createBiquadFilter();city.type='bandpass';city.frequency.value=180;city.Q.value=.55;this.cityGain=c.createGain();this.noise.connect(city).connect(this.cityGain).connect(this.master);this.noise.start();}
  await this.ctx.resume();this.active=true;this.apply();return true;}catch{return false;}}
 setLevels(city,wind,muted){this.city=city;this.wind=wind;this.muted=muted;this.apply();}
 apply(){if(!this.ctx)return;const t=this.ctx.currentTime;this.master.gain.setTargetAtTime(this.active&&!this.muted?1:0,t,.25);this.cityGain.gain.setTargetAtTime(this.city*.6,t,.6);this.windGain.gain.setTargetAtTime(this.wind*.7,t,.6);}
 async suspend(){this.active=false;if(this.ctx)await this.ctx.suspend().catch(()=>{});}
 async resume(){if(!this.ctx)return false;try{await this.ctx.resume();this.active=true;this.apply();return true;}catch{return false;}}
 async leave(){this.active=false;if(this.ctx){this.master.gain.cancelScheduledValues(this.ctx.currentTime);this.master.gain.setTargetAtTime(0,this.ctx.currentTime,.12);}await new Promise(r=>setTimeout(r,600));if(this.ctx)await this.ctx.suspend().catch(()=>{});}
}
