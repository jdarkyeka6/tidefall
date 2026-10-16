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
export function freshSave(){return {version:1,metJasper:false,relics:[],wardenDefeated:false,finished:false,quality:"auto",xp:0,essence:0,upgrades:{power:0,vitality:0,focus:0}};}
export function normalizeSave(raw){
  const s=freshSave();if(!raw||typeof raw!=="object"||raw.version!==1)return s;
  s.metJasper=raw.metJasper===true;
  s.relics=Array.isArray(raw.relics)?[...new Set(raw.relics.filter(x=>RELICS.some(r=>r.id===x)))]:[];
  s.wardenDefeated=raw.wardenDefeated===true&&s.relics.length===3&&s.metJasper;
  s.finished=raw.finished===true&&s.wardenDefeated;
  s.quality=["auto","high","medium","low"].includes(raw.quality)?raw.quality:"auto";
  s.xp=Number.isInteger(raw.xp)?Math.max(0,Math.min(raw.xp,100000)):0;
  s.essence=Number.isInteger(raw.essence)?Math.max(0,Math.min(raw.essence,999)):0;
  for(const name of ["power","vitality","focus"]) {
    const val=raw.upgrades?.[name];
    s.upgrades[name]=Number.isInteger(val)?Math.max(0,Math.min(val,5)):0;
  }
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


export const UPGRADE_TYPES=Object.freeze(["power","vitality","focus"]);
export const UPGRADE_LABELS=Object.freeze({power:"SPELLCRAFT",vitality:"IRONWILL",focus:"AETHERFLOW"});
export function upgradeCost(tier){return Number.isInteger(tier)&&tier>=0&&tier<5?2+tier*2:Infinity;}
export function rankAtXP(xp){return Math.min(50,1+Math.floor(Math.sqrt(Math.max(0,xp)/60)));}
export function statsFor(save){
  return {
    maxHealth:100+save.upgrades.vitality*20,
    maxMana:100+save.upgrades.focus*14,
    manaRegen:16+save.upgrades.focus*3.6,
    damageMult:1+save.upgrades.power*.18,
    rank:rankAtXP(save.xp)
  };
}
export function gainRewards(save,xp=0,essence=0){
  if(!Number.isFinite(xp)||!Number.isFinite(essence))return false;
  if(xp<0||essence<0)return false;
  save.xp=Math.min(100000,save.xp+Math.round(xp));
  save.essence=Math.min(999,save.essence+Math.round(essence));
  return true;
}
export function purchaseUpgrade(save,type){
  if(!UPGRADE_TYPES.includes(type))return false;
  const tier=save.upgrades[type],cost=upgradeCost(tier);
  if(!Number.isFinite(cost)||save.essence<cost)return false;
  save.essence-=cost;save.upgrades[type]++;
  return true;
}
