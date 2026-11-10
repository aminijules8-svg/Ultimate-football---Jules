# Realer Players Phase B (Celebrations) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Goals end in a believable celebration scene — the scorer runs off and does a move made from real motion capture, teammates arrive and join in, the opponents react — instead of everyone looping one hand-keyed clip in place for 4.5 s.

**Architecture:** A pure director module (`src/match/celebration.js`) turns the goal context into a plan (who runs where, which move, who joins when, how opponents react) and answers "what does player i do at time t". `src/game.js` feeds it at the goal and applies its targets and clips during the goal state; `Character` plays named celebration clips. The Blender build adds the new clips from CMU / Quaternius / Mixamo and assembles gesture moves with IK.

**Tech Stack:** three.js r186, Node 24 `node --test`, Blender 4.3 Python.

**Spec:** `docs/superpowers/specs/2026-10-15-realer-players-design.md` §4. Parent plan: `docs/superpowers/plans/2026-10-15-realer-players.md` (Phase A done).

## Global Constraints

- Celebration length 8–14 s (training mode keeps 2.6 s); a skip key ends it.
- Every move is real motion capture or real capture plus IK targets; no hand-posed whole bodies (the legacy `old` celebrate_* clips go).
- Foot slide ≤ 2 mm per frame in every new clip; hand contact ≤ 3 cm in paired moves; no body interpenetration.
- Online: guest and host show the same celebration.
- Budgets from the parent plan: player triangles ≤ 90k at the match camera; acceptance stays 29/29 (+ new checks); `player.glb` growth ≤ 2 MB for this phase.

## Review Focus

1. **Goals in odd situations:** own goals, penalties in a shoot-out, the 90th-minute winner of a final, a goal while a player is sent off. Expected: own goal → no celebration from the scoring side (the other side's scorer is the credited one; reactions only), shoot-out → short celebration, final winner → longest. Pinned by `tests/celebration.test.mjs` cases.
2. **A scorer near the corner or at the far edge:** the run-off target must stay inside the pitch and the run short. Pinned by the "run target inside the pitch" test.
3. **Very few teammates nearby / a team with 10 players:** joiners never exceed available players; no undefined indices. Pinned by the "few teammates" test.
4. **Skipping and pausing during the celebration:** pause must freeze it; skip must leave every player in a valid state for kick-off. Pinned in Task 5 Step 4.
5. **Online guest receiving a goal mid-celebration (late join / packet loss):** the guest must render a sensible celebration from the plan in the packet. Pinned in Task 5 Step 5 (`nettest.mjs`).

---

### Task 1: Director module

**Files:** Create `src/match/celebration.js`; Test `tests/celebration.test.mjs`.

**Interfaces — Produces:**
- `MOVES`: `{ [name]: { clip: string, moods: string[], dur: number, skill?: number } }`
- `planCelebration(ctx) -> plan | null` with `ctx = { seed, minute, score: [a, b], team, ownGoal, final, shootout, pick, field: { HW, HH, dir }, scorer: { i, x, y, skill }, mates: [{ i, x, y }], opps: [{ i, x, y, role }] }`; `plan = { seed, mood, move, dur, run: { x, y }, joiners: [{ i, at, role }], reactions: [{ i, clip, at }] }`.
- `celebrationAt(plan, t, pos) -> Map<i, { tx, ty, spr, clip, look }>` where `pos(i) -> {x, y}` gives live positions.

Steps: write the tests for the Review Focus cases plus determinism (same seed → same plan), mood rules (equaliser → fiery, late winner → showman, final → longest), run target inside the pitch and toward the nearest corner on the attacking side, joiner count 3–6 bounded by available mates and ordered by distance, staggered arrival times from distance / 7 m/s, durations 8–14 s, `pick` overriding the move; watch them fail; implement; pass; commit.

### Task 2: Celebration clips from motion capture

**Files:** `tools/assets/fetch.sh` (CMU list), `tools/blender/celebrate.py` (new: segment finders + clip table), `tools/blender/build_player_mh.py` (call it; drop the `old` celebrate_* clips), test `tools/blender/test_celebrate.py` (segment finder on synthetic tracks).

Segment finders (pure functions over per-frame tracks, unit-tested with plain python3): `window_hands_up(hand_z, head_z)` (both hands above the head), `window_jump(hip_z)` (hips rise > 0.25 m), `window_spin(yaw)` (yaw change ≥ 300°), `window_still(speed)` (calm stretch for loops), each returning `(f0, f1)` in source frames with lead-in/out.
Clip table (name → source, finder, loop?): `celebrate_cheer` 79_69, `celebrate_happy` 80_43, `celebrate_jumpspin` 85_01, `celebrate_spin` 83_61, `celebrate_backflip` 87_03, `celebrate_airplane` 143_36, `celebrate_fists` 56_02 (hands-up window), `celebrate_jump` 49_02, `celebrate_dance` 60_01 (UAL Dance_Loop fallback), `celebrate_twist` 141_12, `high_five` 141_22, `hand_slap` 141_28, `angry` 18_10, `walk_happy` 104_12, `hug` 22_05, reactions `react_sad` 79_71, `react_upset` 79_74, `walk_sad` 82_10, `walk_angry` 17_01.
Check every clip with `--armcheck` (elbow ≤ 5°, facing) and a foot-slide measure; strips for the owner.

### Task 3: Gesture moves assembled with IK

**Files:** `tools/blender/gestures.py` (new), build call; test `tools/blender/test_gestures.py` (toy rig: hand reaches the target within 1 cm at the hold frame).
Moves: `celebrate_point_sky` (both index fingers up over a walk), `celebrate_badge_kiss` (right hand to the chest badge, head bowed), `celebrate_shush` (index finger to the lips), `celebrate_ear` (hand cupped at the ear, toward the crowd), `celebrate_heart` (both hands at the chest), `celebrate_salute`; base body = CMU happy/excited-walk motion; arm chains driven by IK constraints toward bone-relative targets with smooth in/out, baked with visual keying; `celebrate_knee_slide` = run-in + kneel (candidates UAL `Fixing_Kneeling`, CMU 22_03 kneel segment, chosen by measured knee contact) with root deceleration 6 → 0 m/s over 3–4 m and arms from `celebrate_cheer`.

### Task 4: Character plays named celebration clips; paired contact

**Files:** `src/render3d/character.js` (`ctx.celClip` string; `ctx.partner` bone target for hand IK), `src/game.js` `anim3`.
Hand IK: reuse `twoBone` for arms (shoulder–elbow–hand) toward the partner's shoulder/back/hand point at the clip's contact time; weight in/out over 0.2 s; capsule push-apart between celebrating players (0.35 m radius) applied to positions in `game.js`. Test: node test for the arm-reach helper on a bone chain (hand within 3 cm).

### Task 5: Game integration

**Files:** `src/game.js` (goal start: build the plan, `goalT = goalDur = plan.dur`; player loop line ~555: targets and clips from `celebrationAt`; `anim3` passes `celClip`; skip key; pause; replay after), `src/net/*` packet field `cpl` (the plan, sent while `st == 'goal'`).
Steps: hook `__UF.testCelebration()` that scores scripted goals (normal, equaliser, late winner, own goal, shoot-out) via `stepSim` and reports plan, duration, joiners reached, max foot slide, contact errors; acceptance gains a `celebration` row; `nettest.mjs` checks the guest's plan equals the host's.

### Task 6: Proof

Strips and short clips of each sequence type; side-by-side against eFootball celebration references (`captures/refs/`); `DEVELOPMENT_PROGRESS.md` entry; scoreboard; commit; push both branches.
