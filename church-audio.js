import {TempleAudio} from './temple-audio.js?v=0.017';
// Original synthesized distant tower bell, with harmonic partials rather than temple-bell modes.
export class ChurchAudio extends TempleAudio{
 async start(){const ok=await super.start();if(ok)this.schedule(45000);return ok;}
 schedule(delay=90000+Math.random()*60000){super.schedule(delay);}
 ring(){if(!this.ctx||!this.active||this.muted||this.bells<=0)return false;const c=this.ctx,t=c.currentTime,voice=c.createGain();voice.connect(this.master);voice.connect(this.reverb);voice.gain.value=this.bells*.13;const oscillators=[];
  for(const[ratio,level,decay]of [[1,1,10],[2,.30,7],[3,.13,5],[4,.06,3],[5,.025,2]]){const osc=c.createOscillator(),gain=c.createGain();osc.type='sine';osc.frequency.value=196*ratio;gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(level,t+.025);gain.gain.exponentialRampToValueAtTime(.0001,t+decay);osc.connect(gain).connect(voice);osc.start(t);osc.stop(t+decay+.1);oscillators.push(osc);}
  const item={voice,oscillators};this.voices.add(item);oscillators[0].onended=()=>{voice.disconnect();this.voices.delete(item);};return true;
 }
}
