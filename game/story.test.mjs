import test from "node:test";
import assert from "node:assert/strict";
import {STORY_STEPS,freshProgress,normalizeProgress,recordStoryEvent,nextStoryStep,completedStorySteps} from "./story.mjs";

test("Book One starts with Jasper and nine milestones",()=>{
  const p=freshProgress();
  assert.equal(STORY_STEPS.length,9);
  assert.equal(nextStoryStep(p).id,"jasper");
  assert.equal(completedStorySteps(p),0);
});
test("events are idempotent and early discoveries are preserved",()=>{
  const p=freshProgress();
  assert.equal(recordStoryEvent(p,"plaque","Library of Tides"),true);
  assert.equal(recordStoryEvent(p,"plaque","Library of Tides"),false);
  assert.equal(nextStoryStep(p).id,"jasper");
  assert.equal(recordStoryEvent(p,"talk","Jasper Holloway"),true);
  assert.equal(nextStoryStep(p).id,"ava");
});
test("Harper finale is gated until every earlier objective is complete",()=>{
  const p=freshProgress();
  assert.equal(recordStoryEvent(p,"talk","Harper"),false);
  for(const s of STORY_STEPS.slice(0,-1)) {
    assert.equal(recordStoryEvent(p,s.kind,s.target||"",s.kind==="shards"?8:0),true);
  }
  assert.equal(nextStoryStep(p).id,"harper");
  assert.equal(recordStoryEvent(p,"talk","Harper"),true);
  assert.equal(nextStoryStep(p),null);
});
test("eight shards are required, not seven",()=>{
  const p=freshProgress();
  assert.equal(recordStoryEvent(p,"shards","",7),false);
  assert.equal(recordStoryEvent(p,"shards","",8),true);
});
test("normalization rejects corrupted positions, flags and shard indices",()=>{
  const raw={version:1,flags:{harper:true,jasper:true,evil:true},shards:[0,0,1,-1,12,"2"],score:-40,spell:99,position:[NaN,0,0],objectives:[1,true]};
  const p=normalizeProgress(raw);
  assert.deepEqual(p.shards,[0,1]);
  assert.equal(p.flags.harper,undefined);
  assert.equal(p.flags.evil,undefined);
  assert.equal(p.score,0);
  assert.equal(p.spell,3);
  assert.equal(p.position,null);
  assert.deepEqual(p.objectives,[false,true]);
});
test("valid saved quest and positions round-trip",()=>{
  const p=freshProgress(); recordStoryEvent(p,"talk","Jasper Holloway");p.shards=[0,4];p.position=[0,1.7,44];
  const restored=normalizeProgress(JSON.parse(JSON.stringify(p)));
  assert.equal(nextStoryStep(restored).id,"ava");
  assert.deepEqual(restored.position,[0,1.7,44]);
  assert.deepEqual(restored.shards,[0,4]);
});
