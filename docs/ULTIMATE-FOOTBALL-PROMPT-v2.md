# ULTIMATE FOOTBALL — corrected build prompt (v2)

> How to use: open this folder in Claude Code and paste **one phase at a time** as a prompt, starting with Phase 0. Always paste the **Preamble** together with the phase. Do not paste the whole file. Each phase ends with a check you can see on screen; do not start the next phase until the check passes.

---

## PREAMBLE (paste with every phase)

You are working on an existing browser football game in this folder. Facts you can rely on without re-discovering them:

- Entry point today: `Ultimate Football.html` — one 645-line file, inline minified-style JS, Three.js **r128** from cdnjs for 3D plus a Canvas 2D layer for the top-down view, HUD and all menus. Settings → View switches 3D/2D. After Phase 0 the entry point is `index.html` + `src/` (Vite), and the original file is kept untouched as `legacy/Ultimate Football.html` for reference.
- Verified inventory and a request-by-request verdict table are in `docs/PROMPT-REVIEW.md`. Read Section 1 before touching code. Line numbers there refer to the legacy file.
- Fictional clubs only (8 today: Rwanda Lions FC, Kigali United, Red Valley FC, Capital Stars, Blue Horizon FC, Royal Falcons, Mountain City FC, Eastland Athletic). Sponsors on ad boards are fictional (KIGALI AIR, MOUNTAIN COFFEE, UMUHIRE BANK, LIONS ENERGY, CAPITAL MOTORS). Keep everything fictional. Never use real club names, crests, kits, player names, or assets from any commercial football game.
- Hardware floor: the owner plays on a ChromeOS Linux VM (virgl GPU, 6 GB RAM, 8 cores). **AUTO quality must hold ~60 fps at 1280×720 on this machine.** ULTRA may exceed it; AUTO may not.
- Reference 1 (current look): `docs/reference-1-menu.png`, plus capture an in-match frame at the start of Phase 2. Reference 2 (target look): a real televised match — high sideline camera, natural grass stripes, soft daylight shadows, dense but low-detail crowd, kits with visible fabric, players with human proportions. If the owner provides a target screenshot, it overrides this description.

Rules:
1. **Do not restart the project. Do not throw away gameplay.** Restructure and upgrade in place; every phase must leave a playable game.
2. Priority order is this file's phase order: realism (Phases 1–4) before gameplay fixes (5) before content scale (6). Do not add leagues, modes or menus in Phases 0–4.
3. After each sub-step: run the game (`npm run dev`, or the headless capture script from Phase 0), look at it, and fix flicker, z-fighting, floating/clipping feet, missing materials, console errors, fps drops before moving on.
4. Prefer procedural/generated assets and openly licensed assets (CC0) over placeholders; when you must use a placeholder, structure the code so a `.glb`/texture swap replaces it without logic changes.
5. Keep saves working: `localStorage` keys `uf_set`, `uf_careers`, `uf_pcs` must load after every phase (write a migration if the shape changes).
6. Commit after every sub-step with a message that names the sub-step. The repo is `~/Football Game` (git-initialised in Phase 0).

---

## PHASE 0 — Make the code editable (1–2 sessions)

Goal: identical game, modern structure.

1. `git init`; commit the original file. Copy it to `legacy/Ultimate Football.html` (never edited again).
2. Scaffold Vite (vanilla JS, no framework). `npm i three@latest`. Keep the game at `/` with `index.html`.
3. Split the inline script into ES modules under `src/`, **renaming identifiers to readable names** as you go (`TM`→`teams`, `b`→`ball`, `mkPl3`→`buildPlayerModel`, `anim3`→`animatePlayer`, `KM0`→`defaultKeyMap`, etc.). Suggested modules: `data/clubs.js`, `data/formations.js`, `match/ball.js`, `match/ai.js`, `match/rules.js` (fouls, cards, offside, restarts), `match/update.js`, `input/keys.js`, `render3d/scene.js`, `render3d/player.js`, `render3d/stadium.js`, `render2d/*.js`, `ui/menus.js`, `career/*.js`, `save.js`, `main.js`.
4. Upgrade Three.js to the installed version: `sRGBColorSpace`/`ColorManagement`, `MeshStandardMaterial` API changes, `PointLight` decay defaults, texture `colorSpace`. Fix every console warning.
5. **Seeded RNG.** Replace `Math.random` in squad generation with a seeded generator so squads are reproducible; store the seed in `uf_set`. (Persisting full squads comes in Phase 6; the seed alone already stops names changing on reload.)
6. Add `scripts/capture.mjs` (Playwright or `google-chrome --headless=new --screenshot`) that loads the game, clicks PLAY → KICK OFF → START MATCH, presses Enter to skip the intro, waits 4 s and saves `captures/match.png`. This is the "look at it" tool for every later phase. Note: software GL in headless Chrome is slow; allow 30 s timeouts.
7. Fix the small inconsistencies found in review: Settings footer text "remapping UI not built" (the screen exists), empty `recCareer0`, manager STYLE index mislabelling tactics, transfer bonus not reaching cached squads.

**Check:** `npm run dev` opens the game; a full Quick Match plays in 3D and 2D; old saves load; key map unchanged; `captures/match.png` is produced; `git log` shows ≥ 6 commits.

---

## PHASE 1 — Character pipeline (3–5 sessions) — the keystone

Goal: replace the primitive-built players with one rigged, skinned character used by all 22 players, the referee and the managers.

Tooling: Blender 4.x (`sudo apt install blender`, ~350 MB), driven by Python scripts in `tools/blender/` so the model is reproducible and can be regenerated.

1. **Base body** (`tools/blender/build_player.py`): human proportions (~1.80 m, 7.5 heads), clean quad topology, ~6–8 k triangles at LOD0, mirrored. Shape keys for body types: slim, athletic, muscular, tall, short, stocky (drive from the existing body sliders). Separate head mesh with blend-shape-ready topology; eyes as separate spheres.
2. **Rig**: humanoid armature (hips, spine×3, neck, head, clavicle/upper arm/forearm/hand ×2, thigh/shin/foot/toe ×2) with IK targets for feet and hands. Name bones to the Mixamo/VRM convention so CC0 clips can be retargeted.
3. **Modular kit**: shirt, shorts, socks, boots as separate meshes sharing the skeleton. UV layout with reserved rectangles for **front sponsor, back name, back number, chest badge, sleeve patch**, so the existing canvas `shirtTex` approach keeps working (draw kit pattern + sponsor + badge + number + name into one 1024² texture per club).
4. **Materials** (textures generated procedurally in Blender or canvas): skin (albedo from the 8 skin tones + roughness/normal detail), hair (16 styles as mesh caps/cards reusing the current style list, anisotropic-ish roughness), eyes (dark iris, specular cornea), boots (4 styles, two-tone, roughness 0.4–0.6), fabric normal for kit/shorts/socks.
5. **Animation clips** (author in Blender or retarget CC0 clips; export as separate actions in one glb): `idle`, `walk`, `jog`, `run`, `sprint`, `turn_left/right`, `stop`, `strafe`, `pass_short`, `pass_long`, `shot`, `shot_finesse`, `header`, `tackle_stand`, `tackle_slide`, `throw_in`, `fall`, `get_up`, `celebrate_arms`, `celebrate_knee_slide`, `celebrate_point_sky`, `gk_idle`, `gk_dive_left/right`, `gk_catch`, `referee_card`, `referee_whistle`, `manager_idle`, `sit`. (~30 clips; add volley/chip/chest control later.)
6. **Export**: `public/models/player.glb` (Draco or meshopt compressed), `referee.glb` reusing the same skeleton, plus `player_lod1.glb` (~2 k tris) and a billboard sprite sheet for LOD2.
7. **Runtime** (`src/render3d/character.js`): load once, `SkeletonUtils.clone` per player, `AnimationMixer` with a small state machine: locomotion blend tree by speed (idle→walk→jog→run→sprint, cross-fade 0.15 s), action layer for pass/shot/tackle/throw triggered by the existing game events, upper-body look-at toward the ball (keep today's head turn), **foot grounding** (raycast or flat-pitch y-lock with IK on the planted foot), and root-motion-free movement driven by the existing physics so gameplay is unchanged.
8. Hook the existing events: shoot/pass/tackle/throw-in/goal/card calls play the clip; goal celebration picks one of three clips per scorer id; red card plays `fall`→`get_up`→walk toward the tunnel point (replaces the x=−200 teleport).
9. Replace the per-player number texture with the kit texture from step 3; add player **name** on the back.

**Check:** `captures/match.png` shows skinned players with human proportions; running players' feet don't slide or float; kick, slide and throw-in have visible animations; frame time at AUTO on the owner's VM ≤ 16 ms with 23 characters at LOD0/1 mix; draw calls for players ≤ 60 (merged materials, instanced where possible).

---

## PHASE 2 — Rendering, lighting, pitch, ball (2–3 sessions)

1. `renderer.outputColorSpace = SRGBColorSpace`, `ACESFilmicToneMapping`, exposure per lighting preset. No pure-white blowout at noon, readable shadows at night.
2. **Lighting presets** replacing the 4 weathers: `day`, `overcast`, `sunset`, `evening`, `night`, each with sun/hemisphere/ambient values, sky colour, fog, and floodlight state (on for evening/night). Weather stays a separate axis: `clear`, `rain`.
3. **Shadows**: `CSM` from `three/examples/jsm/csm/CSM.js` (3 cascades, 1024–2048 maps by preset), PCF soft; contact shadow blobs under feet and ball via a small shared texture.
4. **SSAO**: `EffectComposer` + `SSAOPass` (or `GTAOPass`) at half resolution, subtle; disabled at LOW.
5. **Pitch material**: layered `MeshStandardMaterial` with (a) base albedo with alternating mow stripes and slight hue variation, (b) detail normal map tiled ~0.5 m, (c) roughness map, (d) wear darkening in goalmouths and centre circle, (e) `wetness` uniform (rain → lower roughness, darker albedo, faint reflection via env map). Two LODs: a ring of instanced grass-blade cards within ~25 m of the camera focus, textured plane beyond. Keep the line markings crisp (separate decal plane or high-res mask).
6. **Ball**: 32-panel or thermo-bonded texture + normal map, roughness ~0.35, correct 0.22 m diameter, keep existing roll/spin, add squash-free bounce dust at impacts (tiny particle).
7. **Goal**: posts/crossbar as before; replace the wireframe box net with a thin mesh net texture (alpha-tested) that bulges with the existing goal-scale logic.
8. Rain: particle sprites instead of line segments; wet pitch via the `wetness` uniform; player kit darkens slightly.

**Check:** before/after `captures/match.png` in `day` and `night`; no shadow acne, no banding in sky, grass reads as grass at the broadcast distance; fps unchanged within 10 % at AUTO.

---

## PHASE 3 — Stadium, crowd, benches (2–3 sessions)

1. Parametric stadium generator (`src/render3d/stadium.js`): tiers, rake, roof type, corner fill, colour palette, capacity → builds stands from **instanced seats** (one seat mesh, `InstancedMesh`, per-instance colour), railings, stairs, tunnel mouth, camera gantry, floodlight style. 4–6 presets ("Lion Park" stays the default), shared by clubs via a `stadiumId` on the club.
2. **Crowd**: `InstancedMesh` of billboard cards with a sprite sheet (8 poses × 6 outfits), 10–20 k instances by preset, per-instance phase offset; states `idle`, `excited`, `goal_home`, `goal_away`, `foul`, `miss`, `full_time` mapped from the existing `crowd` excitement value and match events; mexican-wave optional.
3. **Benches and technical areas**: dugout with seated substitutes (Phase 1 `sit` clip, LOD1 models), two managers (one per team, generated face/body/clothes, `manager_idle`), fourth official. Managers exist in every mode, not only Manager Career.
4. Ad boards: animated texture scroll between the 5 fictional sponsors; add 5 more fictional brands.
5. Atmosphere: flags/banners as cloth-like animated planes; subtle haze at night; crowd ambience and goal roar as **generated** audio buffers (noise-shaped) until real CC0 samples are added.
6. Stadium **customizer** UI entry: choose preset, stand colour, seat pattern, net colour, pitch mow pattern; 3 custom slots saved in `uf_set`. (UI styling comes in Phase 4; wire the data now.)

**Check:** capture from broadcast cam shows seats, people, roof, benches; stadium draw calls ≤ 40; crowd update cost ≤ 1 ms.

---

## PHASE 4 — Camera, presentation, UI (2–3 sessions)

1. **Broadcast camera** default: high sideline, FOV 28–35, smoothed ball tracking with lead, zoom with play width; keep `V` cycle (Broadcast / Wide / Player / Tactical) and add it to Settings and the pause menu; expose POV/normal choice pre-match.
2. **Cinematic cameras** + sequences (all skippable with Enter): stadium flyover → tunnel line-up (both teams + 4 officials) → walk-out → handshake line → coin toss cutaway; goal (slow-mo replay from 2 angles, scorer close-up, celebration, score card); foul (referee walks to the player, card raise, injured player on ground when severity is high, physio cutaway); red card walk-off; substitution board; transfer-signing scene (holding the shirt) for career modes.
3. **Replay**: keep the 7 s ring buffer, add 0.25×/0.5×/1× and 3 angles, polished overlay.
4. **HUD**: broadcast-style top-left scoreboard (abbr, score, clock, added time, cards), bottom player indicator (small ring + name + number), event lower-thirds (FOUL / GOAL / SUB), **radar bar** at the bottom showing both teams, ball and ball target. Clean typography, nothing oversized.
5. **Menus → HTML/CSS overlay** (replacing canvas-drawn buttons): main menu with club imagery (generated crest + kit renders), pre-match screen with both XIs as face cards (number, position, rating), manager and subs; **pause menu** with three panels: *Team Management* (lineup drag-drop, subs, tactics, formation — replaces the T/G/U hotkey-only flow), *Game Settings* (camera, POV, difficulty, assists sliders, graphics), *Game Controls* (remap incl. 2–3-key chords). Colour selection becomes an HSL colour picker with the swatches as presets.
6. Faces: render each generated face to a small texture once (reuse the existing `face()` canvas) and use it everywhere a player is listed.

**Check:** full match from intro to full-time with no canvas-drawn menus left; capture of pre-match screen, pause menu, goal replay; HUD covers < 10 % of the frame.

---

## PHASE 5 — Gameplay fixes that were valid in the original request (2 sessions)

Actions, not keys — all remappable, chords up to 3 keys allowed:

1. **Pass power**: hold-to-charge bar for ground/through/lob; release speed `cl(d*0.9+6, 9, 28)` becomes `base + power*range`; passes travel ~15 % faster at mid power; receivers run **toward** the ball line (fix the "run away then come back" behaviour in `decide`: when `ball.target === player`, steer to the intercept point immediately).
2. **Shot overshoot**: power > 0.85 raises launch angle and error so over-hit shots clear the bar; add first-time/volley modifier.
3. **Steal** action (new): press near the ball carrier → contest roll vs. strength/defending/balance; failure 40 % → foul with card logic (yellow on repeat, red on last-man); cooldown 1.2 s. **AI tackle spam**: per-player tackle cooldown and a "contain first" rule unless a clean window exists.
4. **Restarts**: on any foul, the fouled team chooses the taker (default: best relevant stat); opponents are pushed to **9.15 m** before the ball is live; free kicks and corners allow rotate (arrows) + pass (pass action) + shoot (shoot action) with the existing aim camera.
5. **Throw-ins**: `throw_in` clip, power bar, target selection; ball leaves from hands at head height.
6. **Set-piece taker UI**: pause-style panel listing players with face, free-kick/corner/penalty stats; remember per team.
7. **Player Career**: *request ball* action (teammates bias passes to you for 6 s), *request sub* (manager may decline), manager auto-subs you after sustained low rating; on sub, choose *simulate to end* or *spectate*.
8. **Difficulty retune**: define per-level targets (expected goals conceded vs. a 70-rated team: Beginner 0.3/match … World Class 3+/match), tune `dInt`, `errM`, GK reaction, pressing distance, pass accuracy; add AI tactical awareness at World Class (overloads, switch of play). Verify by simulating 50 AI-vs-AI matches per level and printing averages.
9. **Training**: add `sprint`, `crossing`, `one-two passing`, `set-piece delivery`; XP per drill halved; drills scale with level.
10. One-player vs whole-team control choice pre-match in every mode.
11. **Stats**: keep tackles; add goals/game, pass %, and recalibrate rating so 4 goals ≈ 10.0, a clean 90 min for a defender ≈ 7.0; show rating history.
12. Simulated matches: your player's stats only change by appearances, a small performance roll tied to form, and possible injury (data in Phase 6).

**Check:** play 2 matches; no foul spam; passes arrive; 9.15 m enforced; capture the taker UI; difficulty simulation table printed and sane.

---

## PHASE 6 — Content scale and career depth (3–4 sessions)

1. **Data model**: positions `GK, RB, CB, LB, RWB, LWB, DMF, CM, CAM, RM, LM, RW, LW, CF, ST`; attributes extended (strength, balance, stamina, heading, crossing, set pieces); contract (wage, years), value, age, form, morale, injury state, nationality, unique face/hair/boots/accessories seed.
2. **Procedural world** (seeded, editable): ≥ 10 fictional countries, 1 league each with 20 clubs (+ a second division for 3 of them), 18–25 players per club, each club with crest generator (shapes + palette), 3 kits with sponsor from a fictional sponsor pool, badge, shared `stadiumId`. Names from per-country first/last name pools (≥ 60 each) so the world is diverse and names don't repeat. Everything overridable in a *World Editor* (edit club, kit, player, stadium).
3. **Persistence**: world stored in IndexedDB; squads never re-roll; migrations for old saves.
4. **Transfers**: players actually move; AI clubs buy/sell by need; offers with wage negotiation, agent, counter-offers, refusals; strong clubs refuse weak suitors; search by league/position/rating/name; "shortlist a club" view with stats and conditions.
5. **Player Career**: interested clubs tab with offers; the club decides whether to sell; injuries with recovery time; rivalry games; sacking-proof.
6. **Manager Career**: tactical presets (balanced, wing play, possession, high press, low block), coaches boosting development, youth academy with prospects, board expectations, **sack/poach/leave** logic, **create-a-club** (name, nickname, crest, kits, league slot replaces a generated club, rivals, starting squad profile, owner hires/sacks managers).
7. **Tournaments**: templates for domestic cup, continental cup (qualifiers → groups → R32 → R16 → QF → SF → F), intercontinental cup, world championship with national teams generated from the player pool; fixtures/calendar integration.
8. **News**: structured items (type, subjects, images) with a detail panel: injury (face + weeks out), transfer (player holding shirt render + fee), rivalry preview, results; applies to both careers.
9. Celebrations: 8+ clips mapped to configurable 1–3-key chords during the goal window; team celebrations near the corner flag.

**Check:** new world generates in < 3 s; two full seasons simulate without errors; load/save round-trip; capture of World Editor, transfer negotiation, news detail; no real-world names appear (grep the name pools against a list of famous players/clubs).

---

## PHASE 7 — AUTO REALISTIC quality system (1 session)

1. Probe on first run: `WEBGL_debug_renderer_info`, `navigator.hardwareConcurrency`, `deviceMemory`, screen size, 2-second benchmark of a hidden scene → initial preset.
2. Presets `LOW / MEDIUM / HIGH / ULTRA / AUTO` controlling: shadow map size and cascades, SSAO on/off/half-res, grass blade ring radius, crowd instance count, player LOD distances, particle count, post-processing, texture resolution, animation update rate for distant players, render scale.
3. AUTO: rolling fps window; if < 55 fps for 3 s step one tier down **one knob at a time** (render scale last); if > 70 fps for 20 s step up. Never flip more than one knob per 3 s. Expose current knobs in Game Settings for transparency.
4. Verify on the owner's VM: AUTO settles at a tier that holds ~60 fps at 1280×720 with 23 characters, crowd and CSM; record the chosen knobs in `docs/perf-baseline.md`.

**Check:** fps overlay (dev only); switching presets causes no visible pop; AUTO converges within 30 s on the VM.

---

## Acceptance for the whole programme

When a match starts the owner immediately sees: skinned, human-proportioned players with real running/kicking animation; stripes and detail in the grass; soft directional shadows; a stadium with seats, people and benches; a broadcast camera; fabric-looking kits with name, number, sponsor and badge; a ball with presence; a clean HUD and radar. Gameplay from the legacy file still works, saves still load, nothing uses real-world football IP, and AUTO holds ~60 fps on the owner's machine.
