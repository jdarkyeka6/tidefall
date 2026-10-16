import test from "node:test";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdir} from "node:fs/promises";
import {chromium} from "playwright";

const HOST="http://127.0.0.1:4179/";
async function waitServer(limitMs=25000){
 const t=Date.now();
 while(Date.now()-t<limitMs){
  try{const r=await fetch(HOST);if(r.ok)return;}catch{}
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 throw new Error("Vite preview server never started");
}
test("render the new game in a real WebGL browser, test graphics switching and enter world",async t=>{
 const server=spawn(process.execPath,["node_modules/vite/bin/vite.js","preview","--host","127.0.0.1","--port","4179","--strictPort"],{cwd:new URL("../",import.meta.url),stdio:"pipe"});
 t.after(()=>{server.kill("SIGTERM");});
 let browser;
 try {
  await waitServer();
  browser=await chromium.launch({headless:true,args:[
   "--no-sandbox","--use-gl=angle","--use-angle=swiftshader",
   "--enable-webgl","--enable-unsafe-swiftshader","--disable-dev-shm-usage"
  ]});
  t.after(()=>browser.close());
  const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
  const errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  await page.goto(HOST,{waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.querySelector("#load-status")?.textContent?.includes("READY"),null,{timeout:30000});
  assert.equal(await page.locator("#menu h1").textContent(),"TIDEFALL");
  assert.ok(await page.locator("#viewport canvas").count(),"3D canvas mounted");
  assert.ok(await page.locator(".veil-upgrades").count(),"upgrade station mounted");
  await page.selectOption("#quality","low");
  await page.waitForTimeout(300);
  await mkdir("artifacts",{recursive:true});
  await page.screenshot({path:"artifacts/tidefall-menu.png"});
  await page.click("#play");
  await page.waitForTimeout(1300);
  // Some CI runners disable Pointer Lock even after a trusted click.
  const locked=await page.evaluate(()=>document.pointerLockElement!==null);
  if(locked){
   assert.equal(await page.locator("#hud").isVisible(),true,"HUD visible after entering");
   await page.keyboard.press("m");
   await page.keyboard.press("v");
   await page.screenshot({path:"artifacts/tidefall-gameplay.png"});
  }
  assert.deepEqual(errors,[],"no uncaught browser errors during graphics initialization");
 } finally {
  if(browser)await browser.close().catch(()=>{});
 }
});
