# Realer Players Phase D (Head and Face) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every player gets his own face from real head scans (ICT-FaceKit: 100 identity shapes learned from scans),
stitched to our body at mid-neck, with real eyes, lashes and teeth, expressions in play, and hair rebuilt for the new
scalp, instead of one MakeHuman head with sliders.

**Architecture:** The build imports the ICT neutral head and its identity/expression shapes (`tools/blender/ict_head.py`),
fits it to the MPFB neck by landmarks, cuts both at a mid-neck ring and bridges them, rigs skull/neck/jaw/eyes into the
existing Mixamo rig, and writes `public/models/head_basis.bin` (float16: mean + the 32 strongest identity modes per head
LOD, barycentric maps from decimated LODs onto the full head). The runtime mixes each player's head once
(`src/render3d/headmix.js`, pure, `node --test`), drives expressions, gaze and blinks (`src/render3d/face.js`), and
colours the face with the Phase C skin model so face and body match.

**Tech Stack:** three.js r186, Node 24 `node --test`, Blender 4.3 Python, numpy.

**Spec:** `docs/superpowers/specs/2026-10-15-realer-players-design.md` §6. Data: ICT-FaceKit (MIT, USC ICT 2020),
`FaceXModel/` — 160 OBJ files (~405 MB), downloaded to `tools/assets/_src/ict/` (git-ignored); MIT notice in
`docs/CREDITS.md`.

## Global Constraints

- Head ≤ 4k triangles at match LOD0, ≤ 20k with eyes/lashes/teeth in close-ups; all 22 players ≤ 90k at the match camera.
- `player.glb` + `head_basis.bin` growth ≤ 6 MB; head mixing ≤ 5 ms per player on the owner's laptop.
- Faces stay fictional: identity weights come from the seed or the creator, never from a real person.
- Old saves keep their look as far as possible: MakeHuman face sliders convert once to identity weights (backup first).
- Downloaded data is data only: no scripts from the ICT repository are run.

## Review Focus

1. **Neck seam in motion:** no crack or colour step at the seam when the head turns and the jaw opens. Pinned by the
   seam check (max gap between bridged rings over the clip set) and a close-up strip.
2. **No lookalikes:** 40 random faces, minimum landmark distance between any two above a floor. Pinned by
   `__UF.testFaces()`.
3. **LOD consistency:** the same player's head at LOD0/1/2 has the same proportions (barycentric maps). Pinned by
   `tests/headmix.test.mjs`.
4. **Hair fits the new scalp:** no scalp poking through any style; every `HSN` name still maps to a style.

---

### Task 1: Fetch and import

`tools/assets/fetch.sh` gains the ICT FaceXModel download (raw files, checksummed); `tools/blender/ict_head.py` imports
the neutral mesh and shape OBJs as shape keys (vertex order shared), reads `vertex_indices.json` for the face/eye/teeth
parts; test on a tiny fixture.

### Task 2: Fit, cut and bridge to the body

Landmarks (chin, ear roots, nape, Adam's apple) on both heads → similarity transform; mid-neck cut ring on both; bridge
with matching vertex counts; skin weights across the seam blended from the MPFB neck; head LODs.

### Task 3: Identity basis and mixing

`head_basis.bin` writer in the build; `src/render3d/headmix.js` (`mixHead(basis, weights, lod)`), `tests/headmix.test.mjs`
(weights 0 = mean, linearity, LOD consistency); `Character` mixes once at construction.

### Task 4: Creator and save migration

Named sliders measured at landmarks (nose width, jaw, cheekbones, lips, eye spacing, brow, chin) solved to identity
weights; old `face` objects converted once with a backup; portraits regenerate.

### Task 5: Face skin, eyes and mouth

Face colours from `skintone.js` through the ICT UVs (redness on cheeks/nose/ears/lips, under-eye, lip colour, stubble,
brows, freckles/moles by seed); eyeballs with iris colours by seed/nation; lashes; teeth and tongue.

### Task 6: Expressions, gaze and blinks

`src/render3d/face.js`: sprint squint, late-match breathing, grimace on shots/tackles, celebration scream and grin,
frustration; eyes follow the ball; blinks every 2–6 s; LOD0 and close-ups only.

### Task 7: Hair for the new scalp

`tools/blender/hair_build.py`: the `HSN` list rebuilt on the ICT scalp (fades/buzz as scalp layers + short shells; braids,
dreads, twists, cornrows as geometry; afros as shells + clumps; long styles as strips); brows and beards.

### Task 8: Proof

40 faces sheet, expression sheet, seam close-up in motion, hair sheet, menu portrait beside eFootball references;
`DEVELOPMENT_PROGRESS.md`; commit; push both branches.
