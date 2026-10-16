import {UPGRADE_TYPES,UPGRADE_LABELS,upgradeCost,rankAtXP,statsFor,purchaseUpgrade} from "./logic.mjs";
export function setupGameUI({hud,menu,getSave,onPurchase}){
 const mapPanel=document.createElement("div");
 mapPanel.className="veil-map";
 mapPanel.innerHTML='<div class="map-header"><span>✧ THE SHATTERED COAST</span><kbd>M</kbd></div><canvas width="224" height="224" aria-label="World map"></canvas><div class="map-footer">▲ YOU · ◆ SIGIL · ✦ QUEST</div>';
 hud.appendChild(mapPanel);
 const map=mapPanel.querySelector("canvas"),ctx=map.getContext("2d");
 let expanded=false;
 const toggleMap=()=>{expanded=!expanded;mapPanel.classList.toggle("expanded",expanded);};
 const rankEl=document.createElement("div");rankEl.className="veil-rank";hud.appendChild(rankEl);
 const shop=document.createElement("div");shop.className="veil-upgrades";
 shop.innerHTML='<div class="shop-heading">✦ ARCANE ASCENSION <small>PERMANENT UPGRADES</small></div><div id="shop-content" class="shop-content"></div><div class="shop-tip">Earn essence by defeating shadows · Press K to open this menu</div>';
 menu.querySelector(".menu-content").appendChild(shop);
 const content=shop.querySelector("#shop-content");
 const desc={power:"+18% spell and melee damage",vitality:"+20 maximum health",focus:"+14 maximum aether and faster regeneration"};
 function renderShop(){
  const save=getSave(),stats=statsFor(save);
  shop.querySelector(".shop-heading small").textContent="RANK "+stats.rank+" · "+save.essence+" ESSENCE";
  content.innerHTML="";
  for(const key of UPGRADE_TYPES){
   const tier=save.upgrades[key],cost=upgradeCost(tier),maxed=tier>=5,btn=document.createElement("button");
   btn.className="upgrade-row";btn.disabled=maxed||save.essence<cost;
   const left=document.createElement("span"),right=document.createElement("strong");
   const label=document.createElement("b"),description=document.createElement("small");
   label.textContent=UPGRADE_LABELS[key]+"  "+tier+"/5";description.textContent=desc[key];left.append(label,description);
   right.textContent=maxed?"MAXED":cost+" ✦";btn.append(left,right);
   btn.addEventListener("click",()=>{if(onPurchase(key))renderShop();});
   content.appendChild(btn);
  }
 }
 function drawMap(hero,quest,relics,enemies,npcs){
  const W=224,H=224;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle="#0a202d";ctx.fillRect(0,0,W,H);
  const tx=x=>W/2+x*.94,tz=z=>H/2+z*.94;
  // Weathered chart grid.
  ctx.strokeStyle="rgba(177,208,222,.10)";ctx.lineWidth=.75;
  for(let i=-100;i<=100;i+=20){
   ctx.beginPath();ctx.moveTo(tx(i),0);ctx.lineTo(tx(i),H);ctx.moveTo(0,tz(i));ctx.lineTo(W,tz(i));ctx.stroke();
  }
  // Shoreline contour, traced from coarse deterministic island function.
  ctx.strokeStyle="rgba(138,197,194,.44)";ctx.lineWidth=1.5;ctx.beginPath();
  for(let i=0;i<=110;i++){const a=i/110*Math.PI*2,r=98;
   const x=r*Math.cos(a),z=-14+r*Math.sin(a);
   if(i===0)ctx.moveTo(tx(x),tz(z));else ctx.lineTo(tx(x),tz(z));
  }ctx.stroke();
  // Stone road to the gate.
  ctx.strokeStyle="rgba(211,200,172,.3)";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(tx(0),tz(34));ctx.lineTo(tx(0),tz(-64));ctx.stroke();
  ctx.lineWidth=1.5;ctx.strokeStyle="rgba(208,193,150,.32)";ctx.strokeRect(tx(-17),tz(-4),34,37);
  for(const r of relics) {
   const pX=tx(r.x),pY=tz(r.z),got=getSave().relics.includes(r.id);
   ctx.globalAlpha=got?.25:1;ctx.fillStyle="#91dce5";ctx.save();ctx.translate(pX,pY);ctx.rotate(Math.PI/4);
   ctx.fillRect(-4,-4,8,8);ctx.restore();ctx.globalAlpha=1;
  }
  for(const n of npcs){ctx.fillStyle="#dabb83";ctx.beginPath();ctx.arc(tx(n.x),tz(n.z),2.6,0,7);ctx.fill();}
  for(const e of enemies){if(e.dead)continue;ctx.fillStyle=e.tier?"#b896ed":"#d2759d";ctx.beginPath();ctx.arc(tx(e.group.position.x),tz(e.group.position.z),e.tier?5.5:2,0,7);ctx.fill();}
  // Visible waypoint ring, properly projected to chart coordinates.
  const px=tx(quest.x),pz=tz(quest.z);
  ctx.strokeStyle="#f5ca86";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(px,pz,6,0,7);ctx.stroke();
  ctx.strokeStyle="rgba(250,214,161,.25)";ctx.setLineDash([2,5]);ctx.beginPath();ctx.moveTo(tx(hero.x),tz(hero.z));ctx.lineTo(px,pz);ctx.stroke();ctx.setLineDash([]);
  const hx=tx(hero.x),hz=tz(hero.z);
  ctx.fillStyle="#fff0cf";ctx.strokeStyle="#082032";ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(hx,hz-6);ctx.lineTo(hx+5,hz+5);ctx.lineTo(hx-5,hz+5);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle="#a8bdc6";ctx.font="600 9px system-ui";ctx.textAlign="left";ctx.fillText("N",W-15,15);
 }
 let hudTime=0;
 const render=(hero,quest,relics,enemies,npcs,dt=.11)=>{
  hudTime+=dt;if(hudTime<.1)return;hudTime=0;
  const save=getSave(),stats=statsFor(save);
  rankEl.innerHTML='<strong>RANK '+stats.rank+'</strong><span>'+save.xp+' XP · '+save.essence+' ESSENCE</span>';
  drawMap(hero,quest,relics,enemies,npcs);
 };
 return {render,renderShop,toggleMap,get expanded(){return expanded;}};
}
