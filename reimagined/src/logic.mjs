export const SAVE_KEY="tidefall-veil-save-v1";
export const RELICS=Object.freeze([
  {id:"moon",name:"MOONGLASS SIGIL",x:-39,z:-30,color:0x8ddcff,location:"THE FALLEN OBSERVATORY"},
  {id:"ember",name:"EMBERHEART SIGIL",x:44,z:19,color:0xffab71,location:"THE ASHEN GROVE"},
  {id:"tide",name:"TIDEBOUND SIGIL",x:22,z:-51,color:0x6dfad7,location:"THE SUNKEN SHRINE"}
]);
export const DIALOGUES=Object.freeze({
  jasper:[
    "The sea pulled back three nights ago. It never returned.",
    "Ava found three ancient sigils. The Veil is breaking, and those fragments might hold it together.",
    "Find the Moon, Ember and Tide sigils. Clear their guardians first. I'll keep watch from here."
  ],
  ava:[
    "My brass key vibrates whenever a sigil wakes.",
    "Someone buried this place to keep the Veil closed. We need all three sigils before the Warden appears.",
    "Be careful near the old gate. It can feel you approaching."
  ],
  harper:[
    "I heard creatures outside the southern wall. I doubt they're alone.",
    "Shift to run, Space to dodge. Your aether returns, but not instantly.",
    "We'll deal with the Veil. No one faces this on their own."
  ]
});
export function freshSave(){return {version:1,metJasper:false,relics:[],wardenDefeated:false,finished:false,quality:"auto"};}
export function normalizeSave(raw){
  const s=freshSave();if(!raw||typeof raw!=="object"||raw.version!==1)return s;
  s.metJasper=raw.metJasper===true;
  s.relics=Array.isArray(raw.relics)?[...new Set(raw.relics.filter(x=>RELICS.some(r=>r.id===x)))]:[];
  s.wardenDefeated=raw.wardenDefeated===true&&s.relics.length===3&&s.metJasper;
  s.finished=raw.finished===true&&s.wardenDefeated;
  s.quality=["auto","high","medium","low"].includes(raw.quality)?raw.quality:"auto";
  return s;
}
export function currentQuest(save){
  if(!save.metJasper)return {title:"THE FIRST WARNING",hint:"Talk to Jasper in the courtyard.",x:3,z:13,step:0};
  if(save.relics.length<3){
    const next=RELICS.find(r=>!save.relics.includes(r.id));
    return {title:"AWAKEN THE THREE SIGILS",hint:save.relics.length+"/3 sigils recovered. Defeat nearby shadows, then press E at each relic.",x:next.x,z:next.z,step:1};
  }
  if(!save.wardenDefeated)return {title:"THE ABYSSAL WARDEN",hint:"Return to the Veil Gate. Defeat the Warden and survive.",x:0,z:-58,step:2};
  if(!save.finished)return {title:"SEAL THE VEIL",hint:"Approach the Veil Gate and press E to restore its seal.",x:0,z:-58,step:3};
  return {title:"THE COAST REMEMBERS",hint:"The Veil is stable, for now. Book One's prologue is complete.",x:0,z:13,step:4};
}
export function claimRelic(save,id,guardianAlive){
  if(!save.metJasper||guardianAlive||!RELICS.some(r=>r.id===id)||save.relics.includes(id))return false;
  save.relics.push(id);return true;
}
export function defeatWarden(save){
  if(!save.metJasper||save.relics.length!==3)return false;
  save.wardenDefeated=true;return true;
}
export function sealVeil(save){
  if(!save.wardenDefeated)return false;save.finished=true;return true;
}
export function damageAfterArmour(amount,damageReduction=0){
  return Math.max(0,Math.round(Math.max(0,amount)*(1-Math.min(0.95,Math.max(0,damageReduction)))));
}
export function moveAxis(keys){
 const x=(keys.KeyD?1:0)-(keys.KeyA?1:0),z=(keys.KeyW?1:0)-(keys.KeyS?1:0);
 const l=Math.hypot(x,z)||1;return {x:x/l,z:z/l,active:x!==0||z!==0};
}
