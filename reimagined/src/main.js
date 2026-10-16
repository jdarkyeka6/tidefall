import * as THREE from "three";
import {createWorldPlus} from "./world-plus.js";
import {TidefallAudio} from "./audio.js";
import {setupGameUI} from "./interface-plus.js";
// Stylesheet linked from index.html for both static preview and Vite builds.
import {SAVE_KEY,RELICS,DIALOGUES,freshSave,normalizeSave,currentQuest,claimRelic,defeatWarden,sealVeil,moveAxis,statsFor,rankAtXP,gainRewards,purchaseUpgrade,UPGRADE_LABELS} from "./logic.mjs";

// Tidefall: The Veil is a standalone, GPU-conscious vertical slice.
// All geometry/textures are generated once; the runtime is asset-download-free.
const $=id=>document.getElementById(id);
const viewport=$("viewport"),menu=$("menu"),hud=$("hud"),playBtn=$("play");
const sound=new TidefallAudio();
const PI=Math.PI, TAU=PI*2, V3=THREE.Vector3;
const clamp=THREE.MathUtils.clamp, lerp=THREE.MathUtils.lerp;
const tmpVec=new V3(),clock=new THREE.Clock();
let save;try{save=normalizeSave(JSON.parse(localStorage.getItem(SAVE_KEY)||"null"));}catch(e){save=freshSave();}
const persist=()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch(e){}};
let seed=1796;
function rand(){seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;}
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x0b2033);
scene.fog=new THREE.FogExp2(0x244458,.009);
const camera=new THREE.PerspectiveCamera(68,innerWidth/innerHeight,.1,420);
const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:"high-performance",alpha:false});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.16;
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=false;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.domElement.tabIndex=0;
viewport.appendChild(renderer.domElement);

const Q={auto:1.3,high:1.65,medium:1.16,low:.82};
let quality=save.quality,activeDpr=1.1,frameTotal=0,frames=0,fps=60,graphicsTick=0;
function applyQuality(){
 const cap=Math.min(window.devicePixelRatio||1,1.8);
 activeDpr=Math.min(cap,Q[quality]||1.3);
 renderer.setPixelRatio(activeDpr);
 renderer.setSize(innerWidth,innerHeight,false);
 renderer.shadowMap.enabled=quality==="high";
 if(quality==="high"){sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);}
 else sun.castShadow=false;
 renderer.shadowMap.needsUpdate=true;
 if(typeof vegetation!=="undefined")vegetation.visible=quality!=="low";
 if(typeof smallParticles!=="undefined")smallParticles.visible=quality!=="low";
 if(typeof worldPlus!=="undefined")worldPlus.setQuality(quality);
}
$("quality").value=quality;
$("quality").addEventListener("change",e=>{quality=e.target.value;save.quality=quality;persist();applyQuality();});

const hemi=new THREE.HemisphereLight(0x9ec9dc,0x243a43,2.15);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xb8d2f2,2.7);
sun.position.set(-54,110,-85);sun.target.position.set(0,0,-15);
sun.shadow.camera.left=-85;sun.shadow.camera.right=85;sun.shadow.camera.top=85;sun.shadow.camera.bottom=-85;
sun.shadow.camera.near=1;sun.shadow.camera.far=260;sun.shadow.bias=-.0002;
scene.add(sun,sun.target);
scene.add(new THREE.AmbientLight(0x66879e,.3));

const mat=(c,rough=.82,metal=0)=>new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:metal});
const stone=mat(0x667d85),stone2=mat(0x435e68),stoneEdge=mat(0xa4b5b1),wood=mat(0x453c3a);
const obsidian=mat(0x172c3e,.6,.2),gold=mat(0xd5b47f,.38,.63),white=mat(0xc7d7d9);
const skin=mat(0xdeb596),hair=mat(0x312629),shadowMat=mat(0x151d31,.5,.12);
const darkRobe=mat(0x102b3c,.93),robeTrim=mat(0x4b8f99),robeBack=mat(0x0a2030);
const emberMat=new THREE.MeshBasicMaterial({color:0xffa17d}),iceMat=new THREE.MeshBasicMaterial({color:0x8adfff});
const cyan= new THREE.MeshBasicMaterial({color:0x8ffff0});
const sphere8=new THREE.IcosahedronGeometry(1,1),sphere16=new THREE.IcosahedronGeometry(1,2);
const cylinder=new THREE.CylinderGeometry(1,1,1,8),cone=new THREE.ConeGeometry(1,1,8);
const boxGeo=new THREE.BoxGeometry(1,1,1);
const root=new THREE.Group();scene.add(root);
function mesh(geometry,material,parent=root){const m=new THREE.Mesh(geometry,material);parent.add(m);return m;}
function bx(x,y,z,w,h,d,material=stone,parent=root){
 const m=mesh(boxGeo,material,parent);m.position.set(x,y,z);m.scale.set(w,h,d);return m;
}
function cy(x,y,z,r1,r2,h,material=stone,parent=root,segments=9){
 const m=mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material,parent);m.position.set(x,y,z);return m;
}
function orb(x,y,z,r,material,parent=root){const m=mesh(sphere16,material,parent);m.position.set(x,y,z);m.scale.setScalar(r);return m;}
function glowTexture(){
 const c=document.createElement("canvas");c.width=c.height=128;
 const ctx=c.getContext("2d"),g=ctx.createRadialGradient(64,64,0,64,64,64);
 g.addColorStop(0,"rgba(255,255,255,1)");g.addColorStop(.13,"rgba(220,250,255,.65)");
 g.addColorStop(.42,"rgba(123,221,254,.16)");g.addColorStop(1,"rgba(85,192,245,0)");
 ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);
}
const glowMap=glowTexture();
function glow(color,x,y,z,size,parent=root){
 const m=new THREE.Sprite(new THREE.SpriteMaterial({map:glowMap,color,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
 m.position.set(x,y,z);m.scale.set(size,size,size);parent.add(m);return m;
}
function hAt(x,z){
 const radius=Math.hypot(x,z+14);
 const shape=1.0+Math.sin(x*.105)*.58+Math.sin(z*.092)*.50+Math.cos((x+z)*.062)*.33;
 const cliff=Math.max(0,(radius-84)*.21);
 let h=shape-cliff;
 const flats=[[0,12,19],[-39,-30,13],[44,19,14],[22,-51,14],[0,-58,19]];
 for(const [px,pz,r] of flats){
  const d=Math.hypot(x-px,z-pz);
  const f=1-clamp((d-r)/(r+8),0,1);
  h=lerp(h,.75,f*f*(3-2*f));
 }
 return h;
}
function buildSky(){
 const sm=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{time:{value:0}},
 vertexShader:"varying vec3 dir;void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
 fragmentShader:"varying vec3 dir;uniform float time;void main(){float h=normalize(dir).y;vec3 a=vec3(.037,.09,.16),b=vec3(.16,.31,.38),c=vec3(.42,.42,.42);vec3 col=mix(b,a,smoothstep(-.05,.67,h));col=mix(c,col,smoothstep(-.45,.08,h));gl_FragColor=vec4(col,1.);}"});
 const sky=mesh(new THREE.SphereGeometry(360,24,12),sm,scene);sky.frustumCulled=false;
 const moon=orb(-142,124,-170,10,new THREE.MeshBasicMaterial({color:0xe5ebed}),scene);glow(0xb8eafa,-142,124,-169,46,scene);
 const count=430,pos=new Float32Array(count*3);
 for(let i=0;i<count;i++){let a=rand()*TAU,y=rand()*.76+.18,r=325;pos[i*3]=Math.cos(a)*r;pos[i*3+1]=y*r;pos[i*3+2]=Math.sin(a)*r;}
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(pos,3));
 const stars=new THREE.Points(g,new THREE.PointsMaterial({color:0xd6eefa,size:1.55,sizeAttenuation:false,transparent:true,opacity:.8,depthWrite:false}));scene.add(stars);
}
buildSky();

let terrainMesh=null;
function buildGround(){
 const size=260,steps=130,geo=new THREE.PlaneGeometry(size,size,steps,steps);
 geo.rotateX(-PI/2);
 const a=geo.attributes.position,cols=[];
 const dark=new THREE.Color(0x253d3e),green=new THREE.Color(0x40645b),sand=new THREE.Color(0x819287),rock=new THREE.Color(0x6e7f7f);
 const C=new THREE.Color();
 for(let i=0;i<a.count;i++){
  const x=a.getX(i),z=a.getZ(i),y=hAt(x,z);a.setY(i,y);
  const noise=Math.sin(x*.5+z*.29)*.07+Math.cos(z*.71-x*.13)*.05;
  const d=Math.min(Math.hypot(x,z-12),Math.hypot(x+39,z+30),Math.hypot(x-44,z-19),Math.hypot(x-22,z+51));
  if(y<-.4)C.copy(rock);else if(d<11)C.copy(sand);else C.copy(dark).lerp(green,clamp((y+.9)/4,0,1));
  C.offsetHSL(0,0,noise*.25);cols.push(C.r,C.g,C.b);
 }
 geo.setAttribute("color",new THREE.Float32BufferAttribute(cols,3));geo.computeVertexNormals();
 const ground=mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.97}));terrainMesh=ground;
 ground.receiveShadow=true;
 const water=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{time:{value:0}},
 vertexShader:"uniform float time;varying vec2 uvV;varying vec3 worldPos;void main(){uvV=uv;vec3 p=position;p.z+=sin(p.x*.045+time*.95)*.27+cos(p.y*.062-time*.8)*.17;worldPos=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}",
 fragmentShader:"uniform float time;varying vec2 uvV;varying vec3 worldPos;void main(){float w=sin((uvV.x+uvV.y)*90.+time*1.5)*sin((uvV.x-uvV.y)*60.-time*.9);float line=pow(max(0.,sin(uvV.y*260.+sin(uvV.x*12.+time)*3.-time*5.)),25.);vec3 c=mix(vec3(.012,.12,.19),vec3(.045,.32,.39),uvV.y*.4+.15*w);c+=vec3(.14,.19,.18)*line*.24;gl_FragColor=vec4(c,.92);}"});
 water.userData.tick=t=>water.uniforms.time.value=t;
 const w=mesh(new THREE.PlaneGeometry(520,520,1,1),water);w.rotation.x=-PI/2;w.position.y=-2.55;
 const shore=new THREE.PointLight(0x73c8dc,.5,45);shore.position.set(0,8,3);scene.add(shore);
 return water;
}
const waterMat=buildGround();
let vegetation,smallParticles;
function instances(){
 vegetation=new THREE.Group();scene.add(vegetation);
 const rockGeo=new THREE.DodecahedronGeometry(1,0);
 const rockMesh=new THREE.InstancedMesh(rockGeo,stone2,220),dummy=new THREE.Object3D();
 let c=0;for(let i=0;i<280&&c<220;i++){
  const x=(rand()-.5)*200,z=(rand()-.5)*200;
  if(hAt(x,z)<-.4||Math.hypot(x,z-12)<20||RELICS.some(r=>Math.hypot(x-r.x,z-r.z)<14)||Math.hypot(x,z+58)<18)continue;
  dummy.position.set(x,hAt(x,z)+.15,z);dummy.rotation.set(rand(),rand()*TAU,rand());const s=.5+rand()*2.1;dummy.scale.set(s,s*.42,s*.72);dummy.updateMatrix();rockMesh.setMatrixAt(c++,dummy.matrix);
 }
 rockMesh.count=c;rockMesh.instanceMatrix.needsUpdate=true;vegetation.add(rockMesh);
 const trunkMat=mat(0x473d38),leaves=mat(0x244c4e);
 const tGeo=new THREE.CylinderGeometry(.22,.36,2.8,5),pGeo=new THREE.ConeGeometry(2.4,7,6);
 const trunks=new THREE.InstancedMesh(tGeo,trunkMat,135),pines=new THREE.InstancedMesh(pGeo,leaves,135);
 let k=0;for(let i=0;i<240&&k<135;i++){
  const x=(rand()-.5)*206,z=(rand()-.5)*206;
  if(hAt(x,z)<.1||Math.hypot(x,z-12)<24||Math.hypot(x,z+58)<22||RELICS.some(r=>Math.hypot(x-r.x,z-r.z)<17))continue;
  let s=.7+rand()*.85,y=hAt(x,z);
  dummy.position.set(x,y+1.4*s,z);dummy.rotation.set(0,rand()*TAU,0);dummy.scale.set(s,s,s);dummy.updateMatrix();trunks.setMatrixAt(k,dummy.matrix);
  dummy.position.y=y+4.7*s;dummy.scale.set(s,s,s);dummy.updateMatrix();pines.setMatrixAt(k,dummy.matrix);
  k++;
 }
 trunks.count=pines.count=k;trunks.instanceMatrix.needsUpdate=true;pines.instanceMatrix.needsUpdate=true;
 vegetation.add(trunks,pines);
 const gGeo=new THREE.ConeGeometry(.16,1.1,3),gMat=new THREE.MeshBasicMaterial({color:0x668f80,side:THREE.DoubleSide});
 const blades=new THREE.InstancedMesh(gGeo,gMat,650);
 let b=0;for(let i=0;i<900&&b<650;i++){
  const x=(rand()-.5)*177,z=(rand()-.5)*177;if(hAt(x,z)<.2)continue;
  if(Math.hypot(x,z-12)<14||RELICS.some(r=>Math.hypot(x-r.x,z-r.z)<11))continue;
  const s=.35+rand()*.7;dummy.position.set(x,hAt(x,z)+.35*s,z);dummy.rotation.set(0,rand()*TAU,0);dummy.scale.set(s,s,s);dummy.updateMatrix();blades.setMatrixAt(b++,dummy.matrix);
 }
 blades.count=b;blades.instanceMatrix.needsUpdate=true;vegetation.add(blades);
}
instances();

const decals=[];
function lantern(x,z,color=0x80d5ee,scale=1){
 const y=hAt(x,z);cy(x,y+1.15,z,.10,.12,2.3,stone2);orb(x,y+2.52,z,.25,new THREE.MeshBasicMaterial({color}));
 glow(color,x,y+2.5,z,4.0*scale);const l=new THREE.PointLight(color,5,16,2);l.position.set(x,y+2.45,z);scene.add(l);
}
function pillar(x,z,h=9,r=.75,material=stone){
 const y=hAt(x,z);cy(x,y+h/2,z,r,r*1.15,h,material,root,10);
 cy(x,y+h-.4,z,r*1.32,r*1.27,.7,stoneEdge);
 cy(x,y+.55,z,r*1.4,r*1.5,1.1,stone2);
}
function platform(x,z,rad=9){
 const y=hAt(x,z)-.3;
 cy(x,y,z,rad,rad+.5,.85,stone2,root,28);
 cy(x,y+.49,z,rad*.92,rad*.96,.17,stone,root,28);
 for(let a=0;a<20;a++){const th=a/20*TAU;const p=orb(x+Math.cos(th)*rad*.79,y+.63,z+Math.sin(th)*rad*.79,.13,gold);p.scale.set(.22,.05,.22);}
}
function rings(x,z,color,rad=3){
 const group=new THREE.Group();group.position.set(x,hAt(x,z)+2.65,z);root.add(group);
 const m=new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.7,depthWrite:false});
 const torus=new THREE.Mesh(new THREE.TorusGeometry(rad,.095,7,56),m);group.add(torus);
 const second=new THREE.Mesh(new THREE.TorusGeometry(rad*.78,.05,7,36),m);second.rotation.y=PI/3;group.add(second);
 const third=new THREE.Mesh(new THREE.TorusGeometry(rad*.5,.065,6,26),m);third.rotation.x=PI/3;group.add(third);
 const core=orb(0,0,0,.47,new THREE.MeshBasicMaterial({color}),group);
 glow(color,0,0,0,7,group);
 return {group,torus,second,third,core,base:hAt(x,z)+2.65};
}
function ruins(){
 // Ancient causeway toward the shattered gate
 for(let i=0;i<16;i++){
  const z=15-i*5.1,x=Math.sin(i*.65)*2;
  bx(x,hAt(x,z)+.1,z,5,.19,3.8,i%2?stone:stone2);
  if(i%3===0){const lx=10+(i%2)*3;pillar(-lx,z,3.4,.55);pillar(lx,z,3.4,.55);}
 }
 for(const [x,z] of [[0,12],[-39,-30],[44,19],[22,-51],[0,-58]])platform(x,z,x===0&&z===12?13:9.5);
 // Center citadel ruins, framing the Veil
 for(const x of [-16,-11,11,16]){
  pillar(x,-64,10+x%4,.91);pillar(x,-48,7,.78);
  bx(x,hAt(x,-56)+9,-56,1.5,1.2,16,stoneEdge);
 }
 for(const z of [-65,-48])for(const x of [-20,20])pillar(x,z,12,1.2);
 for(let i=0;i<3;i++){const z=-45-i*7;lantern(-12,z,0x90cfef,.7);lantern(12,z,0x90cfef,.7);}
 // Observatory pillars and broken astronomical ring
 for(let i=0;i<9;i++){
  const a=i/9*TAU,x=-39+Math.cos(a)*12,z=-30+Math.sin(a)*12;
  pillar(x,z,3+rand()*8,.8);
 }
 const orbit=mesh(new THREE.TorusGeometry(7,.22,8,80),gold);orbit.position.set(-39,hAt(-39,-30)+11,-30);orbit.rotation.x=PI/2.8;orbit.rotation.z=.3;
 lantern(-30,-20,0x8ddcff);
 // Ember grove: black basalt fragments and eternal flame
 for(let i=0;i<14;i++){
  const a=rand()*TAU,r=10+rand()*10,x=44+Math.cos(a)*r,z=19+Math.sin(a)*r;
  const b=bx(x,hAt(x,z)+1.6,z,1.5,3.2+rand()*4,1.8,obsidian);b.rotation.set(.08,rand()*TAU,(rand()-.5)*.2);
 }
 lantern(34,16,0xffa17d);lantern(54,16,0xffa17d);
 // Tide shrine arc and pools
 for(let i=0;i<8;i++){
  const a=PI*i/7,x=22+Math.cos(a)*10,z=-51+Math.sin(a)*8;
  pillar(x,z,4+Math.sin(a)*7,.6);
 }
 lantern(15,-47,0x6dfad7);lantern(30,-47,0x6dfad7);
 // Broken approach arches
 for(const z of [7,-22,-40]){
  pillar(-7,z,6,.65);pillar(7,z,6,.65);
  bx(0,hAt(0,z)+6,z,16,.8,1.4,stoneEdge);
 }
}
ruins();

const portal=rings(0,-58,0x9e68fa,6.5);
const portalSurface=mesh(new THREE.PlaneGeometry(12.7,12.7),new THREE.ShaderMaterial({
 transparent:true,depthWrite:false,side:THREE.DoubleSide,
 uniforms:{time:{value:0},sealed:{value:0}},
 vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
 fragmentShader:"varying vec2 vUv;uniform float time;uniform float sealed;void main(){vec2 p=vUv-.5;float r=length(p);float a=atan(p.y,p.x);float wave=sin(r*39.-time*2.5+a*7.)*.5+.5;float wave2=sin(a*12.-time*1.4-r*19.)*.5+.5;float mask=1.-smoothstep(.43,.5,r);vec3 violet=vec3(.32,.10,.6),sea=vec3(.08,.63,.68);vec3 c=mix(violet,sea,wave2*.63+sealed*.6);c+=pow(wave,9.)*vec3(.25,.12,.38);gl_FragColor=vec4(c,mask*(.53+.23*wave)*(1.-sealed*.65));}"
}));
portalSurface.position.set(0,hAt(0,-58)+2.7,-58);
root.add(portalSurface);
const relicMeshes=RELICS.map(r=>{
 const a=rings(r.x,r.z,r.color,2.35);a.group.scale.setScalar(.82);
 const base=cy(r.x,hAt(r.x,r.z)+.9,r.z,1.1,1.25,1.7,obsidian);
 const core=orb(r.x,hAt(r.x,r.z)+2.6,r.z,.75,new THREE.MeshBasicMaterial({color:r.color}));
 glow(r.color,r.x,hAt(r.x,r.z)+2.6,r.z,8);
 if(save.relics.includes(r.id)){a.group.visible=false;core.visible=false;}
 return {r,a,core};
});

function labelSprite(text){
 const canvas=document.createElement("canvas");canvas.width=512;canvas.height=96;
 const ctx=canvas.getContext("2d");ctx.textAlign="center";ctx.fillStyle="#f5e6ce";ctx.font="600 29px Georgia";ctx.shadowColor="#050e17";ctx.shadowBlur=8;
 ctx.fillText(text,256,54);
 const tex=new THREE.CanvasTexture(canvas);const m=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));
 m.scale.set(5.2,1.0,1);return m;
}
function humanFigure(name,x,z,colors={}){
 const g=new THREE.Group();g.position.set(x,hAt(x,z),z);root.add(g);
 const clothing=mat(colors.robe||0x203a48),trim=mat(colors.trim||0xbba77c);
 cy(0,1.2,0,.53,.77,1.8,clothing,g,12);
 cy(0,2.25,0,.36,.41,.68,clothing,g,11);
 orb(0,2.85,0,.39,skin,g);
 const h=orb(0,3.06,.03,.40,mat(colors.hair||0x554238),g);
 h.scale.set(1, .6, 1.02);
 for(const sx of [-1,1]){
  const arm=cy(sx*.62,1.96,-.07,.16,.20,1.26,clothing,g,8);arm.rotation.z=sx*.23;
  cy(sx*.29,.39,0,.2,.23,.78,stone2,g,7);
 }
 const collar=mesh(new THREE.TorusGeometry(.40,.055,5,20),trim,g);collar.rotation.x=PI/2;collar.position.set(0,2.3,-.1);
 const tag=labelSprite(name);tag.position.set(0,4.2,0);g.add(tag);
 return g;
}
const npcs=[
 {id:"jasper",name:"JASPER HOLLOWAY",x:3,z:13,lines:DIALOGUES.jasper,color:0xdfba68,group:humanFigure("JASPER",3,13,{robe:0x284352,trim:0xdfba68,hair:0xe6c26b})},
 {id:"ava",name:"AVA REES",x:-5,z:16,lines:DIALOGUES.ava,color:0x96c7fa,group:humanFigure("AVA",-5,16,{robe:0x334063,trim:0x96c7fa,hair:0x644736})},
 {id:"harper",name:"HARPER VALE",x:10,z:15,lines:DIALOGUES.harper,color:0xe99f88,group:humanFigure("HARPER",10,15,{robe:0x36483c,trim:0xbfd096,hair:0x9d5741})}
];
// Player: sculpted low-poly silhouette, robe, wand, hair and the yellow necklace.
const heroGroup=new THREE.Group();root.add(heroGroup);
const animated=new THREE.Group();heroGroup.add(animated);
const cape=mesh(new THREE.ConeGeometry(.87,2.35,11,1,true),robeBack,animated);
cape.position.set(0,1.17,.23);cape.rotation.x=PI;
const torso=cy(0,1.65,0,.47,.69,1.75,darkRobe,animated,12);
cy(0,2.45,0,.39,.47,.45,darkRobe,animated,12);
const head=orb(0,2.84,-.08,.42,skin,animated);head.scale.set(1,1.1,1);
const hairCap=orb(0,3.13,.02,.41,hair,animated);hairCap.scale.set(1,.55,1.03);
for(const dx of [-.17,.17])orb(dx,2.88,-.44,.036,obsidian,animated);
const ring=mesh(new THREE.TorusGeometry(.19,.048,5,24),gold,animated);ring.position.set(0,2.32,-.45);
const arms=[];
for(const sx of [-1,1]){
 const a=new THREE.Group();a.position.set(sx*.52,2.20,-.05);animated.add(a);
 cy(sx*.04,-.45,-.05,.17,.22,.95,darkRobe,a,8);
 orb(sx*.05,-.95,-.05,.15,skin,a);arms.push(a);
}
const leftBoot=cy(-.25,.37,-.08,.23,.25,.71,stone2,animated,7),rightBoot=cy(.25,.37,-.08,.23,.25,.71,stone2,animated,7);
const wand=new THREE.Group();arms[1].add(wand);wand.position.set(.11,-.96,-.3);wand.rotation.x=PI/2;
cy(0,.42,0,.035,.055,1,wood,wand);orb(0,.93,0,.12,iceMat,wand);
const wandTip=glow(0x8be6ff,0,.93,0,1.2,wand);
heroGroup.traverse(obj=>{if(obj.isMesh)obj.castShadow=true;});
heroGroup.position.set(0,hAt(0,23),23);
const worldPlus=createWorldPlus({scene,root,terrain:terrainMesh,hAt,rand,player:heroGroup,quality});

// Reusable particles: 1 GPU draw call for hundreds of spell motes.
const POOL=700,px=new Float32Array(POOL*3),pc=new Float32Array(POOL*3),vel=new Float32Array(POOL*3),ttl=new Float32Array(POOL);
const pgeom=new THREE.BufferGeometry();
pgeom.setAttribute("position",new THREE.BufferAttribute(px,3).setUsage(THREE.DynamicDrawUsage));
pgeom.setAttribute("color",new THREE.BufferAttribute(pc,3).setUsage(THREE.DynamicDrawUsage));
smallParticles=new THREE.Points(pgeom,new THREE.PointsMaterial({size:.22,vertexColors:true,transparent:true,opacity:.92,depthWrite:false,blending:THREE.AdditiveBlending}));
smallParticles.frustumCulled=false;scene.add(smallParticles);
for(let i=0;i<POOL;i++)px[3*i+1]=-1000;
let particleIndex=0;
function burst(pos,color,num=17,power=6){
 const col=new THREE.Color(color);
 for(let j=0;j<num;j++){
  const i=particleIndex++%POOL,k=i*3,a=rand()*TAU,u=rand()*2-1,r=Math.sqrt(1-u*u),speed=power*(.3+rand()*.7);
  px[k]=pos.x;px[k+1]=pos.y;px[k+2]=pos.z;
  vel[k]=Math.cos(a)*r*speed;vel[k+1]=u*speed+2;vel[k+2]=Math.sin(a)*r*speed;
  pc[k]=col.r;pc[k+1]=col.g;pc[k+2]=col.b;
  ttl[i]=.55+rand()*.75;
 }
}
function particles(dt){
 for(let i=0;i<POOL;i++)if(ttl[i]>0){
  ttl[i]-=dt;const k=i*3;
  px[k]+=vel[k]*dt;px[k+1]+=vel[k+1]*dt;px[k+2]+=vel[k+2]*dt;
  vel[k+1]-=4*dt;
  if(ttl[i]<=0)px[k+1]=-1000;
 }
 pgeom.attributes.position.needsUpdate=true;
 pgeom.attributes.color.needsUpdate=true;
}
const projectiles=[],ringsFX=[];
const S=[
 {name:"AETHER BOLT",cost:10,cd:.23,damage:37,speed:53,color:0x8bdcff,radius:.31},
 {name:"EMBER BURST",cost:25,cd:.8,damage:62,speed:34,color:0xff9868,radius:.6},
 {name:"FROST NOVA",cost:31,cd:2.7,damage:34,speed:0,color:0xa3ecff},
 {name:"HEAL",cost:39,cd:5.2,damage:-35,speed:0,color:0xa5ffbe}
];
function wave(x,y,z,color,scale=1){
 const m=mesh(new THREE.TorusGeometry(1,.055,5,42),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false}));
 m.position.set(x,y,z);m.rotation.x=PI/2;m.scale.setScalar(.1);ringsFX.push({m,t:0,scale});
}
function explosion(pos,color,radius,damage,slow=false){
 burst(pos,color,35,8);wave(pos.x,pos.y,pos.z,color,radius);
 for(const e of enemies){
  if(e.dead)continue;
  const dist=e.group.position.distanceTo(pos);
  if(dist<radius+e.size)hitEnemy(e,damage*(1-.45*Math.max(0,dist/radius)),slow);
 }
}
let selected=0,hero={health:statsFor(save).maxHealth,mana:statsFor(save).maxMana,stamina:100,attackCooldown:0,dodgeCooldown:0,dodgeTime:0,invincible:0,step:0,parryTime:0,parryCooldown:0,combo:0};
function selectSpell(i){selected=i;for(let j=0;j<4;j++)$("spell-"+j).classList.toggle("selected",j===i);}
function cast(){
 if(!playing||dialogueOpen||hero.attackCooldown>0)return;
 const s=S[selected];if(hero.mana<s.cost){notify("NOT ENOUGH AETHER");return;}
 hero.mana-=s.cost;hero.attackCooldown=s.cd;sound.spell(selected);
 const from=heroGroup.position.clone().add(new V3(0,2,0));
 if(selected===3){
  hero.health=Math.min(statsFor(save).maxHealth,hero.health+35+save.upgrades.power*3);burst(from,0xa5ffbe,35,5);
  wave(from.x,hAt(from.x,from.z)+.2,from.z,0xa5ffbe,2);
  return;
 }
 if(selected===2){explosion(from,0xa6e9ff,9,34*statsFor(save).damageMult,true);return;}
 const dir=new V3(Math.sin(yaw),clamp(.16-pitch*.75,-.25,.5),-Math.cos(yaw)).normalize();
 const m=orb(from.x,from.y,from.z,s.radius,new THREE.MeshBasicMaterial({color:s.color}));
 const halo=glow(s.color,0,0,0,s.radius*7,m);
 projectiles.push({m,dir,vel:s.speed,life:1.8,damage:s.damage*statsFor(save).damageMult,color:s.color,type:selected,r:s.radius});
 burst(from,s.color,12,4);
}
function updateProjectiles(dt){
 for(let i=projectiles.length-1;i>=0;i--){
  const p=projectiles[i];p.life-=dt;
  p.m.position.addScaledVector(p.dir,p.vel*dt);
  const pos=p.m.position;
  let hit=false;
  for(const e of enemies){if(e.dead)continue;
   if(e.group.position.distanceTo(pos)<e.size+1.25){
    if(p.type===1)explosion(pos,p.color,6.5,p.damage);else{hitEnemy(e,p.damage);burst(pos,p.color,15,6);}
    hit=true;break;
   }
  }
  if(pos.y<hAt(pos.x,pos.z)+.25||hit||p.life<=0){
   if(!hit&&p.type===1)explosion(pos,p.color,4.5,p.damage*.7);
   else if(!hit)burst(pos,p.color,7,3);
   root.remove(p.m);p.m.material.dispose();projectiles.splice(i,1);
  }
 }
 for(let i=ringsFX.length-1;i>=0;i--){
  const r=ringsFX[i];r.t+=dt;
  r.m.scale.setScalar(.1+r.t*3.3*r.scale);
  r.m.material.opacity=Math.max(0,1-r.t/.63);
  if(r.t>.63){root.remove(r.m);r.m.geometry.dispose();r.m.material.dispose();ringsFX.splice(i,1);}
 }
}
function creature(x,z,tier=0,tag=null){
 const g=new THREE.Group();g.position.set(x,hAt(x,z)+1.2,z);root.add(g);
 const scale=tier?2.25:1;g.scale.setScalar(scale);
 const c=tier?0xc06cf6:0xe569a3;
 const material=tier?mat(0x26213d,.5):shadowMat;
 const torso=orb(0,.4,0,.88,material,g);torso.scale.set(.72,1.45,.66);
 orb(0,1.35,-.13,.56,material,g);
 for(const sx of [-1,1]){
  const horn=mesh(new THREE.ConeGeometry(.21,.95,6),material,g);horn.position.set(sx*.39,1.92,-.05);horn.rotation.z=sx*.31;
  const arm=orb(sx*.88,.35,0,.34,material,g);arm.scale.set(.85,1.6,1);
  glow(c,sx*.21,1.43,-.5,.72,g);
 }
 const core=orb(0,.35,-.52,.35,new THREE.MeshBasicMaterial({color:c}),g);
 const halo=glow(c,0,.35,-.5,2.5,g);
 const tell=mesh(new THREE.RingGeometry(tier?4.7:1.8,tier?5.1:2.15,44),new THREE.MeshBasicMaterial({color:tier?0xff7295:0xffb6a7,transparent:true,opacity:.32,side:THREE.DoubleSide,depthWrite:false}));
 tell.rotation.x=-PI/2;tell.visible=false;
 const e={group:g,x,z,homeX:x,homeZ:z,hp:tier?365:100,max:tier?365:100,size:tier?3.0:1.15,
  tier,tag,dead:false,timer:1+rand()*1.5,slow:0,flash:0,death:0,phase:rand()*TAU,core,tell,windup:0,attackX:x,attackZ:z};
 enemies.push(e);return e;
}
const enemies=[];
for(const r of RELICS){
 if(save.relics.includes(r.id))continue;
 for(let j=0;j<3;j++){
  const a=(j/3)*TAU+.5,d=7.3+rand()*3;
  creature(r.x+Math.cos(a)*d,r.z+Math.sin(a)*d,0,r.id);
 }
}
let boss=null;
function spawnWarden(){
 if(boss||save.wardenDefeated||save.relics.length<3)return;
 boss=creature(0,-58,1,"warden");boss.hp=365;
 notify("THE ABYSSAL WARDEN HAS AWAKENED");sound.boss();
 burst(boss.group.position.clone().add(new V3(0,4,0)),0xb18afa,95,13);
}
function hitEnemy(e,damage,freeze=false){
 if(e.dead)return;
 const before=e.hp;e.hp=Math.max(0,e.hp-damage);e.flash=.22;
 if(freeze){e.slow=3.2;e.windup=0;e.tell.visible=false;}
 sound.hit();
 burst(e.group.position.clone().add(new V3(0,1.6,0)),e.tier?0xbf8aff:0xf9a5cf,11,4);
 const pos=e.group.position.clone().add(new V3(0,e.tier?4.7:2.3,0));
 floatingNumber("-"+Math.ceil(Math.min(before,damage)),pos,freeze?"#a5eeff":"#ffe3b3");
 if(e.hp<=0){
  e.dead=true;e.death=.55;e.tell.visible=false;
  burst(e.group.position.clone().add(new V3(0,2,0)),e.tier?0x9a89ff:0x8ce5ff,e.tier?115:35,11);
  const oldRank=rankAtXP(save.xp);
  gainRewards(save,e.tier?220:45,e.tier?8:1);
  persist();interfacePlus.renderShop();
  if(rankAtXP(save.xp)>oldRank){notify("RANK UP · "+rankAtXP(save.xp));sound.collect();}
  if(e.tier){defeatWarden(save);persist();notify("THE WARDEN IS FALLEN · SEAL THE VEIL");sound.boss();}
 }
}
function takeHit(amount,source=null){
 if(hero.parryTime>0&&source){
  hero.parryTime=0;hero.mana=Math.min(statsFor(save).maxMana,hero.mana+13);
  hitEnemy(source,source.tier?48:58,true);hero.invincible=.22;sound.parry();
  notify("PERFECT PARRY · COUNTERSTRIKE");return;
 }
 if(hero.invincible>0||!playing||dialogueOpen)return;
 hero.health=Math.max(0,hero.health-amount);hero.invincible=.65;sound.hurt();
 document.getElementById("vignette").style.boxShadow="inset 0 0 150px rgba(234,38,55,.6)";
 setTimeout(()=>{document.getElementById("vignette").style.boxShadow="";},220);
 if(hero.health<=0)endGame(false);
}
function floatingNumber(text,position,color="#e7d2a9"){
 const el=document.createElement("div");el.className="damage-number";el.textContent=text;el.style.color=color;
 const projection=position.clone().project(camera);
 if(projection.z>1)return;
 el.style.left=(projection.x*.5+.5)*window.innerWidth+"px";
 el.style.top=(-projection.y*.5+.5)*window.innerHeight+"px";
 document.body.appendChild(el);setTimeout(()=>el.remove(),620);
}
function melee(){
 if(!playing||dialogueOpen||hero.attackCooldown>0)return;
 hero.attackCooldown=.36;hero.combo=(hero.combo+1)%3;
 const p=heroGroup.position,fwdX=Math.sin(yaw),fwdZ=-Math.cos(yaw);
 let landed=false;
 for(const e of enemies){
  if(e.dead)continue;
  const dx=e.group.position.x-p.x,dz=e.group.position.z-p.z,d=Math.hypot(dx,dz);
  if(d>3.7+e.size)continue;
  if((dx*fwdX+dz*fwdZ)/Math.max(.01,d)<-.05)continue;
  hitEnemy(e,(24+hero.combo*7)*statsFor(save).damageMult);landed=true;
 }
 burst(p.clone().add(new V3(fwdX*2,1.8,fwdZ*2)),0xfde3b1,22,5);
 if(!landed)sound.dash();
}
function parry(){
 if(!playing||dialogueOpen||hero.parryCooldown>0||hero.stamina<18)return;
 hero.stamina-=18;hero.parryTime=.38;hero.parryCooldown=1.15;
 wave(heroGroup.position.x,hAt(heroGroup.position.x,heroGroup.position.z)+.18,heroGroup.position.z,0xb3e9ff,2);
 sound.dash();
}
function enemiesTick(dt,t){
 const heroPos=heroGroup.position;
 for(let i=enemies.length-1;i>=0;i--){
  const e=enemies[i];
  if(e.dead){
   e.death-=dt;e.group.scale.multiplyScalar(Math.max(.1,1-dt*2));
   if(e.death<=0){root.remove(e.group);root.remove(e.tell);e.tell.geometry.dispose();e.tell.material.dispose();enemies.splice(i,1);}
   continue;
  }
  const p=e.group.position,dx=heroPos.x-p.x,dz=heroPos.z-p.z,dist=Math.hypot(dx,dz),reached=dist<e.size+1.3;
  e.timer-=dt;e.flash=Math.max(0,e.flash-dt);e.slow=Math.max(0,e.slow-dt);
  const speed=(e.tier?2.4:3.15)*(e.slow>0?.3:1);
  if(e.windup>0){
   e.windup-=dt;
   e.tell.visible=true;e.tell.material.opacity=.27+.39*(.5+.5*Math.sin(t*17));
   if(e.windup<=0){
    e.tell.visible=false;const radius=e.tier?5.0:2.18;
    const d=Math.hypot(heroPos.x-e.attackX,heroPos.z-e.attackZ);
    burst(new V3(e.attackX,hAt(e.attackX,e.attackZ)+.3,e.attackZ),e.tier?0xeb79ad:0xffc3ad,e.tier?34:12,5);
    if(d<radius)takeHit(e.tier?27:13,e);
    e.timer=e.tier?3.2:1.7;
   }
  }else{
   e.tell.visible=false;
   if(playing&&!dialogueOpen&&dist<(e.tier?33:19)&&!reached){
    p.x+=dx/dist*speed*dt;p.z+=dz/dist*speed*dt;
   }else if(dist>25&&!e.tier){
    const hx=e.homeX-p.x,hz=e.homeZ-p.z,hl=Math.hypot(hx,hz)||1;
    p.x+=hx/hl*speed*.36*dt;p.z+=hz/hl*speed*.36*dt;
   }
   if(e.timer<=0&&playing&&!dialogueOpen&&dist<(e.tier?17:3.5)){
    e.attackX=heroPos.x;e.attackZ=heroPos.z;
    e.windup=e.tier?1.15:.78;
    e.tell.position.set(e.attackX,hAt(e.attackX,e.attackZ)+.13,e.attackZ);
    e.tell.visible=true;
   }else if(e.timer<=0)e.timer=.35;
  }
  p.y=hAt(p.x,p.z)+(e.tier?2.5:1.2)+Math.sin(t*2.5+e.phase)*.24;
  const angle=Math.atan2(dx,-dz);e.group.rotation.y=angle;
  e.core.material.color.setHex(e.flash>0?0xffffff:(e.tier?0xc06cf6:0xe569a3));
 }
 if(boss&&!boss.dead){
  $("boss").classList.remove("hidden");$("boss-fill").style.width=clamp(boss.hp/365*100,0,100)+"%";
 }else $("boss").classList.add("hidden");
}

const sparks=[],waypoint=glow(0xf3cb83,0,0,0,2);
function updateRelics(t){
 for(const p of relicMeshes){
  const got=save.relics.includes(p.r.id);
  p.a.group.visible=!got;p.core.visible=!got;
  if(got)continue;
  p.a.group.rotation.y=t*.26;
  p.a.group.rotation.z=Math.sin(t*.7)*.12;
  p.core.position.y=hAt(p.r.x,p.r.z)+2.6+Math.sin(t*2+p.r.x)*.24;
 }
 portal.group.rotation.z=t*.07;portal.second.rotation.y=t*.13;portal.third.rotation.x=t*.15;
 portalSurface.material.uniforms.time.value=t;
 portalSurface.material.uniforms.sealed.value=save.finished?1:0;
}
let yaw=0,pitch=.16,playing=false,started=false,dialogueOpen=false,dialogueNpc=null,dialogueIndex=0,toasting=0,gameEnded=false;
const interfacePlus=setupGameUI({hud,menu,getSave:()=>save,onPurchase:type=>{
  const old=statsFor(save),oldHealth=hero.health,oldMana=hero.mana;
  if(!purchaseUpgrade(save,type))return false;
  const next=statsFor(save);
  hero.health=Math.min(next.maxHealth,oldHealth+(next.maxHealth-old.maxHealth));
  hero.mana=Math.min(next.maxMana,oldMana+(next.maxMana-old.maxMana));
  persist();sound.purchase();notify(UPGRADE_LABELS[type]+" UPGRADED");return true;
}});
interfacePlus.renderShop();
if(save.relics.length===3)spawnWarden();
const keys={};
function notify(txt){$("toast").textContent=txt;$("toast").classList.remove("hidden");toasting=4;}
const target=new V3(),desired=new V3(),moveVec=new V3();
function heroMove(dt,t){
 if(!playing||dialogueOpen)return;
 hero.attackCooldown=Math.max(0,hero.attackCooldown-dt);
 hero.dodgeCooldown=Math.max(0,hero.dodgeCooldown-dt);
 hero.invincible=Math.max(0,hero.invincible-dt);
 hero.parryTime=Math.max(0,hero.parryTime-dt);
 hero.parryCooldown=Math.max(0,hero.parryCooldown-dt);
 hero.mana=Math.min(statsFor(save).maxMana,hero.mana+statsFor(save).manaRegen*dt);
 const input=moveAxis(keys);
 const sprint=(keys.ShiftLeft||keys.ShiftRight)&&hero.stamina>0&&input.active&&hero.dodgeTime<=0;
 hero.stamina=Math.min(100,Math.max(0,hero.stamina+(sprint?-21:16)*dt));
 const fx=Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=Math.sin(yaw);
 let vx=fx*input.z+rx*input.x,vz=fz*input.z+rz*input.x;
 if(hero.dodgeTime>0){
  hero.dodgeTime-=dt;
  vx=hero.dodgeX;vz=hero.dodgeZ;
 }
 const speed=hero.dodgeTime>0?17:(sprint?8.9:5.2);
 let x=heroGroup.position.x+vx*speed*dt,z=heroGroup.position.z+vz*speed*dt;
 // Solid coastline guard. Avoid water and out-of-map positions.
 if(hAt(x,z)>-1.45&&Math.hypot(x,z+14)<112){heroGroup.position.x=x;heroGroup.position.z=z;}
 const y=hAt(heroGroup.position.x,heroGroup.position.z);
 heroGroup.position.y=lerp(heroGroup.position.y,y,Math.min(1,dt*12));
 const walk=Math.hypot(vx,vz),moving=walk>.01;
 const desiredYaw=Math.atan2(vx,-vz);if(moving){let diff=((desiredYaw-heroGroup.rotation.y+PI)%TAU+TAU)%TAU-PI;heroGroup.rotation.y+=diff*Math.min(1,dt*13);}
 animated.position.y=moving?Math.abs(Math.sin(t*(sprint?15:10)))*.11:Math.sin(t*1.7)*.045;
 arms[0].rotation.x=moving?Math.sin(t*11)*.35:Math.sin(t*2)*.07;
 arms[1].rotation.x=moving?-Math.sin(t*11)*.35:0;
 cape.rotation.x=PI+(moving?-.19:0)+Math.sin(t*3)*.04;
}
function dodge(){
 if(!playing||dialogueOpen||hero.dodgeCooldown>0||hero.stamina<24)return;
 const m=moveAxis(keys),fx=Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=Math.sin(yaw);
 hero.dodgeX=m.active?(fx*m.z+rx*m.x):fx;hero.dodgeZ=m.active?(fz*m.z+rz*m.x):fz;
 hero.dodgeTime=.3;hero.dodgeCooldown=.8;hero.invincible=.48;hero.stamina-=24;
 burst(heroGroup.position.clone().add(new V3(0,.7,0)),0x86d2e8,12,5);sound.dash();
}
function camTick(dt){
 const p=heroGroup.position;
 const fwdX=Math.sin(yaw),fwdZ=-Math.cos(yaw);
 const dist=9.4,up=4.6+pitch*7;
 desired.set(p.x-fwdX*dist,Math.max(hAt(p.x-fwdX*dist,p.z-fwdZ*dist)+1.3,p.y+up),p.z-fwdZ*dist);
 camera.position.lerp(desired,Math.min(1,dt*8));
 target.set(p.x+fwdX*3.0,p.y+1.95+pitch*2.7,p.z+fwdZ*3.0);
 camera.lookAt(target);
}
function nearObject(){
 const p=heroGroup.position;
 for(const n of npcs)if(Math.hypot(p.x-n.x,p.z-n.z)<4.0)return {kind:"npc",n,dist:Math.hypot(p.x-n.x,p.z-n.z)};
 for(const r of RELICS)if(!save.relics.includes(r.id)&&Math.hypot(p.x-r.x,p.z-r.z)<5.1)return {kind:"relic",r};
 if(save.wardenDefeated&&!save.finished&&Math.hypot(p.x,p.z+58)<10)return {kind:"seal"};
 return null;
}
function interact(){
 if(!playing)return;
 if(dialogueOpen){
  dialogueIndex++;
  if(dialogueIndex>=dialogueNpc.lines.length){dialogueOpen=false;$("dialogue").classList.add("hidden");dialogueNpc=null;}
  else $("dialogue-line").textContent=dialogueNpc.lines[dialogueIndex];
  return;
 }
 const item=nearObject();if(!item)return;
 if(item.kind==="npc"){
  dialogueNpc=item.n;dialogueIndex=0;dialogueOpen=true;
  $("speaker").textContent=item.n.name;$("dialogue-line").textContent=item.n.lines[0];$("dialogue").classList.remove("hidden");
  if(item.n.id==="jasper"&&!save.metJasper){save.metJasper=true;persist();notify("NEW QUEST: AWAKEN THE THREE SIGILS");}
 }else if(item.kind==="relic"){
  const alive=enemies.some(e=>!e.dead&&e.tag===item.r.id);
  if(claimRelic(save,item.r.id,alive)){
   persist();sound.collect();notify(item.r.name+" RESTORED");burst(new V3(item.r.x,hAt(item.r.x,item.r.z)+3,item.r.z),item.r.color,100,13);
   if(save.relics.length===3)spawnWarden();
  }else notify(alive?"DEFEAT THE GUARDIANS FIRST":"SPEAK WITH JASPER FIRST");
 }else if(item.kind==="seal"){
  if(sealVeil(save)){persist();sound.collect();notify("THE VEIL IS SEALED");setTimeout(()=>endGame(true),1100);}
 }
}
function endGame(won){
 if(gameEnded)return;gameEnded=true;playing=false;
 if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();
 $("game-over").classList.remove("hidden");
 $("end-eyebrow").textContent=won?"BOOK ONE · THE SALTWATER THREAD":"THE VEIL REMAINS";
 $("end-title").textContent=won?"THE COAST REMEMBERS":"FALLEN";
 $("end-description").textContent=won?"Three sigils. One forgotten oath. This is only the beginning.":"Your aether fades, but the fight is not over.";
 menu.classList.add("hidden");hud.classList.add("hidden");
}
function respawn(){
 gameEnded=false;$("game-over").classList.add("hidden");
 hero.health=statsFor(save).maxHealth;hero.mana=statsFor(save).maxMana;hero.stamina=100;hero.parryTime=0;hero.parryCooldown=0;
 hero.attackCooldown=0;hero.invincible=2;
 heroGroup.position.set(0,hAt(0,23),23);
 for(const r of RELICS)if(!save.relics.includes(r.id)&&!enemies.some(e=>!e.dead&&e.tag===r.id))
  for(let j=0;j<3;j++){let a=j/3*TAU+.5;creature(r.x+Math.cos(a)*9,r.z+Math.sin(a)*9,0,r.id);}
 if(save.relics.length===3&&!save.wardenDefeated&&(!boss||boss.dead)) {boss=null;spawnWarden();}
 menu.classList.remove("hidden");hud.classList.add("hidden");
}
$("retry").addEventListener("click",respawn);
$("return-menu").addEventListener("click",()=>{gameEnded=false;$("game-over").classList.add("hidden");menu.classList.remove("hidden");hud.classList.add("hidden");});
function pause(){playing=false;sound.setActive(false);menu.classList.remove("hidden");hud.classList.add("hidden");$("load-status").textContent="PAUSED · CLICK TO RESUME";playBtn.textContent="CONTINUE EXPLORING  ↗";}
function resume(){
 if(gameEnded)return;
 sound.unlock();
 try{
  const p=renderer.domElement.requestPointerLock();
  if(p&&p.catch)p.catch(()=>{$("load-status").textContent="CLICK THE GAME TO ENABLE MOUSE LOOK";});
 }catch(e){$("load-status").textContent="MOUSE LOCK UNAVAILABLE";}
}
playBtn.addEventListener("click",resume);
$("new-game").addEventListener("click",()=>{
 if(!confirm("Erase The Veil quest progress and start from the beginning?"))return;
 const q=save.quality;save=freshSave();save.quality=q;persist();location.reload();
});
document.addEventListener("pointerlockchange",()=>{
 if(gameEnded)return;
 if(document.pointerLockElement===renderer.domElement){
  playing=true;started=true;sound.setActive(true);menu.classList.add("hidden");hud.classList.remove("hidden");
  $("load-status").textContent="READY";
 }else if(started)pause();
});
document.addEventListener("mousemove",e=>{
 if(document.pointerLockElement!==renderer.domElement||!playing)return;
 yaw-=e.movementX*.0024;
 pitch=clamp(pitch-e.movementY*.0018,-.32,.58);
});
document.addEventListener("keydown",e=>{
 if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();
 keys[e.code]=true;if(e.repeat)return;
 if(e.code==="Digit1")selectSpell(0);
 if(e.code==="Digit2")selectSpell(1);
 if(e.code==="Digit3")selectSpell(2);
 if(e.code==="Digit4")selectSpell(3);
 if(e.code==="KeyE")interact();
 if(e.code==="Space")dodge();
 if(e.code==="KeyF")cast();
 if(e.code==="KeyV")melee();
 if(e.code==="KeyQ")parry();
 if(e.code==="KeyM")interfacePlus.toggleMap();
 if(e.code==="KeyN"){const muted=sound.toggleMute();notify(muted?"AUDIO MUTED":"AUDIO ON");}
 if(e.code==="KeyK"&&playing)document.exitPointerLock();
 if(e.code==="Escape"&&document.pointerLockElement!==renderer.domElement&&playing)pause();
});
document.addEventListener("keyup",e=>{keys[e.code]=false;});
window.addEventListener("blur",()=>{for(const k in keys)keys[k]=false;});
renderer.domElement.addEventListener("mousedown",e=>{if(e.button===0)cast();else if(e.button===2)melee();});
renderer.domElement.addEventListener("contextmenu",e=>e.preventDefault());
let hudAcc=0;
const updateHud=()=>{
 const q=currentQuest(save);
 $("objective-title").textContent=q.title;
 $("objective-sub").textContent=q.hint;
 $("health-fill").style.width=hero.health/statsFor(save).maxHealth*100+"%";$("health-number").textContent=Math.ceil(hero.health);
 $("mana-fill").style.width=hero.mana/statsFor(save).maxMana*100+"%";$("mana-number").textContent=Math.floor(hero.mana);
 $("stamina-fill").style.width=hero.stamina+"%";$("stamina-number").textContent=Math.floor(hero.stamina);
 const p=heroGroup.position,dx=q.x-p.x,dz=q.z-p.z;
 const bearing=Math.atan2(dx,-dz)-yaw;
 $("waypoint-arrow").style.transform="rotate("+(bearing*180/PI)+"deg)";
 $("waypoint-dist").textContent=Math.round(Math.hypot(dx,dz))+" M";
 $("location").textContent=save.finished?"THE RESTORED COAST":Math.hypot(p.x,p.z+58)<22?"THE VEIL GATE":RELICS.find(r=>Math.hypot(p.x-r.x,p.z-r.z)<20)?.location||"THE SHATTERED COAST";
 interfacePlus.render(heroGroup.position,q,RELICS,enemies,npcs,.12);
 const item=nearObject(),el=$("prompt");
 if(!item||dialogueOpen){el.classList.add("hidden");}
 else{
  el.classList.remove("hidden");
  el.innerHTML="<b>[ E ]</b> "+(item.kind==="npc"?"SPEAK TO "+item.n.name:item.kind==="seal"?"SEAL THE VEIL":"CLAIM "+item.r.name);
 }
};
function animate(){
 requestAnimationFrame(animate);
 const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
 waterMat.uniforms.time.value=t;
 updateRelics(t);
 worldPlus.update(dt,t);
 if(playing&&!gameEnded){heroMove(dt,t);enemiesTick(dt,t);updateProjectiles(dt);particles(dt);hudAcc+=dt;if(hudAcc>.10){hudAcc=0;updateHud();}}
 else{for(const n of npcs)n.group.rotation.y=Math.sin(t*.35+n.x)*.15;}
 camTick(dt);
 if(toasting>0){toasting-=dt;if(toasting<=0)$("toast").classList.add("hidden");}
 frameTotal+=dt;frames++;
 if(frameTotal>1.1){
  fps=Math.round(frames/frameTotal);frames=0;frameTotal=0;
  $("fps").textContent=fps+" FPS  ·  "+(quality==="auto"?"AUTO":quality.toUpperCase());
  // Auto scaler never raises the internal pixel ratio above its GPU-conscious cap.
  if(quality==="auto"&&started){
   const cap=Math.min(window.devicePixelRatio||1,1.55),before=activeDpr;
   if(fps<42&&activeDpr>.8)activeDpr=Math.max(.8,activeDpr-.12);
   if(fps>58&&activeDpr<cap)activeDpr=Math.min(cap,activeDpr+.06);
   if(Math.abs(before-activeDpr)>.015)renderer.setPixelRatio(activeDpr);
  }
 }
 renderer.render(scene,camera);
}
window.addEventListener("resize",()=>{
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight,false);
});
applyQuality();
camTick(.1);updateHud();
$("load-status").textContent="READY · CLICK ENTER THE VEIL";
animate();
