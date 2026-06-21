import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { PointerLockControls } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/PointerLockControls.js";

const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("startBtn");
const statusEl = document.getElementById("status");
const msgEl = document.getElementById("msg");

// ---------- Renderer / Scene ----------
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x90b4c8, 25, 420);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1600);
camera.position.set(0, 2.0, 40);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// IMPORTANT: pointer lock bound to CANVAS
const controls = new PointerLockControls(camera, renderer.domElement);

// ---------- Status helpers ----------
function setMsg(t) { msgEl.textContent = t || ""; }
function updateStatus() {
  statusEl.textContent = `Status: ${controls.isLocked ? "LOCKED (walking)" : "not locked"}`;
}
controls.addEventListener("lock", () => {
  overlay.style.display = "none";
  setMsg("");
  updateStatus();
});
controls.addEventListener("unlock", () => {
  overlay.style.display = "grid";
  updateStatus();
});

// ---------- Start (3 ways) ----------
function tryLock() {
  try {
    controls.lock();
    // If it doesn't lock, browser likely blocked it. We'll detect after a short moment.
    setTimeout(() => {
      if (!controls.isLocked) {
        setMsg("Pointer Lock blocked. Make sure you're on http://localhost:8000 and click the game canvas once.");
      }
    }, 150);
  } catch {
    setMsg("Could not request Pointer Lock. Try Chrome/Edge and run via http://localhost.");
  }
}

startBtn.addEventListener("click", (e) => { e.preventDefault(); tryLock(); });
overlay.addEventListener("click", () => tryLock());
addEventListener("keydown", (e) => { if (e.code === "Enter") tryLock(); });

updateStatus();

// ---------- Lights ----------
scene.add(new THREE.HemisphereLight(0xd9f0ff, 0x1d2730, 0.95));
const sun = new THREE.DirectionalLight(0xffd7a3, 1.25);
sun.position.set(140, 200, -180);
scene.add(sun);

// ---------- Helpers ----------
function mat(color, rough = 0.95) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.02 });
}

function box(x, y, z, w, h, d, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y + h / 2, z);
  scene.add(m);
  return m;
}

function plane(y, size, material) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  scene.add(m);
  return m;
}

// ---------- Ground / Ocean ----------
plane(0, 2200, mat(0x3d5a4a, 1));
const ocean = plane(-1.7, 4200, new THREE.MeshStandardMaterial({
  color: 0x1b4f7a, roughness: 0.2, metalness: 0.05
}));
ocean.position.z = -1200;

// ---------- Castle (THICK walls + gate opening) ----------
const stone = mat(0x6f6d7b);
const darkStone = mat(0x4b4a55);
const court = mat(0x2f5b4f, 1);
const pathMat = mat(0x7a6b52, 1);

const wallH = 18;
const wallT = 12; // thickness
const castleCenterZ = -180;

// Outer walls (4 thick slabs)
box(0, 0, castleCenterZ + 120, 420, wallH, wallT, darkStone);  // north wall
box(0, 0, castleCenterZ - 260, 420, wallH, wallT, darkStone);  // south wall
box(-204, 0, castleCenterZ - 70, wallT, wallH, 380, darkStone); // west wall
box(204, 0, castleCenterZ - 70, wallT, wallH, 380, darkStone);  // east wall

// Courtyard pads
box(0, -0.06, castleCenterZ - 60, 360, 0.2, 260, court);
box(0, -0.06, castleCenterZ + 70, 380, 0.2, 160, court);

// Inner keep + Great Hall
box(0, 0, castleCenterZ - 90, 160, 30, 110, stone);
box(0, 0, castleCenterZ - 220, 140, 18, 60, darkStone);

// Towers
const towerMat = mat(0x5b5966);
box(-170, 0, castleCenterZ + 90, 36, 30, 36, towerMat);
box(170, 0, castleCenterZ + 90, 36, 30, 36, towerMat);
box(-170, 0, castleCenterZ - 250, 36, 30, 36, towerMat);
box(170, 0, castleCenterZ - 250, 36, 30, 36, towerMat);

// Gate opening (a door slab that slides sideways)
const gateFrame = box(0, 0, castleCenterZ + 120, 110, wallH, wallT + 0.5, darkStone);
gateFrame.visible = false; // just used for position reference

const gateDoor = box(0, 0, castleCenterZ + 120, 28, 14, wallT + 1.0, mat(0x35343d, 0.9));
gateDoor.position.y = 2; // sit slightly above ground

let gateOpen = false;
let gateAnim = 0; // 0 closed -> 1 open

// Path to “town”
box(0, -0.08, 140, 34, 0.2, 360, pathMat);

// ---------- Order Dorm Wings (Calyx = trio) ----------
const calyxMat  = mat(0x4fae7f, 0.95);
const astraeMat = mat(0x78aad2, 0.95);
const brannorMat= mat(0xb05a54, 0.95);
const noctenMat = mat(0x4f5aa8, 0.95);

const dormH = 18;
const dormW = 90;
const dormD = 70;

const calyxDorm = box(-120, 0, castleCenterZ - 70, dormW, dormH, dormD, calyxMat); // trio dorm
box(120, 0, castleCenterZ - 70, dormW, dormH, dormD, astraeMat);
box(-120, 0, castleCenterZ - 170, dormW, dormH, dormD, noctenMat);
box(120, 0, castleCenterZ - 170, dormW, dormH, dormD, brannorMat);

// ---------- Calyx interior (simple corridor + rooms) ----------
const interior = new THREE.Group();
scene.add(interior);

// “Interior zone” placed beside Calyx dorm (so you can walk in via tunnel for now)
const intBaseX = -360;
const intBaseZ = castleCenterZ - 70;

interior.add(box(intBaseX, -0.06, intBaseZ, 170, 0.2, 130, mat(0x2c3a33, 1))); // floor pad

// corridor shell
interior.add(box(intBaseX, 0, intBaseZ, 170, 10, 12, mat(0x2a2d33, 1))); // corridor spine
// side walls (thin)
interior.add(box(intBaseX, 0, intBaseZ + 25, 170, 10, 2, mat(0x20232a, 1)));
interior.add(box(intBaseX, 0, intBaseZ - 25, 170, 10, 2, mat(0x20232a, 1)));

// rooms (boxes) along corridor
const roomMat = mat(0x3f4d45, 1);
for (let i = -3; i <= 3; i++) {
  const z = intBaseZ + i * 18;
  interior.add(box(intBaseX - 40, 0, z, 36, 8, 18, roomMat)); // left room
  interior.add(box(intBaseX + 40, 0, z, 36, 8, 18, roomMat)); // right room
}

// “common hall” chunk
interior.add(box(intBaseX, 0, intBaseZ - 80, 130, 12, 60, mat(0x355a46, 1)));

// ---------- Secret tunnels (walk into entrance -> teleport to tunnel corridor) ----------
const tunnelMat = mat(0x2b2f36, 1);
const tunnel = new THREE.Group();
scene.add(tunnel);

const tunnelStart = new THREE.Vector3(-520, 2.0, intBaseZ + 40); // where you land
// tunnel corridor geometry
tunnel.add(box(-520, 0, intBaseZ + 40, 220, 10, 14, tunnelMat));
tunnel.add(box(-520, 0, intBaseZ + 40, 220, 2, 14, mat(0x1e232a, 1))); // darker stripe

// Entrances (visible “holes”)
const entranceMat = mat(0x1f242b, 1);
const calyxEntrance = box(-155, 0, castleCenterZ - 40, 10, 6, 10, entranceMat);
const courtyardEntrance = box(10, 0, castleCenterZ - 20, 10, 6, 10, entranceMat);

// Trigger volumes (invisible) for entering tunnels
function makeTrigger(center, size) {
  return { center: center.clone(), size: size.clone() };
}
const triggers = [
  { name: "Calyx Tunnel", trig: makeTrigger(new THREE.Vector3(-155, 2, castleCenterZ - 40), new THREE.Vector3(6, 3, 6)), dest: tunnelStart },
  { name: "Courtyard Tunnel", trig: makeTrigger(new THREE.Vector3(10, 2, castleCenterZ - 20), new THREE.Vector3(6, 3, 6)), dest: tunnelStart.clone().add(new THREE.Vector3(0,0,-40)) },
];

// ---------- Movement ----------
const keys = { w:false, a:false, s:false, d:false, shift:false, space:false, e:false };
addEventListener("keydown", (e) => {
  if (e.code === "KeyW") keys.w = true;
  if (e.code === "KeyA") keys.a = true;
  if (e.code === "KeyS") keys.s = true;
  if (e.code === "KeyD") keys.d = true;
  if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.shift = true;
  if (e.code === "Space") keys.space = true;
  if (e.code === "KeyE") keys.e = true;
});
addEventListener("keyup", (e) => {
  if (e.code === "KeyW") keys.w = false;
  if (e.code === "KeyA") keys.a = false;
  if (e.code === "KeyS") keys.s = false;
  if (e.code === "KeyD") keys.d = false;
  if (e.code === "ShiftLeft" || e.code === "ShiftRight") keys.shift = false;
  if (e.code === "Space") keys.space = false;
  if (e.code === "KeyE") keys.e = false;
});

let velY = 0;
const GRAVITY = -20;
const JUMP = 7.6;

const clock = new THREE.Clock();

function near(pos, target, radius) {
  return pos.distanceTo(target) <= radius;
}

function inTrigger(pos, trig) {
  return (
    Math.abs(pos.x - trig.center.x) <= trig.size.x &&
    Math.abs(pos.y - trig.center.y) <= trig.size.y &&
    Math.abs(pos.z - trig.center.z) <= trig.size.z
  );
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  // gentle ocean shimmer
  ocean.material.color.offsetHSL(0, 0, Math.sin(performance.now() * 0.00035) * 0.00035);

  // Gate animation (slide door left)
  const target = gateOpen ? 1 : 0;
  gateAnim += (target - gateAnim) * Math.min(1, dt * 6);
  gateDoor.position.x = gateAnim * -28; // slide left when opening

  if (controls.isLocked) {
    // movement vectors
    const baseSpeed = 10.0;
    const speed = baseSpeed * (keys.shift ? 1.6 : 1.0);

    let f = 0, r = 0;
    if (keys.w) f += 1;
    if (keys.s) f -= 1;
    if (keys.d) r += 1;
    if (keys.a) r -= 1;

    const forward = new THREE.Vector3();
    controls.getDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0,1,0)).multiplyScalar(-1);

    const move = new THREE.Vector3();
    move.addScaledVector(forward, f);
    move.addScaledVector(right, r);

    if (move.lengthSq() > 0) move.normalize();
    camera.position.addScaledVector(move, speed * dt);

    // gravity + jump
    const eyeHeight = 2.0;
    velY += GRAVITY * dt;
    camera.position.y += velY * dt;

    if (camera.position.y <= eyeHeight) {
      camera.position.y = eyeHeight;
      velY = 0;
      if (keys.space) velY = JUMP;
    }

    // Gate interaction (press E near gate)
    const gatePos = new THREE.Vector3(0, 2, castleCenterZ + 120);
    if (near(camera.position, gatePos, 6)) {
      setMsg("Press E to toggle the main gate");
      if (keys.e) {
        gateOpen = !gateOpen;
        keys.e = false; // prevent spam toggle while held
      }
    } else {
      // only clear if no other message is needed
      if (!msgEl.textContent.startsWith("Pointer Lock")) setMsg("");
    }

    // Tunnel triggers
    for (const t of triggers) {
      if (inTrigger(camera.position, t.trig)) {
        camera.position.copy(t.dest);
        velY = 0;
        setMsg(`Entered: ${t.name}`);
      }
    }
  }

  renderer.render(scene, camera);
}
animate();

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
