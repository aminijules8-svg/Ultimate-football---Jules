# Celebration gestures (Phase B): a real captured body with the arms steered by IK toward targets that ride on a body bone
# (imported by build_player_mh.py; tested by test_gestures.py). Nothing is posed by hand: the base action is motion
# capture, the arm chains are solved toward points on the head or chest, and the result is baked to keyframes.
import math
import bpy
from mathutils import Matrix, Quaternion, Vector

T = 'mixamorig:'
FINGERS = ('Thumb', 'Index', 'Middle', 'Ring', 'Pinky')
# per-phalanx curl (degrees about each finger bone's local X) for the hand shapes a gesture can ask for
HANDS = {
    'point': {'Thumb': (30, 30, 20), 'Index': (0, 0, 0), 'Middle': (70, 90, 60), 'Ring': (70, 90, 60), 'Pinky': (70, 90, 60)},
    'fist': {'Thumb': (40, 40, 30), 'Index': (75, 90, 60), 'Middle': (75, 90, 60), 'Ring': (75, 90, 60), 'Pinky': (75, 90, 60)},
    'flat': {f: (4, 4, 2) for f in FINGERS},
}


def _ramp(f, fin, fout, f_end):
    """Weight of the gesture at frame f: 0 before fin[0], rises to 1 at fin[1], holds, falls to 0 over fout (if any)."""
    a, b = fin
    if f <= a:
        return 0.0
    w = min(1.0, (f - a) / max(1e-6, b - a))
    if fout:
        c, d = fout
        if f >= d:
            return 0.0
        if f > c:
            w = min(w, (d - f) / max(1e-6, d - c))
    return w


def add_gesture(arm, base, name, spec):
    """Copy `base` to a new action `name` with the arms in spec['arms'] solved toward their targets.
    spec = {'arms': [{'side': 'Left'|'Right', 'anchor': bone name without prefix, 'offset': (x, y, z) armature-space
    metres from the anchor's head at rest (or from 'ref' when given), 'hand': {'aim': fingers, 'palm': palm-normal
    directions at rest} (optional)}], 'in': (f0, f1), 'out': (f2, f3) or None, 'fingers': {'Right': 'point', …}
    or None, 'head': degrees of forward head tilt during the hold (optional)}."""
    act = base.copy(); act.name = name; arm.animation_data_create(); arm.animation_data.action = act
    f_start, f_end = (int(round(v)) for v in act.frame_range)
    scene = bpy.context.scene
    # 1. helper bones at the targets, parented to their anchors (they ride along with the captured body)
    bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT'); eb = arm.data.edit_bones; helpers = []
    for i, a in enumerate(spec['arms']):
        h = eb.new(f'_ikt{i}')  # look other bones up only after adding: eb.new can invalidate earlier EditBone references
        # offset measured from `ref` at rest, carried by `anchor`
        h.head = eb[T + a.get('ref', a['anchor'])].head + Vector(a['offset'])
        h.tail = h.head + Vector((0, 0, 0.05)); h.parent = eb[T + a['anchor']]; h.use_deform = False
        helpers.append(h.name)
    bpy.ops.object.mode_set(mode='POSE')
    # 2. IK on each forearm (chain: forearm + upper arm) toward its helper, influence ramped in and out
    chains = []
    for a, hname in zip(spec['arms'], helpers):
        fa = arm.pose.bones[T + a['side'] + 'ForeArm']
        ik = fa.constraints.new('IK'); ik.target = arm; ik.subtarget = hname; ik.chain_count = 2; ik.use_tail = True
        a_in, a_out = a.get('in', spec['in']), a.get('out', spec.get('out'))  # an arm may have its own timing (badge kiss: mouth, then badge)
        for f in range(f_start, f_end + 1):
            ik.influence = _ramp(f, a_in, a_out, f_end); ik.keyframe_insert('influence', frame=f)
        chains += [T + a['side'] + 'Arm', T + a['side'] + 'ForeArm']
    # 3. bake the solved arms into the action (visual keying), dropping the constraints
    for b in arm.data.bones:
        b.select = b.name in chains
    arm.data.bones.active = arm.data.bones[chains[0]]
    bpy.ops.nla.bake(frame_start=f_start, frame_end=f_end, only_selected=True, visual_keying=True, clear_constraints=True,
                     use_current_action=True, bake_types={'POSE'})
    for b in arm.data.bones:
        b.select = False
    # constraint influence curves belong to the removed constraints
    for fc in [fc for fc in act.fcurves if 'constraints[' in fc.data_path]:
        act.fcurves.remove(fc)
    # how close each wrist got to its target while fully on (the build logs it; > 2 cm means the target is out of reach)
    errs = []
    for a, hname in zip(spec['arms'], helpers):
        a_in, a_out = a.get('in', spec['in']), a.get('out', spec.get('out'))
        hold = [f for f in range(f_start, f_end + 1) if _ramp(f, a_in, a_out, f_end) >= 1.0]
        worst = 0.0
        for f in hold[::3]:
            scene.frame_set(f)
            w = arm.matrix_world @ arm.pose.bones[T + a['side'] + 'Hand'].head
            t = arm.matrix_world @ arm.pose.bones[hname].head
            worst = max(worst, (w - t).length)
        errs.append(round(worst * 1000, 1))
    act['hold_err_mm'] = errs  # (an ID property: assigned once, as a whole)
    # 4. remove the helper bones
    bpy.ops.object.mode_set(mode='EDIT')
    for hname in helpers:
        arm.data.edit_bones.remove(arm.data.edit_bones[hname])
    bpy.ops.object.mode_set(mode='OBJECT')
    # 5. hand orientation (palm and finger direction ride on the anchor bone), then hand shapes and head tilt
    for a in spec['arms']:
        if a.get('hand'):
            _orient_hand(act, arm, a, a.get('in', spec['in']), a.get('out', spec.get('out')), f_start, f_end)
    for side, shape in (spec.get('fingers') or {}).items():
        for fname, curls in HANDS[shape].items():
            for k, deg in enumerate(curls, 1):
                _blend_rot(act, arm, f'{T}{side}Hand{fname}{k}', Quaternion((1, 0, 0), math.radians(deg)), spec, f_start, f_end, replace=True)
    if spec.get('head'):
        _blend_rot(act, arm, T + 'Head', Quaternion((1, 0, 0), math.radians(spec['head'])), spec, f_start, f_end, replace=False)
    return act


def _palm_local(arm, side):
    """The palm normal of a hand in its bone's local space, from the rest positions of the index and little finger roots
    (cross(fingers, index - little) faces out of the left palm; the right hand is the mirror image)."""
    b = arm.data.bones[T + side + 'Hand']
    fy = (b.tail_local - b.head_local).normalized()
    across = arm.data.bones[T + side + 'HandIndex1'].head_local - arm.data.bones[T + side + 'HandPinky1'].head_local
    n = fy.cross(across) * (1 if side == 'Left' else -1)
    loc = b.matrix_local.to_3x3().inverted() @ n
    loc.y = 0.0  # orthogonal to the bone axis
    return loc.normalized()


def _orient_hand(act, arm, a, a_in, a_out, f_start, f_end):
    """Turn the hand so the fingers point along a['hand']['aim'] and the palm faces a['hand']['palm'] (armature-space
    directions at rest, carried by the anchor bone's rotation), blended in by the arm's ramp."""
    side, bone = a['side'], T + a['side'] + 'Hand'
    pb = arm.pose.bones[bone]; anchor = arm.pose.bones[T + a['anchor']]
    pa = _palm_local(arm, side); ey = Vector((0, 1, 0))
    L = Matrix((ey, pa, ey.cross(pa))).transposed()  # local frame: columns fingers, palm, third
    rest_rel = (pb.parent.bone.matrix_local.inverted() @ pb.bone.matrix_local).to_3x3()
    aim0, palm0 = Vector(a['hand']['aim']).normalized(), Vector(a['hand']['palm']).normalized()
    path = f'pose.bones["{bone}"].rotation_quaternion'
    pb.rotation_mode = 'QUATERNION'
    fcs = [act.fcurves.find(path, index=c) for c in range(4)]
    if any(fc is None for fc in fcs):  # an unkeyed hand: key its current rotation on every frame first
        fcs = [act.fcurves.find(path, index=c) or act.fcurves.new(path, index=c, action_group=bone) for c in range(4)]
        q0 = pb.rotation_quaternion.copy()
        for c, fc in enumerate(fcs):
            if not fc.keyframe_points:
                for f in range(f_start, f_end + 1):
                    fc.keyframe_points.insert(f, q0[c])
    scene = bpy.context.scene; new = {}
    for f in range(f_start, f_end + 1):
        w = _ramp(f, a_in, a_out, f_end)
        if w <= 0:
            continue
        scene.frame_set(f)
        R = anchor.matrix.to_3x3() @ anchor.bone.matrix_local.to_3x3().inverted()  # anchor: rest -> posed
        y = (R @ aim0).normalized(); n = R @ palm0; n = (n - n.dot(y) * y).normalized()
        M = Matrix((y, n, y.cross(n))).transposed() @ L.inverted()  # desired hand rotation, armature space
        basis = ((pb.parent.matrix.to_3x3() @ rest_rel).inverted() @ M).to_quaternion()
        cur = Quaternion([fc.evaluate(f) for fc in fcs])
        if cur.dot(basis) < 0:
            basis.negate()
        new[f] = cur.slerp(basis, w)
    for f, q in new.items():
        for c, fc in enumerate(fcs):
            fc.keyframe_points.insert(f, q[c], options={'REPLACE', 'FAST'})
    for fc in fcs:
        fc.update()


def _blend_rot(act, arm, bone, q, spec, f_start, f_end, replace):
    """Blend `q` into a bone's quaternion keys by the gesture ramp: replace=True slerps toward q, else multiplies q on."""
    if bone not in arm.pose.bones:
        return
    path = f'pose.bones["{bone}"].rotation_quaternion'
    fcs = [act.fcurves.find(path, index=c) for c in range(4)]
    if any(fc is None for fc in fcs):
        fcs = [act.fcurves.find(path, index=c) or act.fcurves.new(path, index=c, action_group=bone) for c in range(4)]
        for c, fc in enumerate(fcs):
            if not fc.keyframe_points:
                for f in range(f_start, f_end + 1):
                    fc.keyframe_points.insert(f, (1, 0, 0, 0)[c])
    frames = sorted({int(round(k.co[0])) for k in fcs[0].keyframe_points})
    for f in frames:
        w = _ramp(f, spec['in'], spec.get('out'), f_end)
        if w <= 0:
            continue
        cur = Quaternion([fc.evaluate(f) for fc in fcs])
        new = cur.slerp(q, w) if replace else cur @ Quaternion().slerp(q, w)
        for c, fc in enumerate(fcs):
            for kp in fc.keyframe_points:
                if int(round(kp.co[0])) == f:
                    kp.co[1] = new[c]; kp.handle_left[1] = new[c]; kp.handle_right[1] = new[c]
    for fc in fcs:
        fc.update()


# Gesture table: offsets are armature-space metres from the Head bone's head at rest (face targets ride on the Head, chest
# targets on Spine2 — the captured idle turns its head, which would swing a head-carried chest target sideways) (the character faces -Y, its left
# is +X, +Z up); frames are the baked clip's (30 fps). Base: the calm CMU idle, or the CMU 23_03 kneel for the knee slide.
GESTURES = {
    'celebrate_point_sky': {'arms': [{'side': 'Left', 'anchor': 'Head', 'offset': (0.18, -0.05, 0.36), 'hand': {'aim': (0, -0.15, 1), 'palm': (0, -1, 0)}},
                                     {'side': 'Right', 'anchor': 'Head', 'offset': (-0.18, -0.05, 0.36), 'hand': {'aim': (0, -0.15, 1), 'palm': (0, -1, 0)}}],
                            'in': (4, 14), 'out': None, 'fingers': {'Left': 'point', 'Right': 'point'}, 'head': -15},
    # index finger up across the lips, palm toward the face
    'celebrate_shush': {'arms': [{'side': 'Right', 'anchor': 'Head', 'offset': (-0.01, -0.14, 0.02), 'hand': {'aim': (0, 0.1, 1), 'palm': (0.6, 0.8, 0)}}],
                        'in': (4, 13), 'out': None, 'fingers': {'Right': 'point'}},
    # hand cupped behind the ear, palm forward, toward the crowd
    'celebrate_ear': {'arms': [{'side': 'Right', 'anchor': 'Head', 'offset': (-0.15, -0.02, 0.07), 'hand': {'aim': (-0.1, 0.15, 1), 'palm': (0.2, -1, 0)}}],
                      'in': (4, 13), 'out': None, 'fingers': {'Right': 'flat'}},
    # both palms flat on the chest, fingers up and inward
    'celebrate_heart': {'arms': [{'side': 'Left', 'anchor': 'Spine2', 'ref': 'Head', 'offset': (0.035, -0.20, -0.30), 'hand': {'aim': (-0.45, 0, 0.9), 'palm': (0, 1, 0)}},
                                 {'side': 'Right', 'anchor': 'Spine2', 'ref': 'Head', 'offset': (-0.035, -0.20, -0.30), 'hand': {'aim': (0.45, 0, 0.9), 'palm': (0, 1, 0)}}],
                        'in': (4, 14), 'out': None, 'fingers': {'Left': 'flat', 'Right': 'flat'}},
    # flat hand, fingertips at the right brow, palm down and out, forearm up at an angle
    'celebrate_salute': {'arms': [{'side': 'Right', 'anchor': 'Head', 'offset': (-0.15, -0.11, 0.09), 'hand': {'aim': (0.9, 0.25, 0.38), 'palm': (0, -0.6, -0.8)}}],
                         'in': (4, 12), 'out': None, 'fingers': {'Right': 'flat'}},
    # fingers to the lips, then the palm onto the badge on the left chest
    'celebrate_badge_kiss': {'arms': [{'side': 'Right', 'anchor': 'Head', 'offset': (-0.01, -0.13, 0.02), 'in': (4, 12), 'out': (26, 34), 'hand': {'aim': (0, 0.3, 0.95), 'palm': (0, 1, 0)}},
                                      {'side': 'Right', 'anchor': 'Spine2', 'ref': 'Head', 'offset': (0.09, -0.17, -0.30), 'in': (26, 34), 'out': None, 'hand': {'aim': (0.6, 0, 0.8), 'palm': (0, 1, 0)}}],
                             'in': (4, 12), 'out': None, 'fingers': {'Right': 'flat'}, 'head': 18},
    # in play: the right hand up and forward, calling for the ball (the game plays its first 0.6 s as an additive layer)
    'call_ball': {'arms': [{'side': 'Right', 'anchor': 'Spine2', 'ref': 'Head', 'offset': (-0.22, -0.30, 0.26), 'hand': {'aim': (0, -0.3, 0.95), 'palm': (0, -1, 0.2)}}],
                  'in': (2, 9), 'out': None, 'fingers': {'Right': 'point'}},
    'celebrate_knee_slide': {'base': 'kneel', 'arms': [{'side': 'Left', 'anchor': 'Head', 'offset': (0.30, -0.06, 0.36)},
                                                       {'side': 'Right', 'anchor': 'Head', 'offset': (-0.30, -0.06, 0.36)}],
                             'in': (4, 16), 'out': None, 'fingers': {'Left': 'fist', 'Right': 'fist'}, 'head': -10},  # arms go up during the slide
}
