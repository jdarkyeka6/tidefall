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


## The Veil 0.2 overhaul

**Visuals:** A ruined citadel with towers, walkable stone approaches, banner crests, magical rune decals, dusk lighting, weather, mist, ocean colour refinement, ground texture details and optional high-graphics VRM models for Ava and Harper. The models reuse the existing Tidefall `charecters/` assets when running under the Tidefall repository's published website. If those models cannot load, upgraded procedural figures remain visible. Jasper now wears the yellow pendant, and Ava has the brass key. The playable character is an unnamed apprentice, separate from Jasper.

**Combat:** Shadows telegraph attacks on the ground before striking. Press **Q** for a timed perfect parry, **V** or right-click for melee combos, **Space** to dodge, **1–4** to choose four spells, and left-click to cast. The boss has a larger, slower, dodgable telegraph. Kills award XP and Essence.

**Permanent upgrades:** Your earned Essence unlocks Spellcraft (damage), Ironwill (max health) and Aetherflow (max mana and mana regeneration), each capped at five tiers. Press **K** while playing to pause, show the main menu and access the purchase buttons. XP, Essence, upgrade tiers, and the original story save persist between sessions.

**Exploration:** The live right-hand chart tracks enemies, NPCs, relics, your position and the current waypoint. **M** enlarges/shrinks the map. Citadel walls, towers, arch pillars and terrain edges now have deterministic player collisions and allow axis-separated wall sliding. Character movement accelerates and decelerates smoothly.

**Audio:** Wind and ocean ambience, combat/quest cues and original synthesis via WebAudio; **N** toggles mute. No music or downloaded audio assets are required.

**Performance:** Adaptive pixel density, capped maximum DPR, instanced vegetation, reusable projectile objects, bounded particle pools, throttled HUD and optional detail tiers. The HIGH preset may download detailed avatars and is aimed at stronger desktop GPUs. AUTO balances detail and framerate without the additional avatars; LOW disables optional detail. FPS cannot be guaranteed without testing on your hardware.

**Testing:** `npm test` runs unit and collision tests; `npm run build` checks a production Vite bundle. `npm run test:browser` must run *after the production build* with Chromium installed, and checks that the scene can initialize in real WebGL without uncaught JavaScript errors. GitHub Actions runs all three checks and publishes preview screenshots.

**Limitations:** This is still a stylized desktop-browser vertical slice, not the finished Unreal Engine 5 game. The world does not yet have photorealistic environments, motion-captured characters, a full dialogue tree, streaming open-world regions or production voice acting. Those require dedicated assets and UE5 engine implementation.
