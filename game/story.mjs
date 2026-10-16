// Tidefall Book One: pure progression logic, independent of the renderer.
export const STORY_STEPS = Object.freeze([
  {id:"jasper", title:"Meet Jasper Holloway", hint:"Find Jasper by the courtyard fountain.", kind:"talk", target:"Jasper Holloway"},
  {id:"ava", title:"Ask Ava Rees about the key", hint:"Ava is with the group in the courtyard.", kind:"talk", target:"Ava Rees"},
  {id:"library", title:"Investigate the Library of Tides", hint:"Read the Library of Tides plaque on the ground floor.", kind:"plaque", target:"Library of Tides"},
  {id:"hale", title:"Speak to Professor Hale", hint:"Find Prof. Rowan Hale on the upper floors.", kind:"talk", target:"Prof. Rowan Hale"},
  {id:"cast", title:"Learn to cast a spell", hint:"Click or press F. Choose spells with 1–4.", kind:"cast"},
  {id:"dummy", title:"Hit a training dummy", hint:"Practice your aim on a marked training dummy.", kind:"dummy"},
  {id:"under", title:"Discover the Undercroft", hint:"Descend below the castle to the Undercroft.", kind:"visit", target:"Undercroft"},
  {id:"shards", title:"Gather eight Tide Shards", hint:"Follow the turquoise compass arrow; explore each floor.", kind:"shards", count:8},
  {id:"harper", title:"Report back to Harper", hint:"Return to Harper in the courtyard and press E.", kind:"talk", target:"Harper"}
]);
export const SAVE_KEY = "tidefall-book-one-v1";
export function freshProgress() {
  return {version:1,flags:{},shards:[],score:0,spell:0,position:null,objectives:[],won:false};
}
export function normalizeProgress(raw) {
  const p=freshProgress();
  if (!raw || typeof raw!=="object" || raw.version!==1) return p;
  if (raw.flags && typeof raw.flags==="object")
    for(const step of STORY_STEPS) if(raw.flags[step.id]===true) p.flags[step.id]=true;
  if (Array.isArray(raw.shards)) p.shards=[...new Set(raw.shards.filter(n=>Number.isInteger(n)&&n>=0&&n<12))];
  if (Number.isInteger(raw.score)) p.score=Math.max(0,Math.min(999999,raw.score));
  if (Number.isInteger(raw.spell)) p.spell=Math.max(0,Math.min(3,raw.spell));
  if (Array.isArray(raw.objectives)) p.objectives=raw.objectives.slice(0,7).map(v=>v===true);
  if (Array.isArray(raw.position) && raw.position.length===3 &&
      raw.position.every(n=>Number.isFinite(n)) &&
      Math.abs(raw.position[0])<=180 && raw.position[1]>=-9 && raw.position[1]<=48 &&
      Math.abs(raw.position[2])<=180) p.position=raw.position.slice();
  // A corrupted save cannot jump straight to the finale.
  if (STORY_STEPS.slice(0,-1).some(s=>p.flags[s.id]!==true)) delete p.flags.harper;
  p.won=raw.won===true && STORY_STEPS.every(s=>p.flags[s.id]);
  return p;
}
export function nextStoryStep(p) {
  return STORY_STEPS.find(s=>p.flags[s.id]!==true) || null;
}
export function completedStorySteps(p) {
  return STORY_STEPS.filter(s=>p.flags[s.id]===true).length;
}
export function recordStoryEvent(p,kind,target="",shardCount=0) {
  let changed=false;
  for(const s of STORY_STEPS) {
    if(p.flags[s.id]) continue;
    if(s.id==="harper" && STORY_STEPS.slice(0,-1).some(prev=>!p.flags[prev.id])) continue;
    const matches=s.kind===kind &&
      (s.kind==="shards" ? shardCount>=s.count : s.target===undefined || s.target===target);
    if(matches) { p.flags[s.id]=true; changed=true; }
  }
  return changed;
}
