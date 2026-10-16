import test from "node:test";
import assert from "node:assert/strict";
import {freshSave,normalizeSave,UPGRADE_TYPES,statsFor,rankAtXP,upgradeCost,gainRewards,purchaseUpgrade} from "../src/logic.mjs";

test("legacy saves gain valid XP and upgrade defaults",()=>{
 const legacy={version:1,metJasper:true,relics:[],quality:"medium"};
 const s=normalizeSave(legacy);
 assert.equal(s.metJasper,true);
 assert.equal(s.xp,0);assert.equal(s.essence,0);
 assert.deepEqual(s.upgrades,{power:0,vitality:0,focus:0});
});
test("progression saves sanitize hacked stats and oversized resources",()=>{
 const s=normalizeSave({version:1,xp:1e100,essence:1e100,upgrades:{power:6,vitality:-5,focus:2.3}});
 assert.equal(s.xp,0);assert.equal(s.essence,0);
 assert.deepEqual(s.upgrades,{power:5,vitality:0,focus:0});
});
test("rank grows with XP and is capped",()=>{
 assert.equal(rankAtXP(0),1);assert.ok(rankAtXP(1500)>1);assert.equal(rankAtXP(Infinity),50);
});
test("rewards add EXP and Essence and ignore invalid negatives",()=>{
 const s=freshSave();
 assert.equal(gainRewards(s,45,1),true);assert.equal(s.xp,45);assert.equal(s.essence,1);
 assert.equal(gainRewards(s,-10,500),false);assert.equal(s.essence,1);
});
test("upgrades cost Essence and cannot exceed tier five",()=>{
 const s=freshSave();
 assert.equal(purchaseUpgrade(s,"power"),false);
 gainRewards(s,600,999);
 for(let i=0;i<5;i++){
  const old=s.essence,price=upgradeCost(i);
  assert.equal(purchaseUpgrade(s,"power"),true);
  assert.equal(s.essence,old-price);
 }
 assert.equal(purchaseUpgrade(s,"power"),false);
 assert.equal(purchaseUpgrade(s,"evil"),false);
});
test("upgrades change real combat stats",()=>{
 const s=freshSave();s.upgrades={power:2,vitality:3,focus:4};
 assert.equal(statsFor(s).maxHealth,160);
 assert.equal(statsFor(s).maxMana,156);
 assert.ok(statsFor(s).manaRegen>16);
 assert.ok(statsFor(s).damageMult>1);
 assert.deepEqual(UPGRADE_TYPES,["power","vitality","focus"]);
});
