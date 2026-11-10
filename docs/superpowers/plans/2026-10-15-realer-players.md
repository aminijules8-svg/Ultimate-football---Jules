# Realer Players Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Players that beat eFootball 2026 in side-by-side shots: natural arms and deformation, real celebrations, an athletic body and kit, scan-based fictional faces, and close-up shading and lighting that run on the owner's laptop.

**Architecture:** The Blender build (`tools/blender/build_player_mh.py` + `retarget.py`) produces one shared `player.glb` (rig, LODs, morphs, clips) plus data files; the runtime (`src/render3d/character.js` and new focused modules) builds each player from it. Phase A fixes the retarget and adds twist bones, corrective shapes and springs; later phases add celebration logic, body and kit detail, the ICT head, and shading.

**Tech Stack:** Blender 4.3 (Python, `bpy`, `mathutils`), Python 3.13 + numpy + Pillow, three.js r186, Vite, Playwright (headless captures), Node 24 (`node --test`).

**Spec:** `docs/superpowers/specs/2026-10-15-realer-players-design.md`

## Global Constraints

- Assets: free, licence-clean (ICT-FaceKit MIT, CMU free with credit, Quaternius CC0, Mixamo owner download, MakeHuman CC0); credits in `docs/CREDITS.md`; raw sources stay in git-ignored `tools/assets/_src/`.
- Faces stay fictional; never fitted to photos of real people.
- Budgets: player triangles at the match camera ≤ 90,000 for 22 players (`__UF.gfx.playerTris`); body ≤ 16k triangles at LOD0; all player files ≤ 20 MB; `scripts/acceptance.mjs` stays 29/29 (plus new checks).
- Laptop rule (`~/.claude/CLAUDE.md`): live match 60 fps on Auto on the i3-1215U / Intel UHD; close-ups ≥ 30 fps on High; Low/High toggle; render pauses when the tab is hidden; `prefers-reduced-motion` fallback.
- Phase A pass marks: elbow angle within 5° of the source; hands within 0.05 arm-lengths of the source relative to the hips frame; idle upper arms within 10° of vertical; foot slide ≤ 2 mm per frame.
- Workflow: branch `build`; each phase ends with a `DEVELOPMENT_PROGRESS.md` entry, commit, fast-forward `main`, push both. Blender bakes run one at a time.
- Do not commit `pnpm-lock.yaml` (the repo uses npm).

## Review Focus

1. **Clips from every source family** (Mixamo, Quaternius UAL, CMU BVH, legacy glb): a fix tuned on Mixamo must not break the others. Expect every family to pass the arm marks or be dropped from use. Pinned by Task 3's report covering one clip per family.
2. **Left/right mirrored clips** (`mirror_action` makes left-foot kicks): twist bones and correctives must mirror too, or left kicks show broken wrists. Pinned by Task 5 Step 4 (mirrored clip twist check).
3. **Far players** (LOD1/LOD2, `animRate` 2 skipping frames): correctives and springs must not run there or accumulate across skipped frames. Pinned by Task 7 Step 1 (springs only below `lodDist * 0.7`; reset on LOD change).
4. **Old saves and the creator preview** (`editor3d`, portraits, menu stage) build `Character` without match context: new code must tolerate a missing `ctx.dt`, `ctx.camDist` and `ctx.ball`. Pinned by Task 6 Step 4 (menu stage capture with no page errors).
5. **A rig with the new twist bones loaded by old code paths** (`cloneSkeleton`, `boneKey`, kick IK, foot IK): the new bones must not change existing bone names or parents. Pinned by Task 5 Step 5 (acceptance `footBall`, `move90` and `dribble` unchanged).

---

## File map (Phase A)

| File | Responsibility |
|---|---|
| `tools/blender/armmath.py` (new) | Pure-Python vector maths for arm metrics (no `bpy`), unit-tested with plain `python3` |
| `tools/blender/test_armmath.py` (new) | Tests for `armmath.py` |
| `tools/blender/armcheck.py` (new) | Inside Blender: sample source and retargeted joints per frame, write `captures/armcheck.json` |
| `tools/blender/test_retarget.py` (new) | Headless Blender test: two toy rigs with different rest roll; retarget must keep the elbow's bend plane |
| `tools/blender/retarget.py` | Add full rest-frame alignment; remove CMU arm hacks once metrics pass |
| `tools/blender/build_player_mh.py` | `--armcheck` flag; twist bones and weights; twist baked into clips; corrective shape keys |
| `src/render3d/correctives.js` (new) | Joint-angle → corrective morph weights (pure function + `applyCorrectives(char)`) |
| `src/render3d/springs.js` (new) | Critically damped spring lag on a few bones (pure step function + `SpringSet`) |
| `tests/correctives.test.mjs`, `tests/springs.test.mjs` (new) | `node --test` unit tests |
| `src/render3d/character.js` | Call correctives and springs after the mixer on near players |
| `package.json` | `"test": "node --test tests/"` |

---

### Task 1: Arm metric maths

**Files:**
- Create: `tools/blender/armmath.py`
- Test: `tools/blender/test_armmath.py`

**Interfaces:**
- Produces: `elbow_flex(shoulder, elbow, wrist) -> float` (degrees, 0 = straight); `hang(shoulder, elbow) -> float` (degrees between upper arm and straight down); `body_frame(l_hip, r_hip) -> (right, fwd, up)`; `hand_local(hips_mid, frame, hand, arm_len) -> (x, y, z)`; `palm_local(frame, index_root, pinky_root) -> (x, y, z)` (unit across-palm vector in the hips frame); `summarise(src_rows, tgt_rows) -> dict` with `elbow_err_max/mean`, `hand_err_max/mean`, `palm_err_max` (degrees, rows whose palm is `None` are skipped), `hang_tgt_max`. Points are 3-tuples in a Z-up world.

- [ ] **Step 1: Write the failing test**

```python
# tools/blender/test_armmath.py — run: python3 tools/blender/test_armmath.py
import math
import armmath as M

def close(a, b, tol=1e-6):
    return abs(a - b) <= tol

def test_elbow_straight_and_right_angle():
    assert close(M.elbow_flex((0, 0, 0), (1, 0, 0), (2, 0, 0)), 0.0)
    assert close(M.elbow_flex((0, 0, 0), (1, 0, 0), (1, 1, 0)), 90.0)

def test_hang_down_and_horizontal():
    assert close(M.hang((0, 0, 1), (0, 0, 0)), 0.0)
    assert close(M.hang((0, 0, 1), (1, 0, 1)), 90.0)

def test_body_frame_and_hand_local():
    right, fwd, up = M.body_frame((-0.1, 0, 1), (0.1, 0, 1))
    assert right == (1.0, 0.0, 0.0) and up == (0.0, 0.0, 1.0)
    assert close(fwd[1], -1.0)  # Z-up, right = +X  ->  forward = up x right = -Y
    x, y, z = M.hand_local((0, 0, 1), (right, fwd, up), (0.3, -0.6, 1.0), 0.6)
    assert close(x, 0.5) and close(y, 1.0) and close(z, 0.0)

def test_palm_local_is_unit_and_in_hips_frame():
    fr = M.body_frame((-0.1, 0, 1), (0.1, 0, 1))
    p = M.palm_local(fr, (0, 0, 1), (0, 0, 0.5))  # pinky straight below the index root
    assert close(p[2], -1.0)

def test_summarise_reports_worst_errors():
    src = [{'elbow': {'L': 30, 'R': 40}, 'hand': {'L': (0, 0, 0), 'R': (0, 0, 0)}, 'hang': {'L': 5, 'R': 5}, 'palm': {'L': (1, 0, 0), 'R': None}}]
    tgt = [{'elbow': {'L': 36, 'R': 41}, 'hand': {'L': (0.03, 0.04, 0), 'R': (0, 0, 0)}, 'hang': {'L': 12, 'R': 4}, 'palm': {'L': (0, 1, 0), 'R': (1, 0, 0)}}]
    s = M.summarise(src, tgt)
    assert close(s['elbow_err_max'], 6.0) and close(s['hand_err_max'], 0.05) and close(s['hang_tgt_max'], 12.0)
    assert close(s['palm_err_max'], 90.0)

if __name__ == '__main__':
    fails = 0
    for n, f in sorted(globals().items()):
        if n.startswith('test_'):
            try:
                f(); print('PASS', n)
            except Exception as e:
                fails += 1; print('FAIL', n, repr(e))
    raise SystemExit(1 if fails else 0)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tools/blender && python3 test_armmath.py`
Expected: `ModuleNotFoundError: No module named 'armmath'`

- [ ] **Step 3: Write minimal implementation**

```python
# tools/blender/armmath.py — scale-free arm metrics shared by armcheck.py (Blender) and its tests (plain python3).
# Points are (x, y, z) tuples in a Z-up world.
import math

def sub(a, b): return (a[0] - b[0], a[1] - b[1], a[2] - b[2])
def dot(a, b): return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
def cross(a, b): return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
def norm(a):
    l = math.sqrt(dot(a, a)) or 1.0
    return (a[0] / l, a[1] / l, a[2] / l)
def angle(a, b):
    return math.degrees(math.acos(max(-1.0, min(1.0, dot(norm(a), norm(b))))))

def elbow_flex(shoulder, elbow, wrist):
    """0 = straight arm; 90 = forearm at right angles to the upper arm."""
    return angle(sub(elbow, shoulder), sub(wrist, elbow))

def hang(shoulder, elbow):
    """Angle between the upper arm and straight down."""
    return angle(sub(elbow, shoulder), (0.0, 0.0, -1.0))

def body_frame(l_hip, r_hip):
    """Right, forward, up unit vectors from the hip joints (same construction on any rig)."""
    r = sub(r_hip, l_hip); right = norm((r[0], r[1], 0.0)); up = (0.0, 0.0, 1.0)
    return right, cross(up, right), up

def hand_local(hips_mid, frame, hand, arm_len):
    """Hand position in the hips frame, in arm lengths."""
    d = sub(hand, hips_mid); right, fwd, up = frame
    return (dot(d, right) / arm_len, dot(d, fwd) / arm_len, dot(d, up) / arm_len)

def palm_local(frame, index_root, pinky_root):
    """Unit across-palm vector (index root -> pinky root) in the hips frame: shows forearm and wrist twist."""
    d = norm(sub(pinky_root, index_root)); right, fwd, up = frame
    return (dot(d, right), dot(d, fwd), dot(d, up))

def summarise(src_rows, tgt_rows):
    """Worst and mean errors between per-frame source and target rows."""
    e, h, g, pa = [], [], [], []
    for s, t in zip(src_rows, tgt_rows):
        for side in ('L', 'R'):
            e.append(abs(s['elbow'][side] - t['elbow'][side]))
            h.append(math.dist(s['hand'][side], t['hand'][side]))
            g.append(t['hang'][side])
            ps, pt = s.get('palm', {}).get(side), t.get('palm', {}).get(side)
            if ps is not None and pt is not None:
                pa.append(angle(ps, pt))
    n = max(1, len(e))
    return {'frames': len(tgt_rows), 'elbow_err_max': max(e or [0]), 'elbow_err_mean': sum(e) / n,
            'hand_err_max': max(h or [0]), 'hand_err_mean': sum(h) / n, 'hang_tgt_max': max(g or [0]),
            'palm_err_max': max(pa) if pa else None}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd tools/blender && python3 test_armmath.py`
Expected: five `PASS` lines, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add tools/blender/armmath.py tools/blender/test_armmath.py
git commit -m "Arm metric maths (elbow flex, hang, hand in hips frame) with tests"
```

---

### Task 2: Measure arms in the build (`--armcheck`)

**Files:**
- Create: `tools/blender/armcheck.py`
- Modify: `tools/blender/build_player_mh.py` (the `clip()` function, about lines 831–845, and the argument parsing near line 23)

**Interfaces:**
- Consumes: `armmath.*` (Task 1); `R.Retargeter` attributes `map` ({target: source}), `src`, `tgt`; `CLIPS` entries `(name, action)`; the bake writes target keys at frames `1..len(frames)`.
- Produces: `armcheck.report(name, rt, frames, action) -> dict` and the file `captures/armcheck.json` (`{clip: summary}`); build flag `--armcheck jog,run,idle` (or `--armcheck all`; the build's `arg()` reads the word after the flag).

- [ ] **Step 1: Write `armcheck.py`**

```python
# tools/blender/armcheck.py — compare a retargeted clip with its source, frame by frame (runs inside Blender).
import json, os
import bpy
import armmath as M

T = 'mixamorig:'
JOINTS = {'sh': 'Arm', 'el': 'ForeArm', 'wr': 'Hand'}

def _pos(obj, bone):
    return tuple(obj.matrix_world @ obj.pose.bones[bone].head)

def _row(obj, name_of):
    """name_of(target_bone_name) -> bone name on `obj` or None (identity for the target, rt.map.get for the source)."""
    lh, rh = _pos(obj, name_of(T + 'LeftUpLeg')), _pos(obj, name_of(T + 'RightUpLeg'))
    mid = tuple((a + b) / 2 for a, b in zip(lh, rh)); fr = M.body_frame(lh, rh)
    row = {'elbow': {}, 'hand': {}, 'hang': {}}
    for side, s in (('Left', 'L'), ('Right', 'R')):
        p = {k: _pos(obj, name_of(T + side + v)) for k, v in JOINTS.items()}
        arm_len = M.math.dist(p['sh'], p['el']) + M.math.dist(p['el'], p['wr'])
        row['elbow'][s] = M.elbow_flex(p['sh'], p['el'], p['wr'])
        row['hang'][s] = M.hang(p['sh'], p['el'])
        row['hand'][s] = M.hand_local(mid, fr, p['wr'], arm_len)
        ix, pk = name_of(T + side + 'HandIndex1'), name_of(T + side + 'HandPinky1')
        row.setdefault('palm', {})[s] = M.palm_local(fr, _pos(obj, ix), _pos(obj, pk)) if ix and pk and ix in obj.pose.bones and pk in obj.pose.bones else None
    return row

def report(name, rt, frames, action):
    sc = bpy.context.scene
    src_rows = []
    for f in frames:
        sc.frame_set(int(f), subframe=f - int(f))
        if rt.pre:
            rt.pre(f)
        src_rows.append(_row(rt.src, lambda t: rt.map.get(t)))
    keep = rt.tgt.animation_data.action
    rt.tgt.animation_data.action = action
    tgt_rows = []
    for i in range(len(frames)):
        sc.frame_set(i + 1)
        tgt_rows.append(_row(rt.tgt, lambda t: t))
    rt.tgt.animation_data.action = keep
    return M.summarise(src_rows, tgt_rows)

def save(results, root):
    out = os.path.join(root, 'captures', 'armcheck.json'); os.makedirs(os.path.dirname(out), exist_ok=True)
    old = json.load(open(out)) if os.path.exists(out) else {}
    old.update(results); json.dump(old, open(out, 'w'), indent=1)
    return out
```

- [ ] **Step 2: Wire the flag into the build**

In `build_player_mh.py`, after `argv = …` (line 23) add:

```python
ARMCHECK = set((arg('--armcheck') or '').split(',')) - {''}  # e.g. --armcheck jog,run,idle  or  --armcheck all
ARM_RESULTS = {}
```

At the end of `clip()` (after `CLIPS.append((name, a))`, before the log line) add:

```python
    if name in ARMCHECK or 'all' in ARMCHECK:
        import armcheck
        ARM_RESULTS[name] = dict(armcheck.report(name, rt, frames, a), source=key, arm_fix=rt.arm_fix)
        log('armcheck', name, ARM_RESULTS[name])
```

Just before section `# 7. cleanup + export` add:

```python
if ARM_RESULTS:
    import armcheck
    log('armcheck written', armcheck.save(ARM_RESULTS, os.path.abspath(os.path.join(HERE, '..', '..'))))
```

- [ ] **Step 3: Run a measurement build**

Run: `blender -b --python tools/blender/build_player_mh.py -- --out /tmp/claude-1000/armcheck-out --armcheck jog,jog_back,idle,walk,run,sprint,shot,pass_short 2>&1 | grep -E "armcheck|Error"`
Expected: one `armcheck <clip> {...}` line per clip and `armcheck written …/captures/armcheck.json`. Writing to a scratch `--out` keeps `public/models` untouched.

- [ ] **Step 4: Commit**

```bash
git add tools/blender/armcheck.py tools/blender/build_player_mh.py
git commit -m "Build: --armcheck compares retargeted arms with the source per frame"
```

---

### Task 3: Diagnose and record

**Files:**
- Modify: `DEVELOPMENT_PROGRESS.md` (new section "Realer players, Phase A")

- [ ] **Step 1: Read the report and classify each clip**

Run: `python3 -c "import json; d=json.load(open('captures/armcheck.json')); [print(k, {x: round(v, 3) if isinstance(v, float) else v for x, v in s.items()}) for k, s in sorted(d.items())]"`

Classify with these rules (pass marks from Global Constraints):
- **Retarget error**: `elbow_err_max > 5` or `hand_err_max > 0.05` with `arm_fix == False` → find the bone carrying the error (print the worst frame's rows) before changing code.
- **Twist error**: `palm_err_max > 20` (palms or wrists rolled relative to the source) → Task 4 fixes it.
- **Hack error**: the same with `arm_fix == True`, and a rerun with arm fixes off (Step 2) brings it under the marks → Task 5 removes the hacks.
- **Source style**: errors under the marks but the target still looks wrong (`hang_tgt_max > 10` on `idle`, or elbows held near 90° in `run`/`sprint` across all frames) → the source clip itself looks like that; Task 5 Step 3 swaps the source.

- [ ] **Step 2: Rerun the Quaternius/CMU clips with arm fixes off**

Temporarily pass `arm_fix=False` for every clip (edit `clip()`: `rt = R.Retargeter(..., arm_fix=False)`), rerun Task 2 Step 3 with `--armcheck idle,walk,run,sprint`, record the numbers, then revert the edit (`git checkout tools/blender/build_player_mh.py`).

- [ ] **Step 3: Write the findings**

Append to `DEVELOPMENT_PROGRESS.md` a table: clip, source family, `arm_fix`, `elbow_err_max`, `hand_err_max`, `hang_tgt_max`, class (retarget / hack / source style), and the decision for Tasks 4–5.

- [ ] **Step 4: Commit**

```bash
git add DEVELOPMENT_PROGRESS.md
git commit -m "Realer players A: arm diagnosis per clip and source family"
```

---

### Task 4: Full rest-frame alignment in the retarget

**Files:**
- Modify: `tools/blender/retarget.py` (`Retargeter.__init__`, the `self.align` loop)
- Create: `tools/blender/test_retarget.py`

**Interfaces:**
- Consumes: Blender armatures with finger bones `…HandIndex1` and `…HandPinky1` (Mixamo, MPFB, UAL `DEF-f_index.01.*`/`DEF-f_pinky.01.*`); for sources without finger bones (CMU BVH) the code falls back to direction-only alignment.
- Produces: `Retargeter(..., align='frame')` (new default; `align='dir'` keeps the old behaviour); `self.align[t]` is a 3×3 rotation that takes the target's canonical rest frame onto the source's.

- [ ] **Step 1: Write the failing test (headless Blender)**

```python
# tools/blender/test_retarget.py — run: blender -b --python tools/blender/test_retarget.py
# Two toy rigs whose rest poses differ in arm direction (T vs A) AND in palm roll: the source's palm faces down,
# the target's faces forward. With the source standing in its rest pose, the retargeted target must show the
# source's palm orientation (across-palm vector along the arm's sideways axis), not keep its own roll.
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
import bpy
from mathutils import Vector
import retarget as R

T = 'mixamorig:'

def make_rig(name, arm_dir, palm_across):
    bpy.ops.object.armature_add(enter_editmode=True)
    ob = bpy.context.object; ob.name = name; eb = ob.data.edit_bones
    root = eb[0]; root.name = T + 'Hips'; root.head = (0, 0, 1); root.tail = (0, 0, 1.1)
    for side, sx in (('Left', 1), ('Right', -1)):
        lh = eb.new(T + side + 'UpLeg'); lh.head = (0.1 * sx, 0, 1); lh.tail = (0.1 * sx, 0, 0.5); lh.parent = root
        sh = Vector((0.2 * sx, 0, 1.5)); d = Vector((arm_dir[0] * sx, arm_dir[1], arm_dir[2])).normalized()
        a = eb.new(T + side + 'Arm'); a.head = sh; a.tail = sh + d * 0.3; a.parent = root
        f = eb.new(T + side + 'ForeArm'); f.head = a.tail; f.tail = a.tail + d * 0.3; f.parent = a; f.use_connect = True
        h = eb.new(T + side + 'Hand'); h.head = f.tail; h.tail = f.tail + d * 0.1; h.parent = f; h.use_connect = True
        across = Vector(palm_across) * 0.03
        for fn, sgn in (('HandIndex1', -1), ('HandPinky1', 1)):
            b = eb.new(T + side + fn); b.head = h.tail + across * sgn; b.tail = b.head + d * 0.05; b.parent = h
    bpy.ops.object.mode_set(mode='POSE')
    return ob

def palm(ob, side):
    w = ob.matrix_world
    p = (w @ ob.pose.bones[T + side + 'HandPinky1'].head) - (w @ ob.pose.bones[T + side + 'HandIndex1'].head)
    return p.normalized()

src = make_rig('src', (1, 0, 0), (0, 0, 1))      # T-pose, across-palm vector vertical (palm facing forward/back)
tgt = make_rig('tgt', (1, 0, -1), (0, 1, 0))     # A-pose, across-palm vector front-back (rolled 90° about the arm)
bpy.context.view_layer.update()

rt = R.Retargeter(src, tgt, R.map_identity(tgt), T + 'Hips', T + 'Hips', align='frame', arm_fix=False)
rt.src_stand = 1.0
basis, _ = rt.sample(1)
for b, (q, loc) in basis.items():
    if 'HandIndex' in b or 'HandPinky' in b:
        continue  # fingers get the relaxed curl; the test reads their roots, which follow the hand
    p = tgt.pose.bones[b]; p.rotation_mode = 'QUATERNION'; p.rotation_quaternion = q
bpy.context.view_layer.update()
err = math.degrees(palm(tgt, 'Left').angle(palm(src, 'Left')))
print('palm error', round(err, 2), 'PASS' if err < 5 else 'FAIL')
sys.exit(0 if err < 5 else 1)
```

- [ ] **Step 2: Run it to see it fail**

Run: `blender -b --python tools/blender/test_retarget.py 2>&1 | tail -3`
Expected: `TypeError: __init__() got an unexpected keyword argument 'align'`.

- [ ] **Step 3: Implement canonical frames**

In `retarget.py` add above `class Retargeter`:

```python
ARM_CHAIN = ('Arm', 'ForeArm', 'Hand')

def _palm(arm, w, side, names):
    """Across-palm vector (index root -> pinky root) in world space, or None when the rig has no finger roots."""
    i, p = names.get(T + side + 'HandIndex1'), names.get(T + side + 'HandPinky1')
    if not i or not p or i not in arm.data.bones or p not in arm.data.bones:
        return None
    return (w @ arm.data.bones[p].head_local) - (w @ arm.data.bones[i].head_local)

def _frame(direction, secondary):
    """Orthonormal 3x3 with x = bone direction, y = secondary made perpendicular to it."""
    x = direction.normalized(); y = (secondary - x * secondary.dot(x)).normalized(); z = x.cross(y)
    return Matrix((x, y, z)).transposed()
```

Change the constructor signature to `def __init__(self, src, tgt, bone_map, root_src, root_tgt, inplace=True, pre=None, arm_fix=True, align='frame'):` and replace the `self.align` loop with:

```python
        self.align = {}
        src_names = {t: s for t, s in self.map.items()}
        tgt_names = {t: t for t in self.map}
        for t, s in self.map.items():
            bs, bt = src.data.bones[s], tgt.data.bones[t]
            ds = (_rot(sw) @ (bs.tail_local - bs.head_local)).normalized()
            dt = (_rot(tw) @ (bt.tail_local - bt.head_local)).normalized()
            A = dt.rotation_difference(ds).to_matrix()
            side = 'Left' if (T + 'Left') in t else 'Right' if (T + 'Right') in t else None
            if align == 'frame' and side and t[len(T) + len(side):] in ARM_CHAIN:
                ps, pt = _palm(src, sw, side, src_names), _palm(tgt, tw, side, tgt_names)
                if ps is not None and pt is not None:
                    A = _frame(ds, ps) @ _frame(dt, pt).inverted()
            self.align[t] = A
```

Note `src_names` maps target bone names to source bone names; `_palm` looks up `names[T + side + 'HandIndex1']`, so CMU (no finger bones in `MAP_CMU`) falls back to `A` from directions.

- [ ] **Step 4: Run the test to see it pass**

Run: `blender -b --python tools/blender/test_retarget.py 2>&1 | tail -3`
Expected: `palm error <5 PASS`, exit code 0. (With `align='dir'` the same test reports about 90° and FAIL: that is the twist the old alignment leaves.)

- [ ] **Step 5: Re-measure the real clips**

Run Task 2 Step 3 again. Expected: Mixamo clips (`jog`, `jog_back`, `shot`, `pass_short`) at `elbow_err_max ≤ 5`, `hand_err_max ≤ 0.05` and `palm_err_max ≤ 20`. If any still fail, print per-frame rows for that clip (add `print` of the worst frame in `armcheck.report`) and compare the source and target hand vectors to find which bone carries the error before changing more code.

- [ ] **Step 6: Commit**

```bash
git add tools/blender/retarget.py tools/blender/test_retarget.py
git commit -m "Retarget: align arm bones by full rest frame (direction + palm roll), with a headless Blender test"
```

---

### Task 5: Drop the old arm hacks; twist bones

**Files:**
- Modify: `tools/blender/retarget.py` (delete `ARM_FWD`, `ELBOW_SOFT`, `ARM_GAIN` and the `arm_fix` branch once Task 3/4 numbers allow it)
- Modify: `tools/blender/build_player_mh.py` (twist bones after the rig is built and before skinning export; twist keys after each bake)

**Interfaces:**
- Produces: bones `mixamorig:LeftArmTwist1`, `LeftArmTwist2`, `LeftForeArmTwist1`, `LeftForeArmTwist2` (and Right) parented to `LeftArm` / `LeftForeArm`; helper `add_twist_bones(arm, body)` and `bake_twist(arm, action)`; runtime bone keys `LeftArmTwist1` etc. via `boneKey`.

- [ ] **Step 1: Remove the hacks**

In `retarget.py` delete the constants `ARM_FWD`, `ELBOW_SOFT`, `ARM_GAIN`, the whole block in `sample()` after `if not self.arm_fix: return self._pose(want, sw)` up to `return self._pose(want, sw)`, and in `bake()` the prepass and arm-gain lines (`rt.bend_axis = …` through the `for side, qs in acc.items()` loop). Keep the `arm_fix` parameter (ignored) so callers don't break, and set its default to `False`.

- [ ] **Step 2: Swap sources that are "source style"**

For each clip Task 3 classed as source style, replace its source in `build_player_mh.py` with the first candidate that passes the marks when measured (Task 2 Step 3):
- `idle`: Mixamo `goalkeeper idle` with `yaw` from `MIXAMO['gk_idle']`, then UAL `Idle_Talking_Loop`, then CMU `86_01` (add to `CMU=` in `tools/assets/fetch.sh` and run it).
- `run`/`sprint`: CMU `16_35` window at 1.2× speed for `run`, CMU `16_08` sprint section for `sprint`, then UAL `Jog_Fwd_Loop`/`Sprint_Loop` unchanged.
Record the choice in `DEVELOPMENT_PROGRESS.md`.

- [ ] **Step 3: Add twist bones**

In `build_player_mh.py`, after the body is skinned to `arm` and before decimation (section 5), add:

```python
def add_twist_bones(arm, body):
    """Two twist bones per upper arm and forearm. Each vertex weighted to a segment hands part of that weight to the
    twist bone nearest along the segment (triangular falloff), so twist spreads along the limb instead of at one joint."""
    bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT'); eb = arm.data.edit_bones
    made = []  # (twist name, segment name, peak t)
    for side in ('Left', 'Right'):
        for seg in ('Arm', 'ForeArm'):
            par = eb[T + side + seg]
            for k, (t0, t1) in enumerate(((0.2, 0.5), (0.55, 0.85)), 1):
                b = eb.new(T + side + seg + 'Twist' + str(k)); b.head = par.head.lerp(par.tail, t0); b.tail = par.head.lerp(par.tail, t1)
                b.roll = par.roll; b.parent = par; b.use_deform = True; made.append((b.name, par.name, (t0 + t1) / 2))
    bpy.ops.object.mode_set(mode='OBJECT')
    tri = lambda t, m: max(0.0, 1.0 - abs(t - m) / 0.33)
    for name, seg, m in made:
        body.vertex_groups.new(name=name)
    for name, seg, m in made:
        g, tg = body.vertex_groups[seg], body.vertex_groups[name]
        bone = arm.data.bones[seg]; a = arm.matrix_world @ bone.head_local; b = arm.matrix_world @ bone.tail_local; ab = b - a
        for v in body.data.vertices:
            try:
                w = g.weight(v.index)
            except RuntimeError:
                continue
            t = max(0.0, min(1.0, (body.matrix_world @ v.co - a).dot(ab) / max(1e-9, ab.length_squared)))
            share = 0.5 * tri(t, m)
            if share > 0:
                tg.add([v.index], w * share, 'REPLACE'); g.add([v.index], w * (1 - share), 'REPLACE')
    return [n for n, *_ in made]

TWIST = add_twist_bones(arm, body)
```

and a bake helper used after every `R.bake(...)` (in `clip()` and `turn_clip()`):

```python
def bake_twist(arm, act):
    """Forearm twist bones take 1/3 and 2/3 of the hand's roll (no pinched wrists); upper-arm twist bones counter-rotate
    2/3 and 1/3 of the upper arm's own roll (no pinched shoulders). Roll = the swing-twist split about the bone's Y axis."""
    n = int(act.frame_range[1]); arm.animation_data.action = act
    def roll(q):
        axis_y = q.to_matrix() @ Vector((0, 1, 0))
        tw = Vector((0, 1, 0)).rotation_difference(axis_y).inverted() @ q
        return 2 * math.atan2(tw.y, tw.w)
    for side in ('Left', 'Right'):
        for seg, src_bone, fracs in (('ForeArm', 'Hand', (1 / 3, 2 / 3)), ('Arm', 'Arm', (-2 / 3, -1 / 3))):
            sb = arm.pose.bones[T + side + src_bone]; rolls = []
            for f in range(1, n + 1):
                bpy.context.scene.frame_set(f); rolls.append(roll(sb.rotation_quaternion))
            for k, frac in zip((1, 2), fracs):
                pb = arm.pose.bones[T + side + seg + 'Twist' + str(k)]; pb.rotation_mode = 'QUATERNION'
                path = f'pose.bones["{pb.name}"].rotation_quaternion'
                for c in range(4):
                    fc = act.fcurves.new(path, index=c, action_group=pb.name); fc.keyframe_points.add(n); flat = []
                    for i, r in enumerate(rolls):
                        flat += [i + 1, Quaternion((0, 1, 0), r * frac)[c]]
                    fc.keyframe_points.foreach_set('co', flat); fc.update()
```

Call `bake_twist(arm, a)` right after `a = R.bake(rt, name, frames)` in both `clip()` and `turn_clip()`, and at the end of `mirror_action()` / `reverse_action()` for the actions they create.

Check the shoulder and wrist in motion: `node scripts/capture.mjs --viewer="clip=throw_in&cam=front&ly=1.4&dist=1.4&t=0.5" --name=twist-shoulder` and `--viewer="clip=gk_throw&cam=side&ly=1.2&dist=1.2&t=0.45" --name=twist-wrist`; neither may show a pinched band.

- [ ] **Step 4: Check mirrored clips**

`mirror_action` swaps Left/Right channels by name, so the new `…Twist…` channels mirror with it. Verify in the viewer: `node scripts/clipsheet.mjs --clips=shot,shot_L --cam=front --strip=6 --tag=twist` and compare both wrists at contact; the left kick's wrist must not twist more than the right kick's mirror image.

- [ ] **Step 5: Rebuild and run acceptance**

Run: `npm run build:player 2>&1 | tail -5 && node scripts/acceptance.mjs 2>&1 | tail -4`
Expected: build ends with the meshopt step; acceptance `29/29`, `footBall`, `move90` and `dribble` lines unchanged in shape; `gfx.playerTris ≤ 90000`.

- [ ] **Step 6: Commit**

```bash
git add tools/blender/retarget.py tools/blender/build_player_mh.py public/models DEVELOPMENT_PROGRESS.md
git commit -m "Arms: old CMU arm hacks removed, sources swapped where the source looked wrong, twist bones baked into every clip"
```

---

### Task 6: Corrective shapes

**Files:**
- Modify: `tools/blender/build_player_mh.py` (section 5, after `add_morphs(...)`)
- Create: `src/render3d/correctives.js`
- Test: `tests/correctives.test.mjs`
- Modify: `src/render3d/character.js` (`update()`, after `this.mixer.update(dtA)` and before foot IK)
- Modify: `package.json` (`"test": "node --test tests/"`)

**Interfaces:**
- Produces (build): shape keys named `corr_<joint>_<side>_<deg>` on `Body` only (LOD0), joints `elbow` (90, 140), `knee` (90, 140), `shoulder` (raise 90), `hip` (flex 90): 12 keys.
- Produces (runtime): `CORRECTIVES` table and `correctiveWeights(angles) -> {key: weight}` (pure), `jointAngles(bones) -> {elbow_L, …}` (degrees), `applyCorrectives(meshes, weights)`.

- [ ] **Step 1: Write the failing test**

```js
// tests/correctives.test.mjs — run: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { correctiveWeights } from '../src/render3d/correctives.js';

test('straight joints switch every corrective off', () => {
  const w = correctiveWeights({ elbow_L: 0, elbow_R: 0, knee_L: 0, knee_R: 0, shoulder_L: 0, shoulder_R: 0, hip_L: 0, hip_R: 0 });
  assert.ok(Object.values(w).every(v => v === 0));
});
test('a 90 degree elbow is the 90 shape at full weight; 115 blends 90 and 140', () => {
  assert.equal(correctiveWeights({ elbow_L: 90 }).corr_elbow_L_90, 1);
  const w = correctiveWeights({ elbow_L: 115 });
  assert.ok(Math.abs(w.corr_elbow_L_90 - 0.5) < 1e-9 && Math.abs(w.corr_elbow_L_140 - 0.5) < 1e-9);
});
test('weights stay within 0..1 past the last key', () => {
  const w = correctiveWeights({ knee_R: 170 });
  assert.equal(w.corr_knee_R_140, 1); assert.equal(w.corr_knee_R_90, 0);
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `node --test tests/`
Expected: `ERR_MODULE_NOT_FOUND … correctives.js`.

- [ ] **Step 3: Write `correctives.js`**

```js
// Pose-space corrective shapes: joint angles -> weights for the corr_* morph targets baked by the Blender build.
// Linear-blend skinning loses volume at bent elbows, knees, raised shoulders and flexed hips; these shapes put it back.
import * as THREE from 'three';

export const CORRECTIVES = { elbow: [90, 140], knee: [90, 140], shoulder: [90], hip: [90] };
const SIDES = ['L', 'R'];

/** angles: { elbow_L: deg, … } -> { corr_elbow_L_90: w, … }; piecewise-linear between the keyed angles, clamped. */
export function correctiveWeights(angles) {
  const out = {};
  for (const [joint, keys] of Object.entries(CORRECTIVES)) for (const s of SIDES) {
    const a = Math.max(0, angles[`${joint}_${s}`] || 0);
    keys.forEach(k => { out[`corr_${joint}_${s}_${k}`] = 0; });
    if (a <= 0) continue;
    if (a <= keys[0]) { out[`corr_${joint}_${s}_${keys[0]}`] = a / keys[0]; continue; }
    let done = false;
    for (let i = 0; i < keys.length - 1; i++) if (a <= keys[i + 1]) {
      const t = (a - keys[i]) / (keys[i + 1] - keys[i]);
      out[`corr_${joint}_${s}_${keys[i]}`] = 1 - t; out[`corr_${joint}_${s}_${keys[i + 1]}`] = t; done = true; break;
    }
    if (!done) out[`corr_${joint}_${s}_${keys[keys.length - 1]}`] = 1;
  }
  return out;
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3();
const angleAt = (p, j, c) => { p.getWorldPosition(_a); j.getWorldPosition(_b); c.getWorldPosition(_c); return _d.subVectors(_b, _a).angleTo(_c.sub(_b)) * 180 / Math.PI; };

/** bones: Character.bones (keys without the mixamorig: prefix). Returns degrees (0 = straight / at rest). */
export function jointAngles(B) {
  const out = {};
  for (const [S, s] of [['Left', 'L'], ['Right', 'R']]) {
    if (B[S + 'ForeArm'] && B[S + 'Hand']) out['elbow_' + s] = angleAt(B[S + 'Arm'], B[S + 'ForeArm'], B[S + 'Hand']);
    if (B[S + 'Leg'] && B[S + 'Foot']) out['knee_' + s] = angleAt(B[S + 'UpLeg'], B[S + 'Leg'], B[S + 'Foot']);
    if (B[S + 'Arm'] && B[S + 'ForeArm']) { B[S + 'Arm'].getWorldPosition(_a); B[S + 'ForeArm'].getWorldPosition(_b); out['shoulder_' + s] = _b.sub(_a).angleTo(_c.set(0, -1, 0)) * 180 / Math.PI; }
    if (B[S + 'UpLeg'] && B[S + 'Leg'] && B.Spine) out['hip_' + s] = angleAt(B.Spine, B[S + 'UpLeg'], B[S + 'Leg']);
  }
  return out;
}

/** Writes the weights into every LOD0 body mesh that has the corr_* targets. */
export function applyCorrectives(meshes, weights) {
  for (const m of meshes) {
    const dict = m.morphTargetDictionary; if (!dict) continue;
    for (const k in weights) { const i = dict[k]; if (i != null) m.morphTargetInfluences[i] = weights[k]; }
  }
}
```

`shoulder_*` is the angle between the upper arm and straight down (three.js is Y-up): 0 when hanging, 90 when horizontal, up to 180 overhead; the 90 key holds the raised-shoulder shape and stays at full weight above 90.

- [ ] **Step 4: Run the tests to see them pass**

Run: `node --test tests/`
Expected: 3 tests pass.

- [ ] **Step 5: Bake the shapes in the build**

In `build_player_mh.py` after `add_morphs(body); …`:

```python
CORR = [('elbow', 'ForeArm', 'X', (90, 140)), ('knee', 'Leg', 'X', (90, 140)), ('shoulder', 'Arm', 'Z', (90,)), ('hip', 'UpLeg', 'X', (-90,))]
def add_correctives(body, arm):
    """Pose one joint, let Corrective Smooth restore volume, store (smoothed - plain skinning) in rest space as corr_* keys."""
    if not body.data.shape_keys:
        body.shape_key_add(name='Basis')
    for joint, bone, axis, degs in CORR:
        for side, sgn in (('L', 1), ('R', -1)):
            pb = arm.pose.bones[T + ('Left' if side == 'L' else 'Right') + bone]; pb.rotation_mode = 'XYZ'
            for deg in degs:
                pb.rotation_euler = (0, 0, 0); setattr(pb.rotation_euler, axis.lower(), math.radians(deg * (sgn if axis == 'Z' else 1)))
                bpy.context.view_layer.update()
                plain = [v.co.copy() for v in body.evaluated_get(bpy.context.evaluated_depsgraph_get()).data.vertices]
                cs = body.modifiers.new('cs', 'CORRECTIVE_SMOOTH'); cs.iterations = 8; cs.smooth_type = 'LENGTH_WEIGHTED'; cs.rest_source = 'ORCO'  # appended after the Armature modifier
                bpy.context.view_layer.update()
                smooth = [v.co.copy() for v in body.evaluated_get(bpy.context.evaluated_depsgraph_get()).data.vertices]
                body.modifiers.remove(cs)
                key = body.shape_key_add(name=f'corr_{joint}_{side}_{abs(deg)}', from_mix=False)
                for i, v in enumerate(key.data):  # pose-space delta brought back to rest space through the inverse skinning matrix of the dominant bone
                    d = smooth[i] - plain[i]
                    if d.length > 1e-5:
                        v.co = body.data.vertices[i].co + (pb.matrix.to_3x3().inverted() @ d)
                pb.rotation_euler = (0, 0, 0)
    bpy.context.view_layer.update()

add_correctives(body, arm)
```

Log the largest delta per key (`log(key.name, max(d.length …))`); expect 3–15 mm at elbows and knees. A shoulder key whose posed arm does not point sideways-up in a debug render (`--preview DIR`) means the rotation axis is wrong for this rig: try the bone's local X instead of Z.

- [ ] **Step 6: Drive them at runtime**

In `character.js` import `{ jointAngles, correctiveWeights, applyCorrectives }` from `./correctives.js`; in `update()` right after `this.mixer.update(dtA);` add:

```js
    if (this.lod === 0 && (ctx.camDist == null || ctx.camDist < (ctx.lodDist || 60) * 0.7)) {
      this.model.updateMatrixWorld(true);
      applyCorrectives(this.lodGroups.Body, correctiveWeights(jointAngles(this.bones)));
    }
```

- [ ] **Step 7: Verify**

Run: `npm run build:player 2>&1 | grep -E "corr_|tris" ; node scripts/capture.mjs --viewer="clip=shot&cam=front&ly=1.2&dist=1.6&t=0.4" --name=corr-elbow ; node scripts/capture.mjs --menu --name=corr-menu ; node scripts/acceptance.mjs | tail -3`
Expected: 12 `corr_` keys logged with non-zero max deltas; elbow close-up shows no pinch; menu stage capture has no page errors (Review Focus 4); acceptance 29/29.

- [ ] **Step 8: Commit**

```bash
git add tools/blender/build_player_mh.py src/render3d/correctives.js tests/correctives.test.mjs src/render3d/character.js package.json public/models
git commit -m "Corrective shapes for elbows, knees, shoulders and hips, driven by joint angles on near players"
```

---

### Task 7: Springs and relaxed hands

**Files:**
- Create: `src/render3d/springs.js`
- Test: `tests/springs.test.mjs`
- Modify: `src/render3d/character.js` (`update()` after correctives; `setLOD()`)

**Interfaces:**
- Produces: `springStep(state, target, dt, freq = 6, damp = 1) -> state` (pure, numbers); `class SpringSet { constructor(bones, names, amount); apply(dt); reset() }` — lags each listed bone's rotation behind the animated rotation by a critically damped spring, by `amount` (0..1).

- [ ] **Step 1: Write the failing test**

```js
// tests/springs.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { springStep } from '../src/render3d/springs.js';

test('a critically damped spring reaches the target without overshoot', () => {
  let s = { x: 0, v: 0 }, max = 0;
  for (let i = 0; i < 120; i++) { s = springStep(s, 1, 1 / 60); max = Math.max(max, s.x); }
  assert.ok(Math.abs(s.x - 1) < 0.01); assert.ok(max <= 1.0001);
});
test('a zero dt changes nothing', () => {
  assert.deepEqual(springStep({ x: 0.3, v: 2 }, 1, 0), { x: 0.3, v: 2 });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `node --test tests/`
Expected: `ERR_MODULE_NOT_FOUND … springs.js`.

- [ ] **Step 3: Write `springs.js`**

```js
// Small follow-through: selected bones trail their animated rotation through a critically damped spring.
import * as THREE from 'three';

/** One axis of a critically damped spring (semi-implicit Euler). freq in Hz; damp 1 = critical. */
export function springStep(s, target, dt, freq = 6, damp = 1) {
  if (dt <= 0) return { x: s.x, v: s.v };
  const w = 2 * Math.PI * freq, k = w * w, c = 2 * damp * w;
  const v = s.v + (k * (target - s.x) - c * s.v) * dt;
  return { x: s.x + v * dt, v };
}

const _q = new THREE.Quaternion();
export class SpringSet {
  /** bones: Character.bones; names: bone keys; amount: how far the lagged pose is blended in (0..1). */
  constructor(bones, names, amount = 0.35, freq = 5) {
    this.items = names.filter(n => bones[n]).map(n => ({ b: bones[n], q: null, v: new THREE.Vector4() }));
    this.amount = amount; this.freq = freq;
  }
  reset() { for (const it of this.items) it.q = null; }
  apply(dt) {
    for (const it of this.items) {
      const target = it.b.quaternion;
      if (!it.q || dt <= 0 || dt > 0.1) { it.q = target.clone(); it.v.set(0, 0, 0, 0); continue; }
      if (it.q.dot(target) < 0) { it.q.set(-it.q.x, -it.q.y, -it.q.z, -it.q.w); }
      for (const [k, i] of [['x', 0], ['y', 1], ['z', 2], ['w', 3]]) {
        const s = springStep({ x: it.q[k], v: it.v.getComponent(i) }, target[k], dt, this.freq);
        it.q[k] = s.x; it.v.setComponent(i, s.v);
      }
      it.q.normalize();
      _q.copy(target).slerp(it.q, this.amount); it.b.quaternion.copy(_q);
    }
  }
}
```

- [ ] **Step 4: Run tests to see them pass**

Run: `node --test tests/`
Expected: all tests pass (5 so far).

- [ ] **Step 5: Use it in `Character`**

In the constructor after `this.mixer = …` add `this.springs = new SpringSet(this.bones, ['Head', 'LeftArm', 'RightArm', 'LeftForeArm', 'RightForeArm'], 0.3, 5);`. In `update()` after the corrective block add:

```js
    if (this.lod <= 1 && (ctx.camDist == null || ctx.camDist < (ctx.lodDist || 60) * 0.7)) this.springs.apply(dtA); else this.springs.reset();
```

In `setLOD(level)` after `this.lod = level;` add `if (this.springs) this.springs.reset();` (Review Focus 3).

Relaxed hands: the build already keys a relaxed curl on every finger (`relaxed_finger` in `retarget.py`); add a per-player variation in the constructor: for each finger bone key matching `/Hand(Index|Middle|Ring|Pinky)[12]$/`, store `this.fingerCurl = ((seed * 13) % 9 - 4) * 0.02` and after the mixer multiply each such bone's quaternion by `_q.setFromAxisAngle(_xAxis, this.fingerCurl)` on LOD0 only.

Arm balance on cuts: after the springs line add

```js
    if (this.lod === 0 && Math.abs(this.lean) > 0.02 && this.bones.LeftArm && this.bones.RightArm) {  // lean > 0 = leaning into a left turn (roll from the turn rate)
      const out = Math.min(0.35, Math.abs(this.lean) * 1.6), outer = this.lean > 0 ? this.bones.RightArm : this.bones.LeftArm, sgn = this.lean > 0 ? -1 : 1;
      outer.quaternion.multiply(_q.setFromAxisAngle(_zAxis, sgn * out));  // the outside arm lifts away from the body for balance
    }
```

with `const _xAxis = new THREE.Vector3(1, 0, 0), _zAxis = new THREE.Vector3(0, 0, 1);` next to the existing `_yAxis` (line ~496; `_xAxis` is also used by the finger curl above). Check the sign in a capture of a sharp cut (`__UF.testMove(90,7)` then a match capture): the arm on the outside of the turn must lift. Shirt-hem and hair springs need bones that arrive in Phases C and D and are added there.

- [ ] **Step 6: Verify**

Run: `node scripts/clipsheet.mjs --clips=jog,run,sprint,idle,shot --cam=side --strip=6 --tag=phaseA && node scripts/acceptance.mjs | tail -3`
Expected: strips in `captures/sheets/phaseA-*.png` show relaxed arms swinging from the shoulder with natural elbow bend; acceptance 29/29.

- [ ] **Step 7: Commit**

```bash
git add src/render3d/springs.js tests/springs.test.mjs src/render3d/character.js
git commit -m "Follow-through springs on head and arms for near players; per-player finger curl"
```

---

### Task 8: Phase A proof and hand-off

**Files:**
- Modify: `DEVELOPMENT_PROGRESS.md`, `GAP_PLAN.md`

- [ ] **Step 1: Final numbers**

Run: `blender -b --python tools/blender/build_player_mh.py -- --out /tmp/claude-1000/armcheck-out --armcheck all 2>&1 | grep armcheck | tail -40`
Expected: every clip in use at `elbow_err_max ≤ 5`, `hand_err_max ≤ 0.05`; `idle` `hang_tgt_max ≤ 10`.

- [ ] **Step 2: Side-by-side strip**

Run: `node scripts/clipsheet.mjs --clips=jog,run,sprint,idle --cam=front --strip=6 --tag=after && python3 scripts/stack_strips.py captures/sheets/new-jog.png captures/sheets/after-jog.png captures/sheets/A-before-after.png`
Expected: before/after image for the owner.

- [ ] **Step 3: Write up, commit, push**

Append the Phase A section (inspected, implemented, tests, results, limits) to `DEVELOPMENT_PROGRESS.md`, update the movement row in `GAP_PLAN.md`, then:

```bash
git add DEVELOPMENT_PROGRESS.md GAP_PLAN.md
git commit -m "Realer players Phase A: arms and rig done (numbers in DEVELOPMENT_PROGRESS)"
git push origin build && git checkout main && git merge --ff-only build && git push origin main && git checkout build
```

---

## Phases B–E

Each gets its own detailed plan file in the same format (`docs/superpowers/plans/2026-10-15-realer-players-<phase>.md`), written when the phase starts, because its exact code depends on what Phase A's measurements and the new rig show. The owner pre-approved this ("do the whole thing then ask once"), so those plans are written and executed without a new approval round; the side-by-side sheets are shared at the end of each phase. Task lists:

**Phase B, celebrations** (spec §4):
1. Fetch the CMU clips (79_69, 80_43, 85_01, 141_06, 83_61, 87_03, 143_36, 56_02, 49_02, 141_22, 141_28, 18_10, 104_12, 60_01, 141_12, 22_05, 22_06) via `tools/assets/fetch.sh`; build them as `celebrate_*` clips with windows found by hip-height and hand-speed tracks; drop the legacy `old` celebration poses.
2. Assembled moves in Blender with IK targets on real bodies: knee slide (UAL slide + kneel + CMU happy upper body, root slowing 6 → 0 m/s over 3–4 m), badge kiss, shush, cupped ear, point to sky, heart hands, salute.
3. `src/match/celebration.js` (pure state machine, `node --test`): `planCelebration({scorer, team, minute, score, pitchPos, keyPick, seed}) -> sequence` and `stepCelebration(seq, dt) -> per-player {target, clip, phase}`; personalities, moment rules, run-off target, teammate join order, walk-back, opponent reactions, skip.
4. `src/game.js`: replace the `cel` flag path in `anim3` with director output; camera track and cut; online sync of `{seqId, seed}` through the existing state packet (`pk.cel`, `pk.cp`).
5. Paired contact: anchor offsets per paired move in `clips.json`; hand IK onto partner bones in `character.js` (reuse `twoBone`); capsule separation.
6. Proof: `__UF.testCelebration()`, strips and clips, foot slide ≤ 2 mm, hand contact ≤ 3 cm, 8–14 s, skip, `nettest.mjs`.

**Phase C, body and kit** (spec §5):
1. `tools/assets/skin_gen.py` (numpy, tested with plain `python3`): melanin/haemoglobin albedo, detail maps; replaces the three fixed skin textures; `character.js` takes a continuous tone.
2. Builds per position/archetype in `build_player_mh.py`; muscle-definition normal map baked from each body vs its maximum-muscle target.
3. Hands: knuckle wrinkles and nails in the skin maps.
4. Kit geometry: loose shirt offset, collar variants, hem thickness, tucked/untucked.
5. Kit runtime: wrinkle maps weighted by `jointAngles`, sweat growth, per-player 256² stain map painted at slide/dive contacts, rain soak; socks over shin pads; boots detail.
6. Proof: body sheet 3 builds × 5 tones, kit sheets, budgets.

**Phase D, head and face** (spec §6):
1. Fetch ICT-FaceKit to `tools/assets/_src/ict` (git-ignored); MIT notice into `docs/CREDITS.md`.
2. `tools/blender/ict_head.py`: import, landmark fit to the MPFB neck, mid-neck cut and bridge, rig skull/neck/jaw/eyes, expression shapes, head LODs with barycentric maps.
3. `public/models/head_basis.bin` (float16 mean + 32 identity modes per LOD) and `src/render3d/headmix.js` (pure mixing, `node --test`), used by `Character` at construction.
4. Creator sliders (landmark-measured), save migration with backup, portraits.
5. Face textures from `skin_gen.py`; expression-compression wrinkles; irises; eyes, lashes, teeth.
6. `src/render3d/face.js`: expressions in play, gaze, blinks.
7. `tools/blender/hair_build.py`: the style list rebuilt for the new scalp; eyebrows and beards.
8. Proof: 40 faces (minimum distance), expressions, seam, hair, portrait side-by-side.

**Phase E, skin, hair, lighting, close-up mode** (spec §7):
1. `src/render3d/skin.js` material patch (curvature scatter, two lobes, pores, cavity, tone-aware).
2. Eye and hair shading (parallax iris, two strand highlights, alpha-to-coverage).
3. Kit shading (sheen, print shine, wet/sweat).
4. Stadium cube-map environment in `environment.js`.
5. `src/render3d/closeup.js` (detail swap, key + rim light, TAA, blur, focused shadow).
6. `quality.js` knobs and Low/High wiring; lazy close-up assets; ≤ 20 MB check.
7. Proof: fps in the owner's Chrome via the Claude-in-Chrome extension; final side-by-side sheets against eFootball references in `captures/refs/`.
