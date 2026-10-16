# Tidefall | Book One playable prologue

This change adds **The Saltwater Thread**, a quest-driven playable slice inside the existing Three.js castle demo. It **does not** replace the local Unreal Engine 5 / Unity projects or pretend to be the complete 100–200-hour RPG. Existing geometry, VRM characters, spells, movement, collectibles, minimap and settings are retained.

## Play

From the repo root, run `python -m http.server 8080` (or use the existing hosted deployment), then open `http://localhost:8080/game/`. The Three.js/VRM imports come from a CDN, so the browser needs internet access.

Controls: WASD to walk, mouse to look, Shift to sprint, Space to jump, C to crouch, left-click/F to cast, 1–4 for spells, E for talk/read, M for map, **J for story journal**, Esc to pause and P for low-spec graphics. Press **Restart Book One (delete progress)** from the pause/title screen to erase only Book One progress. Volume, sensitivity and FOV remain saved separately.

## Prologue milestones

1. Meet Jasper Holloway by the courtyard fountain.
2. Ask Ava Rees about the old brass key.
3. Read the Library of Tides lore plaque.
4. Talk to Professor Rowan Hale.
5. Cast a spell.
6. Hit a training dummy.
7. Reach the Undercroft.
8. Collect at least eight Tide Shards.
9. Return to Harper in the courtyard to finish.

Events other than the final conversation can happen out of order without breaking progress. Harper's final conversation completes the quest **only after** every preceding milestone is recorded. Existing castle exploration achievements still gate the overall completion screen.

Autosave is stored under `tidefall-book-one-v1` in browser localStorage, separately from the original `tidefall` settings key. It stores quest flags, collected shard IDs, spell selection, hit score, existing objective flags, position and completion. It saves on milestone/pickup, periodically during play and when leaving or hiding the page. Loading filters invalid shard indexes, positions and contradictory completion flags.

## Smoke checks

- [ ] Start a new game. Meet Jasper with E; check that the journal advances.
- [ ] Talk to Harper early. Verify the finale does **not** complete.
- [ ] Collect a shard, refresh, and verify it remains collected.
- [ ] Talk to Ava and Professor Hale. Verify character dialogue is displayed and progress is recorded.
- [ ] Read the library plaque; cast; hit a dummy; enter the Undercroft.
- [ ] After eight shards, return to Harper; finish remaining existing objectives and verify the prologue completion screen.
- [ ] Pause/reload and verify position and progress resume.
- [ ] Restart Book One, accept confirmation, and verify progress resets but sound settings remain.

Run automated checks from the repository root with `node --test game/*.test.mjs`. These verify pure progression rules, save validation and integration hooks. **A WebGL playtest is still required** in a real desktop browser. No claim is made that Unreal Engine content is compiled or converted by this change.

## Next engineering milestone

Port these tested quest states and interaction events to a genuine Unreal Engine 5.8 C++/Blueprint vertical slice connected to Jake's existing Tidefall assets; replace the placeholder interactions with voiced scenes, academy scheduling, abilities and the first complete mission.
