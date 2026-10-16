// Lightweight deterministic collision broad phase for the Tidefall landscape.
// Horizontal capsule projected to X/Z. Decoupled from renderer for direct testing.
export const OBSTACLES=Object.freeze([
 // Six citadel towers, central approach and gatehouses.
 [-25,1,3.8,3.8],[25,1,3.8,3.8],[-24,30,3.6,3.6],[24,30,3.6,3.6],
 [-8,-12,3.4,3.4],[8,-12,3.4,3.4],
 // Citadel walls: three broken panels, with an open central corridor.
 [-24,5,1.7,3],[-24,13,1.7,3],[-24,21,1.7,3],
 [24,5,1.7,3],[24,13,1.7,3],[24,21,1.7,3],
 // Veil gate watchtowers.
 [-14,-58,2.8,2.8],[14,-58,2.8,2.8],
 // Ruined arch uprights.
 [-7,7,1.05,1.05],[7,7,1.05,1.05],
 [-7,-22,1.05,1.05],[7,-22,1.05,1.05],
 [-7,-40,1.05,1.05],[7,-40,1.05,1.05],
 // Moon observatory ring columns.
 ...Array.from({length:9},(_,i)=>{
  const a=i/9*Math.PI*2;return [-39+Math.cos(a)*12,-30+Math.sin(a)*12,1.2,1.2];
 })
]);
export function terrainWalkable(x,z,heightAt,radius=.53){
 if(!Number.isFinite(x)||!Number.isFinite(z))return false;
 if(Math.hypot(x,z+14)>112)return false;
 const corners=[[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius]];
 if(corners.some(([dx,dz])=>heightAt(x+dx,z+dz)<-1.45))return false;
 for(const [cx,cz,rx,rz] of OBSTACLES) {
  // Elliptical solid; cheap rejection before precise distance.
  if(Math.abs(x-cx)>rx+radius||Math.abs(z-cz)>rz+radius)continue;
  const ex=(x-cx)/(rx+radius),ez=(z-cz)/(rz+radius);
  if(ex*ex+ez*ez<1)return false;
 }
 return true;
}
export function slideMotion(x,z,dx,dz,heightAt,radius=.53){
 let nx=x,nz=z;
 if(terrainWalkable(x+dx,z,heightAt,radius))nx=x+dx;
 if(terrainWalkable(nx,z+dz,heightAt,radius))nz=z+dz;
 return {x:nx,z:nz,blockedX:nx===x&&dx!==0,blockedZ:nz===z&&dz!==0};
}
