# TIDEFALL: THE VEIL

A **new** standalone third-person fantasy action game prototype built alongside the old Tidefall Castle demo. It does not replace `/game`. No third-party meshes, heavy VRM avatar downloads, huge texture bundles or runtime 3D assets. Optimized for a desktop GPU with instanced vegetation, a single atmospheric environment, pooled effects and configurable rendering resolution.

## Play locally
```sh
cd reimagined
npm install
npm run dev
```
Open the local URL printed by Vite, normally `http://localhost:5173`. This prototype requires a keyboard, mouse, WebGL 2-capable desktop browser and hardware acceleration. `npm run build` creates a static `dist` build for deployment.

## Controls
- **WASD:** Move relative to the over-the-shoulder camera.
- **Mouse:** Aim and orbit.
- **Shift:** Sprint (uses stamina).
- **Space:** Dodge with temporary invulnerability.
- **Left click / F:** Cast selected spell.
- **1:** Aether Bolt, fast projectile.
- **2:** Ember Burst, area-damage projectile.
- **3:** Frost Nova, area attack and slow.
- **4:** Heal.
- **E:** Talk / claim a cleared relic / close the gate.
- **Esc:** Release mouse and pause.

## First mission: The Saltwater Thread
Speak to Jasper in the coastal courtyard. Visit the Moon, Ember and Tide sigil circles and defeat each site's three shadow guardians. Press E to recover a sigil after the guardians are defeated. When all three are recovered, return to the Veil Gate, defeat the Abyssal Warden and press E to seal the Veil. NPCs Ava and Harper offer dialogue. Quest state saves locally under `tidefall-veil-save-v1`, independent of the original Tidefall game. The **NEW GAME** button resets quest progress after confirmation.

## Performance
Use **AUTO** (default) for dynamic internal render resolution. **BALANCED** fixes DPR around 1.16. **PERFORMANCE** fixes DPR around 0.82 and hides optional vegetation/particles. **HIGH** uses a higher resolution plus a 1024px shadow map. Most environment foliage and rock geometry is GPU instanced; the graphics are intentionally **stylized**, not photorealistic. Performance depends on the browser, GPU, driver, display resolution and other running software. Actual FPS must be measured on the target hardware.

## Scope and status
This is a substantial, playable browser **vertical slice** with procedural art and a full encounter loop, NOT the fully voiced or photorealistic 100-hour Unreal Engine 5 Tidefall RPG. The repo contains the original separate browser castle game at `/game`, untouched. Character meshes, combat, boss and world are all newly implemented in `reimagined/src/main.js`.

`npm test` covers quest ordering, corrupted saves, relic gates, damage and input normalization. `npm run build` checks whether the complete Vite application bundles. Browser playtesting and balance verification are still needed.
