# tools/blender/armcheck.py — compare a retargeted clip with its source, frame by frame (runs inside Blender).
import json, os
import bpy
import armmath as M
import retarget as R

T = 'mixamorig:'
JOINTS = {'sh': 'Arm', 'el': 'ForeArm', 'wr': 'Hand'}

def _pos(obj, bone):
    return tuple(obj.matrix_world @ obj.pose.bones[bone].head)

def _row(obj, name_of, pairs=None):
    """name_of(target_bone_name) -> bone name on `obj` or None (identity for the target, rt.map.get for the source)."""
    lh, rh = _pos(obj, name_of(T + 'LeftUpLeg')), _pos(obj, name_of(T + 'RightUpLeg'))
    mid = tuple((a + b) / 2 for a, b in zip(lh, rh)); fr = M.body_frame(lh, rh)
    row = {'elbow': {}, 'hand': {}, 'hang': {}, 'out': {}, 'yaw': M.yaw_deg(fr), 'facing': M.facing_err(fr), 'hips': mid,
           'feet': {k: _pos(obj, name_of(T + side + 'ToeBase') or name_of(T + side + 'Foot')) for k, side in (('L', 'Left'), ('R', 'Right'))}}
    for side, s in (('Left', 'L'), ('Right', 'R')):
        p = {k: _pos(obj, name_of(T + side + v)) for k, v in JOINTS.items()}
        arm_len = M.math.dist(p['sh'], p['el']) + M.math.dist(p['el'], p['wr'])
        row['elbow'][s] = M.elbow_flex(p['sh'], p['el'], p['wr'])
        row['hang'][s] = M.hang(p['sh'], p['el'])
        row['out'][s] = M.elbow_out(p['sh'], p['el'], fr, arm_len)
        row['hand'][s] = M.hand_local(p['sh'], fr, p['wr'], arm_len)  # shoulder-relative: rigs differ in torso proportions
        pair = (pairs or {}).get(side)  # the finger-root pair the retarget aligned (index->pinky, or thumb->index on CMU)
        a_, b_ = (name_of(T + side + n) for n in pair) if pair else (None, None)
        row.setdefault('palm', {})[s] = M.palm_local(fr, _pos(obj, a_), _pos(obj, b_)) if a_ and b_ and a_ in obj.pose.bones and b_ in obj.pose.bones else None
    return row

def report(name, rt, frames, action):
    sc = bpy.context.scene
    src_names, tgt_names = dict(rt.map), {t: t for t in rt.map}
    pairs = {side: R.palm_pair(rt.src, src_names, rt.tgt, tgt_names, side) for side in ('Left', 'Right')}
    src_rows = []
    for f in frames:
        sc.frame_set(int(f), subframe=f - int(f))
        if rt.pre:
            rt.pre(f)
        src_rows.append(_row(rt.src, lambda t: rt.map.get(t), pairs))
    keep = rt.tgt.animation_data.action
    rt.tgt.animation_data.action = action
    tgt_rows = []
    for i in range(len(frames)):
        sc.frame_set(i + 1)
        tgt_rows.append(_row(rt.tgt, lambda t: t, pairs))
    rt.tgt.animation_data.action = keep
    out = M.summarise(src_rows, tgt_rows)
    out['foot_slide_mm'] = M.foot_slide(tgt_rows)  # the baked clip as the game plays it (in place)
    h0 = tgt_rows[0]['hips']; out['travel_m'] = max(M.math.dist((h0[0], h0[1]), (r['hips'][0], r['hips'][1])) for r in tgt_rows)
    # source travel speed in m/s on the target's scale (output clips run at 30 fps)
    h0, h1 = src_rows[0]['hips'], src_rows[-1]['hips']
    out['src_speed'] = M.math.dist((h0[0], h0[1], 0), (h1[0], h1[1], 0)) * rt.scale / max(1e-6, (len(frames) - 1) / 30.0)
    return out

def save(results, root):
    out = os.path.join(root, 'captures', 'armcheck.json'); os.makedirs(os.path.dirname(out), exist_ok=True)
    old = json.load(open(out)) if os.path.exists(out) else {}
    old.update(results); json.dump(old, open(out, 'w'), indent=1)
    return out
