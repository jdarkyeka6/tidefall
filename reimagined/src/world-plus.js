import * as THREE from "three";

// Second-generation environmental art layer. Draw-call conscious and deterministic.
// No downloads, tracking, or external textures. All art is generated in the browser.
export function createWorldPlus({scene,root,terrain,hAt,rand,player,quality="auto"}) {
 const PI=Math.PI,TAU=2*PI;
 const group=new THREE.Group();group.name="Tidefall Environment 2";root.add(group);
 const detail=new THREE.Group();detail.name="Optional Detail";group.add(detail);
 const dynamic=[];
 const make=(geo,mat,parent=group)=>{const m=new THREE.Mesh(geo,mat);parent.add(m);return m;};
 const mat=(c,rough=.88,metal=0)=>new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:metal});
 const limestone=mat(0x758c94),pale=mat(0x97a5ab),slate=mat(0x303e4a),roof=mat(0x25435d),metal=mat(0x8b99a2,.38,.75),warm=mat(0xd9b17a,.43,.45);
 const green=mat(0x41685f),misty=new THREE.MeshBasicMaterial({color:0x92dae0,transparent:true,opacity:.07,depthWrite:false,side:THREE.DoubleSide});
 const boxGeo=new THREE.BoxGeometry(1,1,1),sphereGeo=new THREE.IcosahedronGeometry(1,1),hexGeo=new THREE.CylinderGeometry(1,1,1,8);
 const cobble=generateGroundTexture();
 if(terrain?.material){terrain.material.map=cobble;terrain.material.needsUpdate=true;}
 const g=(p,s,material,parent=group)=>{const m=make(boxGeo,material,parent);m.position.set(...p);m.scale.set(...s);return m;};
 const tower=(x,z,r,h,y=0)=>{
   const baseY=hAt(x,z)+y,body=make(new THREE.CylinderGeometry(r*.93,r,h,10),limestone);
   body.position.set(x,baseY+h*.5,z);body.castShadow=true;
   const base=make(new THREE.CylinderGeometry(r*1.16,r*1.2,.85,10),slate);base.position.set(x,baseY+.4,z);
   const top=make(new THREE.CylinderGeometry(r*1.12,r*1.12,.8,10),pale);top.position.set(x,baseY+h+.15,z);
   const spire=make(new THREE.ConeGeometry(r*1.42,3.3,10),roof);spire.position.set(x,baseY+h+2.1,z);spire.castShadow=true;
   const needle=make(new THREE.CylinderGeometry(.06,.06,1.5,6),warm);needle.position.set(x,baseY+h+4.1,z);
   for(let i=0;i<8;i++){const a=i*TAU/8,p=make(boxGeo,slate);p.position.set(x+Math.sin(a)*r*.84,baseY+h*.74,z+Math.cos(a)*r*.84);p.scale.set(.4,1.7,.13);p.rotation.y=a;}
   return {x,z,h};
 };
 const arch=(x,z,w=11,h=9,rot=0)=>{
   const y=hAt(x,z)+.1,base=new THREE.Group();base.position.set(x,y,z);base.rotation.y=rot;group.add(base);
   for(const d of [-1,1]){
     const col=make(new THREE.CylinderGeometry(.84,1.05,h,9),limestone,base);col.position.set(d*w*.5,h*.5,0);col.castShadow=true;
     const cap=g([d*w*.5,h-.15,0],[2.15,.85,2.2],pale,base);
     const socket=g([d*w*.5,.5,0],[2.55,1.15,2.4],slate,base);
     for(const off of [-.28,.28])g([d*w*.5+off,h*.42,-.83],[.12,h*.55,.12],slate,base);
   }
   const beam=g([0,h-.35,0],[w+1,1.3,2.2],pale,base);beam.castShadow=true;
   for(let i=0;i<10;i++)g([-w/2+(i+.5)*w/10,h+.62,0],[.52,.82,1.9],limestone,base);
   const keystone=make(new THREE.BoxGeometry(1.3,2.3,2.45),warm,base);keystone.position.set(0,h-.15,0);keystone.rotation.z=PI/4;
   return base;
 };
 const banners=[];
 function banner(x,z,col=0x9bb9d1,width=2.2,length=6,y=7){
   const tex=generateBannerTexture(col),groupB=new THREE.Group();groupB.position.set(x,hAt(x,z)+y,z);group.add(groupB);
   const pole=g([0,0,0],[width+1.1,.12,.12],metal,groupB);
   const fabric=make(new THREE.PlaneGeometry(width,length,1,8),new THREE.MeshStandardMaterial({map:tex,side:THREE.DoubleSide,transparent:true,roughness:1}),groupB);
   fabric.position.y=-length/2-.08;fabric.position.z=.06;
   banners.push({mesh:fabric,phase:rand()*TAU});
   return groupB;
 }
 function rune(x,z,r,color=0x74e5f0){
  const map=generateRuneTexture();
  const shader=new THREE.MeshBasicMaterial({map,color,transparent:true,opacity:.73,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  const mesh=make(new THREE.PlaneGeometry(r*2,r*2),shader);
  mesh.rotation.x=-PI/2;mesh.position.set(x,hAt(x,z)+.105,z);return mesh;
 }
 // An actual silhouette over the central courtyard, including a high lookout.
 for(const [x,z,r,h] of [[-25,1,3.2,24],[25,1,3.2,24],[-33,35,3.1,20],[33,35,3.1,20],[-8,-12,3,15],[8,-12,3,15]]){
   tower(x,z,r,h);
 }
 arch(0,3,14,11,0);arch(0,-12,13,12,0);arch(0,31,19,11,0);
 for(const x of [-32,32]){
   for(const z of [5,13,21])g([x,hAt(x,z)+7,z],[2.5,13,5.2],limestone);
   for(const z of [5,13,21])g([x,hAt(x,z)+13.8,z],[3.0,1.1,5.4],pale);
   for(const z of [7,19])banner(x+(x<0?1.6:-1.6),z,x<0?0x659aa4:0xb29e74,1.5,6,13.2);
 }
 banner(-7,5,0x409bb5,2.9,7.5,12.3);banner(7,5,0x8da1c3,2.9,7.5,12.3);
 const grandStair=new THREE.Group();group.add(grandStair);
 for(let i=0;i<8;i++){
   const z=-5+i*.91,y=hAt(0,z)+.12+i*.24;
   const step=g([0,y,z],[7,.38,1.5],i%2?pale:limestone);
 }
 for(const [x,z] of [[-39,-30],[44,19],[22,-51],[0,-58]]){
   rune(x,z,x===0?6.7:5.1,x===-39?0x8ddcff:x===44?0xffb67a:x===22?0x70edce:0xaa8bfa);
 }
 const monuments=[
  [-39,-30,10,0x78deff],[44,19,10,0xfba074],[22,-51,8,0x6bedd3]
 ];
 for(const [x,z,r,color] of monuments){
   for(let i=0;i<5;i++){
     const a=i*TAU/5+.4,rr=r+2.2,tx=x+Math.cos(a)*rr,tz=z+Math.sin(a)*rr;
     const h=4.5+rand()*5;
     const ob=make(new THREE.CylinderGeometry(.8,1.15,h,5),i%2?limestone:slate);ob.position.set(tx,hAt(tx,tz)+h/2,tz);ob.rotation.z=(rand()-.5)*.13;
     const cap=make(new THREE.OctahedronGeometry(.5),new THREE.MeshBasicMaterial({color}));
     cap.position.set(tx,hAt(tx,tz)+h+.4,tz);
   }
 }
 // Huge interlocking rings frame the finale. Low-poly stone + metallic filigree.
 for(const radius of [9,10.2,11.1]){
  const t=make(new THREE.TorusGeometry(radius,radius===9?.5:.15,7,72),radius===9?limestone:metal);
  t.position.set(0,hAt(0,-58)+4.5,-58);t.rotation.y=radius===11.1?.26:radius===10.2?-.18:0;
  t.rotation.z=.12;
 }
 for(const x of [-14,14])tower(x,-58,2.4,16);
 arch(0,-78,14,10);arch(0,-38,16,10);
 banner(-6,-43,0x7a5e9a,2,6,9);banner(6,-43,0x376a86,2,6,9);
 // Polished low-poly roads, cobbles and deliberate composition.
 const roadMat=mat(0x738389);
 const dummy=new THREE.Object3D(),road=new THREE.InstancedMesh(boxGeo,roadMat,330);let k=0;
 for(let i=0;i<330;i++){
  const z=48-(i%70)*1.7,x=((Math.floor(i/70)-2)*1.52)+(rand()-.5)*.4;
  if(hAt(x,z)<-.4)continue;
  dummy.position.set(x,hAt(x,z)+.05,z);dummy.rotation.set(0,(rand()-.5)*.26,0);dummy.scale.set(1.2,.09,1.6);dummy.updateMatrix();road.setMatrixAt(k++,dummy.matrix);
 }road.count=k;road.instanceMatrix.needsUpdate=true;detail.add(road);
 // Low-cost shafts of light, dust motes, and drifting fog banks.
 const columns=[];
 for(const [x,z,c] of [[-39,-30,0x89d6fc],[44,19,0xffac81],[22,-51,0x70edd8],[0,-58,0x987eea]]){
  const beamMat=new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.115,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
  const beam=make(new THREE.CylinderGeometry(1.4,4.7,40,12,1,true),beamMat,detail);
  beam.position.set(x,hAt(x,z)+20,z);
  columns.push({m:beam,phase:rand()*TAU});
 }
 // GPU billboard rain is a single draw call. Uses fixed seed positions and a time uniform.
 const rainCount=1100,pos=new Float32Array(rainCount*3);
 for(let i=0;i<rainCount;i++){pos[i*3]=(rand()-.5)*95;pos[i*3+1]=rand()*35;pos[i*3+2]=(rand()-.5)*95;}
 const rg=new THREE.BufferGeometry();rg.setAttribute("position",new THREE.BufferAttribute(pos,3));
 const rainMat=new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,uniforms:{time:{value:0},hero:{value:new THREE.Vector3()},opacity:{value:.35}},
  vertexShader:"uniform float time;uniform vec3 hero;varying float glow;void main(){vec3 p=position;float cycle=mod(p.y-time*15.,33.);p.y=cycle+3.;p.x+=sin(time*.9+p.z)*1.5;p+=vec3(hero.x,hero.y,hero.z);glow=(cycle/33.);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(42./(-mv.z),1.,3.);}",
  fragmentShader:"uniform float opacity;varying float glow;void main(){float d=length(gl_PointCoord-.5);if(d>.48)discard;gl_FragColor=vec4(.65,.82,.95,opacity*(.55+glow*.3));}"
 });
 const rain=new THREE.Points(rg,rainMat);rain.frustumCulled=false;detail.add(rain);
 const mistCount=12;
 const fogTex=generateFogTexture();
 const fog=[];
 for(let i=0;i<mistCount;i++){
  const x=(rand()-.5)*146,z=(rand()-.5)*142;
  const m=new THREE.Sprite(new THREE.SpriteMaterial({map:fogTex,color:0x91bfd0,transparent:true,opacity:.09,depthWrite:false}));
  m.position.set(x,hAt(x,z)+2.3,z);m.scale.set(35+rand()*31,8,1);detail.add(m);
  fog.push({m,x,z,phase:rand()*TAU});
 }
 // Floating fragments silhouetted around the final gate.
 const fragments=[];
 for(let i=0;i<16;i++){
  const a=rand()*TAU,r=7+rand()*14,y=6+rand()*19,x=Math.sin(a)*r,z=-58+Math.cos(a)*r;
  const m=make(new THREE.DodecahedronGeometry(.5+rand()*.7),i%4===0?metal:slate,detail);
  m.position.set(x,hAt(x,z)+y,z);m.rotation.set(rand()*TAU,rand()*TAU,rand()*TAU);
  fragments.push({m,x,z,base:m.position.y,phase:rand()*TAU});
 }
 let lightning=0,stormCooldown=17;
 function update(dt,t){
  for(const b of banners)b.mesh.rotation.z=Math.sin(t*1.7+b.phase)*.035;
  for(const p of columns)p.m.material.opacity=.085+Math.sin(t*.7+p.phase)*.025;
  for(const f of fog){f.m.position.x=f.x+Math.sin(t*.13+f.phase)*5;f.m.position.z=f.z+Math.cos(t*.11+f.phase)*3;}
  for(const f of fragments){f.m.position.y=f.base+Math.sin(t*.6+f.phase)*.75;f.m.rotation.x+=dt*.11;f.m.rotation.y+=dt*.09;}
  rainMat.uniforms.time.value=t;rainMat.uniforms.hero.value.copy(player.position);
  stormCooldown-=dt;
  if(stormCooldown<=0){stormCooldown=19+rand()*23;lightning=.14;scene.fog.color.setHex(0x5e7491);}
  if(lightning>0){lightning-=dt;if(lightning<=0)scene.fog.color.setHex(0x527080);}
 }
 function setQuality(q){
  const low=q==="low";
  detail.visible=!low;
  rain.visible=!low;
  if(q==="medium"){rainMat.uniforms.opacity.value=.16;}else{rainMat.uniforms.opacity.value=.29;}
  for(const beam of columns)beam.m.visible=!low;
 }
 setQuality(quality);
 return {group,setQuality,update};
}
function generateGroundTexture(){
 const c=document.createElement("canvas");c.width=c.height=512;const ctx=c.getContext("2d");
 ctx.fillStyle="#c4ced0";ctx.fillRect(0,0,512,512);
 let s=10257;const rnd=()=>((s=(Math.imul(s,1664525)+1013904223)|0)>>>0)/4294967296;
 for(let i=0;i<14000;i++){const a=(rnd()*180)|0;ctx.fillStyle="rgba("+a+","+a+","+a+","+(rnd()*.14)+")";
  const x=rnd()*512,y=rnd()*512,r=rnd()*4;ctx.fillRect(x,y,r+1,r+1);}
 for(let i=0;i<160;i++){let x=rnd()*512,y=rnd()*512;ctx.strokeStyle="rgba(23,37,37,.1)";ctx.lineWidth=.6+rnd()*1.4;ctx.beginPath();ctx.moveTo(x,y);
 for(let j=0;j<5;j++){x+=rnd()*24-12;y+=rnd()*14-7;ctx.lineTo(x,y);}ctx.stroke();}
 const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(28,28);tex.anisotropy=4;
 tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
function generateRuneTexture(){
 const c=document.createElement("canvas");c.width=c.height=512;const q=c.getContext("2d");q.translate(256,256);
 const circles=[218,199,154,92,49];q.strokeStyle="#ffffff";q.lineWidth=4;
 for(const r of circles){q.globalAlpha=r===218?.4:.8;q.beginPath();q.arc(0,0,r,0,Math.PI*2);q.stroke();}
 q.globalAlpha=.72;
 for(let i=0;i<16;i++){
  const a=i*Math.PI/8;q.save();q.rotate(a);
  q.beginPath();q.moveTo(-11,-211);q.lineTo(0,-234);q.lineTo(11,-211);q.stroke();
  q.beginPath();q.moveTo(0,-153);q.lineTo(0,-188);q.moveTo(-12,-170);q.lineTo(12,-170);q.stroke();q.restore();
 }
 for(let i=0;i<6;i++){let a=i*Math.PI/3;q.beginPath();q.moveTo(Math.sin(a)*95,Math.cos(a)*95);q.lineTo(Math.sin(a+2*Math.PI/3)*95,Math.cos(a+2*Math.PI/3)*95);q.stroke();}
 q.beginPath();q.moveTo(-53,0);q.lineTo(0,-67);q.lineTo(53,0);q.lineTo(0,67);q.closePath();q.stroke();
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function generateBannerTexture(color){
 const c=document.createElement("canvas");c.width=128;c.height=256;
 const ctx=c.getContext("2d");ctx.fillStyle="#142735";ctx.fillRect(0,0,128,256);
 const col=new THREE.Color(color),rgb="#"+col.getHexString();
 ctx.fillStyle=rgb;ctx.fillRect(8,6,112,238);ctx.strokeStyle="#e3bf88";ctx.lineWidth=6;ctx.strokeRect(12,8,104,221);
 ctx.fillStyle="#1b3449";ctx.beginPath();ctx.moveTo(64,51);ctx.lineTo(96,110);ctx.lineTo(64,185);ctx.lineTo(30,110);ctx.closePath();ctx.fill();
 ctx.strokeStyle="#f5d89d";ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(64,69);ctx.lineTo(79,110);ctx.lineTo(64,155);ctx.lineTo(49,110);ctx.closePath();ctx.stroke();
 ctx.globalCompositeOperation="destination-out";ctx.beginPath();ctx.moveTo(0,242);ctx.lineTo(64,221);ctx.lineTo(128,242);ctx.lineTo(128,256);ctx.lineTo(0,256);ctx.fill();
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
function generateFogTexture(){
 const c=document.createElement("canvas");c.width=128;c.height=128;const g=c.getContext("2d"),r=g.createRadialGradient(64,64,4,64,64,64);
 r.addColorStop(0,"rgba(255,255,255,.55)");r.addColorStop(.6,"rgba(255,255,255,.18)");r.addColorStop(1,"rgba(255,255,255,0)");
 g.fillStyle=r;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);
}
