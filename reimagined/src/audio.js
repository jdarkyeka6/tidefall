// Procedurally synthesized original audio. No assets or copyrighted recordings.
export class TidefallAudio {
 constructor(){
  this.ctx=null;this.master=null;this.ambience=null;this.muted=false;this.started=false;this.active=false;
 }
 unlock(){
  try {
   if(!this.ctx){
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    this.ctx=new C();const ctx=this.ctx;
    this.master=ctx.createGain();this.master.gain.value=.24;this.master.connect(ctx.destination);
    this.ambience=ctx.createGain();this.ambience.gain.value=0;this.ambience.connect(this.master);
    // Three seconds of soft ocean/wind noise, looped with a low-pass and slow gain drift.
    const len=Math.floor(ctx.sampleRate*3),buff=ctx.createBuffer(1,len,ctx.sampleRate),a=buff.getChannelData(0);
    let state=53872,previous=0;
    for(let i=0;i<len;i++){state=(Math.imul(state,1664525)+1013904223)|0;
     const n=((state>>>0)/4294967296)*2-1;previous=previous*.989+n*.011;a[i]=previous*.34;}
    const source=ctx.createBufferSource();source.buffer=buff;source.loop=true;
    const low=ctx.createBiquadFilter();low.type="lowpass";low.frequency.value=680;source.connect(low);low.connect(this.ambience);source.start();
    this.noise=source;
   }
   if(this.ctx.state==="suspended")this.ctx.resume();
   this.started=true;this.setActive(true);
  }catch(e){/* WebAudio is optional; the game remains playable */ }
 }
 setActive(active){
  this.active=!!active;
  if(!this.ctx||!this.ambience)return;
  const now=this.ctx.currentTime;
  this.ambience.gain.setTargetAtTime(active&&!this.muted?.55:0,now,.3);
 }
 toggleMute(){
  this.muted=!this.muted;
  if(this.master&&this.ctx)this.master.gain.setTargetAtTime(this.muted?0:.24,this.ctx.currentTime,.025);
  return this.muted;
 }
 tone(frequency=440,duration=.17,kind="sine",gain=.13,slide=1){
  if(!this.ctx||this.muted||!this.active)return;
  const ctx=this.ctx,t=ctx.currentTime;
  const osc=ctx.createOscillator(),env=ctx.createGain();
  osc.type=kind;osc.frequency.setValueAtTime(Math.max(35,frequency),t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(35,frequency*slide),t+duration);
  env.gain.setValueAtTime(.001,t);
  env.gain.exponentialRampToValueAtTime(Math.max(.001,gain),t+.018);
  env.gain.exponentialRampToValueAtTime(.001,t+duration);
  osc.connect(env);env.connect(this.master);
  osc.start(t);osc.stop(t+duration+.025);
 }
 spell(kind){
  const tones=[[640,.21,"sine",.25,1.9],[280,.31,"sawtooth",.13,.42],[1020,.36,"triangle",.18,.43],[480,.56,"sine",.19,1.5]];
  this.tone(...tones[kind%tones.length]);
 }
 hit(){this.tone(190,.13,"triangle",.18,.4);}
 hurt(){this.tone(124,.26,"sawtooth",.14,.64);}
 parry(){this.tone(780,.23,"square",.16,1.6);}
 collect(){this.tone(580,.23,"sine",.12,1.35);this.tone(1100,.48,"triangle",.09,1.3);}
 boss(){this.tone(76,.95,"sawtooth",.12,.75);}
 dash(){this.tone(220,.12,"triangle",.09,1.8);}
 purchase(){this.tone(650,.35,"sine",.13,1.7);}
}
