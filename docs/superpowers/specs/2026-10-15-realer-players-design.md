# Realer players: design (2026-10-15)

Status: design approved section by section on 2026-10-15; implementation plan in
`docs/superpowers/plans/2026-10-15-realer-players.md`.

## 1. Goal

The owner's words: "make sure the player model is better than pes26 at all cost", then "change of plans
you are going to create it", and "you caring too much on the faces but forgetting the body … the players
still do weird celebrations and their arms are rigged".

So the goal is the whole player, not just the face: arms that move like a person's, believable
celebrations, an athletic body and kit, scan-quality fictional faces, and shading and lighting that hold
up in close-ups. The target is eFootball 2026 (the owner calls it PES26).

### What the owner decided
- Judge by **side-by-side shots**: our game against published eFootball 2026 images at the same framing
  (match camera, replay close-up, menu portrait), plus side-by-side motion clips (running, celebrations).
  The owner decides each pair.
- **Claude builds everything.** No purchases, no second computer, no manual steps for the owner.
- Approach: **scan-based fictional faces** (ICT-FaceKit), not upgraded MakeHuman heads and not
  AI-photo faces.
- Order: **A arms and rig → B celebrations → C body and kit → D head and face → E skin, hair, lighting
  and close-up mode**, each with proof.

### Assumptions carried from earlier decisions
- Faces stay fictional (real players' likenesses are out of scope, decided earlier).
- Free assets with licences that allow use in the game; credits in `docs/CREDITS.md`.
- Everything is built on the owner's Chromebook (Crostini, Blender 4.3, Python 3.13 + numpy + Pillow,
  about 6 GB RAM shared, 8 cores, no ML stack).
- The standing rule in `~/.claude/CLAUDE.md` applies: runs well on the i3-1215U / Intel UHD laptop in
  ChromeOS Chrome, Low/High quality toggle, render pauses when the tab is hidden, reduced-motion fallback.

### Honest limit
eFootball's star faces are scanned per person and rendered on console GPUs. This plan aims to beat it at
the match camera and in replays, and to get as close as possible in extreme close-ups. Every comparison is
shown as it really looks; a lost pair goes back into the loop rather than being reported as a win.

## 2. Where we start (measured 2026-10-15, commit fbf1da4)

| Area | Today |
|---|---|
| Body | MakeHuman/MPFB2 base, LOD0 about 15k triangles (hands and head protected), LOD1 about 14% of that, LOD2 about 1.5k |
| Skin | three 1024² albedo textures (african / asian / caucasian) tinted per player; `MeshPhysicalMaterial` with a small sheen on detail level 2+ |
| Head | MakeHuman head with face sliders as morph targets; portrait close-up looks soft and CG |
| Hair | 2048² card atlas, alpha-tested `MeshStandardMaterial`; cornrows and dreads as tubes |
| Lighting | sun + hemisphere + four flood point lights; generic `RoomEnvironment` at intensity 0.1 |
| Motion | 27 Mixamo Soccer Game Pack clips (Phase 5 part B) plus CMU/hand-made clips; retarget aligns rest *directions* only (`tools/blender/retarget.py`) |
| Arms | in the new clip strips (`captures/sheets/new-A.png`) elbows stay near 90° with fists at hips or chest; idle arms flare out |
| Celebrations | 8 clips in `CELS` (`src/render3d/character.js`); every celebrating player plays one looping clip in place (`anim3` in `src/game.js`, teammates alternate 0/4) |
| Budgets | `scripts/acceptance.mjs` 29/29, 177 draw calls, player triangles 74.5k at the match camera, `player.glb` 5.67 MB |

## 3. Phase A: arms and rig

**A1. Find the real cause, then fix it.** New tool `scripts/armcheck.mjs` plays the Mixamo source skeleton
and our retargeted player on the same frames (jog, run, sprint, idle, shot, pass) and logs per frame:
elbow angle, upper-arm swing plane, forearm twist, hand height and hand position relative to the chest.
Expected cause: `retarget.py` swings each target bone's rest *direction* onto the source's but leaves its
roll, so elbow hinges and wrists end up rotated (chicken wings, fists). Fix: match the full rest frame
(direction and roll) per bone, built from a reference pose of each skeleton; stop copying Mixamo's
clenched fingers unless the clip needs them. Old CMU arm hacks (`ARM_FWD`, `ELBOW_SOFT`, `ARM_GAIN`) are
removed once the CMU clips go through the same alignment.
Pass marks: elbow angle within 5° of the source, hands within 3 cm of the source relative to the chest
(scaled by arm length), idle arms within 10° of vertical.

**A2. Twist bones.** Two twist bones per upper arm and per forearm (`tools/blender/build_player_mh.py`),
weights graded along the bone, twist distributed 1/3 and 2/3 and baked into every clip at build time (no
runtime cost).

**A3. Corrective shapes.** For elbow 90° and 140°, shoulder raised, knee 90° and 140°, hip flexed (8
shapes): pose the body, let Blender's Corrective Smooth keep the volume, store the difference as a shape
key in rest space. Runtime (`src/render3d/character.js`) sets their weights from joint angles each frame,
LOD0 only.

**A4. Hands.** Relaxed half-curled hands by default; fists only where a clip asks (fist pump, sprint
drive); small per-player finger variation.

**A5. Life.** Spring-damped lag on head, upper arms, shirt hem and hair (small, LOD0/LOD1); additive arm
balance on sharp cuts.

**A6. Proof.** Before/after strips beside the Mixamo source; close-ups of elbows, shoulders and knees in
motion; the A1 pass marks from `armcheck.mjs`; player triangles at the match camera ≤ 90k; acceptance
29/29.

## 4. Phase B: celebrations

**B1. A celebration director** (new `src/match/celebration.js`, called from `src/game.js`) replaces the
single looping clip:
1. Choose: scorer personality from seed (showman, humble, fiery), the moment (equaliser, late winner,
   final, own goal = none) and pitch position; keys 1–8 still pick the move.
2. Run-off: sprint to the nearest corner flag or the crowd/camera side, arms out, pointing or screaming.
3. The move where the run ends.
4. Teammates: the nearest 3 to 6 arrive staggered and join (hug, jump on back, high fives, pile).
5. Walk back to their own half with pats on the back.
Opponents react in parallel (hands on head or hips, keeper slaps the ground, a defender complains).
Camera: tracking close-up on the scorer, then wide. A button skips it. Online play sends the chosen
sequence id and seed so both screens match.

**B2. Moves from real motion capture.**
- CMU: 79_69 very happy, 80_43 happy, 85_01 / 141_06 jump twist, 83_61 360° hop turn, 87_03 backflip
  (skilful players only), 143_36 aeroplane, 56_02 fists up, 49_02 jumping up and down, 141_22 high five,
  141_28 hand slap, 18_10 angry gestures, 104_12 excited walk, 60_x salsa and 141_12 twist dance,
  22_05/22_06 hands on shoulders (hug base).
- Quaternius UAL (CC0, already in `tools/assets/_src`): `Slide_Start/Loop/Exit`, `Fixing_Kneeling`,
  `Idle_FoldArms_Loop`, `Dance_Loop`.
- Mixamo pack: cheer, clapping, pointing.
- Assembled (real body motion + IK hand and head targets, never hand-posed whole bodies): knee slide
  (slide legs, kneel, celebrating upper body; root slows from about 6 m/s to 0 over 3–4 m; grass spray),
  badge kiss, shush, cupped ear, point to the sky, heart hands, salute.
- Every clip goes through the Phase A retarget.

**B3. Players touching each other.** Paired moves first place the joining player at an anchor offset from
the scorer, then IK puts hands on shoulders, backs or palms at the contact frame. Body capsules keep
players from passing through each other.

**B4. Faces.** Scream on the run-off, grin in the hug, glare on an equaliser (needs Phase D; until then
the face stays neutral).

**B5. Proof.** Side-by-side clips against eFootball celebrations; foot slide ≤ 2 mm per frame; hand
contact error ≤ 3 cm in paired moves; no body interpenetration (capsule check); a celebration lasts
8–14 s; skip works; hook `__UF.testCelebration()` runs every move and every sequence type headless.

## 5. Phase C: body and kit

**C1. Shape.** Footballer builds per position and archetype from the existing body sliders (stronger
thighs, glutes and calves, lean waist, real neck and trapezius; keepers taller with bigger hands).
Muscle definition as a normal map: bake the difference between each body and its own maximum-muscle
MakeHuman target, so shading shows definition without heavier meshes; strength follows the player's
muscle value.

**C2. Skin, head to toe.** New generator `tools/assets/skin_gen.py` (numpy): continuous tone from a
melanin value instead of three fixed textures; redness at knees, elbows and knuckles; forearm and calf
veins; light body hair; nails and knuckle creases; the same generator makes the face (Phase D) so the neck
and wrists match.

**C3. Hands.** Full finger detail kept at LOD0, knuckle wrinkles and nails, relaxed pose from A4.

**C4. Kit.** Slightly loose shirts instead of painted-on; crew, V-neck and polo collars; hems with
thickness; tucked or untucked shirts; hems, sleeves and shorts move on the A5 springs; wrinkle normal maps
weighted by the same joint angles as A3; close-up weave, mesh side panels, stitched seams, heat-pressed
numbers and badge with a slight shine; sweat patches that grow over the match (chest, back, armpits);
grass and mud stains painted into a 256² per-player stain map where a player slides or dives; rain
soaking; socks over shin pads with ankle wrinkles; boots with laces, heel counter and sole detail on the
three existing stud types.

**C5. Proof.** Body sheet front/back/side for 3 builds × 5 tones; kit wrinkles before/after in action
poses; sweat and stains over a simulated match; body ≤ 16k triangles at LOD0; match camera ≤ 90k for all
22 players.

## 6. Phase D: head and face

**D1. Source.** ICT-FaceKit Light model (MIT, USC ICT 2020): neutral head, 100 identity shapes learned
from scans, 53 ARKit-style expression shapes, eyeballs, eyelashes, lacrimal fluid, eye occlusion, teeth,
gums and tongue. New `tools/blender/ict_head.py` imports it (repo downloaded to `tools/assets/_src/ict`,
about 230 MB, not committed), fits it to our neck by landmarks, cuts both meshes at a mid-neck ring and
bridges them (the collar sits below the seam), and rigs skull, neck, jaw and eyes.

**D2. A face per player.** A compact recipe file (`public/models/head_basis.bin`, float16) holds the mean
head and the 32 strongest identity shapes for each head detail level. Each player's 32 weights come from
their seed (or the creator); the game mixes their head once at match load. Detail levels: about 20k
triangles with eyes, lashes and teeth (close-ups), about 4k (match LOD0), small LOD1/LOD2 heads within the
match-camera budget. Decimated heads are mapped onto the full head by barycentric coordinates so every
level uses the same mix.

**D3. Creator.** Named sliders (nose width, jaw, cheekbones, lips, eye spacing, brow, chin) derived by
measuring what each identity shape does at landmarks and solving for weights. Saved `face` objects convert
to the new sliders on first load (guarded by a save-version flag; backups as in Phase 22).

**D4. Face skin.** Tone from C2; redness on cheeks, nose, ears and lips; under-eye colour; lip colour;
stubble and beard shadow; eyebrows; freckles or moles by seed; a tiling pore normal map up close; wrinkles
placed where expression shapes compress the skin (forehead, eye corners, smile lines) and shown only while
that expression plays.

**D5. Eyes and mouth.** Real eyeballs with wet rim and lid shadow (the model's occlusion mesh); irises
drawn procedurally in natural colours by seed and nation (mostly brown); eyes follow the ball or a
teammate; blink every 2–6 s; teeth and tongue show when shouting.

**D6. Expressions in play** (new `src/render3d/face.js`): squint and clenched jaw when sprinting,
open-mouth breathing late in matches, grimace on shots and tackles, celebration scream and grin,
frustration after a miss. LOD0 and close-ups only.

**D7. Hair rebuilt for the new scalp** (new `tools/blender/hair_build.py`): fades and buzz cuts as layered
scalp textures with short-hair shells; cornrows, braids, dreads and twists as geometry with fibre detail;
curly hair and afros as shells plus clumps; longer styles as layered strips; eyebrows and beards per
player. The existing style list keeps its names (`HSN`) so saves keep their hair.

**D8. Proof.** 40 random faces across tones (no lookalikes: minimum landmark distance between any two),
expression sheet, neck seam close-up in motion, hair sheet, menu portrait beside eFootball.

## 7. Phase E: skin, hair, lighting and close-up mode

**E1. Skin shader** (new `src/render3d/skin.js`, a patch on `MeshPhysicalMaterial`): curvature-based soft
light through the skin with a warm red edge where light meets shadow; two shine layers (broad soft lobe
plus a tight oily lobe via clearcoat); pores fade with distance; cavity map dulls creases; tone-aware
(darker skin: crisper highlights, less visible red glow).

**E2. Eyes.** Iris depth under a clear cornea (parallax), wet highlights, faint veins, lid shadow.

**E3. Hair.** Two strand highlights (one bright, one tinted) along the hair; alpha-to-coverage with MSAA so
there are no sorting glitches.

**E4. Kit.** Fabric sheen; shiny numbers and badge; wet or sweaty patches darker and glossier.

**E5. Lighting** (`src/render3d/environment.js`): at match start, render the real stadium once into a
cube map from mid-pitch at head height (stands, crowd, floodlights, sky) and use it as the environment
instead of `RoomEnvironment`; floodlit nights give sharp rim highlights; soft contact shadows and ambient
occlusion on faces.

**E6. Close-up mode** (new `src/render3d/closeup.js`): in replays, celebrations, line-ups, menus,
portraits and the creator, nearby players switch to close-up heads and bodies; a key and a rim light
follow the camera; temporal anti-aliasing; soft background blur; a shadow map focused on the subject.

**E7. Laptop rule.** Low: today's look plus the new faces and bodies at match detail, no close-up extras.
High: full shaders and close-up mode. Auto: the existing ladder in `src/render3d/quality.js` gains knobs
(close-up mode, hair shells, skin detail) and keeps adjusting to the frame rate. Targets: live match holds
60 fps on Auto on the owner's laptop; close-ups hold ≥ 30 fps on High; rendering pauses when the tab is
hidden; close-up assets load in the background after kick-off; all player files ≤ 20 MB (today about 6).

**E8. Proof.** Frame rate measured in the owner's real Chrome through the Claude-in-Chrome extension (the
headless SwiftShader numbers are not the laptop); side-by-side sheets: match camera, replay close-up,
menu portrait, plus running and celebration clips. Reference images and video frames of eFootball 2026
from the web live in `captures/refs/` (already git-ignored) and are never committed.

## 8. How data flows

Build (`npm run build:player`, Blender): MPFB2 body + ICT head → stitched, rigged with twist bones,
corrective shapes and expression shapes → LODs → `public/models/player.glb`; identity basis →
`public/models/head_basis.bin`; skin, face, eye, hair and kit detail textures → `public/models/tex/`;
clips (Mixamo, CMU, Quaternius, assembled celebrations) retargeted with full rest frames, twist baked →
`player.glb` actions and `clips.json` (contacts, celebration anchors).
Runtime: `characterAssets.load()` loads the glb, basis and textures (close-up textures lazily) →
`new Character()` mixes the player's head once from the recipe, builds skin and hair materials from the
player's tone and style → each frame the mixer plays clips, `face.js` sets expressions, gaze and blinks,
correctives and springs update on near players → `closeup.js` swaps detail levels and lights in close-up
moments.

## 9. When things fail

- Missing `head_basis.bin` or a failed mix: the player keeps the neutral ICT head (still better than
  today) and a console warning names the file.
- Close-up assets not loaded yet: close-up mode waits and uses match detail; no stall.
- No WebGL2 or low memory: Auto drops to Low (existing probe); hair shells and correctives off.
- An old save with MakeHuman face sliders: converted once; the raw values stay in the backup keys.
- A celebration move missing from the build: the director picks another move from the same mood.

## 10. Testing and verification

Every phase: `npm run build`, `npm run build:player` where the build changes, `scripts/acceptance.mjs`
(29/29 plus the new checks), captures with no page errors, and its own proof:
- A: `scripts/armcheck.mjs` pass marks, elbow/shoulder/knee close-up strips.
- B: `__UF.testCelebration()`, celebration strips and clips, skip and online sync check (`nettest.mjs`).
- C: body sheet, kit wrinkle and stain sheets, triangle budgets.
- D: `__UF.testFaces()` (40 faces, min distance, LOD consistency), expression and hair sheets, save
  migration test on a copied old save.
- E: `__UF.testCloseup()`, fps in the owner's Chrome via the extension, the side-by-side sheets.
Owner judges the side-by-side sheets at the end of each phase.

## 11. Delivery

Branch `build`; each phase ends with a `DEVELOPMENT_PROGRESS.md` entry, a commit on `build`, a
fast-forward of `main` and a push of both (the owner edits on another laptop). Heavy Blender bakes run
one at a time (about 1 GB of RAM is free while other apps run).

## 12. Risks

| Risk | Mitigation |
|---|---|
| Neck seam visible in motion | cut at mid-neck under the collar line; weight blend over the seam ring; seam close-up in D8 |
| ICT head rigging and expressions fighting the clips | jaw/eye bones only for the skull; expressions as shapes on top; test on every clip sheet |
| Download size | float16 basis, 32 modes, lazy close-up assets, budget 20 MB |
| Blender bakes run out of memory | 2K tiles, one bake at a time, scripts resumable per asset |
| CMU celebrations look stiff after retarget | Phase A alignment first; reject clips that fail foot-slide and contact checks |
| Alpha-to-coverage and close-up effects too slow on Intel UHD | they live in High only; Auto ladder turns them off first |
| Fictional faces resembling a real person | random identity weights from the full distribution, minimum distance from the mean and from each other; no faces fitted to photos |

## 13. Licences and credits

ICT-FaceKit Light: MIT (copyright notice added to `docs/CREDITS.md`). CMU Graphics Lab Motion Capture
Database: free to use, credit requested. Quaternius Universal Animation Library: CC0. Mixamo: the owner's
download, usable in games, raw files not redistributed (stay in `tools/assets/_src`, not committed).
MakeHuman/MPFB2 assets: CC0.

## 14. Out of scope

Real players' names and faces; paid tools; changes to gameplay rules; the in-match HUD.
