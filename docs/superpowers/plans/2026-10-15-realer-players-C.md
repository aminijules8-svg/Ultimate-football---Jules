# Realer Players Phase C (Body and Kit) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bodies and kits read as real footballers up close: athletic builds per position, skin of any tone made
from one physical model (not three tinted photos), hands with knuckles and nails, and kits that hang, crease, sweat
and get dirty like cloth instead of being painted on.

**Architecture:** The skin becomes a generated texture set: `tools/assets/skin_gen.py` (numpy, plain-python tests)
turns the MakeHuman photo detail into a tone-neutral detail layer and writes region masks (knees, elbows, knuckles,
nails, veins, body hair) as one RGBA mask atlas; the runtime colours it from a continuous melanin value in a small
canvas pass (`src/render3d/skintone.js`, pure maths tested with `node --test`). Builds per position come from body
morph targets the build already exports (`build_player_mh.py` `variants`) plus three athletic targets; muscle
definition is a baked normal map per build. Kit: the build offsets the kit shell slightly off the body with collar
variants and hem thickness; the runtime adds joint-driven wrinkle normals, sweat that grows over the match and a
per-player stain map painted where a player slides or dives.

**Tech Stack:** three.js r186, Node 24 `node --test`, Blender 4.3 Python, numpy/Pillow.

**Spec:** `docs/superpowers/specs/2026-10-15-realer-players-design.md` §5. Parent plan:
`docs/superpowers/plans/2026-10-15-realer-players.md`.

## Global Constraints

- Body ≤ 16k triangles at LOD0; all 22 players ≤ 90k at the match camera; `player.glb` growth ≤ 1.5 MB; new textures
  ≤ 3 MB on disk; nothing new is fetched at match time beyond the existing texture set.
- Low quality keeps today's look (no stain maps, no wrinkle normals, no sweat); Medium and up get them.
- Every tone from the lightest to the darkest uses the same generator; no tone-specific photo.
- Old saves keep working: `skinColor` stays the stored value; melanin is derived from it.

## Review Focus

1. **Very dark and very light tones:** detail (pores, creases) must stay visible on dark skin and redness must not turn
   pink-grey on light skin. Pinned by `tests/skintone.test.mjs` (contrast and hue checks at both ends).
2. **Seams at the neck, wrists and ankles:** the same generator colours face and body, so the tone matches across UV
   islands. Pinned by the build's seam check (`skin_gen.py --check`: mean colour either side of each seam within ΔE 2).
3. **Stain map growth:** many slides in one match must not saturate the kit to brown. Pinned by a stain-map test
   (coverage capped, repeated stamps at one spot converge).
4. **Kit shell off the body:** no skin poking through the shirt in action poses (raised arms, sprint, slide). Pinned by
   the build's penetration check over the clip set (vertices of the body inside the kit shell, sampled per clip).

---

### Task 1: Skin generator and continuous tone

**Files:** Create `tools/assets/skin_gen.py`, `tools/assets/test_skin_gen.py`, `src/render3d/skintone.js`,
`tests/skintone.test.mjs`; modify `tools/assets/textures.py` (call it), `src/render3d/character.js` (use it).

- `skin_gen.py`: from the three MakeHuman diffuse photos, a tone-neutral **detail** layer (luminance high-pass,
  averaged over the three so no single person's blemishes repeat) and a **mask** atlas (R redness: knees, elbows,
  knuckles, cheeks, ears; G veins: forearms, backs of the hands, calves; B body hair: forearms, shins; A nails),
  regions from `masks.json` triangles plus bone-distance masks written by the build.
- `skintone.js`: `skinAlbedo(melanin, haemo)` → linear RGB (two-pigment model fitted to measured skin reflectance
  endpoints), `toneFromColor(hex)` (inverse: an old `skinColor` → melanin), `composeSkin(detail, mask, tone)` →
  per-pixel colour (pure functions over typed arrays).
- Tests: tone monotonic in melanin, round trip `toneFromColor(skinAlbedo(m))` within 0.02, redness keeps hue on light
  and dark skin, detail contrast on the darkest tone ≥ half of the lightest.

### Task 2: Builds per position and muscle definition

**Files:** `tools/blender/build_player_mh.py` (three athletic morph targets: `build_power`, `build_lean`,
`build_keeper`; muscle-definition normal map baked from each against its maximum-muscle MakeHuman target),
`src/world/archetypes.js` / `src/render3d/character.js` (position → build weights), test in the viewer sheet.

### Task 3: Hands — knuckles and nails

**Files:** `skin_gen.py` (knuckle creases and nail plates in the detail and mask layers), decimation protect list in
`build_player_mh.py` (hands kept at LOD0).

### Task 4: Kit geometry

**Files:** `tools/blender/build_player_mh.py` kit shells: shirt offset 4–8 mm off the body (more at the waist and
sleeves), collar variants (crew, V, polo) as shape keys, hem thickness, untucked shirt hem; penetration check over the
clip set.

### Task 5: Kit runtime — wrinkles, sweat, stains, rain

**Files:** `src/render3d/kitwear.js` (pure stain/sweat maths, tested), `src/render3d/character.js`.
Wrinkle normal maps blended by the corrective joint angles (elbow, shoulder, hip); sweat patches (chest, back,
armpits) growing with minutes played and running; a 256² stain map per player stamped at slide and dive contacts
(grass green, mud brown on wet pitches), coverage capped; rain darkens and glosses the kit.

### Task 6: Proof

Body sheet 3 builds × 5 tones front/back/side; kit wrinkles before/after in action poses; sweat and stains after a
simulated match; triangle budgets; `DEVELOPMENT_PROGRESS.md` entry; side-by-side against eFootball references;
commit; push both branches.
