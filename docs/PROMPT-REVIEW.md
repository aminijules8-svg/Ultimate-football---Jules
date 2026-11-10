# Ultimate Football — prompt verification report

**Reviewed:** the "ULTIMATE FOOTBALL PROMPT" (pasted 2026-10-07) against the real game file `Ultimate Football.html` (645 lines, ~133 KB, generated on claude.ai).
**Method:** full read of the file, every claim checked against code with line numbers (`L###`), one headless-Chrome run to confirm the game loads (`docs/reference-1-menu.png`).
**Outcome:** the prompt is not runnable as written. It is two prompts stapled together with opposite priorities, it cites screenshots that do not exist, about a quarter of its complaints are already implemented, and every animation/realism request depends on one missing foundation (a rigged character model) that the prompt never asks for. The corrected, phased version is in `ULTIMATE-FOOTBALL-PROMPT-v2.md`.

---

## 1. What the game actually is

| Area | Reality (with evidence) |
|---|---|
| Engine | Three.js **r128** (2021) from cdnjs for the 3D view (L2, `init3D` L298) **plus** a Canvas 2D layer that draws the top-down view, the HUD and **every menu** (L4, L200–241, L377+). Settings → View toggles 3D/2D; if WebGL fails it silently falls back to 2D (L326). |
| Structure | One HTML file, one inline `<script>`, minified-style 1–3 letter names, ~150 globals declared on L31 alone, no build, no git, no assets. |
| Players (3D) | Hierarchies of cylinders/spheres/boxes, 30–45 meshes each (`mkPl3` L263–290). No skinned mesh, no rig. Face is a 512×256 canvas texture (`face` L254). Shirt is a canvas texture with 12 patterns (`shirtTex` L246) + fabric bump. Number on the back only (L270); no names, sponsors or badges on shirts. |
| Animation | Procedural: `anim3` L291–296 swings legs/knees/arms by speed, torso twist, bob, head look-at; slide-tackle and GK-dive poses. **No kick, throw, header, celebration variety or cutscene animation.** |
| Pitch | One plane with a 1170×800 canvas texture: mown stripes, 9000 grass flecks, line markings (L302–306). |
| Stadium | 8 tiers of `BoxGeometry` with a random-dot texture as the "crowd" (L308–310); 3 roof boxes, 7 pillars (L311–312); 2 translucent dugout boxes (L313); ad boards with 5 fictional sponsors (`AD` L208, L314); 4 floodlights with `PointLight`s (L320–321). Net = wireframe box (L318). **One stadium: "Lion Park"** (L398). |
| Lighting | Ambient + directional sun with shadow map (1024/2048) + hemisphere + 4 point lights (L300–301). Weather changes fog/background/intensity (L330). No tone mapping, no post-processing, 2D vignette only (L228). |
| Camera | Perspective, follows a smoothed ball focus; modes Broadcast / Wide / Player / Tactical on `V` (`camM`), plus intro orbit, goal cam, replay cam, set-piece aim cam (L338–347). |
| Modes | Quick match, Manager Career (8 clubs, 7-round league, abstract transfers), Tournament (8-team knockout, only mode with extra time/shootout), Player Career (14-week season + cup, XP/levels/perks/morale), Training (7 drills), Customize (kit designer), Settings. |
| Data | **8 fictional clubs** (`CL` L30), 3 kits each (L33), 12 designs (`DSG` L34), 16 formations, 8 tactics, **7 difficulties** incl. World Class (`DN` L35), 4 weathers (`WN` L32). Squads: 18 players per club from 11 first × 11 last names, **re-rolled randomly on every page load, never saved** (`getSquad` L38–39). |
| Controls | Arrows move; `X` pass, `W` through, `D` lob/cross, `A` shoot (hold = power), `E` sprint, `F` slide, `Q` stand tackle, `S` contain, `R` skill, `Z` finesse, `C` chip, `Tab` switch, `T` tactic, `G` formation, `U` sub, `V` camera, `P` pause, `J/L/I/K` free-kick curve/straight/dip (`KM0` L30). Fully remappable in Settings → Controls (L389–391, `setKey` L427). Gamepad supported (L166–168). |
| Rules | Fouls on failed tackles (22 % slide, 8 % standing, L72–74); 3rd foul = yellow, 6th foul or 3 % roll = red (L75–76); penalty if in box (L77); offside on pass (L65, L137); throw-ins are a ground pass from the touchline with no throw animation (L133). |
| Stats | Team: shots, on target, passes, completed, **tackles**, fouls, possession, corners (`newSt` L36). Player Career: goals, **assists** (L84), tackles, passes, shots, **match rating** (formula L463), Man of the Match. |
| Presentation | 12 s intro walk-out with lineups (L152, `drawIntro` L373); goal: 4.5 s camera on scorer + one celebration + net bulge (L240, L292); replay of last 7 s, 3D only (L175, L191, `snap` L619); referee model raises card (L326, L332). |
| Saves | `localStorage`: `uf_set`, `uf_careers`, `uf_pcs` (L356–357, L445). Squads and names are **not** saved. |
| Known bugs/stubs | Settings footer says "remapping UI not built" although it exists (L388); `recCareer0` is an empty stub (L363); manager STYLE indices mislabel tactics (Attacking→High press, Defensive→Low block); transfer "rating bump" is applied to `CL[].s` but squads are cached, so it likely never reaches match stats (L48 vs L630). |

---

## 2. Claim-by-claim verification

Status key: **EXISTS** already in the game · **PARTIAL** · **MISSING** · **FALSE PREMISE** (the complaint is wrong about the game).
Verdict key: **KEEP** (valid, goes into v2) · **REWRITE** (valid idea, wrong description) · **CUT** · **DEFER** (valid but after prerequisites).

### 2a. Part A — the feature list

| # | Request | Status | Evidence | Verdict |
|---|---|---|---|---|
| A1 | More kit designs | PARTIAL — 12 designs, 3 kits/club | `DSG` L34, L33 | KEEP (v2 Phase 6: generator, +designs for shorts/socks) |
| A2 | Custom sponsors on kits | MISSING on shirts; 5 fictional sponsors on ad boards only | L208, L314, `shirtTex` L246 | KEEP (Phase 1 kit template + Phase 6) |
| A3 | Kit badges | MISSING | — | KEEP (Phase 1/6) |
| A4 | Custom leagues "like Premier League" | MISSING — one 8-club table | `CL` L30, `fixtures` L360 | KEEP as **procedural**, Phase 6 |
| A5 | Fix player editing "blocks not in place" | PARTIAL — editor works, but model is primitives so it *looks* blocky | `mkPl3` L263, face/body sliders L447–448 | REWRITE → needs the rigged model (Phase 1) |
| A6 | "Ask for ball" button, editable in settings | MISSING; remap system exists | L389–391 | KEEP (Phase 5) |
| A7 | X+E chord = steal with foul risk | MISSING; **X=pass, E=sprint** so the chord fires both | `KM0` L30 | REWRITE → "steal" as its own remappable action with chord support |
| A8 | More drills, less XP, sprint drill | PARTIAL — 7 drills, XP only in Player Career | L603–618, `awardTrain` L466 | KEEP (Phase 5, tuning) |
| A9 | Choose set-piece taker with stats + picture | MISSING — penalty = best shooter, others = nearest | L77, `startAim` L545 | KEEP (Phase 5) |
| A10 | 10–15 countries × 20 teams, all customizable | MISSING — 8 clubs | L30 | KEEP as procedural generator; hand-authoring 300 clubs is not feasible |
| A11 | Every player unique (boots, hair, name) | FALSE PREMISE in part — uniqueness exists but **only for your pro**; others get 6 hairstyles and 2 boot colours by index, and are **re-rolled every load** | L263, L274, L286, L38 | KEEP — but prerequisite is **persisted squads** (Phase 6) |
| A12 | Radar/mini-map bar at the bottom | MISSING | — | KEEP (Phase 4) |
| A13 | More celebrations with 1–3-key combos | PARTIAL — one celebration, no input | L292 | DEFER → needs animation clips (Phase 1) then Phase 4 |
| A14 | Up to 15 stadiums, customizable stands/nets/pitch, 3 custom slots, "not blocks" | MISSING — one stadium, boxes | L308–318, L398 | KEEP, scaled to 4–6 variants + customizer (Phase 3) |
| A15 | Unique images/custom menus, not boxes | PARTIAL — procedural backgrounds but text-only canvas buttons, no images | `bgArt` L430, `btn` L352 | KEEP (Phase 4 UI) |
| A16 | Pre-match lineup screen with faces, numbers, manager, subs | PARTIAL — intro lists names only | `drawIntro` L373 | KEEP (Phase 4) |
| A17 | Game plan reflects transfers | FALSE PREMISE → transfers don't move players at all (rating bumps) | L413–414 | REWRITE → real transfer system (Phase 6) |
| A18 | News with transfers, injuries, rivalries, detail panel + images | PARTIAL — plain text strings, no injuries exist | L495, `C.news` | KEEP (Phase 6) |
| A19 | Interested clubs, salary negotiation, club decides | MISSING | — | KEEP (Phase 6) |
| A20 | Remove tackles; add assists, goals/game, realistic rating | FALSE PREMISE — assists and rating exist; tackles drive cards | L84, L463, L36 | REWRITE → recalibrate rating, add goals/game; keep tackles |
| A21 | Transfer cutscene, foul/injury cutscene | MISSING | — | DEFER (Phase 4, after Phase 1) |
| A22 | Free kick: rotate with arrows, X to pass, also corners | PARTIAL — aim cam + curve/dip + power exist (3D only); no pass option | L545–578 | KEEP (Phase 5) |
| A23 | "Press D shows power bar"; passes too long | FALSE PREMISE on key — power bar exists on **A** (shoot); **D** is lob. Real gap: no pass power | L178, L236, L30 | REWRITE → pass power bar on X/D/W |
| A24 | Simulated matches shouldn't invent stats; injuries possible | PARTIAL — simulate exists; no injuries | — | KEEP (Phase 6) |
| A25 | Difficulty: World Class should be brutal | PARTIAL — 7 levels, scale only AI timing/error/GK | `dInt`/`errM` L51, L89, L105 | KEEP (Phase 5 tuning) |
| A26 | Negotiations can fail; search any league/position/rating; stronger clubs refuse | PARTIAL — 55 % roll only | L413 | KEEP (Phase 6) |
| A27 | More positions (RB, CB, CAM, DMF…) | MISSING — only GK/D/M/F | `FM` L14–29 | KEEP (Phase 6 data model) |
| A28 | EA Sports FC 26 Manager Career text with [1][2][3] citations | — pasted marketing copy, not an instruction | — | **CUT** (not a requirement; cloning a named commercial product is also an IP risk) |
| A29 | Receiver runs away before coming to the ball; faster passes | Plausible — receivers steer toward formation target until the ball is near (`decide` L93–106); pass speed `cl(d*.9+6,9,28)` L64 | | KEEP (Phase 5) |
| A30 | AI tackles over and over → fouls | Plausible — tackle chance scales with difficulty, no cooldown | L105, L189 | KEEP (Phase 5) |
| A31 | Foul: choose taker, opponents ≥ 5 m (laws say 9.15 m) | MISSING — nearest player takes, no retreat | `setPiece` L80 | KEEP (Phase 5) |
| A32 | Throw-ins with hands + power bar | MISSING — ground pass from touchline | L133 | KEEP (Phase 1 clip + Phase 5) |
| A33 | Pause menu: Team Management, Game Settings, Game Controls boxes | MISSING — Resume/Quit/key list | `drawPause` L428 | KEEP (Phase 4) |
| A34 | Play as one player or whole team, chosen pre-match | PARTIAL — Player Career locks to one player; Quick match is team | L159, L179 | KEEP (Phase 5, small) |
| A35 | Referee walks up and shows card; red-card walk-off cutscene | PARTIAL — referee raises card where he stands; sent-off player teleports to x=−200 | L326, L332, `sendOff` L602 | DEFER (Phase 4 after Phase 1) |
| A36 | Full tunnel → line-up → handshake cutscene | PARTIAL — walk-out from tunnel point exists | L152, L373 | DEFER (Phase 4) |
| A37 | "No running motion, add it" | **FALSE PREMISE** in 3D (`anim3` L291) — likely seen in 2D mode or motion too subtle | L291–296, L218 | REWRITE → replace procedural swing with real clips (Phase 1) |
| A38 | Request ball / request sub; manager can sub you; simulate-to-end or spectate | MISSING | — | KEEP (Phase 5) |
| A39 | Bench boxes with sitting subs, 2 unique managers per match | PARTIAL — 2 translucent boxes; manager model only in Manager Career | L313, L333 | KEEP (Phase 3) |
| A40 | More menu colours, colour **picker** instead of swatches, shorts/socks colours + designs | PARTIAL — 12-swatch palettes, socks = primary colour | `PAL`/`PAL12`, L219 | KEEP (Phase 4/6) |
| A41 | Everything applies to all modes | — | — | KEEP as a rule |
| A42 | Tournaments: groups, R32, R16, QF, SF; continental, world, qualification | PARTIAL — 8-team knockout | L365–371 | KEEP (Phase 6) |
| A43 | Create-a-club as owner, hire/sack manager | MISSING | — | KEEP (Phase 6) |
| A44 | POV/normal toggle pre-match and in settings; camera angles in settings | PARTIAL — `V` cycles 4 cams in match; no settings entry | L162, L238 | KEEP (Phase 4, small) |
| A45 | Overpowered shots fly over | PARTIAL — `vz` rises when power > .85 but aim doesn't | L69 | KEEP (Phase 5 tuning) |

### 2b. Part B — the "Auto-Realistic" graphics brief

| # | System requested | Status | Evidence | Verdict |
|---|---|---|---|---|
| B1 | "Two reference screenshots in this conversation" | **MISSING — none exist** | — | REWRITE: Reference 1 = `docs/reference-1-menu.png` + in-match capture; Reference 2 must be supplied or described |
| B2 | AUTO REALISTIC preset + LOW/MED/HIGH/ULTRA, FPS-driven scaling | PARTIAL — LOW/MEDIUM/HIGH exists, applied only at renderer creation | `GN` L32, `gq` | KEEP (Phase 7) |
| B3 | PBR, HDR, tone mapping, SSAO, AA, soft/contact shadows, bloom, DoF, motion blur, volumetrics | PARTIAL — `MeshStandardMaterial` (PBR-ish), AA + shadow map only; **r128 has no post stack wired** | L245, L299–301 | KEEP minus volumetrics/motion blur (Phase 2); requires Three.js upgrade |
| B4 | Lighting presets Day/Overcast/Sunset/Evening/Night | PARTIAL — Clear/Evening/Night/Rain | `WN` L32, L330 | KEEP (Phase 2) |
| B5 | Multi-layer grass + 4 LODs, wetness, foot/ball interaction | MISSING — single canvas texture | L302–306 | KEEP, scaled: layered material + 2 LODs (Phase 2) |
| B6 | Realistic modular player model, body types | MISSING — primitives | L263–290 | **KEEP — this is the keystone (Phase 1, Blender)** |
| B7 | Skin/hair/eye/boot/kit/sock/short materials | PARTIAL — skin/hair bump, fabric bump | `skb`/`fbt`/`hbt` L249–251 | KEEP (Phase 1 textures) |
| B8 | Detailed original kits with name, number, sponsor, badge placeholders | PARTIAL — number only | L270 | KEEP (Phase 1) |
| B9 | ~45 animation clips + GK set, blend trees, state machine, IK, foot placement, look-at | PARTIAL — procedural swing + look-at; **no clips possible without a rig** | L291–296 | KEEP, trimmed to ~22 clips first (Phase 1) |
| B10 | Ball contact points (foot/head/chest) | MISSING | `contact` L134 | DEFER (Phase 1 clips + Phase 5) |
| B11 | Ball texture/normal/roughness, rolling, spin, net reaction | PARTIAL — 6-dot texture, rolling, spin curve, net scale | L322–323, L334, L337 | KEEP (Phase 2, small) |
| B12 | Detailed stadium (seats, railings, tunnel, benches, camera platforms) | MISSING | L308–313 | KEEP (Phase 3) |
| B13 | Instanced/impostor crowd with states | MISSING — dot texture | L310 | KEEP (Phase 3) |
| B14 | Atmosphere: ambience audio, announcements, flags, haze | MISSING — oscillator beeps only | `snd` L12 | KEEP, audio as placeholders (Phase 3) |
| B15 | Broadcast camera + cinematic cams | PARTIAL | L338–347 | KEEP (Phase 4) |
| B16 | Cascaded shadows, contact shadows, AO | PARTIAL — single shadow map | L301 | KEEP (Phase 2, CSM from three/examples) |
| B17 | Weather incl. rain particles, wet pitch, player dirt | PARTIAL — rain lines, friction change | L325, L120 | KEEP (Phase 2) |
| B18 | Broadcast HUD, player indicator ring | PARTIAL — scoreboard L232, controlled-player marker | L232–236 | KEEP (Phase 4) |
| B19 | Goal/foul presentation sequences | PARTIAL | L240, L76 | KEEP (Phase 4) |
| B20 | Player collision responses, no teleporting | PARTIAL — 231-pair separation each step (L190); sent-off teleports | L190, L602 | KEEP (Phase 5) |
| B21 | LOD for players/crowd/stadium/grass | MISSING | — | KEEP (Phase 2/3) |
| B22 | Pooling, instancing, occlusion culling, animation LOD | MISSING — ~800 meshes for 23 bodies | L263–290 | KEEP (Phase 3/7) |
| B23 | Referee model, kit, whistle, hand signals, cards | PARTIAL — model + card raise | L326 | KEEP (Phase 1 clips) |
| B24 | Subs/coaches visible | PARTIAL — manager in Manager Career only | L333 | KEEP (Phase 3) |
| B25 | Match intro cinematic | PARTIAL | L373 | KEEP (Phase 4) |
| B26 | Replay system with slow-mo + angles | PARTIAL — 7 s, one angle, 0.8× | L175, L239 | KEEP (Phase 4) |
| B27 | "Run the game after each system" | — | — | KEEP; v2 gives the exact command (headless capture works on this machine) |
| B28 | Development order 1–16 | Skips restructure; puts animation (5) before model (4) is fine but both before a rig exists | — | REWRITE (v2 phases) |

---

## 3. Contradictions and impossibilities (and what v2 does about them)

1. **Two opposite priorities.** Part A is ~45 content/gameplay features; Part B says realism is "THE MOST IMPORTANT objective" and *not* to add modes. → v2 makes visual realism Phases 1–4, valid gameplay fixes Phase 5, and content scale Phase 6, and says so explicitly.
2. **Non-existent references.** "Two reference screenshots" are cited; none were provided. → v2 ships Reference 1 (captured from the game) and asks the user for Reference 2 or a written target.
3. **Pasted marketing text.** The EA Sports FC 26 block with `[1] [2]` citations describes another company's product. → cut; the few generic ideas (tactical presets, youth academy, manager sacking) are re-expressed in v2 Phase 6 without the brand.
4. **Key conflicts.** `X+E` collides with pass+sprint; "D shows power bar" is the wrong key. → v2 defines actions, not keys, and asks for a chord-capable remapper.
5. **Removing tackles.** Tackles feed fouls/cards. → keep the stat, hide it from the summary screen if wanted.
6. **Scale vs architecture.** 200–300 clubs × 18 unique players cannot be hand-written or live in one HTML file, and squads currently vanish on reload. → v2 Phase 0 splits the project; Phase 6 uses a seeded generator and persistence.
7. **Engine vs features.** r128 can't do CSM/SSAO/skinned-clip blending without the examples modules and a rigged mesh. → v2 Phase 0 upgrades Three.js; Phase 1 builds the rig in Blender (the user's original request).
8. **Hardware.** The user's own machine is a ChromeOS Crostini VM (virgl, 6 GB RAM, 8 cores, ~1 GB free in practice). → v2 sets this as the AUTO baseline; ULTRA is allowed to be unplayable here, AUTO is not.
9. **Order.** Nothing in the original makes the code editable first. → v2 Phase 0 (restructure, readable names, Vite, git) is mandatory and sized to one session.
10. **"Do not restart" vs the single-file reality.** v2 keeps the rule and adds "restructure without changing behaviour" with a parity check (same squads via seed, same key map, same saves migrate).

---

## 4. Feasibility and effort on this machine

| Phase (v2) | Effort | Notes |
|---|---|---|
| 0 Restructure + Three.js upgrade | 1–2 sessions | Mechanical but must be done first; parity test = play one full match + load an old save. |
| 1 Character pipeline (Blender) | 3–5 sessions | Blender 4.3 via apt (~350 MB). Rigged base body + 6 body-type shape keys, modular kit, ~22 clips, glb export, AnimationMixer blending, foot grounding. Biggest single lift; unlocks A5/A13/A21/A32/A35/A36/A37/B6–B10/B23. |
| 2 Rendering | 2–3 sessions | Colour management, lighting presets, layered grass + 2 LODs, CSM, SSAO, ball. 6 GB RAM means keep shadow maps ≤ 2048 and avoid multiple full-res passes. |
| 3 Stadium + crowd | 2–3 sessions | Instanced seats and impostor crowd (sprite sheet), 4–6 variants via parameters, benches with seated models. |
| 4 Camera + presentation + UI | 2–3 sessions | HTML overlay for menus is the realistic route (today everything is canvas-drawn text). |
| 5 Gameplay fixes | 2 sessions | Mostly tuning + small UIs; no new tech. |
| 6 Content scale | 3–4 sessions | Data model (positions, contracts, injuries), seeded generators, persistence (IndexedDB), real transfers, tournaments, create-a-club, news detail. |
| 7 AUTO REALISTIC | 1 session | Probe → preset → smooth scaling; verify on this VM. |

Total: roughly 16–23 Claude Code sessions. Running the original prompt in one go would exhaust context long before Phase 2.

---

## 5. Cut list

| Cut | Reason |
|---|---|
| EA Sports FC 26 Manager Career text (A28) | Not a requirement; brand/product cloning risk. Generic ideas kept un-branded. |
| "Remove tackles" (A20) | Stat is load-bearing for cards. |
| 15 stadiums (A14) | 4–6 parametric variants + customizer gives the same player-facing variety at a quarter of the cost. |
| 45+ animation clips up front (B9) | Start at ~22; add volley/chip/header variants once blending works. |
| Volumetric lighting, motion blur (B3) | Not viable on the user's GPU; add later behind ULTRA only. |
| "Thousands of individual crowd humans" | Replaced by instanced impostors (what the prompt itself recommends in B13). |
| Hand-authored 300 clubs (A10) | Replaced by seeded procedural generation with editable overrides. |
| Duplicate requests (POV toggle ×2, "applies to all modes" ×2, difficulty ×2) | Merged. |
| Requests already present (running animation, assists, rating, remap UI, weather, replay) | Re-stated as "improve X" with what exists noted, so credits aren't spent rediscovering them. |

---

## 6. Where to start

Run **Phase 0** from `ULTIMATE-FOOTBALL-PROMPT-v2.md` in Claude Code with the folder open. Do not paste the whole v2 file; paste one phase per session.
