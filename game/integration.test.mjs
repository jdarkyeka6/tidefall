import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("./index.html",import.meta.url),"utf8");
test("3D castle imports the Book One engine",()=>{
  assert.match(html,/from "\.\/story\.mjs"/);
  assert.match(html,/new THREE\.Scene\(\)/);
  assert.match(html,/PointerLockControls/);
});
test("story milestones wired to real gameplay",()=>{
  for(const call of ['storyEvent("talk",nn.name)','storyEvent("plaque",pl.title)',
    'storyEvent("cast")','storyEvent("dummy")','storyEvent("visit","Undercroft")',
    'storyEvent("shards")']) assert.ok(html.includes(call),call);
});
test("save, restore, reset, journal and win gates are wired",()=>{
  for(const key of ['saveProgress()','normalizeProgress','shardCount=shards.filter',
    'resetSaveBtn','KeyJ','nextStoryStep(story)','pagehide'])
    assert.ok(html.includes(key),key);
});
test("Book One uses canonical cast names",()=>{
  assert.match(html,/Jasper Holloway/);
  assert.match(html,/Ava Rees/);
  assert.doesNotMatch(html,/Jasper Vale|Ava Monroe/);
});
