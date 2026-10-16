import test from "node:test";
import assert from "node:assert/strict";
import {RELICS,freshSave,normalizeSave,currentQuest,claimRelic,defeatWarden,sealVeil,damageAfterArmour,moveAxis} from "../src/logic.mjs";
test("starts with Jasper and a valid waypoint",()=>{
 const s=freshSave(),q=currentQuest(s);assert.equal(q.step,0);assert.equal(q.x,3);assert.equal(q.z,13);
});
test("cannot collect before the meeting or while guardian survives",()=>{
 const s=freshSave();assert.equal(claimRelic(s,"moon",false),false);s.metJasper=true;
 assert.equal(claimRelic(s,"moon",true),false);assert.equal(claimRelic(s,"moon",false),true);
 assert.equal(claimRelic(s,"moon",false),false);assert.deepEqual(s.relics,["moon"]);
});
test("relics are order independent, but boss victory and sealing are gated",()=>{
 const s=freshSave();s.metJasper=true;assert.equal(defeatWarden(s),false);
 for(const id of ["tide","moon","ember"])assert.equal(claimRelic(s,id,false),true);
 assert.equal(currentQuest(s).step,2);assert.equal(defeatWarden(s),true);
 assert.equal(currentQuest(s).step,3);assert.equal(sealVeil(s),true);
 assert.equal(currentQuest(s).step,4);
});
test("invalid progression cannot be injected by corrupted saves",()=>{
 let s=normalizeSave({version:1,relics:["moon","moon","hacked"],wardenDefeated:true,finished:true,quality:"ultra"});
 assert.deepEqual(s.relics,["moon"]);assert.equal(s.wardenDefeated,false);assert.equal(s.finished,false);assert.equal(s.quality,"auto");
});
test("completed save survives serialization",()=>{
 const s=freshSave();s.metJasper=true;s.relics=RELICS.map(r=>r.id);defeatWarden(s);sealVeil(s);
 assert.deepEqual(normalizeSave(JSON.parse(JSON.stringify(s))),s);
});
test("movement normalized diagonals",()=>{
 const m=moveAxis({KeyW:true,KeyD:true});assert.ok(Math.abs(Math.hypot(m.x,m.z)-1)<1e-9);
 assert.equal(moveAxis({}).active,false);
});
test("damage cannot be negative or reduced beyond cap",()=>{
 assert.equal(damageAfterArmour(-5),0);assert.equal(damageAfterArmour(20,0.5),10);
 assert.equal(damageAfterArmour(20,0.99),1);
});
