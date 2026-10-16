import test from "node:test";
import assert from "node:assert/strict";
import {terrainWalkable,slideMotion,OBSTACLES} from "../src/navigation.mjs";
const land=()=>.75;
test("courtyard spawn and road accessible",()=>{
 assert.equal(terrainWalkable(0,23,land),true);
 assert.equal(terrainWalkable(0,-12,land),true);
 assert.equal(terrainWalkable(0,-58,land),true);
});
test("citadel towers stop player from clipping through",()=>{
 assert.equal(terrainWalkable(-25,1,land),false);
 assert.equal(terrainWalkable(25,1,land),false);
 assert.equal(terrainWalkable(-14,-58,land),false);
 assert.ok(OBSTACLES.length>=25);
});
test("X/Z separation permits wall sliding",()=>{
 const res=slideMotion(-20.6,0, -2,2,land);
 assert.equal(res.blockedX,true);
 assert.equal(res.blockedZ,false);
 assert.ok(res.z>0);
});
test("water and world bounds are solid",()=>{
 assert.equal(terrainWalkable(200,20,land),false);
 assert.equal(terrainWalkable(0,15,()=>-4),false);
});
